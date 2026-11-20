import type {
  EmployeeProfile,
  ModuleKey,
  PermissionAction,
  RoleId,
} from '../types/os';

export const ROLE_LABELS: Record<RoleId, { ar: string; en: string }> = {
  ceo: { ar: 'الرئيس التنفيذي / المؤسس', en: 'CEO / Founder' },
  general_manager: { ar: 'المدير العام', en: 'General Manager' },
  branch_manager: { ar: 'مدير فرع', en: 'Branch Manager' },
  department_manager: { ar: 'مدير إدارة', en: 'Department Manager' },
  team_leader: { ar: 'قائد فريق', en: 'Team Leader' },
  project_manager: { ar: 'مدير مشاريع', en: 'Project Manager' },
  accountant: { ar: 'محاسب', en: 'Accountant' },
  hr_manager: { ar: 'مدير الموارد البشرية', en: 'HR Manager' },
  sales_rep: { ar: 'مسؤول مبيعات', en: 'Sales Representative' },
  photographer: { ar: 'مصور / إنتاج ميديا', en: 'Photographer' },
  video_editor: { ar: 'مونتير فيديو', en: 'Video Editor' },
  graphic_designer: { ar: 'مصمم جرافيك', en: 'Graphic Designer' },
  marketing_specialist: { ar: 'أخصائي تسويق', en: 'Marketing Specialist' },
  developer: { ar: 'مطور برمجيات', en: 'Developer' },
  customer_support: { ar: 'خدمة عملاء', en: 'Customer Support' },
  freelancer: { ar: 'متعاون خارجي', en: 'Freelancer' },
  employee: { ar: 'موظف', en: 'Employee' },
};

const ALL_MODULES: ModuleKey[] = [
  'dashboard',
  'workspace',
  'company',
  'crm',
  'clients',
  'proposals',
  'projects',
  'tasks',
  'calendar',
  'production',
  'studio3d',
  'editing',
  'design',
  'marketing',
  'development',
  'finance',
  'procurement',
  'assets',
  'hr',
  'support',
  'files',
  'knowledge',
  'reports',
  'ai',
  'automation',
  'settings',
];

const FULL_ACCESS: PermissionAction[] = [
  'view',
  'create',
  'edit',
  'delete',
  'approve',
  'reject',
  'assign',
  'export',
  'manage',
];

