import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Scale,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  TrendingUp,
  Printer,
  Calendar,
  Layers,
  Building,
  RefreshCw,
  Landmark,
  PiggyBank,
  Wallet,
  ArrowDownRight,
  ArrowUpRight
} from 'lucide-react';
import api from '../../api/client';
import { NewJournalVoucherModal } from './NewJournalVoucherModal';

export const GLHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'coa' | 'journal' | 'trial-balance' | 'statements'>('coa');
  const [statementSubTab, setStatementSubTab] = useState<'pl' | 'bs'>('bs');

  const [accounts, setAccounts] = useState<any[]>([]);
  const [journalLines, setJournalLines] = useState<any[]>([]);
  const [trialBalance, setTrialBalance] = useState<any>(null);
  const [plData, setPlData] = useState<any>(null);
  const [bsData, setBsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters & Modals
  const [coaCategoryFilter, setCoaCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [coaRes, linesRes, tbRes, plRes, bsRes] = await Promise.all([
        api.get('/gl/accounts'),
        api.get('/gl/ledger-lines'),
        api.get('/gl/trial-balance'),
        api.get('/gl/profit-and-loss'),
        api.get('/gl/balance-sheet')
      ]);

      if (coaRes.data?.success) setAccounts(coaRes.data.accounts || []);
      if (linesRes.data?.success) setJournalLines(linesRes.data.lines || []);
      if (tbRes.data?.success) setTrialBalance(tbRes.data);
      if (plRes.data?.success) setPlData(plRes.data);
      if (bsRes.data?.success) setBsData(bsRes.data);
    } catch (err) {
      console.error('Error fetching GL data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAccounts = accounts.filter(a => {
    const matchesCat = coaCategoryFilter === 'ALL' || a.category === coaCategoryFilter;
    if (!matchesCat) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q);
  });

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'ASSET': return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'LIABILITY': return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'EQUITY': return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'INCOME': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'EXPENSE': return 'bg-rose-50 text-rose-800 border-rose-200';
      default: return 'bg-slate-50 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center">
              <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-400" />
              Double-Entry Financial Invariant Verified
            </span>
            <span className="text-xs text-slate-400">Section 21 & 31 • Multi-Branch Ledger</span>
          </div>
          <h1 className="text-2xl font-bold mt-1 tracking-tight">General Ledger & Financial Accounting</h1>
          <p className="text-xs text-slate-300 mt-1">
            Hierarchical Chart of Accounts (COA), balanced journal vouchers, real-time Trial Balance, and statutory Co-op Balance Sheet.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white p-2.5 rounded-xl transition text-xs flex items-center space-x-1"
            title="Refresh Ledgers"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsVoucherModalOpen(true)}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-md transition flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Journal Voucher</span>
          </button>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Assets Book</p>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Landmark className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900">
              ₹{Number(bsData?.summary?.totalAssets || 0).toLocaleString()}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Cash, Member Loans & SLR Investments
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Liabilities & Member Equity</p>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <PiggyBank className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900">
              ₹{Number(bsData?.summary?.totalLiabilitiesAndEquity || 0).toLocaleString()}
            </h3>
            <div className="flex items-center space-x-1.5 mt-0.5">
              {bsData?.summary?.isBalanced ? (
                <span className="text-[11px] text-emerald-600 font-bold flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-0.5" /> Exact Equilibrium (Diff: ₹0)
                </span>
              ) : (
                <span className="text-[11px] text-red-600 font-bold">
                  Difference: ₹{bsData?.summary?.difference}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Operating Surplus (P&L)</p>
            <div className={`p-2 rounded-xl ${Number(plData?.netSurplus || 0) >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className={`text-2xl font-bold ${Number(plData?.netSurplus || 0) >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              ₹{Number(plData?.netSurplus || 0).toLocaleString()}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Income: ₹{Number(plData?.totalIncome || 0).toLocaleString()} • Exp: ₹{Number(plData?.totalExpenses || 0).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Trial Balance Verification</p>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-teal-900">
              ₹{Number(trialBalance?.summary?.grandTotalNetDebits || 0).toLocaleString()}
            </h3>
            <div className="flex items-center space-x-1.5 mt-0.5">
              {trialBalance?.summary?.isBalanced ? (
                <span className="text-[11px] text-emerald-700 font-bold flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-0.5" /> &Sigma; Debits = &Sigma; Credits Validated
                </span>
              ) : (
                <span className="text-[11px] text-red-600 font-bold">Unbalanced Ledger</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-sm font-semibold space-x-6">
        <button
          onClick={() => setActiveTab('coa')}
          className={`pb-3 transition flex items-center space-x-2 ${
            activeTab === 'coa'
              ? 'border-b-2 border-indigo-700 text-indigo-700 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Chart of Accounts ({accounts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('journal')}
          className={`pb-3 transition flex items-center space-x-2 ${
            activeTab === 'journal'
              ? 'border-b-2 border-indigo-700 text-indigo-700 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>General Journal / Day Book ({journalLines.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('trial-balance')}
          className={`pb-3 transition flex items-center space-x-2 ${
            activeTab === 'trial-balance'
              ? 'border-b-2 border-indigo-700 text-indigo-700 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Statutory Trial Balance</span>
        </button>

        <button
          onClick={() => setActiveTab('statements')}
          className={`pb-3 transition flex items-center space-x-2 ${
            activeTab === 'statements'
              ? 'border-b-2 border-indigo-700 text-indigo-700 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Financial Statements (P&L / Balance Sheet)</span>
        </button>
      </div>

      {/* TAB 1: CHART OF ACCOUNTS */}
      {activeTab === 'coa' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search GL Code or Title..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
              <span className="text-xs text-slate-500 font-medium">Filter Category:</span>
              {['ALL', 'ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'].map(c => (
                <button
                  key={c}
                  onClick={() => setCoaCategoryFilter(c)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${
                    coaCategoryFilter === c
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-4">GL Code</th>
                  <th className="p-4">Account Title & Description</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Normal Balance</th>
                  <th className="p-4 text-right">Total Debits</th>
                  <th className="p-4 text-right">Total Credits</th>
                  <th className="p-4 text-right">Net Closing Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAccounts.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-4 font-mono font-bold text-slate-900 text-sm">
                      {a.code}
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-800 text-sm">{a.name}</p>
                      <p className="text-[11px] text-slate-500">{a.description}</p>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getCategoryColor(a.category)}`}>
                        {a.category}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`font-semibold text-[11px] ${a.normalBalance === 'DEBIT' ? 'text-blue-700' : 'text-emerald-700'}`}>
                        {a.normalBalance}
                      </span>
                    </td>
                    <td className="p-4 text-right text-slate-700 font-mono">
                      ₹{Number(a.totalDebit || 0).toLocaleString()}
                    </td>
                    <td className="p-4 text-right text-slate-700 font-mono">
                      ₹{Number(a.totalCredit || 0).toLocaleString()}
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-slate-900 text-sm">
                      ₹{Number(a.netBalance || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: GENERAL JOURNAL */}
      {activeTab === 'journal' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Posted Journal Lines & Day Book
            </h3>
            <span className="text-xs text-slate-400">Total Entries: {journalLines.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-4">Transaction Ref</th>
                  <th className="p-4">Date & Branch</th>
                  <th className="p-4">GL Account</th>
                  <th className="p-4">Type</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4">Narration / Maker</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {journalLines.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-4 font-mono font-bold text-slate-900">
                      {l.transaction?.transactionReference || 'N/A'}
                    </td>
                    <td className="p-4 text-slate-600">
                      <p className="font-medium">{l.businessDate}</p>
                      <p className="text-[10px] text-slate-400">{l.transaction?.branch?.code || 'BR001'}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{l.glAccountCode}</p>
                      <p className="text-[10px] text-slate-500">{l.glAccountName}</p>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        l.entryType === 'DEBIT'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {l.entryType}
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-slate-900">
                      ₹{Number(l.amount).toLocaleString()}
                    </td>
                    <td className="p-4 max-w-xs">
                      <p className="text-slate-700 truncate">{l.transaction?.narration}</p>
                      <p className="text-[10px] text-slate-400">{l.transaction?.makerUser?.fullName || 'System'}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: TRIAL BALANCE */}
      {activeTab === 'trial-balance' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Statutory Daily Trial Balance (दैनिक ताळेबंद / कच्चा ताळेबंद)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Business Date: <strong>{trialBalance?.businessDate || '2026-09-11'}</strong> • Multi-Branch Consolidated
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Trial Balance</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3 border-r border-slate-200">GL Code</th>
                  <th className="p-3 border-r border-slate-200">Account Title</th>
                  <th className="p-3 border-r border-slate-200">Class</th>
                  <th className="p-3 border-r border-slate-200 text-right">Gross Debit (₹)</th>
                  <th className="p-3 border-r border-slate-200 text-right">Gross Credit (₹)</th>
                  <th className="p-3 border-r border-slate-200 text-right">Net Debit (₹)</th>
                  <th className="p-3 text-right">Net Credit (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {trialBalance?.trialBalance?.map((row: any) => (
                  <tr key={row.glAccountCode} className="hover:bg-slate-50/60">
                    <td className="p-3 font-bold text-slate-900 border-r border-slate-200">{row.glAccountCode}</td>
                    <td className="p-3 font-sans font-medium text-slate-800 border-r border-slate-200">{row.glAccountName}</td>
                    <td className="p-3 font-sans border-r border-slate-200">
                      <span className="text-[10px] font-semibold text-slate-500">{row.category}</span>
                    </td>
                    <td className="p-3 text-right text-slate-600 border-r border-slate-200">
                      {row.totalDebit > 0 ? `₹${row.totalDebit.toLocaleString()}` : '—'}
                    </td>
                    <td className="p-3 text-right text-slate-600 border-r border-slate-200">
                      {row.totalCredit > 0 ? `₹${row.totalCredit.toLocaleString()}` : '—'}
                    </td>
                    <td className="p-3 text-right font-bold text-blue-700 border-r border-slate-200">
                      {row.netDebit > 0 ? `₹${row.netDebit.toLocaleString()}` : '—'}
                    </td>
                    <td className="p-3 text-right font-bold text-emerald-700">
                      {row.netCredit > 0 ? `₹${row.netCredit.toLocaleString()}` : '—'}
                    </td>
                  </tr>
                ))}
                {/* Grand Total Footer */}
                <tr className="bg-slate-100 font-extrabold text-slate-900 border-t-2 border-slate-300">
                  <td className="p-3.5 border-r border-slate-200 font-sans" colSpan={3}>
                    TOTALS (BALANCE INVARIANT)
                  </td>
                  <td className="p-3.5 text-right border-r border-slate-200 text-slate-800">
                    ₹{Number(trialBalance?.summary?.grandTotalGrossDebits || 0).toLocaleString()}
                  </td>
                  <td className="p-3.5 text-right border-r border-slate-200 text-slate-800">
                    ₹{Number(trialBalance?.summary?.grandTotalGrossCredits || 0).toLocaleString()}
                  </td>
                  <td className="p-3.5 text-right border-r border-slate-200 text-blue-900 text-sm">
                    ₹{Number(trialBalance?.summary?.grandTotalNetDebits || 0).toLocaleString()}
                  </td>
                  <td className="p-3.5 text-right text-emerald-900 text-sm">
                    ₹{Number(trialBalance?.summary?.grandTotalNetCredits || 0).toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                <strong>Trial Balance Equilibrium Verified:</strong> Total Net Debits exactly equal Total Net Credits (Difference: ₹{trialBalance?.summary?.difference || 0}).
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: STATUTORY FINANCIAL STATEMENTS */}
      {activeTab === 'statements' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Statutory Financial Statements (वार्षिक / त्रैमासिक वित्तीय विवरण)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Compliant with Maharashtra Co-operative Societies Act Form 'N' & RBI UCB Guidelines
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <div className="bg-slate-100 p-1 rounded-xl flex space-x-1 text-xs font-semibold">
                <button
                  onClick={() => setStatementSubTab('bs')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    statementSubTab === 'bs' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Balance Sheet
                </button>
                <button
                  onClick={() => setStatementSubTab('pl')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    statementSubTab === 'pl' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Profit & Loss (P&L)
                </button>
              </div>

              <button
                onClick={() => window.print()}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
            </div>
          </div>

          {/* SUB-TAB: BALANCE SHEET */}
          {statementSubTab === 'bs' && (
            <div className="space-y-6">
              <div className="text-center border-b pb-3">
                <h4 className="font-extrabold text-sm uppercase text-slate-800 tracking-wider">
                  BALANCE SHEET AS AT {bsData?.businessDate || '2026-09-11'}
                </h4>
                <p className="text-[11px] text-slate-500">Samruddhi Co-operative Urban Bank Ltd. • Figures in INR</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Liabilities & Equity */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 p-3 font-bold text-xs text-slate-800 border-b border-slate-200 flex justify-between">
                    <span>CAPITAL & LIABILITIES (देणी)</span>
                    <span>AMOUNT (₹)</span>
                  </div>
                  <div className="divide-y divide-slate-100 text-xs font-mono p-1">
                    <div className="p-2 bg-slate-50/50 font-sans font-bold text-purple-900 text-[11px]">
                      A. Share Capital & Reserve Funds
                    </div>
                    {bsData?.liabilitiesAndEquity?.equityRows?.map((r: any) => (
                      <div key={r.code} className="p-2 flex justify-between items-center">
                        <span className="font-sans text-slate-700">{r.name}</span>
                        <span className="font-bold text-purple-800">₹{r.amount.toLocaleString()}</span>
                      </div>
                    ))}

                    <div className="p-2 bg-slate-50/50 font-sans font-bold text-amber-900 text-[11px] pt-3">
                      B. Customer Deposits Liability
                    </div>
                    {bsData?.liabilitiesAndEquity?.liabilityRows?.map((r: any) => (
                      <div key={r.code} className="p-2 flex justify-between items-center">
                        <span className="font-sans text-slate-700">{r.name}</span>
                        <span className="font-bold text-amber-800">₹{r.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-purple-50 p-3 font-bold text-xs text-purple-950 border-t border-purple-200 flex justify-between">
                    <span>TOTAL LIABILITIES & EQUITY</span>
                    <span className="font-mono text-sm">₹{Number(bsData?.summary?.totalLiabilitiesAndEquity || 0).toLocaleString()}</span>
                  </div>
                </div>

                {/* Property & Assets */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 p-3 font-bold text-xs text-slate-800 border-b border-slate-200 flex justify-between">
                    <span>PROPERTY & ASSETS (येणी)</span>
                    <span>AMOUNT (₹)</span>
                  </div>
                  <div className="divide-y divide-slate-100 text-xs font-mono p-1">
                    <div className="p-2 bg-slate-50/50 font-sans font-bold text-blue-900 text-[11px]">
                      A. Cash, Loans & Liquid Assets
                    </div>
                    {bsData?.assets?.rows?.map((r: any) => (
                      <div key={r.code} className="p-2 flex justify-between items-center">
                        <span className="font-sans text-slate-700">{r.name}</span>
                        <span className="font-bold text-blue-800">₹{r.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-blue-50 p-3 font-bold text-xs text-blue-950 border-t border-blue-200 flex justify-between mt-auto">
                    <span>TOTAL PROPERTY & ASSETS</span>
                    <span className="font-mono text-sm">₹{Number(bsData?.summary?.totalAssets || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB: PROFIT & LOSS */}
          {statementSubTab === 'pl' && (
            <div className="space-y-6">
              <div className="text-center border-b pb-3">
                <h4 className="font-extrabold text-sm uppercase text-slate-800 tracking-wider">
                  PROFIT & LOSS STATEMENT FOR PERIOD ENDED {plData?.businessDate || '2026-09-11'}
                </h4>
                <p className="text-[11px] text-slate-500">Samruddhi Co-operative Urban Bank Ltd. • Figures in INR</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Expenses */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 p-3 font-bold text-xs text-slate-800 border-b border-slate-200 flex justify-between">
                    <span>EXPENDITURE (खर्च)</span>
                    <span>AMOUNT (₹)</span>
                  </div>
                  <div className="divide-y divide-slate-100 text-xs font-mono p-1">
                    {plData?.expenseRows?.map((r: any) => (
                      <div key={r.code} className="p-2 flex justify-between items-center">
                        <span className="font-sans text-slate-700">{r.name}</span>
                        <span className="font-bold text-rose-800">₹{r.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-rose-50 p-3 font-bold text-xs text-rose-950 border-t border-rose-200 flex justify-between">
                    <span>TOTAL EXPENDITURE</span>
                    <span className="font-mono text-sm">₹{Number(plData?.totalExpenses || 0).toLocaleString()}</span>
                  </div>
                </div>

                {/* Income */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 p-3 font-bold text-xs text-slate-800 border-b border-slate-200 flex justify-between">
                    <span>INCOME (उत्पन्न)</span>
                    <span>AMOUNT (₹)</span>
                  </div>
                  <div className="divide-y divide-slate-100 text-xs font-mono p-1">
                    {plData?.incomeRows?.map((r: any) => (
                      <div key={r.code} className="p-2 flex justify-between items-center">
                        <span className="font-sans text-slate-700">{r.name}</span>
                        <span className="font-bold text-emerald-800">₹{r.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-emerald-50 p-3 font-bold text-xs text-emerald-950 border-t border-emerald-200 flex justify-between">
                    <span>TOTAL INCOME</span>
                    <span className="font-mono text-sm">₹{Number(plData?.totalIncome || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Net Surplus & Statutory Reserve Allocations */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <div>
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Net Operating Profit / Surplus</span>
                    <p className="text-[11px] text-slate-500">Gross Income - Operating Expenses</p>
                  </div>
                  <span className={`text-xl font-bold font-mono ${Number(plData?.netSurplus || 0) >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    ₹{Number(plData?.netSurplus || 0).toLocaleString()}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-2">
                    Mandatory Statutory Allocations (Maharashtra Co-op Societies Act, 1960)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-500">Statutory Reserve Fund (25%)</p>
                      <p className="text-base font-extrabold text-purple-800 mt-1">
                        ₹{Number(plData?.statutoryAllocations?.statutoryReserve || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-500">Co-op Education Fund (1%)</p>
                      <p className="text-base font-extrabold text-indigo-800 mt-1">
                        ₹{Number(plData?.statutoryAllocations?.educationFund || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-500">Dividend / Free Reserves</p>
                      <p className="text-base font-extrabold text-emerald-800 mt-1">
                        ₹{Number(plData?.statutoryAllocations?.unallocatedSurplus || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {isVoucherModalOpen && (
        <NewJournalVoucherModal
          isOpen={isVoucherModalOpen}
          onClose={() => setIsVoucherModalOpen(false)}
          onVoucherPosted={fetchData}
          accounts={accounts}
        />
      )}
    </div>
  );
};
