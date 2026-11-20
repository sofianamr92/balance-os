import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckSquare, ShieldAlert, Bell } from 'lucide-react';
import { useOS } from '../context/OSContext';
import {
  PageHeader,
  Panel,
  StatusIndicator,
  EmptyState,
  btnPrimaryCls,
  btnSecondaryCls,
} from '../components/common/UIPrimitives';
import { formatEGP } from '../utils/accounting';

export function WorkspacePage() {
  const {
    data,
    lang,
    currentUser,
    checkInAttendance,
    updateTaskStatus,
    decideApproval,
    markNotificationRead,
  } = useOS();
  const navigate = useNavigate();
  const [workMode, setWorkMode] = useState<'office' | 'remote' | 'external_shoot'>('hybrid' as never);
  const [attMode, setAttMode] = useState<'office' | 'remote' | 'external_shoot'>('office');
  const [attNotes, setAttNotes] = useState('');

  void workMode;
  void setWorkMode;

  const myTasks = useMemo(
    () =>
      data.tasks.filter(
        (t) =>
          t.assigneeUid === currentUser?.uid ||
          currentUser?.role === 'ceo' ||
          currentUser?.role === 'general_manager'
      ),
    [currentUser?.role, currentUser?.uid, data.tasks]
  );

  const pendingApprovals = useMemo(
    () => data.approvals.filter((a) => a.status === 'pending'),
    [data.approvals]
  );

  const myTodayAttendance = useMemo(
    () => data.attendanceRecords.filter((a) => a.employeeUid === currentUser?.uid),
    [currentUser?.uid, data.attendanceRecords]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={lang === 'ar' ? 'مساحة عملي الشخصية' : 'My Workspace'}
        description={
          lang === 'ar'
            ? 'متابعة المهام المسندة إليك، تسجيل الحضور الهجين، ومراجعة طلبات الاعتماد.'
            : 'Manage assigned tasks, hybrid attendance check-in, and pending approvals.'
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Quick Hybrid Attendance */}
        <Panel
          className="lg:col-span-4"
          title={lang === 'ar' ? 'تسجيل الحضور الهجين' : 'Hybrid Attendance Check-in'}
          subtitle={lang === 'ar' ? 'مكتبي · عن بُعد · موقع تصوير خارجي' : 'Office · Remote · External Shoot'}
        >
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'office', ar: 'مكتبي', en: 'Office' },
                  { id: 'remote', ar: 'عن بُعد', en: 'Remote' },
                  { id: 'external_shoot', ar: 'تصوير خارجي', en: 'On-Set' },
                ] as const
              ).map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setAttMode(m.id)}
                  className={`py-2 px-2 text-xs font-semibold rounded-lg border ${
                    attMode === m.id
                      ? 'bg-[#2563EB] text-white border-[#2563EB]'
                      : 'bg-[#F7F9FC] dark:bg-[#0B1220] border-[#E4E7EC] dark:border-[#293548]'
                  }`}
                >
                  {m[lang]}
                </button>
              ))}
            </div>
            <input
              value={attNotes}
              onChange={(e) => setAttNotes(e.target.value)}
              placeholder={lang === 'ar' ? 'ملاحظة اليوم (اختياري)...' : 'Today work note (optional)...'}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-[#0B1220] border border-[#E4E7EC] dark:border-[#293548] rounded-lg"
            />
            <button
              type="button"
              onClick={() => {
                checkInAttendance(attMode, attNotes);
                setAttNotes('');
              }}
              className={`${btnPrimaryCls} w-full`}
            >
              <Clock className="w-4 h-4" />
              <span>{lang === 'ar' ? 'تسجيل الحضور الآن' : 'Check In Now'}</span>
            </button>

            <div className="pt-2 border-t border-[#E4E7EC] dark:border-[#293548] space-y-2">
              <div className="text-xs font-semibold text-[#667085]">
                {lang === 'ar' ? 'أحدث السجلات' : 'Recent Check-ins'}
              </div>
              {myTodayAttendance.slice(0, 3).map((rec) => (
                <div key={rec.id} className="flex items-center justify-between text-xs py-1">
                  <span>{rec.date} · {rec.workMode}</span>
                  <span className="font-semibold tabular-nums">{rec.checkInTime}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        {/* Approvals Inbox */}
        <Panel
          className="lg:col-span-8"
          title={lang === 'ar' ? 'صندوق الاعتمادات (فصل المهام SoD)' : 'Approvals Inbox (SoD Enforced)'}
          subtitle={lang === 'ar' ? 'يُمنع قانونياً ونظامياً اعتماد طلب أنشأته بنفسك' : 'Requester cannot self-approve'}
        >
          {pendingApprovals.length === 0 ? (
            <EmptyState
              title={lang === 'ar' ? 'لا توجد طلبات اعتماد معلقة' : 'No pending approvals'}
              description={lang === 'ar' ? 'تمت معالجة جميع طلبات الاعتماد الحالية.' : 'All pending approvals are resolved.'}
            />
          ) : (
            <div className="space-y-3">
              {pendingApprovals.map((app) => {
                const isSelf = app.requesterUid === currentUser?.uid;
                const requester = data.employees.find((e) => e.uid === app.requesterUid);
                return (
                  <div
                    key={app.id}
                    className="p-3.5 rounded-lg border border-[#E4E7EC] dark:border-[#293548] bg-[#F7F9FC]/70 dark:bg-[#0B1220] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-sm font-semibold">{app.title}</div>
                      <div className="text-xs text-[#667085] mt-0.5 flex flex-wrap items-center gap-3">
                        <span>{lang === 'ar' ? 'الطالب:' : 'Requester:'} {requester?.fullName ?? app.requesterUid}</span>
                        {app.amountPiasters !== undefined && (
                          <span className="font-semibold tabular-nums">{formatEGP(app.amountPiasters, lang)}</span>
                        )}
                        {isSelf && (
                          <span className="inline-flex items-center gap-1 text-[#D97706] font-medium">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            {lang === 'ar' ? 'طلبك الشخصي — يتطلب معتمد آخر' : 'Own request (SoD locked)'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => decideApproval(app.id, 'approved')}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#16A34A] text-white hover:opacity-90"
                      >
                        {lang === 'ar' ? 'اعتماد' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        onClick={() => decideApproval(app.id, 'rejected')}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#DC2626] text-white hover:opacity-90"
                      >
                        {lang === 'ar' ? 'رفض' : 'Reject'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>

      {/* My Tasks & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <Panel
          className="lg:col-span-7"
          title={lang === 'ar' ? 'مهامي النشطة' : 'My Tasks Queue'}
          action={
            <button type="button" onClick={() => navigate('/tasks')} className={btnSecondaryCls}>
              <CheckSquare className="w-4 h-4" />
              <span>{lang === 'ar' ? 'كل المهام' : 'All Tasks'}</span>
            </button>
          }
        >
          <div className="divide-y divide-[#E4E7EC] dark:divide-[#293548]">
            {myTasks.slice(0, 6).map((task) => (
              <div key={task.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-medium">{task.title}</div>
                  <div className="text-xs text-[#667085] mt-0.5 tabular-nums">
                    {lang === 'ar' ? 'الاستحقاق:' : 'Due:'} {task.dueDate}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusIndicator status={task.status} />
                  {task.status !== 'completed' && (
                    <button
                      type="button"
                      onClick={() => updateTaskStatus(task.id, 'completed')}
                      className="px-2.5 py-1 text-xs font-medium rounded border border-[#E4E7EC] dark:border-[#293548] hover:bg-[#EEF2F6] dark:hover:bg-[#182235]"
                    >
                      {lang === 'ar' ? 'إكمال' : 'Complete'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          className="lg:col-span-5"
          title={lang === 'ar' ? 'أحدث الإشعارات' : 'Notifications Feed'}
        >
          <div className="space-y-2.5">
            {data.notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3 rounded-lg border text-xs flex items-start justify-between gap-3 ${
                  n.read
                    ? 'border-[#E4E7EC] dark:border-[#293548] opacity-75'
                    : 'border-[#2563EB]/40 bg-blue-50/40 dark:bg-blue-950/20'
                }`}
              >
                <div className="flex items-start gap-2">
                  <Bell className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">{n.title}</div>
                    <div className="text-[#667085] dark:text-[#9CA3AF] mt-0.5">{n.body}</div>
                  </div>
                </div>
                {!n.read && (
                  <button
                    type="button"
                    onClick={() => markNotificationRead(n.id)}
                    className="text-[#2563EB] font-semibold whitespace-nowrap shrink-0"
                  >
                    {lang === 'ar' ? 'تحديد كمقروء' : 'Mark read'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
