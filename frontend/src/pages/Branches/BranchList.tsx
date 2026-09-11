import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import {
  Building2,
  Calendar,
  Plus,
  RefreshCw,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const BranchList: React.FC = () => {
  const { user, setBusinessDate } = useAuth();
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Business Date Modal
  const [selectedBranchForEod, setSelectedBranchForEod] = useState<any>(null);
  const [nextDate, setNextDate] = useState('');
  const [statusVal, setStatusVal] = useState('OPEN');
  const [isUpdatingDate, setIsUpdatingDate] = useState(false);
  const [dateMsg, setDateMsg] = useState('');

  // New Branch Modal
  const [isNewBranchModal, setIsNewBranchModal] = useState(false);
  const [newBranch, setNewBranch] = useState({
    code: '',
    name: '',
    ifscCode: 'SMRB000000',
    micrCode: '41109900',
    address: '',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411001',
    phone: '',
    email: ''
  });
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);
  const [branchError, setBranchError] = useState('');

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const res = await api.get('/org/branches');
      setBranches(res.data.branches || []);
    } catch (err) {
      console.error('Failed to load branches', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleUpdateBusinessDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranchForEod || !nextDate) return;
    setIsUpdatingDate(true);
    setDateMsg('');

    try {
      const res = await api.post('/org/business-date/update', {
        branchId: selectedBranchForEod.id,
        nextDate,
        status: statusVal
      });

      if (res.data.success) {
        setDateMsg('Business date updated successfully!');
        if (selectedBranchForEod.id === user?.branchId) {
          setBusinessDate(nextDate);
        }
        setTimeout(() => {
          setSelectedBranchForEod(null);
          setDateMsg('');
          fetchBranches();
        }, 1000);
      }
    } catch (err: any) {
      setDateMsg(err.response?.data?.message || 'Failed to update business date.');
    } finally {
      setIsUpdatingDate(false);
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingBranch(true);
    setBranchError('');

    try {
      const res = await api.post('/org/branches', newBranch);
      if (res.data.success) {
        setIsNewBranchModal(false);
        setNewBranch({
          code: '',
          name: '',
          ifscCode: 'SMRB000000',
          micrCode: '41109900',
          address: '',
          city: 'Pune',
          state: 'Maharashtra',
          pincode: '411001',
          phone: '',
          email: ''
        });
        fetchBranches();
      }
    } catch (err: any) {
      setBranchError(err.response?.data?.message || 'Failed to create branch.');
    } finally {
      setIsCreatingBranch(false);
    }
  };

  const canManageBranches = ['SUPER_ADMIN', 'HO_ADMIN'].includes(user?.role || '');
  const canControlDate = ['SUPER_ADMIN', 'HO_ADMIN', 'BRANCH_MANAGER'].includes(user?.role || '');

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-brand-600" />
            <span>Branch Hierarchy & Business Date Control</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational governance • EOD Business Date independent of server wall clock (Section 22)
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchBranches}
            className="p-2 border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {canManageBranches && (
            <button
              onClick={() => setIsNewBranchModal(true)}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Branch</span>
            </button>
          )}
        </div>
      </div>

      {/* Branch Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Branch Code & Name</th>
                <th className="px-4 py-3">Routing (IFSC / MICR)</th>
                <th className="px-4 py-3">Location & City</th>
                <th className="px-4 py-3 text-center">Active Business Date</th>
                <th className="px-4 py-3 text-center">Day Status</th>
                <th className="px-4 py-3 text-center">Staff & Counters</th>
                <th className="px-4 py-3 text-right">Date Rollover</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Loading branches...
                  </td>
                </tr>
              ) : (
                branches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{b.name}</div>
                      <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                        {b.code}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-mono text-slate-700">
                      <div>IFSC: {b.ifscCode || 'N/A'}</div>
                      <div className="text-[10px] text-slate-500">MICR: {b.micrCode || 'N/A'}</div>
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      <div>{b.city}, {b.state}</div>
                      <div className="text-[10px] text-slate-400">{b.address}</div>
                    </td>

                    <td className="px-4 py-3 text-center font-mono font-bold text-slate-900">
                      {b.activeBusinessDate}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        b.businessDateStatus === 'OPEN'
                          ? 'bg-emerald-100 text-emerald-800'
                          : b.businessDateStatus === 'CUTOFF'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current mr-1"></span>
                        {b.businessDateStatus}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center text-slate-600">
                      <span className="font-semibold text-slate-800">{b.counts.users}</span> Staff •{' '}
                      <span className="font-semibold text-slate-800">{b.counts.counters}</span> Counters
                    </td>

                    <td className="px-4 py-3 text-right">
                      {canControlDate ? (
                        <button
                          onClick={() => {
                            setSelectedBranchForEod(b);
                            setNextDate(b.activeBusinessDate);
                            setStatusVal(b.businessDateStatus);
                          }}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition-colors inline-flex items-center space-x-1"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Control Date</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">View Only</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Business Date Control Modal */}
      {selectedBranchForEod && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2.5">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Business Date Control (EOD)
                </h3>
              </div>
              <button
                onClick={() => setSelectedBranchForEod(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateBusinessDate} className="p-6 space-y-4 text-xs">
              {dateMsg && (
                <div className="p-3 bg-blue-50 border-l-4 border-blue-500 text-blue-800 rounded font-medium">
                  {dateMsg}
                </div>
              )}

              <div>
                <span className="text-slate-500">Selected Branch:</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">
                  {selectedBranchForEod.name} ({selectedBranchForEod.code})
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Target Business Date (YYYY-MM-DD)
                </label>
                <input
                  type="date"
                  required
                  value={nextDate}
                  onChange={(e) => setNextDate(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-mono text-sm"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Advancing to next date will mark prior business date CLOSED and roll balances.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Day State
                </label>
                <select
                  value={statusVal}
                  onChange={(e) => setStatusVal(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="OPEN">OPEN (Normal customer & teller transactions allowed)</option>
                  <option value="CUTOFF">CUTOFF (Teller transactions halted; batch reconciliation only)</option>
                  <option value="CLOSED">CLOSED (EOD finalised; no further transactions allowed)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedBranchForEod(null)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingDate}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                  {isUpdatingDate ? 'Saving...' : 'Apply Date Rollover'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Branch Modal */}
      {isNewBranchModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-brand-600" />
                <h3 className="text-base font-bold text-slate-900">Create New Branch</h3>
              </div>
              <button
                onClick={() => setIsNewBranchModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBranch} className="p-6 space-y-3 text-xs">
              {branchError && (
                <div className="p-2.5 bg-rose-50 text-rose-700 rounded border border-rose-200">
                  {branchError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Branch Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BR004"
                    value={newBranch.code}
                    onChange={(e) => setNewBranch({ ...newBranch, code: e.target.value.toUpperCase() })}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Branch Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kothrud Branch"
                    value={newBranch.name}
                    onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={newBranch.ifscCode}
                    onChange={(e) => setNewBranch({ ...newBranch, ifscCode: e.target.value.toUpperCase() })}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">MICR Code</label>
                  <input
                    type="text"
                    value={newBranch.micrCode}
                    onChange={(e) => setNewBranch({ ...newBranch, micrCode: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Address *</label>
                <input
                  type="text"
                  required
                  placeholder="Street / Premises"
                  value={newBranch.address}
                  onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={newBranch.city}
                    onChange={(e) => setNewBranch({ ...newBranch, city: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={newBranch.state}
                    onChange={(e) => setNewBranch({ ...newBranch, state: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Pincode *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={newBranch.pincode}
                    onChange={(e) => setNewBranch({ ...newBranch, pincode: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewBranchModal(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingBranch}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                  {isCreatingBranch ? 'Creating...' : 'Save Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
