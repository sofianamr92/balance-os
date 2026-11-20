import React, { useEffect, useState } from 'react';
import { Building2, GitBranch, Plus, Shield, UserPlus, Users } from 'lucide-react';
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
import { DEFAULT_ROLE_MATRIX, ROLE_LABELS } from '../utils/rbac';
import type { RoleId } from '../types/os';

export function CompanyPage({
  defaultTab = 'overview',
}: {
  defaultTab?: 'overview' | 'branches' | 'departments' | 'org' | 'rbac';
}) {
  const {
    data,
    lang,
    updateCompany,
    createBranch,
    createDepartment,
    inviteEmployee,
    updateEmployeeRole,
    invitations,
  } = useOS();

  const [tab, setTab] = useState<'overview' | 'branches' | 'departments' | 'org' | 'rbac'>(defaultTab);
  useEffect(() => {
    setTab(defaultTab);
  }, [defaultTab]);
  const [companyName, setCompanyName] = useState(data.company.name);
  const [legalName, setLegalName] = useState(data.company.legalName);
  const [taxId, setTaxId] = useState(data.company.taxId);
  const [address, setAddress] = useState(data.company.address);

  const [branchModal, setBranchModal] = useState(false);
  const [brCode, setBrCode] = useState('');
  const [brName, setBrName] = useState('');
  const [brNameEn, setBrNameEn] = useState('');
  const [brAddress, setBrAddress] = useState('');
  const [brBudget, setBrBudget] = useState('350000');

  const [deptModal, setDeptModal] = useState(false);
  const [dpCode, setDpCode] = useState('');
  const [dpName, setDpName] = useState('');
  const [dpNameEn, setDpNameEn] = useState('');
  const [dpBudget, setDpBudget] = useState('150000');

  const [inviteModal, setInviteModal] = useState(false);
  const [invEmail, setInvEmail] = useState('');
  const [invName, setInvName] = useState('');
  const [invRole, setInvRole] = useState<RoleId>('employee');

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateCompany({ name: companyName, legalName, taxId, address });
  };

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    await createBranch({
      code: brCode || `BR-${data.branches.length + 1}`,
      name: brName,
      nameEn: brNameEn || brName,
      address: brAddress,
      phone: '01000000000',
      email: 'branch@balance.agency',
      managerUid: data.employees[0]?.uid ?? 'demo-ceo-01',
      status: 'active',
      operationalBudgetPiasters: toPiasters(Number(brBudget) || 0),
    });
    setBranchModal(false);
    setBrName('');
    setBrCode('');
  };

  const handleAddDept = async (e: React.FormEvent) => {
    e.preventDefault();
    await createDepartment({
      code: dpCode || `D-${data.departments.length + 1}`,
      name: dpName,
      nameEn: dpNameEn || dpName,
      managerUid: data.employees[0]?.uid ?? 'demo-ceo-01',
      budgetPiasters: toPiasters(Number(dpBudget) || 0),
    });
    setDeptModal(false);
    setDpName('');
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    await inviteEmployee({
      email: invEmail,
      fullName: invName,
      role: invRole,
      branchIds: [data.branches[0]?.id ?? 'br-cairo'],
      departmentIds: [data.departments[0]?.id ?? 'dept-mgmt'],
    });
    setInviteModal(false);
    setInvEmail('');
    setInvName('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={lang === 'ar' ? 'إدارة الشركة والهيكل التنظيمي' : 'Company & Governance'}
        description={
          lang === 'ar'
            ? 'ملف الشركة، الفروع، الإدارات العشر، الفرق، الهيكل التنظيمي، ومصفوفة الصلاحيات.'
            : 'Company profile, branches, 10 departments, teams, org chart, and RBAC matrix.'
        }
        actions={
          <button type="button" onClick={() => setInviteModal(true)} className={btnPrimaryCls}>
            <UserPlus className="w-4 h-4" />
            <span>{lang === 'ar' ? 'دعوة مستخدم (RBAC)' : 'Invite User'}</span>
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#E4E7EC] dark:border-[#293548] pb-3">
        {(
          [
            { id: 'overview', ar: 'ملف الشركة', en: 'Company Profile', icon: Building2 },
            { id: 'branches', ar: 'الفروع', en: 'Branches', icon: GitBranch },
            { id: 'departments', ar: 'الإدارات والفرق', en: 'Departments & Teams', icon: Users },
            { id: 'org', ar: 'الهيكل التنظيمي', en: 'Org Chart', icon: GitBranch },
            { id: 'rbac', ar: 'الأدوار والصلاحيات', en: 'RBAC & Invites', icon: Shield },
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
                  : 'bg-white dark:bg-[#111827] border-[#E4E7EC] dark:border-[#293548] hover:bg-[#EEF2F6] dark:hover:bg-[#182235]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tb[lang]}</span>
            </button>
          );
        })}
      </div>

      {tab === 'overview' && (
        <Panel title={lang === 'ar' ? 'البيانات القانونية والتشغيلية' : 'Legal & Operational Profile'}>
          <form onSubmit={handleSaveCompany} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">{lang === 'ar' ? 'اسم الشركة' : 'Company Name'}</label>
              <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{lang === 'ar' ? 'الاسم القانوني' : 'Legal Name'}</label>
              <input value={legalName} onChange={(e) => setLegalName(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{lang === 'ar' ? 'الرقم الضريبي' : 'Tax ID'}</label>
              <input value={taxId} onChange={(e) => setTaxId(e.target.value)} className={`${inputCls} tabular-nums`} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{lang === 'ar' ? 'العنوان الرئيسي' : 'Headquarters Address'}</label>
              <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputCls} />
            </div>
            <div className="md:col-span-2 flex items-center justify-between pt-2">
              <span className="text-xs text-[#667085]">
                {lang === 'ar' ? 'العملة الأساسية: EGP · المنطقة الزمنية: Africa/Cairo' : 'Base Currency: EGP · Timezone: Africa/Cairo'}
              </span>
              <button type="submit" className={btnPrimaryCls}>
                {lang === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Panel>
      )}

      {tab === 'branches' && (
        <Panel
          title={lang === 'ar' ? 'فروع الوكالة' : 'Agency Branches'}
          action={
            <button type="button" onClick={() => setBranchModal(true)} className={btnSecondaryCls}>
              <Plus className="w-4 h-4" />
              <span>{lang === 'ar' ? 'فرع جديد' : 'Add Branch'}</span>
            </button>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.branches.map((br) => {
              const mgr = data.employees.find((e) => e.uid === br.managerUid);
              return (
                <div key={br.id} className="p-4 rounded-xl border border-[#E4E7EC] dark:border-[#293548] bg-[#F7F9FC]/60 dark:bg-[#0B1220]">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-mono text-[#2563EB]">{br.code}</div>
                      <div className="text-base font-bold mt-0.5">{lang === 'ar' ? br.name : br.nameEn}</div>
                    </div>
                    <StatusIndicator status={br.status} />
                  </div>
                  <div className="mt-3 space-y-1 text-xs text-[#667085] dark:text-[#9CA3AF]">
                    <div>{br.address}</div>
                    <div>{lang === 'ar' ? 'مدير الفرع:' : 'Manager:'} {mgr?.fullName ?? br.managerUid}</div>
                    <div className="font-semibold text-[#101828] dark:text-[#F9FAFB] tabular-nums">
                      {lang === 'ar' ? 'الميزانية التشغيلية:' : 'Budget:'} {formatEGP(br.operationalBudgetPiasters, lang)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      {tab === 'departments' && (
        <div className="space-y-5">
          <Panel
            title={lang === 'ar' ? 'الإدارات الرئيسية (10 إدارات)' : 'Departments (10 Core Divisions)'}
            action={
              <button type="button" onClick={() => setDeptModal(true)} className={btnSecondaryCls}>
                <Plus className="w-4 h-4" />
                <span>{lang === 'ar' ? 'إضافة إدارة' : 'Add Department'}</span>
              </button>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#E4E7EC] dark:border-[#293548] text-[#667085]">
                    <th className="py-2 text-start">{lang === 'ar' ? 'الرمز' : 'Code'}</th>
                    <th className="py-2 text-start">{lang === 'ar' ? 'الإدارة' : 'Department'}</th>
                    <th className="py-2 text-start">{lang === 'ar' ? 'المدير' : 'Manager'}</th>
                    <th className="py-2 text-start">{lang === 'ar' ? 'الميزانية الشهرية' : 'Budget'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E7EC] dark:divide-[#293548]">
                  {data.departments.map((d) => {
                    const mgr = data.employees.find((e) => e.uid === d.managerUid);
                    return (
                      <tr key={d.id}>
                        <td className="py-2.5 font-mono text-[#2563EB]">{d.code}</td>
                        <td className="py-2.5 font-semibold">{lang === 'ar' ? d.name : d.nameEn}</td>
                        <td className="py-2.5">{mgr?.fullName ?? d.managerUid}</td>
                        <td className="py-2.5 tabular-nums font-medium">{formatEGP(d.budgetPiasters, lang)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title={lang === 'ar' ? 'فرق العمل المتخصصة' : 'Operational Squads & Teams'}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.teams.map((tm) => (
                <div key={tm.id} className="p-4 rounded-xl border border-[#E4E7EC] dark:border-[#293548]">
                  <div className="font-bold text-sm">{lang === 'ar' ? tm.name : tm.nameEn}</div>
                  <div className="text-xs text-[#667085] mt-1">
                    {lang === 'ar' ? 'الأعضاء:' : 'Members:'} {tm.memberIds.length}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {tab === 'org' && (
        <Panel
          title={lang === 'ar' ? 'الهيكل التنظيمي التفاعلي لـ BALANCE Agency' : 'BALANCE Agency Organizational Hierarchy'}
          subtitle={lang === 'ar' ? 'من المؤسس والإدارة العامة إلى الإدارات التنفيذية العشر' : 'CEO -> General Management -> 10 Operational Departments'}
        >
          <div className="flex flex-col items-center space-y-6 py-4">
            <div className="px-6 py-3 rounded-xl bg-[#101828] text-white text-center shadow">
              <div className="text-xs text-slate-300">CEO / Founder</div>
              <div className="font-bold text-sm mt-0.5">سفيان عمرو — Sofian Amr</div>
            </div>
            <div className="w-0.5 h-6 bg-[#CBD5E1] dark:bg-[#293548]" />
            <div className="px-6 py-3 rounded-xl bg-[#E0F2FE] dark:bg-[#1E3A8A]/40 border border-[#BAE6FD] dark:border-[#2563EB]/40 text-center">
              <div className="text-xs text-[#0284C7] dark:text-sky-300 font-semibold">General Management</div>
              <div className="font-bold text-sm mt-0.5">الإدارة العامة وتشغيل الفروع</div>
            </div>
            <div className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-4 border-t border-[#E4E7EC] dark:border-[#293548]">
              {data.departments.map((d) => {
                const mgr = data.employees.find((e) => e.uid === d.managerUid);
                return (
                  <div
                    key={d.id}
                    className="p-3 rounded-xl bg-[#F7F9FC] dark:bg-[#0B1220] border border-[#E4E7EC] dark:border-[#293548] text-center"
                  >
                    <div className="text-[11px] font-mono text-[#2563EB]">{d.code}</div>
                    <div className="text-xs font-bold mt-1">{lang === 'ar' ? d.name : d.nameEn}</div>
                    <div className="text-[11px] text-[#667085] mt-1">{mgr?.fullName ?? '—'}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </Panel>
      )}

      {tab === 'rbac' && (
        <div className="space-y-5">
          <Panel title={lang === 'ar' ? 'إدارة أدوار المستخدمين' : 'User Roles & Access Control'}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#E4E7EC] dark:border-[#293548] text-[#667085]">
                    <th className="py-2 text-start">{lang === 'ar' ? 'الموظف' : 'Member'}</th>
                    <th className="py-2 text-start">{lang === 'ar' ? 'البريد' : 'Email'}</th>
                    <th className="py-2 text-start">{lang === 'ar' ? 'الدور الحالي' : 'Role'}</th>
                    <th className="py-2 text-start">{lang === 'ar' ? 'تغيير الصلاحية' : 'Assign Role'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E7EC] dark:divide-[#293548]">
                  {data.employees.map((emp) => (
                    <tr key={emp.uid}>
                      <td className="py-2.5 font-semibold">{emp.fullName}</td>
                      <td className="py-2.5 text-[#667085]">{emp.email}</td>
                      <td className="py-2.5">{ROLE_LABELS[emp.role]?.[lang] ?? emp.role}</td>
                      <td className="py-2.5">
                        <select
                          aria-label={`Role for ${emp.fullName}`}
                          value={emp.role}
                          onChange={(e) => updateEmployeeRole(emp.uid, e.target.value as RoleId)}
                          className="px-2 py-1 text-xs bg-white dark:bg-[#0B1220] border border-[#E4E7EC] dark:border-[#293548] rounded"
                        >
                          {(Object.keys(ROLE_LABELS) as RoleId[]).map((r) => (
                            <option key={r} value={r}>
                              {ROLE_LABELS[r][lang]}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title={lang === 'ar' ? 'سجل الدعوات المعتمدة' : 'RBAC Invitations Log'}>
            {invitations.length === 0 ? (
              <p className="text-xs text-[#667085]">{lang === 'ar' ? 'لا توجد دعوات معلقة حالياً.' : 'No pending invitations.'}</p>
            ) : (
              <div className="space-y-2 text-xs">
                {invitations.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between p-2.5 rounded border border-[#E4E7EC] dark:border-[#293548]">
                    <span>{inv.fullName} ({inv.email}) — {ROLE_LABELS[inv.role]?.[lang]}</span>
                    <StatusIndicator status={inv.status} />
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title={lang === 'ar' ? 'ملخص مصفوفة الصلاحيات (17 دوراً)' : 'Default Role Matrix Summary'}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {(Object.keys(DEFAULT_ROLE_MATRIX) as RoleId[]).slice(0, 9).map((r) => (
                <div key={r} className="p-3 rounded-lg border border-[#E4E7EC] dark:border-[#293548]">
                  <div className="font-bold">{ROLE_LABELS[r][lang]}</div>
                  <div className="text-[#667085] mt-1">
                    {Object.keys(DEFAULT_ROLE_MATRIX[r]).length} {lang === 'ar' ? 'وحدات مصرح بها' : 'authorized modules'}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {/* Modals */}
      <Modal open={branchModal} onClose={() => setBranchModal(false)} title={lang === 'ar' ? 'إضافة فرع جديد' : 'Add Branch'}>
        <form onSubmit={handleAddBranch} className="space-y-3">
          <input required placeholder={lang === 'ar' ? 'اسم الفرع بالعربية' : 'Branch Name (AR)'} value={brName} onChange={(e) => setBrName(e.target.value)} className={inputCls} />
          <input placeholder={lang === 'ar' ? 'اسم الفرع بالإنجليزية' : 'Branch Name (EN)'} value={brNameEn} onChange={(e) => setBrNameEn(e.target.value)} className={inputCls} />
          <input placeholder={lang === 'ar' ? 'الكود (مثلاً: GIZ-03)' : 'Code'} value={brCode} onChange={(e) => setBrCode(e.target.value)} className={inputCls} />
          <input required placeholder={lang === 'ar' ? 'العنوان' : 'Address'} value={brAddress} onChange={(e) => setBrAddress(e.target.value)} className={inputCls} />
          <input type="number" placeholder="Budget EGP" value={brBudget} onChange={(e) => setBrBudget(e.target.value)} className={inputCls} />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setBranchModal(false)} className={btnSecondaryCls}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
            <button type="submit" className={btnPrimaryCls}>{lang === 'ar' ? 'حفظ' : 'Save'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={deptModal} onClose={() => setDeptModal(false)} title={lang === 'ar' ? 'إضافة إدارة جديدة' : 'Add Department'}>
        <form onSubmit={handleAddDept} className="space-y-3">
          <input required placeholder={lang === 'ar' ? 'اسم الإدارة' : 'Department Name'} value={dpName} onChange={(e) => setDpName(e.target.value)} className={inputCls} />
          <input placeholder={lang === 'ar' ? 'الاسم بالإنجليزية' : 'English Name'} value={dpNameEn} onChange={(e) => setDpNameEn(e.target.value)} className={inputCls} />
          <input placeholder={lang === 'ar' ? 'الكود' : 'Code'} value={dpCode} onChange={(e) => setDpCode(e.target.value)} className={inputCls} />
          <input type="number" placeholder="Budget EGP" value={dpBudget} onChange={(e) => setDpBudget(e.target.value)} className={inputCls} />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setDeptModal(false)} className={btnSecondaryCls}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
            <button type="submit" className={btnPrimaryCls}>{lang === 'ar' ? 'حفظ' : 'Save'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={inviteModal} onClose={() => setInviteModal(false)} title={lang === 'ar' ? 'دعوة عضو فريق بنظام الصلاحيات' : 'Invite Team Member'}>
        <form onSubmit={handleInvite} className="space-y-3">
          <input required type="email" placeholder="user@balance.agency" value={invEmail} onChange={(e) => setInvEmail(e.target.value)} className={inputCls} />
          <input required placeholder={lang === 'ar' ? 'الاسم الكامل' : 'Full Name'} value={invName} onChange={(e) => setInvName(e.target.value)} className={inputCls} />
          <select value={invRole} onChange={(e) => setInvRole(e.target.value as RoleId)} className={inputCls}>
            {(Object.keys(ROLE_LABELS) as RoleId[]).map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r][lang]}</option>
            ))}
          </select>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setInviteModal(false)} className={btnSecondaryCls}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
            <button type="submit" className={btnPrimaryCls}>{lang === 'ar' ? 'إرسال الدعوة' : 'Send Invite'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
