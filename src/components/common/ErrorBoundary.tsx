import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('BALANCE OS ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      let friendly = this.state.message;
      try {
        const parsed = JSON.parse(this.state.message);
        if (parsed && parsed.error) {
          friendly = `${parsed.error} (${parsed.operationType ?? 'op'} on ${parsed.path ?? 'resource'})`;
        }
      } catch {
        // plain error message
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC] dark:bg-[#0B1220] p-6">
          <div className="max-w-lg w-full bg-white dark:bg-[#111827] border border-[#E4E7EC] dark:border-[#293548] rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-[#DC2626]">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h1 className="text-lg font-semibold text-[#101828] dark:text-[#F9FAFB]">
                حدث خطأ غير متوقع في النظام
              </h1>
            </div>
            <p className="text-sm text-[#667085] dark:text-[#9CA3AF] break-words">
              {friendly}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              إعادة تحميل النظام
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
