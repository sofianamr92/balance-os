import React, { useMemo, useState } from 'react';
import { Plus, MessageSquare, RotateCcw } from 'lucide-react';
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
import type { TaskStatus } from '../types/os';

export function TasksPage() {
  const {
    data,
    lang,
    currentUser,
    createTask,
    updateTaskStatus,
    toggleTaskChecklist,
    addTaskRevision,
    addTaskComment,
  } = useOS();

  const [filter, setFilter] = useState<'all' | 'mine' | 'overdue' | 'review'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState(data.projects[0]?.id ?? 'proj-1');
  const [assigneeUid, setAssigneeUid] = useState(data.employees[0]?.uid ?? 'demo-ceo-01');
  const [dueDate, setDueDate] = useState('2026-11-28');

  const [revReason, setRevReason] = useState('');
  const [revScope, setRevScope] = useState<'in_scope' | 'commercial_change'>('in_scope');
  const [commentBody, setCommentBody] = useState('');

  const filteredTasks = useMemo(() => {
    const today = '2026-11-20';
    return data.tasks.filter((tk) => {
      if (filter === 'mine') return tk.assigneeUid === currentUser?.uid;
      if (filter === 'overdue') return tk.status !== 'completed' && tk.dueDate < today;
      if (filter === 'review') return tk.status === 'internal_review' || tk.status === 'client_approval';
      return true;
    });
  }, [currentUser?.uid, data.tasks, filter]);

  const selectedTask = useMemo(
    () => data.tasks.find((t) => t.id === selectedTaskId) ?? null,
    [data.tasks, selectedTaskId]
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createTask({
      title: title.trim(),
      projectId,
      departmentId: data.departments[0]?.id ?? 'dept-mgmt',
      assigneeUid,
      priority: 'medium',
      status: 'ready',
      dueDate,
      checklist: [{ id: 'chk-1', label: 'التحقق من الجودة', done: false }],
    });
    if (res.ok) {
      setModalOpen(false);
      setTitle('');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={lang === 'ar' ? 'إدارة المهام والتسليمات' : 'Tasks Execution Hub'}
        description={
          lang === 'ar'
            ? 'تتبع المهام، قوائم التحقق، المراجعات الداخلية، والتعديلات ضمن النطاق أو التغييرات التجارية.'
            : 'Track operational tasks, checklists, internal reviews, and in-scope vs commercial change revisions.'
        }
        actions={
          <button type="button" onClick={() => setModalOpen(true)} className={btnPrimaryCls}>
            <Plus className="w-4 h-4" />
            <span>{lang === 'ar' ? 'مهمة جديدة' : 'New Task'}</span>
          </button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: 'all', ar: 'كل المهام', en: 'All Tasks' },
            { id: 'mine', ar: 'مهامي', en: 'My Tasks' },
            { id: 'overdue', ar: 'متأخرة', en: 'Overdue' },
            { id: 'review', ar: 'بانتظار المراجعة', en: 'Waiting Review' },
          ] as const
        ).map((f) => (
          <button
            type="button"
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg border ${
              filter === f.id
                ? 'bg-[#2563EB] text-white border-[#2563EB]'
                : 'bg-white dark:bg-[#111827] border-[#E4E7EC] dark:border-[#293548]'
            }`}
          >
            {f[lang]}
          </button>
        ))}
      </div>

      <Panel title={`${lang === 'ar' ? 'جدول المهام' : 'Tasks Queue'} (${filteredTasks.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#E4E7EC] dark:border-[#293548] text-[#667085]">
                <th className="py-2 text-start">{lang === 'ar' ? 'المهمة' : 'Task'}</th>
                <th className="py-2 text-start">{lang === 'ar' ? 'المسؤول' : 'Assignee'}</th>
                <th className="py-2 text-start">{lang === 'ar' ? 'الاستحقاق' : 'Due Date'}</th>
                <th className="py-2 text-start">{lang === 'ar' ? 'التعديلات' : 'Revisions'}</th>
                <th className="py-2 text-start">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                <th className="py-2 text-start">{lang === 'ar' ? 'تفاصيل' : 'Open'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E7EC] dark:divide-[#293548]">
              {filteredTasks.map((tk) => {
                const assignee = data.employees.find((e) => e.uid === tk.assigneeUid);
                return (
                  <tr key={tk.id}>
                    <td className="py-2.5 font-semibold">{tk.title}</td>
                    <td className="py-2.5">{assignee?.fullName ?? tk.assigneeUid}</td>
                    <td className="py-2.5 tabular-nums">{tk.dueDate}</td>
                    <td className="py-2.5 tabular-nums">{tk.revisionCount}</td>
                    <td className="py-2.5">
                      <select
                        aria-label={`Status for ${tk.title}`}
                        value={tk.status}
                        onChange={(e) => updateTaskStatus(tk.id, e.target.value as TaskStatus)}
                        className="px-2 py-1 rounded border border-[#E4E7EC] dark:border-[#293548] bg-white dark:bg-[#0B1220]"
                      >
                        <option value="ready">{lang === 'ar' ? 'جاهزة' : 'Ready'}</option>
                        <option value="assigned">{lang === 'ar' ? 'مسندة' : 'Assigned'}</option>
                        <option value="in_progress">{lang === 'ar' ? 'قيد التنفيذ' : 'In Progress'}</option>
                        <option value="internal_review">{lang === 'ar' ? 'مراجعة داخلية' : 'Internal Review'}</option>
                        <option value="revision">{lang === 'ar' ? 'تعديل' : 'Revision'}</option>
                        <option value="completed">{lang === 'ar' ? 'مكتملة' : 'Completed'}</option>
                      </select>
                    </td>
                    <td className="py-2.5">
                      <button type="button" onClick={() => setSelectedTaskId(tk.id)} className="text-[#2563EB] font-semibold hover:underline">
                        {lang === 'ar' ? 'فتح' : 'Inspect'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Task Detail Modal */}
      <Modal open={Boolean(selectedTask)} onClose={() => setSelectedTaskId(null)} title={selectedTask?.title ?? ''}>
        {selectedTask && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <StatusIndicator status={selectedTask.status} />
              <span className="text-[#667085] tabular-nums">{lang === 'ar' ? 'الاستحقاق:' : 'Due:'} {selectedTask.dueDate}</span>
            </div>

            <div>
              <div className="font-bold mb-2">{lang === 'ar' ? 'قائمة التحقق (Checklist)' : 'Checklist'}</div>
              {selectedTask.checklist.map((c) => (
                <label key={c.id} className="flex items-center gap-2 py-1 cursor-pointer">
                  <input type="checkbox" checked={c.done} onChange={() => toggleTaskChecklist(selectedTask.id, c.id)} />
                  <span className={c.done ? 'line-through text-[#667085]' : ''}>{c.label}</span>
                </label>
              ))}
            </div>

            <div className="p-3 rounded-lg border border-[#E4E7EC] dark:border-[#293548] space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'تسجيل طلب تعديل (Revision)' : 'Log Revision Request'}</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={revReason}
                  onChange={(e) => setRevReason(e.target.value)}
                  placeholder={lang === 'ar' ? 'سبب التعديل...' : 'Revision reason...'}
                  className={inputCls}
                />
                <select value={revScope} onChange={(e) => setRevScope(e.target.value as 'in_scope' | 'commercial_change')} className={`${inputCls} sm:w-44`}>
                  <option value="in_scope">{lang === 'ar' ? 'ضمن النطاق' : 'In Scope'}</option>
                  <option value="commercial_change">{lang === 'ar' ? 'تغيير تجاري' : 'Commercial Change'}</option>
                </select>
                <button
                  type="button"
                  onClick={() => {
                    if (!revReason.trim()) return;
                    addTaskRevision(selectedTask.id, revReason.trim(), revScope);
                    setRevReason('');
                  }}
                  className={btnPrimaryCls}
                >
                  {lang === 'ar' ? 'طلب تعديل' : 'Request'}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'التعليقات' : 'Comments'}</span>
              </div>
              <div className="flex gap-2">
                <input value={commentBody} onChange={(e) => setCommentBody(e.target.value)} placeholder={lang === 'ar' ? 'أضف تعليقاً...' : 'Add comment...'} className={inputCls} />
                <button
                  type="button"
                  onClick={() => {
                    if (!commentBody.trim()) return;
                    addTaskComment(selectedTask.id, commentBody.trim());
                    setCommentBody('');
                  }}
                  className={btnSecondaryCls}
                >
                  {lang === 'ar' ? 'إرسال' : 'Post'}
                </button>
              </div>
              {(selectedTask.comments ?? []).map((cm) => (
                <div key={cm.id} className="p-2 rounded bg-[#F7F9FC] dark:bg-[#0B1220]">{cm.body}</div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={lang === 'ar' ? 'إنشاء مهمة جديدة' : 'Create Task'}>
        <form onSubmit={handleCreate} className="space-y-3">
          <input required placeholder={lang === 'ar' ? 'عنوان المهمة' : 'Task Title'} value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={inputCls}>
            {data.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={assigneeUid} onChange={(e) => setAssigneeUid(e.target.value)} className={inputCls}>
            {data.employees.map((emp) => (
              <option key={emp.uid} value={emp.uid}>{emp.fullName} ({emp.status})</option>
            ))}
          </select>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className={btnSecondaryCls}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
            <button type="submit" className={btnPrimaryCls}>{lang === 'ar' ? 'حفظ' : 'Save'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
