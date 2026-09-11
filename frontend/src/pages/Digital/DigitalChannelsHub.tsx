import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  QrCode,
  Bell,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  Users,
  CreditCard,
  Wallet,
  Play,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles,
  Calculator,
  MessageSquare
} from 'lucide-react';
import api from '../../api/client';

export const DigitalChannelsHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'portal' | 'notifications' | 'mandates' | 'payments'>('portal');
  const [loading, setLoading] = useState(true);

  // Data states
  const [notifications, setNotifications] = useState<any[]>([]);
  const [mandates, setMandates] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  // Member Portal Simulation state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [memberProfile, setMemberProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // UPI QR Modal state
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrAmount, setQrAmount] = useState('2000');
  const [qrPurpose, setQrPurpose] = useState('SAVINGS_DEPOSIT');
  const [qrTargetAccount, setQrTargetAccount] = useState('');
  const [qrTargetLoan, setQrTargetLoan] = useState('');
  const [generatedQr, setGeneratedQr] = useState<any>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [simulatingPayment, setSimulatingPayment] = useState(false);

  // Notification Filter
  const [channelFilter, setChannelFilter] = useState('ALL');

  // Batch Runner state
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchResult, setBatchResult] = useState<any>(null);

  // Calculator state
  const [calcLoanAmount, setCalcLoanAmount] = useState('200000');
  const [calcRate, setCalcRate] = useState('11.5');
  const [calcTenure, setCalcTenure] = useState('24');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [notifRes, siRes, custRes] = await Promise.all([
        api.get('/digital/notifications'),
        api.get('/digital/standing-instructions'),
        api.get('/customers?status=ACTIVE')
      ]);

      if (notifRes.data?.success) setNotifications(notifRes.data.logs || []);
      if (siRes.data?.success) setMandates(siRes.data.instructions || []);
      if (custRes.data?.success) {
        const custList = custRes.data.customers || [];
        setCustomers(custList);
        if (custList.length > 0 && !selectedCustomerId) {
          setSelectedCustomerId(custList[0].id);
          fetchMemberProfile(custList[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching digital channels data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMemberProfile = async (custId: string) => {
    setProfileLoading(true);
    try {
      // Find customer info
      const cust = customers.find(c => c.id === custId);
      if (!cust) return;

      // We login as member or fetch accounts
      const [accRes, loanRes] = await Promise.all([
        api.get(`/accounts?customerId=${custId}`),
        api.get(`/loans/accounts?customerId=${custId}`)
      ]);

      const accs = accRes.data?.accounts || [];
      const loans = loanRes.data?.loans || [];

      const totalDep = accs.reduce((sum: number, a: any) => sum + a.availableBalance, 0);
      const totalLoan = loans.reduce((sum: number, l: any) => sum + l.principalOutstanding, 0);

      setMemberProfile({
        customer: cust,
        accounts: accs,
        loans,
        aggregates: {
          totalDeposits: totalDep,
          totalLoans: totalLoan,
          shareCount: 100,
          shareValue: 1000
        }
      });

      if (accs.length > 0) {
        setQrTargetAccount(accs[0].accountNumber);
      }
      if (loans.length > 0) {
        setQrTargetLoan(loans[0].loanAccountNumber);
      }
    } catch (err) {
      console.error('Error fetching member profile:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleGenerateQr = async () => {
    setQrLoading(true);
    try {
      const res = await api.post('/digital/upi-qr', {
        amount: Number(qrAmount),
        purpose: qrPurpose,
        accountNumber: qrPurpose === 'SAVINGS_DEPOSIT' ? qrTargetAccount : undefined,
        loanAccountNumber: qrPurpose === 'LOAN_REPAYMENT' ? qrTargetLoan : undefined
      });

      if (res.data?.success) {
        setGeneratedQr(res.data.paymentRequest);
      }
    } catch (err) {
      console.error('QR generation error:', err);
    } finally {
      setQrLoading(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!generatedQr) return;
    setSimulatingPayment(true);
    try {
      const utr = `UPI${Date.now().toString().slice(-8)}`;
      const res = await api.post('/digital/payment-webhook', {
        paymentReference: generatedQr.paymentReference,
        utrNumber: utr
      });

      if (res.data?.success) {
        alert(`✅ Payment Verified & Settled!\n\nUTR: ${utr}\nCBS Reference: ${res.data.settledTransactionReference}\nSMS & WhatsApp receipts dispatched.`);
        setIsQrModalOpen(false);
        setGeneratedQr(null);
        fetchInitialData();
        if (selectedCustomerId) {
          fetchMemberProfile(selectedCustomerId);
        }
      }
    } catch (err) {
      console.error('Webhook simulation error:', err);
      alert('Failed to simulate UPI payment.');
    } finally {
      setSimulatingPayment(false);
    }
  };

  const handleRunBatch = async () => {
    setBatchRunning(true);
    setBatchResult(null);
    try {
      const res = await api.post('/digital/standing-instructions/run-batch');
      if (res.data?.success) {
        setBatchResult(res.data);
        fetchInitialData();
        if (selectedCustomerId) fetchMemberProfile(selectedCustomerId);
      }
    } catch (err) {
      console.error('Batch run error:', err);
    } finally {
      setBatchRunning(false);
    }
  };

  // Calculator math
  const calculateEMI = (p: number, r: number, n: number) => {
    const monthlyRate = (r / 100) / 12;
    if (monthlyRate === 0) return p / n;
    return (p * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
  };
  const calcEMI = calculateEMI(Number(calcLoanAmount) || 0, Number(calcRate) || 0, Number(calcTenure) || 1);
  const calcTotalPayment = calcEMI * (Number(calcTenure) || 1);
  const calcTotalInterest = calcTotalPayment - (Number(calcLoanAmount) || 0);

  const filteredNotifs = notifications.filter(n => channelFilter === 'ALL' || n.channel === channelFilter);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Member Digital Channels & Integrations</h1>
            <p className="text-xs text-slate-500 font-medium">
              Member Self-Service Portal, Dynamic UPI QR Rail, e-Mandates & Multi-Channel Notifications
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchInitialData}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => {
              setIsQrModalOpen(true);
              setGeneratedQr(null);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm"
          >
            <QrCode className="w-4 h-4" />
            <span>Instant UPI QR</span>
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200 space-x-2 bg-white px-6 rounded-xl shadow-sm">
        <button
          onClick={() => setActiveTab('portal')}
          className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all ${
            activeTab === 'portal'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Member Self-Service Portal</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all ${
            activeTab === 'notifications'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notification Register</span>
          <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded-full">
            {notifications.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('mandates')}
          className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all ${
            activeTab === 'mandates'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Standing Instructions (e-Mandates)</span>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full">
            Active: {mandates.filter(m => m.status === 'ACTIVE').length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all ${
            activeTab === 'payments'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Digital Loan EMI Calculator</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: MEMBER SELF-SERVICE PORTAL */}
      {/* ======================================================== */}
      {activeTab === 'portal' && (
        <div className="space-y-6">
          {/* Member Switcher Simulation Bar */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-300">Simulate Member Self-Service Session</p>
                <p className="text-[11px] text-slate-400">Select any active member to preview their mobile & web banking experience</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <label className="text-xs font-medium text-slate-300">Active Member:</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => {
                  setSelectedCustomerId(e.target.value);
                  fetchMemberProfile(e.target.value);
                }}
                className="bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} {c.firstName} {c.lastName} ({c.customerNumber} - {c.memberNumber || 'Nominal'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {profileLoading ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
              <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mb-2" />
              <p className="text-xs font-semibold text-slate-600">Loading Member Digital Profile...</p>
            </div>
          ) : memberProfile ? (
            <div className="space-y-6">
              {/* Member Pass / Digital Card */}
              <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl"></div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 font-mono text-[10px] rounded-full">
                        {memberProfile.customer.memberNumber || 'NOMINAL MEMBER'}
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-500/30 border border-emerald-400/30 text-emerald-200 text-[10px] font-bold rounded-full">
                        KYC VERIFIED
                      </span>
                    </div>
                    <h2 className="text-2xl font-black tracking-tight">
                      {memberProfile.customer.title} {memberProfile.customer.firstName} {memberProfile.customer.lastName}
                    </h2>
                    <p className="text-xs text-indigo-200 flex items-center space-x-3">
                      <span>Customer No: <span className="font-mono font-bold text-white">{memberProfile.customer.customerNumber}</span></span>
                      <span>•</span>
                      <span>Phone: <span className="font-mono text-white">{memberProfile.customer.phone}</span></span>
                    </p>
                  </div>

                  <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10">
                    <div className="text-right">
                      <p className="text-[10px] text-indigo-200 uppercase font-semibold">Total Deposits</p>
                      <p className="text-xl font-black text-emerald-400">
                        ₹{memberProfile.aggregates.totalDeposits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="w-px h-8 bg-white/20"></div>
                    <div className="text-right">
                      <p className="text-[10px] text-indigo-200 uppercase font-semibold">Active Loans</p>
                      <p className="text-xl font-black text-rose-400">
                        ₹{memberProfile.aggregates.totalLoans.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deposit Accounts Grid */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>Deposit Accounts & CASA</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {memberProfile.accounts.map((acc: any) => (
                    <div key={acc.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                            {acc.product?.name}
                          </span>
                          <p className="font-mono font-bold text-slate-900 text-sm mt-1">{acc.accountNumber}</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full">
                          ACTIVE
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Available Balance</span>
                        <p className="text-xl font-black text-slate-900">
                          ₹{acc.availableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                        <span className="text-slate-400 text-[11px]">Interest: {acc.product?.interestRate}% p.a.</span>
                        <button
                          onClick={() => {
                            setQrTargetAccount(acc.accountNumber);
                            setQrPurpose('SAVINGS_DEPOSIT');
                            setIsQrModalOpen(true);
                            setGeneratedQr(null);
                          }}
                          className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 font-bold text-xs"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Deposit via UPI</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Loans Grid */}
              {memberProfile.loans.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                    <Wallet className="w-4 h-4 text-blue-600" />
                    <span>Active Loans & Advances</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {memberProfile.loans.map((loan: any) => (
                      <div key={loan.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                              {loan.loanProduct?.name}
                            </span>
                            <p className="font-mono font-bold text-slate-900 text-sm mt-1">{loan.loanAccountNumber}</p>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 font-bold rounded-full ${
                            loan.dpd > 90 ? 'bg-rose-100 text-rose-800' :
                            loan.dpd > 0 ? 'bg-amber-100 text-amber-800' :
                            'bg-emerald-100 text-emerald-800'
                          }`}>
                            {loan.dpd > 0 ? `DPD: ${loan.dpd}` : 'STANDARD'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold">Principal Outstanding</span>
                            <p className="text-base font-black text-rose-700">
                              ₹{loan.principalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold">Monthly EMI</span>
                            <p className="text-base font-black text-slate-900">
                              ₹{loan.emiAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                          <span className="text-slate-400 text-[11px]">Interest: {loan.interestRate}% Reducing</span>
                          <button
                            onClick={() => {
                              setQrTargetLoan(loan.loanAccountNumber);
                              setQrPurpose('LOAN_REPAYMENT');
                              setQrAmount(loan.emiAmount.toString());
                              setIsQrModalOpen(true);
                              setGeneratedQr(null);
                            }}
                            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-bold text-xs"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Pay EMI via UPI</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: MULTI-CHANNEL NOTIFICATION REGISTER */}
      {/* ======================================================== */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-700">Filter Channel:</span>
              {['ALL', 'SMS', 'WHATSAPP', 'EMAIL'].map((ch) => (
                <button
                  key={ch}
                  onClick={() => setChannelFilter(ch)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    channelFilter === ch
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>

            <span className="text-xs text-slate-400">
              Showing {filteredNotifs.length} dispatched notifications
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Channel</th>
                    <th className="py-3 px-4">Recipient</th>
                    <th className="py-3 px-4">Category / Template</th>
                    <th className="py-3 px-4">Message Content</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Date / Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredNotifs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                        No notification logs found.
                      </td>
                    </tr>
                  ) : (
                    filteredNotifs.map((n) => (
                      <tr key={n.id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 font-bold rounded-md text-[10px] ${
                            n.channel === 'SMS' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            n.channel === 'WHATSAPP' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}>
                            {n.channel}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                          {n.recipientPhone || n.recipientEmail}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-800">{n.title}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{n.templateCode}</p>
                        </td>
                        <td className="py-3 px-4 max-w-md text-slate-700">
                          "{n.message}"
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px]">
                            {n.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-400 font-mono text-[11px]">
                          {n.businessDate}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: STANDING INSTRUCTIONS (E-MANDATES) */}
      {/* ======================================================== */}
      {activeTab === 'mandates' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Automated Standing Instructions & e-Mandates</h2>
              <p className="text-xs text-slate-500">
                Automated monthly debits for Recurring Deposits (RD) and Loan EMIs
              </p>
            </div>

            <button
              onClick={handleRunBatch}
              disabled={batchRunning}
              className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              <Play className={`w-3.5 h-3.5 ${batchRunning ? 'animate-spin' : ''}`} />
              <span>{batchRunning ? 'Executing Batch...' : 'Run Mandate Scheduler Batch'}</span>
            </button>
          </div>

          {batchResult && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs space-y-1 text-emerald-950">
              <p className="font-bold flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{batchResult.message}</span>
              </p>
              <p className="text-[11px]">
                Processed: <span className="font-bold">{batchResult.summary?.totalEvaluated}</span> | 
                Success: <span className="font-bold text-emerald-700">{batchResult.summary?.successCount}</span> | 
                Failed / Insufficient: <span className="font-bold text-rose-700">{batchResult.summary?.failedCount}</span>
              </p>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Mandate Ref</th>
                    <th className="py-3 px-4">Member / Customer</th>
                    <th className="py-3 px-4">Source Account</th>
                    <th className="py-3 px-4">Instruction Type</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4">Frequency</th>
                    <th className="py-3 px-4">Next Due Date</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mandates.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                        No standing instructions found.
                      </td>
                    </tr>
                  ) : (
                    mandates.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                          {m.mandateNumber}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {m.customer?.firstName} {m.customer?.lastName}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-800">
                          {m.sourceAccount?.accountNumber}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded-md text-[10px]">
                            {m.instructionType}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-black text-slate-900">
                          ₹{m.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-600">
                          {m.frequency} (Day {m.executionDay})
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700">
                          {m.nextExecutionDate}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px]">
                            {m.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: DIGITAL LOAN EMI CALCULATOR */}
      {/* ======================================================== */}
      {activeTab === 'payments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Calculator className="w-4 h-4 text-indigo-600" />
              <span>Interactive Loan EMI & Repayment Estimator</span>
            </h2>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Loan Principal Amount</span>
                  <span className="font-black text-slate-900">₹{Number(calcLoanAmount).toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min="25000"
                  max="2000000"
                  step="25000"
                  value={calcLoanAmount}
                  onChange={(e) => setCalcLoanAmount(e.target.value)}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Annual Interest Rate</span>
                  <span className="font-black text-slate-900">{calcRate}% p.a.</span>
                </div>
                <input
                  type="range"
                  min="6.0"
                  max="18.0"
                  step="0.25"
                  value={calcRate}
                  onChange={(e) => setCalcRate(e.target.value)}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Tenure in Months</span>
                  <span className="font-black text-slate-900">{calcTenure} Months</span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="84"
                  step="6"
                  value={calcTenure}
                  onChange={(e) => setCalcTenure(e.target.value)}
                  className="w-full accent-indigo-600"
                />
              </div>
            </div>
          </div>

          <div className="bg-indigo-900 text-white p-6 rounded-2xl shadow-lg space-y-6 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
                Monthly Repayment Estimate
              </span>
              <p className="text-3xl font-black mt-1 text-emerald-400">
                ₹{Math.round(calcEMI).toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-indigo-200 mt-0.5">per month (Reducing Balance)</p>
            </div>

            <div className="space-y-3 text-xs border-t border-indigo-800 pt-4">
              <div className="flex justify-between text-indigo-200">
                <span>Principal Amount</span>
                <span className="font-bold text-white">₹{Number(calcLoanAmount).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-indigo-200">
                <span>Total Interest Payable</span>
                <span className="font-bold text-amber-300">₹{Math.round(calcTotalInterest).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-indigo-200 pt-2 border-t border-indigo-800/80 font-bold">
                <span>Total Repayment Amount</span>
                <span className="text-emerald-400">₹{Math.round(calcTotalPayment).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setQrAmount(Math.round(calcEMI).toString());
                setQrPurpose('LOAN_REPAYMENT');
                setIsQrModalOpen(true);
                setGeneratedQr(null);
              }}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold text-xs rounded-xl transition-all text-center"
            >
              Generate UPI QR for This Amount
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DYNAMIC UPI QR PAYMENT MODAL */}
      {/* ======================================================== */}
      {isQrModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <QrCode className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Dynamic UPI Payment Rail</h3>
              </div>
              <button
                onClick={() => setIsQrModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {!generatedQr ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Payment Amount (INR)</label>
                  <input
                    type="number"
                    value={qrAmount}
                    onChange={(e) => setQrAmount(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono font-bold border border-slate-300 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-1"
                    placeholder="2000"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600">Payment Purpose</label>
                  <select
                    value={qrPurpose}
                    onChange={(e) => setQrPurpose(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-1"
                  >
                    <option value="SAVINGS_DEPOSIT">Deposit into Savings Account</option>
                    <option value="LOAN_REPAYMENT">Loan EMI Repayment</option>
                    <option value="SHARE_CAPITAL">Member Share Capital Contribution</option>
                  </select>
                </div>

                <button
                  onClick={handleGenerateQr}
                  disabled={qrLoading}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center space-x-1.5"
                >
                  <QrCode className="w-4 h-4" />
                  <span>{qrLoading ? 'Generating...' : 'Generate Dynamic UPI QR'}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-center">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block mx-auto">
                  <div dangerouslySetInnerHTML={{ __html: generatedQr.qrData }} />
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Payment Reference</span>
                  <p className="font-mono font-black text-slate-900 text-sm">{generatedQr.paymentReference}</p>
                  <p className="text-xl font-black text-indigo-700 mt-1">₹{Number(generatedQr.amount).toFixed(2)}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Payee: {generatedQr.payeeVpa}</p>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-left text-[11px] text-amber-900">
                  Scan using Google Pay, PhonePe, Paytm, or any BHIM UPI app. Once scanned, webhook callback updates ledger in real-time.
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => setGeneratedQr(null)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                  >
                    Back
                  </button>

                  <button
                    onClick={handleSimulatePayment}
                    disabled={simulatingPayment}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center space-x-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{simulatingPayment ? 'Settling...' : 'Simulate UPI Success'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
