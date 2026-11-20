import type {
  EmployeeProfile,
  EquipmentReservation,
  Lead,
  Project,
  ProjectDeliverable,
  WorkflowLog,
  WorkflowRule,
  WorkflowTriggerType,
} from '../types/os';

export function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-()]/g, '').replace(/^\+?2/, '');
}

export function checkLeadDuplicate(
  candidate: { businessName: string; phone: string; email?: string },
  existingLeads: Lead[]
): { duplicate: boolean; matchedLead?: Lead; reason?: string } {
  const normPhone = normalizePhone(candidate.phone);
  const normEmail = candidate.email?.trim().toLowerCase();
  const normBusiness = candidate.businessName.trim().toLowerCase();

  for (const lead of existingLeads) {
    if (normPhone && normalizePhone(lead.phone) === normPhone) {
      return { duplicate: true, matchedLead: lead, reason: 'Duplicate phone number' };
    }
    if (normEmail && lead.email && lead.email.trim().toLowerCase() === normEmail) {
      return { duplicate: true, matchedLead: lead, reason: 'Duplicate email address' };
    }
    if (normBusiness && lead.businessName.trim().toLowerCase() === normBusiness) {
      return { duplicate: true, matchedLead: lead, reason: 'Duplicate business name' };
    }
  }
  return { duplicate: false };
}

export function checkEquipmentConflict(
  candidate: { assetId: string; startIso: string; endIso: string; id?: string },
  existingReservations: EquipmentReservation[]
): { conflict: boolean; conflictingReservation?: EquipmentReservation } {
  const start = new Date(candidate.startIso).getTime();
  const end = new Date(candidate.endIso).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    throw new Error('End time must be strictly after start time.');
  }

  for (const res of existingReservations) {
    if (res.id === candidate.id) continue;
    if (res.status === 'cancelled' || res.status === 'returned') continue;
    if (res.assetId !== candidate.assetId) continue;

    const rStart = new Date(res.startIso).getTime();
    const rEnd = new Date(res.endIso).getTime();
    if (start < rEnd && end > rStart) {
      return { conflict: true, conflictingReservation: res };
    }
  }

  return { conflict: false };
}

export function validateTaskAssignment(assignee?: EmployeeProfile): {
  valid: boolean;
  reason?: string;
} {
  if (!assignee) {
    return { valid: false, reason: 'Assignee does not exist.' };
  }
  if (assignee.status !== 'active') {
    return { valid: false, reason: 'Cannot assign task to an inactive or unaccepted employee.' };
  }
  return { valid: true };
}

export function validateProjectCompletion(
  project: Project,
  deliverables: ProjectDeliverable[] = project.deliverables
): { canComplete: boolean; incompleteMandatory: string[] } {
  const incompleteMandatory = deliverables
    .filter((d) => d.mandatory && !d.approved)
    .map((d) => d.title);
  return {
    canComplete: incompleteMandatory.length === 0,
    incompleteMandatory,
  };
}

export function evaluateWorkflowRules(
  trigger: WorkflowTriggerType,
  entityId: string,
  rules: WorkflowRule[],
  existingLogs: WorkflowLog[]
): Array<{
  rule: WorkflowRule;
  idempotencyKey: string;
  shouldExecute: boolean;
  reason: string;
}> {
  const matching = rules.filter((r) => r.enabled && r.trigger === trigger);
  return matching.map((rule) => {
    const idempotencyKey = `${rule.id}:${trigger}:${entityId}`;
    const alreadyRan = existingLogs.some(
      (log) => log.idempotencyKey === idempotencyKey && log.result === 'success'
    );
    return {
      rule,
      idempotencyKey,
      shouldExecute: !alreadyRan,
      reason: alreadyRan ? 'Skipped: idempotency key already executed' : 'Ready to execute',
    };
  });
}
