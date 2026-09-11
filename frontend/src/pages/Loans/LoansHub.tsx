import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import {
  Award,
  Search,
  Plus,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  Briefcase,
  DollarSign,
  Layers,
  FileCheck2,
  Calendar
} from 'lucide-react';
import { MakerCheckerBadge } from '../../components/MakerCheckerBadge';
import { NewLoanModal } from './NewLoanModal';
import { LoanDetailModal } from './LoanDetailModal';
import { LoanRepaymentModal } from './LoanRepaymentModal';

export const LoansHub: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'PORTFOLIO' | 'LOS' | 'PRODUCTS'>('PORTFOLIO');

  const [loans, setLoans] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loanProducts, setLoanProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [search, setSearch] = useState('');

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [repayingLoan, setRepayingLoan] = useState<any>(null);

  // Appraisal & Sanction Prompt states
  const [appraisingApp, setAppraisingApp] = useState<any>(null);
  const [riskGrade, setRiskGrade] = useState('GRADE_A');
  const [appraisalNotes, setAppraisalNotes] = useState('Satisfactory credit history and adequate collateral security.');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [loansRes, appsRes, prodsRes, custsRes] = await Promise.all([
        api.get('/loans/accounts'),
        api.get('/loans/applications'),
        api.get('/loans/products'),
        api.get('/customers?status=ACTIVE')
      ]);
      setLoans(loansRes.data.loans || []);
      setApplications(appsRes.data.applications || []);
      setLoanProducts(prodsRes.data.products || []);
      setCustomers(custsRes.data.customers || []);
    } catch (err) {
      console.error('Failed to load loans data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAppraise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appraisingApp) return;
    try {
      const res = await api.post(`/loans/applications/${appraisingApp.id}/appraise`, {
        riskGrade,
        appraisalNotes
      });
      if (res.data.success) {
        setAppraisingApp(null);
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Appraisal failed');
    }
  };

  const handleSanction = async (appId: string) => {
    if (!window.confirm('Are you sure you want to sanction this loan application?')) return;
    try {
      const res = await api.post(`/loans/applications/${appId}/sanction`, {
        action: 'SANCTION'
      });
      if (res.data.success) {
        alert(res.data.message);
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Sanction failed');
    }
  };

  const handleDisburseFromLOS = async (appId: string) => {
    try {
      const res = await api.post(`/loans/applications/${appId}/disburse`, {});
      if (res.data.success) {
        alert(res.data.message);
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Disbursement failed');
    }
  };

  const totalOutstanding = loans.reduce((acc, l) => acc + (l.principalOutstanding || 0), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Award className="w-5 h-5 text-amber-600" />
            <span>Loans & Advances Management Hub</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Loan Origination System (LOS), Credit Appraisal, Sanctioning & Waterfall Repayment Servicing
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchData}
            className="p-2 border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Apply for Loan (LOS)</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('PORTFOLIO')}
          className={`pb-3 px-4 flex items-center space-x-2 border-b-2 transition-all ${
            activeTab === 'PORTFOLIO'
              ? 'border-amber-600 text-amber-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4 text-amber-600" />
          <span>Active Loan Portfolio ({loans.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('LOS')}
          className={`pb-3 px-4 flex items-center space-x-2 border-b-2 transition-all ${
            activeTab === 'LOS'
              ? 'border-brand-600 text-brand-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4 text-brand-600" />
          <span>Origination Pipeline ({applications.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('PRODUCTS')}
          className={`pb-3 px-4 flex items-center space-x-2 border-b-2 transition-all ${
            activeTab === 'PRODUCTS'
              ? 'border-indigo-600 text-indigo-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Briefcase className="w-4 h-4 text-indigo-600" />
          <span>Loan Schemes & Rates ({loanProducts.length})</span>
        </button>
      </div>

      {/* TAB 1: ACTIVE LOANS PORTFOLIO */}
      {activeTab === 'PORTFOLIO' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Loan Account & Scheme</th>
                    <th className="px-4 py-3">Borrower (Customer)</th>
                    <th className="px-4 py-3 text-right">Sanctioned</th>
                    <th className="px-4 py-3 text-right">Principal Outstanding</th>
                    <th className="px-4 py-3 text-right">Monthly EMI</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loans.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                        No active disbursed loans in portfolio.
                      </td>
                    </tr>
                  ) : (
                    loans.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-mono">
                          <div className="font-bold text-slate-900">{l.loanAccountNumber}</div>
                          <div className="text-[11px] text-amber-700 font-sans font-medium mt-0.5">
                            {l.loanProduct?.name} ({l.interestRate}%)
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">
                            {l.customer?.title} {l.customer?.firstName} {l.customer?.lastName}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {l.customer?.customerNumber}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-right font-mono font-medium text-slate-600">
                          ₹{l.sanctionedAmount?.toLocaleString()}
                        </td>

                        <td className="px-4 py-3 text-right font-mono font-bold text-amber-950">
                          ₹{l.principalOutstanding?.toLocaleString()}
                        </td>

                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                          ₹{l.emiAmount?.toLocaleString()}
                        </td>

                        <td className="px-4 py-3 text-center">
                          <MakerCheckerBadge status={l.status} />
                        </td>

                        <td className="px-4 py-3 text-right space-x-1">
                          <button
                            onClick={() => setSelectedLoan(l)}
                            className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors inline-flex items-center space-x-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Schedule</span>
                          </button>

                          {l.status === 'ACTIVE' && (
                            <button
                              onClick={() => setRepayingLoan(l)}
                              className="px-2.5 py-1 text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-md transition-colors inline-flex items-center space-x-1"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>Repay</span>
                            </button>
                          )}
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

      {/* TAB 2: ORIGINATION PIPELINE (LOS) */}
      {activeTab === 'LOS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden text-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Application #</th>
                  <th className="px-4 py-3">Applicant</th>
                  <th className="px-4 py-3">Scheme</th>
                  <th className="px-4 py-3 text-right">Requested</th>
                  <th className="px-4 py-3 text-center">Risk Grade</th>
                  <th className="px-4 py-3 text-center">Stage</th>
                  <th className="px-4 py-3 text-right">Workflow Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                      No loan applications in pipeline.
                    </td>
                  </tr>
                ) : (
                  applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        {app.applicationNumber}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">
                          {app.customer?.title} {app.customer?.firstName} {app.customer?.lastName}
                        </div>
                        <div className="text-[10px] text-slate-400">{app.customer?.phone}</div>
                      </td>

                      <td className="px-4 py-3 text-slate-700">
                        {app.loanProduct?.name}
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                        ₹{app.requestedAmount?.toLocaleString()}
                        <div className="text-[10px] text-slate-400 font-normal">{app.requestedTenureMonths} Mos</div>
                      </td>

                      <td className="px-4 py-3 text-center">
                        {app.riskGrade ? (
                          <span className="font-bold px-2 py-0.5 rounded text-[10px] bg-indigo-100 text-indigo-800">
                            {app.riskGrade}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Pending</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <MakerCheckerBadge status={app.status} />
                      </td>

                      <td className="px-4 py-3 text-right space-x-1.5">
                        {app.status === 'SUBMITTED' && (
                          <button
                            onClick={() => setAppraisingApp(app)}
                            className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded text-xs"
                          >
                            Appraise
                          </button>
                        )}

                        {app.status === 'APPRAISED' && (
                          <button
                            onClick={() => handleSanction(app.id)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-xs shadow-xs"
                          >
                            Sanction
                          </button>
                        )}

                        {app.status === 'SANCTIONED' && (
                          <button
                            onClick={() => handleDisburseFromLOS(app.id)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-xs shadow-xs"
                          >
                            Disburse
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedLoan(app)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PRODUCTS & SCHEMES */}
      {activeTab === 'PRODUCTS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {loanProducts.map((p) => (
            <div key={p.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex justify-between items-start">
                <span className="font-mono text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-bold border border-amber-200">
                  {p.code}
                </span>
                <span className="text-emerald-700 font-extrabold text-sm font-mono">
                  {p.interestRate}% p.a.
                </span>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{p.name}</h4>
                <p className="text-[11px] text-slate-500 mt-1">{p.description}</p>
              </div>
              <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px] text-slate-600">
                <div className="flex justify-between">
                  <span>Tenure Limits:</span>
                  <span className="font-semibold text-slate-800">{p.minTenureMonths} - {p.maxTenureMonths} Mos</span>
                </div>
                <div className="flex justify-between">
                  <span>Interest Method:</span>
                  <span className="font-semibold text-slate-800">{p.interestType}</span>
                </div>
                <div className="flex justify-between">
                  <span>Processing Fee:</span>
                  <span className="font-semibold text-slate-800">{p.processingFeePercent}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Appraisal Modal */}
      {appraisingApp && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 text-xs">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">Loan Credit Appraisal</h3>
              <button onClick={() => setAppraisingApp(null)}>✕</button>
            </div>
            <form onSubmit={handleAppraise} className="p-6 space-y-4">
              <div>
                <span className="text-slate-500">Applicant:</span>
                <p className="font-bold text-slate-900 text-sm">
                  {appraisingApp.customer?.firstName} {appraisingApp.customer?.lastName}
                </p>
                <p className="text-[11px] text-slate-500 font-mono">
                  Requested: ₹{appraisingApp.requestedAmount?.toLocaleString()} for {appraisingApp.requestedTenureMonths} Mos
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Risk Grade</label>
                <select
                  value={riskGrade}
                  onChange={(e) => setRiskGrade(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                >
                  <option value="GRADE_A">GRADE_A (Prime / Low Risk, Clear Security)</option>
                  <option value="GRADE_B">GRADE_B (Moderate Risk, Standard Terms)</option>
                  <option value="GRADE_C">GRADE_C (Higher Risk, Additional Covenants)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Credit Appraisal Notes *</label>
                <textarea
                  rows={3}
                  required
                  value={appraisalNotes}
                  onChange={(e) => setAppraisalNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAppraisingApp(null)}
                  className="px-4 py-2 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg"
                >
                  Submit Appraisal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Loan Modal */}
      <NewLoanModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onCreated={fetchData}
        customers={customers}
        loanProducts={loanProducts}
      />

      {/* Loan Detail & Amortization Modal */}
      {selectedLoan && (
        <LoanDetailModal
          loan={selectedLoan}
          onClose={() => setSelectedLoan(null)}
          onRepayClick={(l) => setRepayingLoan(l)}
          onDisburseSuccess={fetchData}
        />
      )}

      {/* Loan Repayment Modal */}
      {repayingLoan && (
        <LoanRepaymentModal
          loan={repayingLoan}
          onClose={() => setRepayingLoan(null)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
};
