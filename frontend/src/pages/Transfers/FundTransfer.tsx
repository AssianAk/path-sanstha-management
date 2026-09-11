import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import {
  ArrowLeftRight,
  CheckCircle2,
  AlertCircle,
  Printer,
  ShieldCheck,
  Building2,
  CreditCard,
  UserCheck
} from 'lucide-react';

export const FundTransfer: React.FC = () => {
  const { user, businessDate } = useAuth();

  const [sourceAccount, setSourceAccount] = useState('SB-2026-00001');
  const [sourceAccountInfo, setSourceAccountInfo] = useState<any>(null);

  const [destAccount, setDestAccount] = useState('SB-2026-00002');
  const [destBeneficiary, setDestBeneficiary] = useState<any>(null);
  const [validatingDest, setValidatingDest] = useState(false);

  const [amount, setAmount] = useState<number>(2500);
  const [narration, setNarration] = useState('Internal member payment');

  const [isTransferring, setIsTransferring] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<any>(null);

  // Load source account details
  const fetchSourceAccount = async () => {
    if (!sourceAccount) return;
    try {
      const res = await api.get(`/accounts/${sourceAccount}`);
      setSourceAccountInfo(res.data.account);
    } catch (e) {
      setSourceAccountInfo(null);
    }
  };

  // Validate beneficiary account
  const validateBeneficiary = async () => {
    if (!destAccount) {
      setDestBeneficiary(null);
      return;
    }
    setValidatingDest(true);
    try {
      const res = await api.get(`/transfers/validate/${destAccount}`);
      setDestBeneficiary(res.data);
    } catch (e) {
      setDestBeneficiary(null);
    } finally {
      setValidatingDest(false);
    }
  };

  useEffect(() => {
    fetchSourceAccount();
  }, [sourceAccount]);

  useEffect(() => {
    const timer = setTimeout(() => {
      validateBeneficiary();
    }, 300);
    return () => clearTimeout(timer);
  }, [destAccount]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setReceipt(null);
    setIsTransferring(true);

    try {
      const res = await api.post('/transfers', {
        sourceAccountNumber: sourceAccount,
        destinationAccountNumber: destAccount,
        amount: Number(amount),
        narration
      });

      if (res.data.success) {
        setReceipt(res.data.receipt);
        fetchSourceAccount();
        validateBeneficiary();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Transfer failed.');
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
          <ArrowLeftRight className="w-5 h-5 text-brand-600" />
          <span>Internal Account-to-Account Fund Transfer</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Atomic debit and credit ledger posting with instant receipt advice (Section 9 & 21)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border-l-4 border-rose-500 text-rose-700 rounded font-medium flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleTransfer} className="space-y-4">
            {/* Source Account */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Source (Debit) Account *</label>
              <input
                type="text"
                required
                value={sourceAccount}
                onChange={(e) => setSourceAccount(e.target.value.toUpperCase())}
                placeholder="e.g. SB-2026-00001"
                className="w-full p-2.5 border border-slate-300 rounded-lg font-mono uppercase font-bold text-slate-900"
              />
              {sourceAccountInfo && (
                <div className="text-[11px] text-slate-600 flex justify-between bg-slate-50 p-2 rounded-lg border border-slate-200 mt-1">
                  <span>
                    Holder: <strong>{sourceAccountInfo.customer?.title} {sourceAccountInfo.customer?.firstName} {sourceAccountInfo.customer?.lastName}</strong>
                  </span>
                  <span>
                    Available: <strong className="text-emerald-700 font-mono">₹{sourceAccountInfo.availableBalance?.toLocaleString()}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Destination Account */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Beneficiary (Credit) Account *</label>
              <input
                type="text"
                required
                value={destAccount}
                onChange={(e) => setDestAccount(e.target.value.toUpperCase())}
                placeholder="e.g. SB-2026-00002"
                className="w-full p-2.5 border border-slate-300 rounded-lg font-mono uppercase font-bold text-slate-900"
              />

              {/* Instant Beneficiary Validation Result */}
              {validatingDest ? (
                <p className="text-[11px] text-slate-400">Verifying beneficiary account...</p>
              ) : destBeneficiary ? (
                <div className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200 mt-1 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 font-bold">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>Beneficiary: {destBeneficiary.accountHolderName}</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-mono">
                    {destBeneficiary.branchName}
                  </span>
                </div>
              ) : destAccount ? (
                <p className="text-[11px] text-amber-600">Beneficiary not found or inactive</p>
              ) : null}
            </div>

            {/* Transfer Amount */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Transfer Amount (₹) *</label>
              <input
                type="number"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full p-2.5 border border-slate-300 rounded-lg font-mono font-bold text-base text-slate-900"
              />
            </div>

            {/* Narration */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Payment Narration / Remarks</label>
              <input
                type="text"
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
                placeholder="e.g. Monthly share contribution or bill payment"
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isTransferring || !destBeneficiary || amount <= 0}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>{isTransferring ? 'Authorizing & Posting...' : `Transfer ₹${amount.toLocaleString()} Now`}</span>
            </button>
          </form>
        </div>

        {/* Receipt / Advice Column */}
        <div className="lg:col-span-5 space-y-4">
          {receipt ? (
            <div className="bg-white p-6 rounded-2xl border-2 border-emerald-500 shadow-md space-y-4 text-xs animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Payment Advice</h4>
                    <span className="text-[10px] text-emerald-700 font-bold uppercase">Transaction Completed</span>
                  </div>
                </div>
                <button
                  onClick={() => window.print()}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg flex items-center space-x-1"
                  title="Print Receipt"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-slate-700">
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-slate-400">Transaction Ref:</span>
                  <span className="font-bold text-slate-900">{receipt.reference}</span>
                </div>
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-slate-400">Business Date:</span>
                  <span className="font-semibold text-slate-800">{receipt.date}</span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl text-center border border-emerald-200 my-2">
                  <span className="text-[10px] uppercase font-bold text-emerald-700">Amount Transferred</span>
                  <h3 className="text-2xl font-extrabold font-mono text-emerald-950 mt-0.5">
                    ₹{receipt.amount.toLocaleString()}
                  </h3>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Debited From</span>
                    <div className="font-bold text-slate-900">{receipt.fromCustomer}</div>
                    <div className="font-mono text-[11px] text-slate-500">{receipt.fromAccount}</div>
                  </div>
                  <div className="pt-1.5">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Credited To</span>
                    <div className="font-bold text-slate-900">{receipt.toCustomer}</div>
                    <div className="font-mono text-[11px] text-slate-500">{receipt.toAccount}</div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                  Remaining Available Balance: <strong className="font-mono text-slate-900">₹{receipt.newSourceBalance?.toLocaleString()}</strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center space-y-3">
              <ShieldCheck className="w-8 h-8 text-brand-500 mx-auto" />
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Instant ACID Financial Settlement
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                All internal transfers execute in real time across customer liability accounts with double-entry journal lines.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
