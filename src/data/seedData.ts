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
  Invoice,
  JournalEntry,
  KnowledgeArticle,
  Lead,
  LeaveRequest,
  MarketingItem,
  NotificationItem,
  Payment,
  PayrollRun,
  ProcurementRequest,
  Project,
  Proposal,
  ServiceItem,
  Shoot,
  SupportTicket,
  Task,
  Team,
  TreasuryAccount,
  TreasuryTransfer,
  WorkflowLog,
  WorkflowRule,
} from '../types/os';

export interface BalanceOSDataset {
  company: Company;
  branches: Branch[];
  departments: Department[];
  teams: Team[];
  employees: EmployeeProfile[];
  customRoles: CustomRole[];
  clients: Client[];
  leads: Lead[];
  deals: Deal[];
  services: ServiceItem[];
  proposals: Proposal[];
  contracts: Contract[];
  projects: Project[];
  tasks: Task[];
  shoots: Shoot[];
  equipmentReservations: EquipmentReservation[];
  editingJobs: EditingJob[];
  designJobs: DesignJob[];
  marketingItems: MarketingItem[];
  devItems: DevItem[];
  accounts: Account[];
  fiscalPeriods: FiscalPeriod[];
  journalEntries: JournalEntry[];
  invoices: Invoice[];
  payments: Payment[];
  expenses: Expense[];
  treasuryAccounts: TreasuryAccount[];
  treasuryTransfers: TreasuryTransfer[];
  procurementRequests: ProcurementRequest[];
  assets: Asset[];
  attendanceRecords: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  payrollRuns: PayrollRun[];
  supportTickets: SupportTicket[];
  files: FileRecord[];
  knowledgeArticles: KnowledgeArticle[];
  workflows: WorkflowRule[];
  workflowLogs: WorkflowLog[];
  approvals: ApprovalRequest[];
  notifications: NotificationItem[];
  auditLogs: AuditLogItem[];
}

