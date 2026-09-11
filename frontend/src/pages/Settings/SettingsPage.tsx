import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { Settings, Shield, Sliders, CheckCircle2, Save, Info } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [msg, setMsg] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const [settRes, rolesRes] = await Promise.all([
        api.get('/settings'),
        api.get('/auth/roles')
      ]);
      setSettings(settRes.data.settings || []);
      setRoles(rolesRes.data.roles || []);
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSetting = async (key: string) => {
    try {
      const res = await api.put(`/settings/${key}`, { value: editValue });
      if (res.data.success) {
        setMsg(`Setting ${key} saved successfully.`);
        setEditingKey(null);
        fetchSettings();
        setTimeout(() => setMsg(''), 3000);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update setting');
    }
  };

  const canEdit = ['SUPER_ADMIN', 'HO_ADMIN'].includes(user?.role || '');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
          <Settings className="w-5 h-5 text-slate-700" />
          <span>System Settings & Institutional Policies</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Global parameters, maker-checker toggles, and Role-Based Access Control matrix
        </p>
      </div>

      {msg && (
        <div className="p-3 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 text-xs rounded font-medium flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}

      {/* System Settings Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-bold text-slate-800">Operational Policy Parameters</h3>
          </div>
          {!canEdit && (
            <span className="text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-medium">
              Read-Only for current role
            </span>
          )}
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {settings.map((s) => (
            <div key={s.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50">
              <div className="max-w-lg">
                <div className="font-mono font-bold text-slate-900">{s.key}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{s.description}</div>
                <span className="inline-block mt-1 text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                  Category: {s.category}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                {editingKey === s.key ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="p-1.5 border border-brand-500 rounded text-xs font-mono w-48"
                    />
                    <button
                      onClick={() => handleSaveSetting(s.key)}
                      className="p-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded text-xs font-bold"
                    >
                      <Save className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingKey(null)}
                      className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-md border border-brand-200">
                      {s.value}
                    </span>
                    {canEdit && (
                      <button
                        onClick={() => {
                          setEditingKey(s.key);
                          setEditValue(s.value);
                        }}
                        className="text-xs text-brand-600 hover:text-brand-800 font-semibold"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RBAC Roles Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center space-x-2">
          <Shield className="w-4 h-4 text-brand-600" />
          <h3 className="text-sm font-bold text-slate-800">Role-Based Access Control (RBAC) System Roles</h3>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="min-w-full divide-y divide-slate-200 text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold text-[10px] uppercase">
              <tr>
                <th className="px-4 py-3">Role Code</th>
                <th className="px-4 py-3">Display Name</th>
                <th className="px-4 py-3">Primary Responsibility (Doc Section 16)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {roles.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-2.5 font-mono font-bold text-slate-900">{r.code}</td>
                  <td className="px-4 py-2.5 font-semibold text-slate-800">{r.name}</td>
                  <td className="px-4 py-2.5 text-slate-600">{r.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
