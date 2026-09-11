import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Building2,
  FileSpreadsheet,
  Settings,
  CreditCard,
  Banknote,
  ArrowLeftRight,
  Award,
  ShieldAlert,
  BookOpen,
  GitBranch,
  BarChart3,
  Smartphone
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  pendingApprovalsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ pendingApprovalsCount = 0 }) => {
  const { user } = useAuth();

  const phase1Items = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/customers', label: 'Customer & Member', icon: Users },
    { to: '/kyc', label: 'KYC & Approvals', icon: CheckSquare, badge: pendingApprovalsCount },
    { to: '/branches', label: 'Branch & Business Date', icon: Building2 },
    { to: '/audit', label: 'Audit Trail', icon: FileSpreadsheet },
    { to: '/settings', label: 'System Settings', icon: Settings },
  ];

  const phase2Items = [
    { to: '/accounts', label: 'Accounts & Deposits', icon: CreditCard },
    { to: '/teller', label: 'Teller & Cash Counter', icon: Banknote },
    { to: '/transfers', label: 'Fund Transfers', icon: ArrowLeftRight },
  ];

  const phase3Items = [
    { to: '/loans', label: 'Loans & Advances (LOS)', icon: Award },
  ];

  const phase4Items = [
    { to: '/collections', label: 'Collections & NPA Hub', icon: ShieldAlert },
  ];

  const phase5Items = [
    { to: '/gl', label: 'General Ledger & COA', icon: BookOpen },
  ];

  const phase6Items = [
    { to: '/reports', label: 'Reports & Regulatory MIS', icon: BarChart3 },
  ];

  const phase7Items = [
    { to: '/digital', label: 'Digital Channels & Portal', icon: Smartphone },
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
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {/* Phase 1 Group */}
        <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Phase 1 - Foundation
        </div>
        {phase1Items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white font-semibold shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <div className="flex items-center space-x-2.5">
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="bg-amber-500 text-slate-900 font-bold text-[10px] px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}

        {/* Phase 2 Group */}
        <div className="pt-3 px-3 py-1 text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
          Phase 2 - Accounts & CASA
        </div>
        {phase2Items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <div className="flex items-center space-x-2.5">
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </div>
            </NavLink>
          );
        })}

        {/* Phase 3 Group */}
        <div className="pt-3 px-3 py-1 text-[10px] font-semibold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
          <span>Phase 3 - Loans & Advances</span>
        </div>
        {phase3Items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-amber-600 text-white font-semibold shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <div className="flex items-center space-x-2.5">
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </div>
            </NavLink>
          );
        })}

        {/* Phase 4 Group */}
        <div className="pt-3 px-3 py-1 text-[10px] font-semibold text-rose-400 uppercase tracking-wider flex items-center space-x-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
          <span>Phase 4 - Collections & NPA</span>
        </div>
        {phase4Items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-rose-600 text-white font-semibold shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <div className="flex items-center space-x-2.5">
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </div>
            </NavLink>
          );
        })}

        {/* Phase 5 Group */}
        <div className="pt-3 px-3 py-1 text-[10px] font-semibold text-teal-400 uppercase tracking-wider flex items-center space-x-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
          <span>Phase 5 - General Ledger</span>
        </div>
        {phase5Items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-teal-600 text-white font-semibold shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <div className="flex items-center space-x-2.5">
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </div>
            </NavLink>
          );
        })}

        {/* Phase 6 Group */}
        <div className="pt-3 px-3 py-1 text-[10px] font-semibold text-indigo-400 uppercase tracking-wider flex items-center space-x-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
          <span>Phase 6 - Reporting & MIS</span>
        </div>
        {phase6Items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <div className="flex items-center space-x-2.5">
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </div>
            </NavLink>
          );
        })}

        {/* Phase 7 Group */}
        <div className="pt-3 px-3 py-1 text-[10px] font-semibold text-cyan-400 uppercase tracking-wider flex items-center space-x-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
          <span>Phase 7 - Digital Channels</span>
        </div>
        {phase7Items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-600 text-white font-semibold shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <div className="flex items-center space-x-2.5">
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </div>
            </NavLink>
          );
        })}

        {/* Roadmap Preview */}
        <div className="pt-4 px-3 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          Roadmap Modules
        </div>
        <div className="px-3 space-y-1 text-xs text-slate-500">
          <div className="flex items-center space-x-2 py-0.5">
            <span className="w-2 h-2 rounded-full bg-slate-700"></span>
            <span>Phase 8: Hardening & Rollout</span>
          </div>
        </div>
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/50">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center space-x-1.5">
            <GitBranch className="w-3.5 h-3.5 text-brand-400" />
            <span>Phases 1-5 Active</span>
          </div>
          <span className="bg-emerald-950 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded border border-emerald-800 font-mono">
            ACID Safe
          </span>
        </div>
      </div>
    </aside>
  );
};
