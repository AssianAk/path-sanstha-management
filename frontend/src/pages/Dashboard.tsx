import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
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
  ArrowLeftRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { MakerCheckerBadge } from '../components/MakerCheckerBadge';

export const Dashboard: React.FC = () => {
  const { user, businessDate } = useAuth();

  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalMembers: 0,
    pendingApprovals: 0,
    totalBranches: 0,
    totalAccounts: 0,
    totalDepositLiability: 0,
    tillCash: 0
  });
  const [recentAudits, setRecentAudits] = useState<any[]>([]);
  const [pendingQueue, setPendingQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [custRes, queueRes, branchRes, auditRes, accRes, tillRes] = await Promise.all([
          api.get('/customers'),
          api.get('/kyc/queue?status=PENDING'),
          api.get('/org/branches'),
          api.get('/audit?limit=5'),
          api.get('/accounts'),
          api.get('/teller/till/active')
        ]);

        const customers = custRes.data.customers || [];
        const members = customers.filter((c: any) => c.isMember);
        const queue = queueRes.data.items || [];
        const branches = branchRes.data.branches || [];
        const audits = auditRes.data.logs || [];
        const accounts = accRes.data.accounts || [];
        const totalDeposits = accounts.reduce((acc: number, a: any) => acc + (a.ledgerBalance || 0), 0);
        const till = tillRes.data.till;

        setStats({
          totalCustomers: customers.length,
          totalMembers: members.length,
          pendingApprovals: queue.length,
          totalBranches: branches.length,
          totalAccounts: accounts.length,
          totalDepositLiability: totalDeposits,
          tillCash: till?.currentBalance || 0
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
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-emerald-500/20 text-emerald-300 text-xs px-3 py-1 rounded-full font-medium mb-2 border border-emerald-400/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Phase 1 & Phase 2 Active (Foundation + CASA & Deposits)</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            Welcome, {user?.fullName}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Logged into <span className="font-semibold text-white">{user?.branchName || 'Head Office'}</span> ({user?.branchCode || 'BR001'}). Operational business date is{' '}
            <span className="font-mono text-emerald-300 font-semibold">{businessDate}</span>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/accounts"
            className="px-3.5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center space-x-1.5"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Open Account</span>
          </Link>
          <Link
            to="/teller"
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center space-x-1.5"
          >
            <Banknote className="w-3.5 h-3.5" />
            <span>Cash Counter</span>
          </Link>
          <Link
            to="/transfers"
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold backdrop-blur-xs transition-colors flex items-center space-x-1.5 border border-white/20"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Fund Transfer</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Row 1: Core Institutional & Phase 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Customers</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.totalCustomers}</h3>
            <span className="text-[11px] text-emerald-600 font-medium">Individual & Corporate</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Total Members */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Pat Sanstha Members</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.totalMembers}</h3>
            <span className="text-[11px] text-brand-600 font-medium">With Shareholding</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-sky-50 text-brand-600 flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Maker-Checker Queue</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">{stats.pendingApprovals}</h3>
            <span className="text-[11px] text-amber-700 font-medium">Awaiting Checker Action</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Operating Branches */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Operating Branches</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.totalBranches}</h3>
            <span className="text-[11px] text-emerald-600 font-medium">Business Date Rollover</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* KPI Cards Row 2: Phase 2 Deposit & Cash Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Deposits Book */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Deposit Liability</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1 font-mono">
              ₹{stats.totalDepositLiability.toLocaleString()}
            </h3>
            <span className="text-[11px] text-brand-600 font-medium">{stats.totalAccounts} Active CASA & Term Accounts</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        {/* Active Till Cash */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Till Cash in Hand</p>
            <h3 className="text-2xl font-bold text-emerald-700 mt-1 font-mono">
              ₹{stats.tillCash.toLocaleString()}
            </h3>
            <span className="text-[11px] text-emerald-600 font-medium">Counter Drawer Balance</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Banknote className="w-6 h-6" />
          </div>
        </div>

        {/* Double-Entry Invariant Status */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">General Ledger Invariant</p>
            <h3 className="text-lg font-bold text-slate-900 mt-1 flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Debits == Credits</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">ACID Financial Posting</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Grid: Pending Approval Queue & Recent Audit Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approval Requests */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-800">Pending Checker Approvals</h3>
            </div>
            <Link
              to="/kyc"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {pendingQueue.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                No pending items in approval queue. All KYC and master records are verified.
              </div>
            ) : (
              pendingQueue.map((item) => {
                let payload: any = {};
                try {
                  payload = JSON.parse(item.payloadJson);
                } catch (e) {}

                return (
                  <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900">
                          {payload.customerName || 'Customer Master'}
                        </span>
                        <MakerCheckerBadge status={item.status} />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Module: <span className="font-semibold text-slate-700">{item.module}</span> • Action: <span className="font-mono text-slate-700">{item.actionType}</span>
                      </p>
                    </div>

                    <Link
                      to="/kyc"
                      className="px-3 py-1.5 bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 rounded text-xs font-semibold transition-colors shrink-0"
                    >
                      Verify
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Real-time Audit Trail Activity */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
              <h3 className="text-sm font-bold text-slate-800">Immutable Audit Trail</h3>
            </div>
            <Link
              to="/audit"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center space-x-1"
            >
              <span>Audit Explorer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentAudits.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No recent audit events found.
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
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        {log.action} on {log.entityName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Actor: <span className="font-medium text-slate-700">{log.username}</span> ({log.userRole})
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
