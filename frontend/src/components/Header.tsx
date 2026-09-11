import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Building2, Calendar, ShieldCheck, LogOut, UserCheck } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, businessDate, logout, quickSwitch } = useAuth();

  const demoAccounts = [
    { label: 'Maker', username: 'maker_pune', role: 'MAKER', color: 'bg-emerald-100 text-emerald-800' },
    { label: 'Checker', username: 'checker_pune', role: 'CHECKER', color: 'bg-indigo-100 text-indigo-800' },
    { label: 'Manager', username: 'bm_pune', role: 'BRANCH_MANAGER', color: 'bg-amber-100 text-amber-800' },
    { label: 'Auditor', username: 'auditor', role: 'AUDITOR', color: 'bg-purple-100 text-purple-800' },
    { label: 'Admin', username: 'superadmin', role: 'SUPER_ADMIN', color: 'bg-rose-100 text-rose-800' }
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-3 shadow-xs">
      <div className="flex items-center justify-between">
        {/* Left: Organization & Branch Info */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-slate-800 font-semibold text-lg tracking-tight">
            <Building2 className="w-5 h-5 text-brand-600" />
            <span>Samruddhi Co-op Bank</span>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
              {user?.branchCode || 'BR001'} - {user?.branchName || 'Head Office'}
            </span>
          </div>

          {/* Controlled Business Date */}
          <div className="hidden md:flex items-center space-x-1.5 bg-blue-50 border border-blue-200 text-blue-800 text-xs px-2.5 py-1 rounded-full font-medium">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>Business Date:</span>
            <span className="font-mono font-semibold">{businessDate}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] uppercase font-bold text-emerald-700">OPEN</span>
          </div>
        </div>

        {/* Right: Quick Switcher & User Profile */}
        <div className="flex items-center space-x-4">
          {/* Quick Demo Role Switcher */}
          <div className="hidden lg:flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs">
            <span className="text-slate-500 text-[11px] px-1 font-medium">Test As:</span>
            {demoAccounts.map((acc) => {
              const isCurrent = user?.role === acc.role;
              return (
                <button
                  key={acc.username}
                  onClick={() => quickSwitch(acc.username, acc.username === 'superadmin' ? 'Admin@123' : acc.username.includes('bm') ? 'Manager@123' : acc.username.includes('maker') ? 'Maker@123' : acc.username.includes('checker') ? 'Checker@123' : 'Auditor@123')}
                  className={`px-2 py-0.5 rounded font-medium transition-all ${
                    isCurrent
                      ? `${acc.color} shadow-xs font-semibold ring-1 ring-slate-300`
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                  title={`Switch to ${acc.label}`}
                >
                  {acc.label}
                </button>
              );
            })}
          </div>

          {/* User Badge */}
          <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-slate-800 flex items-center space-x-1">
                <span>{user?.fullName}</span>
              </div>
              <div className="text-[10px] text-slate-500 flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3 text-brand-600" />
                <span className="font-medium text-brand-700">{user?.roleName || user?.role}</span>
              </div>
            </div>

            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-2"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
