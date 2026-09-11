import React, { useState } from 'react';
import { X, ShieldCheck, FileText, CheckCircle, Clock, Upload, Award } from 'lucide-react';
import { MakerCheckerBadge } from '../../components/MakerCheckerBadge';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';

interface CustomerDetailModalProps {
  customer: any;
  onClose: () => void;
  onRefetch: () => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  customer,
  onClose,
  onRefetch
}) => {
  const { user } = useAuth();
  const [docType, setDocType] = useState('PAN');
  const [docNum, setDocNum] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');

  if (!customer) return null;

  const handleUploadKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docNum) return;
    setIsUploading(true);
    setUploadSuccess('');
    try {
      const res = await api.post('/kyc/upload-doc', {
        customerId: customer.id,
        documentType: docType,
        documentNumber: docNum,
        verificationRemarks: remarks || `Uploaded by Maker ${user?.fullName}`
      });
      if (res.data.success) {
        setUploadSuccess('Document submitted to Checker approval queue!');
        setDocNum('');
        setRemarks('');
        onRefetch();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm">
              {customer.firstName.charAt(0)}{customer.lastName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900">
                  {customer.title} {customer.firstName} {customer.middleName} {customer.lastName}
                </h3>
                <MakerCheckerBadge status={customer.status} />
              </div>
              <p className="text-xs text-slate-500 font-mono">
                {customer.customerNumber} {customer.isMember && `• ${customer.memberNumber}`} • Branch: {customer.branch?.name}
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

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Top Quick Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400">Customer Type</span>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{customer.customerType}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400">Pat Sanstha Member</span>
              <p className="text-xs font-bold text-slate-800 mt-0.5">
                {customer.isMember ? `Yes (${customer.memberStatus || 'Active'})` : 'No'}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400">Risk Profile</span>
              <p className={`text-xs font-bold mt-0.5 ${
                customer.riskCategory === 'LOW' ? 'text-emerald-600' :
                customer.riskCategory === 'MEDIUM' ? 'text-amber-600' : 'text-rose-600'
              }`}>
                {customer.riskCategory} Risk
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400">Contact</span>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{customer.phone}</p>
            </div>
          </div>

          {/* Demographics */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Demographics & Profile
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 text-xs border p-3.5 rounded-xl border-slate-200">
              <div><span className="text-slate-500">Date of Birth:</span> <span className="font-medium text-slate-800">{customer.dob}</span></div>
              <div><span className="text-slate-500">Gender:</span> <span className="font-medium text-slate-800">{customer.gender}</span></div>
              <div><span className="text-slate-500">Marital Status:</span> <span className="font-medium text-slate-800">{customer.maritalStatus || 'N/A'}</span></div>
              <div><span className="text-slate-500">Father/Spouse:</span> <span className="font-medium text-slate-800">{customer.fatherOrSpouseName || 'N/A'}</span></div>
              <div><span className="text-slate-500">Occupation:</span> <span className="font-medium text-slate-800">{customer.occupation || 'N/A'}</span></div>
              <div><span className="text-slate-500">Annual Income:</span> <span className="font-medium text-slate-800">₹{customer.annualIncome?.toLocaleString() || 0}</span></div>
              <div><span className="text-slate-500">PAN:</span> <span className="font-mono font-medium text-slate-800">{customer.pan || 'N/A'}</span></div>
              <div><span className="text-slate-500">Aadhaar:</span> <span className="font-mono font-medium text-slate-800">XXXXXXXX{customer.aadhaarLast4 || 'N/A'}</span></div>
              <div><span className="text-slate-500">Email:</span> <span className="font-medium text-slate-800">{customer.email || 'N/A'}</span></div>
            </div>
          </div>

          {/* Pat Sanstha Shares */}
          {customer.isMember && customer.memberShares && customer.memberShares.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Pat Sanstha Shareholding Records</span>
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50 text-slate-600 font-semibold">
                    <tr>
                      <th className="px-3 py-2 text-left">Certificate No</th>
                      <th className="px-3 py-2 text-left">Distinctive Nos</th>
                      <th className="px-3 py-2 text-center">Total Shares</th>
                      <th className="px-3 py-2 text-right">Face Value</th>
                      <th className="px-3 py-2 text-right">Total Capital</th>
                      <th className="px-3 py-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customer.memberShares.map((sh: any) => (
                      <tr key={sh.id}>
                        <td className="px-3 py-2 font-mono font-medium">{sh.shareCertificateNumber}</td>
                        <td className="px-3 py-2 font-mono">{sh.distinctFrom} to {sh.distinctTo}</td>
                        <td className="px-3 py-2 text-center font-bold">{sh.totalShares}</td>
                        <td className="px-3 py-2 text-right">₹{sh.faceValue}</td>
                        <td className="px-3 py-2 text-right font-bold text-slate-900">₹{sh.totalAmount.toLocaleString()}</td>
                        <td className="px-3 py-2 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {sh.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Nominees & Addresses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nominees */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Nominee Records
              </h4>
              <div className="border border-slate-200 p-3 rounded-xl text-xs space-y-2">
                {customer.nominees?.length === 0 ? (
                  <p className="text-slate-400">No nominee registered</p>
                ) : (
                  customer.nominees?.map((nom: any) => (
                    <div key={nom.id} className="border-b border-slate-100 pb-1.5 last:border-none last:pb-0">
                      <div className="font-bold text-slate-800">{nom.name} ({nom.relationship})</div>
                      <div className="text-[11px] text-slate-500">
                        Age: {nom.age} • Share: {nom.allocationPercentage}% {nom.isMinor && `(Minor, Guardian: ${nom.guardianName})`}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Address */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Registered Address
              </h4>
              <div className="border border-slate-200 p-3 rounded-xl text-xs space-y-1">
                {customer.addresses?.map((addr: any) => (
                  <div key={addr.id}>
                    <span className="text-[10px] font-bold bg-slate-100 px-1.5 py-0.5 rounded">{addr.addressType}</span>
                    <p className="text-slate-800 mt-1">{addr.line1} {addr.line2}</p>
                    <p className="text-slate-600">{addr.city}, {addr.state} - {addr.pincode}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* KYC Documents & Version History */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>KYC Documents & Verification History</span>
              <span className="text-[11px] font-normal text-slate-500">Versioned & Immutable</span>
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-600 font-semibold">
                  <tr>
                    <th className="px-3 py-2 text-left">Document</th>
                    <th className="px-3 py-2 text-left">Identifier / Number</th>
                    <th className="px-3 py-2 text-center">Version</th>
                    <th className="px-3 py-2 text-center">Verification Status</th>
                    <th className="px-3 py-2 text-left">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customer.kycDocuments?.map((doc: any) => (
                    <tr key={doc.id}>
                      <td className="px-3 py-2 font-bold text-slate-800">{doc.documentType}</td>
                      <td className="px-3 py-2 font-mono">{doc.documentNumber}</td>
                      <td className="px-3 py-2 text-center font-mono">v{doc.version}</td>
                      <td className="px-3 py-2 text-center">
                        <MakerCheckerBadge status={doc.status} />
                      </td>
                      <td className="px-3 py-2 text-slate-500 text-[11px]">
                        {doc.verificationRemarks || 'Awaiting review'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Upload New KYC Document (Maker functionality) */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <Upload className="w-4 h-4 text-brand-600" />
              <span>Submit / Update KYC Document (Maker Action)</span>
            </h4>
            {uploadSuccess && (
              <div className="p-2.5 bg-emerald-50 text-emerald-800 text-xs rounded border border-emerald-200">
                {uploadSuccess}
              </div>
            )}
            <form onSubmit={handleUploadKyc} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1">Doc Type</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                >
                  <option value="PAN">PAN Card</option>
                  <option value="AADHAAR">Aadhaar Card</option>
                  <option value="VOTER_ID">Voter ID</option>
                  <option value="PASSPORT">Passport</option>
                  <option value="DRIVING_LICENSE">Driving License</option>
                  <option value="PHOTO">Customer Photo</option>
                  <option value="SIGNATURE">Signature Specimen</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Doc Reference No</label>
                <input
                  type="text"
                  required
                  value={docNum}
                  onChange={(e) => setDocNum(e.target.value)}
                  placeholder="e.g. DL-12345678"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Maker Remarks</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Original verified"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isUploading}
                  className="w-full py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                  {isUploading ? 'Submitting...' : 'Upload & Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};
