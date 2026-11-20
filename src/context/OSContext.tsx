import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleAuthProvider,
  handleFirestoreError,
  OperationType,
  testFirestoreConnection,
} from '../lib/firebase';
import { buildDemoDataset, type BalanceOSDataset } from '../data/seedData';
import type {
  Account,
  ApprovalRequest,
  Asset,
  AttendanceRecord,
  AuditLogItem,
  Branch,
  Client,
  Company,
  Contract,
  CustomRole,
  Deal,
  Department,
  DesignJob,
  DevItem,
  EditingJob,
  EmployeeProfile,
  EquipmentReservation,
  Expense,
  FileRecord,
  FiscalPeriod,
  Invitation,
  Invoice,
  JournalEntry,
  JournalLine,
  KnowledgeArticle,
  Language,
  Lead,
  LeadStage,
  LeaveRequest,
  MarketingItem,
  NotificationItem,
  Payment,
  PayrollRun,
  ProcurementRequest,
  Project,
  ProjectStatus,
  Proposal,
  RoleId,
  ServiceItem,
  Shoot,
  SupportTicket,
  Task,
  TaskStatus,
  Team,
  ThemeMode,
  TreasuryAccount,
  TreasuryTransfer,
  WorkflowLog,
  WorkflowRule,
  WorkflowTriggerType,
} from '../types/os';
import {
  computeInvoiceStatus,
  createReversalLines,
  validateJournalEntry,
} from '../utils/accounting';
import { canApproveOperation, hasPermission } from '../utils/rbac';
import {
  checkEquipmentConflict,
  checkLeadDuplicate,
  evaluateWorkflowRules,
  validateProjectCompletion,
  validateTaskAssignment,
} from '../utils/workflows';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

export interface OSContextValue {
  // Auth & Environment
  loading: boolean;
  authUser: FirebaseUser | null;
  currentUser: EmployeeProfile | null;
  isDemoMode: boolean;
  firebaseOnline: boolean;
  signInWithGoogle: () => Promise<void>;
  enterDemoSandbox: () => void;
  signOut: () => Promise<void>;
  switchDemoRole: (role: RoleId) => void;

  // Preferences
  lang: Language;
  setLang: (lang: Language) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  activeBranchId: string;
  setActiveBranchId: (branchId: string) => void;
  includeDemoInLiveReports: boolean;
  setIncludeDemoInLiveReports: (val: boolean) => void;

  // Toasts
  toasts: ToastMessage[];
  pushToast: (type: ToastMessage['type'], text: string) => void;
  dismissToast: (id: string) => void;

  // Dataset
  data: BalanceOSDataset;
  invitations: Invitation[];

