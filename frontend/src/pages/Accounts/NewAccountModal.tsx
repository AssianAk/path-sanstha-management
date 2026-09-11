import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { X, PlusCircle, CheckCircle2, Calculator, Info } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface NewAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  customers: any[];
  products: any[];
}

export const NewAccountModal: React.FC<NewAccountModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  customers,
  products
}) => {
  const { user, businessDate } = useAuth();

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [initialDeposit, setInitialDeposit] = useState<number>(1000);
  const [nomineeName, setNomineeName] = useState('');
  const [nomineeRelation, setNomineeRelation] = useState('Spouse');

  // Term Deposit Params
  const [tenureMonths, setTenureMonths] = useState<number>(12);
  const [installmentAmount, setInstallmentAmount] = useState<number>(1000);
  const [payoutType, setPayoutType] = useState('ON_MATURITY');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (customers.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(customers[0].id);
      if (customers[0].nominees?.length > 0) {
        setNomineeName(customers[0].nominees[0].name);
        setNomineeRelation(customers[0].nominees[0].relationship);
      }
    }
    if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
      setInitialDeposit(products[0].minBalance || 500);
    }
  }, [customers, products, isOpen]);

  const activeProduct = products.find((p) => p.id === selectedProductId);

  // Auto update default deposit when product changes
  const handleProductChange = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      if (prod.category === 'FIXED_DEPOSIT') {
        setInitialDeposit(Math.max(10000, prod.minBalance));
      } else if (prod.category === 'CURRENT') {
        setInitialDeposit(Math.max(5000, prod.minBalance));
      } else {
        setInitialDeposit(prod.minBalance || 500);
      }
    }
  };

  const handleCustomerChange = (custId: string) => {
    setSelectedCustomerId(custId);
    const cust = customers.find((c) => c.id === custId);
    if (cust?.nominees?.length > 0) {
      setNomineeName(cust.nominees[0].name);
      setNomineeRelation(cust.nominees[0].relationship);
    } else {
      setNomineeName('');
    }
  };

  if (!isOpen) return null;

  // Projection calculation for preview
  let projectedMaturity = 0;
  if (activeProduct?.category === 'FIXED_DEPOSIT') {
    const P = Number(initialDeposit) || 0;
    const r = (activeProduct.interestRate || 7.25) / 100;
    const t = tenureMonths / 12;
    projectedMaturity = Math.round(P * Math.pow(1 + r / 4, 4 * t));
  } else if (activeProduct?.category === 'RECURRING_DEPOSIT') {
    const inst = Number(installmentAmount) || 1000;
    const r = (activeProduct.interestRate || 7.0) / 100;
    const t = tenureMonths;
    projectedMaturity = Math.round(inst * t + (inst * t * (t + 1) / 24) * r);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const payload: any = {
        customerId: selectedCustomerId,
        productId: selectedProductId,
        branchId: user?.branchId,
        initialDeposit: activeProduct?.category === 'RECURRING_DEPOSIT' ? Number(installmentAmount) : Number(initialDeposit),
        nomineeName,
        nomineeRelation,
        tenureMonths: Number(tenureMonths),
        payoutType,
        installmentAmount: Number(installmentAmount)
      };

      const res = await api.post('/accounts/open', payload);
      if (res.data.success) {
        onCreated();
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to open account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Open New Account or Term Deposit
              </h3>
              <p className="text-xs text-slate-500">
                Phase 2 Core Banking • Automated Account Numbering & ACID Posting
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border-l-4 border-rose-500 text-rose-700 rounded font-medium">
              {error}
            </div>
          )}

          {/* Customer Selection */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Select Customer / Member *
            </label>
            <select
              required
              value={selectedCustomerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.customerNumber} {c.memberNumber ? `(${c.memberNumber})` : ''} - {c.title} {c.firstName} {c.lastName} ({c.status})
                </option>
              ))}
            </select>
          </div>

          {/* Product Selection */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Select Banking Product *
            </label>
            <select
              required
              value={selectedProductId}
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-medium"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.code}] {p.name} — {p.category} ({p.interestRate}% p.a., Min Bal: ₹{p.minBalance.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic Details based on Category */}
          {activeProduct && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Product Parameters ({activeProduct.category})
                </span>
                <span className="bg-brand-50 text-brand-700 font-bold px-2 py-0.5 rounded text-[10px] border border-brand-200">
                  {activeProduct.interestRate}% Annual Interest
                </span>
              </div>

              {/* Deposit Inputs */}
              {activeProduct.category === 'RECURRING_DEPOSIT' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Monthly Installment (₹) *
                    </label>
                    <input
                      type="number"
                      min="500"
                      step="500"
                      required
                      value={installmentAmount}
                      onChange={(e) => setInstallmentAmount(Number(e.target.value))}
                      className="w-full p-2 border border-slate-300 rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Tenure (Months) *
                    </label>
                    <select
                      value={tenureMonths}
                      onChange={(e) => setTenureMonths(Number(e.target.value))}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    >
                      <option value="12">12 Months (1 Year)</option>
                      <option value="24">24 Months (2 Years)</option>
                      <option value="36">36 Months (3 Years)</option>
                      <option value="60">60 Months (5 Years)</option>
                    </select>
                  </div>
                </div>
              ) : activeProduct.category === 'FIXED_DEPOSIT' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Lump-Sum Deposit Amount (₹) *
                    </label>
                    <input
                      type="number"
                      min={activeProduct.minBalance}
                      step="1000"
                      required
                      value={initialDeposit}
                      onChange={(e) => setInitialDeposit(Number(e.target.value))}
                      className="w-full p-2 border border-slate-300 rounded-lg font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Tenure (Months) *
                    </label>
                    <select
                      value={tenureMonths}
                      onChange={(e) => setTenureMonths(Number(e.target.value))}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    >
                      <option value="6">6 Months</option>
                      <option value="12">12 Months (1 Year)</option>
                      <option value="24">24 Months (2 Years)</option>
                      <option value="36">36 Months (3 Years)</option>
                      <option value="60">60 Months (5 Years)</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Initial Cash Deposit (₹)
                  </label>
                  <input
                    type="number"
                    min={activeProduct.minBalance}
                    value={initialDeposit}
                    onChange={(e) => setInitialDeposit(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg font-bold text-slate-900"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Minimum required opening balance: ₹{activeProduct.minBalance.toLocaleString()}
                  </p>
                </div>
              )}

              {/* Projection Box for Term Deposits */}
              {(activeProduct.category === 'FIXED_DEPOSIT' || activeProduct.category === 'RECURRING_DEPOSIT') && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-indigo-900">
                    <Calculator className="w-4 h-4 text-indigo-600" />
                    <span>Projected Maturity Value ({tenureMonths} mos):</span>
                  </div>
                  <span className="font-mono font-bold text-sm text-indigo-900">
                    ₹{projectedMaturity.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Nominee Details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Account Nominee Name
              </label>
              <input
                type="text"
                value={nomineeName}
                onChange={(e) => setNomineeName(e.target.value)}
                placeholder="Nominee full name"
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Relationship
              </label>
              <input
                type="text"
                value={nomineeRelation}
                onChange={(e) => setNomineeRelation(e.target.value)}
                placeholder="e.g. Spouse, Son"
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
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
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center space-x-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Opening...' : 'Open Account & Post Initial Deposit'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
