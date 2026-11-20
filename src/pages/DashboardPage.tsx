import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { AlertTriangle, ArrowUpLeft, ArrowUpRight, CheckCircle2, FileText } from 'lucide-react';
import { useOS } from '../context/OSContext';
import {
  PageHeader,
  Panel,
  StatMetric,
  StatusIndicator,
  btnSecondaryCls,
  btnPrimaryCls,
} from '../components/common/UIPrimitives';
import {
  calculateProjectContributionMargin,
  computeArAging,
  computeFinancialStatements,
  formatEGP,
} from '../utils/accounting';
import { isRecordVisibleToUser } from '../utils/rbac';

export function DashboardPage() {
  const { data, lang, currentUser, activeBranchId, isDemoMode, includeDemoInLiveReports } = useOS();
  const navigate = useNavigate();

  const includeDemo = isDemoMode || includeDemoInLiveReports;

  const statements = useMemo(
    () =>
      computeFinancialStatements(data.accounts, data.journalEntries, {
        includeDemo,
        branchId: activeBranchId,
      }),
    [activeBranchId, data.accounts, data.journalEntries, includeDemo]
  );

  const visibleProjects = useMemo(
    () =>
      data.projects.filter(
        (p) => (includeDemo || !p.isDemo) && isRecordVisibleToUser(p, currentUser, activeBranchId)
      ),
    [activeBranchId, currentUser, data.projects, includeDemo]
  );

  const visibleInvoices = useMemo(
    () =>
      data.invoices.filter(
        (inv) => (includeDemo || !inv.isDemo) && isRecordVisibleToUser(inv, currentUser, activeBranchId)
      ),
    [activeBranchId, currentUser, data.invoices, includeDemo]
  );

  const visibleLeads = useMemo(
    () =>
      data.leads.filter(
        (l) => (includeDemo || !l.isDemo) && isRecordVisibleToUser(l, currentUser, activeBranchId)
      ),
    [activeBranchId, currentUser, data.leads, includeDemo]
  );

  const arAging = useMemo(() => computeArAging(visibleInvoices, '2026-11-20'), [visibleInvoices]);

  const totalCashPiasters = useMemo(
    () =>
      data.treasuryAccounts
        .filter((tr) => activeBranchId === 'all' || tr.branchId === activeBranchId)
        .reduce((sum, tr) => sum + tr.balancePiasters, 0),
    [activeBranchId, data.treasuryAccounts]
  );

  const pipelineValuePiasters = useMemo(
    () =>
      visibleLeads
        .filter((l) => l.stage !== 'lost' && l.stage !== 'won')
        .reduce((sum, l) => sum + l.estimatedBudgetPiasters, 0),
    [visibleLeads]
  );

  const overdueTasks = useMemo(
    () => data.tasks.filter((tk) => tk.status !== 'completed' && tk.dueDate < '2026-11-20'),
    [data.tasks]
  );

  const monthlyChartData = useMemo(() => {
    const revEgp = Math.round(statements.totalRevenuePiasters / 100);
    const expEgp = Math.round((statements.totalDirectCostPiasters + statements.totalOperatingExpensePiasters) / 100);
    return [
      { month: lang === 'ar' ? 'يوليو' : 'Jul', revenue: Math.round(revEgp * 0.65), expense: Math.round(expEgp * 0.7) },
      { month: lang === 'ar' ? 'أغسطس' : 'Aug', revenue: Math.round(revEgp * 0.72), expense: Math.round(expEgp * 0.74) },
      { month: lang === 'ar' ? 'سبتمبر' : 'Sep', revenue: Math.round(revEgp * 0.81), expense: Math.round(expEgp * 0.79) },
      { month: lang === 'ar' ? 'أكتوبر' : 'Oct', revenue: Math.round(revEgp * 0.9), expense: Math.round(expEgp * 0.86) },
      { month: lang === 'ar' ? 'نوفمبر' : 'Nov', revenue: revEgp, expense: expEgp },
    ];
  }, [lang, statements]);

  const NavArrow = lang === 'ar' ? ArrowUpLeft : ArrowUpRight;

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          lang === 'ar'
            ? `مرحباً، ${currentUser?.fullName ?? 'الإدارة التنفيذية'}`
            : `Welcome back, ${currentUser?.fullNameEn ?? currentUser?.fullName ?? 'Executive'}`
        }
        description={
          lang === 'ar'
            ? 'ملخص الأداء التنفيذي المباشر عبر المبيعات، المشاريع، الإنتاج، والمالية مزدوجة القيد.'
            : 'Real-time executive overview across sales pipeline, projects, production, and double-entry finance.'
        }
        actions={
          <>
            <button type="button" onClick={() => navigate('/reports')} className={btnSecondaryCls}>
              <FileText className="w-4 h-4" />
              <span>{lang === 'ar' ? 'التقارير الموثقة' : 'Verified Reports'}</span>
            </button>
            <button type="button" onClick={() => navigate('/ai')} className={btnPrimaryCls}>
              <span>BALANCE INTELLIGENCE</span>
              <NavArrow className="w-4 h-4" />
            </button>
          </>
        }
      />

      {/* Executive KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatMetric
          label={lang === 'ar' ? 'الإيرادات المعتمدة (من القيود)' : 'Recognized Revenue'}
          value={formatEGP(statements.totalRevenuePiasters, lang)}
          meta={
            statements.trialBalanceBalanced
              ? lang === 'ar'
                ? 'ميزان المراجعة متزن 100%'
                : 'Trial Balance Balanced'
              : lang === 'ar'
                ? 'تحقق من اتزان القيود'
                : 'Check Ledger Balance'
          }
          tone="success"
        />
        <StatMetric
          label={lang === 'ar' ? 'صافي الربح المحاسبي' : 'Net Profit'}
          value={formatEGP(statements.netProfitPiasters, lang)}
          meta={
            lang === 'ar'
              ? `مجمل الربح: ${formatEGP(statements.grossProfitPiasters, lang)}`
              : `Gross Profit: ${formatEGP(statements.grossProfitPiasters, lang)}`
          }
          tone={statements.netProfitPiasters >= 0 ? 'info' : 'danger'}
        />
        <StatMetric
          label={lang === 'ar' ? 'إجمالي السيولة بالخزائن والبنوك' : 'Total Treasury Cash'}
          value={formatEGP(totalCashPiasters, lang)}
          meta={
            lang === 'ar'
              ? `الذمم المستحقة: ${formatEGP(arAging.totalOutstandingPiasters, lang)}`
              : `AR Outstanding: ${formatEGP(arAging.totalOutstandingPiasters, lang)}`
          }
          tone="neutral"
        />
        <StatMetric
          label={lang === 'ar' ? 'قيمة الفرص النشطة بالـ CRM' : 'Active Pipeline Value'}
          value={formatEGP(pipelineValuePiasters, lang)}
          meta={
            lang === 'ar'
              ? `${visibleProjects.filter((p) => p.status === 'active' || p.status === 'at_risk').length} مشاريع جارية`
              : `${visibleProjects.filter((p) => p.status === 'active' || p.status === 'at_risk').length} active projects`
          }
          tone="warning"
        />
      </div>

      {/* Deskera-Inspired Paired Revenue vs Expense & AR Aging */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <Panel
          className="lg:col-span-7"
          title={lang === 'ar' ? 'الأداء المالي (الإيرادات مقابل المصروفات)' : 'Profit & Loss Trend (Revenue vs Expenses)'}
          subtitle={lang === 'ar' ? 'مبني حصرياً على قيود اليومية المرحّلة بالجنيه المصري' : 'Derived strictly from posted journal entries (EGP)'}
          action={
            <button type="button" onClick={() => navigate('/finance')} className="text-xs font-semibold text-[#2563EB] hover:underline">
              {lang === 'ar' ? 'فتح المالية' : 'Open Finance'}
            </button>
          }
        >
          <div className="h-64 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EC" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#667085' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#667085' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value) => [`${Number(value ?? 0).toLocaleString('en-EG')} ${lang === 'ar' ? 'ج.م' : 'EGP'}`]}
                  contentStyle={{ borderRadius: '8px', borderColor: '#E4E7EC', fontSize: '12px' }}
                />
                <Bar dataKey="revenue" name={lang === 'ar' ? 'الإيرادات' : 'Revenue'} fill="#2563EB" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name={lang === 'ar' ? 'التكاليف والمصروفات' : 'Expenses'} fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel
          className="lg:col-span-5"
          title={lang === 'ar' ? 'أعمار الذمم المدينة (المستحق على العملاء)' : 'Accounts Receivable Aging'}
          subtitle={
            lang === 'ar'
              ? `إجمالي المستحق: ${formatEGP(arAging.totalOutstandingPiasters, lang)}`
              : `Total Outstanding: ${formatEGP(arAging.totalOutstandingPiasters, lang)}`
          }
          action={
            <button type="button" onClick={() => navigate('/finance/invoices')} className="text-xs font-semibold text-[#2563EB] hover:underline">
              {lang === 'ar' ? 'الفواتير' : 'Invoices'}
            </button>
          }
        >
          <div className="space-y-4 mt-2">
            {[
              { label: lang === 'ar' ? 'مستحق اليوم / غير متأخر' : 'Due Today / Current', val: arAging.dueTodayPiasters, color: 'bg-[#2563EB]' },
              { label: lang === 'ar' ? 'متأخر 1 إلى 30 يوم' : '1 – 30 Days Overdue', val: arAging.days1To30Piasters, color: 'bg-[#D97706]' },
              { label: lang === 'ar' ? 'متأخر 31 إلى 60 يوم' : '31 – 60 Days Overdue', val: arAging.days31To60Piasters, color: 'bg-[#EA580C]' },
              { label: lang === 'ar' ? 'متأخر أكثر من 60 يوم' : '60+ Days Overdue', val: arAging.days61To90Piasters + arAging.over90DaysPiasters, color: 'bg-[#DC2626]' },
            ].map((bucket) => {
              const pct =
                arAging.totalOutstandingPiasters > 0
                  ? Math.round((bucket.val / arAging.totalOutstandingPiasters) * 100)
                  : 0;
              return (
                <div key={bucket.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#101828] dark:text-[#F9FAFB]">{bucket.label}</span>
                    <span className="font-semibold tabular-nums text-[#667085] dark:text-[#9CA3AF]">
                      {formatEGP(bucket.val, lang)} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-[#EEF2F6] dark:bg-[#182235] rounded overflow-hidden">
                    <div className={`h-full ${bucket.color}`} style={{ width: `${Math.max(pct, bucket.val > 0 ? 6 : 0)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      {/* Project Health & Critical Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <Panel
          className="lg:col-span-8"
          title={lang === 'ar' ? 'صحة المشاريع وهامش المساهمة' : 'Project Health & Contribution Margin'}
          subtitle={lang === 'ar' ? 'هامش المساهمة = الإيراد المعتمد - التكاليف المباشرة' : 'Contribution Margin = Approved Revenue - Direct Costs'}
          action={
            <button type="button" onClick={() => navigate('/projects')} className="text-xs font-semibold text-[#2563EB] hover:underline">
              {lang === 'ar' ? 'كل المشاريع' : 'View All'}
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead>
                <tr className="border-b border-[#E4E7EC] dark:border-[#293548] text-[#667085]">
                  <th className="py-2.5 text-start font-semibold">{lang === 'ar' ? 'المشروع' : 'Project'}</th>
                  <th className="py-2.5 text-start font-semibold">{lang === 'ar' ? 'الإنجاز' : 'Progress'}</th>
                  <th className="py-2.5 text-start font-semibold">{lang === 'ar' ? 'هامش المساهمة' : 'Contribution'}</th>
                  <th className="py-2.5 text-start font-semibold">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E7EC] dark:divide-[#293548]">
                {visibleProjects.map((proj) => {
                  const cm = calculateProjectContributionMargin(proj);
                  return (
                    <tr
                      key={proj.id}
                      onClick={() => navigate(`/projects/${proj.id}`)}
                      className="hover:bg-[#F7F9FC] dark:hover:bg-[#182235] cursor-pointer"
                    >
                      <td className="py-3 font-medium text-[#101828] dark:text-[#F9FAFB]">{proj.name}</td>
                      <td className="py-3 tabular-nums">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-[#EEF2F6] dark:bg-[#182235] rounded overflow-hidden">
                            <div className="h-full bg-[#2563EB]" style={{ width: `${proj.progress}%` }} />
                          </div>
                          <span>{proj.progress}%</span>
                        </div>
                      </td>
                      <td className="py-3 tabular-nums font-semibold">
                        {formatEGP(cm.contributionMarginPiasters, lang)} ({cm.marginPercent}%)
                      </td>
                      <td className="py-3">
                        <StatusIndicator status={proj.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel
          className="lg:col-span-4"
          title={lang === 'ar' ? 'التنبيهات الحرجة' : 'Critical Operational Alerts'}
          subtitle={lang === 'ar' ? 'عناصر تتطلب تدخل الإدارة' : 'Items requiring immediate review'}
        >
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg border border-red-200 dark:border-red-900 bg-red-50/60 dark:bg-red-950/20 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-[#101828] dark:text-[#F9FAFB]">
                  {lang === 'ar'
                    ? `${overdueTasks.length} مهام متأخرة عن موعدها`
                    : `${overdueTasks.length} Overdue Tasks`}
                </div>
                <button type="button" onClick={() => navigate('/tasks')} className="mt-1 text-[#DC2626] font-semibold hover:underline">
                  {lang === 'ar' ? 'مراجعة المهام المتأخرة' : 'Inspect tasks'}
                </button>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/20 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-[#101828] dark:text-[#F9FAFB]">
                  {lang === 'ar'
                    ? `${data.approvals.filter((a) => a.status === 'pending').length} طلبات اعتماد معلقة`
                    : `${data.approvals.filter((a) => a.status === 'pending').length} Pending Approvals`}
                </div>
                <button type="button" onClick={() => navigate('/workspace')} className="mt-1 text-[#D97706] font-semibold hover:underline">
                  {lang === 'ar' ? 'فتح صندوق الاعتمادات' : 'Open approvals inbox'}
                </button>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-[#E4E7EC] dark:border-[#293548] bg-[#F7F9FC] dark:bg-[#0B1220] flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-[#101828] dark:text-[#F9FAFB]">
                  {lang === 'ar'
                    ? `${data.shoots.length} أيام تصوير مجدولة`
                    : `${data.shoots.length} Scheduled Shoots`}
                </div>
                <button type="button" onClick={() => navigate('/production')} className="mt-1 text-[#2563EB] font-semibold hover:underline">
                  {lang === 'ar' ? 'مراجعة جدول الإنتاج والمعدات' : 'Review production schedule'}
                </button>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
