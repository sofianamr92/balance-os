import React from 'react';
import { CheckCircle2, AlertCircle, Clock, XCircle, CircleDot, X } from 'lucide-react';

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-[#E4E7EC] dark:border-[#293548]">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-[#101828] dark:text-[#F9FAFB] [text-wrap:balance]">
          {title}
        </h1>
        <p className="mt-1 text-sm text-[#667085] dark:text-[#9CA3AF]">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function Panel({
  title,
  subtitle,
  action,
  children,
  className = '',
}: {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`bg-white dark:bg-[#111827] border border-[#E4E7EC] dark:border-[#293548] rounded-xl p-5 ${className}`}
    >
      {(title || action) && (
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0">
            {title && (
              <h2 className="text-[16px] font-semibold text-[#101828] dark:text-[#F9FAFB] truncate">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs text-[#667085] dark:text-[#9CA3AF] mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatMetric({
  label,
  value,
  meta,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  meta?: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
}) {
  const toneText = {
    neutral: 'text-[#667085] dark:text-[#9CA3AF]',
    success: 'text-[#16A34A] dark:text-emerald-400',
    warning: 'text-[#D97706] dark:text-amber-400',
    danger: 'text-[#DC2626] dark:text-red-400',
    info: 'text-[#0284C7] dark:text-sky-400',
  }[tone];

  return (
    <div className="bg-white dark:bg-[#111827] border border-[#E4E7EC] dark:border-[#293548] rounded-xl p-4">
      <div className="text-xs font-medium text-[#667085] dark:text-[#9CA3AF]">{label}</div>
      <div className="mt-2 text-2xl font-bold text-[#101828] dark:text-[#F9FAFB] tabular-nums">
        {value}
      </div>
      {meta && <div className={`mt-1.5 text-xs font-medium ${toneText}`}>{meta}</div>}
    </div>
  );
}

const STATUS_STYLE_MAP: Record<
  string,
  { tone: 'success' | 'warning' | 'danger' | 'info' | 'neutral'; icon: 'check' | 'warn' | 'err' | 'clock' | 'dot' }
> = {
  active: { tone: 'success', icon: 'check' },
  approved: { tone: 'success', icon: 'check' },
  completed: { tone: 'success', icon: 'check' },
  paid: { tone: 'success', icon: 'check' },
  posted: { tone: 'success', icon: 'check' },
  won: { tone: 'success', icon: 'check' },
  released: { tone: 'success', icon: 'check' },
  resolved: { tone: 'success', icon: 'check' },
  delivered: { tone: 'success', icon: 'check' },
  available: { tone: 'success', icon: 'check' },
  open: { tone: 'info', icon: 'dot' },
  in_progress: { tone: 'info', icon: 'clock' },
  editing: { tone: 'info', icon: 'clock' },
  designing: { tone: 'info', icon: 'clock' },
  in_development: { tone: 'info', icon: 'clock' },
  scheduled: { tone: 'info', icon: 'clock' },
  reserved: { tone: 'info', icon: 'clock' },
  sent: { tone: 'info', icon: 'dot' },
  partial: { tone: 'warning', icon: 'warn' },
  pending: { tone: 'warning', icon: 'clock' },
  pending_approval: { tone: 'warning', icon: 'clock' },
  submitted: { tone: 'warning', icon: 'clock' },
  manager_review: { tone: 'warning', icon: 'clock' },
  internal_review: { tone: 'warning', icon: 'clock' },
  revision: { tone: 'warning', icon: 'warn' },
  at_risk: { tone: 'danger', icon: 'warn' },
  overdue: { tone: 'danger', icon: 'err' },
  rejected: { tone: 'danger', icon: 'err' },
  lost: { tone: 'danger', icon: 'err' },
  cancelled: { tone: 'neutral', icon: 'err' },
  closed: { tone: 'neutral', icon: 'check' },
  draft: { tone: 'neutral', icon: 'dot' },
};

export function StatusIndicator({ status, label }: { status: string; label?: string }) {
  const cfg = STATUS_STYLE_MAP[status] ?? { tone: 'neutral', icon: 'dot' };
  const colorClass = {
    success: 'text-[#16A34A] dark:text-emerald-400',
    warning: 'text-[#D97706] dark:text-amber-400',
    danger: 'text-[#DC2626] dark:text-red-400',
    info: 'text-[#0284C7] dark:text-sky-400',
    neutral: 'text-[#667085] dark:text-[#9CA3AF]',
  }[cfg.tone];

  const Icon =
    cfg.icon === 'check'
      ? CheckCircle2
      : cfg.icon === 'warn'
        ? AlertCircle
        : cfg.icon === 'err'
          ? XCircle
          : cfg.icon === 'clock'
            ? Clock
            : CircleDot;

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${colorClass}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{label ?? status.replace(/_/g, ' ')}</span>
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="py-12 px-6 text-center border border-dashed border-[#E4E7EC] dark:border-[#293548] rounded-xl bg-[#F7F9FC]/60 dark:bg-[#0B1220]/40">
      <h3 className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">{title}</h3>
      <p className="mt-1 text-xs text-[#667085] dark:text-[#9CA3AF] max-w-md mx-auto">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="bg-white dark:bg-[#111827] border border-[#E4E7EC] dark:border-[#293548] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E4E7EC] dark:border-[#293548]">
          <h3 className="text-base font-semibold text-[#101828] dark:text-[#F9FAFB]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-[#667085] hover:text-[#101828] dark:hover:text-white hover:bg-[#EEF2F6] dark:hover:bg-[#182235]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export const inputCls =
  'w-full px-3 py-2 text-sm bg-white dark:bg-[#0B1220] border border-[#E4E7EC] dark:border-[#293548] rounded-lg text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]';

export const btnPrimaryCls =
  'inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors whitespace-nowrap shrink-0 disabled:opacity-50';

export const btnSecondaryCls =
  'inline-flex items-center justify-center gap-2 px-3.5 py-2 text-sm font-medium text-[#101828] dark:text-[#F9FAFB] bg-white dark:bg-[#182235] border border-[#E4E7EC] dark:border-[#293548] hover:bg-[#EEF2F6] dark:hover:bg-[#293548] rounded-lg transition-colors whitespace-nowrap shrink-0';

export function exportToCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
