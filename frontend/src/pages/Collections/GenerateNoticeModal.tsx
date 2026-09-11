import React, { useState } from 'react';
import {
  X,
  FileText,
  Printer,
  Send,
  AlertTriangle,
  Building,
  Scale,
  Calendar,
  CheckCircle2,
  Mail
} from 'lucide-react';
import api from '../../api/client';

interface GenerateNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNoticeGenerated: () => void;
  loan: any;
}

export const GenerateNoticeModal: React.FC<GenerateNoticeModalProps> = ({
  isOpen,
  onClose,
  onNoticeGenerated,
  loan
}) => {
  const [noticeType, setNoticeType] = useState('DEMAND_2');
  const [dispatchMedium, setDispatchMedium] = useState('REGISTERED_POST');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedNotice, setGeneratedNotice] = useState<any>(null);

  if (!isOpen || !loan) return null;

  const borrowerName = `${loan.customer?.title || 'Shri'} ${loan.customer?.firstName} ${loan.customer?.lastName}`;
  const address = loan.customer?.addresses?.[0]
    ? `${loan.customer.addresses[0].addressLine1}, ${loan.customer.addresses[0].city}, ${loan.customer.addresses[0].state} - ${loan.customer.addresses[0].pincode}`
    : 'Address on Bank Master File';

  const overduePrincipal = loan.overduePrincipal || 0;
  const overdueInterest = loan.overdueInterest || 0;
  const penalCharges = loan.overduePenalty || 0;
  const totalDue = overduePrincipal + overdueInterest + penalCharges;

  const handleGenerate = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/collections/notices/generate', {
        loanAccountId: loan.id,
        noticeType,
        dispatchMedium
      });

      if (res.data?.success) {
        setGeneratedNotice(res.data.notice);
        onNoticeGenerated();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate legal notice.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-700 to-rose-700 p-5 text-white flex justify-between items-center">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase tracking-wider font-semibold bg-white/20 px-2 py-0.5 rounded">
                Section 12 • Legal & Recovery Notice Engine
              </span>
              <span className="text-xs bg-red-950/60 font-bold px-2 py-0.5 rounded">
                DPD: {loan.dpd} Days
              </span>
            </div>
            <h2 className="text-xl font-bold mt-1">Generate Demand / Statutory Legal Notice</h2>
            <p className="text-xs text-red-100 mt-0.5">
              Account: {loan.loanAccountNumber} • {borrowerName} • Dues: ₹{totalDue.toLocaleString()}
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

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {!generatedNotice ? (
            /* Notice Generation Config */
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Notice Template Category *</label>
                  <select
                    value={noticeType}
                    onChange={e => setNoticeType(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                  >
                    <option value="REMINDER_1">Notice 1: Overdue EMI Reminder (15-30 DPD)</option>
                    <option value="DEMAND_2">Notice 2: Formal Demand Notice (31-60 DPD)</option>
                    <option value="FINAL_RECALL_3">Notice 3: Final Loan Recall & Acceleration (61-90 DPD)</option>
                    <option value="SEC_101_COOP">Section 101: Statutory Recovery Certificate (MCS Act 1960)</option>
                    <option value="SEC_138_NI">Section 138: Statutory Cheque Dishonor Notice (NI Act)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Dispatch Mode *</label>
                  <select
                    value={dispatchMedium}
                    onChange={e => setDispatchMedium(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                  >
                    <option value="REGISTERED_POST">Registered Post with Acknowledgement Due (RPAD)</option>
                    <option value="SPEED_POST">Speed Post (India Post)</option>
                    <option value="HAND_DELIVERY">Hand Delivery by Bank Notice Server / Peon</option>
                    <option value="SMS_EMAIL">Digital Channels (SMS, Email, WhatsApp)</option>
                  </select>
                </div>
              </div>

              {/* Dues Breakdown Banner */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Itemized Outstanding Breakdown</span>
                <div className="grid grid-cols-4 gap-2 mt-3 text-center">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <p className="text-[10px] font-semibold text-slate-500">Overdue Principal</p>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">₹{overduePrincipal.toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <p className="text-[10px] font-semibold text-slate-500">Overdue Interest</p>
                    <p className="text-sm font-bold text-amber-700 mt-0.5">₹{overdueInterest.toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <p className="text-[10px] font-semibold text-slate-500">Penal / Late Charges</p>
                    <p className="text-sm font-bold text-red-600 mt-0.5">₹{penalCharges.toLocaleString()}</p>
                  </div>
                  <div className="bg-red-50 p-2.5 rounded-lg border border-red-200">
                    <p className="text-[10px] font-bold text-red-800">Total Demand Sum</p>
                    <p className="text-sm font-extrabold text-red-700 mt-0.5">₹{totalDue.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Notice Preview Draft */}
              <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/80 text-xs text-slate-700 space-y-2">
                <div className="flex items-center space-x-1.5 text-amber-900 font-bold">
                  <Scale className="w-4 h-4 text-amber-700" />
                  <span>Statutory Notice Formulation & Legal Ground</span>
                </div>
                <p className="text-slate-600">
                  {noticeType === 'SEC_101_COOP' && (
                    'This notice invokes Section 101 of the Maharashtra Co-operative Societies Act 1960. If the borrower does not pay within 15 days, the bank is authorized to apply directly to the Assistant Registrar of Co-operative Societies for an execution certificate to attach movable and immovable assets without filing a civil suit.'
                  )}
                  {noticeType === 'FINAL_RECALL_3' && (
                    'Final Recall Notice accelerates the total sanctioned loan principal plus overdue interest, terminating loan tenure immediately and calling upon borrower and guarantors for joint and several settlement.'
                  )}
                  {noticeType === 'DEMAND_2' && (
                    'Formal Demand Notice specifies that the account will be reported to CIBIL / Experian credit bureaus and classified as Non-Performing Asset (NPA) under RBI Master Directions if dues are not liquidated.'
                  )}
                  {noticeType === 'REMINDER_1' && (
                    'Overdue EMI Reminder serves as an initial amicable notification to avoid accumulation of penal interest and legal escalation.'
                  )}
                  {noticeType === 'SEC_138_NI' && (
                    'Notice under Section 138 of Negotiable Instruments Act 1881 requires 15 days demand for dishonored cheque / ECS mandate before initiating criminal proceedings.'
                  )}
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-red-700 to-rose-700 hover:from-red-800 hover:to-rose-800 text-white py-3 rounded-xl font-semibold text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <span>Generating Legal Notice...</span>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span>Issue Notice & Record in Dispatch Register</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Printable Letterhead Notice Display */
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-emerald-800 text-xs">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Notice <strong>{generatedNotice.noticeNumber}</strong> generated and saved to Dispatch Register!</span>
                </div>
                <button
                  onClick={handlePrint}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Notice</span>
                </button>
              </div>

              {/* Notice Paper */}
              <div className="border border-slate-300 rounded-xl p-8 bg-white shadow-sm space-y-6 text-slate-800 print:border-none print:shadow-none print:p-0">
                {/* Letterhead */}
                <div className="text-center border-b-2 border-red-700 pb-4">
                  <h1 className="text-lg font-bold text-red-800 tracking-wide">SAMRUDDHI CO-OPERATIVE URBAN BANK LTD.</h1>
                  <p className="text-[11px] text-slate-600">Reg. No: COOP/MAH/2026/0491 • Head Office: Senapati Bapat Road, Pune</p>
                  <p className="text-[11px] font-semibold text-slate-700">{loan.branch?.name || 'Main Branch Pune'}</p>
                </div>

                {/* Meta */}
                <div className="flex justify-between text-xs text-slate-600 pt-2">
                  <div>
                    <p><strong>Notice Ref:</strong> {generatedNotice.noticeNumber}</p>
                    <p><strong>Mode:</strong> {generatedNotice.dispatchMedium}</p>
                  </div>
                  <div className="text-right">
                    <p><strong>Date:</strong> {generatedNotice.generatedDate}</p>
                    <p><strong>Under:</strong> {generatedNotice.legalSection}</p>
                  </div>
                </div>

                {/* Addressee */}
                <div className="text-xs space-y-0.5">
                  <p className="font-semibold text-slate-500 uppercase">To,</p>
                  <p className="font-bold text-sm text-slate-900">{borrowerName}</p>
                  <p className="text-slate-600">{address}</p>
                  <p className="text-slate-600">Loan Account No: <strong>{loan.loanAccountNumber}</strong></p>
                </div>

                {/* Notice Title */}
                <div className="text-center py-2 bg-red-50 rounded-lg border border-red-200">
                  <h2 className="text-sm font-extrabold text-red-900 tracking-wider">
                    {generatedNotice.title}
                  </h2>
                </div>

                {/* Notice Body */}
                <div className="text-xs text-slate-700 leading-relaxed space-y-3">
                  <p>{generatedNotice.content}</p>
                  <p>
                    Please take note of your itemized default balance outstanding with the Bank as on date:
                  </p>
                  <table className="w-full text-xs border border-slate-300">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="border border-slate-300 p-2 text-left">Component</th>
                        <th className="border border-slate-300 p-2 text-right">Amount (INR)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-slate-300 p-2">Overdue Principal</td>
                        <td className="border border-slate-300 p-2 text-right font-medium">₹{generatedNotice.principalOverdue?.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 p-2">Overdue Interest</td>
                        <td className="border border-slate-300 p-2 text-right font-medium">₹{generatedNotice.interestOverdue?.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 p-2">Late Repayment Penalties</td>
                        <td className="border border-slate-300 p-2 text-right font-medium">₹{generatedNotice.penalCharges?.toLocaleString()}</td>
                      </tr>
                      <tr className="bg-red-50 font-bold">
                        <td className="border border-slate-300 p-2 text-red-900">Total Demanded Amount</td>
                        <td className="border border-slate-300 p-2 text-right text-red-900">₹{generatedNotice.dueAmount?.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                  <p>
                    You are hereby called upon to pay the said sum of <strong>₹{generatedNotice.dueAmount?.toLocaleString()}</strong> along with further interest up to the date of actual payment at our branch counter within the stipulated statutory period.
                  </p>
                </div>

                {/* Sign-off */}
                <div className="pt-8 flex justify-between text-xs text-slate-600">
                  <div>
                    <p className="text-[10px] text-slate-400">Copy To: Guarantor(s) on record</p>
                  </div>
                  <div className="text-right space-y-12">
                    <p>Yours faithfully,</p>
                    <div>
                      <p className="font-bold text-slate-900">Authorized Recovery Officer / Branch Manager</p>
                      <p className="text-[11px] text-slate-500">Samruddhi Co-operative Urban Bank Ltd.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl font-semibold text-xs transition"
                >
                  Close & Return to Worklist
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
