import React, { useMemo, useState } from 'react';
import {
  Bot,
  Download,
  Play,
  Plus,
  RefreshCw,
  Send,
  Trash2,
} from 'lucide-react';
import { useOS } from '../context/OSContext';
import {
  PageHeader,
  Panel,
  StatusIndicator,
  Modal,
  exportToCsv,
  inputCls,
  btnPrimaryCls,
  btnSecondaryCls,
} from '../components/common/UIPrimitives';
import {
  calculateProjectContributionMargin,
  computeFinancialStatements,
  formatEGP,
} from '../utils/accounting';
import { exportReportToCsv, sendAiChatRequest } from '../services';
import type { WorkflowActionType, WorkflowTriggerType } from '../types/os';

export function ReportsPage() {
  const { data, lang, activeBranchId, isDemoMode, includeDemoInLiveReports } = useOS();
  const includeDemo = isDemoMode || includeDemoInLiveReports;

  const statements = useMemo(
    () =>
      computeFinancialStatements(data.accounts, data.journalEntries, {
        includeDemo,
        branchId: activeBranchId,
      }),
    [activeBranchId, data.accounts, data.journalEntries, includeDemo]
  );

  const kpis = useMemo(() => {
    const completedTasks = data.tasks.filter((t) => t.status === 'completed').length;
    const totalTasks = Math.max(1, data.tasks.length);
    const totalBudget = data.projects.reduce((s, p) => s + p.approvedRevenuePiasters, 0);
    const totalDirect = data.projects.reduce((s, p) => s + p.actualCostPiasters, 0);
    const wonLeads = data.leads.filter((l) => l.stage === 'won').length;
    return [
      {
        name: lang === 'ar' ? 'صافي الربح المحاسبي' : 'Net Accounting Profit',
        formula: 'Recognized Revenue - Direct Costs - Operating Expenses (from Posted Journals)',
        source: 'journalEntries (status == posted | reversed)',
        value: formatEGP(statements.netProfitPiasters, lang),
      },
      {
        name: lang === 'ar' ? 'هامش مساهمة المشاريع الإجمالي' : 'Aggregate Project Contribution',
        formula: 'SUM(Project.approvedRevenue) - SUM(Project.actualDirectCost)',
        source: 'projects + approved direct expenses',
        value: formatEGP(totalBudget - totalDirect, lang),
      },
      {
        name: lang === 'ar' ? 'معدل إنجاز المهام' : 'Task Completion Rate',
        formula: '(Completed Tasks / Total Tasks) * 100',
        source: 'tasks collection',
        value: `${Math.round((completedTasks / totalTasks) * 100)}% (${completedTasks}/${data.tasks.length})`,
      },
      {
        name: lang === 'ar' ? 'معدل تحويل المبيعات' : 'Lead Win Rate',
        formula: '(Won Leads / Total Leads) * 100',
        source: 'leads collection',
        value: `${Math.round((wonLeads / Math.max(1, data.leads.length)) * 100)}%`,
      },
    ];
  }, [data.leads, data.projects, data.tasks, lang, statements.netProfitPiasters]);

  const handleExport = () => {
    exportReportToCsv(
      'balance-os-kpi-report.csv',
      ['KPI', 'Formula', 'Data Source', 'Value'],
      kpis.map((k) => [k.name, k.formula, k.source, k.value])
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={lang === 'ar' ? 'التقارير والتحليلات الموثقة' : 'Verified Reports & Analytics'}
        description={
          lang === 'ar'
            ? 'كل مؤشر أداء مرتبط بصيغة حسابية موثقة ومصدر بيانات حقيقي مع التصدير الفوري.'
            : 'Every KPI displays its audited formula, live data source, and supports CSV export.'
        }
        actions={
          <button type="button" onClick={handleExport} className={btnPrimaryCls}>
            <Download className="w-4 h-4" />
            <span>{lang === 'ar' ? 'تصدير CSV' : 'Export CSV'}</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {kpis.map((k) => (
          <Panel key={k.name} className="space-y-2">
            <div className="text-xs font-semibold text-[#667085]">{k.name}</div>
            <div className="text-2xl font-bold tabular-nums text-[#101828] dark:text-[#F9FAFB]">{k.value}</div>
            <div className="text-[11px] font-mono text-[#2563EB] bg-[#F7F9FC] dark:bg-[#0B1220] p-2 rounded">
              {k.formula}
            </div>
            <div className="text-[11px] text-[#667085]">Source: {k.source}</div>
          </Panel>
        ))}
      </div>

      <Panel title={lang === 'ar' ? 'ربحية المشاريع (هامش المساهمة)' : 'Project Contribution Breakdown'}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#E4E7EC] dark:border-[#293548] text-[#667085]">
                <th className="py-2 text-start">{lang === 'ar' ? 'المشروع' : 'Project'}</th>
                <th className="py-2 text-start">{lang === 'ar' ? 'الإيراد' : 'Revenue'}</th>
                <th className="py-2 text-start">{lang === 'ar' ? 'التكلفة المباشرة' : 'Direct Cost'}</th>
                <th className="py-2 text-start">{lang === 'ar' ? 'هامش المساهمة' : 'Margin'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E7EC] dark:divide-[#293548]">
              {data.projects.map((p) => {
                const cm = calculateProjectContributionMargin(p);
                return (
                  <tr key={p.id}>
                    <td className="py-2.5 font-semibold">{p.name}</td>
                    <td className="py-2.5 tabular-nums">{formatEGP(cm.revenuePiasters, lang)}</td>
                    <td className="py-2.5 tabular-nums">{formatEGP(cm.directCostsPiasters, lang)}</td>
                    <td className="py-2.5 tabular-nums font-bold text-[#16A34A]">
                      {formatEGP(cm.contributionMarginPiasters, lang)} ({cm.marginPercent}%)
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

export function AutomationPage() {
  const { data, lang, createWorkflowRule, toggleWorkflowRule, triggerWorkflowEvent } = useOS();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState<WorkflowTriggerType>('shoot_completed');
  const [action, setAction] = useState<WorkflowActionType>('create_task');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createWorkflowRule({
      name: name.trim(),
      description: `أتمتة: ${trigger} -> ${action}`,
      trigger,
      conditionSummary: 'active == true',
      action,
      targetDepartmentId: 'dept-edit',
      enabled: true,
    });
    setOpen(false);
    setName('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={lang === 'ar' ? 'مركز الأتمتة وسجل التنفيذ' : 'Automation Center'}
        description={
          lang === 'ar'
            ? 'بناء قواعد (الحدث -> الشرط -> الإجراء -> سجل التنفيذ) مع منع التكرار عبر Idempotency Keys.'
            : 'Build Trigger -> Condition -> Action rules with idempotent execution logging.'
        }
        actions={
          <button type="button" onClick={() => setOpen(true)} className={btnPrimaryCls}>
            <Plus className="w-4 h-4" />
            <span>{lang === 'ar' ? 'قاعدة أتمتة جديدة' : 'New Rule'}</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <Panel className="lg:col-span-7" title={lang === 'ar' ? `القواعد النشطة (${data.workflows.length})` : `Workflow Rules (${data.workflows.length})`}>
          <div className="space-y-3">
            {data.workflows.map((wf) => (
              <div key={wf.id} className="p-4 rounded-xl border border-[#E4E7EC] dark:border-[#293548] space-y-2 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-bold">{wf.name}</div>
                    <div className="text-[#667085] mt-0.5">{wf.description}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleWorkflowRule(wf.id)}
                    className={`px-2.5 py-1 rounded font-semibold ${wf.enabled ? 'bg-[#16A34A] text-white' : 'bg-[#EEF2F6] text-[#667085]'}`}
                  >
                    {wf.enabled ? (lang === 'ar' ? 'مفعل' : 'Enabled') : lang === 'ar' ? 'معطل' : 'Disabled'}
                  </button>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[#E4E7EC] dark:border-[#293548]">
                  <span className="font-mono text-[#2563EB]">{wf.trigger} → {wf.action} (runs: {wf.runCount})</span>
                  <button
                    type="button"
                    onClick={() => triggerWorkflowEvent(wf.trigger, `manual-test-${wf.id}`, wf.name)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'اختبار التنفيذ' : 'Test Run'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="lg:col-span-5" title={lang === 'ar' ? 'سجل تنفيذ الأتمتة (Idempotency)' : 'Execution Audit Logs'}>
          <div className="space-y-2.5 text-xs">
            {data.workflowLogs.map((log) => (
              <div key={log.id} className="p-3 rounded-lg border border-[#E4E7EC] dark:border-[#293548]">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{log.workflowName}</span>
                  <StatusIndicator status={log.result === 'success' ? 'completed' : 'partial'} label={log.result} />
                </div>
                <div className="text-[#667085] mt-1">{log.message}</div>
                <div className="text-[11px] font-mono text-[#9CA3AF] mt-1">key: {log.idempotencyKey}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={lang === 'ar' ? 'إضافة قاعدة أتمتة' : 'Create Workflow Rule'}>
        <form onSubmit={handleCreate} className="space-y-3">
          <input required placeholder={lang === 'ar' ? 'اسم القاعدة' : 'Rule Name'} value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          <select value={trigger} onChange={(e) => setTrigger(e.target.value as WorkflowTriggerType)} className={inputCls}>
            <option value="shoot_completed">shoot_completed</option>
            <option value="approval_granted">approval_granted</option>
            <option value="invoice_overdue">invoice_overdue</option>
            <option value="payment_received">payment_received</option>
          </select>
          <select value={action} onChange={(e) => setAction(e.target.value as WorkflowActionType)} className={inputCls}>
            <option value="create_task">create_task</option>
            <option value="send_notification">send_notification</option>
            <option value="create_follow_up">create_follow_up</option>
          </select>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className={btnSecondaryCls}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
            <button type="submit" className={btnPrimaryCls}>{lang === 'ar' ? 'حفظ القاعدة' : 'Save'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

const AI_ROLES = [
  { id: 'ceo', ar: 'مساعد الرئيس التنفيذي (CEO)', en: 'CEO Strategy Advisor' },
  { id: 'sales', ar: 'مساعد المبيعات (CRM)', en: 'Sales & Pipeline Coach' },
  { id: 'project', ar: 'مساعد إدارة المشاريع', en: 'Project Delivery Advisor' },
  { id: 'finance', ar: 'المحلل المالي', en: 'Financial Analyst' },
  { id: 'hr', ar: 'مساعد الموارد البشرية', en: 'HR & Performance Advisor' },
  { id: 'marketing', ar: 'مستشار التسويق والمحتوى', en: 'Marketing Strategist' },
  { id: 'support', ar: 'مساعد خدمة العملاء', en: 'Support Triage Advisor' },
] as const;

export function AiAssistantPage() {
  const { data, lang, isDemoMode, includeDemoInLiveReports, activeBranchId } = useOS();
  const [role, setRole] = useState<(typeof AI_ROLES)[number]['id']>('ceo');
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text:
        lang === 'ar'
          ? 'مرحباً بك في BALANCE INTELLIGENCE. اختر الدور المتخصص واسأل عن أداء المبيعات، المشاريع المتعثرة، أو القوائم المالية. يتم التمييز دائماً بين الحقائق المؤكدة والتقديرات.'
          : 'Welcome to BALANCE INTELLIGENCE. Select an advisor role and ask about pipeline, projects, or ledger metrics.',
    },
  ]);

  const statements = useMemo(
    () =>
      computeFinancialStatements(data.accounts, data.journalEntries, {
        includeDemo: isDemoMode || includeDemoInLiveReports,
        branchId: activeBranchId,
      }),
    [activeBranchId, data.accounts, data.journalEntries, includeDemoInLiveReports, isDemoMode]
  );

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || busy) return;
    const userMsg = prompt.trim();
    setMessages((m) => [...m, { sender: 'user', text: userMsg }]);
    setPrompt('');
    setBusy(true);

    try {
      const reply = await sendAiChatRequest({
        role,
        prompt: userMsg,
        lang,
        isDemoMode,
        revenuePiasters: statements.totalRevenuePiasters,
        netProfitPiasters: statements.netProfitPiasters,
        data,
      });
      setMessages((m) => [...m, { sender: 'ai', text: reply }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { sender: 'ai', text: err instanceof Error ? err.message : 'Request failed' },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="BALANCE INTELLIGENCE"
        description={
          lang === 'ar'
            ? 'المساعد الذكي المؤسسي — يميز بين الحقائق من قاعدة البيانات والتقديرات والتوصيات.'
            : 'Enterprise AI Advisor separating verified ledger facts, estimates, and action suggestions.'
        }
      />

      <div className="flex flex-wrap gap-2">
        {AI_ROLES.map((r) => (
          <button
            type="button"
            key={r.id}
            onClick={() => setRole(r.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${
              role === r.id ? 'bg-[#2563EB] text-white border-[#2563EB]' : 'bg-white dark:bg-[#111827] border-[#E4E7EC] dark:border-[#293548]'
            }`}
          >
            {r[lang]}
          </button>
        ))}
      </div>

      <Panel className="space-y-4">
        <div className="space-y-3 max-h-[50vh] overflow-y-auto p-2">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl text-xs whitespace-pre-wrap leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-[#2563EB] text-white ms-auto max-w-xl'
                  : 'bg-[#F7F9FC] dark:bg-[#0B1220] border border-[#E4E7EC] dark:border-[#293548] max-w-3xl'
              }`}
            >
              {m.sender === 'ai' && (
                <div className="flex items-center gap-1.5 font-bold text-[#2563EB] mb-1.5">
                  <Bot className="w-4 h-4" />
                  <span>BALANCE INTELLIGENCE ({role.toUpperCase()})</span>
                </div>
              )}
              {m.text}
            </div>
          ))}
        </div>

        <form onSubmit={handleSend} className="flex gap-2 pt-2 border-t border-[#E4E7EC] dark:border-[#293548]">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={lang === 'ar' ? 'اسأل المساعد الذكي عن تحليل المبيعات أو المشاريع أو الربحية...' : 'Ask BALANCE INTELLIGENCE...'}
            className={inputCls}
          />
          <button type="submit" disabled={busy} className={btnPrimaryCls}>
            <Send className="w-4 h-4" />
            <span>{busy ? (lang === 'ar' ? 'جاري التحليل...' : 'Thinking...') : lang === 'ar' ? 'إرسال' : 'Ask'}</span>
          </button>
        </form>
      </Panel>
    </div>
  );
}

export function SettingsPage() {
  const {
    lang,
    setLang,
    theme,
    setTheme,
    isDemoMode,
    includeDemoInLiveReports,
    setIncludeDemoInLiveReports,
    resetDemoSandbox,
    seedDemoInFirestore,
    clearDemoInFirestore,
    data,
  } = useOS();

  return (
    <div className="space-y-6">
      <PageHeader
        title={lang === 'ar' ? 'الإعدادات، بيئة العرض، وسجل التدقيق' : 'Settings, Demo Sandbox & Audit Logs'}
        description={
          lang === 'ar'
            ? 'تخصيص المظهر واللغة، إدارة بيانات العرض التجريبية بأمان، ومراجعة سجل التدقيق غير القابل للتعديل.'
            : 'Configure theme, language, isolated demo lifecycle, and immutable audit logs.'
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Panel title={lang === 'ar' ? 'التفضيلات والمظهر' : 'Appearance & Locale'}>
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{lang === 'ar' ? 'اللغة والاتجاه' : 'Language & Direction'}</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => setLang('ar')} className={lang === 'ar' ? btnPrimaryCls : btnSecondaryCls}>العربية (RTL)</button>
                <button type="button" onClick={() => setLang('en')} className={lang === 'en' ? btnPrimaryCls : btnSecondaryCls}>English (LTR)</button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold">{lang === 'ar' ? 'سمة الألوان (Theme)' : 'Color Theme'}</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => setTheme('light')} className={theme === 'light' ? btnPrimaryCls : btnSecondaryCls}>{lang === 'ar' ? 'فاتح' : 'Light'}</button>
                <button type="button" onClick={() => setTheme('dark')} className={theme === 'dark' ? btnPrimaryCls : btnSecondaryCls}>{lang === 'ar' ? 'داكن' : 'Dark'}</button>
              </div>
            </div>
          </div>
        </Panel>

        <Panel
          title={lang === 'ar' ? 'إدارة بيانات العرض التجريبية (Demo Lifecycle)' : 'Demo Data Lifecycle Manager'}
          subtitle={lang === 'ar' ? 'البيانات التجريبية معلمة بـ isDemo ولا تختلط أبداً بالتقارير الحية' : 'Demo records carry isDemo: true and stay isolated from live financial reports'}
        >
          <div className="space-y-3 text-xs">
            {!isDemoMode && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeDemoInLiveReports}
                  onChange={(e) => setIncludeDemoInLiveReports(e.target.checked)}
                />
                <span>{lang === 'ar' ? 'تضمين سجلات العرض التجريبية في المعاينة المالية' : 'Include isDemo records in financial preview'}</span>
              </label>
            )}
            <div className="flex flex-wrap gap-2">
              {isDemoMode ? (
                <button type="button" onClick={resetDemoSandbox} className={btnSecondaryCls}>
                  <RefreshCw className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'إعادة ضبط بيئة العرض' : 'Reset Demo Sandbox'}</span>
                </button>
              ) : (
                <>
                  <button type="button" onClick={seedDemoInFirestore} className={btnSecondaryCls}>
                    <RefreshCw className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'إضافة بيانات تجريبية معزولة' : 'Seed Isolated Demo Batch'}</span>
                  </button>
                  <button type="button" onClick={clearDemoInFirestore} className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#DC2626] rounded-lg">
                    <Trash2 className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'مسح كافة البيانات التجريبية' : 'Purge Demo Data'}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </Panel>
      </div>

      <Panel title={lang === 'ar' ? `سجل التدقيق المؤسسي (Audit Logs — ${data.auditLogs.length})` : `Immutable Audit Logs (${data.auditLogs.length})`}>
        <div className="divide-y divide-[#E4E7EC] dark:divide-[#293548] text-xs">
          {data.auditLogs.map((log) => (
            <div key={log.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-mono font-bold text-[#2563EB]">{log.action}</span>
                <span className="mx-2 text-[#667085]">[{log.entity}]</span>
                <span>{log.summary}</span>
              </div>
              <span className="tabular-nums text-[#667085]">{log.createdAt.slice(0, 19).replace('T', ' ')}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
