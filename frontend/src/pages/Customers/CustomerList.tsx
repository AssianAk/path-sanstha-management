import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Eye,
  Award,
  RefreshCw,
  Building2,
  CheckCircle2
} from 'lucide-react';
import { MakerCheckerBadge } from '../../components/MakerCheckerBadge';
import { NewCustomerModal } from './NewCustomerModal';
import { CustomerDetailModal } from './CustomerDetailModal';
import { useAuth } from '../../contexts/AuthContext';

export const CustomerList: React.FC = () => {
  const { user } = useAuth();

  const [customers, setCustomers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [memberFilter, setMemberFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (selectedBranch) params.branchId = selectedBranch;
      if (memberFilter === 'MEMBER') params.isMember = 'true';
      if (memberFilter === 'NON_MEMBER') params.isMember = 'false';
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const res = await api.get('/customers', { params });
      setCustomers(res.data.customers || []);
    } catch (err) {
      console.error('Failed to fetch customers', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await api.get('/org/branches');
      setBranches(res.data.branches || []);
    } catch (err) {}
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, selectedBranch, memberFilter, statusFilter]);

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Users className="w-5 h-5 text-brand-600" />
            <span>Customer & Member Master</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Single source of truth for Co-operative Bank Members & Account Holders
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchCustomers}
            className="p-2 border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1"
            title="Refresh Table"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center space-x-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>New Customer / Member</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Name, Member ID, PAN..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>

        {/* Branch Filter */}
        <div>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="w-full py-1.5 px-3 text-xs border border-slate-300 rounded-lg text-slate-700 focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Operating Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.code} - {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Member Type Filter */}
        <div>
          <select
            value={memberFilter}
            onChange={(e) => setMemberFilter(e.target.value)}
            className="w-full py-1.5 px-3 text-xs border border-slate-300 rounded-lg text-slate-700 focus:ring-2 focus:ring-brand-500"
          >
            <option value="ALL">All Accounts (Members & Non-members)</option>
            <option value="MEMBER">Pat Sanstha Members Only</option>
            <option value="NON_MEMBER">Non-Member Customers Only</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-1.5 px-3 text-xs border border-slate-300 rounded-lg text-slate-700 focus:ring-2 focus:ring-brand-500"
          >
            <option value="ALL">All KYC & Approval Statuses</option>
            <option value="ACTIVE">Verified & Active</option>
            <option value="PENDING_KYC">Pending Checker Review</option>
            <option value="INACTIVE">Inactive / Rejected</option>
          </select>
        </div>
      </div>

      {/* Customer Master Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Member / Customer ID</th>
                <th className="px-4 py-3">Full Name & Contact</th>
                <th className="px-4 py-3">Classification</th>
                <th className="px-4 py-3">Branch</th>
                <th className="px-4 py-3 text-center">Risk Profile</th>
                <th className="px-4 py-3 text-center">KYC Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Loading records...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No customer or member records found matching your filters.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-slate-900">
                      <div>{c.customerNumber}</div>
                      {c.isMember && c.memberNumber && (
                        <div className="inline-flex items-center space-x-1 text-[11px] text-brand-700 font-bold bg-brand-50 px-1.5 py-0.5 rounded mt-0.5">
                          <Award className="w-3 h-3 text-amber-500" />
                          <span>{c.memberNumber}</span>
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">
                        {c.title} {c.firstName} {c.middleName} {c.lastName}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {c.phone} {c.pan && `• PAN: ${c.pan}`}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700 font-medium">
                        {c.customerType}
                      </span>
                      {c.isMember && (
                        <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                          Shareholder ({c.memberStatus || 'Active'})
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {c.branch?.name}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.riskCategory === 'LOW' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        c.riskCategory === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {c.riskCategory}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <MakerCheckerBadge status={c.status} />
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedCustomer(c)}
                        className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 rounded-md transition-colors inline-flex items-center space-x-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>360° Profile</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Customer Modal */}
      <NewCustomerModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onCreated={() => {
          fetchCustomers();
        }}
        branches={branches}
      />

      {/* Customer Detail 360 Modal */}
      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onRefetch={() => {
            fetchCustomers();
          }}
        />
      )}
    </div>
  );
};
