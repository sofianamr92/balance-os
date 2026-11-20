import React, { useMemo, useState } from 'react';
import {
  ArrowLeftRight,
  Lock,
  Plus,
  RotateCcw,
  ShieldAlert,
  Unlock,
} from 'lucide-react';
import { useOS } from '../context/OSContext';
import {
  PageHeader,
  Panel,
  StatMetric,
  StatusIndicator,
  Modal,
  inputCls,
  btnPrimaryCls,
  btnSecondaryCls,
} from '../components/common/UIPrimitives';
import {
  computeArAging,
  computeFinancialStatements,
  computeTrialBalance,
  formatEGP,
  toPiasters,
} from '../utils/accounting';
import type { JournalLine } from '../types/os';

export function FinancePage({ defaultTab = 'overview' }: { defaultTab?: 'overview' | 'accounts' | 'journals' | 'invoices' | 'expenses' | 'treasury' }) {
  const {
    data,
    lang,
    currentUser,
    activeBranchId,
    isDemoMode,
    includeDemoInLiveReports,
    createJournalEntry,
    reverseJournalEntry,
    toggleFiscalPeriod,
    createInvoice,
    recordInvoicePayment,
    createExpense,
    decideExpense,
    createTreasuryTransfer,
  } = useOS();

  const [tab, setTab] = useState(defaultTab);
  const includeDemo = isDemoMode || includeDemoInLiveReports;

  const trialBalance = useMemo(
    () =>
      computeTrialBalance(data.accounts, data.journalEntries, {
        includeDemo,
        branchId: activeBranchId,
      }),
    [activeBranchId, data.accounts, data.journalEntries, includeDemo]
  );

  const statements = useMemo(
    () =>
      computeFinancialStatements(data.accounts, data.journalEntries, {
        includeDemo,
        branchId: activeBranchId,
      }),
    [activeBranchId, data.accounts, data.journalEntries, includeDemo]
  );

  const arAging = useMemo(() => computeArAging(data.invoices, '2026-11-20'), [data.invoices]);

  // Journal Modal State
  const [jeModal, setJeModal] = useState(false);
  const [jeDesc, setJeDesc] = useState('');
  const [jeDate, setJeDate] = useState('2026-11-20');
  const [jePeriodId, setJePeriodId] = useState(data.fiscalPeriods.find((p) => p.status === 'open')?.id ?? 'fp-2026-11');
  const [jeDebitAcc, setJeDebitAcc] = useState(data.accounts[1]?.id ?? 'acc-1102');
  const [jeCreditAcc, setJeCreditAcc] = useState(data.accounts[6]?.id ?? 'acc-4101');
  const [jeAmountEgp, setJeAmountEgp] = useState('15000');
  const [jeError, setJeError] = useState<string | null>(null);

  // Invoice Modal State
  const [invModal, setInvModal] = useState(false);
  const [invClientId, setInvClientId] = useState(data.clients[0]?.id ?? 'cli-1');
  const [invDesc, setInvDesc] = useState('');
  const [invAmountEgp, setInvAmountEgp] = useState('25000');

  // Payment Modal State
  const [payInvoiceId, setPayInvoiceId] = useState<string | null>(null);
  const [payAmountEgp, setPayAmountEgp] = useState('5000');
  const [payTreasuryId, setPayTreasuryId] = useState(data.treasuryAccounts[0]?.id ?? 'tr-cib');

  // Expense Modal State
  const [expModal, setExpModal] = useState(false);
  const [expDesc, setExpDesc] = useState('');
  const [expAmountEgp, setExpAmountEgp] = useState('2500');
  const [expProjectId, setExpProjectId] = useState('');

  // Transfer Modal State
  const [trfModal, setTrfModal] = useState(false);
  const [trfFrom, setTrfFrom] = useState(data.treasuryAccounts[0]?.id ?? 'tr-cib');
  const [trfTo, setTrfTo] = useState(data.treasuryAccounts[1]?.id ?? 'tr-cairo-cash');
  const [trfAmountEgp, setTrfAmountEgp] = useState('10000');

  const handlePostJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    setJeError(null);
    const debitAcc = data.accounts.find((a) => a.id === jeDebitAcc);
    const creditAcc = data.accounts.find((a) => a.id === jeCreditAcc);
    if (!debitAcc || !creditAcc) return;
    const amt = toPiasters(Number(jeAmountEgp) || 0);
    const lines: JournalLine[] = [
      { accountId: debitAcc.id, accountCode: debitAcc.code, accountName: debitAcc.name, debitPiasters: amt, creditPiasters: 0 },
      { accountId: creditAcc.id, accountCode: creditAcc.code, accountName: creditAcc.name, debitPiasters: 0, creditPiasters: amt },
    ];
    const branchId = activeBranchId === 'all' ? data.branches[0]?.id ?? 'br-cairo' : activeBranchId;
    const res = await createJournalEntry({
      date: jeDate,
      description: jeDesc.trim(),
      periodId: jePeriodId,
      branchId,
      lines,
      status: 'posted',
    });
    if (!res.ok) {
      setJeError(res.error ?? 'Journal error');
      return;
    }
    setJeModal(false);
    setJeDesc('');
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const total = toPiasters(Number(invAmountEgp) || 0);
    const branchId = activeBranchId === 'all' ? data.branches[0]?.id ?? 'br-cairo' : activeBranchId;
    await createInvoice({
      clientId: invClientId,
      branchId,
      issueDate: '2026-11-20',
      dueDate: '2026-12-05',
      lines: [{ description: invDesc.trim(), quantity: 1, unitPricePiasters: total }],
      totalPiasters: total,
    });
    setInvModal(false);
    setInvDesc('');
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payInvoiceId) return;
    const res = await recordInvoicePayment({
      invoiceId: payInvoiceId,
      treasuryAccountId: payTreasuryId,
      amountPiasters: toPiasters(Number(payAmountEgp) || 0),
      method: 'bank_transfer',
      referenceCode: `TRX-${Date.now().toString().slice(-5)}`,
      date: '2026-11-20',
    });
    if (res.ok) setPayInvoiceId(null);
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const branchId = activeBranchId === 'all' ? data.branches[0]?.id ?? 'br-cairo' : activeBranchId;
    await createExpense({
      description: expDesc.trim(),
      category: expProjectId ? 'تكاليف إنتاج مباشرة' : 'تشغيل إداري',
      amountPiasters: toPiasters(Number(expAmountEgp) || 0),
      date: '2026-11-20',
      branchId,
      departmentId: data.departments[0]?.id ?? 'dept-mgmt',
      projectId: expProjectId || undefined,
      paymentMethod: 'petty_cash',
    });
    setExpModal(false);
    setExpDesc('');
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createTreasuryTransfer({
      fromAccountId: trfFrom,
      toAccountId: trfTo,
      amountPiasters: toPiasters(Number(trfAmountEgp) || 0),
      date: '2026-11-20',
      memo: 'تحويل نقدي داخلي بين الخزائن والبنوك',
    });
    if (res.ok) setTrfModal(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={lang === 'ar' ? 'المالية والمحاسبة مزدوجة القيد' : 'Finance & Double-Entry Accounting'}
        description={
          lang === 'ar'
            ? 'دليل الحسابات، القيود اليومية، القوائم المالية الحقيقية، الفواتير، المصروفات بفصل المهام، والخزائن.'
            : 'Chart of accounts, balanced journals with immutable reversals, financial statements, AR/AP, and treasury.'
        }
        actions={
          <>
            <button type="button" onClick={() => setExpModal(true)} className={btnSecondaryCls}>
              <Plus className="w-4 h-4" />
              <span>{lang === 'ar' ? 'طلب مصروف' : 'New Expense'}</span>
            </button>
            <button type="button" onClick={() => setJeModal(true)} className={btnPrimaryCls}>
              <Plus className="w-4 h-4" />
              <span>{lang === 'ar' ? 'قيد يومية مزدوج' : 'Post Journal Entry'}</span>
            </button>
          </>
        }
      />

      {/* Finance Sub-Navigation */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: 'overview', ar: 'القوائم المالية وميزان المراجعة', en: 'Statements & Trial Balance' },
            { id: 'journals', ar: 'القيود والفترات المالية', en: 'Journals & Periods' },
            { id: 'invoices', ar: 'الفواتير والتحصيلات', en: 'Invoices & AR' },
            { id: 'expenses', ar: 'المصروفات (SoD)', en: 'Expenses (SoD)' },
            { id: 'treasury', ar: 'الخزائن والتحويلات', en: 'Treasury & Transfers' },
            { id: 'accounts', ar: 'دليل الحسابات', en: 'Chart of Accounts' },
          ] as const
        ).map((tb) => (
          <button
            type="button"
            key={tb.id}
            onClick={() => setTab(tb.id)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg border ${
              tab === tb.id
                ? 'bg-[#2563EB] text-white border-[#2563EB]'
                : 'bg-white dark:bg-[#111827] border-[#E4E7EC] dark:border-[#293548]'
            }`}
          >
            {tb[lang]}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatMetric label={lang === 'ar' ? 'إجمالي الإيرادات (من القيود)' : 'Total Revenue'} value={formatEGP(statements.totalRevenuePiasters, lang)} tone="success" />
            <StatMetric label={lang === 'ar' ? 'التكاليف المباشرة للمشاريع' : 'Direct Project Costs'} value={formatEGP(statements.totalDirectCostPiasters, lang)} />
            <StatMetric label={lang === 'ar' ? 'المصروفات التشغيلية' : 'Operating Expenses'} value={formatEGP(statements.totalOperatingExpensePiasters, lang)} />
            <StatMetric
              label={lang === 'ar' ? 'صافي الربح المحاسبي' : 'Net Accounting Profit'}
              value={formatEGP(statements.netProfitPiasters, lang)}
              meta={statements.trialBalanceBalanced ? (lang === 'ar' ? 'ميزان المراجعة متزن' : 'Trial Balance Balanced') : 'Unbalanced'}
              tone={statements.trialBalanceBalanced ? 'info' : 'danger'}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <StatMetric label={lang === 'ar' ? 'إجمالي الأصول' : 'Total Assets'} value={formatEGP(statements.totalAssetsPiasters, lang)} />
            <StatMetric label={lang === 'ar' ? 'الالتزامات والذمم الدائنة' : 'Total Liabilities'} value={formatEGP(statements.totalLiabilitiesPiasters, lang)} />
            <StatMetric label={lang === 'ar' ? 'حقوق الملكية + أرباح الفترة' : 'Equity + Current Earnings'} value={formatEGP(statements.totalEquityPiasters + statements.netProfitPiasters, lang)} />
          </div>

          <Panel title={lang === 'ar' ? 'ميزان المراجعة (Trial Balance)' : 'Trial Balance'}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#E4E7EC] dark:border-[#293548] text-[#667085]">
                    <th className="py-2 text-start">{lang === 'ar' ? 'الرمز' : 'Code'}</th>
                    <th className="py-2 text-start">{lang === 'ar' ? 'الحساب' : 'Account'}</th>
                    <th className="py-2 text-start">{lang === 'ar' ? 'مدين' : 'Debit'}</th>
                    <th className="py-2 text-start">{lang === 'ar' ? 'دائن' : 'Credit'}</th>
                    <th className="py-2 text-start">{lang === 'ar' ? 'صافي الرصيد' : 'Net Balance'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E7EC] dark:divide-[#293548]">
                  {trialBalance.map((row) => (
                    <tr key={row.accountId}>
                      <td className="py-2.5 font-mono text-[#2563EB]">{row.accountCode}</td>
                      <td className="py-2.5 font-semibold">{lang === 'ar' ? row.accountName : row.accountNameEn}</td>
                      <td className="py-2.5 tabular-nums">{formatEGP(row.debitPiasters, lang)}</td>
                      <td className="py-2.5 tabular-nums">{formatEGP(row.creditPiasters, lang)}</td>
                      <td className="py-2.5 tabular-nums font-bold">{formatEGP(row.netBalancePiasters, lang)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {tab === 'journals' && (
        <div className="space-y-5">
          <Panel title={lang === 'ar' ? 'الفترات المالية وإقفال الفترات' : 'Fiscal Periods & Locks'}>
            <div className="flex flex-wrap gap-3">
              {data.fiscalPeriods.map((fp) => (
                <div key={fp.id} className="p-3 rounded-xl border border-[#E4E7EC] dark:border-[#293548] flex items-center gap-4 text-xs">
                  <div>
                    <div className="font-bold">{fp.name}</div>
                    <div className="text-[#667085] tabular-nums">{fp.startDate} → {fp.endDate}</div>
                  </div>
                  <StatusIndicator status={fp.status} />
                  <button
                    type="button"
                    onClick={() => toggleFiscalPeriod(fp.id)}
                    className={btnSecondaryCls}
                  >
                    {fp.status === 'open' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    <span>{fp.status === 'open' ? (lang === 'ar' ? 'إغلاق الفترة' : 'Close') : lang === 'ar' ? 'إعادة فتح' : 'Reopen'}</span>
                  </button>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title={lang === 'ar' ? `دفتر القيود اليومية (${data.journalEntries.length})` : `Journal Entries (${data.journalEntries.length})`}>
            <div className="space-y-3">
              {data.journalEntries.map((je) => (
                <div key={je.id} className="p-4 rounded-xl border border-[#E4E7EC] dark:border-[#293548] space-y-2 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-mono font-bold text-[#2563EB]">{je.entryNumber}</span>
                      <span className="mx-2 text-[#667085] tabular-nums">{je.date}</span>
                      <span className="font-semibold text-sm">{je.description}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusIndicator status={je.status} />
                      {je.status === 'posted' && !je.reversedEntryId && !je.entryNumber.startsWith('REV-') && (
                        <button
                          type="button"
                          onClick={() => reverseJournalEntry(je.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold border border-[#E4E7EC] dark:border-[#293548] rounded-lg hover:bg-[#EEF2F6] dark:hover:bg-[#182235]"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{lang === 'ar' ? 'عكس القيد' : 'Reverse'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="bg-[#F7F9FC] dark:bg-[#0B1220] rounded-lg p-2.5 divide-y divide-[#E4E7EC] dark:divide-[#293548]">
                    {je.lines.map((ln, idx) => {
                      const acc = data.accounts.find((a) => a.id === ln.accountId);
                      const accLabel = lang === 'ar' ? ln.accountName : (acc?.nameEn ?? ln.accountName);
                      return (
                        <div key={idx} className="py-1 flex justify-between tabular-nums">
                          <span>{ln.accountCode} — {accLabel}</span>
                          <span>
                            {ln.debitPiasters > 0 ? `${lang === 'ar' ? 'مدين' : 'Dr'} ${formatEGP(ln.debitPiasters, lang)}` : `${lang === 'ar' ? 'دائن' : 'Cr'} ${formatEGP(ln.creditPiasters, lang)}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {tab === 'invoices' && (
        <Panel
          title={lang === 'ar' ? `الفواتير ومتابعة التحصيل (المستحق: ${formatEGP(arAging.totalOutstandingPiasters, lang)})` : 'Client Invoices & Payments'}
          action={
            <button type="button" onClick={() => setInvModal(true)} className={btnPrimaryCls}>
              <Plus className="w-4 h-4" />
              <span>{lang === 'ar' ? 'إصدار فاتورة' : 'Issue Invoice'}</span>
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#E4E7EC] dark:border-[#293548] text-[#667085]">
                  <th className="py-2 text-start">{lang === 'ar' ? 'رقم الفاتورة' : 'Invoice #'}</th>
                  <th className="py-2 text-start">{lang === 'ar' ? 'العميل' : 'Client'}</th>
                  <th className="py-2 text-start">{lang === 'ar' ? 'الإجمالي' : 'Total'}</th>
                  <th className="py-2 text-start">{lang === 'ar' ? 'المدفوع' : 'Paid'}</th>
                  <th className="py-2 text-start">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th className="py-2 text-start">{lang === 'ar' ? 'تحصيل' : 'Collect'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E7EC] dark:divide-[#293548]">
                {data.invoices.map((inv) => {
                  const cli = data.clients.find((c) => c.id === inv.clientId);
                  const remaining = inv.totalPiasters - inv.paidPiasters;
                  return (
                    <tr key={inv.id}>
                      <td className="py-2.5 font-mono font-semibold text-[#2563EB]">{inv.invoiceNumber}</td>
                      <td className="py-2.5">{cli?.name ?? inv.clientId}</td>
                      <td className="py-2.5 tabular-nums font-semibold">{formatEGP(inv.totalPiasters, lang)}</td>
                      <td className="py-2.5 tabular-nums">{formatEGP(inv.paidPiasters, lang)}</td>
                      <td className="py-2.5"><StatusIndicator status={inv.status} /></td>
                      <td className="py-2.5">
                        {remaining > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setPayInvoiceId(inv.id);
                              setPayAmountEgp(String(remaining / 100));
                            }}
                            className="text-[#16A34A] font-semibold hover:underline"
                          >
                            {lang === 'ar' ? 'تسجيل دفعة' : 'Record Payment'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {tab === 'expenses' && (
        <Panel
          title={lang === 'ar' ? 'اعتماد المصروفات (فصل المهام SoD)' : 'Expenses & Separation of Duties'}
          subtitle={lang === 'ar' ? 'يُمنع منشئ المصروف من اعتماده لضمان الحوكمة المالية' : 'Requester cannot approve their own expense'}
        >
          <div className="space-y-3">
            {data.expenses.map((exp) => {
              const requester = data.employees.find((e) => e.uid === exp.requesterUid);
              const isSelf = exp.requesterUid === currentUser?.uid;
              return (
                <div key={exp.id} className="p-4 rounded-xl border border-[#E4E7EC] dark:border-[#293548] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="text-sm font-bold">{exp.description}</div>
                    <div className="text-[#667085] mt-0.5">
                      {exp.category} · {lang === 'ar' ? 'الطالب:' : 'Requester:'} {requester?.fullName ?? exp.requesterUid} · {exp.date}
                    </div>
                    {isSelf && (exp.status === 'submitted' || exp.status === 'manager_review') && (
                      <div className="mt-1 inline-flex items-center gap-1 text-[#D97706] font-semibold">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? 'طلبك الشخصي — محظور الاعتماد الذاتي' : 'Self-approval blocked by SoD'}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold tabular-nums">{formatEGP(exp.amountPiasters, lang)}</span>
                    <StatusIndicator status={exp.status} />
                    {(exp.status === 'submitted' || exp.status === 'manager_review') && (
                      <>
                        <button
                          type="button"
                          onClick={() => decideExpense(exp.id, 'approved')}
                          className="px-2.5 py-1.5 font-semibold bg-[#16A34A] text-white rounded-lg"
                        >
                          {lang === 'ar' ? 'اعتماد' : 'Approve'}
                        </button>
                        <button
                          type="button"
                          onClick={() => decideExpense(exp.id, 'rejected')}
                          className="px-2.5 py-1.5 font-semibold bg-[#DC2626] text-white rounded-lg"
                        >
                          {lang === 'ar' ? 'رفض' : 'Reject'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      {tab === 'treasury' && (
        <div className="space-y-5">
          <Panel
            title={lang === 'ar' ? 'الخزائن والبنوك والعهد' : 'Treasury & Bank Accounts'}
            action={
              <button type="button" onClick={() => setTrfModal(true)} className={btnPrimaryCls}>
                <ArrowLeftRight className="w-4 h-4" />
                <span>{lang === 'ar' ? 'تحويل داخلي بين الحسابات' : 'Internal Transfer'}</span>
              </button>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.treasuryAccounts.map((tr) => (
                <div key={tr.id} className="p-4 rounded-xl border border-[#E4E7EC] dark:border-[#293548]">
                  <div className="text-xs text-[#667085]">{tr.kind}</div>
                  <div className="text-sm font-bold mt-1">{tr.name}</div>
                  <div className="text-xl font-bold tabular-nums text-[#2563EB] mt-2">
                    {formatEGP(tr.balancePiasters, lang)}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {tab === 'accounts' && (
        <Panel title={lang === 'ar' ? 'دليل الحسابات (Chart of Accounts)' : 'Chart of Accounts'}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#E4E7EC] dark:border-[#293548] text-[#667085]">
                  <th className="py-2 text-start">Code</th>
                  <th className="py-2 text-start">{lang === 'ar' ? 'اسم الحساب' : 'Name'}</th>
                  <th className="py-2 text-start">{lang === 'ar' ? 'التصنيف' : 'Type'}</th>
                  <th className="py-2 text-start">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E7EC] dark:divide-[#293548]">
                {data.accounts.map((acc) => (
                  <tr key={acc.id}>
                    <td className="py-2.5 font-mono text-[#2563EB]">{acc.code}</td>
                    <td className="py-2.5 font-semibold">{lang === 'ar' ? acc.name : acc.nameEn}</td>
                    <td className="py-2.5">{acc.type}</td>
                    <td className="py-2.5"><StatusIndicator status={acc.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {/* Journal Modal */}
      <Modal open={jeModal} onClose={() => setJeModal(false)} title={lang === 'ar' ? 'تسجيل قيد يومية مزدوج' : 'Create Double-Entry Journal'}>
        <form onSubmit={handlePostJournal} className="space-y-3">
          {jeError && (
            <div role="alert" className="p-2.5 rounded-lg bg-red-50 border border-red-300 text-xs text-[#DC2626]">{jeError}</div>
          )}
          <input required placeholder={lang === 'ar' ? 'شرح القيد المحاسبي' : 'Journal Description'} value={jeDesc} onChange={(e) => setJeDesc(e.target.value)} className={inputCls} />
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={jeDate} onChange={(e) => setJeDate(e.target.value)} className={inputCls} />
            <select value={jePeriodId} onChange={(e) => setJePeriodId(e.target.value)} className={inputCls}>
              {data.fiscalPeriods.map((fp) => (
                <option key={fp.id} value={fp.id}>{fp.name} ({fp.status})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">{lang === 'ar' ? 'الحساب المدين (Debit)' : 'Debit Account'}</label>
              <select value={jeDebitAcc} onChange={(e) => setJeDebitAcc(e.target.value)} className={inputCls}>
                {data.accounts.map((a) => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{lang === 'ar' ? 'الحساب الدائن (Credit)' : 'Credit Account'}</label>
              <select value={jeCreditAcc} onChange={(e) => setJeCreditAcc(e.target.value)} className={inputCls}>
                {data.accounts.map((a) => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{lang === 'ar' ? 'المبلغ المتزن (جنيه مصري)' : 'Balanced Amount (EGP)'}</label>
            <input type="number" min="1" required value={jeAmountEgp} onChange={(e) => setJeAmountEgp(e.target.value)} className={`${inputCls} tabular-nums`} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setJeModal(false)} className={btnSecondaryCls}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
            <button type="submit" className={btnPrimaryCls}>{lang === 'ar' ? 'ترحيل القيد' : 'Post Journal'}</button>
          </div>
        </form>
      </Modal>

      {/* Invoice Modal */}
      <Modal open={invModal} onClose={() => setInvModal(false)} title={lang === 'ar' ? 'إصدار فاتورة عميل جديدة' : 'Issue Invoice'}>
        <form onSubmit={handleCreateInvoice} className="space-y-3">
          <select value={invClientId} onChange={(e) => setInvClientId(e.target.value)} className={inputCls}>
            {data.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input required placeholder={lang === 'ar' ? 'بيان الفاتورة' : 'Line Description'} value={invDesc} onChange={(e) => setInvDesc(e.target.value)} className={inputCls} />
          <input type="number" min="1" required value={invAmountEgp} onChange={(e) => setInvAmountEgp(e.target.value)} className={`${inputCls} tabular-nums`} />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setInvModal(false)} className={btnSecondaryCls}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
            <button type="submit" className={btnPrimaryCls}>{lang === 'ar' ? 'إصدار وترحيل' : 'Issue Invoice'}</button>
          </div>
        </form>
      </Modal>

      {/* Payment Modal */}
      <Modal open={Boolean(payInvoiceId)} onClose={() => setPayInvoiceId(null)} title={lang === 'ar' ? 'تسجيل تحصيل دفعة' : 'Record Payment'}>
        <form onSubmit={handleRecordPayment} className="space-y-3">
          <select value={payTreasuryId} onChange={(e) => setPayTreasuryId(e.target.value)} className={inputCls}>
            {data.treasuryAccounts.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <input type="number" min="1" required value={payAmountEgp} onChange={(e) => setPayAmountEgp(e.target.value)} className={`${inputCls} tabular-nums`} />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setPayInvoiceId(null)} className={btnSecondaryCls}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
            <button type="submit" className={btnPrimaryCls}>{lang === 'ar' ? 'تأكيد التحصيل' : 'Record'}</button>
          </div>
        </form>
      </Modal>

      {/* Expense Modal */}
      <Modal open={expModal} onClose={() => setExpModal(false)} title={lang === 'ar' ? 'تسجيل طلب مصروف جديد' : 'Submit Expense'}>
        <form onSubmit={handleCreateExpense} className="space-y-3">
          <input required placeholder={lang === 'ar' ? 'وصف المصروف' : 'Expense Description'} value={expDesc} onChange={(e) => setExpDesc(e.target.value)} className={inputCls} />
          <input type="number" min="1" required value={expAmountEgp} onChange={(e) => setExpAmountEgp(e.target.value)} className={`${inputCls} tabular-nums`} />
          <select value={expProjectId} onChange={(e) => setExpProjectId(e.target.value)} className={inputCls}>
            <option value="">{lang === 'ar' ? 'مصروف تشغيل إداري عام' : 'General Operating Expense'}</option>
            {data.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setExpModal(false)} className={btnSecondaryCls}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
            <button type="submit" className={btnPrimaryCls}>{lang === 'ar' ? 'إرسال للاعتماد' : 'Submit'}</button>
          </div>
        </form>
      </Modal>

      {/* Transfer Modal */}
      <Modal open={trfModal} onClose={() => setTrfModal(false)} title={lang === 'ar' ? 'تحويل داخلي بين الخزائن' : 'Internal Treasury Transfer'}>
        <form onSubmit={handleTransfer} className="space-y-3">
          <select value={trfFrom} onChange={(e) => setTrfFrom(e.target.value)} className={inputCls}>
            {data.treasuryAccounts.map((t) => <option key={t.id} value={t.id}>{t.name} ({formatEGP(t.balancePiasters, lang)})</option>)}
          </select>
          <select value={trfTo} onChange={(e) => setTrfTo(e.target.value)} className={inputCls}>
            {data.treasuryAccounts.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <input type="number" min="1" required value={trfAmountEgp} onChange={(e) => setTrfAmountEgp(e.target.value)} className={`${inputCls} tabular-nums`} />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setTrfModal(false)} className={btnSecondaryCls}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
            <button type="submit" className={btnPrimaryCls}>{lang === 'ar' ? 'تنفيذ التحويل' : 'Transfer'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
