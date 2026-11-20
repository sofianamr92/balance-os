import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Lock, Plus, ShieldCheck } from 'lucide-react';
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
import { formatEGP } from '../utils/accounting';
import { canViewConfidentialPayroll, maskEmployeePII, ROLE_LABELS } from '../utils/rbac';
import type { LeaveRequest } from '../types/os';

export function HrPage() {
  const {
    data,
    lang,
    currentUser,
    activeBranchId,
    checkInAttendance,
    createLeaveRequest,
    decideLeaveRequest,
    approvePayrollRun,
  } = useOS();

  const [tab, setTab] = useState<'employees' | 'attendance' | 'leaves' | 'payroll'>('employees');
  const [leaveModal, setLeaveModal] = useState(false);
  const [leaveType, setLeaveType] = useState<LeaveRequest['leaveType']>('annual');
  const [startDate, setStartDate] = useState('2026-11-28');
  const [endDate, setEndDate] = useState('2026-11-29');
  const [reason, setReason] = useState('');

  const canSeePayroll = canViewConfidentialPayroll(currentUser);

  const visibleEmployees = useMemo(
    () => data.employees.map((emp) => maskEmployeePII(emp, currentUser)),
    [currentUser, data.employees]
  );

  const deptHeadcount = useMemo(() => {
    return data.departments.slice(0, 7).map((d) => ({
      name: lang === 'ar' ? d.name.replace(/^(?:الإدارة|إدارة)\s+/, '').split(' ')[0] : d.nameEn.split(' ')[0],
      count: data.employees.filter((e) => e.departmentIds.includes(d.id)).length,
    }));
  }, [data.departments, data.employees, lang]);

  const handleCreateLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    const branchId = activeBranchId === 'all' ? currentUser?.branchIds[0] ?? 'br-cairo' : activeBranchId;
    await createLeaveRequest({
      branchId,
      leaveType,
      startDate,
      endDate,
      reason: reason.trim() || 'طلب إجازة',
    });
    setLeaveModal(false);
    setReason('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={lang === 'ar' ? 'الموارد البشرية والعمل الهجين والرواتب' : 'Human Resources, Hybrid Ops & Payroll'}
        description={
          lang === 'ar'
            ? 'دليل الموظفين مع حماية البيانات الشخصية (PII Masking)، الحضور الهجين، الإجازات (SoD)، ومسيرات الرواتب المقيدة.'
            : 'Employee directory with PII masking, hybrid attendance, SoD leaves, and role-restricted payroll.'
        }
        actions={
          <button type="button" onClick={() => setLeaveModal(true)} className={btnPrimaryCls}>
            <Plus className="w-4 h-4" />
            <span>{lang === 'ar' ? 'طلب إجازة' : 'Request Leave'}</span>
          </button>
        }
      />

      {/* HR Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatMetric label={lang === 'ar' ? 'إجمالي الفريق النشط' : 'Active Workforce'} value={String(data.employees.length)} tone="info" />
        <StatMetric label={lang === 'ar' ? 'العمل عن بُعد / الهجين' : 'Hybrid & Remote'} value={String(data.employees.filter((e) => e.workModel !== 'office').length)} tone="success" />
        <StatMetric label={lang === 'ar' ? 'طلبات إجازة معلقة' : 'Pending Leaves'} value={String(data.leaveRequests.filter((l) => l.status === 'pending').length)} tone="warning" />
        <StatMetric
          label={lang === 'ar' ? 'صلاحية كشف الرواتب' : 'Payroll Access'}
          value={canSeePayroll ? (lang === 'ar' ? 'مصرح' : 'Authorized') : lang === 'ar' ? 'محجوب' : 'Masked'}
          tone={canSeePayroll ? 'success' : 'neutral'}
        />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: 'employees', ar: 'الموظفون والأداء', en: 'Directory & Output' },
            { id: 'attendance', ar: 'الحضور الهجين', en: 'Hybrid Attendance' },
            { id: 'leaves', ar: 'الإجازات (SoD)', en: 'Leaves (SoD)' },
            { id: 'payroll', ar: 'الرواتب (مقيد)', en: 'Payroll (Restricted)' },
          ] as const
        ).map((tb) => (
          <button
            type="button"
            key={tb.id}
            onClick={() => setTab(tb.id)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg border ${
              tab === tb.id
                ? 'bg-[#2563EB] text-white border-[#2563EB]'
                : 'bg-white dark:bg-[#111827] border-[#E4E7EC] dark:border-[#293548]'
            }`}
          >
            {tb[lang]}
          </button>
        ))}
      </div>

      {tab === 'employees' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <Panel className="lg:col-span-8" title={lang === 'ar' ? 'دليل الفريق (مع تطبيق حجب PII)' : 'Team Directory (PII Masking Active)'}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#E4E7EC] dark:border-[#293548] text-[#667085]">
                    <th className="py-2 text-start">{lang === 'ar' ? 'الاسم' : 'Name'}</th>
                    <th className="py-2 text-start">{lang === 'ar' ? 'الدور' : 'Role'}</th>
                    <th className="py-2 text-start">{lang === 'ar' ? 'نظام العمل' : 'Model'}</th>
                    <th className="py-2 text-start">{lang === 'ar' ? 'تقييم المخرجات' : 'Output Score'}</th>
                    <th className="py-2 text-start">{lang === 'ar' ? 'الراتب (مقيد)' : 'Salary (Masked)'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E7EC] dark:divide-[#293548]">
                  {visibleEmployees.map((emp) => (
                    <tr key={emp.uid}>
                      <td className="py-2.5 font-semibold">{lang === 'ar' ? emp.fullName : (emp.fullNameEn ?? emp.fullName)}</td>
                      <td className="py-2.5">{ROLE_LABELS[emp.role]?.[lang] ?? emp.role}</td>
                      <td className="py-2.5">{emp.workModel}</td>
                      <td className="py-2.5 tabular-nums font-semibold">{emp.performanceScore ?? 90}/100</td>
                      <td className="py-2.5 tabular-nums">
                        {emp.monthlySalaryPiasters !== undefined ? (
                          formatEGP(emp.monthlySalaryPiasters, lang)
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[#667085]">
                            <Lock className="w-3 h-3" /> {lang === 'ar' ? 'محجوب' : 'Masked'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel className="lg:col-span-4" title={lang === 'ar' ? 'توزيع الفريق حسب الإدارات' : 'Headcount by Department'}>
            <div className="h-60 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptHeadcount}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#667085' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#667085' }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563EB" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      )}

      {tab === 'attendance' && (
        <Panel
          title={lang === 'ar' ? 'سجل الحضور الهجين' : 'Hybrid Attendance Log'}
          action={
            <div className="flex gap-2">
              <button type="button" onClick={() => checkInAttendance('office', 'تسجيل مكتبي')} className={btnSecondaryCls}>
                {lang === 'ar' ? 'حضور مكتبي' : 'Check In Office'}
              </button>
              <button type="button" onClick={() => checkInAttendance('remote', 'عمل عن بُعد')} className={btnPrimaryCls}>
                {lang === 'ar' ? 'حضور عن بُعد' : 'Check In Remote'}
              </button>
            </div>
          }
        >
          <div className="divide-y divide-[#E4E7EC] dark:divide-[#293548] text-xs">
            {data.attendanceRecords.map((rec) => {
              const emp = data.employees.find((e) => e.uid === rec.employeeUid);
              return (
                <div key={rec.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-semibold">{emp?.fullName ?? rec.employeeUid}</span>
                    <span className="mx-2 text-[#667085]">· {rec.workMode}</span>
                    {rec.notes && <span className="text-[#667085]">({rec.notes})</span>}
                  </div>
                  <span className="tabular-nums font-bold">{rec.date} · {rec.checkInTime}</span>
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      {tab === 'leaves' && (
        <Panel title={lang === 'ar' ? 'طلبات الإجازات' : 'Leave Requests'}>
          <div className="space-y-3">
            {data.leaveRequests.map((lv) => {
              const emp = data.employees.find((e) => e.uid === lv.employeeUid);
              return (
                <div key={lv.id} className="p-3.5 rounded-xl border border-[#E4E7EC] dark:border-[#293548] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <div className="font-bold text-sm">{emp?.fullName ?? lv.employeeUid} — {lv.leaveType}</div>
                    <div className="text-[#667085] mt-0.5 tabular-nums">{lv.startDate} → {lv.endDate} · {lv.reason}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusIndicator status={lv.status} />
                    {lv.status === 'pending' && (
                      <>
                        <button type="button" onClick={() => decideLeaveRequest(lv.id, 'approved')} className="px-2.5 py-1 bg-[#16A34A] text-white rounded font-semibold">
                          {lang === 'ar' ? 'اعتماد' : 'Approve'}
                        </button>
                        <button type="button" onClick={() => decideLeaveRequest(lv.id, 'rejected')} className="px-2.5 py-1 bg-[#DC2626] text-white rounded font-semibold">
                          {lang === 'ar' ? 'رفض' : 'Reject'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      {tab === 'payroll' && (
        <Panel title={lang === 'ar' ? 'مسيرات الرواتب (بيانات سرية مقيدة)' : 'Confidential Payroll Runs'}>
          {!canSeePayroll ? (
            <div className="p-6 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 text-xs flex items-center gap-3">
              <Lock className="w-5 h-5 text-[#D97706] shrink-0" />
              <div>
                <div className="font-bold text-sm">{lang === 'ar' ? 'تم حجب مسيرات الرواتب وفق صلاحية دورك' : 'Access Restricted by RBAC Policy'}</div>
                <div className="text-[#667085] mt-0.5">
                  {lang === 'ar' ? 'الاطلاع متاح فقط للرئيس التنفيذي، المدير العام، مدير الموارد البشرية، والمحاسب.' : 'Accessible only to CEO, GM, HR Manager, and Accountant.'}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {data.payrollRuns.map((pr) => (
                <div key={pr.id} className="p-4 rounded-xl border border-[#E4E7EC] dark:border-[#293548] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="text-sm font-bold">{pr.periodLabel}</div>
                    <div className="text-[#667085] mt-0.5 tabular-nums">
                      {pr.employeeCount} {lang === 'ar' ? 'موظف' : 'employees'} · {lang === 'ar' ? 'الصافي:' : 'Net:'} {formatEGP(pr.totalNetPiasters, lang)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusIndicator status={pr.status} />
                    {pr.status === 'draft' && (
                      <button type="button" onClick={() => approvePayrollRun(pr.id)} className={btnPrimaryCls}>
                        <ShieldCheck className="w-4 h-4" />
                        <span>{lang === 'ar' ? 'اعتماد المسير' : 'Approve Payroll'}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      <Modal open={leaveModal} onClose={() => setLeaveModal(false)} title={lang === 'ar' ? 'تقديم طلب إجازة' : 'Request Leave'}>
        <form onSubmit={handleCreateLeave} className="space-y-3">
          <select value={leaveType} onChange={(e) => setLeaveType(e.target.value as LeaveRequest['leaveType'])} className={inputCls}>
            <option value="annual">{lang === 'ar' ? 'سنوية' : 'Annual'}</option>
            <option value="sick">{lang === 'ar' ? 'مرضية' : 'Sick'}</option>
            <option value="emergency">{lang === 'ar' ? 'عارضة' : 'Emergency'}</option>
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />
          </div>
          <input required placeholder={lang === 'ar' ? 'سبب الإجازة' : 'Reason'} value={reason} onChange={(e) => setReason(e.target.value)} className={inputCls} />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setLeaveModal(false)} className={btnSecondaryCls}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
            <button type="submit" className={btnPrimaryCls}>{lang === 'ar' ? 'تقديم الطلب' : 'Submit'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
