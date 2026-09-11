import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { X, FileText, CheckCircle2, Calculator, ShieldCheck, UserCheck } from 'lucide-react';

interface NewLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  customers: any[];
  loanProducts: any[];
}

export const NewLoanModal: React.FC<NewLoanModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  customers,
  loanProducts
}) => {
  const { user } = useAuth();

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [requestedAmount, setRequestedAmount] = useState<number>(200000);
  const [requestedTenure, setRequestedTenure] = useState<number>(24);
  const [purpose, setPurpose] = useState('Business inventory and equipment expansion');

  // Guarantor
  const [guarantorName, setGuarantorName] = useState('');
  const [guarantorRelation, setGuarantorRelation] = useState('Brother');
  const [guarantorPhone, setGuarantorPhone] = useState('9822000000');
  const [guarantorNetWorth, setGuarantorNetWorth] = useState('1500000');

  // Collateral
  const [collateralType, setCollateralType] = useState('PROPERTY');
  const [collateralDesc, setCollateralDesc] = useState('Residential apartment / commercial shop title deed');
  const [marketValue, setMarketValue] = useState('800000');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (customers.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(customers[0].id);
    }
    if (loanProducts.length > 0 && !selectedProductId) {
      setSelectedProductId(loanProducts[0].id);
    }
  }, [customers, loanProducts, isOpen]);

  const activeProduct = loanProducts.find((p) => p.id === selectedProductId);

  // Approximate EMI
  let estimatedEmi = 0;
  if (activeProduct && requestedAmount > 0 && requestedTenure > 0) {
    const r = (activeProduct.interestRate / 100) / 12;
    const n = requestedTenure;
    estimatedEmi = Math.round((requestedAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
  }

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const payload = {
        customerId: selectedCustomerId,
        loanProductId: selectedProductId,
        branchId: user?.branchId,
        requestedAmount: Number(requestedAmount),
        requestedTenureMonths: Number(requestedTenure),
        purpose,
        guarantors: guarantorName ? [
          {
            name: guarantorName,
            relationship: guarantorRelation,
            phone: guarantorPhone,
            netWorth: Number(guarantorNetWorth) || 0
          }
        ] : [],
        collaterals: collateralDesc ? [
          {
            collateralType,
            description: collateralDesc,
            marketValue: Number(marketValue) || 0,
            assessedValue: Math.round(Number(marketValue) * 0.75)
          }
        ] : []
      };

      const res = await api.post('/loans/applications', payload);
      if (res.data.success) {
        onCreated();
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit loan application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Loan Origination System (LOS) Application
              </h3>
              <p className="text-xs text-slate-500">
                Section 10 • Borrower Appraisal, Collateral & Guarantor Assessment
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border-l-4 border-rose-500 text-rose-700 rounded font-medium">
              {error}
            </div>
          )}

          {/* Customer & Product Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Select Borrower (Customer / Member) *
              </label>
              <select
                required
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} {c.firstName} {c.lastName} ({c.customerNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Select Loan Scheme / Product *
              </label>
              <select
                required
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-medium"
              >
                {loanProducts.map((lp) => (
                  <option key={lp.id} value={lp.id}>
                    [{lp.code}] {lp.name} ({lp.interestRate}% p.a.)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount, Tenure & EMI Estimate Box */}
          <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Requested Loan Amount (₹) *
                </label>
                <input
                  type="number"
                  min={activeProduct?.minAmount || 10000}
                  max={activeProduct?.maxAmount || 5000000}
                  step="5000"
                  required
                  value={requestedAmount}
                  onChange={(e) => setRequestedAmount(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg font-bold font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Requested Tenure (Months) *
                </label>
                <select
                  value={requestedTenure}
                  onChange={(e) => setRequestedTenure(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                >
                  <option value="12">12 Months (1 Year)</option>
                  <option value="24">24 Months (2 Years)</option>
                  <option value="36">36 Months (3 Years)</option>
                  <option value="48">48 Months (4 Years)</option>
                  <option value="60">60 Months (5 Years)</option>
                  <option value="84">84 Months (7 Years)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-amber-200/80">
              <div className="flex items-center space-x-1.5 text-amber-900">
                <Calculator className="w-4 h-4 text-amber-600" />
                <span>Estimated Monthly EMI (@ {activeProduct?.interestRate}% Reducing):</span>
              </div>
              <span className="font-mono font-extrabold text-sm text-amber-950">
                ₹{estimatedEmi.toLocaleString()} / mo
              </span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Loan Purpose & End-Use *
            </label>
            <input
              type="text"
              required
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Working capital, vehicle purchase, tractor finance"
              className="w-full p-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          {/* Collateral & Security */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Collateral & Primary Security
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 mb-1">Collateral Type</label>
                <select
                  value={collateralType}
                  onChange={(e) => setCollateralType(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="PROPERTY">Immovable Property / Land</option>
                  <option value="GOLD">Gold Ornaments</option>
                  <option value="FD_LIEN">Bank Fixed Deposit Lien</option>
                  <option value="VEHICLE">Vehicle Hypothecation</option>
                  <option value="SHARES">Pat Sanstha Shares</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-slate-600 mb-1">Description / Asset Ref</label>
                <input
                  type="text"
                  value={collateralDesc}
                  onChange={(e) => setCollateralDesc(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Guarantor Details */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Guarantor / Co-Applicant Details
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 mb-1">Guarantor Name</label>
                <input
                  type="text"
                  value={guarantorName}
                  onChange={(e) => setGuarantorName(e.target.value)}
                  placeholder="Full name"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Relationship</label>
                <input
                  type="text"
                  value={guarantorRelation}
                  onChange={(e) => setGuarantorRelation(e.target.value)}
                  placeholder="e.g. Brother, Friend"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={guarantorPhone}
                  onChange={(e) => setGuarantorPhone(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center space-x-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting Application...' : 'Submit to Loan Appraisal Queue'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
