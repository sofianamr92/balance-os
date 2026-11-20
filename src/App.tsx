/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { OSProvider, useOS } from './context/OSContext';
import { LoginScreen } from './components/auth/LoginScreen';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { CompanyPage } from './pages/CompanyPage';
import { CrmPage } from './pages/CrmPage';
import { ClientsPage } from './pages/ClientsPage';
import { ProposalsContractsPage } from './pages/ProposalsContractsPage';
import { ProjectDetailPage, ProjectsPage } from './pages/ProjectsPage';
import { TasksPage } from './pages/TasksPage';
import { CalendarPage } from './pages/CalendarPage';
import { ProductionPage } from './pages/ProductionPage';
const Studio3DPage = lazy(() =>
  import('./pages/Studio3DPage').then((m) => ({ default: m.Studio3DPage }))
);
import {
  DesignPage,
  DevelopmentPage,
  EditingPage,
  MarketingPage,
} from './pages/CreativeModulesPages';
import { FinancePage } from './pages/FinancePage';
import { AssetsPage, ProcurementPage } from './pages/ProcurementAssetsPage';
import { HrPage } from './pages/HrPage';
import {
  FilesPage,
  KnowledgePage,
  SupportPage,
} from './pages/SupportFilesKnowledgePage';
import {
  AiAssistantPage,
  AutomationPage,
  ReportsPage,
  SettingsPage,
} from './pages/ReportsAutomationAiSettingsPage';
import type { ModuleKey } from './types/os';
import { hasPermission } from './utils/rbac';

function Guarded({ module, children }: { module: ModuleKey; children: React.ReactNode }) {
  const { currentUser, lang } = useOS();
  if (!hasPermission(currentUser, module, 'view')) {
    return (
      <div className="bg-white dark:bg-[#111827] border border-[#E4E7EC] dark:border-[#293548] rounded-xl p-8 text-center space-y-2">
        <h2 className="text-base font-bold text-[#101828] dark:text-[#F9FAFB]">
          {lang === 'ar' ? 'غير مصرح بالوصول إلى هذه الوحدة' : 'Access Restricted by Role Permissions'}
        </h2>
        <p className="text-xs text-[#667085] dark:text-[#9CA3AF]">
          {lang === 'ar'
            ? 'لا يتضمن دورك الوظيفي الحالي صلاحية عرض هذه الوحدة.'
            : 'Your active role does not include view permission for this module.'}
        </p>
      </div>
    );
  }
  return <>{children}</>;
}

