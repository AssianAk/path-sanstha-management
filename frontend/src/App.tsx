import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { CustomerList } from './pages/Customers/CustomerList';
import { KycQueue } from './pages/KYC/KycQueue';
import { BranchList } from './pages/Branches/BranchList';
import { AuditLogList } from './pages/Audit/AuditLogList';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { AccountList } from './pages/Accounts/AccountList';
import { TellerCounter } from './pages/Teller/TellerCounter';
import { FundTransfer } from './pages/Transfers/FundTransfer';
import { LoansHub } from './pages/Loans/LoansHub';
import { CollectionsHub } from './pages/Collections/CollectionsHub';
import { GLHub } from './pages/GeneralLedger/GLHub';
import { ReportsHub } from './pages/Reports/ReportsHub';
import { DigitalChannelsHub } from './pages/Digital/DigitalChannelsHub';
import api from './api/client';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const [pendingCount, setPendingCount] = useState(0);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (user) {
      api.get('/kyc/queue?status=PENDING')
        .then((res) => {
          setPendingCount(res.data.count || 0);
        })
        .catch(() => {});
    }
  }, [user]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900 text-white font-medium">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mr-3"></div>
        {t('common.loading', 'Loading Core Banking System...')}
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-slate-100/70 overflow-hidden">
      <Sidebar
        pendingApprovalsCount={pendingCount}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <AppLayout>
                <Dashboard />
              </AppLayout>
            }
          />
          {/* Phase 1 Routes */}
          <Route
            path="/customers"
            element={
              <AppLayout>
                <CustomerList />
              </AppLayout>
            }
          />
          <Route
            path="/kyc"
            element={
              <AppLayout>
                <KycQueue />
              </AppLayout>
            }
          />
          <Route
            path="/branches"
            element={
              <AppLayout>
                <BranchList />
              </AppLayout>
            }
          />
          <Route
            path="/audit"
            element={
              <AppLayout>
                <AuditLogList />
              </AppLayout>
            }
          />
          <Route
            path="/settings"
            element={
              <AppLayout>
                <SettingsPage />
              </AppLayout>
            }
          />

          {/* Phase 2 Routes */}
          <Route
            path="/accounts"
            element={
              <AppLayout>
                <AccountList />
              </AppLayout>
            }
          />
          <Route
            path="/teller"
            element={
              <AppLayout>
                <TellerCounter />
              </AppLayout>
            }
          />
          <Route
            path="/transfers"
            element={
              <AppLayout>
                <FundTransfer />
              </AppLayout>
            }
          />

          {/* Phase 3 Routes */}
          <Route
            path="/loans"
            element={
              <AppLayout>
                <LoansHub />
              </AppLayout>
            }
          />

          {/* Phase 4 Routes */}
          <Route
            path="/collections"
            element={
              <AppLayout>
                <CollectionsHub />
              </AppLayout>
            }
          />

          {/* Phase 5 Routes */}
          <Route
            path="/gl"
            element={
              <AppLayout>
                <GLHub />
              </AppLayout>
            }
          />

          {/* Phase 6 Routes */}
          <Route
            path="/reports"
            element={
              <AppLayout>
                <ReportsHub />
              </AppLayout>
            }
          />

          {/* Phase 7 Routes */}
          <Route
            path="/digital"
            element={
              <AppLayout>
                <DigitalChannelsHub />
              </AppLayout>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
