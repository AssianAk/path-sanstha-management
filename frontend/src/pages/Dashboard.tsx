import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../api/client';
import {
  Users,
  UserCheck,
  Clock,
  Building2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Banknote,
  ArrowLeftRight,
  Award,
  ShieldAlert,
  Smartphone
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { MakerCheckerBadge } from '../components/MakerCheckerBadge';

export const Dashboard: React.FC = () => {
  const { user, businessDate } = useAuth();
  const { language, t } = useLanguage();

  const localize = (enText: string, mrText: string, hiText: string) => {
    if (language === 'mr') return mrText;
    if (language === 'hi') return hiText;
    return enText;
  };

  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalMembers: 0,
    pendingApprovals: 0,
    totalBranches: 0,
    totalAccounts: 0,
    totalDepositLiability: 0,
    tillCash: 0,
    totalLoanAssetOutstanding: 0,
    activeLoansCount: 0
  });
  const [recentAudits, setRecentAudits] = useState<any[]>([]);
  const [pendingQueue, setPendingQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [custRes, queueRes, branchRes, auditRes, accRes, tillRes, loanRes] = await Promise.all([
          api.get('/customers'),
          api.get('/kyc/queue?status=PENDING'),
          api.get('/org/branches'),
          api.get('/audit?limit=5'),
          api.get('/accounts'),
          api.get('/teller/till/active'),
          api.get('/loans/accounts')
        ]);

        const customers = custRes.data.customers || [];
        const members = customers.filter((c: any) => c.isMember);
        const queue = queueRes.data.items || [];
        const branches = branchRes.data.branches || [];
        const audits = auditRes.data.logs || [];
        const accounts = accRes.data.accounts || [];
        const totalDeposits = accounts.reduce((acc: number, a: any) => acc + (a.ledgerBalance || 0), 0);
        const till = tillRes.data.till;
        const loans = loanRes.data.loans || [];
        const totalLoans = loans.reduce((acc: number, l: any) => acc + (l.principalOutstanding || 0), 0);

        setStats({
          totalCustomers: customers.length,
          totalMembers: members.length,
          pendingApprovals: queue.length,
          totalBranches: branches.length,
          totalAccounts: accounts.length,
          totalDepositLiability: totalDeposits,
          tillCash: till?.currentBalance || 0,
          totalLoanAssetOutstanding: totalLoans,
          activeLoansCount: loans.length
        });
        setPendingQueue(queue.slice(0, 4));
        setRecentAudits(audits);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, [user]);

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 rounded-2xl p-4 sm:p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-amber-500/20 text-amber-300 text-xs px-3 py-1 rounded-full font-medium mb-2 border border-amber-400/30">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span>{localize('All 8 Phases Active • Production Ready', 'सर्व ८ टप्पे सक्रिय • उत्पादन सिद्ध', 'सभी 8 चरण सक्रिय • उत्पादन तैयार')}</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">
            {localize('Welcome', 'स्वागत आहे', 'स्वागत है')}, {user?.fullName}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            {localize('Branch:', 'शाखा:', 'शाखा:')} <span className="font-semibold text-white">{user?.branchName || t('institution.headOffice')}</span> ({user?.branchCode || 'BR001'}).{' '}
            {localize('Active business date is', 'सक्रिय कामकाज तारीख:', 'सक्रिय कार्य दिवस तिथि:')}{' '}
            <span className="font-mono text-amber-300 font-semibold">{businessDate}</span>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/accounts"
            className="px-3 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center space-x-1.5"
          >
            <CreditCard className="w-3.5 h-3.5 shrink-0" />
            <span>{localize('Open CASA', 'खाते उघडा', 'खाता खोलें')}</span>
          </Link>
          <Link
            to="/teller"
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center space-x-1.5"
          >
            <Banknote className="w-3.5 h-3.5 shrink-0" />
            <span>{localize('Cash Counter', 'रोख काऊंटर', 'रोकड़ काउंटर')}</span>
          </Link>
          <Link
            to="/loans"
            className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center space-x-1.5"
          >
            <Award className="w-3.5 h-3.5 shrink-0" />
            <span>{localize('Loan Origination', 'कर्ज मंजुरी', 'ऋण स्वीकृति')}</span>
          </Link>
          <Link
            to="/collections"
            className="px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center space-x-1.5"
          >
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>{localize('NPA Desk', 'वसुली कक्ष', 'वसूली डेस्क')}</span>
          </Link>
          <Link
            to="/digital"
            className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center space-x-1.5"
          >
            <Smartphone className="w-3.5 h-3.5 shrink-0" />
            <span>{localize('Digital UPI', 'डिजिटल यूपीआय', 'डिजिटल यूपीआई')}</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Row: Core Financial Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total Loan Portfolio Outstanding */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              {t('dashboard.totalAdvances')}
            </p>
            <h3 className="text-xl sm:text-2xl font-bold text-amber-900 mt-1 font-mono">
              ₹{stats.totalLoanAssetOutstanding.toLocaleString()}
            </h3>
            <span className="text-[11px] text-amber-700 font-medium">
              {stats.activeLoansCount} {localize('Active Loan Contracts', 'सक्रिय कर्ज खाती', 'सक्रिय ऋण अनुबंध')}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Total Deposit Liability */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              {t('dashboard.totalDeposits')}
            </p>
            <h3 className="text-xl sm:text-2xl font-bold text-brand-900 mt-1 font-mono">
              ₹{stats.totalDepositLiability.toLocaleString()}
            </h3>
            <span className="text-[11px] text-brand-600 font-medium">
              {stats.totalAccounts} {localize('CASA & Deposit Accounts', 'ठेवी व चालू खाती', 'कासा एवं जमा खाते')}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        {/* Till Cash */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              {t('dashboard.tillCash')}
            </p>
            <h3 className="text-xl sm:text-2xl font-bold text-emerald-700 mt-1 font-mono">
              ₹{stats.tillCash.toLocaleString()}
            </h3>
            <span className="text-[11px] text-emerald-600 font-medium">
              {localize('Vault & Teller Till', 'तिजोरी व खजिनदार रोख', 'तिजोरी एवं काउंटर रोकड़')}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Banknote className="w-6 h-6" />
          </div>
        </div>

        {/* Pat Sanstha Members */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              {t('dashboard.totalMembers')}
            </p>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 font-mono">
              {stats.totalMembers} <span className="text-xs text-slate-400 font-normal font-sans">/ {stats.totalCustomers} {localize('total', 'एकूण', 'कुल')}</span>
            </h3>
            <span className="text-[11px] text-emerald-600 font-medium">
              {localize('Shareholder Voting Members', 'मतदान हक्क असलेले भागधारक', 'मतदान अधिकार युक्त शेयरधारक सदस्य')}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-sky-50 text-brand-600 flex items-center justify-center shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Grid: Pending Approval Queue & Recent Audit Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {/* Pending Approval Requests */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                {t('dashboard.pendingApprovals')}
              </h3>
            </div>
            <Link
              to="/kyc"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center space-x-1"
            >
              <span>{t('common.view')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {pendingQueue.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                {localize(
                  'No pending items in approval queue. All master and transaction requests are verified.',
                  'मंजुरी रांगेत कोणतीही विनंती प्रलंबित नाही. सर्व नोंदी तपासल्या गेल्या आहेत.',
                  'अनुमोदन कतार में कोई अनुरोध लंबित नहीं है। सभी अनुरोध सत्यापित हैं।'
                )}
              </div>
            ) : (
              pendingQueue.map((item) => {
                let payload: any = {};
                try {
                  payload = JSON.parse(item.payloadJson);
                } catch (e) {}

                return (
                  <div key={item.id} className="p-3.5 sm:p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {payload.customerName || localize('Customer Master', 'ग्राहक नोंद', 'ग्राहक मास्टर')}
                        </span>
                        <MakerCheckerBadge status={item.status} />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 truncate">
                        {localize('Module:', 'विभाग:', 'मॉड्यूल:')} <span className="font-semibold text-slate-700">{item.module}</span> • {localize('Action:', 'कृती:', 'क्रिया:')} <span className="font-mono text-slate-700">{item.actionType}</span>
                      </p>
                    </div>

                    <Link
                      to="/kyc"
                      className="px-3 py-1.5 bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 rounded text-xs font-semibold transition-colors shrink-0"
                    >
                      {t('common.approve')}
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Real-time Audit Trail Activity */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                {t('dashboard.recentActivity')}
              </h3>
            </div>
            <Link
              to="/audit"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center space-x-1"
            >
              <span>{t('common.view')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentAudits.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                {localize(
                  'No recent audit events found.',
                  'कोणत्याही ऑडिट नोंदी आढळल्या नाहीत.',
                  'कोई हालिया ऑडिट रिकॉर्ड नहीं मिला।'
                )}
              </div>
            ) : (
              recentAudits.map((log) => (
                <div key={log.id} className="p-3.5 hover:bg-slate-50 transition-colors flex items-start space-x-3">
                  <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                    log.action === 'CREATE' ? 'bg-emerald-100 text-emerald-700' :
                    log.action === 'APPROVE' ? 'bg-indigo-100 text-indigo-700' :
                    log.action === 'UPDATE' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {log.action.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {log.action} on {log.entityName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {localize('Actor:', 'वापरकर्ता:', 'प्रयोक्ता:')} <span className="font-medium text-slate-700">{log.username}</span> ({log.userRole})
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
