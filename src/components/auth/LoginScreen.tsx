import React, { useState } from 'react';
import { ShieldCheck, Globe, Sun, Moon, ArrowRight, ArrowLeft, Layers } from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { t } from '../../i18n/translations';

export function LoginScreen() {
  const { signInWithGoogle, enterDemoSandbox, lang, setLang, theme, setTheme } = useOS();
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogle = async () => {
    setBusy(true);
    setErrorMsg(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setBusy(false);
    }
  };

  const ArrowIcon = lang === 'ar' ? ArrowLeft : ArrowRight;

  return (
    <div className="min-h-screen bg-[#F7F9FC] dark:bg-[#0B1220] flex flex-col justify-between p-6">
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#101828] dark:bg-[#2563EB] text-white flex items-center justify-center font-bold text-base">
            B
          </div>
          <div>
            <div className="font-bold text-base text-[#101828] dark:text-[#F9FAFB] leading-tight">
              BALANCE OS
            </div>
            <div className="text-xs text-[#667085] dark:text-[#9CA3AF]">
              {t(lang, 'brandSub')}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E4E7EC] dark:border-[#293548] bg-white dark:bg-[#111827] text-[#101828] dark:text-[#F9FAFB] hover:bg-[#EEF2F6] dark:hover:bg-[#182235]"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'EN' : 'AR'}</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            className="p-2 rounded-lg border border-[#E4E7EC] dark:border-[#293548] bg-white dark:bg-[#111827] text-[#101828] dark:text-[#F9FAFB] hover:bg-[#EEF2F6] dark:hover:bg-[#182235]"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        </div>
      </header>

      <main className="max-w-4xl w-full mx-auto my-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <section className="lg:col-span-7 bg-white dark:bg-[#111827] border border-[#E4E7EC] dark:border-[#293548] rounded-xl p-8 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#2563EB] mb-3">
              <Layers className="w-4 h-4" />
              <span>BALANCE Agency · Egypt · EGP</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#101828] dark:text-[#F9FAFB] leading-snug">
              {lang === 'ar'
                ? 'نظام التشغيل المؤسسي الموحّد لإدارة الوكالة'
                : 'Unified Enterprise Business Operating System'}
            </h1>
            <p className="mt-3 text-sm text-[#667085] dark:text-[#9CA3AF] leading-relaxed">
              {lang === 'ar'
                ? 'بيئة عمل متكاملة تربط المبيعات، العقود، المشاريع، الإنتاج الإعلامي، المونتاج، التصميم، التسويق، التطوير، المحاسبة مزدوجة القيد، والموارد البشرية في منصة واحدة.'
                : 'End-to-end operating system connecting CRM, contracts, projects, media production, editing, design, marketing, software engineering, double-entry accounting, and HR.'}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[#F7F9FC] dark:bg-[#0B1220] border border-[#E4E7EC] dark:border-[#293548]">
                <div className="font-semibold text-[#101828] dark:text-[#F9FAFB]">
                  {lang === 'ar' ? '25 وحدة تشغيلية' : '25 Integrated Modules'}
                </div>
                <div className="text-[#667085] dark:text-[#9CA3AF] mt-0.5">
                  {lang === 'ar' ? 'من العميل المحتمل إلى القوائم المالية' : 'Lead-to-Ledger traceability'}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#F7F9FC] dark:bg-[#0B1220] border border-[#E4E7EC] dark:border-[#293548]">
                <div className="font-semibold text-[#101828] dark:text-[#F9FAFB]">
                  {lang === 'ar' ? 'حوكمة مالية مزدوجة القيد' : 'Double-Entry Ledger'}
                </div>
                <div className="text-[#667085] dark:text-[#9CA3AF] mt-0.5">
                  {lang === 'ar' ? 'فصل المهام (SoD) وعكس القيود فقط' : 'SoD approvals & immutable reversals'}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-[#DC2626] dark:text-red-300">
                {errorMsg}
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogle}
              disabled={busy}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-3 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors disabled:opacity-60"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{t(lang, 'signInGoogle')}</span>
            </button>

            <button
              type="button"
              onClick={enterDemoSandbox}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-[#101828] dark:text-[#F9FAFB] bg-[#EEF2F6] dark:bg-[#182235] hover:bg-[#E4E7EC] dark:hover:bg-[#293548] rounded-lg transition-colors"
            >
              <span>{t(lang, 'enterDemo')}</span>
              <ArrowIcon className="w-4 h-4" />
            </button>
          </div>
        </section>

        <aside className="lg:col-span-5 bg-[#101828] text-white rounded-xl p-7 flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {lang === 'ar' ? 'معايير الحوكمة والأمان' : 'Security & Governance'}
            </div>
            <h2 className="mt-2 text-lg font-bold">
              {lang === 'ar' ? 'هيكل الصلاحيات والفروع' : 'RBAC & Multi-Branch Isolation'}
            </h2>
            <ul className="mt-5 space-y-3.5 text-xs text-slate-300">
              <li className="border-b border-slate-800 pb-3">
                <div className="font-semibold text-white">
                  {lang === 'ar' ? 'بيئة عرض معزولة (Demo Sandbox)' : 'Isolated Demo Sandbox'}
                </div>
                <div className="mt-0.5 text-slate-400">
                  {lang === 'ar'
                    ? 'بيانات المعاينة التجريبية معزولة تماماً عن السجلات المالية والتشغيلية الحية.'
                    : 'Preview data stays isolated from production financial statements.'}
                </div>
              </li>
              <li className="border-b border-slate-800 pb-3">
                <div className="font-semibold text-white">
                  {lang === 'ar' ? 'حماية بيانات الرواتب والهوية (PII)' : 'Restricted Payroll & PII Masking'}
                </div>
                <div className="mt-0.5 text-slate-400">
                  {lang === 'ar'
                    ? 'حقول الرواتب والبيانات الشخصية محجوبة عن غير المصرح لهم.'
                    : 'Salaries, national IDs, and HR records are masked by role.'}
                </div>
              </li>
              <li>
                <div className="font-semibold text-white">
                  {lang === 'ar' ? 'دعم الفروع المتعددة (القاهرة والإسكندرية)' : 'Cairo HQ & Alexandria Branch'}
                </div>
                <div className="mt-0.5 text-slate-400">
                  {lang === 'ar'
                    ? 'تصفية فورية للمشاريع والخزائن والمصروفات حسب الفرع.'
                    : 'Branch-level operational and treasury visibility.'}
                </div>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Africa/Cairo (UTC+2)</span>
            <span>EGP · Double-Entry</span>
          </div>
        </aside>
      </main>

      <footer className="max-w-5xl w-full mx-auto text-center text-xs text-[#667085] dark:text-[#9CA3AF]">
        BALANCE Agency Operating System · v1.0
      </footer>
    </div>
  );
}