function AuthenticatedApp() {
  const { loading, currentUser, isDemoMode } = useOS();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC] dark:bg-[#0B1220] text-sm font-medium text-[#667085]">
        BALANCE OS...
      </div>
    );
  }

  if (!currentUser && !isDemoMode) {
    return <LoginScreen />;
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Guarded module="dashboard"><DashboardPage /></Guarded>} />
        <Route path="/workspace" element={<Guarded module="workspace"><WorkspacePage /></Guarded>} />
        <Route path="/company" element={<Guarded module="company"><CompanyPage defaultTab="overview" /></Guarded>} />
        <Route path="/company/branches" element={<Guarded module="company"><CompanyPage defaultTab="branches" /></Guarded>} />
        <Route path="/company/departments" element={<Guarded module="company"><CompanyPage defaultTab="departments" /></Guarded>} />
        <Route path="/company/teams" element={<Guarded module="company"><CompanyPage defaultTab="departments" /></Guarded>} />
        <Route path="/company/org" element={<Guarded module="company"><CompanyPage defaultTab="org" /></Guarded>} />
        <Route path="/company/rbac" element={<Guarded module="company"><CompanyPage defaultTab="rbac" /></Guarded>} />
        <Route path="/company/*" element={<Guarded module="company"><CompanyPage defaultTab="overview" /></Guarded>} />

        <Route path="/crm" element={<Guarded module="crm"><CrmPage /></Guarded>} />
        <Route path="/crm/leads" element={<Guarded module="crm"><CrmPage /></Guarded>} />
        <Route path="/crm/deals" element={<Guarded module="crm"><CrmPage /></Guarded>} />
        <Route path="/crm/contacts" element={<Guarded module="clients"><ClientsPage /></Guarded>} />
        <Route path="/crm/clients" element={<Guarded module="clients"><ClientsPage /></Guarded>} />
        <Route path="/crm/proposals" element={<Guarded module="proposals"><ProposalsContractsPage /></Guarded>} />
        <Route path="/sales/contracts" element={<Guarded module="proposals"><ProposalsContractsPage /></Guarded>} />

        <Route path="/projects" element={<Guarded module="projects"><ProjectsPage /></Guarded>} />
        <Route path="/projects/:projectId" element={<Guarded module="projects"><ProjectDetailPage /></Guarded>} />
        <Route path="/tasks" element={<Guarded module="tasks"><TasksPage /></Guarded>} />
        <Route path="/calendar" element={<Guarded module="calendar"><CalendarPage /></Guarded>} />

        <Route path="/production" element={<Guarded module="production"><ProductionPage /></Guarded>} />
        <Route
          path="/studio-3d"
          element={
            <Guarded module="studio3d">
              <Suspense
                fallback={
                  <div className="min-h-[420px] flex items-center justify-center text-xs text-[#667085]">
                    Loading 3D Studio...
                  </div>
                }
              >
                <Studio3DPage />
              </Suspense>
            </Guarded>
          }
        />
        <Route path="/editing" element={<Guarded module="editing"><EditingPage /></Guarded>} />
        <Route path="/design" element={<Guarded module="design"><DesignPage /></Guarded>} />
        <Route path="/marketing" element={<Guarded module="marketing"><MarketingPage /></Guarded>} />
        <Route path="/development" element={<Guarded module="development"><DevelopmentPage /></Guarded>} />

        <Route path="/finance" element={<Guarded module="finance"><FinancePage defaultTab="overview" /></Guarded>} />
        <Route path="/finance/accounts" element={<Guarded module="finance"><FinancePage defaultTab="accounts" /></Guarded>} />
        <Route path="/finance/journals" element={<Guarded module="finance"><FinancePage defaultTab="journals" /></Guarded>} />
        <Route path="/finance/invoices" element={<Guarded module="finance"><FinancePage defaultTab="invoices" /></Guarded>} />
        <Route path="/finance/payments" element={<Guarded module="finance"><FinancePage defaultTab="invoices" /></Guarded>} />
        <Route path="/finance/expenses" element={<Guarded module="finance"><FinancePage defaultTab="expenses" /></Guarded>} />
        <Route path="/finance/treasury" element={<Guarded module="finance"><FinancePage defaultTab="treasury" /></Guarded>} />

        <Route path="/procurement" element={<Guarded module="procurement"><ProcurementPage /></Guarded>} />
        <Route path="/assets" element={<Guarded module="assets"><AssetsPage /></Guarded>} />

        <Route path="/hr" element={<Guarded module="hr"><HrPage defaultTab="employees" /></Guarded>} />
        <Route path="/hr/employees" element={<Guarded module="hr"><HrPage defaultTab="employees" /></Guarded>} />
        <Route path="/hr/attendance" element={<Guarded module="hr"><HrPage defaultTab="attendance" /></Guarded>} />
        <Route path="/hr/leaves" element={<Guarded module="hr"><HrPage defaultTab="leaves" /></Guarded>} />
        <Route path="/hr/payroll" element={<Guarded module="hr"><HrPage defaultTab="payroll" /></Guarded>} />
        <Route path="/hr/*" element={<Guarded module="hr"><HrPage defaultTab="employees" /></Guarded>} />

        <Route path="/support" element={<Guarded module="support"><SupportPage /></Guarded>} />
        <Route path="/files" element={<Guarded module="files"><FilesPage /></Guarded>} />
        <Route path="/knowledge" element={<Guarded module="knowledge"><KnowledgePage /></Guarded>} />

        <Route path="/reports" element={<Guarded module="reports"><ReportsPage /></Guarded>} />
        <Route path="/ai" element={<Guarded module="ai"><AiAssistantPage /></Guarded>} />
        <Route path="/automation" element={<Guarded module="automation"><AutomationPage /></Guarded>} />
        <Route path="/settings" element={<Guarded module="settings"><SettingsPage /></Guarded>} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppShell>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <OSProvider>
        <BrowserRouter>
          <AuthenticatedApp />
        </BrowserRouter>
      </OSProvider>
    </ErrorBoundary>
  );
}
