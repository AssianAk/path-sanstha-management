import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Building2,
  FileSpreadsheet,
  Settings,
  ShieldAlert,
  GitBranch
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  pendingApprovalsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ pendingApprovalsCount = 0 }) => {
  const { user } = useAuth();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/customers', label: 'Customer & Member', icon: Users },
    { to: '/kyc', label: 'KYC & Approvals', icon: CheckSquare, badge: pendingApprovalsCount },
    { to: '/branches', label: 'Branch & Business Date', icon: Building2 },
    { to: '/audit', label: 'Audit Trail', icon: FileSpreadsheet },
    { to: '/settings', label: 'System Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0 shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center text-white font-bold shadow-md">
          SCB
        </div>
        <div>
          <h1 className="font-bold text-white text-sm tracking-wide">SAMRUDDHI CBS</h1>
          <p className="text-[11px] text-slate-400 font-medium">Pat Sanstha & Co-op Bank</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          Phase 1 - Foundation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white font-semibold shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <div className="flex items-center space-x-3">
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="bg-amber-500 text-slate-900 font-bold text-[10px] px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}

        {/* Future Phases Preview */}
        <div className="pt-6 px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          Roadmap Modules
        </div>
        <div className="px-3 space-y-2 text-xs text-slate-500">
          <div className="flex items-center space-x-2 py-1">
            <span className="w-2 h-2 rounded-full bg-slate-700"></span>
            <span>Phase 2: CASA & Deposits</span>
          </div>
          <div className="flex items-center space-x-2 py-1">
            <span className="w-2 h-2 rounded-full bg-slate-700"></span>
            <span>Phase 3: Loan Servicing</span>
          </div>
          <div className="flex items-center space-x-2 py-1">
            <span className="w-2 h-2 rounded-full bg-slate-700"></span>
            <span>Phase 4: Collections & NPA</span>
          </div>
          <div className="flex items-center space-x-2 py-1">
            <span className="w-2 h-2 rounded-full bg-slate-700"></span>
            <span>Phase 5: General Ledger</span>
          </div>
        </div>
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center space-x-1.5">
            <GitBranch className="w-3.5 h-3.5 text-brand-400" />
            <span>v1.0.0 (Git Ready)</span>
          </div>
          <span className="bg-emerald-950 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded border border-emerald-800 font-mono">
            ACID Safe
          </span>
        </div>
      </div>
    </aside>
  );
};
