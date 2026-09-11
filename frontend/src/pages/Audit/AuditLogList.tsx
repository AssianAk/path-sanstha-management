import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import {
  FileSpreadsheet,
  Search,
  Filter,
  RefreshCw,
  Eye,
  ShieldCheck,
  Calendar,
  User,
  ArrowRight
} from 'lucide-react';

export const AuditLogList: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Selected Log for Diff Inspection
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (actionFilter) params.action = actionFilter;
      if (entityFilter) params.entityName = entityFilter;
      if (userSearch) params.username = userSearch;
      if (dateFilter) params.businessDate = dateFilter;

      const res = await api.get('/audit', { params });
      setLogs(res.data.logs || []);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 250);
    return () => clearTimeout(timer);
  }, [actionFilter, entityFilter, userSearch, dateFilter]);

  const parseJson = (str: string | null) => {
    if (!str) return null;
    try {
      return JSON.parse(str);
    } catch (e) {
      return str;
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-purple-600" />
            <span>Immutable Audit Trail & Governance</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically sealed operational and master audit log with before/after state diffs (Section 24)
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchLogs}
            className="p-2 border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Filter Action
          </label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full text-xs p-2 border border-slate-300 rounded-lg"
          >
            <option value="">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="APPROVE">APPROVE</option>
            <option value="REJECT">REJECT</option>
            <option value="SEND_BACK">SEND_BACK</option>
            <option value="LOGIN">LOGIN</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Entity Type
          </label>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="w-full text-xs p-2 border border-slate-300 rounded-lg"
          >
            <option value="">All Entities</option>
            <option value="CUSTOMER">CUSTOMER</option>
            <option value="KYC_DOCUMENT">KYC_DOCUMENT</option>
            <option value="APPROVAL_QUEUE">APPROVAL_QUEUE</option>
            <option value="BUSINESS_DATE">BUSINESS_DATE</option>
            <option value="BRANCH">BRANCH</option>
            <option value="USER_SESSION">USER_SESSION</option>
            <option value="SYSTEM_SETTING">SYSTEM_SETTING</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Username
          </label>
          <input
            type="text"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            placeholder="e.g. maker_pune"
            className="w-full text-xs p-2 border border-slate-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Business Date
          </label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full text-xs p-2 border border-slate-300 rounded-lg font-mono"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Timestamp & Date</th>
                <th className="px-4 py-3">Actor & Role</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity & ID</th>
                <th className="px-4 py-3">Client Info</th>
                <th className="px-4 py-3 text-right">State Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Loading audit events...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No audit records match the selected criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-mono text-slate-900 font-bold">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Biz Date: {log.businessDate || 'N/A'}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{log.username}</div>
                      <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                        {log.userRole}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.action === 'CREATE' ? 'bg-emerald-100 text-emerald-800' :
                        log.action === 'APPROVE' ? 'bg-indigo-100 text-indigo-800' :
                        log.action === 'UPDATE' ? 'bg-amber-100 text-amber-800' :
                        log.action === 'REJECT' ? 'bg-rose-100 text-rose-800' :
                        log.action === 'LOGIN' ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {log.action}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{log.entityName}</div>
                      {log.entityId && (
                        <div className="font-mono text-[10px] text-slate-400 truncate max-w-[120px]">
                          {log.entityId}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 text-slate-500 font-mono text-[10px]">
                      <div>{log.ipAddress || '127.0.0.1'}</div>
                      <div className="truncate max-w-[150px] text-slate-400">{log.userAgent}</div>
                    </td>

                    <td className="px-4 py-3 text-right">
                      {(log.beforeStateJson || log.afterStateJson) ? (
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-700 rounded-md transition-colors inline-flex items-center space-x-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Diff</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">No payload</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* State Diff Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150 max-h-[85vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center space-x-2.5">
                <FileSpreadsheet className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Audit Snapshot Diff: {selectedLog.action} on {selectedLog.entityName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400">Actor:</span>{' '}
                  <span className="font-bold text-slate-800">{selectedLog.username} ({selectedLog.userRole})</span>
                </div>
                <div>
                  <span className="text-slate-400">Business Date:</span>{' '}
                  <span className="font-mono font-bold text-slate-800">{selectedLog.businessDate}</span>
                </div>
                <div>
                  <span className="text-slate-400">Timestamp:</span>{' '}
                  <span className="font-mono text-slate-800">{new Date(selectedLog.timestamp).toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Before State */}
                <div>
                  <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5 flex items-center justify-between">
                    <span>State Before Mutation</span>
                    <span className="text-slate-400 font-mono">Original</span>
                  </div>
                  <pre className="p-3 bg-slate-900 text-amber-300 rounded-xl font-mono text-[11px] overflow-x-auto max-h-72">
                    {selectedLog.beforeStateJson
                      ? JSON.stringify(parseJson(selectedLog.beforeStateJson), null, 2)
                      : '// No prior state (Entity was Created)'}
                  </pre>
                </div>

                {/* After State */}
                <div>
                  <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5 flex items-center justify-between">
                    <span>State After Mutation</span>
                    <span className="text-emerald-600 font-mono">Committed</span>
                  </div>
                  <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto max-h-72">
                    {selectedLog.afterStateJson
                      ? JSON.stringify(parseJson(selectedLog.afterStateJson), null, 2)
                      : '// Entity was Deleted'}
                  </pre>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg text-xs"
              >
                Close Diff
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
