import React, { useState, useEffect } from 'react';
import {
  X,
  PhoneCall,
  MapPin,
  Users,
  Calendar,
  IndianRupee,
  Clock,
  CheckCircle2,
  AlertTriangle,
  History,
  Send
} from 'lucide-react';
import api from '../../api/client';

interface RecoveryActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActionLogged: () => void;
  loan: any;
}

export const RecoveryActionModal: React.FC<RecoveryActionModalProps> = ({
  isOpen,
  onClose,
  onActionLogged,
  loan
}) => {
  const [actionType, setActionType] = useState('FIELD_VISIT');
  const [actionDate, setActionDate] = useState('2026-09-11');
  const [customerResponse, setCustomerResponse] = useState('WILL_PAY');
  const [promisedPaymentDate, setPromisedPaymentDate] = useState('');
  const [promisedAmount, setPromisedAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (isOpen && loan?.id) {
      fetchHistory();
      setPromisedAmount(loan.totalOverdue ? String(loan.totalOverdue) : '');
    }
  }, [isOpen, loan]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get(`/collections/recovery-actions/${loan.id}`);
      if (res.data?.success) {
        setHistory(res.data.actions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  if (!isOpen || !loan) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      setError('Field notes / interaction details are required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        loanAccountId: loan.id,
        actionType,
        actionDate,
        customerResponse,
        promisedPaymentDate: promisedPaymentDate || null,
        promisedAmount: promisedAmount ? Number(promisedAmount) : null,
        notes: notes.trim(),
        followUpDate: followUpDate || null
      };

      const res = await api.post('/collections/recovery-actions', payload);
      if (res.data?.success) {
        onActionLogged();
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to record recovery action.');
    } finally {
      setLoading(false);
    }
  };

  const borrowerName = `${loan.customer?.title || 'Shri'} ${loan.customer?.firstName} ${loan.customer?.lastName}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-5 text-white flex justify-between items-center">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase tracking-wider font-semibold bg-white/20 px-2 py-0.5 rounded">
                Section 11 • Field Recovery Tracker
              </span>
              <span className="text-xs bg-red-900/50 text-red-100 font-bold px-2 py-0.5 rounded">
                DPD: {loan.dpd} Days
              </span>
            </div>
            <h2 className="text-xl font-bold mt-1">Log Field Visit & Borrower Interaction</h2>
            <p className="text-xs text-amber-100 mt-0.5">
              Account: {loan.loanAccountNumber} • {borrowerName} • Total Overdue: ₹{(loan.totalOverdue || 0).toLocaleString()}
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

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 max-h-[75vh] overflow-y-auto">
          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">New Interaction Log</h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Interaction Type *</label>
              <select
                value={actionType}
                onChange={e => setActionType(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="FIELD_VISIT">Field Visit (Residence / Business)</option>
                <option value="PHONE_CALL">Telephone Reminder Call</option>
                <option value="BRANCH_MEETING">Branch Counter Meeting</option>
                <option value="GUARANTOR_CONTACT">Guarantor Contact & Notice</option>
                <option value="LEGAL_MEETING">Legal / Co-op Arbitrator Meeting</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Visit Date *</label>
                <input
                  type="date"
                  value={actionDate}
                  onChange={e => setActionDate(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Borrower Stance *</label>
                <select
                  value={customerResponse}
                  onChange={e => setCustomerResponse(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="WILL_PAY">Will Pay / Promised (PTP)</option>
                  <option value="FINANCIAL_DISTRESS">Financial Distress / Medical</option>
                  <option value="DISPUTED">Disputed Overdue Sum</option>
                  <option value="NOT_CONTACTABLE">Not Contactable / Locked</option>
                  <option value="REFUSED">Wilful Refusal to Pay</option>
                </select>
              </div>
            </div>

            {/* PTP fields */}
            <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200/70 space-y-2">
              <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wide flex items-center">
                <Clock className="w-3 h-3 mr-1 text-amber-700" /> Promise To Pay (PTP) Commitment
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-amber-900 mb-1">Promised Date</label>
                  <input
                    type="date"
                    value={promisedPaymentDate}
                    onChange={e => setPromisedPaymentDate(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-amber-300 rounded-lg bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-amber-900 mb-1">Promised Sum (₹)</label>
                  <input
                    type="number"
                    value={promisedAmount}
                    onChange={e => setPromisedAmount(e.target.value)}
                    placeholder="e.g. 25000"
                    className="w-full text-xs px-2.5 py-1.5 border border-amber-300 rounded-lg bg-white focus:outline-none font-semibold"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Field Visit Notes & Observations *</label>
              <textarea
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Record exact borrower discussion, verification of security assets, guarantor response, etc..."
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Next Follow-Up Reminder Date</label>
              <input
                type="date"
                value={followUpDate}
                onChange={e => setFollowUpDate(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white py-2.5 rounded-xl font-semibold text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <span>Recording...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Save Recovery Record</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* History Timeline */}
          <div className="p-5 bg-slate-50/50">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center">
              <History className="w-3.5 h-3.5 mr-1 text-slate-500" /> Interaction History ({history.length})
            </h3>

            {loadingHistory ? (
              <div className="text-xs text-slate-400 py-6 text-center">Loading past interactions...</div>
            ) : history.length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center bg-white rounded-xl border border-dashed border-slate-200 p-4">
                No past recovery actions logged for this loan account yet.
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((h, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 text-xs shadow-xs space-y-1.5">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-slate-800 flex items-center">
                        {h.actionType === 'FIELD_VISIT' && <MapPin className="w-3 h-3 mr-1 text-orange-600" />}
                        {h.actionType === 'PHONE_CALL' && <PhoneCall className="w-3 h-3 mr-1 text-blue-600" />}
                        {h.actionType}
                      </span>
                      <span className="text-[10px] text-slate-400">{h.actionDate}</span>
                    </div>
                    <p className="text-slate-600 italic text-[11px]">"{h.notes}"</p>
                    {h.promisedPaymentDate && (
                      <div className="bg-amber-50 text-amber-800 px-2 py-1 rounded text-[10px] font-medium flex justify-between">
                        <span>PTP: {h.promisedPaymentDate}</span>
                        <span>₹{Number(h.promisedAmount || 0).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="text-[10px] text-slate-400 pt-1 flex justify-between border-t border-slate-100">
                      <span>Officer: {h.collector?.fullName || 'Collector'}</span>
                      <span className="font-semibold text-slate-600">{h.customerResponse}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