  // Actions — Organization
  updateCompany: (patch: Partial<Company>) => Promise<void>;
  createBranch: (input: Omit<Branch, 'id' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  createDepartment: (input: Omit<Department, 'id' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  inviteEmployee: (input: { email: string; fullName: string; role: RoleId; branchIds: string[]; departmentIds: string[] }) => Promise<void>;
  updateEmployeeRole: (uid: string, role: RoleId) => Promise<void>;
  createCustomRole: (input: Omit<CustomRole, 'id' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt'>) => Promise<void>;

  // Actions — CRM, Clients, Proposals, Contracts
  createLead: (input: Omit<Lead, 'id' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt'>) => Promise<{ ok: boolean; error?: string }>;
  updateLeadStage: (leadId: string, stage: LeadStage, lostReason?: string) => Promise<void>;
  addLeadActivity: (leadId: string, type: 'call' | 'meeting' | 'whatsapp' | 'email' | 'note', summary: string) => Promise<void>;
  convertLeadToClientAndDeal: (leadId: string) => Promise<void>;
  createClient: (input: Omit<Client, 'id' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  createDeal: (input: Omit<Deal, 'id' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  createService: (input: Omit<ServiceItem, 'id' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  createProposal: (input: Omit<Proposal, 'id' | 'proposalNumber' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt' | 'requesterUid' | 'version'>) => Promise<void>;
  decideProposal: (proposalId: string, decision: 'approved' | 'rejected') => Promise<{ ok: boolean; error?: string }>;
  createContractAndProject: (input: {
    title: string;
    clientId: string;
    branchId: string;
    accountManagerUid: string;
    serviceIds: string[];
    valuePiasters: number;
    startDate: string;
    endDate: string;
    paymentSchedule: string;
    revisionPolicy: string;
  }) => Promise<void>;

  // Actions — Projects, Tasks, Creative, Tech
  createProject: (input: Omit<Project, 'id' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProjectStatus: (projectId: string, status: ProjectStatus) => Promise<{ ok: boolean; error?: string }>;
  toggleDeliverableApproval: (projectId: string, deliverableId: string) => Promise<void>;
  createTask: (input: Omit<Task, 'id' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt' | 'revisionCount'>) => Promise<{ ok: boolean; error?: string }>;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  toggleTaskChecklist: (taskId: string, itemId: string) => Promise<void>;
  addTaskRevision: (taskId: string, reason: string, scopeType: 'in_scope' | 'commercial_change') => Promise<void>;
  addTaskComment: (taskId: string, body: string) => Promise<void>;

  createShoot: (input: Omit<Shoot, 'id' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateShootStatus: (shootId: string, status: Shoot['status']) => Promise<void>;
  reserveEquipment: (input: Omit<EquipmentReservation, 'id' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt' | 'status'>) => Promise<{ ok: boolean; error?: string }>;

  createEditingJob: (input: Omit<EditingJob, 'id' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt' | 'revisionCount'>) => Promise<void>;
  updateEditingStatus: (jobId: string, status: EditingJob['status']) => Promise<void>;
  createDesignJob: (input: Omit<DesignJob, 'id' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt' | 'revisionCount' | 'version'>) => Promise<void>;
  updateDesignStatus: (jobId: string, status: DesignJob['status']) => Promise<void>;
  createMarketingItem: (input: Omit<MarketingItem, 'id' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateMarketingStatus: (itemId: string, status: MarketingItem['status']) => Promise<void>;
  createDevItem: (input: Omit<DevItem, 'id' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateDevStatus: (itemId: string, status: DevItem['status']) => Promise<void>;

  // Actions — Finance & Accounting
  createJournalEntry: (input: {
    date: string;
    description: string;
    periodId: string;
    branchId: string;
    lines: JournalLine[];
    status: 'draft' | 'posted';
  }) => Promise<{ ok: boolean; error?: string }>;
  reverseJournalEntry: (entryId: string) => Promise<{ ok: boolean; error?: string }>;
  toggleFiscalPeriod: (periodId: string) => Promise<void>;
  createInvoice: (input: Omit<Invoice, 'id' | 'invoiceNumber' | 'paidPiasters' | 'status' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  recordInvoicePayment: (input: { invoiceId: string; treasuryAccountId: string; amountPiasters: number; method: Payment['method']; referenceCode: string; date: string }) => Promise<{ ok: boolean; error?: string }>;
  createExpense: (input: Omit<Expense, 'id' | 'requesterUid' | 'status' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  decideExpense: (expenseId: string, decision: 'approved' | 'rejected', comment?: string) => Promise<{ ok: boolean; error?: string }>;
  createTreasuryTransfer: (input: { fromAccountId: string; toAccountId: string; amountPiasters: number; date: string; memo: string }) => Promise<{ ok: boolean; error?: string }>;

  // Actions — Procurement, Assets, HR, Support, Files, KB, Automation
  createProcurementRequest: (input: Omit<ProcurementRequest, 'id' | 'requestNumber' | 'requesterUid' | 'status' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  advanceProcurement: (id: string, nextStatus: ProcurementRequest['status']) => Promise<{ ok: boolean; error?: string }>;
  createAsset: (input: Omit<Asset, 'id' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateAssetStatus: (assetId: string, status: Asset['status'], branchId?: string) => Promise<void>;

  checkInAttendance: (workMode: AttendanceRecord['workMode'], notes?: string) => Promise<void>;
  createLeaveRequest: (input: Omit<LeaveRequest, 'id' | 'employeeUid' | 'status' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  decideLeaveRequest: (leaveId: string, decision: 'approved' | 'rejected') => Promise<{ ok: boolean; error?: string }>;
  approvePayrollRun: (payrollId: string) => Promise<{ ok: boolean; error?: string }>;

  createSupportTicket: (input: Omit<SupportTicket, 'id' | 'ticketNumber' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTicketStatus: (ticketId: string, status: SupportTicket['status'], lastMessage?: string) => Promise<void>;
  createFileRecord: (input: Omit<FileRecord, 'id' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  createKnowledgeArticle: (input: Omit<KnowledgeArticle, 'id' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt'>) => Promise<void>;

  createWorkflowRule: (input: Omit<WorkflowRule, 'id' | 'runCount' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  toggleWorkflowRule: (workflowId: string) => Promise<void>;
  triggerWorkflowEvent: (trigger: WorkflowTriggerType, entityId: string, contextTitle: string) => Promise<void>;

  decideApproval: (approvalId: string, decision: 'approved' | 'rejected', comment?: string) => Promise<{ ok: boolean; error?: string }>;
  markNotificationRead: (notificationId: string) => Promise<void>;

  // Demo Lifecycle in Live Firestore or Sandbox Reset
  resetDemoSandbox: () => void;
  seedDemoInFirestore: () => Promise<void>;
  clearDemoInFirestore: () => Promise<void>;
}

const OSContext = createContext<OSContextValue | null>(null);

function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function nowIso(): string {
  return new Date().toISOString();
}

function toIsoString(val: unknown): string {
  if (!val) return nowIso();
  if (typeof val === 'string') return val;
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (typeof val === 'object' && val !== null && 'toDate' in val && typeof (val as { toDate: () => Date }).toDate === 'function') {
    return (val as { toDate: () => Date }).toDate().toISOString();
  }
  return nowIso();
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

const EMPTY_DATASET = (ownerUid: string): BalanceOSDataset => {
  const demo = buildDemoDataset(ownerUid);
  return {
    ...demo,
    company: { ...demo.company, id: 'balance-agency', isDemo: false },
    branches: demo.branches.map((b) => ({ ...b, isDemo: false })),
    departments: demo.departments.map((d) => ({ ...d, isDemo: false })),
    teams: [],
    employees: [],
    customRoles: [],
    clients: [],
    leads: [],
    deals: [],
    services: demo.services.map((s) => ({ ...s, isDemo: false })),
    proposals: [],
    contracts: [],
    projects: [],
    tasks: [],
    shoots: [],
    equipmentReservations: [],
    editingJobs: [],
    designJobs: [],
    marketingItems: [],
    devItems: [],
    accounts: demo.accounts.map((a) => ({ ...a, isDemo: false })),
    fiscalPeriods: demo.fiscalPeriods.map((f) => ({ ...f, isDemo: false })),
    journalEntries: [],
    invoices: [],
    payments: [],
    expenses: [],
    treasuryAccounts: demo.treasuryAccounts.map((t) => ({ ...t, balancePiasters: 0, isDemo: false })),
    treasuryTransfers: [],
    procurementRequests: [],
    assets: [],
    attendanceRecords: [],
    leaveRequests: [],
    payrollRuns: [],
    supportTickets: [],
    files: [],
    knowledgeArticles: [],
    workflows: demo.workflows.map((w) => ({ ...w, runCount: 0, isDemo: false })),
    workflowLogs: [],
    approvals: [],
    notifications: [],
    auditLogs: [],
  };
};

export function OSProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('autostart') === '1';
  });
  const [firebaseOnline, setFirebaseOnline] = useState(true);

  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('balance_os_lang');
    return saved === 'en' ? 'en' : 'ar';
  });
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('balance_os_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });
  const [activeBranchId, setActiveBranchId] = useState<string>('all');
  const [includeDemoInLiveReports, setIncludeDemoInLiveReports] = useState<boolean>(false);

  const [data, setData] = useState<BalanceOSDataset>(() => buildDemoDataset('demo-ceo-01'));
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [demoUid, setDemoUid] = useState<string>('demo-ceo-01');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const pushToast = useCallback((type: ToastMessage['type'], text: string) => {
    const id = makeId('toast');
    setToasts((prev) => [...prev.slice(-3), { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    localStorage.setItem('balance_os_lang', next);
  }, []);

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
    localStorage.setItem('balance_os_theme', next);
  }, []);

  // Sync HTML lang/dir and dark class
  useEffect(() => {
    const html = document.documentElement;
    html.lang = lang;
    html.dir = lang === 'ar' ? 'rtl' : 'ltr';
    if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [lang, theme]);

  // Connectivity probe on mount
  useEffect(() => {
    testFirestoreConnection().then((res) => setFirebaseOnline(res.online));
  }, []);

  const enterDemoSandbox = useCallback(() => {
    setData(buildDemoDataset('demo-ceo-01'));
    setDemoUid('demo-ceo-01');
    setIsDemoMode(true);
    setLoading(false);
  }, []);

  const resetDemoSandbox = useCallback(() => {
    setData(buildDemoDataset('demo-ceo-01'));
    setDemoUid('demo-ceo-01');
    pushToast('info', lang === 'ar' ? 'تمت إعادة ضبط بيانات العرض التجريبية بنجاح.' : 'Demo sandbox dataset restored.');
  }, [lang, pushToast]);

  const switchDemoRole = useCallback(
    (role: RoleId) => {
      const match = data.employees.find((e) => e.role === role);
      if (match) {
        setDemoUid(match.uid);
        pushToast(
          'info',
          lang === 'ar' ? `تم تبديل العرض إلى: ${match.fullName} (${role})` : `Switched preview to: ${match.fullNameEn ?? match.fullName} (${role})`
        );
      } else {
        // Update CEO preview user role temporarily for testing any of the 17 roles
        setData((prev) => ({
          ...prev,
          employees: prev.employees.map((e) => (e.uid === 'demo-ceo-01' ? { ...e, role } : e)),
        }));
        setDemoUid('demo-ceo-01');
        pushToast('info', lang === 'ar' ? `تم تطبيق صلاحية الدور: ${role}` : `Previewing role: ${role}`);
      }
    },
    [data.employees, lang, pushToast]
  );

  // Firebase Auth listener + Bootstrap + Real-time Snapshot Subscriptions
  useEffect(() => {
    if (isDemoMode) {
      setLoading(false);
      return;
    }

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      if (!user) {
        setLoading(false);
        return;
      }

      if (!user.emailVerified) {
        pushToast('error', lang === 'ar' ? 'يرجى التحقق من البريد الإلكتروني للمتابعة.' : 'Email verification is required.');
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        const isFounder = user.email?.toLowerCase() === 'sofianamr92@gmail.com';

        if (!userSnap.exists()) {
          const initialRole: RoleId = isFounder ? 'ceo' : 'employee';
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email ?? '',
            fullName: user.displayName || (isFounder ? 'سفيان عمرو' : 'مستخدم جديد'),
            fullNameEn: user.displayName || 'BALANCE Member',
            role: initialRole,
            branchIds: ['br-cairo'],
            departmentIds: ['dept-mgmt'],
            position: isFounder ? 'المؤسس والرئيس التنفيذي' : 'عضو فريق',
            workModel: 'hybrid',
            employmentType: 'full_time',
            status: 'active',
            isDemo: false,
            ownerUid: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          if (isFounder) {
            const base = EMPTY_DATASET(user.uid);
            await setDoc(doc(db, 'companies', 'balance-agency'), {
              id: base.company.id,
              name: base.company.name,
              legalName: base.company.legalName,
              taxId: base.company.taxId,
              address: base.company.address,
              phone: base.company.phone,
              email: base.company.email,
              currency: base.company.currency,
              timezone: base.company.timezone,
              fiscalYearStart: base.company.fiscalYearStart,
              ownerUid: user.uid,
              memberUids: [user.uid],
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });

            for (const br of base.branches) {
              await setDoc(doc(db, 'branches', br.id), {
                id: br.id,
                code: br.code,
                name: br.name,
                nameEn: br.nameEn,
                address: br.address,
                phone: br.phone,
                email: br.email,
                managerUid: user.uid,
                status: br.status,
                operationalBudgetPiasters: br.operationalBudgetPiasters,
                isDemo: false,
                ownerUid: user.uid,
                memberUids: [user.uid],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            }

            for (const dept of base.departments) {
              await setDoc(doc(db, 'departments', dept.id), {
                id: dept.id,
                code: dept.code,
                name: dept.name,
                nameEn: dept.nameEn,
                managerUid: user.uid,
                budgetPiasters: dept.budgetPiasters,
                isDemo: false,
                ownerUid: user.uid,
                memberUids: [user.uid],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            }

            for (const acc of base.accounts) {
              await setDoc(doc(db, 'chartOfAccounts', acc.id), {
                ...stripUndefined(acc as unknown as Record<string, unknown>),
                ownerUid: user.uid,
                memberUids: [user.uid],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            }

            for (const fp of base.fiscalPeriods) {
              await setDoc(doc(db, 'fiscalPeriods', fp.id), {
                ...stripUndefined(fp as unknown as Record<string, unknown>),
                ownerUid: user.uid,
                memberUids: [user.uid],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            }

            for (const tr of base.treasuryAccounts) {
              await setDoc(doc(db, 'treasuryAccounts', tr.id), {
                ...stripUndefined(tr as unknown as Record<string, unknown>),
                ownerUid: user.uid,
                memberUids: [user.uid],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            }
          }
        }

        if (isFounder) {
          const base = EMPTY_DATASET(user.uid);
          const [wfSnap, srvSnap] = await Promise.all([
            getDoc(doc(db, 'workflows', 'wf-1')),
            getDoc(doc(db, 'services', 'srv-photo')),
          ]);
          if (!wfSnap.exists()) {
            await Promise.all(
              base.workflows.map((wf) =>
                setDoc(doc(db, 'workflows', wf.id), {
                  ...stripUndefined(wf as unknown as Record<string, unknown>),
                  ownerUid: user.uid,
                  memberUids: [user.uid],
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                })
              )
            );
          }
          if (!srvSnap.exists()) {
            await Promise.all(
              base.services.map((srv) =>
                setDoc(doc(db, 'services', srv.id), {
                  ...stripUndefined(srv as unknown as Record<string, unknown>),
                  ownerUid: user.uid,
                  memberUids: [user.uid],
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                })
              )
            );
          }
        }

        setData(EMPTY_DATASET(user.uid));
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'users/bootstrap');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubAuth();
  }, [isDemoMode, lang, pushToast]);

  // Attach real-time Firestore listeners when authenticated in Live mode
  useEffect(() => {
    if (isDemoMode || !authUser || !authUser.emailVerified) return;

    const isFounder = authUser.email?.toLowerCase() === 'sofianamr92@gmail.com';
    const uid = authUser.uid;
    const unsubs: Array<() => void> = [];

    const subscribeCol = <T,>(
      colName: string,
      onUpdate: (items: T[]) => void,
      memberScoped = true
    ) => {
      const colRef = collection(db, colName);
      const q = isFounder
        ? colRef
        : memberScoped
          ? query(colRef, where('memberUids', 'array-contains', uid))
          : query(colRef, where('ownerUid', '==', uid));

      const unsub = onSnapshot(
        q,
        (snap) => {
          const items = snap.docs.map((d) => {
            const raw = d.data() as Record<string, unknown>;
            return {
              ...raw,
              id: (raw.id as string) || d.id,
              createdAt: toIsoString(raw.createdAt),
              updatedAt: toIsoString(raw.updatedAt),
            } as T;
          });
          onUpdate(items);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, colName)
      );
      unsubs.push(unsub);
    };

    subscribeCol<Company>('companies', (items) => {
      if (items[0]) setData((p) => ({ ...p, company: items[0] }));
    });
    subscribeCol<Branch>('branches', (items) => {
      if (items.length > 0) setData((p) => ({ ...p, branches: items }));
    });
    subscribeCol<Department>('departments', (items) => {
      if (items.length > 0) setData((p) => ({ ...p, departments: items }));
    });
    subscribeCol<EmployeeProfile>(
      'users',
      (items) => {
        if (items.length > 0) setData((p) => ({ ...p, employees: items }));
      },
      false
    );
    subscribeCol<Invitation>('invitations', (items) => setInvitations(items), false);
    subscribeCol<CustomRole>('roles', (items) => setData((p) => ({ ...p, customRoles: items })));
    subscribeCol<Client>('clients', (items) => setData((p) => ({ ...p, clients: items })));
    subscribeCol<Lead>('leads', (items) => setData((p) => ({ ...p, leads: items })));
    subscribeCol<Deal>('deals', (items) => setData((p) => ({ ...p, deals: items })));
    subscribeCol<ServiceItem>('services', (items) => {
      if (items.length > 0) setData((p) => ({ ...p, services: items }));
    });
    subscribeCol<Proposal>('proposals', (items) => setData((p) => ({ ...p, proposals: items })));
    subscribeCol<Contract>('contracts', (items) => setData((p) => ({ ...p, contracts: items })));
    subscribeCol<Project>('projects', (items) => setData((p) => ({ ...p, projects: items })));
    subscribeCol<Task>('tasks', (items) => setData((p) => ({ ...p, tasks: items })));
    subscribeCol<Shoot>('shoots', (items) => setData((p) => ({ ...p, shoots: items })));
    subscribeCol<EquipmentReservation>('equipmentReservations', (items) =>
      setData((p) => ({ ...p, equipmentReservations: items }))
    );
    subscribeCol<EditingJob>('editingJobs', (items) => setData((p) => ({ ...p, editingJobs: items })));
    subscribeCol<DesignJob>('designJobs', (items) => setData((p) => ({ ...p, designJobs: items })));
    subscribeCol<MarketingItem>('marketingItems', (items) =>
      setData((p) => ({ ...p, marketingItems: items }))
    );
    subscribeCol<DevItem>('devItems', (items) => setData((p) => ({ ...p, devItems: items })));
    subscribeCol<Account>('chartOfAccounts', (items) => {
      if (items.length > 0) setData((p) => ({ ...p, accounts: items }));
    });
    subscribeCol<FiscalPeriod>('fiscalPeriods', (items) => {
      if (items.length > 0) setData((p) => ({ ...p, fiscalPeriods: items }));
    });
    subscribeCol<JournalEntry>('journalEntries', (items) =>
      setData((p) => ({ ...p, journalEntries: items }))
    );
    subscribeCol<Invoice>('invoices', (items) => setData((p) => ({ ...p, invoices: items })));
    subscribeCol<Payment>('payments', (items) => setData((p) => ({ ...p, payments: items })));
    subscribeCol<Expense>('expenses', (items) => setData((p) => ({ ...p, expenses: items })));
    subscribeCol<TreasuryAccount>('treasuryAccounts', (items) => {
      if (items.length > 0) setData((p) => ({ ...p, treasuryAccounts: items }));
    });
    subscribeCol<TreasuryTransfer>('treasuryTransfers', (items) =>
      setData((p) => ({ ...p, treasuryTransfers: items }))
    );
    subscribeCol<ProcurementRequest>('procurementRequests', (items) =>
      setData((p) => ({ ...p, procurementRequests: items }))
    );
    subscribeCol<Asset>('assets', (items) => setData((p) => ({ ...p, assets: items })));
    subscribeCol<AttendanceRecord>('attendanceRecords', (items) =>
      setData((p) => ({ ...p, attendanceRecords: items }))
    );
    subscribeCol<LeaveRequest>('leaveRequests', (items) =>
      setData((p) => ({ ...p, leaveRequests: items }))
    );
    subscribeCol<PayrollRun>(
      'payrollRuns',
      (items) => setData((p) => ({ ...p, payrollRuns: items })),
      false
    );
    subscribeCol<SupportTicket>('supportTickets', (items) =>
      setData((p) => ({ ...p, supportTickets: items }))
    );
    subscribeCol<FileRecord>('files', (items) => setData((p) => ({ ...p, files: items })));
    subscribeCol<KnowledgeArticle>('knowledgeArticles', (items) =>
      setData((p) => ({ ...p, knowledgeArticles: items }))
    );
    subscribeCol<WorkflowRule>('workflows', (items) => {
      if (items.length > 0) setData((p) => ({ ...p, workflows: items }));
    });
    subscribeCol<WorkflowLog>('workflowLogs', (items) =>
      setData((p) => ({ ...p, workflowLogs: items }))
    );
    subscribeCol<ApprovalRequest>('approvals', (items) => setData((p) => ({ ...p, approvals: items })));
    subscribeCol<NotificationItem>('notifications', (items) =>
      setData((p) => ({
        ...p,
        notifications: [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      }))
    );
    if (isFounder) {
      subscribeCol<AuditLogItem>('auditLogs', (items) => setData((p) => ({ ...p, auditLogs: items })), false);
    }

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [authUser, isDemoMode]);

  const currentUser = useMemo<EmployeeProfile | null>(() => {
    if (isDemoMode) {
      return data.employees.find((e) => e.uid === demoUid) ?? data.employees[0] ?? null;
    }
    if (!authUser) return null;
    const found = data.employees.find((e) => e.uid === authUser.uid);
    if (found) return found;
    const isFounder = authUser.email?.toLowerCase() === 'sofianamr92@gmail.com';
    return {
      uid: authUser.uid,
      email: authUser.email ?? '',
      fullName: authUser.displayName ?? 'BALANCE User',
      role: isFounder ? 'ceo' : 'employee',
      branchIds: ['br-cairo'],
      departmentIds: ['dept-mgmt'],
      position: isFounder ? 'CEO / Founder' : 'Member',
      workModel: 'hybrid',
      employmentType: 'full_time',
      status: 'active',
      ownerUid: authUser.uid,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
  }, [authUser, data.employees, demoUid, isDemoMode]);

  const ownerId = currentUser?.uid ?? 'demo-ceo-01';
  const defaultMembers = useMemo(() => [ownerId], [ownerId]);

  const logAudit = useCallback(
    async (action: string, entity: string, entityId: string, summary: string, branchId?: string) => {
      const log: AuditLogItem = {
        id: makeId('aud'),
        actorUid: ownerId,
        action,
        entity,
        entityId,
        summary: summary.slice(0, 290),
        branchId,
        ownerUid: ownerId,
        memberUids: defaultMembers,
        createdAt: nowIso(),
      };
      setData((p) => ({ ...p, auditLogs: [log, ...p.auditLogs] }));
      if (!isDemoMode && authUser) {
        try {
          await setDoc(doc(db, 'auditLogs', log.id), {
            ...stripUndefined(log as unknown as Record<string, unknown>),
            createdAt: serverTimestamp(),
          });
        } catch {
          // audit write best effort
        }
      }
    },
    [authUser, defaultMembers, isDemoMode, ownerId]
  );

  // Generic Firestore persist helpers (sanitizing fields for strict rules)
  const fsCreate = useCallback(
    async (colName: string, id: string, payload: Record<string, unknown>) => {
      if (isDemoMode || !authUser) return;
      try {
        await setDoc(doc(db, colName, id), {
          ...stripUndefined(payload),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `${colName}/${id}`);
      }
    },
    [authUser, isDemoMode]
  );

  const fsUpdate = useCallback(
    async (colName: string, id: string, patch: Record<string, unknown>) => {
      if (isDemoMode || !authUser) return;
      try {
        await updateDoc(doc(db, colName, id), {
          ...stripUndefined(patch),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `${colName}/${id}`);
      }
    },
    [authUser, isDemoMode]
  );

  const signInWithGoogle = useCallback(async () => {
    setIsDemoMode(false);
    await signInWithPopup(auth, googleAuthProvider);
  }, []);

  const signOut = useCallback(async () => {
    if (isDemoMode) {
      setIsDemoMode(false);
      return;
    }
    await firebaseSignOut(auth);
  }, [isDemoMode]);

  // --- Organization Actions ---
  const updateCompany = useCallback(
    async (patch: Partial<Company>) => {
      const updated = { ...data.company, ...patch, updatedAt: nowIso() };
      setData((p) => ({ ...p, company: updated }));
      await fsUpdate('companies', data.company.id, patch as Record<string, unknown>);
      await logAudit('UPDATE_COMPANY', 'companies', data.company.id, 'تحديث ملف وبيانات الشركة');
      pushToast('success', lang === 'ar' ? 'تم حفظ بيانات الشركة' : 'Company profile updated');
    },
    [data.company, fsUpdate, lang, logAudit, pushToast]
  );

  const createBranch = useCallback(
    async (input: Omit<Branch, 'id' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt'>) => {
      const branch: Branch = {
        ...input,
        id: makeId('br'),
        ownerUid: ownerId,
        memberUids: defaultMembers,
        isDemo: isDemoMode,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      setData((p) => ({ ...p, branches: [...p.branches, branch] }));
      await fsCreate('branches', branch.id, branch as unknown as Record<string, unknown>);
      await logAudit('CREATE_BRANCH', 'branches', branch.id, `إنشاء فرع: ${branch.name}`, branch.id);
      pushToast('success', lang === 'ar' ? 'تم إنشاء الفرع بنجاح' : 'Branch created');
    },
    [defaultMembers, fsCreate, isDemoMode, lang, logAudit, ownerId, pushToast]
  );

  const createDepartment = useCallback(
    async (input: Omit<Department, 'id' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt'>) => {
      const dept: Department = {
        ...input,
        id: makeId('dept'),
        ownerUid: ownerId,
        memberUids: defaultMembers,
        isDemo: isDemoMode,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      setData((p) => ({ ...p, departments: [...p.departments, dept] }));
      await fsCreate('departments', dept.id, dept as unknown as Record<string, unknown>);
      await logAudit('CREATE_DEPARTMENT', 'departments', dept.id, `إنشاء إدارة: ${dept.name}`);
      pushToast('success', lang === 'ar' ? 'تمت إضافة الإدارة' : 'Department added');
    },
    [defaultMembers, fsCreate, isDemoMode, lang, logAudit, ownerId, pushToast]
  );

  const inviteEmployee = useCallback(
    async (input: { email: string; fullName: string; role: RoleId; branchIds: string[]; departmentIds: string[] }) => {
      const inv: Invitation = {
        id: makeId('inv'),
        email: input.email.trim().toLowerCase(),
        fullName: input.fullName,
        role: input.role,
        branchIds: input.branchIds,
        departmentIds: input.departmentIds,
        status: 'pending',
        invitedByUid: ownerId,
        ownerUid: ownerId,
        memberUids: defaultMembers,
        isDemo: isDemoMode,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      setInvitations((p) => [inv, ...p]);
      await fsCreate('invitations', inv.id, inv as unknown as Record<string, unknown>);
      if (isDemoMode) {
        const emp: EmployeeProfile = {
          uid: makeId('emp'),
          email: inv.email,
          fullName: inv.fullName,
          role: inv.role,
          branchIds: inv.branchIds,
          departmentIds: inv.departmentIds,
          position: inv.role,
          workModel: 'hybrid',
          employmentType: 'full_time',
          status: 'invited',
          isDemo: true,
          ownerUid: ownerId,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        setData((p) => ({ ...p, employees: [...p.employees, emp] }));
      }
      await logAudit('INVITE_USER', 'invitations', inv.id, `دعوة موظف جديد: ${inv.email}`);
      pushToast('success', lang === 'ar' ? 'تم إرسال الدعوة وتسجيلها بنظام الصلاحيات' : 'Invitation issued');
    },
    [defaultMembers, fsCreate, isDemoMode, lang, logAudit, ownerId, pushToast]
  );

  const updateEmployeeRole = useCallback(
    async (uid: string, role: RoleId) => {
      setData((p) => ({
        ...p,
        employees: p.employees.map((e) => (e.uid === uid ? { ...e, role, updatedAt: nowIso() } : e)),
      }));
      await fsUpdate('users', uid, { role });
      await logAudit('UPDATE_ROLE', 'users', uid, `تعديل دور المستخدم إلى ${role}`);
      pushToast('success', lang === 'ar' ? 'تم تحديث الصلاحية' : 'Role updated');
    },
    [fsUpdate, lang, logAudit, pushToast]
  );

  const createCustomRole = useCallback(
    async (input: Omit<CustomRole, 'id' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt'>) => {
      const roleObj: CustomRole = {
        ...input,
        id: makeId('role'),
        ownerUid: ownerId,
        memberUids: defaultMembers,
        isDemo: isDemoMode,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      setData((p) => ({ ...p, customRoles: [...p.customRoles, roleObj] }));
      await fsCreate('roles', roleObj.id, roleObj as unknown as Record<string, unknown>);
      pushToast('success', lang === 'ar' ? 'تم حفظ الدور المخصص' : 'Custom role saved');
    },
    [defaultMembers, fsCreate, isDemoMode, lang, ownerId, pushToast]
  );

  // --- Workflow Runner ---
  const triggerWorkflowEvent = useCallback(
    async (trigger: WorkflowTriggerType, entityId: string, contextTitle: string) => {
      const candidates = evaluateWorkflowRules(trigger, entityId, data.workflows, data.workflowLogs);
      if (candidates.length === 0) return;

      const newLogs: WorkflowLog[] = [];
      const newNotifs: NotificationItem[] = [];
      const newTasks: Task[] = [];

      for (const item of candidates) {
        if (!item.shouldExecute) {
          newLogs.push({
            id: makeId('wfl'),
            workflowId: item.rule.id,
            workflowName: item.rule.name,
            idempotencyKey: item.idempotencyKey,
            triggerEntityId: entityId,
            result: 'skipped_duplicate',
            message: item.reason,
            ownerUid: ownerId,
            memberUids: defaultMembers,
            isDemo: isDemoMode,
            createdAt: nowIso(),
            updatedAt: nowIso(),
          });
          continue;
        }

        if (item.rule.action === 'create_task' && data.projects[0]) {
          const autoTask: Task = {
            id: makeId('task'),
            title: `متابعة أتمتة: ${contextTitle}`,
            projectId: data.projects[0].id,
            departmentId: item.rule.targetDepartmentId ?? 'dept-edit',
            assigneeUid: ownerId,
            priority: 'high',
            status: 'ready',
            dueDate: todayIso(),
            checklist: [{ id: makeId('chk'), label: 'مراجعة مخرجات الأتمتة', done: false }],
            revisionCount: 0,
            ownerUid: ownerId,
            memberUids: defaultMembers,
            isDemo: isDemoMode,
            createdAt: nowIso(),
            updatedAt: nowIso(),
          };
          newTasks.push(autoTask);
        }

        newNotifs.push({
          id: makeId('not'),
          recipientUid: ownerId,
          title: `تنفيذ أتمتة: ${item.rule.name}`,
          body: `${contextTitle} (${trigger})`,
          category: 'system',
          read: false,
          actionRoute: '/automation',
          ownerUid: ownerId,
          memberUids: defaultMembers,
          isDemo: isDemoMode,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        });

        newLogs.push({
          id: makeId('wfl'),
          workflowId: item.rule.id,
          workflowName: item.rule.name,
          idempotencyKey: item.idempotencyKey,
          triggerEntityId: entityId,
          result: 'success',
          message: `تم التنفيذ بنجاح لـ ${contextTitle}`,
          ownerUid: ownerId,
          memberUids: defaultMembers,
          isDemo: isDemoMode,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        });
      }

      const ranIds = new Set(candidates.filter((c) => c.shouldExecute).map((c) => c.rule.id));

      if (!isDemoMode && authUser) {
        const writeOps: Array<Promise<void>> = [];
        for (const t of newTasks) {
          const fsTask = { ...t };
          delete fsTask.revisions;
          delete fsTask.comments;
          writeOps.push(fsCreate('tasks', t.id, fsTask as unknown as Record<string, unknown>));
        }
        for (const log of newLogs) {
          writeOps.push(fsCreate('workflowLogs', log.id, log as unknown as Record<string, unknown>));
        }
        for (const n of newNotifs) {
          writeOps.push(fsCreate('notifications', n.id, n as unknown as Record<string, unknown>));
        }
        const isAdminUser =
          authUser.email?.toLowerCase() === 'sofianamr92@gmail.com' ||
          currentUser?.role === 'ceo' ||
          currentUser?.role === 'general_manager';
        if (isAdminUser) {
          for (const wf of data.workflows) {
            if (ranIds.has(wf.id)) {
              writeOps.push(fsUpdate('workflows', wf.id, { runCount: wf.runCount + 1 }));
            }
          }
        }
        await Promise.all(writeOps);
      }

      setData((p) => ({
        ...p,
        tasks: [...newTasks, ...p.tasks],
        notifications: [...newNotifs, ...p.notifications],
        workflowLogs: [...newLogs, ...p.workflowLogs],
        workflows: p.workflows.map((w) => (ranIds.has(w.id) ? { ...w, runCount: w.runCount + 1 } : w)),
      }));
    },
    [authUser, currentUser?.role, data.projects, data.workflowLogs, data.workflows, defaultMembers, fsCreate, fsUpdate, isDemoMode, ownerId]
  );

  // --- CRM, Clients, Proposals, Contracts ---
  const createLead = useCallback(
    async (input: Omit<Lead, 'id' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt'>) => {
      const dup = checkLeadDuplicate(
        { businessName: input.businessName, phone: input.phone, email: input.email },
        data.leads
      );
      if (dup.duplicate) {
        const msg =
          lang === 'ar'
            ? `رفض الإضافة: عميل محتمل مكرر (${dup.matchedLead?.businessName}) — ${dup.reason}`
            : `Duplicate lead blocked (${dup.matchedLead?.businessName}): ${dup.reason}`;
        pushToast('error', msg);
        return { ok: false, error: msg };
      }

      const lead: Lead = {
        ...input,
        id: makeId('lead'),
        ownerUid: ownerId,
        memberUids: defaultMembers,
        isDemo: isDemoMode,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      setData((p) => ({ ...p, leads: [lead, ...p.leads] }));
      const fsPayload = { ...lead };
      delete fsPayload.activities;
      await fsCreate('leads', lead.id, fsPayload as unknown as Record<string, unknown>);
      await logAudit('CREATE_LEAD', 'leads', lead.id, `إضافة عميل محتمل: ${lead.businessName}`, lead.branchId);
      pushToast('success', lang === 'ar' ? 'تمت إضافة العميل المحتمل بنجاح' : 'Lead created');
      return { ok: true };
    },
    [data.leads, defaultMembers, fsCreate, isDemoMode, lang, logAudit, ownerId, pushToast]
  );

  const updateLeadStage = useCallback(
    async (leadId: string, stage: LeadStage, lostReason?: string) => {
      setData((p) => ({
        ...p,
        leads: p.leads.map((l) => (l.id === leadId ? { ...l, stage, lostReason, updatedAt: nowIso() } : l)),
      }));
      await fsUpdate('leads', leadId, { stage, ...(lostReason ? { lostReason } : {}) });
      await logAudit('UPDATE_LEAD_STAGE', 'leads', leadId, `تغيير مرحلة العميل المحتمل إلى ${stage}`);
    },
    [fsUpdate, logAudit]
  );

  const addLeadActivity = useCallback(
    async (leadId: string, type: 'call' | 'meeting' | 'whatsapp' | 'email' | 'note', summary: string) => {
      const act = { id: makeId('act'), type, summary, date: todayIso(), actorUid: ownerId };
      setData((p) => ({
        ...p,
        leads: p.leads.map((l) =>
          l.id === leadId ? { ...l, activities: [act, ...(l.activities ?? [])], updatedAt: nowIso() } : l
        ),
      }));
      pushToast('success', lang === 'ar' ? 'تم تسجيل المتابعة' : 'Activity logged');
    },
    [lang, ownerId, pushToast]
  );

  const convertLeadToClientAndDeal = useCallback(
    async (leadId: string) => {
      const lead = data.leads.find((l) => l.id === leadId);
      if (!lead) return;
      const client: Client = {
        id: makeId('cli'),
        name: lead.businessName,
        industry: lead.industry,
        phone: lead.phone,
        email: lead.email || 'contact@client.eg',
        location: lead.location,
        branchId: lead.branchId,
        accountManagerUid: lead.assignedUid,
        brandNotes: lead.notes,
        status: 'active',
        ownerUid: ownerId,
        memberUids: defaultMembers,
        isDemo: isDemoMode,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      const deal: Deal = {
        id: makeId('deal'),
        title: `صفقة ${lead.businessName}`,
        clientId: client.id,
        leadId: lead.id,
        salespersonUid: lead.assignedUid,
        serviceIds: lead.interestedServices,
        estimatedValuePiasters: lead.estimatedBudgetPiasters,
        proposedValuePiasters: lead.estimatedBudgetPiasters,
        expectedCloseDate: todayIso(),
        probability: 80,
        stage: 'proposal_sent',
        branchId: lead.branchId,
        ownerUid: ownerId,
        memberUids: defaultMembers,
        isDemo: isDemoMode,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      setData((p) => ({
        ...p,
        clients: [client, ...p.clients],
        deals: [deal, ...p.deals],
        leads: p.leads.map((l) => (l.id === leadId ? { ...l, stage: 'won', updatedAt: nowIso() } : l)),
      }));
      await fsCreate('clients', client.id, client as unknown as Record<string, unknown>);
      await fsCreate('deals', deal.id, deal as unknown as Record<string, unknown>);
      await fsUpdate('leads', leadId, { stage: 'won' });
      await logAudit('CONVERT_LEAD', 'clients', client.id, `تحويل ${lead.businessName} إلى عميل وصفقة`, lead.branchId);
      pushToast('success', lang === 'ar' ? 'تم تحويل العميل المحتمل إلى عميل وصفقة بنجاح' : 'Converted lead to client & deal');
    },
    [data.leads, defaultMembers, fsCreate, fsUpdate, isDemoMode, lang, logAudit, ownerId, pushToast]
  );

  const createClient = useCallback(
    async (input: Omit<Client, 'id' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt'>) => {
      const client: Client = {
        ...input,
        id: makeId('cli'),
        ownerUid: ownerId,
        memberUids: defaultMembers,
        isDemo: isDemoMode,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      setData((p) => ({ ...p, clients: [client, ...p.clients] }));
      await fsCreate('clients', client.id, client as unknown as Record<string, unknown>);
      pushToast('success', lang === 'ar' ? 'تمت إضافة العميل' : 'Client created');
    },
    [defaultMembers, fsCreate, isDemoMode, lang, ownerId, pushToast]
  );

  const createDeal = useCallback(
    async (input: Omit<Deal, 'id' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt'>) => {
      const deal: Deal = {
        ...input,
        id: makeId('deal'),
        ownerUid: ownerId,
        memberUids: defaultMembers,
        isDemo: isDemoMode,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      setData((p) => ({ ...p, deals: [deal, ...p.deals] }));
      await fsCreate('deals', deal.id, deal as unknown as Record<string, unknown>);
      pushToast('success', lang === 'ar' ? 'تم إنشاء الصفقة' : 'Deal created');
    },
    [defaultMembers, fsCreate, isDemoMode, lang, ownerId, pushToast]
  );

  const createService = useCallback(
    async (input: Omit<ServiceItem, 'id' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt'>) => {
      const srv: ServiceItem = {
        ...input,
        id: makeId('srv'),
        ownerUid: ownerId,
        memberUids: defaultMembers,
        isDemo: isDemoMode,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      setData((p) => ({ ...p, services: [...p.services, srv] }));
      await fsCreate('services', srv.id, srv as unknown as Record<string, unknown>);
      pushToast('success', lang === 'ar' ? 'تمت إضافة الخدمة للكتالوج' : 'Service added to catalog');
    },
    [defaultMembers, fsCreate, isDemoMode, lang, ownerId, pushToast]
  );

  const createProposal = useCallback(
    async (input: Omit<Proposal, 'id' | 'proposalNumber' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt' | 'requesterUid' | 'version'>) => {
      const prop: Proposal = {
        ...input,
        id: makeId('prop'),
        proposalNumber: `PRP-2026-${String(data.proposals.length + 42).padStart(3, '0')}`,
        requesterUid: ownerId,
        version: 1,
        ownerUid: ownerId,
        memberUids: defaultMembers,
        isDemo: isDemoMode,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      setData((p) => ({ ...p, proposals: [prop, ...p.proposals] }));
      await fsCreate('proposals', prop.id, prop as unknown as Record<string, unknown>);
      if (prop.status === 'pending_approval') {
        const app: ApprovalRequest = {
          id: makeId('app'),
          title: `اعتماد عرض السعر: ${prop.title}`,
          entityType: 'proposal',
          entityId: prop.id,
          amountPiasters: prop.totalPiasters,
          requesterUid: ownerId,
          status: 'pending',
          branchId: prop.branchId,
          ownerUid: ownerId,
          memberUids: defaultMembers,
          isDemo: isDemoMode,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        setData((p) => ({ ...p, approvals: [app, ...p.approvals] }));
        await fsCreate('approvals', app.id, app as unknown as Record<string, unknown>);
      }
      pushToast('success', lang === 'ar' ? 'تم إنشاء عرض السعر' : 'Proposal created');
    },
    [data.proposals.length, defaultMembers, fsCreate, isDemoMode, lang, ownerId, pushToast]
  );

  const decideProposal = useCallback(
    async (proposalId: string, decision: 'approved' | 'rejected') => {
      const prop = data.proposals.find((p) => p.id === proposalId);
      if (!prop) return { ok: false, error: 'Not found' };
      const check = canApproveOperation(prop.requesterUid, currentUser, 'proposals');
      if (!check.allowed) {
        pushToast('error', check.reason ?? 'Forbidden');
        return { ok: false, error: check.reason };
      }
      setData((p) => ({
        ...p,
        proposals: p.proposals.map((pr) =>
          pr.id === proposalId ? { ...pr, status: decision, approverUid: ownerId, updatedAt: nowIso() } : pr
        ),
        approvals: p.approvals.map((a) =>
          a.entityId === proposalId ? { ...a, status: decision, approverUid: ownerId, updatedAt: nowIso() } : a
        ),
      }));
      await fsUpdate('proposals', proposalId, { status: decision, approverUid: ownerId });
      for (const app of data.approvals.filter((a) => a.entityId === proposalId && a.status === 'pending')) {
        await fsUpdate('approvals', app.id, { status: decision, approverUid: ownerId });
      }
      await logAudit(`PROPOSAL_${decision.toUpperCase()}`, 'proposals', proposalId, `قرار عرض السعر ${prop.proposalNumber}: ${decision}`);
      pushToast('success', lang === 'ar' ? 'تم تحديث حالة العرض' : 'Proposal updated');
      return { ok: true };
    },
    [currentUser, data.approvals, data.proposals, fsUpdate, lang, logAudit, ownerId, pushToast]
  );

  const createContractAndProject = useCallback(
    async (input: {
      title: string;
      clientId: string;
      branchId: string;
      accountManagerUid: string;
      serviceIds: string[];
      valuePiasters: number;
      startDate: string;
      endDate: string;
      paymentSchedule: string;
      revisionPolicy: string;
    }) => {
      const cntId = makeId('cnt');
      const contract: Contract = {
        id: cntId,
        contractNumber: `CNT-2026-${String(data.contracts.length + 20).padStart(3, '0')}`,
        title: input.title,
        clientId: input.clientId,
        branchId: input.branchId,
        accountManagerUid: input.accountManagerUid,
        serviceIds: input.serviceIds,
        valuePiasters: input.valuePiasters,
        startDate: input.startDate,
        endDate: input.endDate,
        paymentSchedule: input.paymentSchedule,
        revisionPolicy: input.revisionPolicy,
        signatureStatus: 'fully_executed',
        status: 'active',
        ownerUid: ownerId,
        memberUids: defaultMembers,
        isDemo: isDemoMode,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };

      const firstService = data.services.find((s) => input.serviceIds.includes(s.id)) ?? data.services[0];
      const projId = makeId('proj');
      const project: Project = {
        id: projId,
        name: `مشروع تنفيذ: ${input.title}`,
        clientId: input.clientId,
        contractId: cntId,
        serviceId: firstService?.id,
        branchId: input.branchId,
        departmentId: firstService?.departmentId ?? 'dept-mgmt',
        managerUid: input.accountManagerUid,
        status: 'active',
        priority: 'high',
        startDate: input.startDate,
        dueDate: input.endDate,
        approvedRevenuePiasters: input.valuePiasters,
        estimatedCostPiasters: Math.round(input.valuePiasters * 0.38),
        actualCostPiasters: 0,
        progress: 10,
        deliverables: (firstService?.deliverables ?? ['تسليم المخرجات المعتمدة']).map((title, idx) => ({
          id: makeId(`del-${idx}`),
          title,
          mandatory: true,
          approved: false,
        })),
        ownerUid: ownerId,
        memberUids: defaultMembers,
        isDemo: isDemoMode,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };

      const generatedTasks: Task[] = (firstService?.defaultTasks ?? ['بدء تنفيذ العقد']).map((tTitle, idx) => ({
        id: makeId(`task-${idx}`),
        title: tTitle,
        projectId: projId,
        clientId: input.clientId,
        departmentId: firstService?.departmentId ?? 'dept-mgmt',
        assigneeUid: input.accountManagerUid,
        priority: 'high',
        status: 'ready',
        dueDate: input.endDate,
        checklist: [{ id: makeId('chk'), label: 'التحقق من المعايير القياسية', done: false }],
        revisionCount: 0,
        ownerUid: ownerId,
        memberUids: defaultMembers,
        isDemo: isDemoMode,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      }));

      setData((p) => ({
        ...p,
        contracts: [contract, ...p.contracts],
        projects: [project, ...p.projects],
        tasks: [...generatedTasks, ...p.tasks],
      }));
      await fsCreate('contracts', contract.id, contract as unknown as Record<string, unknown>);
      const fsProj = { ...project };
      delete fsProj.cycleLabel;
      await fsCreate('projects', project.id, fsProj as unknown as Record<string, unknown>);
      for (const t of generatedTasks) {
        const fsTask = { ...t };
        delete fsTask.revisions;
        delete fsTask.comments;
        await fsCreate('tasks', t.id, fsTask as unknown as Record<string, unknown>);
      }
      await triggerWorkflowEvent('approval_granted', contract.id, contract.title);
      await logAudit('ACTIVATE_CONTRACT', 'contracts', contract.id, `تفعيل العقد ${contract.contractNumber} وإنشاء المشروع تلقائياً`, contract.branchId);
      pushToast('success', lang === 'ar' ? 'تم تفعيل العقد وإنشاء المشروع والمهام الافتراضية تلقائياً' : 'Contract activated & project created');
    },
    [data.contracts.length, data.services, defaultMembers, fsCreate, isDemoMode, lang, logAudit, ownerId, pushToast, triggerWorkflowEvent]
  );

  // --- Projects & Tasks ---
  const createProject = useCallback(
    async (input: Omit<Project, 'id' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt'>) => {
      const proj: Project = {
        ...input,
        id: makeId('proj'),
        ownerUid: ownerId,
        memberUids: defaultMembers,
        isDemo: isDemoMode,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      setData((p) => ({ ...p, projects: [proj, ...p.projects] }));
      const fsProj = { ...proj };
      delete fsProj.cycleLabel;
      await fsCreate('projects', proj.id, fsProj as unknown as Record<string, unknown>);
      await logAudit('CREATE_PROJECT', 'projects', proj.id, `إنشاء مشروع: ${proj.name}`, proj.branchId);
      pushToast('success', lang === 'ar' ? 'تم إنشاء المشروع' : 'Project created');
    },
    [defaultMembers, fsCreate, isDemoMode, lang, logAudit, ownerId, pushToast]
  );

  const updateProjectStatus = useCallback(
    async (projectId: string, status: ProjectStatus) => {
      const proj = data.projects.find((p) => p.id === projectId);
      if (!proj) return { ok: false, error: 'Project not found' };
      if (status === 'completed') {
        const check = validateProjectCompletion(proj);
        if (!check.canComplete) {
          const msg =
            lang === 'ar'
              ? `لا يمكن إغلاق المشروع قبل اعتماد المخرجات الإلزامية: ${check.incompleteMandatory.join('، ')}`
              : `Cannot complete project until mandatory deliverables are approved: ${check.incompleteMandatory.join(', ')}`;
          pushToast('error', msg);
          return { ok: false, error: msg };
        }
      }
      setData((p) => ({
        ...p,
        projects: p.projects.map((pr) =>
          pr.id === projectId ? { ...pr, status, progress: status === 'completed' ? 100 : pr.progress, updatedAt: nowIso() } : pr
        ),
      }));
      await fsUpdate('projects', projectId, { status, progress: status === 'completed' ? 100 : proj.progress });
      await logAudit('UPDATE_PROJECT_STATUS', 'projects', projectId, `تغيير حالة المشروع ${proj.name} إلى ${status}`, proj.branchId);
      pushToast('success', lang === 'ar' ? 'تم تحديث حالة المشروع' : 'Project status updated');
      return { ok: true };
    },
    [data.projects, fsUpdate, lang, logAudit, pushToast]
  );

  const toggleDeliverableApproval = useCallback(
    async (projectId: string, deliverableId: string) => {
      const proj = data.projects.find((p) => p.id === projectId);
      if (!proj) return;
      const updatedDeliverables = proj.deliverables.map((d) =>
        d.id === deliverableId ? { ...d, approved: !d.approved } : d
      );
      setData((p) => ({
        ...p,
        projects: p.projects.map((pr) => (pr.id === projectId ? { ...pr, deliverables: updatedDeliverables } : pr)),
      }));
      await fsUpdate('projects', projectId, { deliverables: updatedDeliverables });
    },
    [data.projects, fsUpdate]
  );

  const createTask = useCallback(
    async (input: Omit<Task, 'id' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt' | 'revisionCount'>) => {
      const assignee = data.employees.find((e) => e.uid === input.assigneeUid);
      const validAssignee = validateTaskAssignment(assignee);
      if (!validAssignee.valid) {
        const msg =
          lang === 'ar'
            ? 'لا يمكن إسناد المهمة لموظف غير نشط أو لم يقبل الدعوة.'
            : validAssignee.reason ?? 'Invalid assignee';
        pushToast('error', msg);
        return { ok: false, error: msg };
      }
      const task: Task = {
        ...input,
        id: makeId('task'),
        revisionCount: 0,
        ownerUid: ownerId,
        memberUids: Array.from(new Set([...defaultMembers, input.assigneeUid])),
        isDemo: isDemoMode,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      setData((p) => ({ ...p, tasks: [task, ...p.tasks] }));
      const fsTask = { ...task };
      delete fsTask.revisions;
      delete fsTask.comments;
      await fsCreate('tasks', task.id, fsTask as unknown as Record<string, unknown>);
      pushToast('success', lang === 'ar' ? 'تمت إضافة المهمة' : 'Task created');
      return { ok: true };
    },
    [data.employees, defaultMembers, fsCreate, isDemoMode, lang, ownerId, pushToast]
  );

  const updateTaskStatus = useCallback(
    async (taskId: string, status: TaskStatus) => {
      setData((p) => ({
        ...p,
        tasks: p.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status,
                revisionCount: status === 'revision' ? t.revisionCount + 1 : t.revisionCount,
                updatedAt: nowIso(),
              }
            : t
        ),
      }));
      const target = data.tasks.find((t) => t.id === taskId);
      await fsUpdate('tasks', taskId, {
        status,
        ...(status === 'revision' && target ? { revisionCount: target.revisionCount + 1 } : {}),
      });
    },
    [data.tasks, fsUpdate]
  );

  const toggleTaskChecklist = useCallback(
    async (taskId: string, itemId: string) => {
      const target = data.tasks.find((t) => t.id === taskId);
      if (!target) return;
      const nextChecklist = target.checklist.map((c) => (c.id === itemId ? { ...c, done: !c.done } : c));
      setData((p) => ({
        ...p,
        tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, checklist: nextChecklist } : t)),
      }));
      await fsUpdate('tasks', taskId, { checklist: nextChecklist });
    },
    [data.tasks, fsUpdate]
  );

  const addTaskRevision = useCallback(
    async (taskId: string, reason: string, scopeType: 'in_scope' | 'commercial_change') => {
      const rev = { id: makeId('rev'), requesterUid: ownerId, reason, scopeType, date: todayIso(), status: 'open' as const };
      setData((p) => ({
        ...p,
        tasks: p.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: 'revision',
                revisionCount: t.revisionCount + 1,
                revisions: [rev, ...(t.revisions ?? [])],
                updatedAt: nowIso(),
              }
            : t
        ),
      }));
      const target = data.tasks.find((t) => t.id === taskId);
      await fsUpdate('tasks', taskId, {
        status: 'revision',
        revisionCount: (target?.revisionCount ?? 0) + 1,
      });
      pushToast('info', lang === 'ar' ? 'تم تسجيل طلب التعديل على المهمة' : 'Revision logged');
    },
    [data.tasks, fsUpdate, lang, ownerId, pushToast]
  );

  const addTaskComment = useCallback(
    async (taskId: string, body: string) => {
      const comment = { id: makeId('cmt'), authorUid: ownerId, body, date: todayIso() };
      setData((p) => ({
        ...p,
        tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, comments: [comment, ...(t.comments ?? [])] } : t)),
      }));
    },
    [ownerId]
  );

  // --- Production, Editing, Design, Marketing, Dev ---
  const createShoot = useCallback(
    async (input: Omit<Shoot, 'id' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt'>) => {
      const shoot: Shoot = {
        ...input,
        id: makeId('shoot'),
        ownerUid: ownerId,
        memberUids: defaultMembers,
        isDemo: isDemoMode,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      setData((p) => ({ ...p, shoots: [shoot, ...p.shoots] }));
      await fsCreate('shoots', shoot.id, shoot as unknown as Record<string, unknown>);
      pushToast('success', lang === 'ar' ? 'تمت جدولة يوم التصوير' : 'Shoot scheduled');
    },
    [defaultMembers, fsCreate, isDemoMode, lang, ownerId, pushToast]
  );

  const updateShootStatus = useCallback(
    async (shootId: string, status: Shoot['status']) => {
      const shoot = data.shoots.find((s) => s.id === shootId);
      setData((p) => ({
        ...p,
        shoots: p.shoots.map((s) => (s.id === shootId ? { ...s, status, updatedAt: nowIso() } : s)),
      }));
      await fsUpdate('shoots', shootId, { status });
      if (status === 'handover_completed' && shoot) {
        await triggerWorkflowEvent('shoot_completed', shoot.id, shoot.title);
      }
    },
    [data.shoots, fsUpdate, triggerWorkflowEvent]
  );

  const reserveEquipment = useCallback(
    async (input: Omit<EquipmentReservation, 'id' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt' | 'status'>) => {
      try {
        const conflict = checkEquipmentConflict(
          { assetId: input.assetId, startIso: input.startIso, endIso: input.endIso },
          data.equipmentReservations
        );
        if (conflict.conflict) {
          const msg =
            lang === 'ar'
              ? `تعارض حجز معدة: "${input.assetName}" محجوزة بالفعل خلال هذه الفترة.`
              : `Equipment conflict: ${input.assetName} is already reserved in this window.`;
          pushToast('error', msg);
          return { ok: false, error: msg };
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Invalid reservation dates';
        pushToast('error', msg);
        return { ok: false, error: msg };
      }

      const reservation: EquipmentReservation = {
        ...input,
        id: makeId('eqr'),
        status: 'reserved',
        ownerUid: ownerId,
        memberUids: defaultMembers,
        isDemo: isDemoMode,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      setData((p) => ({
        ...p,
        equipmentReservations: [reservation, ...p.equipmentReservations],
        assets: p.assets.map((a) => (a.id === input.assetId ? { ...a, status: 'reserved' } : a)),
      }));
      await fsCreate('equipmentReservations', reservation.id, reservation as unknown as Record<string, unknown>);
      pushToast('success', lang === 'ar' ? 'تم حجز المعدة بدون تعارضات' : 'Equipment reserved');
      return { ok: true };
    },
    [data.equipmentReservations, defaultMembers, fsCreate, isDemoMode, lang, ownerId, pushToast]
  );

  const createEditingJob = useCallback(
    async (input: Omit<EditingJob, 'id' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt' | 'revisionCount'>) => {
      const job: EditingJob = {
        ...input,
        id: makeId('edt'),
        revisionCount: 0,
        ownerUid: ownerId,
        memberUids: defaultMembers,
        isDemo: isDemoMode,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      setData((p) => ({ ...p, editingJobs: [job, ...p.editingJobs] }));
      await fsCreate('editingJobs', job.id, job as unknown as Record<string, unknown>);
      pushToast('success', lang === 'ar' ? 'تمت إضافة مهمة المونتاج' : 'Editing job added');
    },
    [defaultMembers, fsCreate, isDemoMode, lang, ownerId, pushToast]
  );

  const updateEditingStatus = useCallback(
    async (jobId: string, status: EditingJob['status']) => {
      setData((p) => ({
        ...p,
        editingJobs: p.editingJobs.map((j) =>
          j.id === jobId
            ? { ...j, status, revisionCount: status === 'revision' ? j.revisionCount + 1 : j.revisionCount }
            : j
        ),
      }));
      await fsUpdate('editingJobs', jobId, { status });
    },
    [fsUpdate]
  );

  const createDesignJob = useCallback(
    async (input: Omit<DesignJob, 'id' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt' | 'revisionCount' | 'version'>) => {
      const job: DesignJob = {
        ...input,
        id: makeId('dsn'),
        version: 1,
        revisionCount: 0,
        ownerUid: ownerId,
        memberUids: defaultMembers,
        isDemo: isDemoMode,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      setData((p) => ({ ...p, designJobs: [job, ...p.designJobs] }));
      await fsCreate('designJobs', job.id, job as unknown as Record<string, unknown>);
      pushToast('success', lang === 'ar' ? 'تم إنشاء طلب التصميم' : 'Design job created');
    },
    [defaultMembers, fsCreate, isDemoMode, lang, ownerId, pushToast]
  );

  const updateDesignStatus = useCallback(
    async (jobId: string, status: DesignJob['status']) => {
      setData((p) => ({
        ...p,
        designJobs: p.designJobs.map((j) =>
          j.id === jobId
            ? { ...j, status, revisionCount: status === 'revision' ? j.revisionCount + 1 : j.revisionCount }
            : j
        ),
      }));
      await fsUpdate('designJobs', jobId, { status });
    },
    [fsUpdate]
  );

  const createMarketingItem = useCallback(
    async (input: Omit<MarketingItem, 'id' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt'>) => {
      const item: MarketingItem = {
        ...input,
        id: makeId('mkt'),
        ownerUid: ownerId,
        memberUids: defaultMembers,
        isDemo: isDemoMode,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      setData((p) => ({ ...p, marketingItems: [item, ...p.marketingItems] }));
      await fsCreate('marketingItems', item.id, item as unknown as Record<string, unknown>);
      pushToast('success', lang === 'ar' ? 'تمت إضافة عنصر التسويق' : 'Marketing item added');
    },
    [defaultMembers, fsCreate, isDemoMode, lang, ownerId, pushToast]
  );

  const updateMarketingStatus = useCallback(
    async (itemId: string, status: MarketingItem['status']) => {
      setData((p) => ({
        ...p,
        marketingItems: p.marketingItems.map((m) => (m.id === itemId ? { ...m, status } : m)),
      }));
      await fsUpdate('marketingItems', itemId, { status });
    },
    [fsUpdate]
  );

  const createDevItem = useCallback(
    async (input: Omit<DevItem, 'id' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt'>) => {
      const item: DevItem = {
        ...input,
        id: makeId('dev'),
        ownerUid: ownerId,
        memberUids: defaultMembers,
        isDemo: isDemoMode,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      setData((p) => ({ ...p, devItems: [item, ...p.devItems] }));
      await fsCreate('devItems', item.id, item as unknown as Record<string, unknown>);
      pushToast('success', lang === 'ar' ? 'تمت إضافة عنصر التطوير' : 'Dev item created');
    },
    [defaultMembers, fsCreate, isDemoMode, lang, ownerId, pushToast]
  );

  const updateDevStatus = useCallback(
    async (itemId: string, status: DevItem['status']) => {
      setData((p) => ({
        ...p,
        devItems: p.devItems.map((d) => (d.id === itemId ? { ...d, status } : d)),
      }));
      await fsUpdate('devItems', itemId, { status });
    },
    [fsUpdate]
  );

  // --- Finance & Double-Entry Accounting ---
  const createJournalEntry = useCallback(
    async (input: {
      date: string;
      description: string;
      periodId: string;
      branchId: string;
      lines: JournalLine[];
      status: 'draft' | 'posted';
    }) => {
      const period = data.fiscalPeriods.find((fp) => fp.id === input.periodId);
      const validation = validateJournalEntry(input.lines, period);
      if (!validation.valid) {
        const msg = validation.errors.join(' | ');
        pushToast('error', msg);
        return { ok: false, error: msg };
      }

      const entry: JournalEntry = {
        id: makeId('je'),
        entryNumber: `JE-2026-${String(data.journalEntries.length + 1).padStart(3, '0')}`,
        date: input.date,
        description: input.description,
        periodId: input.periodId,
        branchId: input.branchId,
        referenceType: 'manual',
        status: input.status,
        totalDebitPiasters: validation.totalDebitPiasters,
        totalCreditPiasters: validation.totalCreditPiasters,
        lines: input.lines,
        approvedByUid: input.status === 'posted' ? ownerId : undefined,
        ownerUid: ownerId,
        memberUids: defaultMembers,
        isDemo: isDemoMode,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      setData((p) => ({ ...p, journalEntries: [entry, ...p.journalEntries] }));
      await fsCreate('journalEntries', entry.id, entry as unknown as Record<string, unknown>);
      await logAudit('POST_JOURNAL', 'journalEntries', entry.id, `قيد يومية ${entry.entryNumber} بقيمة ${entry.totalDebitPiasters / 100} ج.م`, entry.branchId);
      pushToast('success', lang === 'ar' ? `تم حفظ القيد ${entry.entryNumber}` : `Journal ${entry.entryNumber} saved`);
      return { ok: true };
    },
    [data.fiscalPeriods, data.journalEntries.length, defaultMembers, fsCreate, isDemoMode, lang, logAudit, ownerId, pushToast]
  );

  const reverseJournalEntry = useCallback(
    async (entryId: string) => {
      const target = data.journalEntries.find((e) => e.id === entryId);
      if (!target) return { ok: false, error: 'Entry not found' };
      if (target.status !== 'posted') {
        const msg = lang === 'ar' ? 'يُعكس فقط القيد المرحّل غير المعكوس سابقاً.' : 'Only posted entries can be reversed.';
        pushToast('error', msg);
        return { ok: false, error: msg };
      }
      const reversalId = makeId('je-rev');
      const revLines = createReversalLines(target.lines);
      const revEntry: JournalEntry = {
        id: reversalId,
        entryNumber: `REV-${target.entryNumber}`,
        date: todayIso(),
        description: `قيد عكسي لـ ${target.entryNumber}: ${target.description}`,
        periodId: target.periodId,
        branchId: target.branchId,
        referenceType: 'reversal',
        referenceId: target.id,
        status: 'posted',
        totalDebitPiasters: target.totalCreditPiasters,
        totalCreditPiasters: target.totalDebitPiasters,
        lines: revLines,
        approvedByUid: ownerId,
        ownerUid: ownerId,
        memberUids: defaultMembers,
        isDemo: isDemoMode,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };

      setData((p) => ({
        ...p,
        journalEntries: [
          revEntry,
          ...p.journalEntries.map((e) =>
            e.id === entryId ? { ...e, status: 'reversed' as const, reversedEntryId: reversalId, updatedAt: nowIso() } : e
          ),
        ],
      }));
      await fsCreate('journalEntries', revEntry.id, revEntry as unknown as Record<string, unknown>);
      await fsUpdate('journalEntries', entryId, { status: 'reversed', reversedEntryId: reversalId });
      await logAudit('REVERSE_JOURNAL', 'journalEntries', entryId, `عكس القيد ${target.entryNumber} بقيد ${revEntry.entryNumber}`, target.branchId);
      pushToast('success', lang === 'ar' ? `تم إنشاء القيد العكسي ${revEntry.entryNumber}` : `Created reversal ${revEntry.entryNumber}`);
      return { ok: true };
    },
    [data.journalEntries, defaultMembers, fsCreate, fsUpdate, isDemoMode, lang, logAudit, ownerId, pushToast]
  );

  const toggleFiscalPeriod = useCallback(
    async (periodId: string) => {
      const target = data.fiscalPeriods.find((p) => p.id === periodId);
      if (!target) return;
      const nextStatus = target.status === 'open' ? 'closed' : 'open';
      setData((p) => ({
        ...p,
        fiscalPeriods: p.fiscalPeriods.map((fp) => (fp.id === periodId ? { ...fp, status: nextStatus } : fp)),
      }));
      await fsUpdate('fiscalPeriods', periodId, { status: nextStatus });
      pushToast('info', lang === 'ar' ? `تم تغيير حالة الفترة إلى ${nextStatus}` : `Fiscal period ${nextStatus}`);
    },
    [data.fiscalPeriods, fsUpdate, lang, pushToast]
  );

  const createInvoice = useCallback(
    async (input: Omit<Invoice, 'id' | 'invoiceNumber' | 'paidPiasters' | 'status' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt'>) => {
      const inv: Invoice = {
        ...input,
        id: makeId('inv'),
        invoiceNumber: `INV-2026-${String(data.invoices.length + 104)}`,
        paidPiasters: 0,
        status: computeInvoiceStatus(input.totalPiasters, 0, input.dueDate, todayIso(), false),
        ownerUid: ownerId,
        memberUids: defaultMembers,
        isDemo: isDemoMode,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };

      const openPeriod = data.fiscalPeriods.find((fp) => fp.status === 'open') ?? data.fiscalPeriods[0];
      const je: JournalEntry = {
        id: makeId('je'),
        entryNumber: `JE-2026-${String(data.journalEntries.length + 1).padStart(3, '0')}`,
        date: inv.issueDate,
        description: `إثبات فاتورة مبيعات ${inv.invoiceNumber}`,
        periodId: openPeriod?.id ?? 'fp-2026-11',
        branchId: inv.branchId,
        referenceType: 'invoice',
        referenceId: inv.id,
        status: 'posted',
        totalDebitPiasters: inv.totalPiasters,
        totalCreditPiasters: inv.totalPiasters,
        lines: [
          { accountId: 'acc-1201', accountCode: '1201', accountName: 'الذمم المدينة (العملاء)', debitPiasters: inv.totalPiasters, creditPiasters: 0, projectId: inv.projectId },
          { accountId: 'acc-4101', accountCode: '4101', accountName: 'إيرادات الإنتاج والتسويق والتطوير', debitPiasters: 0, creditPiasters: inv.totalPiasters, projectId: inv.projectId },
        ],
        approvedByUid: ownerId,
        ownerUid: ownerId,
        memberUids: defaultMembers,
        isDemo: isDemoMode,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };

      setData((p) => ({
        ...p,
        invoices: [inv, ...p.invoices],
        journalEntries: [je, ...p.journalEntries],
      }));
      await fsCreate('invoices', inv.id, inv as unknown as Record<string, unknown>);
      await fsCreate('journalEntries', je.id, je as unknown as Record<string, unknown>);
      pushToast('success', lang === 'ar' ? `تم إصدار الفاتورة ${inv.invoiceNumber} وترحيل قيدها` : `Invoice ${inv.invoiceNumber} issued`);
    },
    [data.fiscalPeriods, data.invoices.length, data.journalEntries.length, defaultMembers, fsCreate, isDemoMode, lang, ownerId, pushToast]
  );

  const recordInvoicePayment = useCallback(
    async (input: { invoiceId: string; treasuryAccountId: string; amountPiasters: number; method: Payment['method']; referenceCode: string; date: string }) => {
      const inv = data.invoices.find((i) => i.id === input.invoiceId);
      const trAcc = data.treasuryAccounts.find((t) => t.id === input.treasuryAccountId);
      if (!inv || !trAcc) return { ok: false, error: 'Invoice or treasury account not found' };
      const remaining = inv.totalPiasters - inv.paidPiasters;
      if (input.amountPiasters <= 0 || input.amountPiasters > remaining) {
        const msg = lang === 'ar' ? 'المبلغ المدخل غير صالح أو يتجاوز المتبقي على الفاتورة.' : 'Payment exceeds remaining invoice balance.';
        pushToast('error', msg);
        return { ok: false, error: msg };
      }

      const nextPaid = inv.paidPiasters + input.amountPiasters;
      const nextStatus = computeInvoiceStatus(inv.totalPiasters, nextPaid, inv.dueDate, todayIso(), false);
      const payment: Payment = {
        id: makeId('pay'),
        paymentNumber: `REC-2026-${String(data.payments.length + 83).padStart(3, '0')}`,
        direction: 'inbound',
        invoiceId: inv.id,
        clientId: inv.clientId,
        treasuryAccountId: trAcc.id,
        branchId: inv.branchId,
        amountPiasters: input.amountPiasters,
        date: input.date,
        method: input.method,
        referenceCode: input.referenceCode,
        ownerUid: ownerId,
        memberUids: defaultMembers,
        isDemo: isDemoMode,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };

      const glCash = data.accounts.find((a) => a.id === trAcc.glAccountId) ?? data.accounts[1];
      const openPeriod = data.fiscalPeriods.find((fp) => fp.status === 'open') ?? data.fiscalPeriods[0];
      const je: JournalEntry = {
        id: makeId('je'),
        entryNumber: `JE-2026-${String(data.journalEntries.length + 1).padStart(3, '0')}`,
        date: input.date,
        description: `تحصيل دفعة ${payment.paymentNumber} على فاتورة ${inv.invoiceNumber}`,
        periodId: openPeriod?.id ?? 'fp-2026-11',
        branchId: inv.branchId,
        referenceType: 'payment',
        referenceId: payment.id,
        status: 'posted',
        totalDebitPiasters: input.amountPiasters,
        totalCreditPiasters: input.amountPiasters,
        lines: [
          { accountId: glCash.id, accountCode: glCash.code, accountName: glCash.name, debitPiasters: input.amountPiasters, creditPiasters: 0 },
          { accountId: 'acc-1201', accountCode: '1201', accountName: 'الذمم المدينة (العملاء)', debitPiasters: 0, creditPiasters: input.amountPiasters },
        ],
        approvedByUid: ownerId,
        ownerUid: ownerId,
        memberUids: defaultMembers,
        isDemo: isDemoMode,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };

      setData((p) => ({
        ...p,
        invoices: p.invoices.map((i) => (i.id === inv.id ? { ...i, paidPiasters: nextPaid, status: nextStatus } : i)),
        payments: [payment, ...p.payments],
        treasuryAccounts: p.treasuryAccounts.map((t) =>
          t.id === trAcc.id ? { ...t, balancePiasters: t.balancePiasters + input.amountPiasters } : t
        ),
        journalEntries: [je, ...p.journalEntries],
      }));
      await fsCreate('payments', payment.id, payment as unknown as Record<string, unknown>);
      await fsUpdate('invoices', inv.id, { paidPiasters: nextPaid, status: nextStatus });
      await fsUpdate('treasuryAccounts', trAcc.id, { balancePiasters: trAcc.balancePiasters + input.amountPiasters });
      await fsCreate('journalEntries', je.id, je as unknown as Record<string, unknown>);
      pushToast('success', lang === 'ar' ? `تم تسجيل التحصيل ${payment.paymentNumber}` : `Recorded payment ${payment.paymentNumber}`);
      return { ok: true };
    },
    [data.accounts, data.fiscalPeriods, data.invoices, data.journalEntries.length, data.payments.length, data.treasuryAccounts, defaultMembers, fsCreate, fsUpdate, isDemoMode, lang, ownerId, pushToast]
  );

  const createExpense = useCallback(
    async (input: Omit<Expense, 'id' | 'requesterUid' | 'status' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt'>) => {
      const exp: Expense = {
        ...input,
        id: makeId('exp'),
        requesterUid: ownerId,
        status: 'submitted',
        ownerUid: ownerId,
        memberUids: defaultMembers,
        isDemo: isDemoMode,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      const app: ApprovalRequest = {
        id: makeId('app'),
        title: `اعتماد مصروف: ${exp.description}`,
        entityType: 'expense',
        entityId: exp.id,
        amountPiasters: exp.amountPiasters,
        requesterUid: ownerId,
        status: 'pending',
        branchId: exp.branchId,
        ownerUid: ownerId,
        memberUids: defaultMembers,
        isDemo: isDemoMode,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      setData((p) => ({ ...p, expenses: [exp, ...p.expenses], approvals: [app, ...p.approvals] }));
      await fsCreate('expenses', exp.id, exp as unknown as Record<string, unknown>);
      await fsCreate('approvals', app.id, app as unknown as Record<string, unknown>);
      pushToast('success', lang === 'ar' ? 'تم إرسال المصروف للاعتماد (فصل المهام مفعل)' : 'Expense submitted for SoD approval');
    },
    [defaultMembers, fsCreate, isDemoMode, lang, ownerId, pushToast]
  );

  const decideExpense = useCallback(
    async (expenseId: string, decision: 'approved' | 'rejected', comment?: string) => {
      const exp = data.expenses.find((e) => e.id === expenseId);
      if (!exp) return { ok: false, error: 'Expense not found' };
      const check = canApproveOperation(exp.requesterUid, currentUser, 'finance');
      if (!check.allowed) {
        const msg =
          lang === 'ar'
            ? 'انتهاك فصل المهام (SoD): لا يمكنك اعتماد مصروف قمت أنت بطلبه.'
            : check.reason ?? 'SoD violation';
        pushToast('error', msg);
        return { ok: false, error: msg };
      }

      let newJe: JournalEntry | null = null;
      if (decision === 'approved') {
        const openPeriod = data.fiscalPeriods.find((fp) => fp.status === 'open') ?? data.fiscalPeriods[0];
        const expenseAcc = exp.projectId ? data.accounts.find((a) => a.code === '5101') : data.accounts.find((a) => a.code === '5201');
        const cashAcc = data.accounts.find((a) => a.code === '1102') ?? data.accounts[0];
        if (expenseAcc && cashAcc) {
          newJe = {
            id: makeId('je'),
            entryNumber: `JE-2026-${String(data.journalEntries.length + 1).padStart(3, '0')}`,
            date: exp.date,
            description: `قيد مصروف معتمد: ${exp.description}`,
            periodId: openPeriod?.id ?? 'fp-2026-11',
            branchId: exp.branchId,
            referenceType: 'expense',
            referenceId: exp.id,
            status: 'posted',
            totalDebitPiasters: exp.amountPiasters,
            totalCreditPiasters: exp.amountPiasters,
            lines: [
              { accountId: expenseAcc.id, accountCode: expenseAcc.code, accountName: expenseAcc.name, debitPiasters: exp.amountPiasters, creditPiasters: 0, projectId: exp.projectId },
              { accountId: cashAcc.id, accountCode: cashAcc.code, accountName: cashAcc.name, debitPiasters: 0, creditPiasters: exp.amountPiasters },
            ],
            approvedByUid: ownerId,
            ownerUid: ownerId,
            memberUids: defaultMembers,
            isDemo: isDemoMode,
            createdAt: nowIso(),
            updatedAt: nowIso(),
          };
        }
      }

      setData((p) => ({
        ...p,
        expenses: p.expenses.map((e) =>
          e.id === expenseId
            ? { ...e, status: decision === 'approved' ? 'posted' : 'rejected', approverUid: ownerId, approvalComment: comment, journalEntryId: newJe?.id }
            : e
        ),
        approvals: p.approvals.map((a) =>
          a.entityId === expenseId ? { ...a, status: decision, approverUid: ownerId, comment } : a
        ),
        projects:
          decision === 'approved' && exp.projectId
            ? p.projects.map((pr) =>
                pr.id === exp.projectId ? { ...pr, actualCostPiasters: pr.actualCostPiasters + exp.amountPiasters } : pr
              )
            : p.projects,
        journalEntries: newJe ? [newJe, ...p.journalEntries] : p.journalEntries,
      }));
      await fsUpdate('expenses', expenseId, {
        status: decision === 'approved' ? 'posted' : 'rejected',
        approverUid: ownerId,
        ...(comment ? { approvalComment: comment } : {}),
        ...(newJe ? { journalEntryId: newJe.id } : {}),
      });
      for (const app of data.approvals.filter((a) => a.entityId === expenseId && a.status === 'pending')) {
        await fsUpdate('approvals', app.id, {
          status: decision,
          approverUid: ownerId,
          ...(comment ? { comment } : {}),
        });
      }
      if (decision === 'approved' && exp.projectId) {
        const linkedProject = data.projects.find((pr) => pr.id === exp.projectId);
        if (linkedProject) {
          await fsUpdate('projects', linkedProject.id, {
            actualCostPiasters: linkedProject.actualCostPiasters + exp.amountPiasters,
          });
        }
      }
      if (newJe) await fsCreate('journalEntries', newJe.id, newJe as unknown as Record<string, unknown>);
      await logAudit(`EXPENSE_${decision.toUpperCase()}`, 'expenses', expenseId, `قرار المصروف: ${exp.description}`, exp.branchId);
      pushToast('success', lang === 'ar' ? (decision === 'approved' ? 'تم اعتماد المصروف وترحيل قيده' : 'تم رفض المصروف') : `Expense ${decision}`);
      return { ok: true };
    },
    [currentUser, data.accounts, data.approvals, data.expenses, data.fiscalPeriods, data.journalEntries.length, data.projects, defaultMembers, fsCreate, fsUpdate, isDemoMode, lang, logAudit, ownerId, pushToast]
  );

  const createTreasuryTransfer = useCallback(
    async (input: { fromAccountId: string; toAccountId: string; amountPiasters: number; date: string; memo: string }) => {
      if (input.fromAccountId === input.toAccountId) {
        const msg = lang === 'ar' ? 'يجب اختيار حسابين مختلفين للتحويل.' : 'Source and destination accounts must differ.';
        pushToast('error', msg);
        return { ok: false, error: msg };
      }
      const fromAcc = data.treasuryAccounts.find((t) => t.id === input.fromAccountId);
      const toAcc = data.treasuryAccounts.find((t) => t.id === input.toAccountId);
      if (!fromAcc || !toAcc || input.amountPiasters <= 0 || fromAcc.balancePiasters < input.amountPiasters) {
        const msg = lang === 'ar' ? 'رصيد الحساب المحول منه غير كافٍ.' : 'Insufficient balance for transfer.';
        pushToast('error', msg);
        return { ok: false, error: msg };
      }

      const glFrom = data.accounts.find((a) => a.id === fromAcc.glAccountId) ?? data.accounts[0];
      const glTo = data.accounts.find((a) => a.id === toAcc.glAccountId) ?? data.accounts[1];
      const openPeriod = data.fiscalPeriods.find((fp) => fp.status === 'open') ?? data.fiscalPeriods[0];

      const je: JournalEntry = {
        id: makeId('je'),
        entryNumber: `JE-2026-${String(data.journalEntries.length + 1).padStart(3, '0')}`,
        date: input.date,
        description: `تحويل نقدي داخلي: ${fromAcc.name} -> ${toAcc.name}`,
        periodId: openPeriod?.id ?? 'fp-2026-11',
        branchId: toAcc.branchId,
        referenceType: 'transfer',
        status: 'posted',
        totalDebitPiasters: input.amountPiasters,
        totalCreditPiasters: input.amountPiasters,
        lines: [
          { accountId: glTo.id, accountCode: glTo.code, accountName: glTo.name, debitPiasters: input.amountPiasters, creditPiasters: 0 },
          { accountId: glFrom.id, accountCode: glFrom.code, accountName: glFrom.name, debitPiasters: 0, creditPiasters: input.amountPiasters },
        ],
        approvedByUid: ownerId,
        ownerUid: ownerId,
        memberUids: defaultMembers,
        isDemo: isDemoMode,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };

      const tr: TreasuryTransfer = {
        id: makeId('trf'),
        ...input,
        journalEntryId: je.id,
        ownerUid: ownerId,
        memberUids: defaultMembers,
        isDemo: isDemoMode,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };

      setData((p) => ({
        ...p,
        treasuryAccounts: p.treasuryAccounts.map((t) =>
          t.id === fromAcc.id
            ? { ...t, balancePiasters: t.balancePiasters - input.amountPiasters }
            : t.id === toAcc.id
              ? { ...t, balancePiasters: t.balancePiasters + input.amountPiasters }
              : t
        ),
        treasuryTransfers: [tr, ...p.treasuryTransfers],
        journalEntries: [je, ...p.journalEntries],
      }));
      await fsCreate('treasuryTransfers', tr.id, tr as unknown as Record<string, unknown>);
      await fsCreate('journalEntries', je.id, je as unknown as Record<string, unknown>);
      await fsUpdate('treasuryAccounts', fromAcc.id, { balancePiasters: fromAcc.balancePiasters - input.amountPiasters });
      await fsUpdate('treasuryAccounts', toAcc.id, { balancePiasters: toAcc.balancePiasters + input.amountPiasters });
      pushToast('success', lang === 'ar' ? 'تم تنفيذ التحويل الداخلي دون تضخيم الإيرادات أو المصروفات' : 'Internal transfer completed');
      return { ok: true };
    },
    [data.accounts, data.fiscalPeriods, data.journalEntries.length, data.treasuryAccounts, defaultMembers, fsCreate, fsUpdate, isDemoMode, lang, ownerId, pushToast]
  );

  // --- Procurement & Assets ---
  const createProcurementRequest = useCallback(
    async (input: Omit<ProcurementRequest, 'id' | 'requestNumber' | 'requesterUid' | 'status' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt'>) => {
      const pr: ProcurementRequest = {
        ...input,
        id: makeId('po'),
        requestNumber: `PR-2026-${String(data.procurementRequests.length + 15).padStart(3, '0')}`,
        requesterUid: ownerId,
        status: 'requested',
        ownerUid: ownerId,
        memberUids: defaultMembers,
        isDemo: isDemoMode,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      setData((p) => ({ ...p, procurementRequests: [pr, ...p.procurementRequests] }));
      await fsCreate('procurementRequests', pr.id, pr as unknown as Record<string, unknown>);
      pushToast('success', lang === 'ar' ? 'تم تسجيل طلب الشراء' : 'Purchase request submitted');
    },
    [data.procurementRequests.length, defaultMembers, fsCreate, isDemoMode, lang, ownerId, pushToast]
  );

  const advanceProcurement = useCallback(
    async (id: string, nextStatus: ProcurementRequest['status']) => {
      const pr = data.procurementRequests.find((p) => p.id === id);
      if (!pr) return { ok: false, error: 'Not found' };
      if (nextStatus === 'approved' || nextStatus === 'rejected') {
        const check = canApproveOperation(pr.requesterUid, currentUser, 'procurement');
        if (!check.allowed) {
          pushToast('error', check.reason ?? 'SoD violation');
          return { ok: false, error: check.reason };
        }
      }
      setData((p) => ({
        ...p,
        procurementRequests: p.procurementRequests.map((x) =>
          x.id === id ? { ...x, status: nextStatus, approverUid: nextStatus === 'approved' ? ownerId : x.approverUid } : x
        ),
      }));
      await fsUpdate('procurementRequests', id, { status: nextStatus });
      pushToast('success', lang === 'ar' ? 'تم تحديث مرحلة طلب الشراء' : 'Procurement updated');
      return { ok: true };
    },
    [currentUser, data.procurementRequests, fsUpdate, lang, ownerId, pushToast]
  );

  const createAsset = useCallback(
    async (input: Omit<Asset, 'id' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt'>) => {
      const asset: Asset = {
        ...input,
        id: makeId('ast'),
        ownerUid: ownerId,
        memberUids: defaultMembers,
        isDemo: isDemoMode,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      setData((p) => ({ ...p, assets: [asset, ...p.assets] }));
      await fsCreate('assets', asset.id, asset as unknown as Record<string, unknown>);
      pushToast('success', lang === 'ar' ? 'تمت إضافة الأصل للسجل' : 'Asset added');
    },
    [defaultMembers, fsCreate, isDemoMode, lang, ownerId, pushToast]
  );

  const updateAssetStatus = useCallback(
    async (assetId: string, status: Asset['status'], branchId?: string) => {
      setData((p) => ({
        ...p,
        assets: p.assets.map((a) => (a.id === assetId ? { ...a, status, branchId: branchId ?? a.branchId } : a)),
      }));
      await fsUpdate('assets', assetId, { status, ...(branchId ? { branchId } : {}) });
    },
    [fsUpdate]
  );

  // --- HR ---
  const checkInAttendance = useCallback(
    async (workMode: AttendanceRecord['workMode'], notes?: string) => {
      const nowTime = new Date().toTimeString().slice(0, 5);
      const rec: AttendanceRecord = {
        id: makeId('att'),
        employeeUid: ownerId,
        branchId: currentUser?.branchIds[0] ?? 'br-cairo',
        date: todayIso(),
        workMode,
        checkInTime: nowTime,
        notes,
        ownerUid: ownerId,
        memberUids: defaultMembers,
        isDemo: isDemoMode,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      setData((p) => ({ ...p, attendanceRecords: [rec, ...p.attendanceRecords] }));
      await fsCreate('attendanceRecords', rec.id, rec as unknown as Record<string, unknown>);
      pushToast('success', lang === 'ar' ? `تم تسجيل حضورك (${workMode}) الساعة ${nowTime}` : `Checked in (${workMode}) at ${nowTime}`);
    },
    [currentUser?.branchIds, defaultMembers, fsCreate, isDemoMode, lang, ownerId, pushToast]
  );

  const createLeaveRequest = useCallback(
    async (input: Omit<LeaveRequest, 'id' | 'employeeUid' | 'status' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt'>) => {
      const lv: LeaveRequest = {
        ...input,
        id: makeId('lv'),
        employeeUid: ownerId,
        status: 'pending',
        ownerUid: ownerId,
        memberUids: defaultMembers,
        isDemo: isDemoMode,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      const app: ApprovalRequest = {
        id: makeId('app'),
        title: `طلب إجازة: ${currentUser?.fullName ?? ownerId}`,
        entityType: 'leave',
        entityId: lv.id,
        requesterUid: ownerId,
        status: 'pending',
        branchId: lv.branchId,
        ownerUid: ownerId,
        memberUids: defaultMembers,
        isDemo: isDemoMode,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      setData((p) => ({ ...p, leaveRequests: [lv, ...p.leaveRequests], approvals: [app, ...p.approvals] }));
      await fsCreate('leaveRequests', lv.id, lv as unknown as Record<string, unknown>);
      await fsCreate('approvals', app.id, app as unknown as Record<string, unknown>);
      pushToast('success', lang === 'ar' ? 'تم تقديم طلب الإجازة' : 'Leave request submitted');
    },
    [currentUser?.fullName, defaultMembers, fsCreate, isDemoMode, lang, ownerId, pushToast]
  );

  const decideLeaveRequest = useCallback(
    async (leaveId: string, decision: 'approved' | 'rejected') => {
      const lv = data.leaveRequests.find((l) => l.id === leaveId);
      if (!lv) return { ok: false, error: 'Not found' };
      const check = canApproveOperation(lv.employeeUid, currentUser, 'hr');
      if (!check.allowed) {
        pushToast('error', check.reason ?? 'SoD violation');
        return { ok: false, error: check.reason };
      }
      setData((p) => ({
        ...p,
        leaveRequests: p.leaveRequests.map((l) => (l.id === leaveId ? { ...l, status: decision, approverUid: ownerId } : l)),
        approvals: p.approvals.map((a) => (a.entityId === leaveId ? { ...a, status: decision, approverUid: ownerId } : a)),
      }));
      await fsUpdate('leaveRequests', leaveId, { status: decision, approverUid: ownerId });
      for (const app of data.approvals.filter((a) => a.entityId === leaveId && a.status === 'pending')) {
        await fsUpdate('approvals', app.id, { status: decision, approverUid: ownerId });
      }
      pushToast('success', lang === 'ar' ? 'تم تحديث طلب الإجازة' : 'Leave request updated');
      return { ok: true };
    },
    [currentUser, data.approvals, data.leaveRequests, fsUpdate, lang, ownerId, pushToast]
  );

  const approvePayrollRun = useCallback(
    async (payrollId: string) => {
      if (!hasPermission(currentUser, 'hr', 'approve')) {
        const msg = lang === 'ar' ? 'ليست لديك صلاحية اعتماد مسير الرواتب.' : 'Lacks payroll approval permission.';
        pushToast('error', msg);
        return { ok: false, error: msg };
      }
      setData((p) => ({
        ...p,
        payrollRuns: p.payrollRuns.map((pr) => (pr.id === payrollId ? { ...pr, status: 'approved', approvedByUid: ownerId } : pr)),
      }));
      await fsUpdate('payrollRuns', payrollId, { status: 'approved', approvedByUid: ownerId });
      pushToast('success', lang === 'ar' ? 'تم اعتماد مسير الرواتب' : 'Payroll run approved');
      return { ok: true };
    },
    [currentUser, fsUpdate, lang, ownerId, pushToast]
  );

  // --- Support, Files, KB, Automation ---
  const createSupportTicket = useCallback(
    async (input: Omit<SupportTicket, 'id' | 'ticketNumber' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt'>) => {
      const tkt: SupportTicket = {
        ...input,
        id: makeId('tkt'),
        ticketNumber: `SUP-2026-${String(data.supportTickets.length + 33).padStart(3, '0')}`,
        ownerUid: ownerId,
        memberUids: defaultMembers,
        isDemo: isDemoMode,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      setData((p) => ({ ...p, supportTickets: [tkt, ...p.supportTickets] }));
      await fsCreate('supportTickets', tkt.id, tkt as unknown as Record<string, unknown>);
      pushToast('success', lang === 'ar' ? 'تم فتح تذكرة الدعم' : 'Support ticket opened');
    },
    [data.supportTickets.length, defaultMembers, fsCreate, isDemoMode, lang, ownerId, pushToast]
  );

  const updateTicketStatus = useCallback(
    async (ticketId: string, status: SupportTicket['status'], lastMessage?: string) => {
      setData((p) => ({
        ...p,
        supportTickets: p.supportTickets.map((t) =>
          t.id === ticketId ? { ...t, status, lastMessage: lastMessage ?? t.lastMessage } : t
        ),
      }));
      await fsUpdate('supportTickets', ticketId, { status, ...(lastMessage ? { lastMessage } : {}) });
    },
    [fsUpdate]
  );

  const createFileRecord = useCallback(
    async (input: Omit<FileRecord, 'id' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt'>) => {
      const file: FileRecord = {
        ...input,
        id: makeId('fil'),
        ownerUid: ownerId,
        memberUids: defaultMembers,
        isDemo: isDemoMode,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      setData((p) => ({ ...p, files: [file, ...p.files] }));
      await fsCreate('files', file.id, file as unknown as Record<string, unknown>);
      pushToast('success', lang === 'ar' ? 'تمت أرشفة الملف في المكتبة' : 'File indexed');
    },
    [defaultMembers, fsCreate, isDemoMode, lang, ownerId, pushToast]
  );

  const createKnowledgeArticle = useCallback(
    async (input: Omit<KnowledgeArticle, 'id' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt'>) => {
      const art: KnowledgeArticle = {
        ...input,
        id: makeId('kb'),
        ownerUid: ownerId,
        memberUids: defaultMembers,
        isDemo: isDemoMode,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      setData((p) => ({ ...p, knowledgeArticles: [art, ...p.knowledgeArticles] }));
      await fsCreate('knowledgeArticles', art.id, art as unknown as Record<string, unknown>);
      pushToast('success', lang === 'ar' ? 'تم نشر المقال في قاعدة المعرفة' : 'Article published');
    },
    [defaultMembers, fsCreate, isDemoMode, lang, ownerId, pushToast]
  );

  const createWorkflowRule = useCallback(
    async (input: Omit<WorkflowRule, 'id' | 'runCount' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt'>) => {
      const wf: WorkflowRule = {
        ...input,
        id: makeId('wf'),
        runCount: 0,
        ownerUid: ownerId,
        memberUids: defaultMembers,
        isDemo: isDemoMode,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      setData((p) => ({ ...p, workflows: [wf, ...p.workflows] }));
      await fsCreate('workflows', wf.id, wf as unknown as Record<string, unknown>);
      pushToast('success', lang === 'ar' ? 'تم حفظ قاعدة الأتمتة' : 'Workflow rule saved');
    },
    [defaultMembers, fsCreate, isDemoMode, lang, ownerId, pushToast]
  );

  const toggleWorkflowRule = useCallback(
    async (workflowId: string) => {
      const wf = data.workflows.find((w) => w.id === workflowId);
      if (!wf) return;
      setData((p) => ({
        ...p,
        workflows: p.workflows.map((w) => (w.id === workflowId ? { ...w, enabled: !w.enabled } : w)),
      }));
      await fsUpdate('workflows', workflowId, { enabled: !wf.enabled });
    },
    [data.workflows, fsUpdate]
  );

  const decideApproval = useCallback(
    async (approvalId: string, decision: 'approved' | 'rejected', comment?: string) => {
      const app = data.approvals.find((a) => a.id === approvalId);
      if (!app) return { ok: false, error: 'Approval not found' };

      if (app.entityType === 'expense') return decideExpense(app.entityId, decision, comment);
      if (app.entityType === 'proposal') return decideProposal(app.entityId, decision);
      if (app.entityType === 'leave') return decideLeaveRequest(app.entityId, decision);

      const check = canApproveOperation(app.requesterUid, currentUser, 'workspace');
      if (!check.allowed) {
        pushToast('error', check.reason ?? 'SoD violation');
        return { ok: false, error: check.reason };
      }
      setData((p) => ({
        ...p,
        approvals: p.approvals.map((a) =>
          a.id === approvalId ? { ...a, status: decision, approverUid: ownerId, comment } : a
        ),
      }));
      await fsUpdate('approvals', approvalId, {
        status: decision,
        approverUid: ownerId,
        ...(comment ? { comment } : {}),
      });
      return { ok: true };
    },
    [currentUser, data.approvals, decideExpense, decideLeaveRequest, decideProposal, fsUpdate, ownerId, pushToast]
  );

  const markNotificationRead = useCallback(
    async (notificationId: string) => {
      setData((p) => ({
        ...p,
        notifications: p.notifications.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
      }));
      if (isDemoMode || !authUser) return;

      const notifRef = doc(db, 'notifications', notificationId);
      let existsInFirestore = false;
      try {
        const snap = await getDoc(notifRef);
        existsInFirestore = snap.exists();
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `notifications/${notificationId}`);
      }

      if (existsInFirestore) {
        await fsUpdate('notifications', notificationId, { read: true });
      } else {
        const localNotif = data.notifications.find((n) => n.id === notificationId);
        if (localNotif) {
          await fsCreate('notifications', notificationId, {
            ...localNotif,
            read: true,
            isDemo: false,
            ownerUid: authUser.uid,
            memberUids: localNotif.memberUids?.length ? localNotif.memberUids : [authUser.uid],
          } as unknown as Record<string, unknown>);
        }
      }
    },
    [authUser, data.notifications, fsCreate, fsUpdate, isDemoMode]
  );

  const seedDemoInFirestore = useCallback(async () => {
    if (isDemoMode || !authUser) {
      resetDemoSandbox();
      return;
    }
    const demo = buildDemoDataset(authUser.uid);
    const batch = writeBatch(db);

    const writeCollectionItems = (colName: string, items: Array<{ id: string }>) => {
      for (const item of items) {
        const clone = { ...(item as Record<string, unknown>) };
        delete clone.activities;
        delete clone.revisions;
        delete clone.comments;
        delete clone.cycleLabel;
        if (typeof clone.projectId === 'string' && !clone.projectId.startsWith('demo-')) {
          clone.projectId = `demo-${clone.projectId}`;
        }
        if (typeof clone.clientId === 'string' && !clone.clientId.startsWith('demo-')) {
          clone.clientId = `demo-${clone.clientId}`;
        }
        batch.set(doc(db, colName, `demo-${item.id}`), {
          ...stripUndefined(clone),
          id: `demo-${item.id}`,
          isDemo: true,
          ownerUid: authUser.uid,
          memberUids: [authUser.uid],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    };

    writeCollectionItems('clients', demo.clients);
    writeCollectionItems('leads', demo.leads);
    writeCollectionItems('projects', demo.projects);
    writeCollectionItems('tasks', demo.tasks);
    writeCollectionItems('invoices', demo.invoices);
    writeCollectionItems('expenses', demo.expenses);
    await batch.commit();
    pushToast('success', lang === 'ar' ? 'تمت إضافة حزمة بيانات تجريبية معزولة (isDemo: true)' : 'Isolated demo batch seeded');
  }, [authUser, isDemoMode, lang, pushToast, resetDemoSandbox]);

  const clearDemoInFirestore = useCallback(async () => {
    if (isDemoMode || !authUser) {
      setData(EMPTY_DATASET(ownerId));
      pushToast('info', lang === 'ar' ? 'تم تفريغ بيانات العرض في الذاكرة' : 'Sandbox cleared');
      return;
    }
    const cols = ['clients', 'leads', 'projects', 'tasks', 'invoices', 'expenses'] as const;
    for (const c of cols) {
      const list = data[c].filter((x) => x.isDemo);
      for (const item of list) {
        await deleteDoc(doc(db, c, item.id));
      }
    }
    pushToast('success', lang === 'ar' ? 'تم حذف جميع السجلات التجريبية المعلمة بـ isDemo' : 'Demo records cleared');
  }, [authUser, data, isDemoMode, lang, ownerId, pushToast]);

  const value: OSContextValue = {
    loading,
    authUser,
    currentUser,
    isDemoMode,
    firebaseOnline,
    signInWithGoogle,
    enterDemoSandbox,
    signOut,
    switchDemoRole,
    lang,
    setLang,
    theme,
    setTheme,
    activeBranchId,
    setActiveBranchId,
    includeDemoInLiveReports,
    setIncludeDemoInLiveReports,
    toasts,
    pushToast,
    dismissToast,
    data,
    invitations,
    updateCompany,
    createBranch,
    createDepartment,
    inviteEmployee,
    updateEmployeeRole,
    createCustomRole,
    createLead,
    updateLeadStage,
    addLeadActivity,
    convertLeadToClientAndDeal,
    createClient,
    createDeal,
    createService,
    createProposal,
    decideProposal,
    createContractAndProject,
    createProject,
    updateProjectStatus,
    toggleDeliverableApproval,
    createTask,
    updateTaskStatus,
    toggleTaskChecklist,
    addTaskRevision,
    addTaskComment,
    createShoot,
    updateShootStatus,
    reserveEquipment,
    createEditingJob,
    updateEditingStatus,
    createDesignJob,
    updateDesignStatus,
    createMarketingItem,
    updateMarketingStatus,
    createDevItem,
    updateDevStatus,
    createJournalEntry,
    reverseJournalEntry,
    toggleFiscalPeriod,
    createInvoice,
    recordInvoicePayment,
    createExpense,
    decideExpense,
    createTreasuryTransfer,
    createProcurementRequest,
    advanceProcurement,
    createAsset,
    updateAssetStatus,
    checkInAttendance,
    createLeaveRequest,
    decideLeaveRequest,
    approvePayrollRun,
    createSupportTicket,
    updateTicketStatus,
    createFileRecord,
    createKnowledgeArticle,
    createWorkflowRule,
    toggleWorkflowRule,
    triggerWorkflowEvent,
    decideApproval,
    markNotificationRead,
    resetDemoSandbox,
    seedDemoInFirestore,
    clearDemoInFirestore,
  };

  return <OSContext.Provider value={value}>{children}</OSContext.Provider>;
}

export function useOS(): OSContextValue {
  const ctx = useContext(OSContext);
  if (!ctx) throw new Error('useOS must be used inside OSProvider');
  return ctx;
}
