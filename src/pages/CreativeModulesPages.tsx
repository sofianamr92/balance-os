import React, { useState } from 'react';
import { Plus } from 'lucide-react';
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
import type { DesignJob, DevItem, EditingJob, MarketingItem } from '../types/os';

export function EditingPage() {
  const { data, lang, currentUser, createEditingJob, updateEditingStatus } = useOS();
  const [open, setOpen] = useState(false);
  const [videoTitle, setVideoTitle] = useState('');
  const [projectId, setProjectId] = useState(data.projects[0]?.id ?? 'proj-1');
  const [aspectRatio, setAspectRatio] = useState<EditingJob['aspectRatio']>('9:16');
  const [resolution, setResolution] = useState<EditingJob['resolution']>('4K');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const proj = data.projects.find((p) => p.id === projectId);
    await createEditingJob({
      videoTitle: videoTitle.trim(),
      projectId,
      clientId: proj?.clientId ?? 'cli-1',
      editorUid: currentUser?.uid ?? 'emp-edit-1',
      reviewerUid: 'emp-pm-1',
      footageLocation: '/media/raw/incoming',
      durationSec: 45,
      aspectRatio,
      resolution,
      frameRate: '60fps',
      captionsRequired: true,
      deadline: '2026-11-28',
      exportVersion: 'v1.0',
      status: 'incoming_footage',
    });
    setOpen(false);
    setVideoTitle('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={lang === 'ar' ? 'قسم المونتاج وما بعد الإنتاج' : 'Video Editing Studio'}
        description={
          lang === 'ar'
            ? 'إدارة مهام المونتاج، المقاسات (9:16، 16:9)، الدقة، النسخ، وعدد التعديلات.'
            : 'Track editing pipeline, aspect ratios, resolution specs, export versions, and revisions.'
        }
        actions={
          <button type="button" onClick={() => setOpen(true)} className={btnPrimaryCls}>
            <Plus className="w-4 h-4" />
            <span>{lang === 'ar' ? 'طلب مونتاج جديد' : 'New Editing Job'}</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.editingJobs.map((job) => (
          <Panel key={job.id} className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-sm font-bold">{job.videoTitle}</div>
                <div className="text-xs text-[#667085] mt-0.5 font-mono">{job.footageLocation}</div>
              </div>
              <StatusIndicator status={job.status} />
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs bg-[#F7F9FC] dark:bg-[#0B1220] p-2.5 rounded-lg">
              <div><span className="text-[#667085]">Ratio:</span> <strong>{job.aspectRatio}</strong></div>
              <div><span className="text-[#667085]">Spec:</span> <strong>{job.resolution} / {job.frameRate}</strong></div>
              <div><span className="text-[#667085]">Ver:</span> <strong className="tabular-nums">{job.exportVersion} (Rev {job.revisionCount})</strong></div>
            </div>
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="tabular-nums text-[#667085]">{lang === 'ar' ? 'الموعد:' : 'Deadline:'} {job.deadline}</span>
              <select
                aria-label={`Editing status for ${job.videoTitle}`}
                value={job.status}
                onChange={(e) => updateEditingStatus(job.id, e.target.value as EditingJob['status'])}
                className="px-2 py-1 rounded border border-[#E4E7EC] dark:border-[#293548] bg-white dark:bg-[#0B1220]"
              >
                <option value="incoming_footage">Incoming Footage</option>
                <option value="editing">Editing</option>
                <option value="internal_review">Internal Review</option>
                <option value="revision">Revision</option>
                <option value="approved">Approved</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
          </Panel>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={lang === 'ar' ? 'مهمة مونتاج جديدة' : 'New Editing Job'}>
        <form onSubmit={handleCreate} className="space-y-3">
          <input required placeholder={lang === 'ar' ? 'عنوان الفيديو' : 'Video Title'} value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} className={inputCls} />
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={inputCls}>
            {data.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as EditingJob['aspectRatio'])} className={inputCls}>
              <option value="9:16">9:16 Reels/TikTok</option>
              <option value="16:9">16:9 YouTube/TVC</option>
              <option value="1:1">1:1 Square</option>
              <option value="4:5">4:5 Portrait</option>
            </select>
            <select value={resolution} onChange={(e) => setResolution(e.target.value as EditingJob['resolution'])} className={inputCls}>
              <option value="4K">4K Ultra HD</option>
              <option value="1080p">1080p Full HD</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className={btnSecondaryCls}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
            <button type="submit" className={btnPrimaryCls}>{lang === 'ar' ? 'إضافة' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export function DesignPage() {
  const { data, lang, currentUser, createDesignJob, updateDesignStatus } = useOS();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DesignJob['category']>('social_post');
  const [brandNotes, setBrandNotes] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createDesignJob({
      title: title.trim(),
      projectId: data.projects[0]?.id ?? 'proj-1',
      clientId: data.clients[0]?.id ?? 'cli-1',
      designerUid: currentUser?.uid ?? 'emp-design-1',
      reviewerUid: 'emp-pm-1',
      category,
      dimensions: ['1080x1080', '1080x1920'],
      brandNotes: brandNotes || 'الالتزام بدليل الهوية البصرية',
      deadline: '2026-11-29',
      status: 'requested',
    });
    setOpen(false);
    setTitle('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={lang === 'ar' ? 'التصميم الجرافيكي والهوية البصرية' : 'Graphic Design Studio'}
        description={
          lang === 'ar'
            ? 'متابعة طلبات التصميم، المقاسات المطلوبة، إرشادات العلامة التجارية، والإصدارات.'
            : 'Manage graphic design requests, dimensions, brand guidelines, and revision cycles.'
        }
        actions={
          <button type="button" onClick={() => setOpen(true)} className={btnPrimaryCls}>
            <Plus className="w-4 h-4" />
            <span>{lang === 'ar' ? 'طلب تصميم جديد' : 'New Design Request'}</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.designJobs.map((job) => (
          <Panel key={job.id} className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-sm font-bold">{job.title}</div>
                <div className="text-xs text-[#667085] mt-0.5">{job.category} · v{job.version} (Rev {job.revisionCount})</div>
              </div>
              <StatusIndicator status={job.status} />
            </div>
            <div className="text-xs text-[#667085]">{job.brandNotes}</div>
            <div className="flex items-center justify-between text-xs pt-2 border-t border-[#E4E7EC] dark:border-[#293548]">
              <span>{job.dimensions.join(' · ')}</span>
              <select
                aria-label={`Design status for ${job.title}`}
                value={job.status}
                onChange={(e) => updateDesignStatus(job.id, e.target.value as DesignJob['status'])}
                className="px-2 py-1 rounded border border-[#E4E7EC] dark:border-[#293548] bg-white dark:bg-[#0B1220]"
              >
                <option value="requested">Requested</option>
                <option value="designing">Designing</option>
                <option value="internal_review">Internal Review</option>
                <option value="revision">Revision</option>
                <option value="approved">Approved</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
          </Panel>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={lang === 'ar' ? 'إنشاء طلب تصميم' : 'Create Design Request'}>
        <form onSubmit={handleCreate} className="space-y-3">
          <input required placeholder={lang === 'ar' ? 'عنوان التصميم' : 'Design Title'} value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
          <select value={category} onChange={(e) => setCategory(e.target.value as DesignJob['category'])} className={inputCls}>
            <option value="social_post">Social Post</option>
            <option value="ad_creative">Ad Creative</option>
            <option value="brand_identity">Brand Identity</option>
            <option value="print">Print / Packaging</option>
          </select>
          <textarea rows={2} placeholder={lang === 'ar' ? 'ملاحظات الهوية البصرية' : 'Brand Notes'} value={brandNotes} onChange={(e) => setBrandNotes(e.target.value)} className={inputCls} />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className={btnSecondaryCls}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
            <button type="submit" className={btnPrimaryCls}>{lang === 'ar' ? 'إرسال' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export function MarketingPage() {
  const { data, lang, currentUser, createMarketingItem, updateMarketingStatus } = useOS();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState<MarketingItem['platform']>('Instagram');
  const [budgetEgp, setBudgetEgp] = useState('15000');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMarketingItem({
      kind: 'campaign',
      title: title.trim(),
      clientId: data.clients[0]?.id ?? 'cli-1',
      projectId: data.projects[0]?.id ?? 'proj-1',
      platform,
      objective: 'Lead Generation',
      scheduledDate: '2026-11-26',
      budgetPiasters: toPiasters(Number(budgetEgp) || 0),
      spendPiasters: 0,
      reach: 0,
      clicks: 0,
      leadsCount: 0,
      dataSource: 'إدخال يدوي موثق من مدير الحملة',
      creatorUid: currentUser?.uid ?? 'emp-mkt-1',
      status: 'planned',
    });
    setOpen(false);
    setTitle('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={lang === 'ar' ? 'التسويق وإدارة المحتوى والحملات' : 'Social Media Marketing & Campaigns'}
        description={
          lang === 'ar'
            ? 'تقويم المحتوى والحملات الممولة مع توثيق مصدر كل رقم تسويقي بشفافية.'
            : 'Content calendar and ad campaigns with explicit data source attribution.'
        }
        actions={
          <button type="button" onClick={() => setOpen(true)} className={btnPrimaryCls}>
            <Plus className="w-4 h-4" />
            <span>{lang === 'ar' ? 'حملة / محتوى جديد' : 'New Campaign / Post'}</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.marketingItems.map((m) => (
          <Panel key={m.id} className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-xs font-semibold text-[#2563EB]">{m.platform} · {m.kind}</div>
                <div className="text-sm font-bold mt-0.5">{m.title}</div>
              </div>
              <StatusIndicator status={m.status} />
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs bg-[#F7F9FC] dark:bg-[#0B1220] p-2.5 rounded-lg tabular-nums">
              <div><div className="text-[#667085]">Budget</div><strong>{formatEGP(m.budgetPiasters, lang)}</strong></div>
              <div><div className="text-[#667085]">Reach</div><strong>{m.reach.toLocaleString()}</strong></div>
              <div><div className="text-[#667085]">Clicks</div><strong>{m.clicks.toLocaleString()}</strong></div>
              <div><div className="text-[#667085]">Leads</div><strong>{m.leadsCount}</strong></div>
            </div>
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-[#667085]">{lang === 'ar' ? 'مصدر البيانات:' : 'Source:'} {m.dataSource}</span>
              <select
                aria-label={`Marketing status for ${m.title}`}
                value={m.status}
                onChange={(e) => updateMarketingStatus(m.id, e.target.value as MarketingItem['status'])}
                className="px-2 py-1 rounded border border-[#E4E7EC] dark:border-[#293548] bg-white dark:bg-[#0B1220]"
              >
                <option value="planned">Planned</option>
                <option value="scheduled">Scheduled</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </Panel>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={lang === 'ar' ? 'إضافة حملة تسويقية' : 'New Marketing Campaign'}>
        <form onSubmit={handleCreate} className="space-y-3">
          <input required placeholder={lang === 'ar' ? 'اسم الحملة أو المحتوى' : 'Campaign Title'} value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
          <select value={platform} onChange={(e) => setPlatform(e.target.value as MarketingItem['platform'])} className={inputCls}>
            <option value="Instagram">Instagram</option>
            <option value="TikTok">TikTok</option>
            <option value="Facebook">Facebook</option>
            <option value="Google Ads">Google Ads</option>
          </select>
          <input type="number" placeholder="Budget EGP" value={budgetEgp} onChange={(e) => setBudgetEgp(e.target.value)} className={`${inputCls} tabular-nums`} />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className={btnSecondaryCls}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
            <button type="submit" className={btnPrimaryCls}>{lang === 'ar' ? 'حفظ' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export function DevelopmentPage() {
  const { data, lang, currentUser, createDevItem, updateDevStatus } = useOS();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<DevItem['kind']>('feature');
  const [sprint, setSprint] = useState('Sprint 14');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createDevItem({
      kind,
      title: title.trim(),
      projectId: data.projects.find((p) => p.departmentId === 'dept-dev')?.id ?? data.projects[0]?.id ?? 'proj-4',
      sprint,
      severity: 'high',
      assigneeUid: currentUser?.uid ?? 'emp-dev-1',
      status: 'backlog',
    });
    setOpen(false);
    setTitle('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={lang === 'ar' ? 'البرمجة والتطوير وضبط الجودة (QA)' : 'Software Engineering & QA'}
        description={
          lang === 'ar'
            ? 'إدارة المتطلبات التقنية، الميزات، تتبع الأخطاء، السبرنتات، والإطلاقات.'
            : 'Manage requirements, features, bug triage, sprint backlog, QA, and releases.'
        }
        actions={
          <button type="button" onClick={() => setOpen(true)} className={btnPrimaryCls}>
            <Plus className="w-4 h-4" />
            <span>{lang === 'ar' ? 'إضافة ميزة / خطأ' : 'New Dev Item'}</span>
          </button>
        }
      />

      <Panel title={`${lang === 'ar' ? 'لوحة التطوير والسبرنتات' : 'Engineering Backlog'} (${data.devItems.length})`}>
        <div className="divide-y divide-[#E4E7EC] dark:divide-[#293548] text-xs">
          {data.devItems.map((item) => (
            <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold">{item.title}</div>
                <div className="text-[#667085] mt-0.5">{item.kind.toUpperCase()} · {item.sprint} · {item.severity}</div>
              </div>
              <div className="flex items-center gap-3">
                <StatusIndicator status={item.status} />
                <select
                  aria-label={`Dev status for ${item.title}`}
                  value={item.status}
                  onChange={(e) => updateDevStatus(item.id, e.target.value as DevItem['status'])}
                  className="px-2 py-1 rounded border border-[#E4E7EC] dark:border-[#293548] bg-white dark:bg-[#0B1220]"
                >
                  <option value="backlog">Backlog</option>
                  <option value="in_development">In Development</option>
                  <option value="code_review">Code Review</option>
                  <option value="qa">QA</option>
                  <option value="released">Released</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Modal open={open} onClose={() => setOpen(false)} title={lang === 'ar' ? 'إضافة عنصر تطوير' : 'Add Dev Item'}>
        <form onSubmit={handleCreate} className="space-y-3">
          <input required placeholder={lang === 'ar' ? 'الوصف' : 'Title'} value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
          <div className="grid grid-cols-2 gap-3">
            <select value={kind} onChange={(e) => setKind(e.target.value as DevItem['kind'])} className={inputCls}>
              <option value="feature">Feature</option>
              <option value="bug">Bug</option>
              <option value="requirement">Requirement</option>
            </select>
            <input value={sprint} onChange={(e) => setSprint(e.target.value)} className={inputCls} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className={btnSecondaryCls}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
            <button type="submit" className={btnPrimaryCls}>{lang === 'ar' ? 'حفظ' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
