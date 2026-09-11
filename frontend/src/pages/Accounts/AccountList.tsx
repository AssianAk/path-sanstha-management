import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import {
  CreditCard,
  Search,
  Plus,
  RefreshCw,
  Eye,
  Filter,
  PiggyBank,
  Briefcase,
  Award,
  Layers
} from 'lucide-react';
import { MakerCheckerBadge } from '../../components/MakerCheckerBadge';
import { NewAccountModal } from './NewAccountModal';
import { AccountDetailModal } from './AccountDetailModal';
import { useAuth } from '../../contexts/AuthContext';

export const AccountList: React.FC = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/accounts', { params });
      setAccounts(res.data.accounts || []);
    } catch (err) {
      console.error('Failed to load accounts', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [custRes, prodRes] = await Promise.all([
        api.get('/customers?status=ACTIVE'),
        api.get('/products')
      ]);
      setCustomers(custRes.data.customers || []);
      setProducts(prodRes.data.products || []);
    } catch (err) {}
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAccounts();
    }, 200);
    return () => clearTimeout(timer);
  }, [search, categoryFilter, statusFilter]);

  // Aggregate stats
  const totalBalance = accounts.reduce((acc, a) => acc + (a.ledgerBalance || 0), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-brand-600" />
            <span>Accounts & Deposits (CASA & Term Deposits)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Savings, Current Accounts, Fixed Deposits, and Recurring Deposits with double-entry ledger integration
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchAccounts}
            className="p-2 border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Open Account / FD / RD</span>
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 text-xs font-semibold">
        {[
          { key: '', label: 'All Accounts & Deposits', icon: Layers },
          { key: 'SAVINGS', label: 'Savings Accounts (SB)', icon: PiggyBank },
          { key: 'CURRENT', label: 'Current Accounts (CA)', icon: Briefcase },
          { key: 'FIXED_DEPOSIT', label: 'Fixed Deposits (FD)', icon: Award },
          { key: 'RECURRING_DEPOSIT', label: 'Recurring Deposits (RD)', icon: CreditCard }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = categoryFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setCategoryFilter(tab.key)}
              className={`pb-3 px-3 flex items-center space-x-2 border-b-2 transition-all ${
                isActive
                  ? 'border-brand-600 text-brand-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Account Number (SB-...), Customer Name, or Member ID..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-1.5 px-3 text-xs border border-slate-300 rounded-lg text-slate-700 focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Account Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="DORMANT">DORMANT</option>
            <option value="FROZEN">FROZEN</option>
            <option value="CLOSED">CLOSED</option>
          </select>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Account Number & Product</th>
                <th className="px-4 py-3">Customer / Member</th>
                <th className="px-4 py-3">Branch</th>
                <th className="px-4 py-3 text-right">Ledger Balance</th>
                <th className="px-4 py-3 text-right">Available Funds</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Loading accounts...
                  </td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No deposit accounts found matching criteria.
                  </td>
                </tr>
              ) : (
                accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono">
                      <div className="font-bold text-slate-900">{acc.accountNumber}</div>
                      <div className="text-[11px] text-brand-700 font-sans font-medium mt-0.5">
                        {acc.product?.name}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">
                        {acc.customer?.title} {acc.customer?.firstName} {acc.customer?.lastName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {acc.customer?.customerNumber} {acc.customer?.memberNumber && `(${acc.customer?.memberNumber})`}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {acc.branch?.name}
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      ₹{acc.ledgerBalance.toLocaleString()}
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">
                      ₹{acc.availableBalance.toLocaleString()}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <MakerCheckerBadge status={acc.status} />
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedAccount(acc)}
                        className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 rounded-md transition-colors inline-flex items-center space-x-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>360° View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Account Modal */}
      <NewAccountModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onCreated={() => {
          fetchAccounts();
        }}
        customers={customers}
        products={products}
      />

      {/* Detail Modal */}
      {selectedAccount && (
        <AccountDetailModal
          account={selectedAccount}
          onClose={() => setSelectedAccount(null)}
        />
      )}
    </div>
  );
};
