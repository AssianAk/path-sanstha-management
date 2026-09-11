import React, { useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { X, DollarSign, CheckCircle2, ArrowRight, ShieldCheck, Printer } from 'lucide-react';

interface LoanRepaymentModalProps {
  loan: any;
  onClose: () => void;
  onSuccess: () => void;
}

export const LoanRepaymentModal: React.FC<LoanRepaymentModalProps> = ({
  loan,
  onClose,
  onSuccess
}) => {
  const { user, businessDate } = useAuth();

  const [amount, setAmount] = useState<number>(loan?.emiAmount || 10000);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'SAVINGS'>('CASH');
  const [narration, setNarration] = useState('Loan monthly installment repayment');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [repayResult, setRepayResult] = useState<any>(null);

  if (!loan) return null;

  // Approximate Waterfall Breakdown Preview
  const monthlyRate = (loan.interestRate / 100) / 12;
  const estimatedInterest = Math.round(loan.principalOutstanding * monthlyRate);
  const estimatedPrincipal = Math.max(0, amount - estimatedInterest);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const res = await api.post('/loans/repay', {
        loanAccountId: loan.id,
        amount: Number(amount),
        paymentMethod,
        narration
      });

      if (res.data.success) {
        setRepayResult(res.data);
        onSuccess();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Repayment failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Loan Installment Repayment
              </h3>
              <p className="text-xs text-slate-500">
                Section 11 • Configurable Waterfall Allocation Engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {repayResult ? (
          <div className="p-6 space-y-4 text-xs">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center space-x-2 text-emerald-900 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Repayment Successful!</span>
              </div>
              <p className="text-emerald-800 text-[11px] font-mono">
                Transaction Ref: <strong>{repayResult.transactionReference}</strong>
              </p>
            </div>

            {/* Waterfall Breakdown Applied */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-2 bg-slate-50">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block">
                Applied Waterfall Breakdown
              </span>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">Late Penalty:</span>
                <span className="font-mono font-bold text-slate-900">₹{repayResult.allocation?.penalty?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">Interest Income:</span>
                <span className="font-mono font-bold text-slate-900">₹{repayResult.allocation?.interest?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">Principal Repaid:</span>
                <span className="font-mono font-bold text-emerald-700">₹{repayResult.allocation?.principal?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="font-bold text-slate-800">Remaining Loan Balance:</span>
                <span className="font-mono font-bold text-base text-amber-950">
                  ₹{repayResult.allocation?.remainingLoanBalance?.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center space-x-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-bold"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            {error && (
              <div className="p-3 bg-rose-50 border-l-4 border-rose-500 text-rose-700 rounded font-medium">
                {error}
              </div>
            )}

            {/* Loan Summary */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Loan Account</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{loan.loanAccountNumber}</span>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  {loan.customer?.firstName} {loan.customer?.lastName}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Principal Balance</span>
                <span className="font-mono font-bold text-amber-800 text-sm">
                  ₹{loan.principalOutstanding?.toLocaleString()}
                </span>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Scheduled EMI: ₹{loan.emiAmount?.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Repayment Amount */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Repayment Amount (₹) *</label>
              <input
                type="number"
                min="100"
                step="100"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full p-2.5 border border-slate-300 rounded-lg font-mono font-bold text-base text-slate-900"
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                <label className={`p-2.5 rounded-lg border text-center cursor-pointer transition-colors ${
                  paymentMethod === 'CASH' ? 'border-brand-600 bg-brand-50 text-brand-900 font-bold' : 'border-slate-200'
                }`}>
                  <input
                    type="radio"
                    name="method"
                    checked={paymentMethod === 'CASH'}
                    onChange={() => setPaymentMethod('CASH')}
                    className="sr-only"
                  />
                  <span>Cash via Teller Counter</span>
                </label>

                <label className={`p-2.5 rounded-lg border text-center cursor-pointer transition-colors ${
                  paymentMethod === 'SAVINGS' ? 'border-brand-600 bg-brand-50 text-brand-900 font-bold' : 'border-slate-200'
                }`}>
                  <input
                    type="radio"
                    name="method"
                    checked={paymentMethod === 'SAVINGS'}
                    onChange={() => setPaymentMethod('SAVINGS')}
                    className="sr-only"
                  />
                  <span>Debit Savings Account</span>
                </label>
              </div>
            </div>

            {/* Waterfall Preview Box */}
            <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-1.5 font-mono text-[11px]">
              <span className="font-bold text-indigo-950 uppercase text-[10px] font-sans block">
                Waterfall Allocation Logic (Section 11)
              </span>
              <div className="flex justify-between text-indigo-900">
                <span>1. Penalties & Late Charges:</span>
                <span className="font-bold">₹0</span>
              </div>
              <div className="flex justify-between text-indigo-900">
                <span>2. Interest Component:</span>
                <span className="font-bold">₹{estimatedInterest.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-indigo-900">
                <span>3. Principal Reduction:</span>
                <span className="font-bold text-emerald-700">₹{estimatedPrincipal.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Narration</label>
              <input
                type="text"
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || amount <= 0}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Posting Repayment...' : `Collect ₹${amount.toLocaleString()}`}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
