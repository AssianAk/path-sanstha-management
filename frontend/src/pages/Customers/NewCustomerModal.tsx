import React, { useState } from 'react';
import api from '../../api/client';
import { X, UserPlus, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface NewCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  branches: any[];
}

export const NewCustomerModal: React.FC<NewCustomerModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  branches
}) => {
  const { user } = useAuth();

  const [form, setForm] = useState({
    customerType: 'INDIVIDUAL',
    isMember: true,
    title: 'Shri',
    firstName: '',
    middleName: '',
    lastName: '',
    dob: '1990-01-01',
    gender: 'MALE',
    maritalStatus: 'MARRIED',
    fatherOrSpouseName: '',
    occupation: 'Salaried / Professional',
    annualIncome: '500000',
    pan: '',
    aadhaarLast4: '',
    phone: '',
    email: '',
    branchId: user?.branchId || (branches[0]?.id || ''),
    riskCategory: 'LOW',
    memberSharesCount: 50,
    // Address
    line1: '',
    line2: '',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411001',
    // Nominee
    nomineeName: '',
    nomineeRelationship: 'Spouse',
    nomineeAge: '32',
    isNomineeMinor: false,
    guardianName: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const payload = {
        customerType: form.customerType,
        isMember: form.isMember,
        title: form.title,
        firstName: form.firstName,
        middleName: form.middleName,
        lastName: form.lastName,
        dob: form.dob,
        gender: form.gender,
        maritalStatus: form.maritalStatus,
        fatherOrSpouseName: form.fatherOrSpouseName,
        occupation: form.occupation,
        annualIncome: form.annualIncome,
        pan: form.pan,
        aadhaarLast4: form.aadhaarLast4,
        phone: form.phone,
        email: form.email,
        branchId: form.branchId,
        riskCategory: form.riskCategory,
        memberSharesCount: form.isMember ? Number(form.memberSharesCount) : 0,
        addresses: [
          {
            addressType: 'PERMANENT',
            line1: form.line1 || 'Main Road',
            line2: form.line2,
            city: form.city,
            state: form.state,
            pincode: form.pincode,
            isPrimary: true
          }
        ],
        nominees: form.nomineeName
          ? [
              {
                name: form.nomineeName,
                relationship: form.nomineeRelationship,
                age: Number(form.nomineeAge) || 30,
                allocationPercentage: 100,
                isMinor: form.isNomineeMinor,
                guardianName: form.guardianName
              }
            ]
          : []
      };

      const res = await api.post('/customers', payload);
      if (res.data.success) {
        onCreated();
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to onboard customer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                New Customer & Member Onboarding
              </h3>
              <p className="text-xs text-slate-500">
                Phase 1 Foundation Master Data • Triggers Maker-Checker Workflow
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border-l-4 border-rose-500 text-rose-700 text-xs rounded">
              {error}
            </div>
          )}

          {/* Section 1: Customer Classification & Membership */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              1. Customer Type & Membership
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Type</label>
                <select
                  value={form.customerType}
                  onChange={(e) => setForm({ ...form, customerType: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                >
                  <option value="INDIVIDUAL">Individual</option>
                  <option value="JOINT">Joint Holder</option>
                  <option value="MINOR">Minor</option>
                  <option value="SOLE_PROPRIETOR">Sole Proprietor</option>
                  <option value="PARTNERSHIP">Partnership / Firm</option>
                  <option value="COMPANY">Company / Society</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Branch</label>
                <select
                  value={form.branchId}
                  onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code} - {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Risk Profile</label>
                <select
                  value={form.riskCategory}
                  onChange={(e) => setForm({ ...form, riskCategory: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                >
                  <option value="LOW">Low Risk</option>
                  <option value="MEDIUM">Medium Risk</option>
                  <option value="HIGH">High Risk</option>
                </select>
              </div>
            </div>

            {/* Membership Toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isMember}
                  onChange={(e) => setForm({ ...form, isMember: e.target.checked })}
                  className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
                />
                <span className="text-xs font-bold text-slate-800">
                  Admit as Pat Sanstha / Co-operative Shareholder Member
                </span>
              </label>

              {form.isMember && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-600">Initial Shares:</span>
                  <input
                    type="number"
                    min="10"
                    value={form.memberSharesCount}
                    onChange={(e) => setForm({ ...form, memberSharesCount: Number(e.target.value) })}
                    className="w-20 text-xs p-1.5 border border-slate-300 rounded-lg text-center font-bold"
                  />
                  <span className="text-xs text-slate-500">(₹10 face value)</span>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Personal Demographics */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              2. Personal & Contact Information
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
                <select
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                >
                  <option value="Shri">Shri</option>
                  <option value="Smt">Smt</option>
                  <option value="Kumari">Kumari</option>
                  <option value="Dr.">Dr.</option>
                  <option value="M/s">M/s</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                  placeholder="e.g. Ramesh"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Middle Name</label>
                <input
                  type="text"
                  value={form.middleName}
                  onChange={(e) => setForm({ ...form, middleName: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                  placeholder="e.g. Shankar"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                  placeholder="e.g. Jadhav"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth *</label>
                <input
                  type="date"
                  required
                  value={form.dob}
                  onChange={(e) => setForm({ ...form, dob: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gender *</label>
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Father / Spouse Name</label>
                <input
                  type="text"
                  value={form.fatherOrSpouseName}
                  onChange={(e) => setForm({ ...form, fatherOrSpouseName: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                  placeholder="Father or Husband name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Phone *</label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                  placeholder="10-digit mobile"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                  placeholder="optional"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">PAN Card</label>
                <input
                  type="text"
                  maxLength={10}
                  value={form.pan}
                  onChange={(e) => setForm({ ...form, pan: e.target.value.toUpperCase() })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg font-mono uppercase"
                  placeholder="ABCDE1234F"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Aadhaar (Last 4 digits)</label>
                <input
                  type="text"
                  maxLength={4}
                  value={form.aadhaarLast4}
                  onChange={(e) => setForm({ ...form, aadhaarLast4: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg font-mono"
                  placeholder="e.g. 5432"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Permanent Address */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              3. Permanent Residential Address
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address Line 1</label>
                <input
                  type="text"
                  value={form.line1}
                  onChange={(e) => setForm({ ...form, line1: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                  placeholder="House/Plot/Apartment"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address Line 2 / Landmark</label>
                <input
                  type="text"
                  value={form.line2}
                  onChange={(e) => setForm({ ...form, line2: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                  placeholder="Street / Area"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pincode</label>
                <input
                  type="text"
                  maxLength={6}
                  value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Nominee Records */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              4. Nominee Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nominee Full Name</label>
                <input
                  type="text"
                  value={form.nomineeName}
                  onChange={(e) => setForm({ ...form, nomineeName: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                  placeholder="Nominee name"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Relationship</label>
                <select
                  value={form.nomineeRelationship}
                  onChange={(e) => setForm({ ...form, nomineeRelationship: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                >
                  <option value="Spouse">Spouse</option>
                  <option value="Son">Son</option>
                  <option value="Daughter">Daughter</option>
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Brother">Brother</option>
                  <option value="Sister">Sister</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Age</label>
                <input
                  type="number"
                  value={form.nomineeAge}
                  onChange={(e) => setForm({ ...form, nomineeAge: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Registering...' : 'Register & Submit to Checker'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