export function buildDemoDataset(ownerUid = 'demo-ceo-01'): BalanceOSDataset {
  const now = '2026-11-20T09:00:00Z';
  const members = [
    ownerUid,
    'emp-gm',
    'emp-cairo-mgr',
    'emp-alex-mgr',
    'emp-sales-1',
    'emp-pm-1',
    'emp-photo-1',
    'emp-edit-1',
    'emp-design-1',
    'emp-mkt-1',
    'emp-dev-1',
    'emp-acc-1',
    'emp-hr-1',
    'emp-sup-1',
  ];
  const base = {
    ownerUid,
    memberUids: members,
    isDemo: true,
    createdAt: now,
    updatedAt: now,
  };

  const company: Company = {
    ...base,
    id: 'balance-agency',
    name: 'BALANCE Agency',
    legalName: 'شركة بالانس للخدمات الإبداعية والتقنية ش.ذ.م.م',
    taxId: '402-881-910',
    address: 'المعادي، القاهرة الجديدة — جمهورية مصر العربية',
    phone: '+20 2 2519 4400',
    email: 'ops@balance.agency',
    currency: 'EGP',
    timezone: 'Africa/Cairo',
    fiscalYearStart: '01-01',
  };

  const branches: Branch[] = [
    {
      ...base,
      id: 'br-cairo',
      code: 'CAI-HQ',
      name: 'المقر الرئيسي — القاهرة',
      nameEn: 'Cairo Headquarters',
      address: 'التجمع الخامس، القاهرة الجديدة',
      phone: '01009901122',
      email: 'cairo@balance.agency',
      managerUid: 'emp-cairo-mgr',
      status: 'active',
      operationalBudgetPiasters: 85000000,
    },
    {
      ...base,
      id: 'br-alex',
      code: 'ALX-02',
      name: 'فرع الإسكندرية',
      nameEn: 'Alexandria Branch',
      address: 'سموحة، الإسكندرية',
      phone: '01009903344',
      email: 'alex@balance.agency',
      managerUid: 'emp-alex-mgr',
      status: 'active',
      operationalBudgetPiasters: 42000000,
    },
  ];

  const departments: Department[] = [
    { ...base, id: 'dept-mgmt', code: 'D01', name: 'الإدارة العامة', nameEn: 'General Management', managerUid: ownerUid, budgetPiasters: 30000000 },
    { ...base, id: 'dept-sales', code: 'D02', name: 'المبيعات', nameEn: 'Sales', managerUid: 'emp-sales-1', budgetPiasters: 18000000 },
    { ...base, id: 'dept-photo', code: 'D03', name: 'التصوير والإنتاج الإعلامي', nameEn: 'Photography & Media Production', managerUid: 'emp-photo-1', budgetPiasters: 26000000 },
    { ...base, id: 'dept-edit', code: 'D04', name: 'المونتاج', nameEn: 'Video Editing', managerUid: 'emp-edit-1', budgetPiasters: 19000000 },
    { ...base, id: 'dept-design', code: 'D05', name: 'التصميم الجرافيكي', nameEn: 'Graphic Design', managerUid: 'emp-design-1', budgetPiasters: 16000000 },
    { ...base, id: 'dept-mkt', code: 'D06', name: 'التسويق عبر السوشيال ميديا', nameEn: 'Social Media Marketing', managerUid: 'emp-mkt-1', budgetPiasters: 22000000 },
    { ...base, id: 'dept-dev', code: 'D07', name: 'البرمجة والتطوير', nameEn: 'Development & Programming', managerUid: 'emp-dev-1', budgetPiasters: 28000000 },
    { ...base, id: 'dept-fin', code: 'D08', name: 'المالية والمحاسبة', nameEn: 'Finance & Accounting', managerUid: 'emp-acc-1', budgetPiasters: 14000000 },
    { ...base, id: 'dept-hr', code: 'D09', name: 'الموارد البشرية', nameEn: 'Human Resources', managerUid: 'emp-hr-1', budgetPiasters: 12000000 },
    { ...base, id: 'dept-sup', code: 'D10', name: 'خدمة العملاء', nameEn: 'Customer Service', managerUid: 'emp-sup-1', budgetPiasters: 11000000 },
  ];

  const teams: Team[] = [
    { ...base, id: 'team-reels', name: 'فريق الريلز والإنتاج السريع', nameEn: 'Reels Production Squad', departmentId: 'dept-photo', branchId: 'br-cairo', leaderUid: 'emp-photo-1', memberIds: ['emp-photo-1', 'emp-edit-1', 'emp-design-1'] },
    { ...base, id: 'team-web', name: 'فريق المنصات والأنظمة', nameEn: 'Web & Systems Squad', departmentId: 'dept-dev', branchId: 'br-cairo', leaderUid: 'emp-dev-1', memberIds: ['emp-dev-1', 'emp-pm-1'] },
    { ...base, id: 'team-alex-growth', name: 'فريق نمو الإسكندرية', nameEn: 'Alexandria Growth Team', departmentId: 'dept-mkt', branchId: 'br-alex', leaderUid: 'emp-alex-mgr', memberIds: ['emp-alex-mgr', 'emp-mkt-1', 'emp-sales-1'] },
  ];

  const employees: EmployeeProfile[] = [
    { uid: ownerUid, email: 'sofianamr92@gmail.com', fullName: 'سفيان عمرو', fullNameEn: 'Sofian Amr', role: 'ceo', branchIds: ['br-cairo', 'br-alex'], departmentIds: ['dept-mgmt'], position: 'المؤسس والرئيس التنفيذي', workModel: 'hybrid', employmentType: 'full_time', status: 'active', phone: '01001122334', joiningDate: '2022-01-01', skills: ['Strategy', 'Finance', 'Operations'], monthlySalaryPiasters: 4500000, nationalId: '29201010101011', performanceScore: 98, isDemo: true, ownerUid, createdAt: now, updatedAt: now },
    { uid: 'emp-cairo-mgr', email: 'karim.hassan@balance.agency', fullName: 'كريم حسن', fullNameEn: 'Karim Hassan', role: 'branch_manager', branchIds: ['br-cairo'], departmentIds: ['dept-mgmt'], position: 'مدير فرع القاهرة', workModel: 'office', employmentType: 'full_time', status: 'active', phone: '01012233445', joiningDate: '2023-03-15', skills: ['Branch Ops', 'Client Delivery'], monthlySalaryPiasters: 2800000, performanceScore: 94, isDemo: true, ownerUid, createdAt: now, updatedAt: now },
    { uid: 'emp-alex-mgr', email: 'nadia.adel@balance.agency', fullName: 'نادية عادل', fullNameEn: 'Nadia Adel', role: 'branch_manager', branchIds: ['br-alex'], departmentIds: ['dept-mgmt', 'dept-mkt'], position: 'مديرة فرع الإسكندرية', workModel: 'hybrid', employmentType: 'full_time', status: 'active', phone: '01023344556', joiningDate: '2023-09-01', skills: ['Growth', 'Account Management'], monthlySalaryPiasters: 2500000, performanceScore: 92, isDemo: true, ownerUid, createdAt: now, updatedAt: now },
    { uid: 'emp-sales-1', email: 'youssef.tarek@balance.agency', fullName: 'يوسف طارق', fullNameEn: 'Youssef Tarek', role: 'sales_rep', branchIds: ['br-cairo', 'br-alex'], departmentIds: ['dept-sales'], position: 'أخصائي مبيعات أول', workModel: 'hybrid', employmentType: 'full_time', status: 'active', phone: '01034455667', joiningDate: '2024-02-10', skills: ['B2B Sales', 'Proposals'], monthlySalaryPiasters: 1600000, performanceScore: 90, isDemo: true, ownerUid, createdAt: now, updatedAt: now },
    { uid: 'emp-pm-1', email: 'salma.nabil@balance.agency', fullName: 'سلمى نبيل', fullNameEn: 'Salma Nabil', role: 'project_manager', branchIds: ['br-cairo'], departmentIds: ['dept-mgmt', 'dept-dev'], position: 'مديرة مشاريع تنفيذية', workModel: 'hybrid', employmentType: 'full_time', status: 'active', phone: '01045566778', joiningDate: '2023-11-01', skills: ['Agile', 'Resource Planning'], monthlySalaryPiasters: 2200000, performanceScore: 95, isDemo: true, ownerUid, createdAt: now, updatedAt: now },
    { uid: 'emp-photo-1', email: 'mazen.sherif@balance.agency', fullName: 'مازن شريف', fullNameEn: 'Mazen Sherif', role: 'photographer', branchIds: ['br-cairo'], departmentIds: ['dept-photo'], position: 'مدير تصوير وإنتاج', workModel: 'office', employmentType: 'full_time', status: 'active', phone: '01056677889', joiningDate: '2024-01-10', skills: ['Cinema Cameras', 'Lighting'], monthlySalaryPiasters: 1850000, performanceScore: 91, isDemo: true, ownerUid, createdAt: now, updatedAt: now },
    { uid: 'emp-edit-1', email: 'omar.fathy@balance.agency', fullName: 'عمر فتحي', fullNameEn: 'Omar Fathy', role: 'video_editor', branchIds: ['br-cairo'], departmentIds: ['dept-edit'], position: 'مونتير أول ومصحح ألوان', workModel: 'remote', employmentType: 'full_time', status: 'active', phone: '01067788990', joiningDate: '2024-04-01', skills: ['Premiere', 'DaVinci Resolve', 'After Effects'], monthlySalaryPiasters: 1750000, performanceScore: 89, isDemo: true, ownerUid, createdAt: now, updatedAt: now },
    { uid: 'emp-design-1', email: 'nour.samir@balance.agency', fullName: 'نور سمير', fullNameEn: 'Nour Samir', role: 'graphic_designer', branchIds: ['br-cairo'], departmentIds: ['dept-design'], position: 'مصممة هوية بصرية أولى', workModel: 'hybrid', employmentType: 'full_time', status: 'active', phone: '01078899001', joiningDate: '2024-05-12', skills: ['Branding', 'Figma', 'Print'], monthlySalaryPiasters: 1650000, performanceScore: 93, isDemo: true, ownerUid, createdAt: now, updatedAt: now },
    { uid: 'emp-mkt-1', email: 'reem.khaled@balance.agency', fullName: 'ريم خالد', fullNameEn: 'Reem Khaled', role: 'marketing_specialist', branchIds: ['br-alex'], departmentIds: ['dept-mkt'], position: 'قائدة فريق التسويق الرقمي', workModel: 'remote', employmentType: 'full_time', status: 'active', phone: '01089900112', joiningDate: '2024-03-01', skills: ['Meta Ads', 'Content Strategy'], monthlySalaryPiasters: 1700000, performanceScore: 90, isDemo: true, ownerUid, createdAt: now, updatedAt: now },
    { uid: 'emp-dev-1', email: 'ziad.mahmoud@balance.agency', fullName: 'زياد محمود', fullNameEn: 'Ziad Mahmoud', role: 'developer', branchIds: ['br-cairo'], departmentIds: ['dept-dev'], position: 'مهندس برمجيات أول', workModel: 'remote', employmentType: 'full_time', status: 'active', phone: '01090011223', joiningDate: '2023-07-01', skills: ['TypeScript', 'React', 'Node.js'], monthlySalaryPiasters: 2600000, performanceScore: 96, isDemo: true, ownerUid, createdAt: now, updatedAt: now },
    { uid: 'emp-acc-1', email: 'hossam.ali@balance.agency', fullName: 'حسام علي', fullNameEn: 'Hossam Ali', role: 'accountant', branchIds: ['br-cairo', 'br-alex'], departmentIds: ['dept-fin'], position: 'كبير المحاسبين', workModel: 'office', employmentType: 'full_time', status: 'active', phone: '01101122334', joiningDate: '2022-08-01', skills: ['IFRS', 'Cost Accounting', 'Treasury'], monthlySalaryPiasters: 2100000, performanceScore: 94, isDemo: true, ownerUid, createdAt: now, updatedAt: now },
    { uid: 'emp-hr-1', email: 'mona.ibrahim@balance.agency', fullName: 'منى إبراهيم', fullNameEn: 'Mona Ibrahim', role: 'hr_manager', branchIds: ['br-cairo', 'br-alex'], departmentIds: ['dept-hr'], position: 'مديرة الموارد البشرية', workModel: 'hybrid', employmentType: 'full_time', status: 'active', phone: '01112233445', joiningDate: '2023-01-15', skills: ['Talent Ops', 'Payroll', 'Performance'], monthlySalaryPiasters: 2000000, performanceScore: 92, isDemo: true, ownerUid, createdAt: now, updatedAt: now },
    { uid: 'emp-sup-1', email: 'dina.yasser@balance.agency', fullName: 'دينا ياسر', fullNameEn: 'Dina Yasser', role: 'customer_support', branchIds: ['br-cairo'], departmentIds: ['dept-sup'], position: 'أخصائية خدمة عملاء', workModel: 'office', employmentType: 'full_time', status: 'active', phone: '01123344556', joiningDate: '2024-06-01', skills: ['CRM Support', 'SLA'], monthlySalaryPiasters: 1200000, performanceScore: 88, isDemo: true, ownerUid, createdAt: now, updatedAt: now },
  ];

  const customRoles: CustomRole[] = [
    {
      ...base,
      id: 'role-creative-dir',
      roleKey: 'creative_director',
      name: 'المدير الإبداعي',
      nameEn: 'Creative Director',
      description: 'إشراف مشترك على التصوير والمونتاج والتصميم واعتماد المخرجات.',
      permissions: {
        dashboard: ['view'],
        projects: ['view', 'edit', 'approve'],
        production: ['view', 'create', 'edit', 'approve'],
        editing: ['view', 'edit', 'approve'],
        design: ['view', 'edit', 'approve'],
      },
    },
  ];

  const clients: Client[] = [
    { ...base, id: 'cli-1', name: 'مجموعة النيل للتطوير العقاري', industry: 'Real Estate', phone: '01004455661', email: 'marketing@niledevelopments.eg', location: 'القاهرة الجديدة', branchId: 'br-cairo', accountManagerUid: 'emp-pm-1', brandNotes: 'أسلوب رسمي فاخر — ألوان كحلي وذهبي', status: 'active' },
    { ...base, id: 'cli-2', name: 'عيادات أورورا التخصصية', industry: 'Healthcare', phone: '01015566772', email: 'info@auroraclinics.eg', location: 'الشيخ زايد', branchId: 'br-cairo', accountManagerUid: 'emp-pm-1', brandNotes: 'فيديوهات توعوية قصيرة 9:16 مع ترجمة عربية', status: 'active' },
    { ...base, id: 'cli-3', name: 'روستري الميناء للقهوة', industry: 'F&B Retail', phone: '01223344558', email: 'hello@minaroastery.eg', location: 'كفر عبده، الإسكندرية', branchId: 'br-alex', accountManagerUid: 'emp-alex-mgr', brandNotes: 'تصوير منتج طبيعي وإعلانات ريلز أسبوعية', status: 'active' },
    { ...base, id: 'cli-4', name: 'منصة مسار للتعليم الإلكتروني', industry: 'EdTech', phone: '01119988773', email: 'tech@masaredtech.eg', location: 'المعادي، القاهرة', branchId: 'br-cairo', accountManagerUid: 'emp-dev-1', brandNotes: 'بوابة ويب وتطبيق طلاب + حملات تحصيل عملاء', status: 'active' },
  ];

  const leads: Lead[] = [
    {
      ...base,
      id: 'lead-1',
      businessName: 'فندق كايرو جيت البوتيكي',
      contactName: 'أ. طارق المنياوي',
      phone: '01007788991',
      email: 'tarek@cairogate.eg',
      industry: 'Hospitality',
      location: 'الزمالك، القاهرة',
      source: 'instagram',
      stage: 'proposal_sent',
      priority: 'high',
      interestedServices: ['srv-photo', 'srv-social'],
      estimatedBudgetPiasters: 9500000,
      assignedUid: 'emp-sales-1',
      branchId: 'br-cairo',
      nextFollowUp: '2026-11-22',
      notes: 'مهتم بباقة تصوير شهري وإدارة حسابات تيك توك وإنستجرام.',
      activities: [
        { id: 'act-1', type: 'call', summary: 'مكالمة تعريفية وتحديد الاحتياج', date: '2026-11-16', actorUid: 'emp-sales-1' },
        { id: 'act-2', type: 'meeting', summary: 'اجتماع أونلاين لعرض سابقة الأعمال', date: '2026-11-18', actorUid: 'emp-sales-1' },
      ],
    },
    {
      ...base,
      id: 'lead-2',
      businessName: 'براند سيلك للمنسوجات',
      contactName: 'م. داليا رشدي',
      phone: '01228899002',
      email: 'dalia@silktextiles.eg',
      industry: 'Fashion',
      location: 'رشدي، الإسكندرية',
      source: 'whatsapp',
      stage: 'meeting_scheduled',
      priority: 'medium',
      interestedServices: ['srv-web', 'srv-design'],
      estimatedBudgetPiasters: 12000000,
      assignedUid: 'emp-sales-1',
      branchId: 'br-alex',
      nextFollowUp: '2026-11-21',
      notes: 'تطوير متجر إلكتروني متكامل مع هوية بصرية جديدة.',
      activities: [{ id: 'act-3', type: 'whatsapp', summary: 'إرسال ملف سابقة أعمال المتاجر', date: '2026-11-19', actorUid: 'emp-sales-1' }],
    },
    {
      ...base,
      id: 'lead-3',
      businessName: 'أكاديمية المستقبل للغات',
      contactName: 'د. هيثم فؤاد',
      phone: '01116655443',
      email: 'haitham@futurelang.eg',
      industry: 'Education',
      location: 'مدينة نصر، القاهرة',
      source: 'google_maps',
      stage: 'qualified',
      priority: 'medium',
      interestedServices: ['srv-ads'],
      estimatedBudgetPiasters: 5500000,
      assignedUid: 'emp-sales-1',
      branchId: 'br-cairo',
      nextFollowUp: '2026-11-23',
      notes: 'يرغب في حملات إعلانية ممولة قبل موسم يناير.',
    },
    {
      ...base,
      id: 'lead-4',
      businessName: 'مطعم مرسى بحري',
      contactName: 'أ. شريف صبحي',
      phone: '01288112233',
      industry: 'Restaurants',
      location: 'بحري، الإسكندرية',
      source: 'referrals',
      stage: 'negotiation',
      priority: 'high',
      interestedServices: ['srv-photo', 'srv-edit'],
      estimatedBudgetPiasters: 4800000,
      assignedUid: 'emp-alex-mgr',
      branchId: 'br-alex',
      nextFollowUp: '2026-11-21',
      notes: 'تفاوض على عدد أيام التصوير الشهري.',
    },
  ];

  const services: ServiceItem[] = [
    {
      ...base,
      id: 'srv-photo',
      code: 'SRV-PRD-01',
      name: 'إنتاج وتصوير فيديو احترافي',
      nameEn: 'Commercial Video & Photo Production',
      category: 'Media Production',
      pricingModel: 'monthly',
      defaultRatePiasters: 4500000,
      estimatedCostPiasters: 1800000,
      departmentId: 'dept-photo',
      deliverables: ['يوم تصوير كامل 4K', '8 ريلز قصيرة', '20 صورة منتجات معدلة'],
      defaultTasks: ['معاينة اللوكيشن وإعداد Call Sheet', 'حجز الكاميرات والإضاءة', 'تنفيذ التصوير وتسليم الخام'],
      estimatedDays: 10,
      revisionLimit: 2,
      status: 'active',
    },
    {
      ...base,
      id: 'srv-edit',
      code: 'SRV-EDT-02',
      name: 'مونتاج وتصحيح ألوان ريلز وإعلانات',
      nameEn: 'Video Editing & Color Grading',
      category: 'Video Editing',
      pricingModel: 'per_deliverable',
      defaultRatePiasters: 2200000,
      estimatedCostPiasters: 800000,
      departmentId: 'dept-edit',
      deliverables: ['مونتاج 8 فيديوهات', 'موشن جرافيك عناوين', 'تصدير 9:16 و 16:9'],
      defaultTasks: ['استلام الخام وتنظيم التايم لاين', 'المونتاج والمراجعة الداخلية', 'التصدير النهائي'],
      estimatedDays: 7,
      revisionLimit: 2,
      status: 'active',
    },
    {
      ...base,
      id: 'srv-design',
      code: 'SRV-DSN-03',
      name: 'تصميم الهوية البصرية والسوشيال ميديا',
      nameEn: 'Brand Identity & Social Design',
      category: 'Graphic Design',
      pricingModel: 'fixed',
      defaultRatePiasters: 3500000,
      estimatedCostPiasters: 1100000,
      departmentId: 'dept-design',
      deliverables: ['دليل الهوية البصرية', '15 قالب منشورات وستوري', 'بنرات إعلانية'],
      defaultTasks: ['دراسة التوجه البصري والمنافسين', 'تصميم المقترحات الأولية', 'اعتماد وتسليم الملفات المصدرية'],
      estimatedDays: 14,
      revisionLimit: 3,
      status: 'active',
    },
    {
      ...base,
      id: 'srv-social',
      code: 'SRV-MKT-04',
      name: 'إدارة السوشيال ميديا والحملات الممولة',
      nameEn: 'Social Media & Performance Marketing',
      category: 'Digital Marketing',
      pricingModel: 'monthly',
      defaultRatePiasters: 3800000,
      estimatedCostPiasters: 1400000,
      departmentId: 'dept-mkt',
      deliverables: ['خطة محتوى شهرية', 'إدارة نشر يومي', 'تقرير أداء أسبوعي وشهري'],
      defaultTasks: ['إعداد خطة المحتوى والاسكربتات', 'جدولة الحملات الإعلانية', 'تحليل النتائج الشهري'],
      estimatedDays: 30,
      revisionLimit: 2,
      status: 'active',
    },
    {
      ...base,
      id: 'srv-web',
      code: 'SRV-DEV-05',
      name: 'تطوير مواقع وأنظمة ويب مخصصة',
      nameEn: 'Custom Web & Software Systems',
      category: 'Software Development',
      pricingModel: 'fixed',
      defaultRatePiasters: 14000000,
      estimatedCostPiasters: 5800000,
      departmentId: 'dept-dev',
      deliverables: ['تحليل المتطلبات وواجهات UX', 'تطوير الواجهة والخلفية', 'اختبار QA والإطلاق'],
      defaultTasks: ['توثيق المتطلبات الفنية', 'بناء واجهات النظام وقاعدة البيانات', 'اختبار الجودة والنشر'],
      estimatedDays: 45,
      revisionLimit: 2,
      status: 'active',
    },
  ];

  const deals: Deal[] = [
    { ...base, id: 'deal-1', title: 'عقد إنتاج وتسويق الربع الرابع — النيل العقارية', clientId: 'cli-1', salespersonUid: 'emp-sales-1', serviceIds: ['srv-photo', 'srv-social'], estimatedValuePiasters: 18000000, proposedValuePiasters: 16500000, expectedCloseDate: '2026-11-28', probability: 85, stage: 'won', branchId: 'br-cairo' },
    { ...base, id: 'deal-2', title: 'حملة ريلز فندق كايرو جيت', leadId: 'lead-1', salespersonUid: 'emp-sales-1', serviceIds: ['srv-photo', 'srv-social'], estimatedValuePiasters: 9500000, proposedValuePiasters: 8800000, expectedCloseDate: '2026-11-29', probability: 70, stage: 'proposal_sent', branchId: 'br-cairo' },
    { ...base, id: 'deal-3', title: 'باقة نمو متجر براند سيلك', leadId: 'lead-2', salespersonUid: 'emp-sales-1', serviceIds: ['srv-web', 'srv-design'], estimatedValuePiasters: 14000000, proposedValuePiasters: 12500000, expectedCloseDate: '2026-12-10', probability: 55, stage: 'negotiation', branchId: 'br-alex' },
  ];

  const proposals: Proposal[] = [
    {
      ...base,
      id: 'prop-1',
      proposalNumber: 'PRP-2026-041',
      title: 'عرض فني ومالي — فندق كايرو جيت (باقة شهرية)',
      dealId: 'deal-2',
      branchId: 'br-cairo',
      items: [
        { serviceId: 'srv-photo', description: 'يومان تصوير شهري + 10 ريلز', quantity: 1, unitPricePiasters: 4800000 },
        { serviceId: 'srv-social', description: 'إدارة حسابات إنستجرام وتيك توك', quantity: 1, unitPricePiasters: 4000000 },
      ],
      discountPiasters: 0,
      taxRatePercent: 14,
      totalPiasters: 10032000,
      paymentTerms: '50% مقدم تعاقد + 50% عند نهاية الشهر',
      validUntil: '2026-12-05',
      status: 'pending_approval',
      requesterUid: 'emp-sales-1',
      version: 2,
    },
  ];

  const contracts: Contract[] = [
    {
      ...base,
      id: 'cnt-1',
      contractNumber: 'CNT-2026-018',
      title: 'عقد خدمات الإنتاج الإعلامي — النيل العقارية',
      clientId: 'cli-1',
      dealId: 'deal-1',
      branchId: 'br-cairo',
      accountManagerUid: 'emp-pm-1',
      serviceIds: ['srv-photo', 'srv-social'],
      valuePiasters: 16500000,
      startDate: '2026-11-01',
      endDate: '2027-01-31',
      paymentSchedule: 'دفعات شهرية بداية كل شهر ميلادي',
      revisionPolicy: 'تعديلان مجانيان لكل مخرج، وما زاد بعرض سعر إضافي',
      signatureStatus: 'fully_executed',
      status: 'active',
    },
    {
      ...base,
      id: 'cnt-2',
      contractNumber: 'CNT-2026-019',
      title: 'عقد تطوير منصة مسار التعليمية',
      clientId: 'cli-4',
      branchId: 'br-cairo',
      accountManagerUid: 'emp-dev-1',
      serviceIds: ['srv-web'],
      valuePiasters: 14000000,
      startDate: '2026-10-15',
      endDate: '2026-12-30',
      paymentSchedule: '40% مقدم · 30% تسليم مرحلي · 30% إطلاق',
      revisionPolicy: 'تغييرات النطاق تخضع لطلب تغيير تجاري',
      signatureStatus: 'fully_executed',
      status: 'active',
    },
  ];

  const projects: Project[] = [
    {
      ...base,
      id: 'proj-1',
      name: 'النيل العقارية — إنتاج فيديو وإعلانات (نوفمبر 2026)',
      clientId: 'cli-1',
      contractId: 'cnt-1',
      serviceId: 'srv-photo',
      branchId: 'br-cairo',
      departmentId: 'dept-photo',
      managerUid: 'emp-pm-1',
      status: 'active',
      priority: 'high',
      startDate: '2026-11-01',
      dueDate: '2026-11-30',
      approvedRevenuePiasters: 9500000,
      estimatedCostPiasters: 3600000,
      actualCostPiasters: 2950000,
      progress: 72,
      cycleLabel: 'دورة نوفمبر 2026',
      deliverables: [
        { id: 'del-1', title: 'فيديو تعريفي للمشروع السكني 4K', mandatory: true, approved: true },
        { id: 'del-2', title: '8 فيديوهات ريلز ترويجية', mandatory: true, approved: false },
      ],
    },
    {
      ...base,
      id: 'proj-2',
      name: 'عيادات أورورا — إدارة سوشيال ميديا ومونتاج',
      clientId: 'cli-2',
      serviceId: 'srv-social',
      branchId: 'br-cairo',
      departmentId: 'dept-mkt',
      managerUid: 'emp-pm-1',
      status: 'active',
      priority: 'medium',
      startDate: '2026-11-01',
      dueDate: '2026-11-30',
      approvedRevenuePiasters: 5200000,
      estimatedCostPiasters: 2100000,
      actualCostPiasters: 1650000,
      progress: 65,
      cycleLabel: 'دورة نوفمبر 2026',
      deliverables: [
        { id: 'del-3', title: 'خطة محتوى نوفمبر المعتمدة', mandatory: true, approved: true },
        { id: 'del-4', title: 'تقرير الأداء الشهري', mandatory: true, approved: false },
      ],
    },
    {
      ...base,
      id: 'proj-3',
      name: 'روستري الميناء — تصوير منتجات وهوية بصرية',
      clientId: 'cli-3',
      serviceId: 'srv-design',
      branchId: 'br-alex',
      departmentId: 'dept-design',
      managerUid: 'emp-alex-mgr',
      status: 'at_risk',
      priority: 'urgent',
      startDate: '2026-11-05',
      dueDate: '2026-11-24',
      approvedRevenuePiasters: 4800000,
      estimatedCostPiasters: 1900000,
      actualCostPiasters: 2050000,
      progress: 55,
      deliverables: [
        { id: 'del-5', title: 'تصميم عبوات القهوة الجديدة', mandatory: true, approved: false },
      ],
    },
    {
      ...base,
      id: 'proj-4',
      name: 'منصة مسار — تطوير بوابة التعلم والاختبارات',
      clientId: 'cli-4',
      contractId: 'cnt-2',
      serviceId: 'srv-web',
      branchId: 'br-cairo',
      departmentId: 'dept-dev',
      managerUid: 'emp-dev-1',
      status: 'active',
      priority: 'high',
      startDate: '2026-10-15',
      dueDate: '2026-12-25',
      approvedRevenuePiasters: 14000000,
      estimatedCostPiasters: 5800000,
      actualCostPiasters: 4100000,
      progress: 78,
      deliverables: [
        { id: 'del-6', title: 'وحدة الاشتراكات والدفع', mandatory: true, approved: true },
        { id: 'del-7', title: 'اختبارات القبول النهائية QA', mandatory: true, approved: false },
      ],
    },
  ];

  const tasks: Task[] = [
    {
      ...base,
      id: 'task-1',
      title: 'تصوير لقطات الدرون والواجهة — كمبوند النيل',
      projectId: 'proj-1',
      clientId: 'cli-1',
      departmentId: 'dept-photo',
      assigneeUid: 'emp-photo-1',
      reviewerUid: 'emp-pm-1',
      priority: 'high',
      status: 'completed',
      dueDate: '2026-11-18',
      estimatedHours: 8,
      checklist: [
        { id: 'c1', label: 'تصريح الدرون', done: true },
        { id: 'c2', label: 'رفع الخام على الخادم', done: true },
      ],
      revisionCount: 0,
    },
    {
      ...base,
      id: 'task-2',
      title: 'مونتاج وتلوين 4 ريلز — النيل العقارية',
      projectId: 'proj-1',
      clientId: 'cli-1',
      departmentId: 'dept-edit',
      assigneeUid: 'emp-edit-1',
      reviewerUid: 'emp-pm-1',
      priority: 'high',
      status: 'internal_review',
      dueDate: '2026-11-22',
      estimatedHours: 10,
      checklist: [
        { id: 'c3', label: 'مراجعة الصوت والموسيقى', done: true },
        { id: 'c4', label: 'تصحيح الألوان LUT', done: true },
      ],
      revisionCount: 1,
    },
    {
      ...base,
      id: 'task-3',
      title: 'تصميم خطوط وألوان عبوات روستري الميناء',
      projectId: 'proj-3',
      clientId: 'cli-3',
      departmentId: 'dept-design',
      assigneeUid: 'emp-design-1',
      reviewerUid: 'emp-alex-mgr',
      priority: 'urgent',
      status: 'revision',
      dueDate: '2026-11-19',
      estimatedHours: 12,
      checklist: [
        { id: 'c5', label: 'إعداد ملف الطباعة CMYK', done: false },
      ],
      revisionCount: 2,
      revisions: [
        { id: 'rev-1', requesterUid: 'emp-alex-mgr', reason: 'تكبير الشعار على الواجهة الأمامية للعبوة', scopeType: 'in_scope', date: '2026-11-19', status: 'open' },
      ],
    },
    {
      ...base,
      id: 'task-4',
      title: 'بناء واجهة تقارير الطلاب — منصة مسار',
      projectId: 'proj-4',
      clientId: 'cli-4',
      departmentId: 'dept-dev',
      assigneeUid: 'emp-dev-1',
      reviewerUid: 'emp-pm-1',
      priority: 'high',
      status: 'in_progress',
      dueDate: '2026-11-25',
      estimatedHours: 16,
      checklist: [
        { id: 'c6', label: 'ربط API التقييمات', done: true },
        { id: 'c7', label: 'اختبار الاستجابة للموبايل', done: false },
      ],
      revisionCount: 0,
    },
    {
      ...base,
      id: 'task-5',
      title: 'جدولة حملة الريلز الطبية — عيادات أورورا',
      projectId: 'proj-2',
      clientId: 'cli-2',
      departmentId: 'dept-mkt',
      assigneeUid: 'emp-mkt-1',
      reviewerUid: 'emp-pm-1',
      priority: 'medium',
      status: 'assigned',
      dueDate: '2026-11-23',
      estimatedHours: 6,
      checklist: [{ id: 'c8', label: 'مراجعة الكابشن والهاشتاجات', done: true }],
      revisionCount: 0,
    },
  ];

  const shoots: Shoot[] = [
    {
      ...base,
      id: 'shoot-1',
      title: 'يوم تصوير عيادات أورورا — الجلسة الشهرية',
      projectId: 'proj-2',
      clientId: 'cli-2',
      branchId: 'br-cairo',
      location: 'فرع الشيخ زايد — عيادات أورورا',
      shootDate: '2026-11-23',
      startTime: '10:00',
      endTime: '16:00',
      directorUid: 'emp-photo-1',
      crewUids: ['emp-photo-1', 'emp-edit-1'],
      status: 'scheduled',
      objectives: 'تصوير 6 فيديوهات ريلز مع الأطباء + 15 صورة للعيادة',
      shotList: ['لقطة استقبال المريض', 'حوار الطبيب بزاوية 45', 'لقطات تفصيلية للأجهزة'],
      productionCostPiasters: 650000,
    },
    {
      ...base,
      id: 'shoot-2',
      title: 'تصوير منتجات القهوة — روستري الميناء',
      projectId: 'proj-3',
      clientId: 'cli-3',
      branchId: 'br-alex',
      location: 'استوديو فرع الإسكندرية — سموحة',
      shootDate: '2026-11-25',
      startTime: '11:00',
      endTime: '15:00',
      directorUid: 'emp-photo-1',
      crewUids: ['emp-photo-1'],
      status: 'planned',
      objectives: 'تصوير عبوات التحميص الجديدة بإضاءة دافئة',
      shotList: ['صب الإسبرسو البطيء', 'تغليف الحبوب'],
      productionCostPiasters: 420000,
    },
  ];

  const equipmentReservations: EquipmentReservation[] = [
    {
      ...base,
      id: 'eqr-1',
      assetId: 'ast-1',
      assetName: 'كاميرا Sony FX6 Cinema',
      shootId: 'shoot-1',
      projectId: 'proj-2',
      reservedByUid: 'emp-photo-1',
      branchId: 'br-cairo',
      startIso: '2026-11-23T09:00:00Z',
      endIso: '2026-11-23T17:00:00Z',
      status: 'reserved',
    },
    {
      ...base,
      id: 'eqr-2',
      assetId: 'ast-2',
      assetName: 'طقم إضاءة Aputure 600d Pro',
      shootId: 'shoot-1',
      projectId: 'proj-2',
      reservedByUid: 'emp-photo-1',
      branchId: 'br-cairo',
      startIso: '2026-11-23T09:00:00Z',
      endIso: '2026-11-23T17:00:00Z',
      status: 'reserved',
    },
  ];

  const editingJobs: EditingJob[] = [
    {
      ...base,
      id: 'edt-1',
      videoTitle: 'إعلان إطلاق المرحلة الثانية — النيل العقارية',
      projectId: 'proj-1',
      clientId: 'cli-1',
      editorUid: 'emp-edit-1',
      reviewerUid: 'emp-pm-1',
      footageLocation: '/media/nile-dev/nov-2026/raw-cam-a',
      durationSec: 45,
      aspectRatio: '9:16',
      resolution: '4K',
      frameRate: '60fps',
      captionsRequired: true,
      deadline: '2026-11-22',
      revisionCount: 1,
      exportVersion: 'v2.1',
      status: 'internal_review',
    },
    {
      ...base,
      id: 'edt-2',
      videoTitle: 'ريل توعوي: العناية بالأسنان — أورورا',
      projectId: 'proj-2',
      clientId: 'cli-2',
      editorUid: 'emp-edit-1',
      reviewerUid: 'emp-pm-1',
      footageLocation: '/media/aurora/oct-raw',
      durationSec: 30,
      aspectRatio: '9:16',
      resolution: '1080p',
      frameRate: '30fps',
      captionsRequired: true,
      deadline: '2026-11-24',
      revisionCount: 0,
      exportVersion: 'v1.0',
      status: 'editing',
    },
  ];

  const designJobs: DesignJob[] = [
    {
      ...base,
      id: 'dsn-1',
      title: 'حزمة تصاميم عبوات روستري الميناء',
      projectId: 'proj-3',
      clientId: 'cli-3',
      designerUid: 'emp-design-1',
      reviewerUid: 'emp-alex-mgr',
      category: 'print',
      dimensions: ['250g Bag Front/Back', '1080x1080 Social Reveal', '1080x1920 Story'],
      brandNotes: 'الالتزام بدرجة البني المحمص والخط العربي الحديث',
      deadline: '2026-11-21',
      version: 3,
      revisionCount: 2,
      status: 'revision',
    },
    {
      ...base,
      id: 'dsn-2',
      title: 'إعلانات إطلاق باقة الشتاء — النيل العقارية',
      projectId: 'proj-1',
      clientId: 'cli-1',
      designerUid: 'emp-design-1',
      reviewerUid: 'emp-pm-1',
      category: 'ad_creative',
      dimensions: ['1080x1080', '1080x1350', '1200x628'],
      brandNotes: 'إبراز خطط السداد بوضوح',
      deadline: '2026-11-25',
      version: 1,
      revisionCount: 0,
      status: 'designing',
    },
  ];

  const marketingItems: MarketingItem[] = [
    {
      ...base,
      id: 'mkt-1',
      kind: 'campaign',
      title: 'حملة جمع عملاء العقارات — نوفمبر',
      clientId: 'cli-1',
      projectId: 'proj-1',
      platform: 'Instagram',
      objective: 'Lead Generation',
      scheduledDate: '2026-11-10',
      budgetPiasters: 3500000,
      spendPiasters: 2450000,
      reach: 184000,
      clicks: 4920,
      leadsCount: 162,
      dataSource: 'تقرير يدوي موثق من حساب إعلانات العميل',
      creatorUid: 'emp-mkt-1',
      status: 'active',
    },
    {
      ...base,
      id: 'mkt-2',
      kind: 'content',
      title: 'فيديو ريل: جولة داخل عيادة أورورا',
      clientId: 'cli-2',
      projectId: 'proj-2',
      platform: 'TikTok',
      objective: 'Brand Awareness',
      scheduledDate: '2026-11-24',
      budgetPiasters: 0,
      spendPiasters: 0,
      reach: 0,
      clicks: 0,
      leadsCount: 0,
      dataSource: 'جدول المحتوى الداخلي',
      creatorUid: 'emp-mkt-1',
      status: 'scheduled',
    },
  ];

  const devItems: DevItem[] = [
    {
      ...base,
      id: 'dev-1',
      kind: 'feature',
      title: 'بوابة اختبارات الطلاب التفاعلية مع حفظ تلقائي',
      projectId: 'proj-4',
      sprint: 'Sprint 14',
      severity: 'high',
      assigneeUid: 'emp-dev-1',
      qaUid: 'emp-pm-1',
      releaseVersion: 'v2.4.0',
      status: 'in_development',
    },
    {
      ...base,
      id: 'dev-2',
      kind: 'bug',
      title: 'إصلاح محاذاة الجداول في شاشات الآيباد RTL',
      projectId: 'proj-4',
      sprint: 'Sprint 14',
      severity: 'medium',
      assigneeUid: 'emp-dev-1',
      qaUid: 'emp-pm-1',
      status: 'qa',
    },
  ];

  const accounts: Account[] = [
    { ...base, id: 'acc-1101', code: '1101', name: 'الخزينة الرئيسية — القاهرة', nameEn: 'Main Treasury Cash', type: 'asset', branchId: 'br-cairo', status: 'active' },
    { ...base, id: 'acc-1102', code: '1102', name: 'حساب البنك التجاري الدولي CIB', nameEn: 'CIB Corporate Bank', type: 'asset', status: 'active' },
    { ...base, id: 'acc-1103', code: '1103', name: 'عهدة وخزينة فرع الإسكندرية', nameEn: 'Alexandria Branch Cash', type: 'asset', branchId: 'br-alex', status: 'active' },
    { ...base, id: 'acc-1201', code: '1201', name: 'الذمم المدينة (العملاء)', nameEn: 'Accounts Receivable', type: 'asset', status: 'active' },
    { ...base, id: 'acc-2101', code: '2101', name: 'الذمم الدائنة (الموردون)', nameEn: 'Accounts Payable', type: 'liability', status: 'active' },
    { ...base, id: 'acc-3101', code: '3101', name: 'رأس المال والاحتياطيات', nameEn: 'Owner Equity', type: 'equity', status: 'active' },
    { ...base, id: 'acc-4101', code: '4101', name: 'إيرادات الإنتاج والتسويق والتطوير', nameEn: 'Agency Service Revenue', type: 'revenue', status: 'active' },
    { ...base, id: 'acc-5101', code: '5101', name: 'تكاليف الإنتاج المباشرة للمشاريع', nameEn: 'Direct Project Costs', type: 'direct_cost', status: 'active' },
    { ...base, id: 'acc-5201', code: '5201', name: 'مصروفات الرواتب والتشغيل الإداري', nameEn: 'Operating & Payroll Expenses', type: 'operating_expense', status: 'active' },
  ];

  const fiscalPeriods: FiscalPeriod[] = [
    { ...base, id: 'fp-2026-10', name: 'أكتوبر 2026', startDate: '2026-10-01', endDate: '2026-10-31', status: 'closed' },
    { ...base, id: 'fp-2026-11', name: 'نوفمبر 2026', startDate: '2026-11-01', endDate: '2026-11-30', status: 'open' },
  ];

  const journalEntries: JournalEntry[] = [
    {
      ...base,
      id: 'je-1',
      entryNumber: 'JE-2026-001',
      date: '2026-11-01',
      description: 'رصيد افتتاحي رأس المال والنقدية التشغيلية',
      periodId: 'fp-2026-11',
      branchId: 'br-cairo',
      referenceType: 'manual',
      status: 'posted',
      totalDebitPiasters: 65000000,
      totalCreditPiasters: 65000000,
      approvedByUid: ownerUid,
      lines: [
        { accountId: 'acc-1102', accountCode: '1102', accountName: 'حساب البنك التجاري الدولي CIB', debitPiasters: 50000000, creditPiasters: 0 },
        { accountId: 'acc-1101', accountCode: '1101', accountName: 'الخزينة الرئيسية — القاهرة', debitPiasters: 10000000, creditPiasters: 0 },
        { accountId: 'acc-1103', accountCode: '1103', accountName: 'عهدة وخزينة فرع الإسكندرية', debitPiasters: 5000000, creditPiasters: 0 },
        { accountId: 'acc-3101', accountCode: '3101', accountName: 'رأس المال والاحتياطيات', debitPiasters: 0, creditPiasters: 65000000 },
      ],
    },
    {
      ...base,
      id: 'je-2',
      entryNumber: 'JE-2026-002',
      date: '2026-11-05',
      description: 'إثبات فواتير عقود مشاريع نوفمبر (النيل، أورورا، مسار)',
      periodId: 'fp-2026-11',
      branchId: 'br-cairo',
      referenceType: 'invoice',
      referenceId: 'inv-1',
      status: 'posted',
      totalDebitPiasters: 28700000,
      totalCreditPiasters: 28700000,
      approvedByUid: 'emp-acc-1',
      lines: [
        { accountId: 'acc-1201', accountCode: '1201', accountName: 'الذمم المدينة (العملاء)', debitPiasters: 28700000, creditPiasters: 0 },
        { accountId: 'acc-4101', accountCode: '4101', accountName: 'إيرادات الإنتاج والتسويق والتطوير', debitPiasters: 0, creditPiasters: 28700000 },
      ],
    },
    {
      ...base,
      id: 'je-3',
      entryNumber: 'JE-2026-003',
      date: '2026-11-10',
      description: 'تحصيل دفعات من العملاء بالبنك',
      periodId: 'fp-2026-11',
      branchId: 'br-cairo',
      referenceType: 'payment',
      referenceId: 'pay-1',
      status: 'posted',
      totalDebitPiasters: 19500000,
      totalCreditPiasters: 19500000,
      approvedByUid: 'emp-acc-1',
      lines: [
        { accountId: 'acc-1102', accountCode: '1102', accountName: 'حساب البنك التجاري الدولي CIB', debitPiasters: 19500000, creditPiasters: 0 },
        { accountId: 'acc-1201', accountCode: '1201', accountName: 'الذمم المدينة (العملاء)', debitPiasters: 0, creditPiasters: 19500000 },
      ],
    },
    {
      ...base,
      id: 'je-4',
      entryNumber: 'JE-2026-004',
      date: '2026-11-15',
      description: 'إثبات تكاليف إنتاج مباشرة ومصروفات تشغيلية معتمدة',
      periodId: 'fp-2026-11',
      branchId: 'br-cairo',
      referenceType: 'expense',
      status: 'posted',
      totalDebitPiasters: 13200000,
      totalCreditPiasters: 13200000,
      approvedByUid: 'emp-acc-1',
      lines: [
        { accountId: 'acc-5101', accountCode: '5101', accountName: 'تكاليف الإنتاج المباشرة للمشاريع', debitPiasters: 6800000, creditPiasters: 0, projectId: 'proj-1' },
        { accountId: 'acc-5201', accountCode: '5201', accountName: 'مصروفات الرواتب والتشغيل الإداري', debitPiasters: 6400000, creditPiasters: 0 },
        { accountId: 'acc-1102', accountCode: '1102', accountName: 'حساب البنك التجاري الدولي CIB', debitPiasters: 0, creditPiasters: 13200000 },
      ],
    },
  ];

  const invoices: Invoice[] = [
    {
      ...base,
      id: 'inv-1',
      invoiceNumber: 'INV-2026-101',
      clientId: 'cli-1',
      projectId: 'proj-1',
      branchId: 'br-cairo',
      issueDate: '2026-11-05',
      dueDate: '2026-11-25',
      lines: [{ description: 'دفعة نوفمبر — إنتاج فيديو وإعلانات النيل العقارية', quantity: 1, unitPricePiasters: 9500000 }],
      totalPiasters: 9500000,
      paidPiasters: 9500000,
      status: 'paid',
    },
    {
      ...base,
      id: 'inv-2',
      invoiceNumber: 'INV-2026-102',
      clientId: 'cli-4',
      projectId: 'proj-4',
      branchId: 'br-cairo',
      issueDate: '2026-11-05',
      dueDate: '2026-11-28',
      lines: [{ description: 'الدفعة الأولى والثانية — منصة مسار التعليمية', quantity: 1, unitPricePiasters: 14000000 }],
      totalPiasters: 14000000,
      paidPiasters: 10000000,
      status: 'partial',
    },
    {
      ...base,
      id: 'inv-3',
      invoiceNumber: 'INV-2026-103',
      clientId: 'cli-2',
      projectId: 'proj-2',
      branchId: 'br-cairo',
      issueDate: '2026-10-25',
      dueDate: '2026-11-10',
      lines: [{ description: 'باقة السوشيال ميديا — عيادات أورورا', quantity: 1, unitPricePiasters: 5200000 }],
      totalPiasters: 5200000,
      paidPiasters: 0,
      status: 'overdue',
    },
  ];

  const payments: Payment[] = [
    { ...base, id: 'pay-1', paymentNumber: 'REC-2026-081', direction: 'inbound', invoiceId: 'inv-1', clientId: 'cli-1', treasuryAccountId: 'tr-cib', branchId: 'br-cairo', amountPiasters: 9500000, date: '2026-11-10', method: 'bank_transfer', referenceCode: 'CIB-TRX-99102' },
    { ...base, id: 'pay-2', paymentNumber: 'REC-2026-082', direction: 'inbound', invoiceId: 'inv-2', clientId: 'cli-4', treasuryAccountId: 'tr-cib', branchId: 'br-cairo', amountPiasters: 10000000, date: '2026-11-12', method: 'bank_transfer', referenceCode: 'CIB-TRX-99418' },
  ];

  const expenses: Expense[] = [
    { ...base, id: 'exp-1', description: 'تجهيزات ومستلزمات تصوير لوكيشن النيل العقارية', category: 'إنتاج وتصوير', amountPiasters: 650000, date: '2026-11-18', branchId: 'br-cairo', departmentId: 'dept-photo', projectId: 'proj-1', paymentMethod: 'petty_cash', requesterUid: 'emp-photo-1', approverUid: 'emp-acc-1', status: 'approved' },
    { ...base, id: 'exp-2', description: 'تجديد استضافة الخوادم السحابية لمنصة مسار', category: 'بنية تقنية', amountPiasters: 480000, date: '2026-11-19', branchId: 'br-cairo', departmentId: 'dept-dev', projectId: 'proj-4', paymentMethod: 'card', requesterUid: 'emp-dev-1', status: 'submitted' },
    { ...base, id: 'exp-3', description: 'طباعة عينات عبوات روستري الميناء', category: 'تصميم وطباعة', amountPiasters: 320000, date: '2026-11-20', branchId: 'br-alex', departmentId: 'dept-design', projectId: 'proj-3', paymentMethod: 'petty_cash', requesterUid: 'emp-design-1', status: 'manager_review' },
  ];

  const treasuryAccounts: TreasuryAccount[] = [
    { ...base, id: 'tr-cib', name: 'حساب البنك التجاري الدولي (CIB)', kind: 'bank_account', branchId: 'br-cairo', glAccountId: 'acc-1102', balancePiasters: 56300000, accountNumber: '1000-4482-9910' },
    { ...base, id: 'tr-cairo-cash', name: 'الخزينة الرئيسية — القاهرة', kind: 'main_treasury', branchId: 'br-cairo', glAccountId: 'acc-1101', balancePiasters: 10000000 },
    { ...base, id: 'tr-alex-cash', name: 'عهدة وخزينة فرع الإسكندرية', kind: 'branch_cash', branchId: 'br-alex', glAccountId: 'acc-1103', balancePiasters: 5000000 },
  ];

  const treasuryTransfers: TreasuryTransfer[] = [];

  const procurementRequests: ProcurementRequest[] = [
    { ...base, id: 'po-1', requestNumber: 'PR-2026-014', title: 'بطاريات احتياطية وكروت CFexpress للتصوير', vendorName: 'كاميرا شوب مصر', branchId: 'br-cairo', departmentId: 'dept-photo', amountPiasters: 1850000, requesterUid: 'emp-photo-1', status: 'requested' },
    { ...base, id: 'po-2', requestNumber: 'PR-2026-013', title: 'شاشة معايرة ألوان للمونتاج 32 بوصة', vendorName: 'تريد لاين', branchId: 'br-cairo', departmentId: 'dept-edit', amountPiasters: 3200000, requesterUid: 'emp-edit-1', approverUid: 'emp-acc-1', status: 'ordered' },
  ];

  const assets: Asset[] = [
    { ...base, id: 'ast-1', assetTag: 'BAL-CAM-001', name: 'كاميرا Sony FX6 Cinema', category: 'camera', branchId: 'br-cairo', custodianUid: 'emp-photo-1', acquisitionCostPiasters: 24500000, purchaseDate: '2025-03-10', status: 'reserved' },
    { ...base, id: 'ast-2', assetTag: 'BAL-LGT-004', name: 'طقم إضاءة Aputure 600d Pro', category: 'lighting', branchId: 'br-cairo', custodianUid: 'emp-photo-1', acquisitionCostPiasters: 8500000, purchaseDate: '2025-04-20', status: 'reserved' },
    { ...base, id: 'ast-3', assetTag: 'BAL-CAM-002', name: 'عدسة Sony GM 24-70mm f/2.8', category: 'lens', branchId: 'br-alex', custodianUid: 'emp-alex-mgr', acquisitionCostPiasters: 9200000, purchaseDate: '2025-06-01', status: 'available' },
    { ...base, id: 'ast-4', assetTag: 'BAL-MAC-009', name: 'جهاز Mac Studio M2 Ultra للمونتاج', category: 'computer', branchId: 'br-cairo', custodianUid: 'emp-edit-1', acquisitionCostPiasters: 19500000, purchaseDate: '2025-08-15', status: 'in_use' },
  ];

  const attendanceRecords: AttendanceRecord[] = [
    { ...base, id: 'att-1', employeeUid: 'emp-photo-1', branchId: 'br-cairo', date: '2026-11-20', workMode: 'office', checkInTime: '09:42', notes: 'تجهيز استوديو القاهرة' },
    { ...base, id: 'att-2', employeeUid: 'emp-edit-1', branchId: 'br-cairo', date: '2026-11-20', workMode: 'remote', checkInTime: '10:00', notes: 'تسليم مونتاج النيل' },
    { ...base, id: 'att-3', employeeUid: 'emp-dev-1', branchId: 'br-cairo', date: '2026-11-20', workMode: 'remote', checkInTime: '09:50' },
  ];

  const leaveRequests: LeaveRequest[] = [
    { ...base, id: 'lv-1', employeeUid: 'emp-design-1', branchId: 'br-cairo', leaveType: 'annual', startDate: '2026-11-26', endDate: '2026-11-27', reason: 'إجازة عائلية', status: 'pending' },
  ];

  const payrollRuns: PayrollRun[] = [
    { ...base, id: 'payr-2026-11', periodLabel: 'رواتب نوفمبر 2026', branchId: 'br-cairo', totalGrossPiasters: 28200000, totalDeductionsPiasters: 1450000, totalNetPiasters: 26750000, employeeCount: 13, status: 'draft' },
  ];

  const supportTickets: SupportTicket[] = [
    { ...base, id: 'tkt-1', ticketNumber: 'SUP-2026-031', subject: 'تأخر تحديث أسعار الوحدات في الموقع التجريبي', clientId: 'cli-1', projectId: 'proj-1', departmentId: 'dept-dev', assigneeUid: 'emp-dev-1', priority: 'high', status: 'in_progress', dueDate: '2026-11-21', lastMessage: 'تم استلام ملف الأسعار وجارٍ الرفع على بيئة الاختبار.' },
    { ...base, id: 'tkt-2', ticketNumber: 'SUP-2026-032', subject: 'طلب تعديل مقاس ستوري إنستجرام لحملة العيادة', clientId: 'cli-2', projectId: 'proj-2', departmentId: 'dept-design', assigneeUid: 'emp-design-1', priority: 'medium', status: 'assigned', dueDate: '2026-11-22', lastMessage: 'تم تحويل الطلب لقسم التصميم.' },
  ];

  const files: FileRecord[] = [
    { ...base, id: 'fil-1', name: 'دليل_الهوية_البصرية_النيل_العقارية_v3.pdf', folder: 'clients', mimeType: 'application/pdf', sizeLabel: '14.2 MB', storagePath: 'gs://balance-os/clients/cli-1/brand-guide-v3.pdf', projectId: 'proj-1', version: 'v3.0', classification: 'department_only', tags: ['هوية', 'النيل'] },
    { ...base, id: 'fil-2', name: 'عقد_النيل_الموقع_2026.pdf', folder: 'contracts', mimeType: 'application/pdf', sizeLabel: '2.8 MB', storagePath: 'gs://balance-os/contracts/cnt-1.pdf', projectId: 'proj-1', version: 'v1.0', classification: 'confidential', tags: ['عقد', 'قانوني'] },
    { ...base, id: 'fil-3', name: 'سياسة_العمل_الهجين_بالانس_2026.pdf', folder: 'hr', mimeType: 'application/pdf', sizeLabel: '1.1 MB', storagePath: 'gs://balance-os/hr/hybrid-policy.pdf', version: 'v2.1', classification: 'public_internal', tags: ['سياسات', 'HR'] },
  ];

  const knowledgeArticles: KnowledgeArticle[] = [
    {
      ...base,
      id: 'kb-1',
      title: 'إجراءات تسليم الخام من قسم التصوير إلى المونتاج (SOP-03)',
      category: 'sop',
      departmentId: 'dept-photo',
      summary: 'معايير تسمية المجلدات، النسخ الاحتياطي المزدوج، وتعبئة بطاقة تسليم الخام.',
      content: '1. إنشاء مجلد باسم المشروع والتاريخ.\n2. التحقق من نسختين احتياطيتين قبل مسح كروت الكاميرا.\n3. تحديث حالة التصوير إلى Footage Uploaded ليصل إشعار تلقائي لقسم المونتاج.',
      version: '2.0',
      reviewDate: '2026-10-01',
    },
    {
      ...base,
      id: 'kb-2',
      title: 'سياسة الاعتمادات المالية والفصل بين الطالب والمعتمد',
      category: 'policy',
      departmentId: 'dept-fin',
      summary: 'ضوابط صرف العهد، المصروفات، القيود المحاسبية وإغلاق الفترات المالية.',
      content: 'يُحظر نظامياً اعتماد أي مصروف أو طلب شراء من نفس الشخص الذي أنشأ الطلب. جميع القيود المرحّلة غير قابلة للتعديل وتُصحح بقيد عكسي فقط.',
      version: '1.4',
      reviewDate: '2026-11-01',
    },
  ];

  const workflows: WorkflowRule[] = [
    { ...base, id: 'wf-1', name: 'تصوير مكتمل -> إشعار قسم المونتاج', description: 'عند اكتمال تسليم الخام يتم إنشاء مهمة مونتاج وإشعار رئيس القسم.', trigger: 'shoot_completed', conditionSummary: 'status == handover_completed', action: 'create_task', targetDepartmentId: 'dept-edit', enabled: true, runCount: 4 },
    { ...base, id: 'wf-2', name: 'اعتماد العقد -> إنشاء المشروع والمهام القياسية', description: 'تحويل العقد المفعل إلى مشروع مستقل مع قالب المهام.', trigger: 'approval_granted', conditionSummary: 'entity == contract', action: 'create_project', targetDepartmentId: 'dept-mgmt', enabled: true, runCount: 2 },
    { ...base, id: 'wf-3', name: 'فاتورة متأخرة -> إشعار المالية وإنشاء متابعة', description: 'عند تجاوز تاريخ الاستحقاق يتم إشعار المحاسب لمتابعة التحصيل.', trigger: 'invoice_overdue', conditionSummary: 'outstanding > 0', action: 'send_notification', targetDepartmentId: 'dept-fin', enabled: true, runCount: 3 },
  ];

  const workflowLogs: WorkflowLog[] = [
    { ...base, id: 'wfl-1', workflowId: 'wf-3', workflowName: 'فاتورة متأخرة -> إشعار المالية وإنشاء متابعة', idempotencyKey: 'wf-3:invoice_overdue:inv-3', triggerEntityId: 'inv-3', result: 'success', message: 'تم إشعار الإدارة المالية بمتابعة فاتورة عيادات أورورا المتأخرة.' },
  ];

  const approvals: ApprovalRequest[] = [
    { ...base, id: 'app-1', title: 'اعتماد مصروف استضافة سحابية — منصة مسار', entityType: 'expense', entityId: 'exp-2', amountPiasters: 480000, requesterUid: 'emp-dev-1', status: 'pending', branchId: 'br-cairo' },
    { ...base, id: 'app-2', title: 'اعتماد عرض سعر فندق كايرو جيت (100,320 ج.م)', entityType: 'proposal', entityId: 'prop-1', amountPiasters: 10032000, requesterUid: 'emp-sales-1', status: 'pending', branchId: 'br-cairo' },
    { ...base, id: 'app-3', title: 'طلب إجازة سنوية — نور سمير', entityType: 'leave', entityId: 'lv-1', requesterUid: 'emp-design-1', status: 'pending', branchId: 'br-cairo' },
  ];

  const notifications: NotificationItem[] = [
    { ...base, id: 'not-1', recipientUid: ownerUid, title: 'طلب اعتماد معلق', body: 'عرض سعر فندق كايرو جيت بانتظار المراجعة والاعتماد.', category: 'approval', read: false, actionRoute: '/crm/proposals' },
    { ...base, id: 'not-2', recipientUid: ownerUid, title: 'فاتورة متأخرة التحصيل', body: 'فاتورة عيادات أورورا INV-2026-103 تجاوزت تاريخ الاستحقاق.', category: 'finance', read: false, actionRoute: '/finance' },
    { ...base, id: 'not-3', recipientUid: ownerUid, title: 'مشروع معرض للخطر', body: 'مشروع روستري الميناء تجاوز التكلفة المقدرة بنسبة 7.8%.', category: 'production', read: false, actionRoute: '/projects/proj-3' },
  ];

  const auditLogs: AuditLogItem[] = [
    { id: 'aud-1', actorUid: 'emp-acc-1', action: 'POST_JOURNAL', entity: 'journalEntries', entityId: 'je-4', summary: 'ترحيل قيد مصروفات الإنتاج والتشغيل JE-2026-004 بقيمة 132,000 ج.م', branchId: 'br-cairo', ownerUid, memberUids: [ownerUid], createdAt: '2026-11-15T14:20:00Z' },
    { id: 'aud-2', actorUid: 'emp-pm-1', action: 'APPROVE_DELIVERABLE', entity: 'projects', entityId: 'proj-1', summary: 'اعتماد مخرج الفيديو التعريفي 4K لمشروع النيل العقارية', branchId: 'br-cairo', ownerUid, memberUids: [ownerUid], createdAt: '2026-11-18T11:05:00Z' },
  ];

  return {
    company,
    branches,
    departments,
    teams,
    employees,
    customRoles,
    clients,
    leads,
    deals,
    services,
    proposals,
    contracts,
    projects,
    tasks,
    shoots,
    equipmentReservations,
    editingJobs,
    designJobs,
    marketingItems,
    devItems,
    accounts,
    fiscalPeriods,
    journalEntries,
    invoices,
    payments,
    expenses,
    treasuryAccounts,
    treasuryTransfers,
    procurementRequests,
    assets,
    attendanceRecords,
    leaveRequests,
    payrollRuns,
    supportTickets,
    files,
    knowledgeArticles,
    workflows,
    workflowLogs,
    approvals,
    notifications,
    auditLogs,
  };
}
