import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkEquipmentConflict,
  checkLeadDuplicate,
  evaluateWorkflowRules,
  validateProjectCompletion,
  validateTaskAssignment,
} from './workflows';
import { canApproveOperation, maskEmployeePII } from './rbac';
import type {
  EmployeeProfile,
  EquipmentReservation,
  Lead,
  Project,
  WorkflowLog,
  WorkflowRule,
} from '../types/os';

const meta = {
  ownerUid: 'u1',
  memberUids: ['u1'],
  createdAt: '2026-11-01T00:00:00Z',
  updatedAt: '2026-11-01T00:00:00Z',
};

test('checkLeadDuplicate detects normalized Egyptian phone and email collisions', () => {
  const leads: Lead[] = [
    {
      ...meta,
      id: 'l1',
      businessName: 'Al Noor Cafe',
      contactName: 'Ahmed',
      phone: '+20 100 555 1234',
      email: 'ahmed@alnoor.eg',
      industry: 'F&B',
      location: 'Cairo',
      source: 'instagram',
      stage: 'new_lead',
      priority: 'high',
      interestedServices: ['social'],
      estimatedBudgetPiasters: 100000,
      assignedUid: 'u1',
      branchId: 'b1',
    },
  ];

  const dupPhone = checkLeadDuplicate({ businessName: 'Other', phone: '0100-555-1234' }, leads);
  assert.equal(dupPhone.duplicate, true);

  const unique = checkLeadDuplicate({ businessName: 'New Co', phone: '01112223334', email: 'hi@new.eg' }, leads);
  assert.equal(unique.duplicate, false);
});

test('checkEquipmentConflict blocks overlapping bookings and allows non-overlapping', () => {
  const existing: EquipmentReservation[] = [
    {
      ...meta,
      id: 'r1',
      assetId: 'cam-fx6',
      assetName: 'Sony FX6',
      projectId: 'p1',
      reservedByUid: 'u1',
      branchId: 'b1',
      startIso: '2026-11-22T09:00:00Z',
      endIso: '2026-11-22T15:00:00Z',
      status: 'reserved',
    },
  ];

  const overlap = checkEquipmentConflict(
    { assetId: 'cam-fx6', startIso: '2026-11-22T14:00:00Z', endIso: '2026-11-22T18:00:00Z' },
    existing
  );
  assert.equal(overlap.conflict, true);

  const clear = checkEquipmentConflict(
    { assetId: 'cam-fx6', startIso: '2026-11-22T15:00:00Z', endIso: '2026-11-22T19:00:00Z' },
    existing
  );
  assert.equal(clear.conflict, false);
});

test('validateProjectCompletion blocks closing when mandatory deliverables are unapproved', () => {
  const project: Project = {
    ...meta,
    id: 'p1',
    name: 'Brand Shoot',
    clientId: 'c1',
    branchId: 'b1',
    departmentId: 'd1',
    managerUid: 'u1',
    status: 'active',
    priority: 'high',
    startDate: '2026-11-01',
    dueDate: '2026-11-30',
    approvedRevenuePiasters: 100000,
    estimatedCostPiasters: 40000,
    actualCostPiasters: 30000,
    progress: 80,
    deliverables: [
      { id: 'd1', title: 'Master Video 4K', mandatory: true, approved: false },
    ],
  };
  const check = validateProjectCompletion(project);
  assert.equal(check.canComplete, false);
  assert.deepEqual(check.incompleteMandatory, ['Master Video 4K']);
});

test('RBAC Separation of Duties prevents self-approval and masks sensitive PII', () => {
  const editor: EmployeeProfile = {
    uid: 'u-ed',
    email: 'ed@balance.eg',
    fullName: 'Omar Editor',
    role: 'video_editor',
    branchIds: ['b1'],
    departmentIds: ['dept-edit'],
    position: 'Senior Editor',
    workModel: 'hybrid',
    employmentType: 'full_time',
    status: 'active',
    monthlySalaryPiasters: 1800000,
    nationalId: '29501011234567',
    ownerUid: 'u-ceo',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const manager: EmployeeProfile = {
    ...editor,
    uid: 'u-mgr',
    email: 'mgr@balance.eg',
    fullName: 'Karim Manager',
    role: 'branch_manager',
  };

  const selfApprove = canApproveOperation('u-mgr', manager, 'finance');
  assert.equal(selfApprove.allowed, false);

  const otherApprove = canApproveOperation('u-ed', manager, 'finance');
  assert.equal(otherApprove.allowed, true);

  const maskedForManager = maskEmployeePII(editor, manager);
  assert.equal(maskedForManager.monthlySalaryPiasters, undefined);
  assert.equal(maskedForManager.nationalId, undefined);

  const inactiveCheck = validateTaskAssignment({ ...editor, status: 'inactive' });
  assert.equal(inactiveCheck.valid, false);
});

test('evaluateWorkflowRules enforces idempotency per trigger and entity', () => {
  const rules: WorkflowRule[] = [
    {
      ...meta,
      id: 'wf-1',
      name: 'Contract Approved -> Create Project',
      description: 'Auto project creation',
      trigger: 'approval_granted',
      conditionSummary: 'contract',
      action: 'create_project',
      enabled: true,
      runCount: 1,
    },
  ];

  const logs: WorkflowLog[] = [
    {
      ...meta,
      id: 'log-1',
      workflowId: 'wf-1',
      workflowName: 'Contract Approved -> Create Project',
      idempotencyKey: 'wf-1:approval_granted:cnt-99',
      triggerEntityId: 'cnt-99',
      result: 'success',
      message: 'Executed',
    },
  ];

  const evalDuplicate = evaluateWorkflowRules('approval_granted', 'cnt-99', rules, logs);
  assert.equal(evalDuplicate[0].shouldExecute, false);

  const evalFresh = evaluateWorkflowRules('approval_granted', 'cnt-100', rules, logs);
  assert.equal(evalFresh[0].shouldExecute, true);
});
