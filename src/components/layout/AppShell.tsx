import React, { useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  Box,
  Briefcase,
  Building2,
  Calendar,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Code2,
  DollarSign,
  FileSignature,
  FolderOpen,
  Globe,
  Headphones,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Moon,
  Package,
  Palette,
  Plus,
  Search,
  Settings,
  ShoppingCart,
  Sun,
  UserCheck,
  Users,
  Video,
  Workflow,
  X,
  CheckCircle2,
  AlertCircle,
  Info,
} from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { GROUP_LABELS, NAV_ITEMS, t } from '../../i18n/translations';
import type { ModuleKey, RoleId } from '../../types/os';
import { hasPermission, ROLE_LABELS } from '../../utils/rbac';
import { Modal, inputCls, btnPrimaryCls, btnSecondaryCls } from '../common/UIPrimitives';
import { toPiasters } from '../../utils/accounting';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { OfflineIndicator } from '../pwa/OfflineIndicator';

const MODULE_ICONS: Record<ModuleKey, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  workspace: UserCheck,
  company: Building2,
  crm: Briefcase,
  clients: Users,
  proposals: FileSignature,
  projects: FolderOpen,
  tasks: CheckSquare,
  calendar: Calendar,
  production: Clapperboard,
  studio3d: Box,
  editing: Video,
  design: Palette,
  marketing: Megaphone,
  development: Code2,
  finance: DollarSign,
  procurement: ShoppingCart,
  assets: Package,
  hr: Users,
  support: Headphones,
  files: FolderOpen,
  knowledge: BookOpen,
  reports: BarChart3,
  ai: Bot,
  automation: Workflow,
  settings: Settings,
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const {
    lang,
    setLang,
    theme,
    setTheme,
    currentUser,
    isDemoMode,
    switchDemoRole,
    activeBranchId,
    setActiveBranchId,
    data,
    signOut,
    toasts,
    dismissToast,
    markNotificationRead,
    decideApproval,
    createLead,
    createExpense,
    createTask,
  } = useOS();

  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [quickKind, setQuickKind] = useState<'lead' | 'task' | 'expense'>('lead');

  // Quick create form states
  const [qcTitle, setQcTitle] = useState('');
  const [qcPhone, setQcPhone] = useState('');
  const [qcAmount, setQcAmount] = useState('5000');

  const visibleNavItems = useMemo(() => {
    return NAV_ITEMS.filter((item) => hasPermission(currentUser, item.key, 'view'));
  }, [currentUser]);

  const groupedNav = useMemo(() => {
    const groups: Array<{
      group: (typeof NAV_ITEMS)[number]['group'];
      items: typeof NAV_ITEMS;
    }> = [];
    const order: (typeof NAV_ITEMS)[number]['group'][] = [
      'core',
      'commercial',
      'operations',
      'creative',
      'finance',
      'people',
      'intelligence',
    ];
    for (const g of order) {
      const items = visibleNavItems.filter((i) => i.group === g);
      if (items.length > 0) groups.push({ group: g, items });
    }
    return groups;
  }, [visibleNavItems]);

  const unreadCount = useMemo(
    () => data.notifications.filter((n) => !n.read).length,
    [data.notifications]
  );
  const pendingApprovals = useMemo(
    () => data.approvals.filter((a) => a.status === 'pending'),
    [data.approvals]
  );

  const searchResults = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return [];
    const out: Array<{ type: string; label: string; route: string }> = [];
    data.clients
      .filter((c) => c.name.toLowerCase().includes(q))
      .slice(0, 4)
      .forEach((c) => out.push({ type: lang === 'ar' ? 'عميل' : 'Client', label: c.name, route: '/crm/clients' }));
    data.leads
      .filter((l) => l.businessName.toLowerCase().includes(q) || l.contactName.toLowerCase().includes(q))
      .slice(0, 4)
      .forEach((l) => out.push({ type: lang === 'ar' ? 'عميل محتمل' : 'Lead', label: l.businessName, route: '/crm' }));
    data.projects
      .filter((p) => p.name.toLowerCase().includes(q))
      .slice(0, 4)
      .forEach((p) => out.push({ type: lang === 'ar' ? 'مشروع' : 'Project', label: p.name, route: `/projects/${p.id}` }));
    data.tasks
      .filter((tk) => tk.title.toLowerCase().includes(q))
      .slice(0, 4)
      .forEach((tk) => out.push({ type: lang === 'ar' ? 'مهمة' : 'Task', label: tk.title, route: '/tasks' }));
    data.invoices
      .filter((inv) => inv.invoiceNumber.toLowerCase().includes(q))
      .slice(0, 4)
      .forEach((inv) => out.push({ type: lang === 'ar' ? 'فاتورة' : 'Invoice', label: inv.invoiceNumber, route: '/finance' }));
    return out;
  }, [data.clients, data.invoices, data.leads, data.projects, data.tasks, lang, searchTerm]);

  const handleQuickCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qcTitle.trim()) return;
    const branchId = activeBranchId === 'all' ? data.branches[0]?.id ?? 'br-cairo' : activeBranchId;

    if (quickKind === 'lead') {
      const res = await createLead({
        businessName: qcTitle.trim(),
        contactName: qcTitle.trim(),
        phone: qcPhone.trim() || '01099887766',
        industry: 'Services',
        location: 'Cairo',
        source: 'direct_outreach',
        stage: 'new_lead',
        priority: 'medium',
        interestedServices: [],
        estimatedBudgetPiasters: toPiasters(Number(qcAmount) || 0),
        assignedUid: currentUser?.uid ?? 'demo-ceo-01',
        branchId,
      });
      if (!res.ok) return;
    } else if (quickKind === 'task' && data.projects[0]) {
      const res = await createTask({
        title: qcTitle.trim(),
        projectId: data.projects[0].id,
        departmentId: data.departments[0]?.id ?? 'dept-mgmt',
        assigneeUid: currentUser?.uid ?? 'demo-ceo-01',
        priority: 'medium',
        status: 'ready',
        dueDate: new Date().toISOString().slice(0, 10),
        checklist: [],
      });
      if (!res.ok) return;
    } else if (quickKind === 'expense') {
      await createExpense({
        description: qcTitle.trim(),
        category: 'تشغيل',
        amountPiasters: toPiasters(Math.max(1, Number(qcAmount) || 100)),
        date: new Date().toISOString().slice(0, 10),
        branchId,
        departmentId: data.departments[0]?.id ?? 'dept-mgmt',
        paymentMethod: 'petty_cash',
      });
    }
    setQcTitle('');
    setQcPhone('');
    setQuickCreateOpen(false);
  };

  const SidebarContent = (
    <div className="flex flex-col h-full bg-[#101828] text-slate-200 select-none">
      <div className="flex items-center justify-between px-4 h-14 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#2563EB] text-white flex items-center justify-center font-bold text-sm shrink-0">
            B
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-sm font-bold text-white truncate">BALANCE OS</div>
              <div className="text-[11px] text-slate-400 truncate">
                {data.company.name}
              </div>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden lg:inline-flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          {lang === 'ar' ? (
            collapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
          ) : collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation menu"
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav aria-label="Primary Navigation" className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
        {groupedNav.map((grp) => (
          <div key={grp.group}>
            {!collapsed && (
              <div className="px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {GROUP_LABELS[grp.group][lang]}
              </div>
            )}
            <ul className="space-y-0.5">
              {grp.items.map((item) => {
                const Icon = MODULE_ICONS[item.key] ?? Activity;
                return (
                  <li key={item.key}>
                    <NavLink
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                          isActive
                            ? 'bg-[#2563EB] text-white'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                        }`
                      }
                      title={collapsed ? item[lang] : undefined}
                    >
                      <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                      {!collapsed && <span className="truncate">{item[lang]}</span>}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-800 shrink-0">
        {!collapsed && currentUser && (
          <div className="mb-2 px-1">
            <div className="text-xs font-semibold text-white truncate">
              {lang === 'ar' ? currentUser.fullName : currentUser.fullNameEn ?? currentUser.fullName}
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {ROLE_LABELS[currentUser.role]?.[lang] ?? currentUser.role}
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>{t(lang, 'signOut')}</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#F7F9FC] dark:bg-[#0B1220] text-[#101828] dark:text-[#F9FAFB]">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 transition-all duration-200 border-e border-[#E4E7EC] dark:border-[#293548] ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="sticky top-0 h-screen">{SidebarContent}</div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="w-72 max-w-[85vw] h-full shadow-2xl">{SidebarContent}</div>
          <button
            type="button"
            aria-label="Close drawer backdrop"
            className="flex-1 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-14 bg-white dark:bg-[#111827] border-b border-[#E4E7EC] dark:border-[#293548] px-4 lg:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 rounded-lg text-[#667085] hover:bg-[#EEF2F6] dark:hover:bg-[#182235]"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs text-[#667085] dark:text-[#9CA3AF] bg-[#F7F9FC] dark:bg-[#0B1220] border border-[#E4E7EC] dark:border-[#293548] rounded-lg hover:border-[#2563EB] w-64 md:w-80 truncate"
            >
              <Search className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{t(lang, 'searchPlaceholder')}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Branch Filter */}
            <select
              aria-label={t(lang, 'branch')}
              value={activeBranchId}
              onChange={(e) => setActiveBranchId(e.target.value)}
              className="hidden md:block px-2.5 py-1.5 text-xs font-medium bg-[#F7F9FC] dark:bg-[#0B1220] border border-[#E4E7EC] dark:border-[#293548] rounded-lg text-[#101828] dark:text-[#F9FAFB]"
            >
              <option value="all">{t(lang, 'allBranches')}</option>
              {data.branches.map((br) => (
                <option key={br.id} value={br.id}>
                  {lang === 'ar' ? br.name : br.nameEn}
                </option>
              ))}
            </select>

            {/* Demo Role Switcher */}
            {isDemoMode && currentUser && (
              <select
                aria-label={lang === 'ar' ? 'تبديل دور المعاينة' : 'Preview Role'}
                value={currentUser.role}
                onChange={(e) => switchDemoRole(e.target.value as RoleId)}
                className="hidden xl:block px-2.5 py-1.5 text-xs font-medium bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-900 dark:text-amber-200"
              >
                {(Object.keys(ROLE_LABELS) as RoleId[]).map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r][lang]}
                  </option>
                ))}
              </select>
            )}

            {/* Quick Create */}
            <PWAInstallButton />
            <button
              type="button"
              onClick={() => setQuickCreateOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t(lang, 'quickCreate')}</span>
            </button>

            {/* Notifications & Approvals */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((o) => !o)}
                aria-label={t(lang, 'notifications')}
                className="relative p-2 rounded-lg border border-[#E4E7EC] dark:border-[#293548] bg-white dark:bg-[#111827] hover:bg-[#EEF2F6] dark:hover:bg-[#182235]"
              >
                <Bell className="w-4 h-4" />
                {(unreadCount > 0 || pendingApprovals.length > 0) && (
                  <span className="absolute -top-1 -end-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#DC2626] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                    {unreadCount + pendingApprovals.length}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute end-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#111827] border border-[#E4E7EC] dark:border-[#293548] rounded-xl shadow-xl p-4 z-50 max-h-[75vh] overflow-y-auto space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">{t(lang, 'approvals')} ({pendingApprovals.length})</span>
                    <button
                      type="button"
                      onClick={() => setNotifOpen(false)}
                      aria-label="Close notifications"
                      className="text-xs text-[#667085] hover:text-[#101828]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {pendingApprovals.slice(0, 4).map((app) => (
                    <div key={app.id} className="p-2.5 rounded-lg bg-[#F7F9FC] dark:bg-[#0B1220] border border-[#E4E7EC] dark:border-[#293548] space-y-2">
                      <div className="text-xs font-semibold">{app.title}</div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => decideApproval(app.id, 'approved')}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-[#16A34A] text-white rounded"
                        >
                          {t(lang, 'approve')}
                        </button>
                        <button
                          type="button"
                          onClick={() => decideApproval(app.id, 'rejected')}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-[#DC2626] text-white rounded"
                        >
                          {t(lang, 'reject')}
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-[#E4E7EC] dark:border-[#293548]">
                    <div className="text-sm font-bold mb-2">{t(lang, 'notifications')}</div>
                    <div className="space-y-2">
                      {data.notifications.slice(0, 5).map((n) => (
                        <button
                          type="button"
                          key={n.id}
                          onClick={() => {
                            markNotificationRead(n.id);
                            setNotifOpen(false);
                            navigate(n.actionRoute);
                          }}
                          className={`w-full text-start p-2 rounded-lg text-xs border ${
                            n.read
                              ? 'border-[#E4E7EC] dark:border-[#293548] opacity-70'
                              : 'border-[#2563EB]/40 bg-blue-50/40 dark:bg-blue-950/20'
                          }`}
                        >
                          <div className="font-semibold">{n.title}</div>
                          <div className="text-[#667085] dark:text-[#9CA3AF] mt-0.5">{n.body}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Language Switch */}
            <button
              type="button"
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              aria-label="Toggle language"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold border border-[#E4E7EC] dark:border-[#293548] rounded-lg hover:bg-[#EEF2F6] dark:hover:bg-[#182235]"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'EN' : 'AR'}</span>
            </button>

            {/* Theme Switch */}
            <button
              type="button"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              aria-label={theme === 'light' ? 'Enable dark mode' : 'Enable light mode'}
              className="p-2 border border-[#E4E7EC] dark:border-[#293548] rounded-lg hover:bg-[#EEF2F6] dark:hover:bg-[#182235]"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          </div>
        </header>

        <OfflineIndicator />

        {/* Demo Sandbox Banner */}
        {isDemoMode && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900 px-4 lg:px-6 py-2 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3">
            <span>{t(lang, 'demoBanner')}</span>
            <button
              type="button"
              onClick={() => navigate('/settings')}
              className="underline font-semibold whitespace-nowrap shrink-0"
            >
              {lang === 'ar' ? 'إدارة بيانات العرض' : 'Manage Demo Data'}
            </button>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">{children}</main>
      </div>

      {/* Global Search Modal */}
      <Modal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        title={lang === 'ar' ? 'البحث الشامل في BALANCE OS' : 'Global Search'}
      >
        <div className="space-y-4">
          <input
            type="search"
            autoFocus
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t(lang, 'searchPlaceholder')}
            className={inputCls}
          />
          <div className="divide-y divide-[#E4E7EC] dark:divide-[#293548]">
            {searchTerm.trim() === '' ? (
              <p className="text-xs text-[#667085] py-4 text-center">
                {lang === 'ar' ? 'اكتب اسم عميل أو مشروع أو مهمة أو رقم فاتورة...' : 'Type a client, project, task, or invoice number...'}
              </p>
            ) : searchResults.length === 0 ? (
              <p className="text-xs text-[#667085] py-4 text-center">{t(lang, 'noData')}</p>
            ) : (
              searchResults.map((r, i) => (
                <button
                  type="button"
                  key={`${r.route}-${i}`}
                  onClick={() => {
                    setSearchOpen(false);
                    navigate(r.route);
                  }}
                  className="w-full py-2.5 px-2 flex items-center justify-between text-start hover:bg-[#F7F9FC] dark:hover:bg-[#182235] rounded"
                >
                  <span className="text-sm font-medium">{r.label}</span>
                  <span className="text-xs text-[#667085]">{r.type}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* Quick Create Modal */}
      <Modal
        open={quickCreateOpen}
        onClose={() => setQuickCreateOpen(false)}
        title={t(lang, 'quickCreate')}
      >
        <form onSubmit={handleQuickCreateSubmit} className="space-y-4">
          <div className="flex gap-2">
            {(['lead', 'task', 'expense'] as const).map((k) => (
              <button
                type="button"
                key={k}
                onClick={() => setQuickKind(k)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${
                  quickKind === k
                    ? 'bg-[#2563EB] text-white border-[#2563EB]'
                    : 'bg-white dark:bg-[#182235] border-[#E4E7EC] dark:border-[#293548]'
                }`}
              >
                {k === 'lead'
                  ? lang === 'ar'
                    ? 'عميل محتمل'
                    : 'Lead'
                  : k === 'task'
                    ? lang === 'ar'
                      ? 'مهمة'
                      : 'Task'
                    : lang === 'ar'
                      ? 'مصروف'
                      : 'Expense'}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">
              {quickKind === 'lead'
                ? lang === 'ar'
                  ? 'اسم النشاط التجاري'
                  : 'Business Name'
                : quickKind === 'task'
                  ? lang === 'ar'
                    ? 'عنوان المهمة'
                    : 'Task Title'
                  : lang === 'ar'
                    ? 'وصف المصروف'
                    : 'Expense Description'}
            </label>
            <input
              required
              value={qcTitle}
              onChange={(e) => setQcTitle(e.target.value)}
              className={inputCls}
            />
          </div>

          {quickKind === 'lead' && (
            <div>
              <label className="block text-xs font-medium mb-1">
                {lang === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
              </label>
              <input
                required
                value={qcPhone}
                onChange={(e) => setQcPhone(e.target.value)}
                placeholder="010xxxxxxxx"
                className={inputCls}
              />
            </div>
          )}

          {(quickKind === 'lead' || quickKind === 'expense') && (
            <div>
              <label className="block text-xs font-medium mb-1">
                {lang === 'ar' ? 'القيمة (جنيه مصري EGP)' : 'Amount (EGP)'}
              </label>
              <input
                type="number"
                min="1"
                value={qcAmount}
                onChange={(e) => setQcAmount(e.target.value)}
                className={`${inputCls} tabular-nums`}
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setQuickCreateOpen(false)} className={btnSecondaryCls}>
              {t(lang, 'cancel')}
            </button>
            <button type="submit" className={btnPrimaryCls}>
              {t(lang, 'create')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Toasts */}
      <div
        aria-live="polite"
        className="fixed bottom-4 end-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-2.5 p-3.5 rounded-xl border shadow-lg text-xs font-medium bg-white dark:bg-[#111827] ${
              toast.type === 'error'
                ? 'border-red-300 dark:border-red-800 text-[#DC2626] dark:text-red-300'
                : toast.type === 'success'
                  ? 'border-emerald-300 dark:border-emerald-800 text-[#16A34A] dark:text-emerald-300'
                  : 'border-[#E4E7EC] dark:border-[#293548] text-[#101828] dark:text-[#F9FAFB]'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            ) : toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span className="flex-1">{toast.text}</span>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
              className="opacity-70 hover:opacity-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
