import React from 'react';
import { X, CreditCard, ArrowDownRight, ArrowUpRight, Calendar, User, ShieldCheck, Award } from 'lucide-react';
import { MakerCheckerBadge } from '../../components/MakerCheckerBadge';

interface AccountDetailModalProps {
  account: any;
  onClose: () => void;
}

export const AccountDetailModal: React.FC<AccountDetailModalProps> = ({ account, onClose }) => {
  if (!account) return null;

  const isTermDeposit = account.product?.category === 'FIXED_DEPOSIT' || account.product?.category === 'RECURRING_DEPOSIT';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900 font-mono">
                  {account.accountNumber}
                </h3>
                <MakerCheckerBadge status={account.status} />
              </div>
              <p className="text-xs text-slate-500">
                {account.product?.name} • Branch: {account.branch?.name}
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
          {/* Balance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-gradient-to-tr from-brand-600 to-sky-500 text-white rounded-xl shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-100">Available Balance</span>
              <h4 className="text-2xl font-bold mt-1">₹{account.availableBalance.toLocaleString()}</h4>
              <span className="text-[11px] text-brand-100 mt-1 block">Usable for withdrawal & transfer</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Ledger Balance</span>
              <h4 className="text-2xl font-bold text-slate-900 mt-1">₹{account.ledgerBalance.toLocaleString()}</h4>
              <span className="text-[11px] text-slate-500 mt-1 block">Total book balance</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Interest Rate</span>
              <h4 className="text-2xl font-bold text-emerald-600 mt-1">{account.product?.interestRate}%</h4>
              <span className="text-[11px] text-slate-500 mt-1 block">Compounding: {account.product?.compoundingFrequency || 'Quarterly'}</span>
            </div>
          </div>

          {/* Customer / Account Holder Details */}
          <div>
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">
              Primary Account Holder
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 text-[10px] block">Customer Name</span>
                <span className="font-bold text-slate-900">
                  {account.customer?.title} {account.customer?.firstName} {account.customer?.lastName}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Customer ID / Member ID</span>
                <span className="font-mono text-slate-800 font-medium">
                  {account.customer?.customerNumber} {account.customer?.memberNumber && `(${account.customer?.memberNumber})`}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Contact Phone</span>
                <span className="font-medium text-slate-800">{account.customer?.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Nominee Registered</span>
                <span className="font-medium text-slate-800">
                  {account.nomineeName ? `${account.nomineeName} (${account.nomineeRelation})` : 'None'}
                </span>
              </div>
            </div>
          </div>

          {/* Term Deposit Detail Box (if FD/RD) */}
          {isTermDeposit && account.termDepositDetail && (
            <div>
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2 flex items-center space-x-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Term Deposit Maturity Certificate</span>
              </h4>
              <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] block">Principal Deposited</span>
                  <span className="font-bold text-slate-900 font-mono text-sm">
                    ₹{account.termDepositDetail.depositAmount.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Contract Tenure</span>
                  <span className="font-bold text-slate-900">
                    {account.termDepositDetail.tenureMonths} Months
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Maturity Date</span>
                  <span className="font-mono font-bold text-slate-900">
                    {account.termDepositDetail.maturityDate}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Projected Maturity Payout</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">
                    ₹{account.termDepositDetail.maturityAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Mini-Statement (Recent Transactions) */}
          <div>
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">
              Recent Transactions / Ledger Journal
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200 text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold text-[10px] uppercase">
                  <tr>
                    <th className="px-3 py-2">Transaction Ref</th>
                    <th className="px-3 py-2">Type / Narration</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2 text-right">Debit</th>
                    <th className="px-3 py-2 text-right">Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {account.transactionLines?.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                        No transactions recorded for this account.
                      </td>
                    </tr>
                  ) : (
                    account.transactionLines?.map((line: any) => (
                      <tr key={line.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-mono font-medium text-slate-800">
                          {line.transaction?.transactionReference}
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          <span className="font-semibold text-slate-900 block">
                            {line.transaction?.transactionType}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {line.transaction?.narration}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-mono text-slate-500 text-[11px]">
                          {line.businessDate}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-rose-600">
                          {line.entryType === 'DEBIT' ? `₹${line.amount.toLocaleString()}` : '—'}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">
                          {line.entryType === 'CREDIT' ? `₹${line.amount.toLocaleString()}` : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
