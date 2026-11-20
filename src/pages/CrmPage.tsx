import React, { useMemo, useState } from 'react';
import { Plus, Phone, ArrowRightLeft, Kanban, List } from 'lucide-react';
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
import { isRecordVisibleToUser } from '../utils/rbac';
import type { LeadSource, LeadStage } from '../types/os';

const PIPELINE_STAGES: Array<{ id: LeadStage; ar: string; en: string }> = [
  { id: 'new_lead', ar: 'عميل محتمل جديد', en: 'New Lead' },
  { id: 'qualified', ar: 'مؤهل', en: 'Qualified' },
  { id: 'contacted', ar: 'تم التواصل', en: 'Contacted' },
  { id: 'meeting_scheduled', ar: 'اجتماع مجدول', en: 'Meeting Scheduled' },
  { id: 'proposal_sent', ar: 'تم إرسال العرض', en: 'Proposal Sent' },
  { id: 'negotiation', ar: 'تفاوض', en: 'Negotiation' },
  { id: 'won', ar: 'تم الفوز', en: 'Won' },
  { id: 'lost', ar: 'مفقود', en: 'Lost' },
];

export function CrmPage() {
  const {
    data,
    lang,
    currentUser,
    activeBranchId,
    createLead,
    updateLeadStage,
    addLeadActivity,
    convertLeadToClientAndDeal,
  } = useOS();

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [activityText, setActivityText] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const [businessName, setBusinessName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [industry, setIndustry] = useState('Retail');
  const [location, setLocation] = useState('القاهرة');
  const [source, setSource] = useState<LeadSource>('instagram');
  const [budget, setBudget] = useState('65000');

  const visibleLeads = useMemo(
    () => data.leads.filter((l) => isRecordVisibleToUser(l, currentUser, activeBranchId)),
    [activeBranchId, currentUser, data.leads]
  );

  const selectedLead = useMemo(
    () => visibleLeads.find((l) => l.id === selectedLeadId) ?? null,
    [selectedLeadId, visibleLeads]
  );

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const branchId = activeBranchId === 'all' ? data.branches[0]?.id ?? 'br-cairo' : activeBranchId;
    const res = await createLead({
      businessName: businessName.trim(),
      contactName: contactName.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      industry,
      location,
      source,
      stage: 'new_lead',
      priority: 'high',
      interestedServices: ['srv-photo'],
      estimatedBudgetPiasters: toPiasters(Number(budget) || 0),
      assignedUid: currentUser?.uid ?? 'demo-ceo-01',
      branchId,
    });
    if (!res.ok) {
      setFormError(res.error ?? 'Duplicate lead');
      return;
    }
    setModalOpen(false);
    setBusinessName('');
    setContactName('');
    setPhone('');
    setEmail('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={lang === 'ar' ? 'المبيعات وخط أنابيب العملاء المحتملين (CRM)' : 'CRM & Sales Pipeline'}
        description={
          lang === 'ar'
            ? 'إدارة العملاء المحتملين، منع التكرار، تتبع الأنشطة، وتحويل الفرص إلى عملاء وصفقات.'
            : 'Lead capture with duplicate blocking, stage pipeline, activity logs, and client conversion.'
        }
        actions={
          <>
            <div className="inline-flex rounded-lg border border-[#E4E7EC] dark:border-[#293548] overflow-hidden">
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-2 text-xs font-semibold flex items-center gap-1.5 ${
                  viewMode === 'kanban' ? 'bg-[#2563EB] text-white' : 'bg-white dark:bg-[#111827]'
                }`}
              >
                <Kanban className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'كانبان' : 'Board'}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-xs font-semibold flex items-center gap-1.5 ${
                  viewMode === 'list' ? 'bg-[#2563EB] text-white' : 'bg-white dark:bg-[#111827]'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'جدول' : 'List'}</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setFormError(null);
                setModalOpen(true);
              }}
              className={btnPrimaryCls}
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'ar' ? 'إضافة عميل محتمل' : 'Add Lead'}</span>
            </button>
          </>
        }
      />

      {viewMode === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {PIPELINE_STAGES.slice(0, 7).map((stage) => {
            const items = visibleLeads.filter((l) => l.stage === stage.id);
            const stageTotal = items.reduce((s, l) => s + l.estimatedBudgetPiasters, 0);
            return (
              <div
                key={stage.id}
                className="w-72 shrink-0 bg-[#EEF2F6]/80 dark:bg-[#111827] border border-[#E4E7EC] dark:border-[#293548] rounded-xl p-3 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between px-1">
                  <div>
                    <div className="text-xs font-bold text-[#101828] dark:text-[#F9FAFB]">
                      {stage[lang]} ({items.length})
                    </div>
                    <div className="text-[11px] text-[#667085] tabular-nums">
                      {formatEGP(stageTotal, lang)}
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {items.map((lead) => (
                    <div
                      key={lead.id}
                      className="bg-white dark:bg-[#0B1220] border border-[#E4E7EC] dark:border-[#293548] rounded-lg p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedLeadId(lead.id)}
                          className="text-start text-sm font-semibold text-[#101828] dark:text-[#F9FAFB] hover:text-[#2563EB]"
                        >
                          {lead.businessName}
                        </button>
                      </div>
                      <div className="text-xs text-[#667085]">
                        {lead.contactName} · <span className="tabular-nums">{lead.phone}</span>
                      </div>
                      <div className="text-xs font-bold tabular-nums text-[#2563EB]">
                        {formatEGP(lead.estimatedBudgetPiasters, lang)}
                      </div>
                      <div className="pt-2 border-t border-[#E4E7EC] dark:border-[#293548] flex items-center justify-between gap-2">
                        <select
                          aria-label={`Stage for ${lead.businessName}`}
                          value={lead.stage}
                          onChange={(e) => updateLeadStage(lead.id, e.target.value as LeadStage)}
                          className="text-[11px] bg-[#F7F9FC] dark:bg-[#111827] border border-[#E4E7EC] dark:border-[#293548] rounded px-1.5 py-1"
                        >
                          {PIPELINE_STAGES.map((st) => (
                            <option key={st.id} value={st.id}>{st[lang]}</option>
                          ))}
                        </select>
                        {lead.stage !== 'won' && (
                          <button
                            type="button"
                            onClick={() => convertLeadToClientAndDeal(lead.id)}
                            className="text-[11px] font-semibold text-[#16A34A] hover:underline flex items-center gap-1"
                          >
                            <ArrowRightLeft className="w-3 h-3" />
                            <span>{lang === 'ar' ? 'تحويل' : 'Convert'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Panel title={lang === 'ar' ? `قائمة العملاء المحتملين (${visibleLeads.length})` : `Leads Directory (${visibleLeads.length})`}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#E4E7EC] dark:border-[#293548] text-[#667085]">
                  <th className="py-2 text-start">{lang === 'ar' ? 'النشاط' : 'Business'}</th>
                  <th className="py-2 text-start">{lang === 'ar' ? 'جهة الاتصال' : 'Contact'}</th>
                  <th className="py-2 text-start">{lang === 'ar' ? 'الهاتف' : 'Phone'}</th>
                  <th className="py-2 text-start">{lang === 'ar' ? 'الميزانية' : 'Budget'}</th>
                  <th className="py-2 text-start">{lang === 'ar' ? 'المرحلة' : 'Stage'}</th>
                  <th className="py-2 text-start">{lang === 'ar' ? 'إجراء' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E7EC] dark:divide-[#293548]">
                {visibleLeads.map((lead) => (
                  <tr key={lead.id}>
                    <td className="py-2.5 font-semibold">{lead.businessName}</td>
                    <td className="py-2.5">{lead.contactName}</td>
                    <td className="py-2.5 tabular-nums">{lead.phone}</td>
                    <td className="py-2.5 tabular-nums font-semibold">{formatEGP(lead.estimatedBudgetPiasters, lang)}</td>
                    <td className="py-2.5"><StatusIndicator status={lead.stage} /></td>
                    <td className="py-2.5">
                      <button type="button" onClick={() => setSelectedLeadId(lead.id)} className="text-[#2563EB] font-semibold hover:underline">
                        {lang === 'ar' ? 'تفاصيل / متابعة' : 'Details'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {/* Active Deals */}
      <Panel title={lang === 'ar' ? `الصفقات التجارية (${data.deals.length})` : `Active Deals (${data.deals.length})`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.deals.map((d) => (
            <div key={d.id} className="p-4 rounded-xl border border-[#E4E7EC] dark:border-[#293548]">
              <div className="font-semibold text-sm">{d.title}</div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="tabular-nums font-bold text-[#2563EB]">{formatEGP(d.proposedValuePiasters, lang)}</span>
                <span className="text-[#667085] tabular-nums">{d.probability}%</span>
              </div>
              <div className="mt-2"><StatusIndicator status={d.stage} /></div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Add Lead Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={lang === 'ar' ? 'إضافة عميل محتمل جديد (مع فحص التكرار)' : 'Create Lead (Duplicate Check Active)'}
      >
        <form onSubmit={handleCreateLead} className="space-y-3">
          {formError && (
            <div role="alert" className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-xs text-[#DC2626] dark:text-red-300 font-medium">
              {formError}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">{lang === 'ar' ? 'اسم الشركة / النشاط' : 'Business Name'}</label>
              <input required value={businessName} onChange={(e) => setBusinessName(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{lang === 'ar' ? 'اسم المسؤول' : 'Contact Name'}</label>
              <input required value={contactName} onChange={(e) => setContactName(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{lang === 'ar' ? 'رقم الهاتف' : 'Phone'}</label>
              <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010xxxxxxxx" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{lang === 'ar' ? 'مصدر العميل' : 'Source'}</label>
              <select value={source} onChange={(e) => setSource(e.target.value as LeadSource)} className={inputCls}>
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="tiktok">TikTok</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="google_maps">Google Maps</option>
                <option value="referrals">Referrals</option>
                <option value="website">Website</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{lang === 'ar' ? 'الميزانية المتوقعة (EGP)' : 'Est. Budget (EGP)'}</label>
              <input type="number" min="0" value={budget} onChange={(e) => setBudget(e.target.value)} className={`${inputCls} tabular-nums`} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder={lang === 'ar' ? 'القطاع' : 'Industry'} value={industry} onChange={(e) => setIndustry(e.target.value)} className={inputCls} />
            <input placeholder={lang === 'ar' ? 'المدينة / الموقع' : 'Location'} value={location} onChange={(e) => setLocation(e.target.value)} className={inputCls} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className={btnSecondaryCls}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
            <button type="submit" className={btnPrimaryCls}>{lang === 'ar' ? 'حفظ العميل المحتمل' : 'Save Lead'}</button>
          </div>
        </form>
      </Modal>

      {/* Lead Detail & Activities Modal */}
      <Modal
        open={Boolean(selectedLead)}
        onClose={() => setSelectedLeadId(null)}
        title={selectedLead?.businessName ?? ''}
      >
        {selectedLead && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-[#F7F9FC] dark:bg-[#0B1220]">
              <div><span className="text-[#667085]">{lang === 'ar' ? 'المسؤول:' : 'Contact:'}</span> {selectedLead.contactName}</div>
              <div className="flex items-center gap-1 tabular-nums"><Phone className="w-3.5 h-3.5" /> {selectedLead.phone}</div>
              <div><span className="text-[#667085]">{lang === 'ar' ? 'القطاع:' : 'Industry:'}</span> {selectedLead.industry}</div>
              <div className="font-bold text-[#2563EB] tabular-nums">{formatEGP(selectedLead.estimatedBudgetPiasters, lang)}</div>
            </div>

            <div className="space-y-2">
              <div className="font-semibold">{lang === 'ar' ? 'إضافة نشاط متابعة' : 'Log Follow-up Activity'}</div>
              <div className="flex gap-2">
                <input
                  value={activityText}
                  onChange={(e) => setActivityText(e.target.value)}
                  placeholder={lang === 'ar' ? 'ملخص المكالمة أو الاجتماع...' : 'Call or meeting summary...'}
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!activityText.trim()) return;
                    addLeadActivity(selectedLead.id, 'call', activityText.trim());
                    setActivityText('');
                  }}
                  className={btnPrimaryCls}
                >
                  {lang === 'ar' ? 'تسجيل' : 'Log'}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-semibold">{lang === 'ar' ? 'سجل المتابعات' : 'Activity History'}</div>
              {(selectedLead.activities ?? []).length === 0 ? (
                <p className="text-[#667085]">{lang === 'ar' ? 'لا توجد متابعات مسجلة بعد.' : 'No activities yet.'}</p>
              ) : (
                (selectedLead.activities ?? []).map((act) => (
                  <div key={act.id} className="p-2.5 rounded border border-[#E4E7EC] dark:border-[#293548] flex justify-between">
                    <span>{act.summary}</span>
                    <span className="text-[#667085] tabular-nums">{act.date}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
