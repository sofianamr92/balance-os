import React, { useMemo, useState } from 'react';
import { Plus, Mail, Phone, MapPin } from 'lucide-react';
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
import { formatEGP } from '../utils/accounting';
import { isRecordVisibleToUser } from '../utils/rbac';

export function ClientsPage() {
  const { data, lang, currentUser, activeBranchId, createClient } = useOS();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('Real Estate');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('القاهرة');
  const [brandNotes, setBrandNotes] = useState('');

  const visibleClients = useMemo(
    () => data.clients.filter((c) => isRecordVisibleToUser(c, currentUser, activeBranchId)),
    [activeBranchId, currentUser, data.clients]
  );

  const selectedClient = useMemo(
    () => visibleClients.find((c) => c.id === selectedClientId) ?? null,
    [selectedClientId, visibleClients]
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const branchId = activeBranchId === 'all' ? data.branches[0]?.id ?? 'br-cairo' : activeBranchId;
    await createClient({
      name: name.trim(),
      industry,
      phone: phone.trim(),
      email: email.trim() || 'client@company.eg',
      location,
      branchId,
      accountManagerUid: currentUser?.uid ?? 'demo-ceo-01',
      brandNotes,
      status: 'active',
    });
    setModalOpen(false);
    setName('');
    setPhone('');
    setEmail('');
    setBrandNotes('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={lang === 'ar' ? 'دليل العملاء الموحّد' : 'Clients Directory'}
        description={
          lang === 'ar'
            ? 'ملف العميل الواحد الذي يربط العقود، المشاريع، الفواتير، وملاحظات الهوية البصرية.'
            : 'Single source of truth linking each client to contracts, projects, invoices, and brand notes.'
        }
        actions={
          <button type="button" onClick={() => setModalOpen(true)} className={btnPrimaryCls}>
            <Plus className="w-4 h-4" />
            <span>{lang === 'ar' ? 'إضافة عميل' : 'Add Client'}</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleClients.map((client) => {
          const clientProjects = data.projects.filter((p) => p.clientId === client.id);
          const clientInvoices = data.invoices.filter((i) => i.clientId === client.id);
          const billed = clientInvoices.reduce((s, i) => s + i.totalPiasters, 0);
          return (
            <Panel key={client.id} className="flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-[#101828] dark:text-[#F9FAFB]">{client.name}</h3>
                    <div className="text-xs text-[#667085] mt-0.5">{client.industry}</div>
                  </div>
                  <StatusIndicator status={client.status} />
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-[#667085] dark:text-[#9CA3AF]">
                  <div className="flex items-center gap-1.5 tabular-nums"><Phone className="w-3.5 h-3.5" /> {client.phone}</div>
                  <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {client.email}</div>
                  <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {client.location}</div>
                </div>

                {client.brandNotes && (
                  <div className="mt-3 p-2.5 rounded-lg bg-[#F7F9FC] dark:bg-[#0B1220] text-xs text-[#667085] dark:text-[#9CA3AF]">
                    {client.brandNotes}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-[#E4E7EC] dark:border-[#293548] flex items-center justify-between text-xs">
                <div>
                  <span className="text-[#667085]">{lang === 'ar' ? 'المشاريع:' : 'Projects:'} </span>
                  <span className="font-bold tabular-nums">{clientProjects.length}</span>
                  <span className="mx-2 text-[#E4E7EC]">|</span>
                  <span className="font-bold tabular-nums text-[#2563EB]">{formatEGP(billed, lang)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedClientId(client.id)}
                  className="font-semibold text-[#2563EB] hover:underline"
                >
                  {lang === 'ar' ? 'الملف الكامل' : 'View 360°'}
                </button>
              </div>
            </Panel>
          );
        })}
      </div>

      {/* Client 360 Modal */}
      <Modal open={Boolean(selectedClient)} onClose={() => setSelectedClientId(null)} title={selectedClient?.name ?? ''}>
        {selectedClient && (
          <div className="space-y-4 text-xs">
            <div>
              <div className="font-bold mb-2">{lang === 'ar' ? 'العقود المرتبطة' : 'Contracts'}</div>
              {data.contracts.filter((c) => c.clientId === selectedClient.id).map((c) => (
                <div key={c.id} className="p-2.5 rounded border border-[#E4E7EC] dark:border-[#293548] flex justify-between mb-1.5">
                  <span>{c.contractNumber} — {c.title}</span>
                  <span className="font-bold tabular-nums">{formatEGP(c.valuePiasters, lang)}</span>
                </div>
              ))}
            </div>
            <div>
              <div className="font-bold mb-2">{lang === 'ar' ? 'المشاريع المرتبطة' : 'Projects'}</div>
              {data.projects.filter((p) => p.clientId === selectedClient.id).map((p) => (
                <div key={p.id} className="p-2.5 rounded border border-[#E4E7EC] dark:border-[#293548] flex justify-between mb-1.5">
                  <span>{p.name}</span>
                  <StatusIndicator status={p.status} />
                </div>
              ))}
            </div>
            <div>
              <div className="font-bold mb-2">{lang === 'ar' ? 'الفواتير' : 'Invoices'}</div>
              {data.invoices.filter((i) => i.clientId === selectedClient.id).map((i) => (
                <div key={i.id} className="p-2.5 rounded border border-[#E4E7EC] dark:border-[#293548] flex justify-between mb-1.5">
                  <span className="tabular-nums">{i.invoiceNumber}</span>
                  <span className="font-bold tabular-nums">{formatEGP(i.totalPiasters, lang)}</span>
                  <StatusIndicator status={i.status} />
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={lang === 'ar' ? 'إضافة عميل جديد' : 'Add Client'}>
        <form onSubmit={handleAdd} className="space-y-3">
          <input required placeholder={lang === 'ar' ? 'اسم العميل / الشركة' : 'Client Name'} value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          <div className="grid grid-cols-2 gap-3">
            <input required placeholder={lang === 'ar' ? 'رقم الهاتف' : 'Phone'} value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
            <input type="email" placeholder={lang === 'ar' ? 'البريد الإلكتروني' : 'Email'} value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder={lang === 'ar' ? 'القطاع' : 'Industry'} value={industry} onChange={(e) => setIndustry(e.target.value)} className={inputCls} />
            <input placeholder={lang === 'ar' ? 'الموقع' : 'Location'} value={location} onChange={(e) => setLocation(e.target.value)} className={inputCls} />
          </div>
          <textarea rows={2} placeholder={lang === 'ar' ? 'ملاحظات الهوية البصرية والتعامل...' : 'Brand notes...'} value={brandNotes} onChange={(e) => setBrandNotes(e.target.value)} className={inputCls} />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className={btnSecondaryCls}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
            <button type="submit" className={btnPrimaryCls}>{lang === 'ar' ? 'حفظ' : 'Save'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
