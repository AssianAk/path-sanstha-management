import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Send,
  Scale
} from 'lucide-react';
import api from '../../api/client';

interface NewJournalVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVoucherPosted: () => void;
  accounts: any[];
}

interface VoucherLine {
  glAccountCode: string;
  entryType: 'DEBIT' | 'CREDIT';
  amount: string;
}

export const NewJournalVoucherModal: React.FC<NewJournalVoucherModalProps> = ({
  isOpen,
  onClose,
  onVoucherPosted,
  accounts
}) => {
  const [narration, setNarration] = useState('');
  const [entries, setEntries] = useState<VoucherLine[]>([
    { glAccountCode: accounts[0]?.code || 'GL-1001', entryType: 'DEBIT', amount: '' },
    { glAccountCode: accounts[1]?.code || 'GL-2001', entryType: 'CREDIT', amount: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAddRow = () => {
    setEntries([
      ...entries,
      { glAccountCode: accounts[0]?.code || 'GL-1001', entryType: 'DEBIT', amount: '' }
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (entries.length <= 2) return;
    setEntries(entries.filter((_, i) => i !== index));
  };

  const handleLineChange = (index: number, field: keyof VoucherLine, value: string) => {
    const updated = [...entries];
    updated[index] = { ...updated[index], [field]: value };
    setEntries(updated);
  };

  const totalDebits = entries.reduce((acc, curr) => {
    return curr.entryType === 'DEBIT' ? acc + (Number(curr.amount) || 0) : acc;
  }, 0);

  const totalCredits = entries.reduce((acc, curr) => {
    return curr.entryType === 'CREDIT' ? acc + (Number(curr.amount) || 0) : acc;
  }, 0);

  const diff = Math.abs(Math.round((totalDebits - totalCredits) * 100) / 100);
  const isBalanced = diff < 0.01 && totalDebits > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!narration.trim()) {
      setError('Voucher narration is required.');
      return;
    }

    if (!isBalanced) {
      setError(`Voucher must be perfectly balanced. Current difference: ₹${diff.toFixed(2)}`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        narration: narration.trim(),
        entries: entries.map(e => ({
          glAccountCode: e.glAccountCode,
          entryType: e.entryType,
          amount: Number(e.amount)
        }))
      };

      const res = await api.post('/gl/vouchers', payload);
      if (res.data?.success) {
        onVoucherPosted();
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to post journal voucher.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 p-5 text-white flex justify-between items-center">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase tracking-wider font-semibold bg-white/20 px-2 py-0.5 rounded">
                Section 21 • Double-Entry Journal Engine
              </span>
              <span className="text-xs bg-emerald-950/60 font-bold px-2 py-0.5 rounded flex items-center">
                <Scale className="w-3 h-3 mr-1" /> &Sigma; Debits = &Sigma; Credits
              </span>
            </div>
            <h2 className="text-xl font-bold mt-1">New Double-Entry Journal Voucher</h2>
            <p className="text-xs text-emerald-100 mt-0.5">
              Post manual contra, expense, accrual or inter-branch settlement voucher directly to General Ledger.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="m-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Narration */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Voucher Narration / Business Purpose *
            </label>
            <textarea
              rows={2}
              value={narration}
              onChange={e => setNarration(e.target.value)}
              placeholder="e.g. Payment of Monthly Branch Premises Rent & Electricity Bill for September 2026..."
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              required
            />
          </div>

          {/* Lines Table */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Journal Voucher Lines (Legs)
              </label>
              <button
                type="button"
                onClick={handleAddRow}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-lg transition flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Row</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3 w-12 text-center">#</th>
                    <th className="p-3">General Ledger Account</th>
                    <th className="p-3 w-36">Entry Type</th>
                    <th className="p-3 w-40 text-right">Amount (₹)</th>
                    <th className="p-3 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {entries.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="p-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                      <td className="p-3">
                        <select
                          value={row.glAccountCode}
                          onChange={e => handleLineChange(idx, 'glAccountCode', e.target.value)}
                          className="w-full text-xs border border-slate-300 rounded-lg p-1.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        >
                          {accounts.map(a => (
                            <option key={a.code} value={a.code}>
                              [{a.code}] {a.name} ({a.category})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3">
                        <select
                          value={row.entryType}
                          onChange={e => handleLineChange(idx, 'entryType', e.target.value as any)}
                          className={`w-full text-xs font-bold border rounded-lg p-1.5 focus:outline-none ${
                            row.entryType === 'DEBIT'
                              ? 'bg-blue-50 border-blue-300 text-blue-800'
                              : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          }`}
                        >
                          <option value="DEBIT">DEBIT (नावे)</option>
                          <option value="CREDIT">CREDIT (जमा)</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={row.amount}
                          onChange={e => handleLineChange(idx, 'amount', e.target.value)}
                          className="w-full text-xs text-right font-semibold border border-slate-300 rounded-lg p-1.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                          required
                        />
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          disabled={entries.length <= 2}
                          onClick={() => handleRemoveRow(idx)}
                          className="text-slate-400 hover:text-red-600 disabled:opacity-30 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Invariant Balance Footer */}
          <div className={`p-4 rounded-xl border transition ${
            isBalanced
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-red-50 border-red-300 text-red-900'
          }`}>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex items-center space-x-2">
                {isBalanced ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                )}
                <div className="text-xs">
                  <p className="font-bold">
                    {isBalanced ? 'Voucher Invariant Satisfied: Balanced' : 'Voucher Invariant Violated: Out of Balance'}
                  </p>
                  <p className="text-[11px] opacity-80">
                    Difference: ₹{diff.toFixed(2)} (Total Debits must equal Total Credits)
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-xs">
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase block font-medium">Total Debits</span>
                  <span className="font-bold text-blue-700 text-sm">₹{totalDebits.toLocaleString()}</span>
                </div>
                <div className="text-slate-300 font-light text-lg">|</div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase block font-medium">Total Credits</span>
                  <span className="font-bold text-emerald-700 text-sm">₹{totalCredits.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-semibold text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !isBalanced}
              className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white px-6 py-2.5 rounded-xl font-semibold text-xs shadow-md transition disabled:opacity-50 flex items-center space-x-2"
            >
              {loading ? (
                <span>Posting Voucher...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Post Journal Voucher</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
