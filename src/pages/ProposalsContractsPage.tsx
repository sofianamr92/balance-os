import React, { useState } from 'react';
import { FileSignature, Layers, Plus, FileCheck2 } from 'lucide-react';
import { useOS } from '../context/OSContext';
import {
  PageHeader,
  Panel,
  StatusIndicator,
  Modal,
  inputCls,
  btnPrimaryCls,
  btnSecondaryCls,
} from '../components/common/UIPrimitives';
import { formatEGP, toPiasters } from '../utils/accounting';

export function ProposalsContractsPage() {
  const {
    data,
    lang,
    currentUser,
    activeBranchId,
    createProposal,
    decideProposal,
    createContractAndProject,
    createService,
  } = useOS();

  const [tab, setTab] = useState<'proposals' | 'contracts' | 'catalog'>('proposals');
  const [propModal, setPropModal] = useState(false);
  const [contractModal, setContractModal] = useState(false);
  const [srvModal, setSrvModal] = useState(false);

  // Proposal form
  const [propTitle, setPropTitle] = useState('');
  const [propClientId, setPropClientId] = useState(data.clients[0]?.id ?? '');
  const [propServiceId, setPropServiceId] = useState(data.services[0]?.id ?? 'srv-photo');
  const [propPriceEgp, setPropPriceEgp] = useState('45000');

  // Contract form
  const [cntTitle, setCntTitle] = useState('');
  const [cntClientId, setCntClientId] = useState(data.clients[0]?.id ?? '');
  const [cntServiceId, setCntServiceId] = useState(data.services[0]?.id ?? 'srv-photo');
  const [cntValueEgp, setCntValueEgp] = useState('90000');

  // Service form
  const [srvName, setSrvName] = useState('');
  const [srvNameEn, setSrvNameEn] = useState('');
  const [srvRateEgp, setSrvRateEgp] = useState('25000');

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    const unitPrice = toPiasters(Number(propPriceEgp) || 0);
    const total = Math.round(unitPrice * 1.14);
    const branchId = activeBranchId === 'all' ? data.branches[0]?.id ?? 'br-cairo' : activeBranchId;
    const srv = data.services.find((s) => s.id === propServiceId);
    await createProposal({
      title: propTitle.trim(),
      clientId: propClientId || undefined,
      branchId,
      items: [{ serviceId: propServiceId, description: srv?.name ?? 'خدمة متكاملة', quantity: 1, unitPricePiasters: unitPrice }],
      discountPiasters: 0,
      taxRatePercent: 14,
      totalPiasters: total,
      paymentTerms: '50% مقدم + 50% عند التسليم',
      validUntil: '2026-12-30',
      status: 'pending_approval',
    });
    setPropModal(false);
    setPropTitle('');
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    const branchId = activeBranchId === 'all' ? data.branches[0]?.id ?? 'br-cairo' : activeBranchId;
    await createContractAndProject({
      title: cntTitle.trim(),
      clientId: cntClientId || data.clients[0]?.id || 'cli-1',
      branchId,
      accountManagerUid: currentUser?.uid ?? 'demo-ceo-01',
      serviceIds: [cntServiceId],
      valuePiasters: toPiasters(Number(cntValueEgp) || 0),
      startDate: new Date().toISOString().slice(0, 10),
      endDate: '2026-12-31',
      paymentSchedule: 'دفعات شهرية',
      revisionPolicy: 'تعديلان مجانيان لكل مخرج',
    });
    setContractModal(false);
    setCntTitle('');
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    await createService({
      code: `SRV-${data.services.length + 10}`,
      name: srvName.trim(),
      nameEn: srvNameEn.trim() || srvName.trim(),
      category: 'Agency Service',
      pricingModel: 'fixed',
      defaultRatePiasters: toPiasters(Number(srvRateEgp) || 0),
      estimatedCostPiasters: toPiasters((Number(srvRateEgp) || 0) * 0.4),
      departmentId: data.departments[0]?.id ?? 'dept-mgmt',
      deliverables: ['المخرج الرئيسي المعتمد'],
      defaultTasks: ['اجتماع الانطلاق وتحديد النطاق', 'التنفيذ والمراجعة النهائية'],
      estimatedDays: 14,
      revisionLimit: 2,
      status: 'active',
    });
    setSrvModal(false);
    setSrvName('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={lang === 'ar' ? 'عروض الأسعار والعقود وكتالوج الخدمات' : 'Proposals, Contracts & Service Catalog'}
        description={
          lang === 'ar'
            ? 'إنشاء عروض الأسعار بضريبة القيمة المضافة، اعتماد العقود، وتحويلها تلقائياً إلى مشاريع ومهام.'
            : 'Proposal builder with VAT & SoD approval, contract execution, and automated project/task generation.'
        }
        actions={
          <>
            <button type="button" onClick={() => setPropModal(true)} className={btnSecondaryCls}>
              <Plus className="w-4 h-4" />
              <span>{lang === 'ar' ? 'عرض سعر جديد' : 'New Proposal'}</span>
            </button>
            <button type="button" onClick={() => setContractModal(true)} className={btnPrimaryCls}>
              <FileCheck2 className="w-4 h-4" />
              <span>{lang === 'ar' ? 'تفعيل عقد وإنشاء مشروع' : 'Activate Contract -> Project'}</span>
            </button>
          </>
        }
      />

      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: 'proposals', ar: 'عروض الأسعار', en: 'Proposals', icon: FileSignature },
            { id: 'contracts', ar: 'العقود المفعلة', en: 'Contracts', icon: FileCheck2 },
            { id: 'catalog', ar: 'كتالوج الخدمات', en: 'Service Catalog', icon: Layers },
          ] as const
        ).map((tb) => {
          const Icon = tb.icon;
          return (
            <button
              type="button"
              key={tb.id}
              onClick={() => setTab(tb.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border ${
                tab === tb.id
                  ? 'bg-[#2563EB] text-white border-[#2563EB]'
                  : 'bg-white dark:bg-[#111827] border-[#E4E7EC] dark:border-[#293548]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tb[lang]}</span>
            </button>
          );
        })}
      </div>

      {tab === 'proposals' && (
        <Panel title={lang === 'ar' ? `عروض الأسعار (${data.proposals.length})` : `Proposals (${data.proposals.length})`}>
          <div className="space-y-3">
            {data.proposals.map((prop) => (
              <div key={prop.id} className="p-4 rounded-xl border border-[#E4E7EC] dark:border-[#293548] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-mono text-[#2563EB]">{prop.proposalNumber} · v{prop.version}</div>
                  <div className="text-sm font-bold mt-0.5">{prop.title}</div>
                  <div className="text-xs text-[#667085] mt-1">
                    {prop.paymentTerms} · {lang === 'ar' ? 'الإجمالي شامل 14% ضريبة:' : 'Total incl. 14% VAT:'}{' '}
                    <span className="font-bold text-[#101828] dark:text-[#F9FAFB] tabular-nums">{formatEGP(prop.totalPiasters, lang)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusIndicator status={prop.status} />
                  {prop.status === 'pending_approval' && (
                    <>
                      <button type="button" onClick={() => decideProposal(prop.id, 'approved')} className="px-2.5 py-1.5 text-xs font-semibold bg-[#16A34A] text-white rounded-lg">
                        {lang === 'ar' ? 'اعتماد' : 'Approve'}
                      </button>
                      <button type="button" onClick={() => decideProposal(prop.id, 'rejected')} className="px-2.5 py-1.5 text-xs font-semibold bg-[#DC2626] text-white rounded-lg">
                        {lang === 'ar' ? 'رفض' : 'Reject'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {tab === 'contracts' && (
        <Panel title={lang === 'ar' ? `العقود التنفيذية (${data.contracts.length})` : `Contracts (${data.contracts.length})`}>
          <div className="space-y-3">
            {data.contracts.map((cnt) => {
              const cli = data.clients.find((c) => c.id === cnt.clientId);
              return (
                <div key={cnt.id} className="p-4 rounded-xl border border-[#E4E7EC] dark:border-[#293548] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-mono text-[#2563EB]">{cnt.contractNumber}</div>
                    <div className="text-sm font-bold mt-0.5">{cnt.title}</div>
                    <div className="text-xs text-[#667085] mt-1">
                      {cli?.name ?? cnt.clientId} · {cnt.startDate} → {cnt.endDate}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-bold tabular-nums">{formatEGP(cnt.valuePiasters, lang)}</div>
                    <StatusIndicator status={cnt.status} />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      {tab === 'catalog' && (
        <Panel
          title={lang === 'ar' ? 'كتالوج خدمات BALANCE' : 'BALANCE Service Catalog'}
          action={
            <button type="button" onClick={() => setSrvModal(true)} className={btnSecondaryCls}>
              <Plus className="w-4 h-4" />
              <span>{lang === 'ar' ? 'إضافة خدمة' : 'Add Service'}</span>
            </button>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.services.map((srv) => (
              <div key={srv.id} className="p-4 rounded-xl border border-[#E4E7EC] dark:border-[#293548]">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-mono text-[#2563EB]">{srv.code}</div>
                    <div className="text-sm font-bold mt-0.5">{lang === 'ar' ? srv.name : srv.nameEn}</div>
                  </div>
                  <div className="text-sm font-bold tabular-nums text-[#16A34A]">{formatEGP(srv.defaultRatePiasters, lang)}</div>
                </div>
                <div className="mt-2 text-xs text-[#667085]">
                  {lang === 'ar' ? 'حد التعديلات:' : 'Revision limit:'} {srv.revisionLimit} · {srv.estimatedDays} {lang === 'ar' ? 'يوم' : 'days'}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <Modal open={propModal} onClose={() => setPropModal(false)} title={lang === 'ar' ? 'إنشاء عرض سعر' : 'Create Proposal'}>
        <form onSubmit={handleCreateProposal} className="space-y-3">
          <input required placeholder={lang === 'ar' ? 'عنوان عرض السعر' : 'Proposal Title'} value={propTitle} onChange={(e) => setPropTitle(e.target.value)} className={inputCls} />
          <select value={propClientId} onChange={(e) => setPropClientId(e.target.value)} className={inputCls}>
            {data.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={propServiceId} onChange={(e) => setPropServiceId(e.target.value)} className={inputCls}>
            {data.services.map((s) => <option key={s.id} value={s.id}>{lang === 'ar' ? s.name : s.nameEn}</option>)}
          </select>
          <input type="number" min="100" required placeholder="Price EGP" value={propPriceEgp} onChange={(e) => setPropPriceEgp(e.target.value)} className={`${inputCls} tabular-nums`} />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setPropModal(false)} className={btnSecondaryCls}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
            <button type="submit" className={btnPrimaryCls}>{lang === 'ar' ? 'حفظ وإرسال للاعتماد' : 'Submit for Approval'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={contractModal} onClose={() => setContractModal(false)} title={lang === 'ar' ? 'تفعيل عقد جديد وإنشاء مشروع' : 'Activate Contract & Create Project'}>
        <form onSubmit={handleCreateContract} className="space-y-3">
          <input required placeholder={lang === 'ar' ? 'عنوان العقد' : 'Contract Title'} value={cntTitle} onChange={(e) => setCntTitle(e.target.value)} className={inputCls} />
          <select value={cntClientId} onChange={(e) => setCntClientId(e.target.value)} className={inputCls}>
            {data.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={cntServiceId} onChange={(e) => setCntServiceId(e.target.value)} className={inputCls}>
            {data.services.map((s) => <option key={s.id} value={s.id}>{lang === 'ar' ? s.name : s.nameEn}</option>)}
          </select>
          <input type="number" min="100" required placeholder="Contract Value EGP" value={cntValueEgp} onChange={(e) => setCntValueEgp(e.target.value)} className={`${inputCls} tabular-nums`} />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setContractModal(false)} className={btnSecondaryCls}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
            <button type="submit" className={btnPrimaryCls}>{lang === 'ar' ? 'تفعيل العقد والمشروع' : 'Activate'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={srvModal} onClose={() => setSrvModal(false)} title={lang === 'ar' ? 'إضافة خدمة للكتالوج' : 'Add Service'}>
        <form onSubmit={handleCreateService} className="space-y-3">
          <input required placeholder={lang === 'ar' ? 'اسم الخدمة بالعربية' : 'Service Name (AR)'} value={srvName} onChange={(e) => setSrvName(e.target.value)} className={inputCls} />
          <input placeholder={lang === 'ar' ? 'الاسم بالإنجليزية' : 'English Name'} value={srvNameEn} onChange={(e) => setSrvNameEn(e.target.value)} className={inputCls} />
          <input type="number" min="100" required placeholder="Rate EGP" value={srvRateEgp} onChange={(e) => setSrvRateEgp(e.target.value)} className={`${inputCls} tabular-nums`} />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setSrvModal(false)} className={btnSecondaryCls}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
            <button type="submit" className={btnPrimaryCls}>{lang === 'ar' ? 'حفظ' : 'Save'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
