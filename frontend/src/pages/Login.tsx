import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Building2, ShieldCheck, KeyRound, ArrowRight, UserCheck, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('maker_pune');
  const [password, setPassword] = useState('Maker@123');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const setDemoCredentials = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center text-white shadow-xl shadow-sky-900/30">
          <Building2 className="w-8 h-8" />
        </div>
        <h2 className="mt-4 text-2xl font-extrabold text-white tracking-tight">
          Samruddhi Co-operative Bank
        </h2>
        <p className="mt-1 text-xs text-slate-400 font-medium">
          Pat Sanstha & Co-op Core Banking System • Phase 1 Foundation
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          {error && (
            <div className="mb-5 bg-rose-50 border-l-4 border-rose-500 p-3.5 rounded text-xs text-rose-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Username
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                  placeholder="e.g. maker_pune"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors disabled:opacity-50 mt-6"
            >
              {isSubmitting ? 'Authenticating...' : 'Sign in to Core Banking'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </form>

          {/* Quick Select Demo Roles */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center mb-3">
              One-Click Test Roles
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDemoCredentials('maker_pune', 'Maker@123')}
                className="p-2 border border-emerald-200 bg-emerald-50/60 rounded-lg text-left hover:bg-emerald-100/60 transition-colors text-emerald-900"
              >
                <div className="font-semibold text-emerald-800">Maker / Operator</div>
                <div className="text-[10px] text-emerald-600">Enter Customers & Docs</div>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('checker_pune', 'Checker@123')}
                className="p-2 border border-indigo-200 bg-indigo-50/60 rounded-lg text-left hover:bg-indigo-100/60 transition-colors text-indigo-900"
              >
                <div className="font-semibold text-indigo-800">Checker / Authorizer</div>
                <div className="text-[10px] text-indigo-600">Approve KYC & Queues</div>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('bm_pune', 'Manager@123')}
                className="p-2 border border-amber-200 bg-amber-50/60 rounded-lg text-left hover:bg-amber-100/60 transition-colors text-amber-900"
              >
                <div className="font-semibold text-amber-800">Branch Manager</div>
                <div className="text-[10px] text-amber-600">Business Date & Branch</div>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('auditor', 'Auditor@123')}
                className="p-2 border border-purple-200 bg-purple-50/60 rounded-lg text-left hover:bg-purple-100/60 transition-colors text-purple-900"
              >
                <div className="font-semibold text-purple-800">Internal Auditor</div>
                <div className="text-[10px] text-purple-600">Read-Only Audit Logs</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
