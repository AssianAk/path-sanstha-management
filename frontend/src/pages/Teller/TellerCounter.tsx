import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import {
  Banknote,
  ArrowDownCircle,
  ArrowUpCircle,
  Calculator,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Coins,
  ShieldCheck,
  Scale
} from 'lucide-react';

export const TellerCounter: React.FC = () => {
  const { user, businessDate } = useAuth();
  const [activeTab, setActiveTab] = useState<'DEPOSIT' | 'WITHDRAW' | 'EOD'>('DEPOSIT');
  const [till, setTill] = useState<any>(null);
  const [loadingTill, setLoadingTill] = useState(true);

  // Cash Deposit State
  const [depAccount, setDepAccount] = useState('SB-2026-00001');
  const [depAccountInfo, setDepAccountInfo] = useState<any>(null);
  const [denominations, setDenominations] = useState({
    note500: 10,
    note200: 0,
    note100: 0,
    note50: 0,
    note20: 0,
    note10: 0,
    coins: 0
  });
  const [depNarration, setDepNarration] = useState('Cash deposit at teller counter');
  const [isProcessingDep, setIsProcessingDep] = useState(false);
  const [depResult, setDepResult] = useState<any>(null);
  const [depError, setDepError] = useState('');

  // Cash Withdrawal State
  const [withAccount, setWithAccount] = useState('SB-2026-00001');
  const [withAccountInfo, setWithAccountInfo] = useState<any>(null);
  const [withAmount, setWithAmount] = useState<number>(2000);
  const [withNarration, setWithNarration] = useState('Cash withdrawal at counter');
  const [isProcessingWith, setIsProcessingWith] = useState(false);
  const [withResult, setWithResult] = useState<any>(null);
  const [withError, setWithError] = useState('');

  // EOD Balancing State
  const [physicalCount, setPhysicalCount] = useState<number>(0);
  const [isBalancing, setIsBalancing] = useState(false);
  const [balanceResult, setBalanceResult] = useState<any>(null);

  // Total cash calculated from denomination table
  const totalDepositAmount =
    (Number(denominations.note500) || 0) * 500 +
    (Number(denominations.note200) || 0) * 200 +
    (Number(denominations.note100) || 0) * 100 +
    (Number(denominations.note50) || 0) * 50 +
    (Number(denominations.note20) || 0) * 20 +
    (Number(denominations.note10) || 0) * 10 +
    (Number(denominations.coins) || 0);

  const fetchTillStatus = async () => {
    setLoadingTill(true);
    try {
      const res = await api.get('/teller/till/active');
      setTill(res.data.till);
      if (res.data.till) {
        setPhysicalCount(res.data.till.currentBalance);
      }
    } catch (err) {
      console.error('Failed to load till status', err);
    } finally {
      setLoadingTill(false);
    }
  };

  const lookupAccount = async (accNum: string, type: 'DEP' | 'WITH') => {
    if (!accNum) return;
    try {
      const res = await api.get(`/accounts/${accNum}`);
      if (type === 'DEP') setDepAccountInfo(res.data.account);
      else setWithAccountInfo(res.data.account);
    } catch (e) {
      if (type === 'DEP') setDepAccountInfo(null);
      else setWithAccountInfo(null);
    }
  };

  useEffect(() => {
    fetchTillStatus();
  }, [user]);

  useEffect(() => {
    lookupAccount(depAccount, 'DEP');
  }, [depAccount]);

  useEffect(() => {
    lookupAccount(withAccount, 'WITH');
  }, [withAccount]);

  // Handle Deposit Submit
  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalDepositAmount <= 0) {
      setDepError('Please enter at least one currency denomination.');
      return;
    }
    setDepError('');
    setDepResult(null);
    setIsProcessingDep(true);

    try {
      const res = await api.post('/teller/deposit', {
        accountNumber: depAccount,
        amount: totalDepositAmount,
        narration: depNarration,
        denominations
      });
      if (res.data.success) {
        setDepResult(res.data);
        fetchTillStatus();
        lookupAccount(depAccount, 'DEP');
      }
    } catch (err: any) {
      setDepError(err.response?.data?.message || 'Deposit failed.');
    } finally {
      setIsProcessingDep(false);
    }
  };

  // Handle Withdrawal Submit
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (withAmount <= 0) {
      setWithError('Please enter a valid withdrawal amount.');
      return;
    }
    setWithError('');
    setWithResult(null);
    setIsProcessingWith(true);

    try {
      const res = await api.post('/teller/withdraw', {
        accountNumber: withAccount,
        amount: withAmount,
        narration: withNarration
      });
      if (res.data.success) {
        setWithResult(res.data);
        fetchTillStatus();
        lookupAccount(withAccount, 'WITH');
      }
    } catch (err: any) {
      setWithError(err.response?.data?.message || 'Withdrawal failed.');
    } finally {
      setIsProcessingWith(false);
    }
  };

  // Handle EOD Balancing
  const handleBalanceTill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!till) return;
    setIsBalancing(true);
    try {
      const res = await api.post('/teller/till/balance', {
        tillId: till.id,
        physicalCashCount: physicalCount
      });
      if (res.data.success) {
        setBalanceResult(res.data);
        fetchTillStatus();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to balance till');
    } finally {
      setIsBalancing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Banknote className="w-5 h-5 text-emerald-600" />
            <span>Cash & Front-Desk Teller Counter</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time cash vault accounting, denomination calculator & EOD balancing (Section 8 & 21)
          </p>
        </div>

        <button
          onClick={fetchTillStatus}
          className="p-2 border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingTill ? 'animate-spin' : ''}`} />
          <span>Sync Drawer</span>
        </button>
      </div>

      {/* Till Cash Position Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-5 rounded-2xl text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
              Counter Till Session: {till?.counter?.counterName || 'Counter 1 (Main Cash)'}
            </span>
            <h3 className="text-3xl font-extrabold tracking-tight mt-1 font-mono text-emerald-400">
              ₹{till?.currentBalance?.toLocaleString() || '0'}
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Current Physical Cash in Drawer • Tied to Business Date <span className="font-mono text-emerald-300">{businessDate}</span>
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t sm:border-t-0 sm:border-l border-slate-700 pt-3 sm:pt-0 sm:pl-6 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Opening Float</span>
              <span className="font-mono font-bold text-slate-200 mt-0.5 block">
                ₹{till?.openingBalance?.toLocaleString() || '0'}
              </span>
            </div>
            <div>
              <span className="text-emerald-400 block text-[10px] uppercase font-bold">Total Cash In</span>
              <span className="font-mono font-bold text-emerald-300 mt-0.5 block">
                +₹{till?.totalCashReceived?.toLocaleString() || '0'}
              </span>
            </div>
            <div>
              <span className="text-rose-400 block text-[10px] uppercase font-bold">Total Cash Out</span>
              <span className="font-mono font-bold text-rose-300 mt-0.5 block">
                -₹{till?.totalCashPaid?.toLocaleString() || '0'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Operation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('DEPOSIT')}
          className={`pb-3 px-4 flex items-center space-x-2 border-b-2 transition-all ${
            activeTab === 'DEPOSIT'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ArrowDownCircle className="w-4 h-4 text-emerald-600" />
          <span>Cash Deposit (Receipt)</span>
        </button>

        <button
          onClick={() => setActiveTab('WITHDRAW')}
          className={`pb-3 px-4 flex items-center space-x-2 border-b-2 transition-all ${
            activeTab === 'WITHDRAW'
              ? 'border-rose-600 text-rose-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ArrowUpCircle className="w-4 h-4 text-rose-600" />
          <span>Cash Withdrawal (Payment)</span>
        </button>

        <button
          onClick={() => setActiveTab('EOD')}
          className={`pb-3 px-4 flex items-center space-x-2 border-b-2 transition-all ${
            activeTab === 'EOD'
              ? 'border-indigo-600 text-indigo-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Scale className="w-4 h-4 text-indigo-600" />
          <span>EOD Teller Balancing</span>
        </button>
      </div>

      {/* TAB 1: CASH DEPOSIT WITH DENOMINATION CALCULATOR */}
      {activeTab === 'DEPOSIT' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Calculator className="w-4 h-4 text-emerald-600" />
              <span>Cash Currency Denomination Counter</span>
            </h3>

            {depError && (
              <div className="p-3 bg-rose-50 border-l-4 border-rose-500 text-rose-700 text-xs rounded font-medium">
                {depError}
              </div>
            )}

            {depResult && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
                <div className="flex items-center space-x-1.5 font-bold text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{depResult.message}</span>
                </div>
                <p className="text-emerald-800 font-mono text-[11px]">
                  Txn Ref: <strong>{depResult.transaction.transactionReference}</strong> • New Available Balance: <strong>₹{depResult.newBalance?.toLocaleString()}</strong>
                </p>
              </div>
            )}

            {/* Target Account Input */}
            <div className="space-y-1 text-xs">
              <label className="font-semibold text-slate-700">Account Number *</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  required
                  value={depAccount}
                  onChange={(e) => setDepAccount(e.target.value.toUpperCase())}
                  placeholder="e.g. SB-2026-00001"
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-mono uppercase text-sm font-bold"
                />
              </div>
            </div>

            {/* Denomination Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="px-3 py-2">Denomination</th>
                    <th className="px-3 py-2 text-center">Count / Pieces</th>
                    <th className="px-3 py-2 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { label: '₹500 Notes', key: 'note500', mul: 500 },
                    { label: '₹200 Notes', key: 'note200', mul: 200 },
                    { label: '₹100 Notes', key: 'note100', mul: 100 },
                    { label: '₹50 Notes', key: 'note50', mul: 50 },
                    { label: '₹20 Notes', key: 'note20', mul: 20 },
                    { label: '₹10 Notes', key: 'note10', mul: 10 },
                  ].map((row) => {
                    const count = (denominations as any)[row.key];
                    const subtotal = (Number(count) || 0) * row.mul;
                    return (
                      <tr key={row.key} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-semibold text-slate-800">{row.label}</td>
                        <td className="px-3 py-1.5 text-center">
                          <input
                            type="number"
                            min="0"
                            value={count}
                            onChange={(e) =>
                              setDenominations({ ...denominations, [row.key]: Number(e.target.value) })
                            }
                            className="w-24 p-1.5 border border-slate-300 rounded text-center font-bold"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">
                          ₹{subtotal.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-semibold text-slate-800">Coins / Loose</td>
                    <td className="px-3 py-1.5 text-center">
                      <input
                        type="number"
                        min="0"
                        value={denominations.coins}
                        onChange={(e) =>
                          setDenominations({ ...denominations, coins: Number(e.target.value) })
                        }
                        className="w-24 p-1.5 border border-slate-300 rounded text-center font-bold"
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">
                      ₹{denominations.coins.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-emerald-50/80 font-bold border-t-2 border-emerald-200">
                  <tr>
                    <td colSpan={2} className="px-3 py-3 text-emerald-950 uppercase text-xs">
                      Grand Total Deposit Amount
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-base text-emerald-900">
                      ₹{totalDepositAmount.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-semibold text-slate-700">Narration</label>
              <input
                type="text"
                value={depNarration}
                onChange={(e) => setDepNarration(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <button
              type="button"
              disabled={isProcessingDep || totalDepositAmount <= 0}
              onClick={handleDepositSubmit}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
            >
              <ArrowDownCircle className="w-5 h-5" />
              <span>{isProcessingDep ? 'Posting Financial Entry...' : `Post Cash Deposit of ₹${totalDepositAmount.toLocaleString()}`}</span>
            </button>
          </div>

          {/* Right Column: Account Snapshot */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] pb-2 border-b border-slate-100">
                Beneficiary Account Snapshot
              </h4>
              {depAccountInfo ? (
                <div className="space-y-2.5">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Account Holder</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {depAccountInfo.customer?.title} {depAccountInfo.customer?.firstName} {depAccountInfo.customer?.lastName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Product & Category</span>
                    <span className="font-medium text-slate-800">
                      {depAccountInfo.product?.name} ({depAccountInfo.product?.category})
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 text-[10px] block">Current Available Balance</span>
                    <span className="font-mono font-extrabold text-xl text-slate-900">
                      ₹{depAccountInfo.availableBalance?.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Branch: <span className="font-medium text-slate-700">{depAccountInfo.branch?.name}</span>
                  </div>
                </div>
              ) : (
                <p className="text-slate-400 text-center py-6">
                  Enter a valid account number to preview holder info.
                </p>
              )}
            </div>

            {/* Double-Entry Preview Box */}
            <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl shadow-xs text-xs space-y-2 font-mono">
              <div className="text-amber-400 font-bold uppercase text-[10px] tracking-wider">
                Automated Double-Entry Posting
              </div>
              <div className="text-emerald-400 text-[11px]">
                DEBIT : GL-1001 (Cash In Hand) ₹{totalDepositAmount.toLocaleString()}
              </div>
              <div className="text-sky-300 text-[11px]">
                CREDIT: GL-2001 (Deposit Liability) ₹{totalDepositAmount.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                Invariant: $\sum Debits == \sum Credits$
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CASH WITHDRAWAL */}
      {activeTab === 'WITHDRAW' && (
        <div className="max-w-xl bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <ArrowUpCircle className="w-4 h-4 text-rose-600" />
            <span>Cash Withdrawal Counter Payment</span>
          </h3>

          {withError && (
            <div className="p-3 bg-rose-50 border-l-4 border-rose-500 text-rose-700 rounded font-medium">
              {withError}
            </div>
          )}

          {withResult && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{withResult.message}</span>
              </div>
              <p className="text-emerald-800 font-mono text-[11px]">
                Ref: <strong>{withResult.transaction.transactionReference}</strong> • Remaining Balance: <strong>₹{withResult.newBalance?.toLocaleString()}</strong>
              </p>
            </div>
          )}

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Account Number *</label>
            <input
              type="text"
              required
              value={withAccount}
              onChange={(e) => setWithAccount(e.target.value.toUpperCase())}
              placeholder="e.g. SB-2026-00001"
              className="w-full p-2.5 border border-slate-300 rounded-lg font-mono uppercase text-sm font-bold"
            />
          </div>

          {withAccountInfo && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900">
                {withAccountInfo.customer?.title} {withAccountInfo.customer?.firstName} {withAccountInfo.customer?.lastName}
              </div>
              <div className="text-slate-600">
                Available to Withdraw: <span className="font-mono font-bold text-slate-900">₹{withAccountInfo.availableBalance?.toLocaleString()}</span>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Withdrawal Amount (₹) *</label>
            <input
              type="number"
              min="100"
              step="100"
              required
              value={withAmount}
              onChange={(e) => setWithAmount(Number(e.target.value))}
              className="w-full p-2.5 border border-slate-300 rounded-lg font-bold text-base font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Narration / Payment Purpose</label>
            <input
              type="text"
              value={withNarration}
              onChange={(e) => setWithNarration(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <button
            type="button"
            disabled={isProcessingWith || withAmount <= 0}
            onClick={handleWithdrawSubmit}
            className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
          >
            <ArrowUpCircle className="w-5 h-5" />
            <span>{isProcessingWith ? 'Validating & Paying...' : `Authorize Cash Payment of ₹${withAmount.toLocaleString()}`}</span>
          </button>
        </div>
      )}

      {/* TAB 3: EOD TELLER BALANCING */}
      {activeTab === 'EOD' && (
        <div className="max-w-xl bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Scale className="w-4 h-4 text-indigo-600" />
            <span>End-of-Day (EOD) Physical Cash Balancing</span>
          </h3>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">System Book Balance:</span>
              <span className="font-mono font-bold text-slate-900 text-base">
                ₹{till?.currentBalance?.toLocaleString() || 0}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-400">
              <span>Till Session Status:</span>
              <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                {till?.status || 'OPEN'}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">
              Physical Cash Count in Drawer (₹) *
            </label>
            <input
              type="number"
              value={physicalCount}
              onChange={(e) => setPhysicalCount(Number(e.target.value))}
              className="w-full p-2.5 border border-slate-300 rounded-lg font-mono font-bold text-base"
            />
          </div>

          <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
            physicalCount - (till?.currentBalance || 0) === 0
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <span>Shortage / Excess:</span>
            <span className="font-mono font-bold text-sm">
              ₹{(physicalCount - (till?.currentBalance || 0)).toLocaleString()}
              {physicalCount - (till?.currentBalance || 0) === 0 && ' (Balanced)'}
            </span>
          </div>

          <button
            type="button"
            disabled={isBalancing}
            onClick={handleBalanceTill}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>{isBalancing ? 'Submitting Balancing Sign-off...' : 'Sign-Off and Close Till for Day'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