export const DEFAULT_ROLE_MATRIX: Record<RoleId, Partial<Record<ModuleKey, PermissionAction[]>>> = {
  ceo: Object.fromEntries(ALL_MODULES.map((m) => [m, FULL_ACCESS])),
  general_manager: Object.fromEntries(ALL_MODULES.map((m) => [m, FULL_ACCESS])),
  branch_manager: {
    dashboard: ['view', 'export'],
    workspace: ['view', 'create', 'edit', 'approve', 'reject'],
    company: ['view'],
    crm: ['view', 'create', 'edit', 'assign'],
    clients: ['view', 'create', 'edit'],
    proposals: ['view', 'approve', 'reject'],
    projects: ['view', 'create', 'edit', 'assign'],
    tasks: ['view', 'create', 'edit', 'assign'],
    calendar: ['view', 'create', 'edit'],
    production: ['view', 'create', 'edit', 'approve'],
    studio3d: ['view'],
    editing: ['view', 'assign'],
    design: ['view', 'assign'],
    marketing: ['view'],
    development: ['view'],
    finance: ['view', 'approve', 'reject'],
    procurement: ['view', 'create', 'approve', 'reject'],
    assets: ['view', 'create', 'edit'],
    hr: ['view', 'approve', 'reject'],
    support: ['view', 'assign'],
    files: ['view', 'create'],
    knowledge: ['view', 'create'],
    reports: ['view', 'export'],
    ai: ['view', 'create'],
    automation: ['view'],
    settings: ['view'],
  },
  department_manager: {
    dashboard: ['view'],
    workspace: ['view', 'create', 'edit', 'approve', 'reject'],
    projects: ['view', 'create', 'edit', 'assign'],
    tasks: ['view', 'create', 'edit', 'assign', 'approve'],
    calendar: ['view', 'create'],
    production: ['view', 'create', 'edit'],
    studio3d: ['view'],
    editing: ['view', 'create', 'edit', 'approve'],
    design: ['view', 'create', 'edit', 'approve'],
    marketing: ['view', 'create', 'edit', 'approve'],
    development: ['view', 'create', 'edit', 'approve'],
    assets: ['view', 'create'],
    files: ['view', 'create'],
    knowledge: ['view', 'create', 'edit'],
    reports: ['view'],
    ai: ['view', 'create'],
  },
  team_leader: {
    dashboard: ['view'],
    workspace: ['view', 'create', 'edit'],
    projects: ['view', 'edit'],
    tasks: ['view', 'create', 'edit', 'assign'],
    calendar: ['view', 'create'],
    production: ['view', 'edit'],
    studio3d: ['view'],
    editing: ['view', 'edit'],
    design: ['view', 'edit'],
    files: ['view', 'create'],
    knowledge: ['view'],
    ai: ['view'],
  },
  project_manager: {
    dashboard: ['view'],
    workspace: ['view', 'create', 'edit'],
    clients: ['view'],
    projects: ['view', 'create', 'edit', 'assign', 'manage'],
    tasks: ['view', 'create', 'edit', 'assign', 'approve'],
    calendar: ['view', 'create', 'edit'],
    production: ['view', 'create', 'edit'],
    studio3d: ['view'],
    editing: ['view', 'create', 'edit'],
    design: ['view', 'create', 'edit'],
    marketing: ['view', 'create', 'edit'],
    development: ['view', 'create', 'edit'],
    assets: ['view'],
    support: ['view', 'edit'],
    files: ['view', 'create'],
    knowledge: ['view'],
    reports: ['view', 'export'],
    ai: ['view', 'create'],
  },
  accountant: {
    dashboard: ['view'],
    workspace: ['view', 'create', 'edit', 'approve'],
    clients: ['view'],
    proposals: ['view'],
    projects: ['view'],
    finance: ['view', 'create', 'edit', 'approve', 'reject', 'export', 'manage'],
    procurement: ['view', 'approve', 'reject'],
    assets: ['view', 'create', 'edit'],
    hr: ['view'], // Payroll input view only; personal HR masked separately
    files: ['view', 'create'],
    knowledge: ['view'],
    reports: ['view', 'export'],
    ai: ['view', 'create'],
  },
  hr_manager: {
    dashboard: ['view'],
    workspace: ['view', 'create', 'edit', 'approve', 'reject'],
    company: ['view', 'edit'],
    hr: FULL_ACCESS,
    calendar: ['view', 'create'],
    files: ['view', 'create'],
    knowledge: ['view', 'create', 'edit'],
    reports: ['view', 'export'],
    ai: ['view', 'create'],
  },
  sales_rep: {
    dashboard: ['view'],
    workspace: ['view', 'create', 'edit'],
    crm: ['view', 'create', 'edit'],
    clients: ['view', 'create', 'edit'],
    proposals: ['view', 'create', 'edit'],
    calendar: ['view', 'create'],
    files: ['view', 'create'],
    knowledge: ['view'],
    reports: ['view'],
    ai: ['view', 'create'],
  },
  photographer: {
    dashboard: ['view'],
    workspace: ['view', 'create', 'edit'],
    projects: ['view'],
    tasks: ['view', 'edit'],
    calendar: ['view'],
    production: ['view', 'create', 'edit'],
    studio3d: ['view'],
    assets: ['view'],
    files: ['view', 'create'],
    knowledge: ['view'],
  },
  video_editor: {
    dashboard: ['view'],
    workspace: ['view', 'create', 'edit'],
    projects: ['view'],
    tasks: ['view', 'edit'],
    calendar: ['view'],
    editing: ['view', 'create', 'edit'],
    studio3d: ['view'],
    files: ['view', 'create'],
    knowledge: ['view'],
  },
  graphic_designer: {
    dashboard: ['view'],
    workspace: ['view', 'create', 'edit'],
    projects: ['view'],
    tasks: ['view', 'edit'],
    calendar: ['view'],
    design: ['view', 'create', 'edit'],
    studio3d: ['view'],
    files: ['view', 'create'],
    knowledge: ['view'],
  },
  marketing_specialist: {
    dashboard: ['view'],
    workspace: ['view', 'create', 'edit'],
    clients: ['view'],
    projects: ['view'],
    tasks: ['view', 'edit'],
    calendar: ['view', 'create'],
    marketing: ['view', 'create', 'edit'],
    studio3d: ['view'],
    files: ['view', 'create'],
    knowledge: ['view'],
    ai: ['view', 'create'],
  },
  developer: {
    dashboard: ['view'],
    workspace: ['view', 'create', 'edit'],
    projects: ['view'],
    tasks: ['view', 'create', 'edit'],
    calendar: ['view'],
    development: ['view', 'create', 'edit'],
    studio3d: ['view'],
    files: ['view', 'create'],
    knowledge: ['view', 'create'],
  },
  customer_support: {
    dashboard: ['view'],
    workspace: ['view', 'create', 'edit'],
    clients: ['view'],
    projects: ['view'],
    support: ['view', 'create', 'edit', 'assign'],
    knowledge: ['view', 'create'],
    ai: ['view', 'create'],
  },
  freelancer: {
    workspace: ['view', 'edit'],
    projects: ['view'],
    tasks: ['view', 'edit'],
    editing: ['view', 'edit'],
    design: ['view', 'edit'],
    files: ['view'],
  },
  employee: {
    workspace: ['view', 'create', 'edit'],
    tasks: ['view', 'edit'],
    calendar: ['view'],
    knowledge: ['view'],
  },
};

