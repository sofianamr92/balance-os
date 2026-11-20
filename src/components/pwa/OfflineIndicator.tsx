import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useOS } from '../../context/OSContext';

export function OfflineIndicator() {
  const { lang } = useOS();
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !needRefresh) {
    return null;
  }

  return (
    <div className="space-y-1">
      {!isOnline && (
        <div
          role="status"
          className="bg-amber-50 dark:bg-amber-950/50 border-b border-amber-200 dark:border-amber-800 px-4 lg:px-6 py-2 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2"
        >
          <WifiOff className="w-3.5 h-3.5 shrink-0" />
          <span>
            {lang === 'ar'
              ? 'وضع عدم الاتصال — التغييرات المحلية محفوظة ومزامنتها ستتم فور عودة الإنترنت.'
              : 'Offline mode — cached workspace active; sync resumes automatically when online.'}
          </span>
        </div>
      )}
      {needRefresh && (
        <div
          role="status"
          className="bg-blue-50 dark:bg-blue-950/50 border-b border-blue-200 dark:border-blue-800 px-4 lg:px-6 py-2 text-xs text-blue-900 dark:text-blue-200 flex items-center justify-between gap-3"
        >
          <span>
            {lang === 'ar'
              ? 'يتوفر تحديث جديد لنظام BALANCE OS.'
              : 'A new update for BALANCE OS is ready.'}
          </span>
          <button
            type="button"
            onClick={() => updateServiceWorker(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#2563EB] text-white font-semibold"
          >
            <RefreshCw className="w-3 h-3" />
            <span>{lang === 'ar' ? 'تحديث الآن' : 'Reload Update'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
