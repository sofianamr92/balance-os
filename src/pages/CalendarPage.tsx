import React, { useMemo, useState } from 'react';
import { Calendar as CalIcon, Clapperboard, CheckSquare, Megaphone, Plane } from 'lucide-react';
import { useOS } from '../context/OSContext';
import { PageHeader, Panel, StatusIndicator } from '../components/common/UIPrimitives';

export function CalendarPage() {
  const { data, lang } = useOS();
  const [kindFilter, setKindFilter] = useState<'all' | 'task' | 'shoot' | 'marketing' | 'leave'>('all');

  const events = useMemo(() => {
    const out: Array<{
      id: string;
      date: string;
      kind: 'task' | 'shoot' | 'marketing' | 'leave';
      title: string;
      status: string;
      meta: string;
    }> = [];

    data.tasks.forEach((t) =>
      out.push({ id: `t-${t.id}`, date: t.dueDate, kind: 'task', title: t.title, status: t.status, meta: lang === 'ar' ? 'تسليم مهمة' : 'Task Due' })
    );
    data.shoots.forEach((s) =>
      out.push({ id: `s-${s.id}`, date: s.shootDate, kind: 'shoot', title: s.title, status: s.status, meta: `${s.startTime}–${s.endTime} · ${s.location}` })
    );
    data.marketingItems.forEach((m) =>
      out.push({ id: `m-${m.id}`, date: m.scheduledDate, kind: 'marketing', title: m.title, status: m.status, meta: m.platform })
    );
    data.leaveRequests.forEach((l) =>
      out.push({
        id: `l-${l.id}`,
        date: l.startDate,
        kind: 'leave',
        title: `${lang === 'ar' ? 'إجازة' : 'Leave'}: ${data.employees.find((e) => e.uid === l.employeeUid)?.fullName ?? l.employeeUid}`,
        status: l.status,
        meta: `${l.startDate} → ${l.endDate}`,
      })
    );

    return out
      .filter((e) => kindFilter === 'all' || e.kind === kindFilter)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [data.employees, data.leaveRequests, data.marketingItems, data.shoots, data.tasks, kindFilter, lang]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={lang === 'ar' ? 'التقويم التشغيلي الموحد' : 'Unified Agency Calendar'}
        description={
          lang === 'ar'
            ? 'عرض زمني موحد لمواعيد التسليم، أيام التصوير، نشر المحتوى التسويقي، والإجازات المعتمدة.'
            : 'Unified schedule of task deadlines, production shoots, marketing publishing, and leaves.'
        }
      />

      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: 'all', ar: 'الكل', en: 'All', icon: CalIcon },
            { id: 'shoot', ar: 'أيام التصوير', en: 'Shoots', icon: Clapperboard },
            { id: 'task', ar: 'المهام', en: 'Tasks', icon: CheckSquare },
            { id: 'marketing', ar: 'التسويق والمحتوى', en: 'Marketing', icon: Megaphone },
            { id: 'leave', ar: 'الإجازات', en: 'Leaves', icon: Plane },
          ] as const
        ).map((f) => {
          const Icon = f.icon;
          return (
            <button
              type="button"
              key={f.id}
              onClick={() => setKindFilter(f.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border ${
                kindFilter === f.id
                  ? 'bg-[#2563EB] text-white border-[#2563EB]'
                  : 'bg-white dark:bg-[#111827] border-[#E4E7EC] dark:border-[#293548]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{f[lang]}</span>
            </button>
          );
        })}
      </div>

      <Panel title={`${lang === 'ar' ? 'الجدول الزمني' : 'Timeline'} (${events.length})`}>
        <div className="divide-y divide-[#E4E7EC] dark:divide-[#293548]">
          {events.map((ev) => (
            <div key={ev.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-4">
                <div className="w-24 shrink-0 font-bold tabular-nums text-[#2563EB]">{ev.date}</div>
                <div>
                  <div className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">{ev.title}</div>
                  <div className="text-[#667085] mt-0.5">{ev.meta}</div>
                </div>
              </div>
              <StatusIndicator status={ev.status} />
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
