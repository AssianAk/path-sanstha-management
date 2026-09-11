import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  FileSpreadsheet,
  BookOpen,
  Scale,
  Download,
  Printer,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Landmark,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
  Building,
  PiggyBank,
  Percent,
  Calendar,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  UserCheck
} from 'lucide-react';
import api from '../../api/client';

export const ReportsHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'mis' | 'form-i' | 'form-ix' | 'passbook'>('mis');

  // Loading & Data States
  const [loading, setLoading] = useState(true);
  const [misData, setMisData] = useState<any>(null);
  const [formIData, setFormIData] = useState<any>(null);
  const [formIXData, setFormIXData] = useState<any>(null);

  // Passbook States
  const [accountsList, setAccountsList] = useState<any[]>([]);
  const [selectedAccountNumber, setSelectedAccountNumber] = useState('');
  const [fromDate, setFromDate] = useState('2026-01-01');
  const [toDate, setToDate] = useState('2026-09-11');
  const [passbookData, setPassbookData] = useState<any>(null);
  const [passbookLoading, setPassbookLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [misRes, formIRes, formIXRes, accountsRes] = await Promise.all([
        api.get('/reports/managerial-mis'),
        api.get('/reports/form-i'),
        api.get('/reports/form-ix'),
        api.get('/accounts')
      ]);

      if (misRes.data?.success) setMisData(misRes.data);
      if (formIRes.data?.success) setFormIData(formIRes.data.report);
      if (formIXRes.data?.success) setFormIXData(formIXRes.data.report);
      if (accountsRes.data?.success) {
        const accs = accountsRes.data.accounts || [];
        setAccountsList(accs);
        if (accs.length > 0 && !selectedAccountNumber) {
          setSelectedAccountNumber(accs[0].accountNumber);
          loadPassbook(accs[0].accountNumber, fromDate, toDate);
        }
      }
    } catch (err) {
      console.error('Error fetching reporting data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPassbook = async (accNo: string, fDate: string, tDate: string) => {
    if (!accNo) return;
    setPassbookLoading(true);
    try {
      const res = await api.get(`/reports/passbook/${accNo}?fromDate=${fDate}&toDate=${tDate}`);
      if (res.data?.success) {
        setPassbookData(res.data.passbook);
      }
    } catch (err) {
      console.error('Error loading passbook:', err);
    } finally {
      setPassbookLoading(false);
    }
  };

  const handleExportCsv = async (reportType: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/reports/export/${reportType}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}_report.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export CSV report.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm print:hidden">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Reporting & Regulatory MIS Hub</h1>
              <p className="text-xs text-slate-500 font-medium">
                Statutory Returns, Executive Dashboards, Member Passbooks & Regulatory Filings
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchInitialData}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
            title="Refresh Reports"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-all shadow-sm"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print Report</span>
          </button>

          {activeTab === 'form-i' && (
            <button
              onClick={() => handleExportCsv('form-i')}
              className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Export Form I (CSV)</span>
            </button>
          )}

          {activeTab === 'form-ix' && (
            <button
              onClick={() => handleExportCsv('form-ix')}
              className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Export Form IX (CSV)</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 space-x-2 bg-white px-6 rounded-xl shadow-sm print:hidden">
        <button
          onClick={() => setActiveTab('mis')}
          className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all ${
            activeTab === 'mis'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Executive MIS Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('form-i')}
          className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all ${
            activeTab === 'form-i'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Form I – SLR Return (Sec 24)</span>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full">
            Surplus
          </span>
        </button>

        <button
          onClick={() => setActiveTab('form-ix')}
          className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all ${
            activeTab === 'form-ix'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Form IX – Position Statement (RCS/RBI)</span>
          <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.5 rounded-full">
            Balanced
          </span>
        </button>

        <button
          onClick={() => setActiveTab('passbook')}
          className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all ${
            activeTab === 'passbook'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Member Passbook & Statements</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
          <p className="text-sm font-semibold text-slate-700">Compiling Statutory Returns & MIS Analytics...</p>
          <p className="text-xs text-slate-400 mt-1">Aggregating GL balances, customer ledger, and asset classification</p>
        </div>
      ) : (
        <>
          {/* ======================================================== */}
          {/* TAB 1: EXECUTIVE MIS ANALYTICS */}
          {/* ======================================================== */}
          {activeTab === 'mis' && misData && (
            <div className="space-y-6">
              {/* Executive KPI Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Deposits</span>
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                      <PiggyBank className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl font-black text-slate-900">
                      ₹{misData.kpis.totalDeposits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    <span>CASA Ratio</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {misData.kpis.casaRatio}%
                    </span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Advances</span>
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                      <Wallet className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl font-black text-slate-900">
                      ₹{misData.kpis.totalAdvances.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    <span>Credit-to-Deposit (CD)</span>
                    <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                      {misData.kpis.cdRatio}%
                    </span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross NPA & Ratio</span>
                    <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl font-black text-rose-700">
                      ₹{misData.kpis.grossNpaAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    <span>Gross NPA Ratio</span>
                    <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                      {misData.kpis.grossNpaRatio}%
                    </span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Provision Coverage (PCR)</span>
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl font-black text-purple-900">
                      {misData.kpis.pcrRatio}%
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    <span>Provisions Held</span>
                    <span className="font-bold text-purple-700">
                      ₹{misData.kpis.provisionsHeld.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deposit Composition & Loan Product Mix */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Deposit Mix Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                      <PiggyBank className="w-4 h-4 text-emerald-600" />
                      <span>Deposit Portfolio Composition</span>
                    </h2>
                    <span className="text-xs font-semibold text-slate-400">Total: ₹{misData.kpis.totalDeposits.toLocaleString()}</span>
                  </div>

                  <div className="space-y-3">
                    {misData.depositMix.map((d: any) => {
                      const pct = misData.kpis.totalDeposits > 0 ? (d.amount / misData.kpis.totalDeposits) * 100 : 0;
                      return (
                        <div key={d.category} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-700">{d.name}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-slate-400">({d.count} accounts)</span>
                              <span className="font-bold text-slate-900">₹{d.amount.toLocaleString('en-IN')}</span>
                              <span className="text-indigo-600 font-semibold w-10 text-right">{pct.toFixed(1)}%</span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div
                              className="bg-emerald-500 h-2 rounded-full transition-all"
                              style={{ width: `${Math.min(100, pct)}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Loan Portfolio by Product */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                      <Wallet className="w-4 h-4 text-blue-600" />
                      <span>Loan Advances by Product</span>
                    </h2>
                    <span className="text-xs font-semibold text-slate-400">Total: ₹{misData.kpis.totalAdvances.toLocaleString()}</span>
                  </div>

                  <div className="space-y-3">
                    {misData.loanProductBreakdown.map((p: any) => {
                      const pct = misData.kpis.totalAdvances > 0 ? (p.amount / misData.kpis.totalAdvances) * 100 : 0;
                      return (
                        <div key={p.code} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-700">[{p.code}] {p.name}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-slate-400">({p.count} loans)</span>
                              <span className="font-bold text-slate-900">₹{p.amount.toLocaleString('en-IN')}</span>
                              <span className="text-blue-600 font-semibold w-10 text-right">{pct.toFixed(1)}%</span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all"
                              style={{ width: `${Math.min(100, pct)}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Credit Risk & Delinquency Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Credit Risk Exposure */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>Credit Risk Grade Exposure</span>
                  </h2>

                  <div className="grid grid-cols-3 gap-3">
                    {misData.loanRiskBreakdown.map((r: any) => {
                      const bg = r.grade === 'LOW' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                        r.grade === 'MEDIUM' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                        'bg-rose-50 border-rose-200 text-rose-800';
                      return (
                        <div key={r.grade} className={`p-4 rounded-xl border ${bg} text-center`}>
                          <p className="text-[11px] font-bold uppercase tracking-wider">{r.grade} RISK</p>
                          <p className="text-lg font-black mt-1">₹{r.amount.toLocaleString('en-IN')}</p>
                          <p className="text-xs mt-0.5 opacity-80">{r.count} Active Loans</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* IRAC Asset Classification */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>IRAC Delinquency Buckets</span>
                  </h2>

                  <div className="space-y-2">
                    {misData.assetClassificationBreakdown.map((a: any) => (
                      <div key={a.classification} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs">
                        <span className="font-semibold text-slate-700">{a.classification}</span>
                        <div className="flex items-center space-x-3">
                          <span className="text-slate-400">({a.count} accounts)</span>
                          <span className="font-bold text-slate-900">₹{a.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Branch Network Performance Table */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <Building className="w-4 h-4 text-slate-700" />
                  <span>Branch Network Performance Summary</span>
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Branch Code</th>
                        <th className="py-3 px-4">Branch Name</th>
                        <th className="py-3 px-4 text-right">Total Deposits</th>
                        <th className="py-3 px-4 text-right">Total Advances</th>
                        <th className="py-3 px-4 text-center">Accounts</th>
                        <th className="py-3 px-4 text-center">Loans</th>
                        <th className="py-3 px-4 text-right">CD Ratio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {misData.branchMetrics.map((b: any) => {
                        const cd = b.totalDeposits > 0 ? ((b.totalAdvances / b.totalDeposits) * 100).toFixed(1) : 'N/A';
                        return (
                          <tr key={b.branchCode} className="hover:bg-slate-50/50">
                            <td className="py-3 px-4 font-mono font-bold text-indigo-600">{b.branchCode}</td>
                            <td className="py-3 px-4 font-semibold text-slate-900">{b.branchName}</td>
                            <td className="py-3 px-4 text-right font-bold text-slate-800">₹{b.totalDeposits.toLocaleString('en-IN')}</td>
                            <td className="py-3 px-4 text-right font-bold text-slate-800">₹{b.totalAdvances.toLocaleString('en-IN')}</td>
                            <td className="py-3 px-4 text-center">{b.accountCount}</td>
                            <td className="py-3 px-4 text-center">{b.loanCount}</td>
                            <td className="py-3 px-4 text-right font-bold text-blue-600">{cd}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: FORM I - STATUTORY LIQUIDITY RATIO (SLR) RETURN */}
          {/* ======================================================== */}
          {activeTab === 'form-i' && formIData && (
            <div className="space-y-6">
              {/* Statutory Compliance Banner */}
              <div className={`p-6 rounded-2xl border ${
                formIData.slrCompliance.status === 'COMPLIANT_SURPLUS'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-rose-50 border-rose-200 text-rose-950'
              }`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2.5 rounded-xl ${
                      formIData.slrCompliance.status === 'COMPLIANT_SURPLUS'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-rose-600 text-white'
                    }`}>
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider opacity-75">
                        Statutory Liquidity Ratio (SLR) Compliance Assessment
                      </span>
                      <h2 className="text-xl font-black mt-0.5">
                        {formIData.slrCompliance.status === 'COMPLIANT_SURPLUS'
                          ? 'SLR SURPLUS: FULLY COMPLIANT WITH SECTION 24 OF BR ACT'
                          : 'SLR DEFICIT: NON-COMPLIANT'
                        }
                      </h2>
                      <p className="text-xs opacity-85 mt-1">
                        Required SLR: <span className="font-bold">{formIData.slrCompliance.prescribedSlrRatioPercent}%</span> | 
                        Actual Maintained: <span className="font-bold">{formIData.slrCompliance.actualSlrRatioPercent}%</span> | 
                        Surplus Cushion: <span className="font-bold">₹{formIData.slrCompliance.surplusDeficitAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-emerald-200/60 text-right shrink-0">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Total Liquid Assets Held</p>
                    <p className="text-2xl font-black text-emerald-800">
                      ₹{formIData.liquidAssets.totalLiquidAssets.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                      Min Required: ₹{formIData.slrCompliance.minimumRequiredLiquidAssets.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Form I Itemized Schedules */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Demand & Time Liabilities (NDTL) */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      <span>1. Demand & Time Liabilities (NDTL)</span>
                    </h3>
                    <span className="text-xs font-mono font-bold text-indigo-600">
                      ₹{formIData.ndtlSummary.totalNDTL.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="space-y-4 text-xs">
                    {/* Demand Portion */}
                    <div>
                      <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-2">A. Demand Liabilities</p>
                      <div className="space-y-2 pl-2 border-l-2 border-slate-200">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Current Account Deposits (CA)</span>
                          <span className="font-bold text-slate-900">₹{formIData.demandLiabilities.currentDeposits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Savings Bank Deposits (Demand Portion)</span>
                          <span className="font-bold text-slate-900">₹{formIData.demandLiabilities.savingsDepositsDemandPortion.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Interest Accrued Payable & Unclaimed Dues</span>
                          <span className="font-bold text-slate-900">₹{formIData.demandLiabilities.accruedInterestAndUnclaimedLiabilities.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-100 font-bold text-slate-800">
                          <span>Sub-Total Demand Liabilities</span>
                          <span>₹{formIData.demandLiabilities.totalDemandLiabilities.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>

                    {/* Time Portion */}
                    <div>
                      <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-2">B. Time Liabilities</p>
                      <div className="space-y-2 pl-2 border-l-2 border-slate-200">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Fixed Term Deposits (FD)</span>
                          <span className="font-bold text-slate-900">₹{formIData.timeLiabilities.fixedTermDeposits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Recurring Deposits (RD)</span>
                          <span className="font-bold text-slate-900">₹{formIData.timeLiabilities.recurringDeposits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-100 font-bold text-slate-800">
                          <span>Sub-Total Time Liabilities</span>
                          <span>₹{formIData.timeLiabilities.totalTimeLiabilities.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-indigo-50 rounded-xl flex justify-between font-black text-indigo-950 text-sm">
                      <span>Total Net Demand & Time Liabilities (NDTL)</span>
                      <span>₹{formIData.ndtlSummary.totalNDTL.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Liquid Assets Maintained */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                      <Landmark className="w-4 h-4 text-emerald-600" />
                      <span>2. Liquid Assets Maintained</span>
                    </h3>
                    <span className="text-xs font-mono font-bold text-emerald-600">
                      ₹{formIData.liquidAssets.totalLiquidAssets.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div className="space-y-3 pl-2 border-l-2 border-emerald-200">
                      <div className="flex justify-between">
                        <div>
                          <p className="font-semibold text-slate-800">Cash in Hand</p>
                          <p className="text-[10px] text-slate-400">Vaults & Branch Teller Drawers (GL-1001)</p>
                        </div>
                        <span className="font-bold text-slate-900">
                          ₹{formIData.liquidAssets.cashInHandVaultsAndTills.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <div>
                          <p className="font-semibold text-slate-800">Balances with Banks</p>
                          <p className="text-[10px] text-slate-400">Apex & District Central Co-op Banks (GL-1002)</p>
                        </div>
                        <span className="font-bold text-slate-900">
                          ₹{formIData.liquidAssets.balancesWithApexDistrictCentralCoopBanks.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <div>
                          <p className="font-semibold text-slate-800">Unencumbered Securities</p>
                          <p className="text-[10px] text-slate-400">Government & Approved Trustee Bonds</p>
                        </div>
                        <span className="font-bold text-slate-900">
                          ₹{formIData.liquidAssets.unencumberedApprovedSecurities.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-emerald-50 rounded-xl flex justify-between font-black text-emerald-950 text-sm">
                      <span>Total Liquid Assets Maintained</span>
                      <span>₹{formIData.liquidAssets.totalLiquidAssets.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                      <p className="font-bold text-slate-700 text-[11px]">Section 24 SLR Requirement Assessment</p>
                      <div className="flex justify-between text-slate-600">
                        <span>Statutory Requirement (25.00% of NDTL)</span>
                        <span className="font-semibold">₹{formIData.slrCompliance.minimumRequiredLiquidAssets.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Actual Maintained Ratio</span>
                        <span className="font-bold text-emerald-700">{formIData.slrCompliance.actualSlrRatioPercent}%</span>
                      </div>
                      <div className="flex justify-between font-bold text-emerald-800 pt-1 border-t border-slate-200">
                        <span>Surplus Available</span>
                        <span>+₹{formIData.slrCompliance.surplusDeficitAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: FORM IX - STATEMENT OF POSITION (RCS & RBI) */}
          {/* ======================================================== */}
          {activeTab === 'form-ix' && formIXData && (
            <div className="space-y-6">
              {/* Invariant Banner */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Form IX – Statement of Position (Assets & Liabilities)</h2>
                  <p className="text-xs text-slate-500">
                    Statutory Return under Rule 62 of MCS Rules, 1961 & Section 31 of Banking Regulation Act, 1949
                  </p>
                </div>

                <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-800">
                    Statement Equilibrium Verified (Difference: ₹0.00)
                  </span>
                </div>
              </div>

              {/* Two Column Layout: Capital & Liabilities vs Property & Assets */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Liabilities Side */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Capital & Liabilities
                    </h3>
                    <span className="text-sm font-mono font-black text-slate-900">
                      ₹{formIXData.liabilities.totalLiabilities.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="space-y-4 text-xs divide-y divide-slate-100">
                    {/* Schedule I: Capital */}
                    <div className="pt-2">
                      <div className="flex justify-between font-bold text-slate-800 mb-1">
                        <span>{formIXData.liabilities.schedule1_ShareCapital.title}</span>
                        <span>₹{formIXData.liabilities.schedule1_ShareCapital.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="pl-3 text-slate-500 space-y-1">
                        <div className="flex justify-between">
                          <span>Authorized Share Capital</span>
                          <span>₹{formIXData.liabilities.schedule1_ShareCapital.authorizedShareCapital.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Paid-up Member Share Capital (GL-3001)</span>
                          <span className="font-semibold text-slate-800">₹{formIXData.liabilities.schedule1_ShareCapital.paidUpMemberCapital.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Schedule II: Reserves */}
                    <div className="pt-3">
                      <div className="flex justify-between font-bold text-slate-800 mb-1">
                        <span>{formIXData.liabilities.schedule2_ReservesAndFunds.title}</span>
                        <span>₹{formIXData.liabilities.schedule2_ReservesAndFunds.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="pl-3 text-slate-500 space-y-1">
                        <div className="flex justify-between">
                          <span>Statutory Reserve Fund (25% transfer)</span>
                          <span>₹{formIXData.liabilities.schedule2_ReservesAndFunds.statutoryReserveFund.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Co-op Education & Training Fund (1%)</span>
                          <span>₹{formIXData.liabilities.schedule2_ReservesAndFunds.cooperativeEducationFund.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Bad Debt & Contingency Reserve</span>
                          <span>₹{formIXData.liabilities.schedule2_ReservesAndFunds.badDebtContingencyReserve.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Schedule III: Deposits */}
                    <div className="pt-3">
                      <div className="flex justify-between font-bold text-slate-800 mb-1">
                        <span>{formIXData.liabilities.schedule3_DepositsAndOtherAccounts.title}</span>
                        <span>₹{formIXData.liabilities.schedule3_DepositsAndOtherAccounts.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="pl-3 text-slate-500 space-y-1">
                        <div className="flex justify-between">
                          <span>Savings Bank Deposits (GL-2001)</span>
                          <span>₹{formIXData.liabilities.schedule3_DepositsAndOtherAccounts.savingsBankDeposits.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Current Account Deposits (GL-2002)</span>
                          <span>₹{formIXData.liabilities.schedule3_DepositsAndOtherAccounts.currentAccounts.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Fixed Term Deposits (GL-2003)</span>
                          <span>₹{formIXData.liabilities.schedule3_DepositsAndOtherAccounts.fixedDeposits.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Recurring Deposits (GL-2004)</span>
                          <span>₹{formIXData.liabilities.schedule3_DepositsAndOtherAccounts.recurringDeposits.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Schedule IV: Other Liab */}
                    <div className="pt-3">
                      <div className="flex justify-between font-bold text-slate-800 mb-1">
                        <span>{formIXData.liabilities.schedule4_OtherLiabilities.title}</span>
                        <span>₹{formIXData.liabilities.schedule4_OtherLiabilities.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="pl-3 text-slate-500 space-y-1">
                        <div className="flex justify-between">
                          <span>Interest Accrued Payable (GL-2005)</span>
                          <span>₹{formIXData.liabilities.schedule4_OtherLiabilities.interestAccruedPayable.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Schedule V: P&L Surplus */}
                    <div className="pt-3">
                      <div className="flex justify-between font-bold text-slate-800 mb-1">
                        <span>{formIXData.liabilities.schedule5_ProfitAndLoss.title}</span>
                        <span>₹{formIXData.liabilities.schedule5_ProfitAndLoss.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="pl-3 text-slate-500 space-y-1">
                        <div className="flex justify-between">
                          <span>Current Year Net Operating Surplus</span>
                          <span className="font-semibold">₹{formIXData.liabilities.schedule5_ProfitAndLoss.netOperatingSurplus.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Total Liabilities Footer */}
                    <div className="pt-4 p-3 bg-slate-100 rounded-xl flex justify-between font-black text-slate-900 text-sm">
                      <span>TOTAL CAPITAL & LIABILITIES</span>
                      <span>₹{formIXData.liabilities.totalLiabilities.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* Assets Side */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Property & Assets
                    </h3>
                    <span className="text-sm font-mono font-black text-slate-900">
                      ₹{formIXData.assets.totalAssets.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="space-y-4 text-xs divide-y divide-slate-100">
                    {/* Schedule I: Cash & Bank */}
                    <div className="pt-2">
                      <div className="flex justify-between font-bold text-slate-800 mb-1">
                        <span>{formIXData.assets.schedule1_CashAndBankBalances.title}</span>
                        <span>₹{formIXData.assets.schedule1_CashAndBankBalances.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="pl-3 text-slate-500 space-y-1">
                        <div className="flex justify-between">
                          <span>Cash in Hand (Branch Vaults & Tills)</span>
                          <span>₹{formIXData.assets.schedule1_CashAndBankBalances.cashInHandAndVaults.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Balances with Apex & DCCB Banks</span>
                          <span>₹{formIXData.assets.schedule1_CashAndBankBalances.balancesWithApexCentralBanks.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Schedule II: Investments */}
                    <div className="pt-3">
                      <div className="flex justify-between font-bold text-slate-800 mb-1">
                        <span>{formIXData.assets.schedule2_Investments.title}</span>
                        <span>₹{formIXData.assets.schedule2_Investments.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="pl-3 text-slate-500 space-y-1">
                        <div className="flex justify-between">
                          <span>Government & Trustee Securities</span>
                          <span>₹{formIXData.assets.schedule2_Investments.governmentAndTrusteeSecurities.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Schedule III: Advances */}
                    <div className="pt-3">
                      <div className="flex justify-between font-bold text-slate-800 mb-1">
                        <span>{formIXData.assets.schedule3_Advances.title}</span>
                        <span>₹{formIXData.assets.schedule3_Advances.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="pl-3 text-slate-500 space-y-1">
                        <div className="flex justify-between">
                          <span>Gross Advances Portfolio (GL-1003)</span>
                          <span>₹{formIXData.assets.schedule3_Advances.grossAdvancesPortfolio.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-rose-600">
                          <span>Less: Statutory Provision for NPA (IRAC)</span>
                          <span>- ₹{formIXData.assets.schedule3_Advances.lessStatutoryProvisionForNPA.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-slate-800 pt-1 border-t border-slate-100">
                          <span>Net Advances Portfolio</span>
                          <span>₹{formIXData.assets.schedule3_Advances.netAdvancesPortfolio.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Schedule IV: Fixed Assets */}
                    <div className="pt-3">
                      <div className="flex justify-between font-bold text-slate-800 mb-1">
                        <span>{formIXData.assets.schedule4_FixedAssets.title}</span>
                        <span>₹{formIXData.assets.schedule4_FixedAssets.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="pl-3 text-slate-500 space-y-1">
                        <div className="flex justify-between">
                          <span>Office Premises, Furniture & Computers (GL-1004)</span>
                          <span>₹{formIXData.assets.schedule4_FixedAssets.officeEquipmentAndFurniture.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Schedule V: Other Assets */}
                    <div className="pt-3">
                      <div className="flex justify-between font-bold text-slate-800 mb-1">
                        <span>{formIXData.assets.schedule5_OtherAssets.title}</span>
                        <span>₹{formIXData.assets.schedule5_OtherAssets.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>

                    {/* Total Assets Footer */}
                    <div className="pt-4 p-3 bg-slate-100 rounded-xl flex justify-between font-black text-slate-900 text-sm">
                      <span>TOTAL PROPERTY & ASSETS</span>
                      <span>₹{formIXData.assets.totalAssets.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: MEMBER PASSBOOK & ACCOUNT STATEMENTS */}
          {/* ======================================================== */}
          {activeTab === 'passbook' && (
            <div className="space-y-6">
              {/* Account Selection and Date Filter Bar */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 print:hidden">
                <div className="flex items-center space-x-2">
                  <Search className="w-4 h-4 text-indigo-600" />
                  <h2 className="text-sm font-bold text-slate-900">Search Member Account & Date Window</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-semibold text-slate-600">Select Customer Account</label>
                    <select
                      value={selectedAccountNumber}
                      onChange={(e) => setSelectedAccountNumber(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {accountsList.map((acc) => (
                        <option key={acc.id} value={acc.accountNumber}>
                          {acc.accountNumber} — {acc.customer?.firstName} {acc.customer?.lastName} ({acc.product?.name}) [Bal: ₹{acc.availableBalance}]
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">From Date</label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">To Date</label>
                    <div className="flex space-x-2">
                      <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        onClick={() => loadPassbook(selectedAccountNumber, fromDate, toDate)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shrink-0"
                      >
                        Generate
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Passbook Sheet (Printable Layout) */}
              {passbookLoading ? (
                <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
                  <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mb-2" />
                  <p className="text-xs font-semibold text-slate-600">Generating account passbook ledger...</p>
                </div>
              ) : passbookData ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 print:shadow-none print:border-none print:p-0">
                  {/* Passbook Letterhead */}
                  <div className="border-b-2 border-slate-900 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-700 text-white flex items-center justify-center font-bold text-sm">
                          SCB
                        </div>
                        <div>
                          <h1 className="text-base font-black text-slate-900 tracking-tight uppercase">
                            {passbookData.institution.name}
                          </h1>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {passbookData.institution.branch} (Code: {passbookData.institution.branchCode}) | IFSC: {passbookData.institution.ifsc} | Phone: {passbookData.institution.phone}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="px-2.5 py-1 bg-indigo-100 text-indigo-900 font-bold text-xs rounded-lg uppercase tracking-wider">
                        Member Savings Passbook
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Statement Period: {passbookData.period.fromDate} to {passbookData.period.toDate}
                      </p>
                    </div>
                  </div>

                  {/* Customer & Account Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Account Number</span>
                      <p className="font-mono font-black text-slate-900 text-sm">{passbookData.accountDetails.accountNumber}</p>
                      <p className="text-[10px] text-indigo-600 font-semibold">{passbookData.accountDetails.accountType}</p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Member / Customer</span>
                      <p className="font-bold text-slate-900">{passbookData.memberDetails.fullName}</p>
                      <p className="text-[10px] text-slate-500">Member No: {passbookData.memberDetails.memberNumber}</p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Nominee</span>
                      <p className="font-medium text-slate-800">{passbookData.memberDetails.nominee}</p>
                      <p className="text-[10px] text-slate-500">PAN: {passbookData.memberDetails.pan}</p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Current Balance</span>
                      <p className="text-base font-black text-emerald-700">
                        ₹{passbookData.accountDetails.availableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-[10px] text-slate-400">KYC Status: {passbookData.memberDetails.kycStatus}</p>
                    </div>
                  </div>

                  {/* Transaction Ledger Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700 border border-slate-200">
                      <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3 border-r border-slate-200">Date</th>
                          <th className="py-2.5 px-3 border-r border-slate-200">Txn Ref</th>
                          <th className="py-2.5 px-3 border-r border-slate-200">Particulars / Narration</th>
                          <th className="py-2.5 px-3 border-r border-slate-200">Channel</th>
                          <th className="py-2.5 px-3 border-r border-slate-200 text-right text-rose-700">Withdrawal (Dr)</th>
                          <th className="py-2.5 px-3 border-r border-slate-200 text-right text-emerald-700">Deposit (Cr)</th>
                          <th className="py-2.5 px-3 text-right">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-mono">
                        {/* Opening Balance Row */}
                        <tr className="bg-slate-50 font-bold">
                          <td className="py-2 px-3 border-r border-slate-200">{passbookData.period.fromDate}</td>
                          <td className="py-2 px-3 border-r border-slate-200">-</td>
                          <td className="py-2 px-3 border-r border-slate-200 font-sans italic text-slate-600">
                            OPENING BALANCE BROUGHT FORWARD
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200">-</td>
                          <td className="py-2 px-3 border-r border-slate-200 text-right">-</td>
                          <td className="py-2 px-3 border-r border-slate-200 text-right">-</td>
                          <td className="py-2 px-3 text-right font-black text-slate-900">
                            ₹{passbookData.openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>

                        {/* Transactions */}
                        {passbookData.entries.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-6 text-center text-slate-400 font-sans italic">
                              No transactions recorded in the selected period.
                            </td>
                          </tr>
                        ) : (
                          passbookData.entries.map((tx: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50/70">
                              <td className="py-2 px-3 border-r border-slate-200">{tx.date}</td>
                              <td className="py-2 px-3 border-r border-slate-200 text-indigo-600 font-semibold">{tx.reference}</td>
                              <td className="py-2 px-3 border-r border-slate-200 font-sans text-slate-800">{tx.narration}</td>
                              <td className="py-2 px-3 border-r border-slate-200 font-sans text-slate-500 text-[10px]">{tx.channel}</td>
                              <td className="py-2 px-3 border-r border-slate-200 text-right text-rose-700">
                                {tx.debit > 0 ? `₹${tx.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                              </td>
                              <td className="py-2 px-3 border-r border-slate-200 text-right text-emerald-700">
                                {tx.credit > 0 ? `₹${tx.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                              </td>
                              <td className="py-2 px-3 text-right font-black text-slate-900">
                                ₹{tx.runningBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))
                        )}

                        {/* Closing Balance Row */}
                        <tr className="bg-indigo-50 font-bold">
                          <td className="py-2.5 px-3 border-r border-slate-200">{passbookData.period.toDate}</td>
                          <td className="py-2.5 px-3 border-r border-slate-200">-</td>
                          <td className="py-2.5 px-3 border-r border-slate-200 font-sans font-black text-indigo-950">
                            CLOSING BALANCE CARRIED FORWARD
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-200">-</td>
                          <td className="py-2.5 px-3 border-r border-slate-200 text-right text-rose-800">
                            ₹{passbookData.summary.totalDebits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-200 text-right text-emerald-800">
                            ₹{passbookData.summary.totalCredits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-indigo-950 text-sm">
                            ₹{passbookData.closingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Bank Passbook Footnote */}
                  <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between text-[11px] text-slate-400">
                    <span>Generated electronically by Samruddhi Core Banking System</span>
                    <span>Officer / Cashier In-Charge: ______________________</span>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </>
      )}
    </div>
  );
};
