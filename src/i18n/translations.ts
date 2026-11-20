import type { Language, ModuleKey } from '../types/os';

export interface NavItemConfig {
  key: ModuleKey;
  path: string;
  group: 'core' | 'commercial' | 'operations' | 'creative' | 'finance' | 'people' | 'intelligence';
  ar: string;
  en: string;
}

export const NAV_ITEMS: NavItemConfig[] = [
  { key: 'dashboard', path: '/dashboard', group: 'core', ar: 'لوحة القيادة', en: 'Dashboard' },
  { key: 'workspace', path: '/workspace', group: 'core', ar: 'مساحة عملي', en: 'My Workspace' },
  { key: 'company', path: '/company', group: 'core', ar: 'إدارة الشركة', en: 'Company Management' },

  { key: 'crm', path: '/crm', group: 'commercial', ar: 'المبيعات والعملاء المحتملين', en: 'CRM & Sales' },
  { key: 'clients', path: '/crm/clients', group: 'commercial', ar: 'العملاء', en: 'Clients' },
  { key: 'proposals', path: '/crm/proposals', group: 'commercial', ar: 'العروض والعقود', en: 'Proposals & Contracts' },

  { key: 'projects', path: '/projects', group: 'operations', ar: 'المشاريع', en: 'Projects' },
  { key: 'tasks', path: '/tasks', group: 'operations', ar: 'المهام', en: 'Tasks' },
  { key: 'calendar', path: '/calendar', group: 'operations', ar: 'التقويم الموحد', en: 'Calendar' },

  { key: 'production', path: '/production', group: 'creative', ar: 'الإنتاج والتصوير', en: 'Media Production' },
  { key: 'editing', path: '/editing', group: 'creative', ar: 'المونتاج', en: 'Video Editing' },
  { key: 'design', path: '/design', group: 'creative', ar: 'التصميم الجرافيكي', en: 'Graphic Design' },
  { key: 'marketing', path: '/marketing', group: 'creative', ar: 'التسويق والمحتوى', en: 'Marketing' },
  { key: 'development', path: '/development', group: 'creative', ar: 'التطوير والبرمجة', en: 'Development' },

  { key: 'finance', path: '/finance', group: 'finance', ar: 'المالية والمحاسبة', en: 'Finance & Accounting' },
  { key: 'procurement', path: '/procurement', group: 'finance', ar: 'المشتريات', en: 'Procurement' },
  { key: 'assets', path: '/assets', group: 'finance', ar: 'الأصول والمعدات', en: 'Assets & Equipment' },

  { key: 'hr', path: '/hr', group: 'people', ar: 'الموارد البشرية', en: 'Human Resources' },
  { key: 'support', path: '/support', group: 'people', ar: 'خدمة العملاء', en: 'Customer Support' },
  { key: 'files', path: '/files', group: 'people', ar: 'مكتبة الملفات', en: 'File Library' },
  { key: 'knowledge', path: '/knowledge', group: 'people', ar: 'قاعدة المعرفة', en: 'Knowledge Base' },

  { key: 'reports', path: '/reports', group: 'intelligence', ar: 'التقارير والتحليلات', en: 'Reports & Analytics' },
  { key: 'ai', path: '/ai', group: 'intelligence', ar: 'المساعد الذكي', en: 'AI Assistant' },
  { key: 'automation', path: '/automation', group: 'intelligence', ar: 'مركز الأتمتة', en: 'Automation Center' },
  { key: 'settings', path: '/settings', group: 'intelligence', ar: 'الإعدادات', en: 'Settings' },
];

export const GROUP_LABELS: Record<NavItemConfig['group'], { ar: string; en: string }> = {
  core: { ar: 'المركز الرئيسي', en: 'Core Center' },
  commercial: { ar: 'المبيعات والنمو', en: 'Commercial' },
  operations: { ar: 'التشغيل والتنفيذ', en: 'Operations' },
  creative: { ar: 'الإنتاج الإبداعي والتقني', en: 'Creative & Tech' },
  finance: { ar: 'المالية والأصول', en: 'Finance & Assets' },
  people: { ar: 'الموارد والمعرفة', en: 'People & Knowledge' },
  intelligence: { ar: 'الذكاء والحوكمة', en: 'Intelligence & Governance' },
};

export const UI_TEXT = {
  ar: {
    brandSub: 'نظام التشغيل المؤسسي',
    searchPlaceholder: 'بحث شامل في العملاء، المشاريع، المهام، الفواتير...',
    allBranches: 'جميع الفروع',
    quickCreate: 'إنشاء سريع',
    notifications: 'الإشعارات',
    approvals: 'الاعتمادات المعلقة',
    demoBanner: 'بيئة العرض التجريبية (Demo Sandbox) — البيانات المعروضة لأغراض المعاينة ولا تختلط بالسجلات الحية.',
    signInGoogle: 'تسجيل الدخول بحساب Google المؤسسي',
    enterDemo: 'دخول سريع لبيئة العرض التجريبية',
    signOut: 'تسجيل الخروج',
    save: 'حفظ',
    cancel: 'إلغاء',
    create: 'إنشاء',
    edit: 'تعديل',
    delete: 'حذف',
    approve: 'اعتماد',
    reject: 'رفض',
    exportCsv: 'تصدير CSV',
    noData: 'لا توجد سجلات مطابقة',
    filterAll: 'الكل',
    status: 'الحالة',
    actions: 'الإجراءات',
    branch: 'الفرع',
    department: 'الإدارة',
    amount: 'القيمة',
    date: 'التاريخ',
    owner: 'المسؤول',
  },
  en: {
    brandSub: 'Enterprise Agency OS',
    searchPlaceholder: 'Search clients, projects, tasks, invoices...',
    allBranches: 'All Branches',
    quickCreate: 'Quick Create',
    notifications: 'Notifications',
    approvals: 'Pending Approvals',
    demoBanner: 'Demo Sandbox Environment — Sample data is isolated and never mixed with live company ledgers.',
    signInGoogle: 'Sign in with Google Workspace',
    enterDemo: 'Launch Demo Sandbox Preview',
    signOut: 'Sign Out',
    save: 'Save',
    cancel: 'Cancel',
    create: 'Create',
    edit: 'Edit',
    delete: 'Delete',
    approve: 'Approve',
    reject: 'Reject',
    exportCsv: 'Export CSV',
    noData: 'No matching records found',
    filterAll: 'All',
    status: 'Status',
    actions: 'Actions',
    branch: 'Branch',
    department: 'Department',
    amount: 'Amount',
    date: 'Date',
    owner: 'Owner',
  },
};

export function t(lang: Language, key: keyof typeof UI_TEXT['ar']): string {
  return UI_TEXT[lang][key];
}
