import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Camera, Plus, AlertCircle } from 'lucide-react';
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
import type { Shoot } from '../types/os';

export function ProductionPage() {
  const { data, lang, currentUser, activeBranchId, createShoot, updateShootStatus, reserveEquipment } = useOS();
  const navigate = useNavigate();
  const [shootModal, setShootModal] = useState(false);
  const [equipModal, setEquipModal] = useState(false);

  // Shoot form
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState(data.projects[0]?.id ?? 'proj-1');
  const [location, setLocation] = useState('استوديو القاهرة — التجمع الخامس');
  const [shootDate, setShootDate] = useState('2026-11-26');
  const [costEgp, setCostEgp] = useState('5000');

  // Equipment reservation form
  const [assetId, setAssetId] = useState(data.assets[0]?.id ?? 'ast-1');
  const [resProjectId, setResProjectId] = useState(data.projects[0]?.id ?? 'proj-1');
  const [startIso, setStartIso] = useState('2026-11-23T10:00');
  const [endIso, setEndIso] = useState('2026-11-23T14:00');
  const [conflictError, setConflictError] = useState<string | null>(null);

  const handleCreateShoot = async (e: React.FormEvent) => {
    e.preventDefault();
    const proj = data.projects.find((p) => p.id === projectId);
    const branchId = activeBranchId === 'all' ? data.branches[0]?.id ?? 'br-cairo' : activeBranchId;
    await createShoot({
      title: title.trim(),
      projectId,
      clientId: proj?.clientId ?? 'cli-1',
      branchId,
      location,
      shootDate,
      startTime: '10:00',
      endTime: '16:00',
      directorUid: currentUser?.uid ?? 'emp-photo-1',
      crewUids: [currentUser?.uid ?? 'emp-photo-1'],
      status: 'scheduled',
      objectives: 'تصوير مخرجات المشروع وفق خطة العمل',
      shotList: ['لقطة رئيسية', 'لقطات تفصيلية B-Roll'],
      productionCostPiasters: toPiasters(Number(costEgp) || 0),
    });
    setShootModal(false);
    setTitle('');
  };

  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    setConflictError(null);
    const asset = data.assets.find((a) => a.id === assetId);
    const branchId = activeBranchId === 'all' ? asset?.branchId ?? 'br-cairo' : activeBranchId;
    const res = await reserveEquipment({
      assetId,
      assetName: asset?.name ?? assetId,
      projectId: resProjectId,
      reservedByUid: currentUser?.uid ?? 'demo-ceo-01',
      branchId,
      startIso: new Date(startIso).toISOString(),
      endIso: new Date(endIso).toISOString(),
    });
    if (!res.ok) {
      setConflictError(res.error ?? 'Conflict detected');
      return;
    }
    setEquipModal(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={lang === 'ar' ? 'الإنتاج والتصوير وحجز المعدات' : 'Media Production & Equipment Booking'}
        description={
          lang === 'ar'
            ? 'إدارة أيام التصوير، قوائم اللقطات، حجز الكاميرات والإضاءة مع منع التعارضات، وتسليم الخام.'
            : 'Manage shoot days, shot lists, conflict-checked camera/lighting reservations, and footage handover.'
        }
        actions={
          <>
            <button
              type="button"
              onClick={() => navigate('/studio-3d')}
              className={btnSecondaryCls}
            >
              <Box className="w-4 h-4" />
              <span>{lang === 'ar' ? 'الاستوديو ثلاثي الأبعاد' : '3D Studio Twin'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setConflictError(null);
                setEquipModal(true);
              }}
              className={btnSecondaryCls}
            >
              <Camera className="w-4 h-4" />
              <span>{lang === 'ar' ? 'حجز معدة تصوير' : 'Reserve Equipment'}</span>
            </button>
            <button type="button" onClick={() => setShootModal(true)} className={btnPrimaryCls}>
              <Plus className="w-4 h-4" />
              <span>{lang === 'ar' ? 'جدولة يوم تصوير' : 'Schedule Shoot'}</span>
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <Panel className="lg:col-span-7" title={lang === 'ar' ? `أيام التصوير (${data.shoots.length})` : `Shoots (${data.shoots.length})`}>
          <div className="space-y-3">
            {data.shoots.map((sh) => (
              <div key={sh.id} className="p-4 rounded-xl border border-[#E4E7EC] dark:border-[#293548] space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-bold">{sh.title}</div>
                    <div className="text-xs text-[#667085] mt-0.5">
                      {sh.shootDate} ({sh.startTime}–{sh.endTime}) · {sh.location}
                    </div>
                  </div>
                  <select
                    aria-label={`Status for ${sh.title}`}
                    value={sh.status}
                    onChange={(e) => updateShootStatus(sh.id, e.target.value as Shoot['status'])}
                    className="px-2.5 py-1 text-xs rounded-lg border border-[#E4E7EC] dark:border-[#293548] bg-white dark:bg-[#0B1220]"
                  >
                    <option value="requested">{lang === 'ar' ? 'مطلوب' : 'Requested'}</option>
                    <option value="planned">{lang === 'ar' ? 'مخطط' : 'Planned'}</option>
                    <option value="scheduled">{lang === 'ar' ? 'مجدول' : 'Scheduled'}</option>
                    <option value="in_production">{lang === 'ar' ? 'قيد التصوير' : 'In Production'}</option>
                    <option value="footage_uploaded">{lang === 'ar' ? 'تم رفع الخام' : 'Footage Uploaded'}</option>
                    <option value="handover_completed">{lang === 'ar' ? 'تم تسليم الخام للمونتاج' : 'Handover Completed'}</option>
                  </select>
                </div>
                <div className="text-xs text-[#667085]">
                  <span className="font-semibold text-[#101828] dark:text-[#F9FAFB]">{lang === 'ar' ? 'قائمة اللقطات:' : 'Shot List:'}</span>{' '}
                  {sh.shotList.join(' · ')}
                </div>
                <div className="text-xs font-semibold tabular-nums text-[#2563EB]">
                  {lang === 'ar' ? 'تكلفة الإنتاج:' : 'Production Cost:'} {formatEGP(sh.productionCostPiasters, lang)}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          className="lg:col-span-5"
          title={lang === 'ar' ? 'سجل حجوزات المعدات (منع التعارض)' : 'Equipment Reservations (Conflict Guarded)'}
          subtitle={lang === 'ar' ? 'يرفض النظام تلقائياً أي حجز متداخل زمنياً لنفس المعدة' : 'Overlapping time slots on the same asset are blocked'}
        >
          <div className="space-y-3">
            {data.equipmentReservations.map((res) => (
              <div key={res.id} className="p-3 rounded-lg border border-[#E4E7EC] dark:border-[#293548] text-xs space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold">{res.assetName}</span>
                  <StatusIndicator status={res.status} />
                </div>
                <div className="text-[#667085] tabular-nums">
                  {res.startIso.slice(0, 16).replace('T', ' ')} → {res.endIso.slice(0, 16).replace('T', ' ')}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Modal open={shootModal} onClose={() => setShootModal(false)} title={lang === 'ar' ? 'جدولة يوم تصوير' : 'Schedule Shoot'}>
        <form onSubmit={handleCreateShoot} className="space-y-3">
          <input required placeholder={lang === 'ar' ? 'عنوان يوم التصوير' : 'Shoot Title'} value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={inputCls}>
            {data.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input required placeholder={lang === 'ar' ? 'الموقع' : 'Location'} value={location} onChange={(e) => setLocation(e.target.value)} className={inputCls} />
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={shootDate} onChange={(e) => setShootDate(e.target.value)} className={inputCls} />
            <input type="number" placeholder="Cost EGP" value={costEgp} onChange={(e) => setCostEgp(e.target.value)} className={`${inputCls} tabular-nums`} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShootModal(false)} className={btnSecondaryCls}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
            <button type="submit" className={btnPrimaryCls}>{lang === 'ar' ? 'جدولة' : 'Schedule'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={equipModal} onClose={() => setEquipModal(false)} title={lang === 'ar' ? 'حجز معدة تصوير' : 'Reserve Equipment'}>
        <form onSubmit={handleReserve} className="space-y-3">
          {conflictError && (
            <div role="alert" className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-xs text-[#DC2626] dark:text-red-300 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{conflictError}</span>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium mb-1">{lang === 'ar' ? 'المعدة' : 'Equipment Asset'}</label>
            <select value={assetId} onChange={(e) => setAssetId(e.target.value)} className={inputCls}>
              {data.assets.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.assetTag})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{lang === 'ar' ? 'المشروع' : 'Project'}</label>
            <select value={resProjectId} onChange={(e) => setResProjectId(e.target.value)} className={inputCls}>
              {data.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">{lang === 'ar' ? 'من وقت' : 'Start Time'}</label>
              <input type="datetime-local" value={startIso} onChange={(e) => setStartIso(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{lang === 'ar' ? 'إلى وقت' : 'End Time'}</label>
              <input type="datetime-local" value={endIso} onChange={(e) => setEndIso(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setEquipModal(false)} className={btnSecondaryCls}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
            <button type="submit" className={btnPrimaryCls}>{lang === 'ar' ? 'تأكيد الحجز' : 'Confirm Reservation'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
