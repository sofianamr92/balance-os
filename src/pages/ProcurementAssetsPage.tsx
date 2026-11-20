import React, { useState } from 'react';
import { Plus, Package } from 'lucide-react';
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
import type { Asset, ProcurementRequest } from '../types/os';

export function ProcurementPage() {
  const { data, lang, activeBranchId, createProcurementRequest, advanceProcurement } = useOS();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [amountEgp, setAmountEgp] = useState('12000');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const branchId = activeBranchId === 'all' ? data.branches[0]?.id ?? 'br-cairo' : activeBranchId;
    await createProcurementRequest({
      title: title.trim(),
      vendorName: vendorName.trim(),
      branchId,
      departmentId: data.departments[0]?.id ?? 'dept-mgmt',
      amountPiasters: toPiasters(Number(amountEgp) || 0),
    });
    setOpen(false);
    setTitle('');
    setVendorName('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={lang === 'ar' ? 'المشتريات وطلبات الشراء' : 'Procurement & Vendor Orders'}
        description={
          lang === 'ar'
            ? 'دورة الشراء الكاملة: طلب شراء -> اعتماد (SoD) -> أمر شراء -> استلام -> فاتورة مورد.'
            : 'Purchase workflow: Request -> SoD Approval -> Purchase Order -> Receive -> Vendor Bill.'
        }
        actions={
          <button type="button" onClick={() => setOpen(true)} className={btnPrimaryCls}>
            <Plus className="w-4 h-4" />
            <span>{lang === 'ar' ? 'طلب شراء جديد' : 'New Purchase Request'}</span>
          </button>
        }
      />

      <Panel title={`${lang === 'ar' ? 'طلبات وأوامر الشراء' : 'Purchase Requests'} (${data.procurementRequests.length})`}>
        <div className="space-y-3">
          {data.procurementRequests.map((pr) => (
            <div key={pr.id} className="p-4 rounded-xl border border-[#E4E7EC] dark:border-[#293548] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <div className="font-mono font-bold text-[#2563EB]">{pr.requestNumber}</div>
                <div className="text-sm font-bold mt-0.5">{pr.title}</div>
                <div className="text-[#667085] mt-0.5">{lang === 'ar' ? 'المورد:' : 'Vendor:'} {pr.vendorName}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold tabular-nums">{formatEGP(pr.amountPiasters, lang)}</span>
                <StatusIndicator status={pr.status} />
                <select
                  aria-label={`Procurement status for ${pr.title}`}
                  value={pr.status}
                  onChange={(e) => advanceProcurement(pr.id, e.target.value as ProcurementRequest['status'])}
                  className="px-2 py-1 rounded border border-[#E4E7EC] dark:border-[#293548] bg-white dark:bg-[#0B1220]"
                >
                  <option value="requested">Requested</option>
                  <option value="approved">Approved</option>
                  <option value="ordered">Ordered</option>
                  <option value="received">Received</option>
                  <option value="billed">Billed</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Modal open={open} onClose={() => setOpen(false)} title={lang === 'ar' ? 'طلب شراء جديد' : 'New Purchase Request'}>
        <form onSubmit={handleCreate} className="space-y-3">
          <input required placeholder={lang === 'ar' ? 'وصف المطلوب شراؤه' : 'Item Description'} value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
          <input required placeholder={lang === 'ar' ? 'اسم المورد' : 'Vendor Name'} value={vendorName} onChange={(e) => setVendorName(e.target.value)} className={inputCls} />
          <input type="number" min="1" required value={amountEgp} onChange={(e) => setAmountEgp(e.target.value)} className={`${inputCls} tabular-nums`} />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className={btnSecondaryCls}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
            <button type="submit" className={btnPrimaryCls}>{lang === 'ar' ? 'إرسال الطلب' : 'Submit'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export function AssetsPage() {
  const { data, lang, activeBranchId, createAsset, updateAssetStatus } = useOS();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [costEgp, setCostEgp] = useState('45000');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const branchId = activeBranchId === 'all' ? data.branches[0]?.id ?? 'br-cairo' : activeBranchId;
    await createAsset({
      assetTag: tag.trim() || `BAL-AST-${data.assets.length + 10}`,
      name: name.trim(),
      category: 'camera',
      branchId,
      custodianUid: data.employees[0]?.uid,
      acquisitionCostPiasters: toPiasters(Number(costEgp) || 0),
      purchaseDate: new Date().toISOString().slice(0, 10),
      status: 'available',
    });
    setOpen(false);
    setName('');
    setTag('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={lang === 'ar' ? 'الأصول والمعدات والعهد الفنية' : 'Assets, Cameras & Equipment'}
        description={
          lang === 'ar'
            ? 'سجل أصول الوكالة، الكاميرات، الإضاءة، الأجهزة، العهدة، وحالة التوافر.'
            : 'Fixed assets, cameras, lighting, workstations, custody tracking, and branch transfers.'
        }
        actions={
          <button type="button" onClick={() => setOpen(true)} className={btnPrimaryCls}>
            <Plus className="w-4 h-4" />
            <span>{lang === 'ar' ? 'إضافة أصل / معدة' : 'Register Asset'}</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.assets.map((ast) => {
          const br = data.branches.find((b) => b.id === ast.branchId);
          return (
            <Panel key={ast.id} className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <Package className="w-5 h-5 text-[#2563EB] shrink-0" />
                  <div>
                    <div className="text-xs font-mono text-[#2563EB]">{ast.assetTag}</div>
                    <div className="text-sm font-bold">{ast.name}</div>
                  </div>
                </div>
                <StatusIndicator status={ast.status} />
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-[#E4E7EC] dark:border-[#293548]">
                <span className="tabular-nums font-semibold">{formatEGP(ast.acquisitionCostPiasters, lang)} · {br?.name ?? ast.branchId}</span>
                <select
                  aria-label={`Asset status for ${ast.name}`}
                  value={ast.status}
                  onChange={(e) => updateAssetStatus(ast.id, e.target.value as Asset['status'])}
                  className="px-2 py-1 rounded border border-[#E4E7EC] dark:border-[#293548] bg-white dark:bg-[#0B1220]"
                >
                  <option value="available">Available</option>
                  <option value="reserved">Reserved</option>
                  <option value="in_use">In Use</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </Panel>
          );
        })}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={lang === 'ar' ? 'تسجيل أصل جديد' : 'Register Asset'}>
        <form onSubmit={handleCreate} className="space-y-3">
          <input required placeholder={lang === 'ar' ? 'اسم المعدة / الأصل' : 'Asset Name'} value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          <input placeholder="Asset Tag (e.g. BAL-CAM-012)" value={tag} onChange={(e) => setTag(e.target.value)} className={inputCls} />
          <input type="number" min="1" required placeholder="Cost EGP" value={costEgp} onChange={(e) => setCostEgp(e.target.value)} className={`${inputCls} tabular-nums`} />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className={btnSecondaryCls}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
            <button type="submit" className={btnPrimaryCls}>{lang === 'ar' ? 'حفظ' : 'Save'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
