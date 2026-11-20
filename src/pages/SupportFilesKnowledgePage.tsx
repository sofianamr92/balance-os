import React, { useState } from 'react';
import { BookOpen, FileText, Headphones, Plus } from 'lucide-react';
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
import type { FileRecord, KnowledgeArticle, SupportTicket } from '../types/os';

export function SupportPage() {
  const { data, lang, currentUser, createSupportTicket, updateTicketStatus } = useOS();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [clientId, setClientId] = useState(data.clients[0]?.id ?? 'cli-1');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createSupportTicket({
      subject: subject.trim(),
      clientId,
      departmentId: 'dept-sup',
      assigneeUid: currentUser?.uid ?? 'emp-sup-1',
      priority: 'high',
      status: 'new',
      dueDate: '2026-11-23',
      lastMessage: 'تم فتح التذكرة وتوجيهها للفريق المختص.',
    });
    setOpen(false);
    setSubject('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={lang === 'ar' ? 'خدمة العملاء وتذاكر الدعم' : 'Customer Support & SLA Tickets'}
        description={
          lang === 'ar'
            ? 'إدارة تذاكر العملاء وشكاوى الخدمة وربطها بالمشاريع والإدارات المعنية.'
            : 'Track client support tickets, SLAs, escalations, and linked projects.'
        }
        actions={
          <button type="button" onClick={() => setOpen(true)} className={btnPrimaryCls}>
            <Plus className="w-4 h-4" />
            <span>{lang === 'ar' ? 'فتح تذكرة دعم' : 'New Ticket'}</span>
          </button>
        }
      />

      <div className="space-y-3">
        {data.supportTickets.map((tkt) => {
          const cli = data.clients.find((c) => c.id === tkt.clientId);
          return (
            <Panel key={tkt.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <Headphones className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-mono text-[#2563EB]">{tkt.ticketNumber} · {cli?.name ?? tkt.clientId}</div>
                  <div className="text-sm font-bold mt-0.5">{tkt.subject}</div>
                  <div className="text-xs text-[#667085] mt-1">{tkt.lastMessage}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusIndicator status={tkt.status} />
                <select
                  aria-label={`Ticket status for ${tkt.ticketNumber}`}
                  value={tkt.status}
                  onChange={(e) => updateTicketStatus(tkt.id, e.target.value as SupportTicket['status'])}
                  className="px-2 py-1 text-xs rounded border border-[#E4E7EC] dark:border-[#293548] bg-white dark:bg-[#0B1220]"
                >
                  <option value="new">New</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="waiting_client">Waiting Client</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </Panel>
          );
        })}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={lang === 'ar' ? 'فتح تذكرة دعم جديدة' : 'Open Support Ticket'}>
        <form onSubmit={handleCreate} className="space-y-3">
          <input required placeholder={lang === 'ar' ? 'موضوع التذكرة' : 'Subject'} value={subject} onChange={(e) => setSubject(e.target.value)} className={inputCls} />
          <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={inputCls}>
            {data.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className={btnSecondaryCls}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
            <button type="submit" className={btnPrimaryCls}>{lang === 'ar' ? 'إرسال' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export function FilesPage() {
  const { data, lang, createFileRecord } = useOS();
  const [open, setOpen] = useState(false);
  const [folder, setFolder] = useState<'all' | FileRecord['folder']>('all');
  const [name, setName] = useState('');
  const [newFolder, setNewFolder] = useState<FileRecord['folder']>('projects');

  const visibleFiles = data.files.filter((f) => folder === 'all' || f.folder === folder);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createFileRecord({
      name: name.trim(),
      folder: newFolder,
      mimeType: 'application/pdf',
      sizeLabel: '2.4 MB',
      storagePath: `gs://balance-os/${newFolder}/${name.trim()}`,
      version: 'v1.0',
      classification: 'department_only',
      tags: [newFolder],
    });
    setOpen(false);
    setName('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={lang === 'ar' ? 'مكتبة الملفات والأصول الرقمية' : 'Enterprise File Library'}
        description={
          lang === 'ar'
            ? 'تصنيف وفهرسة ملفات العقود، العملاء، المشاريع، الميديا، والتصميم مع مستويات السرية.'
            : 'Organized repository across contracts, clients, projects, media, and confidential HR/finance.'
        }
        actions={
          <button type="button" onClick={() => setOpen(true)} className={btnPrimaryCls}>
            <Plus className="w-4 h-4" />
            <span>{lang === 'ar' ? 'أرشفة ملف جديد' : 'Index File'}</span>
          </button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {(['all', 'contracts', 'clients', 'projects', 'media', 'design', 'hr'] as const).map((f) => (
          <button
            type="button"
            key={f}
            onClick={() => setFolder(f)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${
              folder === f ? 'bg-[#2563EB] text-white border-[#2563EB]' : 'bg-white dark:bg-[#111827] border-[#E4E7EC] dark:border-[#293548]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <Panel title={`${lang === 'ar' ? 'الملفات المؤرشفة' : 'Indexed Files'} (${visibleFiles.length})`}>
        <div className="divide-y divide-[#E4E7EC] dark:divide-[#293548] text-xs">
          {visibleFiles.map((f) => (
            <div key={f.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-[#2563EB] shrink-0" />
                <div>
                  <div className="font-semibold text-sm">{f.name}</div>
                  <div className="text-[#667085] font-mono">{f.storagePath}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[#667085] tabular-nums">
                <span>{f.folder}</span>
                <span>{f.version}</span>
                <span>{f.sizeLabel}</span>
                <span>{f.classification}</span>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Modal open={open} onClose={() => setOpen(false)} title={lang === 'ar' ? 'تسجيل ملف في المكتبة' : 'Index File'}>
        <form onSubmit={handleCreate} className="space-y-3">
          <input required placeholder={lang === 'ar' ? 'اسم الملف (مثلاً: عرض_العميل_v1.pdf)' : 'File Name'} value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          <select value={newFolder} onChange={(e) => setNewFolder(e.target.value as FileRecord['folder'])} className={inputCls}>
            <option value="projects">projects</option>
            <option value="contracts">contracts</option>
            <option value="clients">clients</option>
            <option value="media">media</option>
            <option value="design">design</option>
          </select>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className={btnSecondaryCls}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
            <button type="submit" className={btnPrimaryCls}>{lang === 'ar' ? 'حفظ' : 'Save'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export function KnowledgePage() {
  const { data, lang, createKnowledgeArticle } = useOS();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<KnowledgeArticle['category']>('sop');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createKnowledgeArticle({
      title: title.trim(),
      category,
      departmentId: data.departments[0]?.id ?? 'dept-mgmt',
      summary: summary.trim(),
      content: content.trim(),
      version: '1.0',
      reviewDate: new Date().toISOString().slice(0, 10),
    });
    setOpen(false);
    setTitle('');
    setSummary('');
    setContent('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={lang === 'ar' ? 'قاعدة المعرفة والسياسات القياسية (SOPs)' : 'Knowledge Base & SOPs'}
        description={
          lang === 'ar'
            ? 'أدلة العمل القياسية، السياسات الداخلية، القوائم المرجعية، وتدريب الموظفين الجدد.'
            : 'Standard operating procedures, internal policies, templates, and onboarding manuals.'
        }
        actions={
          <button type="button" onClick={() => setOpen(true)} className={btnPrimaryCls}>
            <Plus className="w-4 h-4" />
            <span>{lang === 'ar' ? 'إضافة مقال / SOP' : 'New Article'}</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {data.knowledgeArticles.map((art) => (
          <Panel key={art.id} className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#2563EB] shrink-0" />
                <div className="text-sm font-bold">{art.title}</div>
              </div>
              <span className="text-xs font-mono text-[#667085]">v{art.version}</span>
            </div>
            <div className="text-xs font-medium text-[#2563EB]">{art.category.toUpperCase()}</div>
            <p className="text-xs text-[#667085] dark:text-[#9CA3AF]">{art.summary}</p>
            <pre className="whitespace-pre-wrap text-xs bg-[#F7F9FC] dark:bg-[#0B1220] p-3 rounded-lg font-sans text-[#101828] dark:text-[#F9FAFB]">
              {art.content}
            </pre>
          </Panel>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={lang === 'ar' ? 'نشر دليل عمل أو سياسة' : 'Publish Knowledge Article'}>
        <form onSubmit={handleCreate} className="space-y-3">
          <input required placeholder={lang === 'ar' ? 'عنوان المقال' : 'Article Title'} value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
          <select value={category} onChange={(e) => setCategory(e.target.value as KnowledgeArticle['category'])} className={inputCls}>
            <option value="sop">SOP</option>
            <option value="policy">Policy</option>
            <option value="manual">Manual</option>
            <option value="checklist">Checklist</option>
          </select>
          <input required placeholder={lang === 'ar' ? 'ملخص قصير' : 'Summary'} value={summary} onChange={(e) => setSummary(e.target.value)} className={inputCls} />
          <textarea required rows={4} placeholder={lang === 'ar' ? 'المحتوى التفصيلي والخطوات...' : 'Detailed steps...'} value={content} onChange={(e) => setContent(e.target.value)} className={inputCls} />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className={btnSecondaryCls}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
            <button type="submit" className={btnPrimaryCls}>{lang === 'ar' ? 'نشر' : 'Publish'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
