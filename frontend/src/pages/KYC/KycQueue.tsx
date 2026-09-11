import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import {
  CheckSquare,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  AlertTriangle,
  UserCheck,
  FileCheck2,
  Eye,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { MakerCheckerBadge } from '../../components/MakerCheckerBadge';

export const KycQueue: React.FC = () => {
  const { user } = useAuth();
  const [queueItems, setQueueItems] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [loading, setLoading] = useState(true);

  // Selected item for review modal
  const [activeItem, setActiveItem] = useState<any>(null);
  const [remarks, setRemarks] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/kyc/queue?status=${statusFilter}`);
      setQueueItems(res.data.items || []);
    } catch (err) {
      console.error('Failed to load queue items', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [statusFilter, user]);

  const handleAction = async (action: 'APPROVE' | 'REJECT' | 'SEND_BACK') => {
    if (!activeItem) return;
    setActionError('');
    setActionSuccess('');
    setIsProcessing(true);

    try {
      const res = await api.post('/kyc/action', {
        queueId: activeItem.id,
        action,
        remarks: remarks || `Action ${action} executed by ${user?.fullName}`
      });

      if (res.data.success) {
        setActionSuccess(`Request successfully ${action.toLowerCase()}!`);
        setTimeout(() => {
          setActiveItem(null);
          setRemarks('');
          fetchQueue();
        }, 1000);
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || `Failed to execute ${action}.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const isCheckerOrAdmin = ['CHECKER', 'BRANCH_MANAGER', 'HO_ADMIN', 'SUPER_ADMIN'].includes(user?.role || '');

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <CheckSquare className="w-5 h-5 text-indigo-600" />
            <span>Maker-Checker Verification Queue</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict dual-control authorization for KYC, member onboarding, and master data changes
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {!isCheckerOrAdmin && (
            <div className="text-xs bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-lg flex items-center space-x-1.5 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Current Role ({user?.role}): View Only. Switch to <strong>Checker</strong> to approve.</span>
            </div>
          )}

          <button
            onClick={fetchQueue}
            className="p-2 border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 text-xs font-semibold">
        {[
          { key: 'PENDING', label: 'Pending Authorizations', icon: Clock },
          { key: 'APPROVED', label: 'Approved Records', icon: CheckCircle },
          { key: 'SENT_BACK', label: 'Sent Back to Maker', icon: RotateCcw },
          { key: 'REJECTED', label: 'Rejected Records', icon: XCircle }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`pb-3 px-3 flex items-center space-x-2 border-b-2 transition-all ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Queue ID & Module</th>
                <th className="px-4 py-3">Target Entity</th>
                <th className="px-4 py-3">Maker Details</th>
                <th className="px-4 py-3">Submission Remarks</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Loading queue items...
                  </td>
                </tr>
              ) : queueItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    No items found in {statusFilter.toLowerCase()} queue.
                  </td>
                </tr>
              ) : (
                queueItems.map((item) => {
                  let payload: any = {};
                  try {
                    payload = JSON.parse(item.payloadJson);
                  } catch (e) {}

                  const isOwnRequest = item.makerUserId === user?.id && user?.role !== 'SUPER_ADMIN';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-mono text-slate-500 text-[10px]">{item.id.slice(0, 8)}...</div>
                        <span className="font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[10px] uppercase">
                          {item.module} : {item.actionType}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1">{item.branch?.name}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">
                          {payload.customerName || 'Customer Record'}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {payload.customerNumber} {payload.memberNumber && `(${payload.memberNumber})`}
                        </div>
                        {payload.riskCategory && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Risk: <span className="font-semibold text-slate-700">{payload.riskCategory}</span>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">
                          {item.maker?.fullName}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {item.maker?.role?.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                        {item.makerRemarks || 'None'}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <MakerCheckerBadge status={item.status} />
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            setActiveItem(item);
                            setRemarks('');
                            setActionError('');
                            setActionSuccess('');
                          }}
                          className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors inline-flex items-center space-x-1.5 ${
                            item.status === 'PENDING' && isCheckerOrAdmin && !isOwnRequest
                              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{item.status === 'PENDING' && isCheckerOrAdmin ? 'Review & Authorize' : 'Inspect'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {activeItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Checker Verification & Authorization
                  </h3>
                  <p className="text-xs text-slate-500">
                    Dual Control Maker-Checker Workflow (Section 23)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              {actionError && (
                <div className="p-3 bg-rose-50 border-l-4 border-rose-500 text-rose-700 rounded font-medium">
                  {actionError}
                </div>
              )}
              {actionSuccess && (
                <div className="p-3 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 rounded font-medium">
                  {actionSuccess}
                </div>
              )}

              {/* Request Details Grid */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500">Request Module:</span>{' '}
                  <span className="font-bold text-slate-900">{activeItem.module}</span>
                </div>
                <div>
                  <span className="text-slate-500">Action Type:</span>{' '}
                  <span className="font-bold text-slate-900">{activeItem.actionType}</span>
                </div>
                <div>
                  <span className="text-slate-500">Submitted By (Maker):</span>{' '}
                  <span className="font-semibold text-slate-800">{activeItem.maker?.fullName}</span>
                </div>
                <div>
                  <span className="text-slate-500">Branch:</span>{' '}
                  <span className="font-semibold text-slate-800">{activeItem.branch?.name}</span>
                </div>
              </div>

              {/* Payload Data Inspection */}
              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Payload & Entity Details
                </h4>
                <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto max-h-48">
                  {JSON.stringify(JSON.parse(activeItem.payloadJson || '{}'), null, 2)}
                </pre>
              </div>

              {/* Maker Remarks */}
              <div>
                <span className="font-semibold text-slate-700">Maker Remarks:</span>
                <p className="p-2.5 bg-slate-100 rounded-lg text-slate-800 mt-1">
                  {activeItem.makerRemarks || 'No remarks provided'}
                </p>
              </div>

              {/* Checker Remarks Input */}
              {activeItem.status === 'PENDING' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Checker Authorization Remarks *
                  </label>
                  <textarea
                    rows={2}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter approval or rejection remarks (will be stored in immutable audit trail)..."
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {/* Checker Self-Approval Warning */}
              {activeItem.makerUserId === user?.id && user?.role !== 'SUPER_ADMIN' && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center space-x-2 font-medium">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Dual Control Violation: You created this request as Maker. You cannot approve your own submission. Please switch to Checker account.</span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveItem(null)}
                className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold text-xs"
              >
                Close
              </button>

              {activeItem.status === 'PENDING' && isCheckerOrAdmin && activeItem.makerUserId !== user?.id && (
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleAction('SEND_BACK')}
                    className="px-3.5 py-2 bg-orange-100 hover:bg-orange-200 text-orange-900 font-bold text-xs rounded-lg transition-colors"
                  >
                    Send Back
                  </button>

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleAction('REJECT')}
                    className="px-3.5 py-2 bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold text-xs rounded-lg transition-colors"
                  >
                    Reject
                  </button>

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleAction('APPROVE')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors flex items-center space-x-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Authorize & Activate</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
