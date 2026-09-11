import React, { useState } from 'react';
import { X, Award, CheckCircle2, Calendar, CreditCard, ShieldCheck, DollarSign } from 'lucide-react';
import { MakerCheckerBadge } from '../../components/MakerCheckerBadge';
import api from '../../api/client';

interface LoanDetailModalProps {
  loan: any;
  onClose: () => void;
  onRepayClick?: (loan: any) => void;
  onDisburseSuccess?: () => void;
}

export const LoanDetailModal: React.FC<LoanDetailModalProps> = ({
  loan,
  onClose,
  onRepayClick,
  onDisburseSuccess
}) => {
  const [isDisbursing, setIsDisbursing] = useState(false);
  const [disburseMsg, setDisburseMsg] = useState('');

  if (!loan) return null;

  const handleDisburse = async () => {
    setIsDisbursing(true);
    setDisburseMsg('');
    try {
      // If loan is an application in SANCTIONED status
      const res = await api.post(`/loans/applications/${loan.id}/disburse`, {});
      if (res.data.success) {
        setDisburseMsg(res.data.message);
        if (onDisburseSuccess) onDisburseSuccess();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to disburse loan');
    } finally {
      setIsDisbursing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900 font-mono">
                  {loan.loanAccountNumber || loan.applicationNumber}
                </h3>
                <MakerCheckerBadge status={loan.status} />
              </div>
              <p className="text-xs text-slate-500">
                {loan.loanProduct?.name} • Borrower: {loan.customer?.title} {loan.customer?.firstName} {loan.customer?.lastName} ({loan.customer?.customerNumber})
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

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {disburseMsg && (
            <div className="p-3 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 rounded font-medium">
              {disburseMsg}
            </div>
          )}

          {/* Key Loan Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Sanctioned Principal</span>
              <h4 className="text-lg font-bold text-slate-900 mt-0.5 font-mono">
                ₹{(loan.sanctionedAmount || loan.requestedAmount)?.toLocaleString()}
              </h4>
              <span className="text-[10px] text-slate-400">Tenure: {loan.tenureMonths || loan.requestedTenureMonths} Mos</span>
            </div>

            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">Principal Outstanding</span>
              <h4 className="text-lg font-extrabold text-amber-950 mt-0.5 font-mono">
                ₹{(loan.principalOutstanding ?? loan.sanctionedAmount ?? 0).toLocaleString()}
              </h4>
              <span className="text-[10px] text-amber-700">Remaining Balance</span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Monthly EMI</span>
              <h4 className="text-lg font-bold text-slate-900 mt-0.5 font-mono">
                ₹{(loan.emiAmount || 0).toLocaleString()}
              </h4>
              <span className="text-[10px] text-slate-500">@ {loan.interestRate || loan.loanProduct?.interestRate}% Reducing</span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Repaid</span>
              <h4 className="text-lg font-bold text-emerald-700 mt-0.5 font-mono">
                ₹{(loan.totalPrincipalPaid + loan.totalInterestPaid || 0).toLocaleString()}
              </h4>
              <span className="text-[10px] text-slate-500">Prin: ₹{loan.totalPrincipalPaid || 0}</span>
            </div>
          </div>

          {/* Guarantor & Collateral Info */}
          {(loan.loanApplication?.guarantors?.length > 0 || loan.loanApplication?.collaterals?.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-slate-200 rounded-xl p-3.5 space-y-1">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Guarantor Profile</span>
                {loan.loanApplication?.guarantors?.map((g: any) => (
                  <div key={g.id} className="text-slate-700 pt-1">
                    <div className="font-semibold text-slate-900">{g.name} ({g.relationship})</div>
                    <div className="text-[11px] text-slate-500">Phone: {g.phone} • Net Worth: ₹{g.netWorth?.toLocaleString()}</div>
                  </div>
                ))}
              </div>

              <div className="border border-slate-200 rounded-xl p-3.5 space-y-1">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Pledged Collateral Security</span>
                {loan.loanApplication?.collaterals?.map((c: any) => (
                  <div key={c.id} className="text-slate-700 pt-1">
                    <div className="font-semibold text-slate-900">{c.collateralType}: {c.description}</div>
                    <div className="text-[11px] text-slate-500">Market Value: ₹{c.marketValue?.toLocaleString()} • Assessed: ₹{c.assessedValue?.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Amortization Schedule */}
          {loan.installments && loan.installments.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Amortization Schedule ({loan.installments.length} Installments)
                </h4>
                <span className="text-[11px] text-slate-400 font-mono">
                  Reducing Balance Method
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left">
                  <thead className="bg-slate-50 text-slate-600 font-semibold text-[10px] uppercase sticky top-0">
                    <tr>
                      <th className="px-3 py-2">Inst #</th>
                      <th className="px-3 py-2">Due Date</th>
                      <th className="px-3 py-2 text-right">Principal Due</th>
                      <th className="px-3 py-2 text-right">Interest Due</th>
                      <th className="px-3 py-2 text-right">Total EMI</th>
                      <th className="px-3 py-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loan.installments.map((inst: any) => (
                      <tr key={inst.id} className="hover:bg-slate-50">
                        <td className="px-3 py-1.5 font-bold font-mono text-slate-800">#{inst.installmentNumber}</td>
                        <td className="px-3 py-1.5 font-mono text-slate-600">{inst.dueDate}</td>
                        <td className="px-3 py-1.5 text-right font-mono">₹{inst.principalDue.toLocaleString()}</td>
                        <td className="px-3 py-1.5 text-right font-mono">₹{inst.interestDue.toLocaleString()}</td>
                        <td className="px-3 py-1.5 text-right font-mono font-bold text-slate-900">₹{inst.totalEmi.toLocaleString()}</td>
                        <td className="px-3 py-1.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            inst.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inst.status === 'OVERDUE'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {inst.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg text-xs"
          >
            Close View
          </button>

          <div className="flex items-center space-x-2">
            {loan.status === 'SANCTIONED' && (
              <button
                onClick={handleDisburse}
                disabled={isDisbursing}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center space-x-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isDisbursing ? 'Disbursing...' : 'Disburse to Customer Savings'}</span>
              </button>
            )}

            {loan.status === 'ACTIVE' && onRepayClick && (
              <button
                onClick={() => {
                  onClose();
                  onRepayClick(loan);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center space-x-1.5 shadow-sm"
              >
                <DollarSign className="w-4 h-4" />
                <span>Pay Installment (Waterfall)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