export function hasPermission(
  user: EmployeeProfile | null | undefined,
  module: ModuleKey,
  action: PermissionAction
): boolean {
  if (!user || user.status !== 'active') return false;
  if (user.role === 'ceo' || user.role === 'general_manager') return true;
  const rolePermissions = DEFAULT_ROLE_MATRIX[user.role];
  const allowed = rolePermissions?.[module];
  if (!allowed) return false;
  return allowed.includes(action);
}

export function canApproveOperation(
  requesterUid: string,
  approver: EmployeeProfile | null | undefined,
  module: ModuleKey
): { allowed: boolean; reason?: string } {
  if (!approver || approver.status !== 'active') {
    return { allowed: false, reason: 'Approver account is not active.' };
  }
  if (!hasPermission(approver, module, 'approve')) {
    return { allowed: false, reason: 'User lacks approval permission for this module.' };
  }
  if (requesterUid === approver.uid) {
    return {
      allowed: false,
      reason: 'Separation of duties violation: requester cannot approve their own request.',
    };
  }
  return { allowed: true };
}

export function canViewConfidentialPayroll(user: EmployeeProfile | null | undefined): boolean {
  if (!user || user.status !== 'active') return false;
  return ['ceo', 'general_manager', 'hr_manager', 'accountant'].includes(user.role);
}

export function maskEmployeePII(
  target: EmployeeProfile,
  viewer: EmployeeProfile | null | undefined
): EmployeeProfile {
  if (!viewer) {
    return {
      ...target,
      monthlySalaryPiasters: undefined,
      nationalId: undefined,
      emergencyContact: undefined,
    };
  }
  const isSelf = viewer.uid === target.uid;
  const isHrOrExec = ['ceo', 'general_manager', 'hr_manager'].includes(viewer.role);
  const isAccountant = viewer.role === 'accountant';
  const sameBranch = target.branchIds.some((b) => viewer.branchIds.includes(b));
  const isBranchMgr = viewer.role === 'branch_manager' && sameBranch;

  return {
    ...target,
    monthlySalaryPiasters:
      isSelf || isHrOrExec || isAccountant ? target.monthlySalaryPiasters : undefined,
    nationalId: isSelf || isHrOrExec ? target.nationalId : undefined,
    emergencyContact: isSelf || isHrOrExec || isBranchMgr ? target.emergencyContact : undefined,
  };
}

export function isRecordVisibleToUser<
  T extends { branchId?: string; assigneeUid?: string; managerUid?: string; memberUids?: string[] }
>(
  record: T,
  user: EmployeeProfile | null | undefined,
  activeBranchFilter: string
): boolean {
  if (!user || user.status !== 'active') return false;

  if (activeBranchFilter !== 'all' && record.branchId && record.branchId !== activeBranchFilter) {
    return false;
  }

  if (user.role === 'ceo' || user.role === 'general_manager') {
    return true;
  }

  if (user.role === 'branch_manager' && record.branchId) {
    return user.branchIds.includes(record.branchId);
  }

  if (user.role === 'freelancer') {
    return (
      record.assigneeUid === user.uid ||
      record.managerUid === user.uid ||
      (Array.isArray(record.memberUids) && record.memberUids.includes(user.uid))
    );
  }

  return true;
}
