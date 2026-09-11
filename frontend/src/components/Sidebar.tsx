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
  Smartphone,
  ShieldCheck,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface SidebarProps {
  pendingApprovalsCount?: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  pendingApprovalsCount = 0,
  isOpenMobile = false,
  onCloseMobile
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const phase1Items = [
    { to: '/', label: t('nav.dashboard'), icon: LayoutDashboard },
    { to: '/customers', label: t('nav.customers'), icon: Users },
    { to: '/kyc', label: t('nav.kyc'), icon: CheckSquare, badge: pendingApprovalsCount },
    { to: '/branches', label: t('nav.branches'), icon: Building2 },
    { to: '/audit', label: t('nav.audit'), icon: FileSpreadsheet },
    { to: '/settings', label: t('nav.settings'), icon: Settings },
  ];

  const phase2Items = [
    { to: '/accounts', label: t('nav.accounts'), icon: CreditCard },
    { to: '/teller', label: t('nav.teller'), icon: Banknote },
    { to: '/transfers', label: t('nav.transfers'), icon: ArrowLeftRight },
  ];

  const phase3Items = [
    { to: '/loans', label: t('nav.loans'), icon: Award },
  ];

  const phase4Items = [
    { to: '/collections', label: t('nav.collections'), icon: ShieldAlert },
  ];

  const phase5Items = [
    { to: '/gl', label: t('nav.gl'), icon: BookOpen },
  ];

  const phase6Items = [
    { to: '/reports', label: t('nav.reports'), icon: BarChart3 },
  ];

  const phase7Items = [
    { to: '/digital', label: t('nav.digital'), icon: Smartphone },
  ];

  const handleLinkClick = () => {
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const navContent = (
    <>
      {/* Brand Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center text-white font-bold shadow-md shrink-0">
            SCB
          </div>
          <div>
            <h1 className="font-bold text-white text-sm tracking-wide">{t('brand.name')}</h1>
            <p className="text-[11px] text-slate-400 font-medium">{t('brand.tagline')}</p>
          </div>
        </div>
        {/* Mobile Close Button */}
        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg md:hidden transition-colors"
            title="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
        {/* Phase 1 Group */}
        <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          {t('nav.group.phase1')}
        </div>
        {phase1Items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white font-semibold shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <div className="flex items-center space-x-2.5 truncate">
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="bg-amber-500 text-slate-900 font-bold text-[10px] px-1.5 py-0.5 rounded-full ml-1 shrink-0">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}

        {/* Phase 2 Group */}
        <div className="pt-3 px-3 py-1 text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
          {t('nav.group.phase2')}
        </div>
        {phase2Items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <div className="flex items-center space-x-2.5 truncate">
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </div>
            </NavLink>
          );
        })}

        {/* Phase 3 Group */}
        <div className="pt-3 px-3 py-1 text-[10px] font-semibold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
          <span>{t('nav.group.phase3')}</span>
        </div>
        {phase3Items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-amber-600 text-white font-semibold shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <div className="flex items-center space-x-2.5 truncate">
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </div>
            </NavLink>
          );
        })}

        {/* Phase 4 Group */}
        <div className="pt-3 px-3 py-1 text-[10px] font-semibold text-rose-400 uppercase tracking-wider flex items-center space-x-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
          <span>{t('nav.group.phase4')}</span>
        </div>
        {phase4Items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-rose-600 text-white font-semibold shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <div className="flex items-center space-x-2.5 truncate">
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </div>
            </NavLink>
          );
        })}

        {/* Phase 5 Group */}
        <div className="pt-3 px-3 py-1 text-[10px] font-semibold text-teal-400 uppercase tracking-wider flex items-center space-x-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
          <span>{t('nav.group.phase5')}</span>
        </div>
        {phase5Items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-teal-600 text-white font-semibold shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <div className="flex items-center space-x-2.5 truncate">
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </div>
            </NavLink>
          );
        })}

        {/* Phase 6 Group */}
        <div className="pt-3 px-3 py-1 text-[10px] font-semibold text-indigo-400 uppercase tracking-wider flex items-center space-x-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
          <span>{t('nav.group.phase6')}</span>
        </div>
        {phase6Items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <div className="flex items-center space-x-2.5 truncate">
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </div>
            </NavLink>
          );
        })}

        {/* Phase 7 Group */}
        <div className="pt-3 px-3 py-1 text-[10px] font-semibold text-cyan-400 uppercase tracking-wider flex items-center space-x-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
          <span>{t('nav.group.phase7')}</span>
        </div>
        {phase7Items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-600 text-white font-semibold shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <div className="flex items-center space-x-2.5 truncate">
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </div>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/50">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
            <span>Phases 1-8 Active</span>
          </div>
          <span className="bg-emerald-950 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded border border-emerald-800 font-mono font-semibold">
            v1.8.0 ACID
          </span>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Stationary Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 hidden md:flex flex-col h-screen sticky top-0 shrink-0 select-none border-r border-slate-800 z-20">
        {navContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer Off-Canvas */}
      <div
        className={`fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-slate-900 text-slate-300 z-50 flex flex-col h-full shadow-2xl md:hidden transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {navContent}
      </div>
    </>
  );
};
