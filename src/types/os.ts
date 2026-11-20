export type Language = 'ar' | 'en';
export type ThemeMode = 'light' | 'dark';

export type RoleId =
  | 'ceo'
  | 'general_manager'
  | 'branch_manager'
  | 'department_manager'
  | 'team_leader'
  | 'project_manager'
  | 'accountant'
  | 'hr_manager'
  | 'sales_rep'
  | 'photographer'
  | 'video_editor'
  | 'graphic_designer'
  | 'marketing_specialist'
  | 'developer'
  | 'customer_support'
  | 'freelancer'
  | 'employee';

export type ModuleKey =
  | 'dashboard'
  | 'workspace'
  | 'company'
  | 'crm'
  | 'clients'
  | 'proposals'
  | 'projects'
  | 'tasks'
  | 'calendar'
  | 'production'
  | 'studio3d'
  | 'editing'
  | 'design'
  | 'marketing'
  | 'development'
  | 'finance'
  | 'procurement'
  | 'assets'
  | 'hr'
  | 'support'
  | 'files'
  | 'knowledge'
  | 'reports'
  | 'ai'
  | 'automation'
  | 'settings';

export type PermissionAction =
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'approve'
  | 'reject'
  | 'assign'
  | 'export'
  | 'manage';

export interface BaseEntity {
  id: string;
  ownerUid: string;
  memberUids: string[];
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Company extends BaseEntity {
  name: string;
  legalName: string;
  taxId: string;
  address: string;
  phone: string;
  email: string;
  currency: 'EGP' | 'USD' | 'SAR';
  timezone: string;
  fiscalYearStart: string;
}

export interface Branch extends BaseEntity {
  code: string;
  name: string;
  nameEn: string;
  address: string;
  phone: string;
  email: string;
  managerUid: string;
  status: 'active' | 'inactive';
  operationalBudgetPiasters: number;
}

export interface Department extends BaseEntity {
  code: string;
  name: string;
  nameEn: string;
  managerUid: string;
  budgetPiasters: number;
}

export interface Team extends BaseEntity {
  name: string;
  nameEn: string;
  departmentId: string;
  branchId: string;
  leaderUid: string;
  memberIds: string[];
}

export interface EmployeeProfile {
  uid: string;
  email: string;
  fullName: string;
  fullNameEn?: string;
  role: RoleId;
  branchIds: string[];
  departmentIds: string[];
  teamIds?: string[];
  position: string;
  workModel: 'office' | 'remote' | 'hybrid';
  employmentType: 'full_time' | 'part_time' | 'freelancer';
  status: 'active' | 'inactive' | 'invited';
  phone?: string;
  joiningDate?: string;
  skills?: string[];
  // Restricted HR fields (masked unless authorized)
  monthlySalaryPiasters?: number;
  nationalId?: string;
  emergencyContact?: string;
  performanceScore?: number;
  isDemo?: boolean;
  ownerUid: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomRole extends BaseEntity {
  roleKey: string;
  name: string;
  nameEn: string;
  description: string;
  permissions: Partial<Record<ModuleKey, PermissionAction[]>>;
  branchScoped?: boolean;
  assignedOnly?: boolean;
}

export interface Invitation extends BaseEntity {
  email: string;
  fullName: string;
  role: RoleId;
  branchIds: string[];
  departmentIds: string[];
  status: 'pending' | 'accepted' | 'revoked';
  invitedByUid: string;
}

export interface Client extends BaseEntity {
  name: string;
  industry: string;
  phone: string;
  email: string;
  location: string;
  branchId: string;
  accountManagerUid: string;
  brandNotes?: string;
  status: 'active' | 'paused' | 'archived';
}

export type LeadStage =
  | 'new_lead'
  | 'qualified'
  | 'contacted'
  | 'meeting_scheduled'
  | 'meeting_completed'
  | 'proposal_sent'
  | 'negotiation'
  | 'won'
  | 'lost';

export type LeadSource =
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'website'
  | 'whatsapp'
  | 'google_maps'
  | 'referrals'
  | 'direct_outreach'
  | 'events'
  | 'other';

export interface LeadActivity {
  id: string;
  type: 'call' | 'meeting' | 'whatsapp' | 'email' | 'note';
  summary: string;
  date: string;
  actorUid: string;
}

export interface Lead extends BaseEntity {
  businessName: string;
  contactName: string;
  phone: string;
  email?: string;
  industry: string;
  location: string;
  source: LeadSource;
  stage: LeadStage;
  priority: 'low' | 'medium' | 'high';
  interestedServices: string[];
  estimatedBudgetPiasters: number;
  assignedUid: string;
  branchId: string;
  nextFollowUp?: string;
  notes?: string;
  lostReason?: string;
  activities?: LeadActivity[];
}

export interface Deal extends BaseEntity {
  title: string;
  clientId?: string;
  leadId?: string;
  salespersonUid: string;
  serviceIds: string[];
  estimatedValuePiasters: number;
  proposedValuePiasters: number;
  expectedCloseDate: string;
  probability: number;
  stage: LeadStage;
  branchId: string;
  notes?: string;
}

export interface ServiceItem extends BaseEntity {
  code: string;
  name: string;
  nameEn: string;
  category: string;
  pricingModel: 'fixed' | 'monthly' | 'hourly' | 'per_deliverable' | 'custom';
  defaultRatePiasters: number;
  estimatedCostPiasters: number;
  departmentId: string;
  deliverables: string[];
  defaultTasks: string[];
  estimatedDays: number;
  revisionLimit: number;
  status: 'active' | 'inactive';
}

export interface ProposalLine {
  serviceId: string;
  description: string;
  quantity: number;
  unitPricePiasters: number;
}

export interface Proposal extends BaseEntity {
  proposalNumber: string;
  title: string;
  clientId?: string;
  dealId?: string;
  branchId: string;
  items: ProposalLine[];
  discountPiasters: number;
  taxRatePercent: number;
  totalPiasters: number;
  paymentTerms: string;
  validUntil: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'sent' | 'accepted' | 'rejected';
  requesterUid: string;
  approverUid?: string;
  version: number;
}

export interface Contract extends BaseEntity {
  contractNumber: string;
  title: string;
  clientId: string;
  dealId?: string;
  proposalId?: string;
  branchId: string;
  accountManagerUid: string;
  serviceIds: string[];
  valuePiasters: number;
  startDate: string;
  endDate: string;
  paymentSchedule: string;
  revisionPolicy: string;
  signatureStatus: 'pending' | 'signed_client' | 'fully_executed';
  status: 'draft' | 'active' | 'renewal_due' | 'completed' | 'terminated';
}

export type ProjectStatus =
  | 'draft'
  | 'planning'
  | 'ready'
  | 'active'
  | 'on_hold'
  | 'at_risk'
  | 'under_review'
  | 'completed'
  | 'cancelled';

export interface ProjectDeliverable {
  id: string;
  title: string;
  mandatory: boolean;
  approved: boolean;
}

export interface Project extends BaseEntity {
  name: string;
  clientId: string;
  contractId?: string;
  serviceId?: string;
  branchId: string;
  departmentId: string;
  managerUid: string;
  status: ProjectStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  startDate: string;
  dueDate: string;
  approvedRevenuePiasters: number;
  estimatedCostPiasters: number;
  actualCostPiasters: number;
  progress: number;
  cycleLabel?: string;
  deliverables: ProjectDeliverable[];
  notes?: string;
}

export type TaskStatus =
  | 'backlog'
  | 'ready'
  | 'assigned'
  | 'in_progress'
  | 'on_hold'
  | 'internal_review'
  | 'client_approval'
  | 'revision'
  | 'approved'
  | 'completed'
  | 'cancelled';

export interface TaskChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface TaskRevision {
  id: string;
  requesterUid: string;
  reason: string;
  scopeType: 'in_scope' | 'commercial_change';
  date: string;
  status: 'open' | 'resolved';
}

export interface TaskComment {
  id: string;
  authorUid: string;
  body: string;
  date: string;
}

export interface Task extends BaseEntity {
  title: string;
  description?: string;
  projectId: string;
  clientId?: string;
  departmentId: string;
  assigneeUid: string;
  reviewerUid?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: TaskStatus;
  dueDate: string;
  estimatedHours?: number;
  checklist: TaskChecklistItem[];
  revisionCount: number;
  revisions?: TaskRevision[];
  comments?: TaskComment[];
}

export interface Shoot extends BaseEntity {
  title: string;
  projectId: string;
  clientId: string;
  branchId: string;
  location: string;
  shootDate: string;
  startTime: string;
  endTime: string;
  directorUid: string;
  crewUids: string[];
  status: 'requested' | 'planned' | 'scheduled' | 'ready' | 'in_production' | 'footage_uploaded' | 'handover_completed';
  objectives: string;
  shotList: string[];
  productionCostPiasters: number;
}

export interface EquipmentReservation extends BaseEntity {
  assetId: string;
  assetName: string;
  shootId?: string;
  projectId: string;
  reservedByUid: string;
  branchId: string;
  startIso: string;
  endIso: string;
  status: 'reserved' | 'checked_out' | 'returned' | 'cancelled';
}

export interface EditingJob extends BaseEntity {
  videoTitle: string;
  projectId: string;
  clientId: string;
  editorUid: string;
  reviewerUid: string;
  footageLocation: string;
  durationSec: number;
  aspectRatio: '9:16' | '16:9' | '1:1' | '4:5';
  resolution: '1080p' | '4K';
  frameRate: '24fps' | '30fps' | '60fps';
  captionsRequired: boolean;
  deadline: string;
  revisionCount: number;
  exportVersion: string;
  status: 'incoming_footage' | 'assigned' | 'editing' | 'internal_review' | 'revision' | 'approved' | 'final_export' | 'delivered';
}

export interface DesignJob extends BaseEntity {
  title: string;
  projectId: string;
  clientId: string;
  designerUid: string;
  reviewerUid: string;
  category: 'social_post' | 'story' | 'ad_creative' | 'thumbnail' | 'poster' | 'brand_identity' | 'presentation' | 'print';
  dimensions: string[];
  brandNotes: string;
  deadline: string;
  version: number;
  revisionCount: number;
  status: 'requested' | 'assigned' | 'designing' | 'internal_review' | 'revision' | 'approved' | 'delivered';
}

export interface MarketingItem extends BaseEntity {
  kind: 'campaign' | 'content';
  title: string;
  clientId: string;
  projectId: string;
  platform: 'Instagram' | 'TikTok' | 'Facebook' | 'LinkedIn' | 'Google Ads' | 'YouTube';
  objective: string;
  scheduledDate: string;
  budgetPiasters: number;
  spendPiasters: number;
  reach: number;
  clicks: number;
  leadsCount: number;
  dataSource: string;
  creatorUid: string;
  status: 'planned' | 'in_production' | 'pending_approval' | 'scheduled' | 'active' | 'completed';
}

export interface DevItem extends BaseEntity {
  kind: 'requirement' | 'feature' | 'bug';
  title: string;
  projectId: string;
  sprint: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  assigneeUid: string;
  qaUid?: string;
  releaseVersion?: string;
  status: 'submitted' | 'evaluating' | 'approved' | 'backlog' | 'in_development' | 'code_review' | 'qa' | 'ready_for_release' | 'released' | 'closed';
}

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'direct_cost' | 'operating_expense';

export interface Account extends BaseEntity {
  code: string;
  name: string;
  nameEn: string;
  type: AccountType;
  branchId?: string;
  status: 'active' | 'inactive';
}

export interface FiscalPeriod extends BaseEntity {
  name: string;
  startDate: string;
  endDate: string;
  status: 'open' | 'closed';
}

export interface JournalLine {
  accountId: string;
  accountCode: string;
  accountName: string;
  debitPiasters: number;
  creditPiasters: number;
  projectId?: string;
  costCenter?: string;
  memo?: string;
}

export interface JournalEntry extends BaseEntity {
  entryNumber: string;
  date: string;
  description: string;
  periodId: string;
  branchId: string;
  referenceType?: 'invoice' | 'payment' | 'expense' | 'transfer' | 'payroll' | 'manual' | 'reversal';
  referenceId?: string;
  status: 'draft' | 'posted' | 'reversed';
  totalDebitPiasters: number;
  totalCreditPiasters: number;
  lines: JournalLine[];
  reversedEntryId?: string;
  approvedByUid?: string;
}

export interface InvoiceLine {
  description: string;
  quantity: number;
  unitPricePiasters: number;
}

export interface Invoice extends BaseEntity {
  invoiceNumber: string;
  clientId: string;
  projectId?: string;
  branchId: string;
  issueDate: string;
  dueDate: string;
  lines: InvoiceLine[];
  totalPiasters: number;
  paidPiasters: number;
  status: 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'void';
}

export interface Payment extends BaseEntity {
  paymentNumber: string;
  direction: 'inbound' | 'outbound';
  invoiceId?: string;
  clientId?: string;
  vendorName?: string;
  treasuryAccountId: string;
  branchId: string;
  amountPiasters: number;
  date: string;
  method: 'bank_transfer' | 'cash' | 'instapay' | 'cheque';
  referenceCode: string;
}

export interface Expense extends BaseEntity {
  description: string;
  category: string;
  amountPiasters: number;
  date: string;
  branchId: string;
  departmentId: string;
  projectId?: string;
  paymentMethod: 'petty_cash' | 'bank_transfer' | 'card';
  requesterUid: string;
  approverUid?: string;
  approvalComment?: string;
  status: 'submitted' | 'manager_review' | 'finance_review' | 'approved' | 'posted' | 'paid' | 'rejected';
  journalEntryId?: string;
}

export interface TreasuryAccount extends BaseEntity {
  name: string;
  kind: 'main_treasury' | 'branch_cash' | 'petty_cash' | 'bank_account';
  branchId: string;
  glAccountId: string;
  balancePiasters: number;
  accountNumber?: string;
}

export interface TreasuryTransfer extends BaseEntity {
  fromAccountId: string;
  toAccountId: string;
  amountPiasters: number;
  date: string;
  memo: string;
  journalEntryId?: string;
}

export interface ProcurementRequest extends BaseEntity {
  requestNumber: string;
  title: string;
  vendorName: string;
  branchId: string;
  departmentId: string;
  projectId?: string;
  amountPiasters: number;
  requesterUid: string;
  approverUid?: string;
  status: 'requested' | 'approved' | 'ordered' | 'received' | 'billed' | 'paid' | 'rejected';
}

export interface Asset extends BaseEntity {
  assetTag: string;
  name: string;
  category: 'camera' | 'lens' | 'lighting' | 'audio' | 'stabilizer' | 'computer' | 'monitor' | 'furniture' | 'accessory';
  branchId: string;
  custodianUid?: string;
  acquisitionCostPiasters: number;
  purchaseDate: string;
  status: 'available' | 'reserved' | 'in_use' | 'maintenance' | 'retired';
}

export interface AttendanceRecord extends BaseEntity {
  employeeUid: string;
  branchId: string;
  date: string;
  workMode: 'office' | 'remote' | 'external_shoot';
  checkInTime: string;
  checkOutTime?: string;
  notes?: string;
}

export interface LeaveRequest extends BaseEntity {
  employeeUid: string;
  branchId: string;
  leaveType: 'annual' | 'sick' | 'emergency' | 'unpaid';
  startDate: string;
  endDate: string;
  reason: string;
  approverUid?: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface PayrollRun extends BaseEntity {
  periodLabel: string;
  branchId: string;
  totalGrossPiasters: number;
  totalDeductionsPiasters: number;
  totalNetPiasters: number;
  employeeCount: number;
  status: 'draft' | 'approved' | 'paid';
  approvedByUid?: string;
}

export interface SupportTicket extends BaseEntity {
  ticketNumber: string;
  subject: string;
  clientId: string;
  projectId?: string;
  departmentId: string;
  assigneeUid: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'new' | 'assigned' | 'in_progress' | 'waiting_internal' | 'waiting_client' | 'resolved' | 'closed';
  dueDate: string;
  lastMessage: string;
}

export interface FileRecord extends BaseEntity {
  name: string;
  folder: 'company' | 'contracts' | 'clients' | 'projects' | 'media' | 'design' | 'finance' | 'hr';
  mimeType: string;
  sizeLabel: string;
  storagePath: string;
  projectId?: string;
  version: string;
  classification: 'public_internal' | 'department_only' | 'confidential';
  tags: string[];
}

export interface KnowledgeArticle extends BaseEntity {
  title: string;
  category: 'policy' | 'sop' | 'manual' | 'template' | 'checklist' | 'faq';
  departmentId: string;
  summary: string;
  content: string;
  version: string;
  reviewDate: string;
}

export type WorkflowTriggerType =
  | 'record_created'
  | 'status_changed'
  | 'approval_granted'
  | 'payment_received'
  | 'invoice_overdue'
  | 'shoot_completed';

export type WorkflowActionType =
  | 'create_task'
  | 'send_notification'
  | 'create_follow_up'
  | 'escalate_manager'
  | 'create_project';

export interface WorkflowRule extends BaseEntity {
  name: string;
  description: string;
  trigger: WorkflowTriggerType;
  conditionSummary: string;
  action: WorkflowActionType;
  targetDepartmentId?: string;
  enabled: boolean;
  runCount: number;
}

export interface WorkflowLog extends BaseEntity {
  workflowId: string;
  workflowName: string;
  idempotencyKey: string;
  triggerEntityId: string;
  result: 'success' | 'skipped_duplicate' | 'failed';
  message: string;
}

export interface ApprovalRequest extends BaseEntity {
  title: string;
  entityType: 'expense' | 'proposal' | 'leave' | 'procurement' | 'contract';
  entityId: string;
  amountPiasters?: number;
  requesterUid: string;
  approverUid?: string;
  status: 'pending' | 'approved' | 'rejected';
  comment?: string;
  branchId: string;
}

export interface NotificationItem extends BaseEntity {
  recipientUid: string;
  title: string;
  body: string;
  category: 'task' | 'approval' | 'finance' | 'hr' | 'production' | 'system';
  read: boolean;
  actionRoute: string;
}

export interface AuditLogItem {
  id: string;
  actorUid: string;
  action: string;
  entity: string;
  entityId: string;
  summary: string;
  branchId?: string;
  ownerUid: string;
  memberUids: string[];
  createdAt: string;
}

export interface KpiDefinition {
  id: string;
  name: string;
  nameEn: string;
  purpose: string;
  formula: string;
  dataSource: string;
  period: string;
  owner: string;
  valueFormatted: string;
}
