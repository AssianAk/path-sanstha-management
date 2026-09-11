import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  FileWarning,
  RefreshCw,
  Users,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Send,
  Printer,
  ChevronRight,
  TrendingDown,
  Building,
  Scale,
  Calendar,
  IndianRupee,
  PhoneCall,
  MapPin,
  FileText
} from 'lucide-react';
import api from '../../api/client';
import { RecoveryActionModal } from './RecoveryActionModal';
import { GenerateNoticeModal } from './GenerateNoticeModal';

export const CollectionsHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'worklist' | 'notices' | 'provisioning'>('worklist');
  const [dashboard, setDashboard] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [officers, setOfficers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningBatch, setRunningBatch] = useState(false);
  const [batchMessage, setBatchMessage] = useState<string | null>(null);

  // Filters
  const [bucketFilter, setBucketFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedLoanForAction, setSelectedLoanForAction] = useState<any>(null);
  const [selectedLoanForNotice, setSelectedLoanForNotice] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [bucketFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, accRes, notRes, offRes] = await Promise.all([
        api.get('/collections/dashboard'),
        api.get(`/collections/delinquent-accounts?bucket=${bucketFilter}`),
        api.get('/collections/notices'),
        api.get('/collections/officers')
      ]);

      if (dashRes.data?.success) setDashboard(dashRes.data.data);
      if (accRes.data?.success) setAccounts(accRes.data.accounts || []);
      if (notRes.data?.success) setNotices(notRes.data.notices || []);
      if (offRes.data?.success) setOfficers(offRes.data.officers || []);
    } catch (err) {
      console.error('Error fetching collections data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunBatch = async () => {
    setRunningBatch(true);
    setBatchMessage(null);
    try {
      const res = await api.post('/collections/run-eod-classification');
      if (res.data?.success) {
        setBatchMessage(res.data.message);
        await fetchData();
      }
    } catch (err: any) {
      setBatchMessage(err.response?.data?.message || 'Failed to execute classification batch.');
    } finally {
      setRunningBatch(false);
    }
  };

  const handleAssignCollector = async (loanAccountId: string, collectorId: string) => {
    try {
      const res = await api.post('/collections/assign-collector', { loanAccountId, collectorId });
      if (res.data?.success) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to assign collector:', err);
    }
  };

  const filteredAccounts = accounts.filter(a => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.loanAccountNumber.toLowerCase().includes(q) ||
      a.customer?.firstName?.toLowerCase().includes(q) ||
      a.customer?.lastName?.toLowerCase().includes(q) ||
      a.customer?.customerNumber?.toLowerCase().includes(q) ||
      a.customer?.phone?.includes(q)
    );
  });

  const getBucketBadge = (cat: string) => {
    switch (cat) {
      case 'STANDARD':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">STANDARD (0d)</span>;
      case 'SMA_0':
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">SMA-0 (1-30d)</span>;
      case 'SMA_1':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">SMA-1 (31-60d)</span>;
      case 'SMA_2':
        return <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded">SMA-2 (61-90d)</span>;
      case 'SUB_STANDARD':
        return <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded">SUB-STANDARD (NPA)</span>;
      case 'DOUBTFUL_1':
      case 'DOUBTFUL_2':
      case 'DOUBTFUL_3':
        return <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded">DOUBTFUL (NPA)</span>;
      case 'LOSS':
        return <span className="bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded">LOSS ASSET</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded">{cat}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-red-900 via-rose-900 to-amber-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-red-500/30 text-red-200 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-red-400/30">
              Phase 4 • Section 11, 12 & 24
            </span>
            <span className="text-xs text-amber-200">RBI IRAC Norms & Co-operative Recovery</span>
          </div>
          <h1 className="text-2xl font-bold mt-1 tracking-tight">Collections, Recovery & NPA Management</h1>
          <p className="text-xs text-red-100 mt-1">
            Automated Days-Past-Due (DPD) aging, regulatory asset provisioning, field recovery logs, and Section 101 statutory notice engine.
          </p>
        </div>

        <button
          onClick={handleRunBatch}
          disabled={runningBatch}
          className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-md transition flex items-center space-x-2 backdrop-blur-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${runningBatch ? 'animate-spin' : ''}`} />
          <span>{runningBatch ? 'Evaluating DPD & NPA...' : 'Run DPD & NPA Batch'}</span>
        </button>
      </div>

      {batchMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{batchMessage}</span>
          </div>
          <button onClick={() => setBatchMessage(null)} className="text-emerald-600 hover:text-emerald-900 font-bold">✕</button>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Gross NPA Ratio</p>
            <div className={`p-2 rounded-xl ${Number(dashboard?.grossNpaPercentage || 0) > 5 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900">{dashboard?.grossNpaPercentage || 0}%</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Target: &lt;5.0% • NPA Sum: ₹{Number(dashboard?.grossNpaAmount || 0).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Overdue Portfolio</p>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-amber-700">₹{Number(dashboard?.totalOverdueAmount || 0).toLocaleString()}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Across {dashboard?.delinquentCount || 0} delinquent loan accounts
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Provisioning Reserve</p>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-purple-900">₹{Number(dashboard?.totalProvisionReserve || 0).toLocaleString()}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              RBI IRAC Reserve Requirement
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Demand Notices Issued</p>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <FileWarning className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-blue-900">{dashboard?.noticeCount || 0}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {dashboard?.pendingNoticeDispatchCount || 0} pending postal dispatch
            </p>
          </div>
        </div>
      </div>

      {/* DPD Buckets Strip */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center">
          <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
          IRAC Delinquency Buckets Breakdown
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center text-xs">
          <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
            <p className="text-[10px] font-bold text-emerald-800">STANDARD</p>
            <p className="text-base font-extrabold text-emerald-700 mt-1">{dashboard?.bucketCounts?.STANDARD || 0}</p>
            <p className="text-[9px] text-emerald-600 font-medium">0 Days (Regular)</p>
          </div>
          <div className="bg-blue-50/60 p-2.5 rounded-xl border border-blue-100">
            <p className="text-[10px] font-bold text-blue-800">SMA-0</p>
            <p className="text-base font-extrabold text-blue-700 mt-1">{dashboard?.bucketCounts?.SMA_0 || 0}</p>
            <p className="text-[9px] text-blue-600 font-medium">1 - 30 Days Past</p>
          </div>
          <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-100">
            <p className="text-[10px] font-bold text-amber-800">SMA-1</p>
            <p className="text-base font-extrabold text-amber-700 mt-1">{dashboard?.bucketCounts?.SMA_1 || 0}</p>
            <p className="text-[9px] text-amber-600 font-medium">31 - 60 Days Past</p>
          </div>
          <div className="bg-orange-50/60 p-2.5 rounded-xl border border-orange-100">
            <p className="text-[10px] font-bold text-orange-800">SMA-2</p>
            <p className="text-base font-extrabold text-orange-700 mt-1">{dashboard?.bucketCounts?.SMA_2 || 0}</p>
            <p className="text-[9px] text-orange-600 font-medium">61 - 90 Days Past</p>
          </div>
          <div className="bg-red-50/60 p-2.5 rounded-xl border border-red-100">
            <p className="text-[10px] font-bold text-red-800">SUB-STANDARD</p>
            <p className="text-base font-extrabold text-red-700 mt-1">{dashboard?.bucketCounts?.SUB_STANDARD || 0}</p>
            <p className="text-[9px] text-red-600 font-medium">91 - 455 Days (NPA)</p>
          </div>
          <div className="bg-purple-50/60 p-2.5 rounded-xl border border-purple-100">
            <p className="text-[10px] font-bold text-purple-800">DOUBTFUL / LOSS</p>
            <p className="text-base font-extrabold text-purple-700 mt-1">
              {(dashboard?.bucketCounts?.DOUBTFUL_1 || 0) + (dashboard?.bucketCounts?.DOUBTFUL_2 || 0) + (dashboard?.bucketCounts?.DOUBTFUL_3 || 0) + (dashboard?.bucketCounts?.LOSS || 0)}
            </p>
            <p className="text-[9px] text-purple-600 font-medium">&gt; 455 Days (NPA)</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-sm font-semibold space-x-6">
        <button
          onClick={() => setActiveTab('worklist')}
          className={`pb-3 transition flex items-center space-x-2 ${
            activeTab === 'worklist'
              ? 'border-b-2 border-red-700 text-red-700 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Delinquent Accounts Worklist ({filteredAccounts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('notices')}
          className={`pb-3 transition flex items-center space-x-2 ${
            activeTab === 'notices'
              ? 'border-b-2 border-red-700 text-red-700 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Notice Dispatch Register ({notices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('provisioning')}
          className={`pb-3 transition flex items-center space-x-2 ${
            activeTab === 'provisioning'
              ? 'border-b-2 border-red-700 text-red-700 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Regulatory Provisioning Summary</span>
        </button>
      </div>

      {/* TAB 1: WORKLIST */}
      {activeTab === 'worklist' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Filters Bar */}
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search account, borrower name, phone..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
              <span className="text-xs text-slate-500 font-medium">Filter Bucket:</span>
              {['ALL', 'SMA_0', 'SMA_1', 'SMA_2', 'NPA'].map(b => (
                <button
                  key={b}
                  onClick={() => setBucketFilter(b)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${
                    bucketFilter === b
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Accounts Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-4">Loan Account & Borrower</th>
                  <th className="p-4">DPD & IRAC Class</th>
                  <th className="p-4">Total Outstanding</th>
                  <th className="p-4">Overdue Dues</th>
                  <th className="p-4">Assigned Recovery Officer</th>
                  <th className="p-4">Latest Interaction / Notice</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">Loading delinquent portfolio...</td>
                  </tr>
                ) : filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No delinquent accounts found matching current criteria.
                    </td>
                  </tr>
                ) : (
                  filteredAccounts.map(a => {
                    const borrower = `${a.customer?.title || 'Shri'} ${a.customer?.firstName} ${a.customer?.lastName}`;
                    return (
                      <tr key={a.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-4">
                          <p className="font-bold text-slate-900 text-sm">{a.loanAccountNumber}</p>
                          <p className="text-slate-600 font-medium">{borrower}</p>
                          <p className="text-[10px] text-slate-400">{a.loanProduct?.name} • Ph: {a.customer?.phone}</p>
                        </td>

                        <td className="p-4">
                          <div className="space-y-1">
                            <div>{getBucketBadge(a.assetClassification)}</div>
                            <p className="text-[11px] font-bold text-red-700">
                              DPD: {a.dpd} Days
                            </p>
                          </div>
                        </td>

                        <td className="p-4">
                          <p className="font-bold text-slate-900">₹{Number(a.principalOutstanding).toLocaleString()}</p>
                          <p className="text-[10px] text-slate-400">Sanctioned: ₹{Number(a.sanctionedAmount).toLocaleString()}</p>
                        </td>

                        <td className="p-4">
                          <p className="font-bold text-red-700">₹{Number(a.totalOverdue || 0).toLocaleString()}</p>
                          <p className="text-[10px] text-slate-500">
                            Pr: ₹{(a.overduePrincipal || 0).toLocaleString()} • Int: ₹{(a.overdueInterest || 0).toLocaleString()}
                          </p>
                          {a.overduePenalty > 0 && (
                            <p className="text-[10px] text-amber-600 font-medium">
                              Penalty: ₹{a.overduePenalty.toLocaleString()}
                            </p>
                          )}
                        </td>

                        <td className="p-4">
                          <select
                            value={a.assignedCollectorId || ''}
                            onChange={e => handleAssignCollector(a.id, e.target.value)}
                            className="text-xs bg-white border border-slate-300 rounded-lg px-2 py-1 focus:ring-1 focus:ring-red-500 focus:outline-none"
                          >
                            <option value="">-- Unassigned --</option>
                            {officers.map(o => (
                              <option key={o.id} value={o.id}>
                                {o.fullName} ({o.role?.code})
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="p-4">
                          {a.latestAction ? (
                            <div className="text-[11px] space-y-0.5">
                              <p className="font-semibold text-slate-800 flex items-center">
                                <PhoneCall className="w-3 h-3 mr-1 text-slate-400" />
                                {a.latestAction.actionType} ({a.latestAction.actionDate})
                              </p>
                              <p className="text-slate-500 truncate max-w-xs italic">"{a.latestAction.notes}"</p>
                              {a.latestAction.promisedPaymentDate && (
                                <span className="text-[10px] bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded font-medium">
                                  PTP: {a.latestAction.promisedPaymentDate}
                                </span>
                              )}
                            </div>
                          ) : a.latestNotice ? (
                            <div className="text-[11px]">
                              <p className="font-semibold text-red-800">{a.latestNotice.noticeNumber}</p>
                              <p className="text-slate-500">{a.latestNotice.noticeType} ({a.latestNotice.deliveryStatus})</p>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">No action yet</span>
                          )}
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex justify-end space-x-1.5">
                            <button
                              onClick={() => setSelectedLoanForAction(a)}
                              title="Log Field Visit / Call"
                              className="bg-amber-50 hover:bg-amber-100 text-amber-800 p-2 rounded-lg font-semibold transition flex items-center space-x-1"
                            >
                              <MapPin className="w-3.5 h-3.5" />
                              <span>Log Visit</span>
                            </button>

                            <button
                              onClick={() => setSelectedLoanForNotice(a)}
                              title="Issue Legal / Demand Notice"
                              className="bg-red-50 hover:bg-red-100 text-red-800 p-2 rounded-lg font-semibold transition flex items-center space-x-1"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Notice</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: NOTICE REGISTER */}
      {activeTab === 'notices' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Official Legal & Statutory Demand Notices Register
            </h3>
            <span className="text-xs text-slate-400">Total Issued: {notices.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-4">Notice Ref & Date</th>
                  <th className="p-4">Notice Category</th>
                  <th className="p-4">Borrower & Loan Account</th>
                  <th className="p-4">Demanded Dues</th>
                  <th className="p-4">Dispatch Medium & Ref</th>
                  <th className="p-4">Delivery Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {notices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">No notices generated yet.</td>
                  </tr>
                ) : (
                  notices.map(n => (
                    <tr key={n.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-4">
                        <p className="font-bold text-slate-900">{n.noticeNumber}</p>
                        <p className="text-[10px] text-slate-400">{n.generatedDate}</p>
                      </td>
                      <td className="p-4">
                        <span className="bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded text-[10px]">
                          {n.noticeType}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-800">
                          {n.loanAccount?.customer?.firstName} {n.loanAccount?.customer?.lastName}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {n.loanAccount?.loanAccountNumber} • {n.loanAccount?.branch?.name}
                        </p>
                      </td>
                      <td className="p-4 font-bold text-red-700">
                        ₹{Number(n.dueAmount).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-slate-700">{n.dispatchMedium}</p>
                        <p className="text-[10px] text-slate-400">{n.dispatchRef || 'Pending Tracking #'}</p>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          n.deliveryStatus === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : n.deliveryStatus === 'DISPATCHED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {n.deliveryStatus}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => window.print()}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 inline-flex"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Print</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PROVISIONING SUMMARY */}
      {activeTab === 'provisioning' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              RBI Master Directions / State Co-operative Societies IRAC Provisioning Model
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Statutory reserve provisioning calculated against active loan assets based on Days-Past-Due (DPD).
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3 border-r border-slate-200">Asset Category</th>
                  <th className="p-3 border-r border-slate-200">DPD Aging Criteria</th>
                  <th className="p-3 border-r border-slate-200 text-center">Accounts</th>
                  <th className="p-3 border-r border-slate-200 text-right">Outstanding Portfolio (₹)</th>
                  <th className="p-3 border-r border-slate-200 text-center">Prescribed Provision %</th>
                  <th className="p-3 text-right">Required Provision Reserve (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-3 font-semibold text-emerald-800 border-r border-slate-200">Standard (Regular)</td>
                  <td className="p-3 border-r border-slate-200">0 DPD</td>
                  <td className="p-3 text-center border-r border-slate-200">{dashboard?.bucketCounts?.STANDARD || 0}</td>
                  <td className="p-3 text-right border-r border-slate-200 font-medium">₹{(dashboard?.bucketAmounts?.STANDARD || 0).toLocaleString()}</td>
                  <td className="p-3 text-center border-r border-slate-200 font-bold">0.40%</td>
                  <td className="p-3 text-right font-bold text-emerald-700">₹{Math.round((dashboard?.bucketAmounts?.STANDARD || 0) * 0.004).toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-blue-800 border-r border-slate-200">SMA-0 (Watchlist)</td>
                  <td className="p-3 border-r border-slate-200">1 - 30 DPD</td>
                  <td className="p-3 text-center border-r border-slate-200">{dashboard?.bucketCounts?.SMA_0 || 0}</td>
                  <td className="p-3 text-right border-r border-slate-200 font-medium">₹{(dashboard?.bucketAmounts?.SMA_0 || 0).toLocaleString()}</td>
                  <td className="p-3 text-center border-r border-slate-200 font-bold">0.40%</td>
                  <td className="p-3 text-right font-bold text-blue-700">₹{Math.round((dashboard?.bucketAmounts?.SMA_0 || 0) * 0.004).toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-amber-800 border-r border-slate-200">SMA-1 (Moderate Risk)</td>
                  <td className="p-3 border-r border-slate-200">31 - 60 DPD</td>
                  <td className="p-3 text-center border-r border-slate-200">{dashboard?.bucketCounts?.SMA_1 || 0}</td>
                  <td className="p-3 text-right border-r border-slate-200 font-medium">₹{(dashboard?.bucketAmounts?.SMA_1 || 0).toLocaleString()}</td>
                  <td className="p-3 text-center border-r border-slate-200 font-bold">0.40%</td>
                  <td className="p-3 text-right font-bold text-amber-700">₹{Math.round((dashboard?.bucketAmounts?.SMA_1 || 0) * 0.004).toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-orange-800 border-r border-slate-200">SMA-2 (High Overdue)</td>
                  <td className="p-3 border-r border-slate-200">61 - 90 DPD</td>
                  <td className="p-3 text-center border-r border-slate-200">{dashboard?.bucketCounts?.SMA_2 || 0}</td>
                  <td className="p-3 text-right border-r border-slate-200 font-medium">₹{(dashboard?.bucketAmounts?.SMA_2 || 0).toLocaleString()}</td>
                  <td className="p-3 text-center border-r border-slate-200 font-bold">0.40%</td>
                  <td className="p-3 text-right font-bold text-orange-700">₹{Math.round((dashboard?.bucketAmounts?.SMA_2 || 0) * 0.004).toLocaleString()}</td>
                </tr>
                <tr className="bg-red-50/50">
                  <td className="p-3 font-bold text-red-800 border-r border-slate-200">Sub-Standard (NPA &le; 12 mo)</td>
                  <td className="p-3 border-r border-slate-200">91 - 455 DPD</td>
                  <td className="p-3 text-center border-r border-slate-200 font-bold">{dashboard?.bucketCounts?.SUB_STANDARD || 0}</td>
                  <td className="p-3 text-right border-r border-slate-200 font-bold">₹{(dashboard?.bucketAmounts?.SUB_STANDARD || 0).toLocaleString()}</td>
                  <td className="p-3 text-center border-r border-slate-200 font-bold text-red-800">10.0%</td>
                  <td className="p-3 text-right font-bold text-red-700">₹{Math.round((dashboard?.bucketAmounts?.SUB_STANDARD || 0) * 0.10).toLocaleString()}</td>
                </tr>
                <tr className="bg-purple-50/50">
                  <td className="p-3 font-bold text-purple-800 border-r border-slate-200">Doubtful (D1 / D2 / D3)</td>
                  <td className="p-3 border-r border-slate-200">&gt; 455 DPD</td>
                  <td className="p-3 text-center border-r border-slate-200 font-bold">
                    {(dashboard?.bucketCounts?.DOUBTFUL_1 || 0) + (dashboard?.bucketCounts?.DOUBTFUL_2 || 0) + (dashboard?.bucketCounts?.DOUBTFUL_3 || 0)}
                  </td>
                  <td className="p-3 text-right border-r border-slate-200 font-bold">
                    ₹{((dashboard?.bucketAmounts?.DOUBTFUL_1 || 0) + (dashboard?.bucketAmounts?.DOUBTFUL_2 || 0) + (dashboard?.bucketAmounts?.DOUBTFUL_3 || 0)).toLocaleString()}
                  </td>
                  <td className="p-3 text-center border-r border-slate-200 font-bold text-purple-800">20% - 100%</td>
                  <td className="p-3 text-right font-bold text-purple-800">
                    ₹{Math.round(((dashboard?.bucketAmounts?.DOUBTFUL_1 || 0) + (dashboard?.bucketAmounts?.DOUBTFUL_2 || 0)) * 0.25).toLocaleString()}
                  </td>
                </tr>
                <tr className="bg-slate-100 font-extrabold text-slate-900">
                  <td className="p-3 border-r border-slate-200" colSpan={2}>TOTAL STATUTORY PROVISIONING RESERVE REQUIRED</td>
                  <td className="p-3 text-center border-r border-slate-200">{dashboard?.totalLoans || 0}</td>
                  <td className="p-3 text-right border-r border-slate-200">₹{Number(dashboard?.totalGrossPortfolio || 0).toLocaleString()}</td>
                  <td className="p-3 text-center border-r border-slate-200">—</td>
                  <td className="p-3 text-right text-red-900 text-sm">₹{Number(dashboard?.totalProvisionReserve || 0).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedLoanForAction && (
        <RecoveryActionModal
          isOpen={!!selectedLoanForAction}
          onClose={() => setSelectedLoanForAction(null)}
          onActionLogged={fetchData}
          loan={selectedLoanForAction}
        />
      )}

      {selectedLoanForNotice && (
        <GenerateNoticeModal
          isOpen={!!selectedLoanForNotice}
          onClose={() => setSelectedLoanForNotice(null)}
          onNoticeGenerated={fetchData}
          loan={selectedLoanForNotice}
        />
      )}
    </div>
  );
};
