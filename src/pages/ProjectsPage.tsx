import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
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
import { calculateProjectContributionMargin, formatEGP, toPiasters } from '../utils/accounting';
import { isRecordVisibleToUser } from '../utils/rbac';
import type { ProjectStatus } from '../types/os';

export function ProjectsPage() {
  const { data, lang, currentUser, activeBranchId, createProject } = useOS();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [name, setName] = useState('');
  const [clientId, setClientId] = useState(data.clients[0]?.id ?? 'cli-1');
  const [deptId, setDeptId] = useState(data.departments[0]?.id ?? 'dept-photo');
  const [revEgp, setRevEgp] = useState('80000');
  const [estCostEgp, setEstCostEgp] = useState('30000');

  const visibleProjects = useMemo(
    () =>
      data.projects.filter(
        (p) =>
          isRecordVisibleToUser(p, currentUser, activeBranchId) &&
          (statusFilter === 'all' || p.status === statusFilter)
      ),
    [activeBranchId, currentUser, data.projects, statusFilter]
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const branchId = activeBranchId === 'all' ? data.branches[0]?.id ?? 'br-cairo' : activeBranchId;
    await createProject({
      name: name.trim(),
      clientId,
      branchId,
      departmentId: deptId,
      managerUid: currentUser?.uid ?? 'demo-ceo-01',
      status: 'active',
      priority: 'high',
      startDate: new Date().toISOString().slice(0, 10),
      dueDate: '2026-12-20',
      approvedRevenuePiasters: toPiasters(Number(revEgp) || 0),
      estimatedCostPiasters: toPiasters(Number(estCostEgp) || 0),
      actualCostPiasters: 0,
      progress: 0,
      deliverables: [{ id: 'del-init', title: 'تسليم المخرج الرئيسي المعتمد', mandatory: true, approved: false }],
    });
    setModalOpen(false);
    setName('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={lang === 'ar' ? 'إدارة المشاريع والتنفيذ' : 'Projects Portfolio'}
        description={
          lang === 'ar'
            ? 'متابعة نسب الإنجاز، انحراف الميزانية، هامش مساهمة كل مشروع، وبوابة اعتماد المخرجات.'
            : 'Track delivery progress, cost variance, contribution margin, and deliverable approval gates.'
        }
        actions={
          <>
            <select
              aria-label="Filter projects by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium bg-white dark:bg-[#111827] border border-[#E4E7EC] dark:border-[#293548] rounded-lg"
            >
              <option value="all">{lang === 'ar' ? 'جميع الحالات' : 'All Statuses'}</option>
              <option value="active">{lang === 'ar' ? 'نشط' : 'Active'}</option>
              <option value="at_risk">{lang === 'ar' ? 'معرض للخطر' : 'At Risk'}</option>
              <option value="completed">{lang === 'ar' ? 'مكتمل' : 'Completed'}</option>
            </select>
            <button type="button" onClick={() => setModalOpen(true)} className={btnPrimaryCls}>
              <Plus className="w-4 h-4" />
              <span>{lang === 'ar' ? 'مشروع جديد' : 'New Project'}</span>
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {visibleProjects.map((proj) => {
          const client = data.clients.find((c) => c.id === proj.clientId);
          const cm = calculateProjectContributionMargin(proj);
          const overBudget = proj.actualCostPiasters > proj.estimatedCostPiasters;
          return (
            <Panel key={proj.id} className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <button
                    type="button"
                    onClick={() => navigate(`/projects/${proj.id}`)}
                    className="text-start text-base font-bold text-[#101828] dark:text-[#F9FAFB] hover:text-[#2563EB]"
                  >
                    {proj.name}
                  </button>
                  <div className="text-xs text-[#667085] mt-0.5">
                    {client?.name ?? proj.clientId} · {proj.dueDate}
                  </div>
                </div>
                <StatusIndicator status={proj.status} />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span>{lang === 'ar' ? 'نسبة الإنجاز' : 'Progress'}</span>
                  <span className="font-bold tabular-nums">{proj.progress}%</span>
                </div>
                <div className="h-2 bg-[#EEF2F6] dark:bg-[#182235] rounded overflow-hidden">
                  <div className="h-full bg-[#2563EB]" style={{ width: `${proj.progress}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#E4E7EC] dark:border-[#293548] text-xs">
                <div>
                  <div className="text-[#667085]">{lang === 'ar' ? 'الإيراد المعتمد' : 'Revenue'}</div>
                  <div className="font-bold tabular-nums mt-0.5">{formatEGP(cm.revenuePiasters, lang)}</div>
                </div>
                <div>
                  <div className="text-[#667085]">{lang === 'ar' ? 'التكلفة الفعلية' : 'Actual Cost'}</div>
                  <div className={`font-bold tabular-nums mt-0.5 ${overBudget ? 'text-[#DC2626]' : ''}`}>
                    {formatEGP(cm.directCostsPiasters, lang)}
                  </div>
                </div>
                <div>
                  <div className="text-[#667085]">{lang === 'ar' ? 'هامش المساهمة' : 'Contribution'}</div>
                  <div className="font-bold tabular-nums text-[#16A34A] mt-0.5">
                    {formatEGP(cm.contributionMarginPiasters, lang)} ({cm.marginPercent}%)
                  </div>
                </div>
              </div>
            </Panel>
          );
        })}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={lang === 'ar' ? 'إنشاء مشروع جديد' : 'Create Project'}>
        <form onSubmit={handleCreate} className="space-y-3">
          <input required placeholder={lang === 'ar' ? 'اسم المشروع' : 'Project Name'} value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={inputCls}>
            {data.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={deptId} onChange={(e) => setDeptId(e.target.value)} className={inputCls}>
            {data.departments.map((d) => <option key={d.id} value={d.id}>{lang === 'ar' ? d.name : d.nameEn}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input type="number" required placeholder="Approved Revenue EGP" value={revEgp} onChange={(e) => setRevEgp(e.target.value)} className={`${inputCls} tabular-nums`} />
            <input type="number" required placeholder="Est. Direct Cost EGP" value={estCostEgp} onChange={(e) => setEstCostEgp(e.target.value)} className={`${inputCls} tabular-nums`} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className={btnSecondaryCls}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
            <button type="submit" className={btnPrimaryCls}>{lang === 'ar' ? 'إنشاء المشروع' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { data, lang, updateProjectStatus, toggleDeliverableApproval, updateTaskStatus } = useOS();

  const project = data.projects.find((p) => p.id === projectId);
  if (!project) {
    return (
      <Panel title={lang === 'ar' ? 'المشروع غير موجود' : 'Project Not Found'}>
        <button type="button" onClick={() => navigate('/projects')} className={btnSecondaryCls}>
          {lang === 'ar' ? 'العودة للمشاريع' : 'Back to Projects'}
        </button>
      </Panel>
    );
  }

  const cm = calculateProjectContributionMargin(project);
  const projectTasks = data.tasks.filter((t) => t.projectId === project.id);
  const BackIcon = lang === 'ar' ? ArrowRight : ArrowLeft;

  return (
    <div className="space-y-6">
      <PageHeader
        title={project.name}
        description={`${lang === 'ar' ? 'تاريخ التسليم:' : 'Due:'} ${project.dueDate}`}
        actions={
          <>
            <button type="button" onClick={() => navigate('/projects')} className={btnSecondaryCls}>
              <BackIcon className="w-4 h-4" />
              <span>{lang === 'ar' ? 'المشاريع' : 'Projects'}</span>
            </button>
            <select
              aria-label="Project status"
              value={project.status}
              onChange={(e) => updateProjectStatus(project.id, e.target.value as ProjectStatus)}
              className="px-3 py-2 text-xs font-semibold bg-white dark:bg-[#111827] border border-[#E4E7EC] dark:border-[#293548] rounded-lg"
            >
              <option value="active">{lang === 'ar' ? 'نشط' : 'Active'}</option>
              <option value="at_risk">{lang === 'ar' ? 'معرض للخطر' : 'At Risk'}</option>
              <option value="under_review">{lang === 'ar' ? 'قيد المراجعة' : 'Under Review'}</option>
              <option value="completed">{lang === 'ar' ? 'مكتمل (يتطلب اعتماد المخرجات)' : 'Completed'}</option>
            </select>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatMetric label={lang === 'ar' ? 'الإيراد المعتمد' : 'Approved Revenue'} value={formatEGP(cm.revenuePiasters, lang)} />
        <StatMetric label={lang === 'ar' ? 'التكاليف المباشرة الفعلية' : 'Actual Direct Costs'} value={formatEGP(cm.directCostsPiasters, lang)} />
        <StatMetric
          label={lang === 'ar' ? 'هامش المساهمة (Contribution Margin)' : 'Contribution Margin'}
          value={formatEGP(cm.contributionMarginPiasters, lang)}
          meta={`${cm.marginPercent}%`}
          tone="success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Panel
          title={lang === 'ar' ? 'بوابة اعتماد المخرجات الإلزامية' : 'Mandatory Deliverables Approval Gate'}
          subtitle={lang === 'ar' ? 'لا يكتمل المشروع قبل اعتماد كافة المخرجات الإلزامية' : 'All mandatory deliverables must be approved before closing'}
        >
          <div className="space-y-2.5">
            {project.deliverables.map((del) => (
              <div key={del.id} className="p-3 rounded-lg border border-[#E4E7EC] dark:border-[#293548] flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`w-4 h-4 ${del.approved ? 'text-[#16A34A]' : 'text-[#9CA3AF]'}`} />
                  <span className="font-medium">{del.title}</span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleDeliverableApproval(project.id, del.id)}
                  className={`px-2.5 py-1 rounded font-semibold ${
                    del.approved ? 'bg-emerald-50 text-[#16A34A]' : 'bg-[#2563EB] text-white'
                  }`}
                >
                  {del.approved ? (lang === 'ar' ? 'معتمد' : 'Approved') : lang === 'ar' ? 'اعتماد المخرج' : 'Approve'}
                </button>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title={lang === 'ar' ? `مهام المشروع (${projectTasks.length})` : `Project Tasks (${projectTasks.length})`}>
          <div className="divide-y divide-[#E4E7EC] dark:divide-[#293548] text-xs">
            {projectTasks.map((tk) => (
              <div key={tk.id} className="py-2.5 flex items-center justify-between gap-2">
                <span>{tk.title}</span>
                <div className="flex items-center gap-2">
                  <StatusIndicator status={tk.status} />
                  {tk.status !== 'completed' && (
                    <button
                      type="button"
                      onClick={() => updateTaskStatus(tk.id, 'completed')}
                      className="text-[#2563EB] font-semibold hover:underline"
                    >
                      {lang === 'ar' ? 'إنهاء' : 'Done'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
