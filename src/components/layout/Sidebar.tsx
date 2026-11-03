import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  Kanban,
  Calendar,
  Settings,
  MapPin,
  BarChart3,
  CheckSquare,
  ShieldAlert,
  MoreHorizontal,
  X,
  Download,
  Smartphone,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export type NavItem =
  | 'dashboard'
  | 'candidates'
  | 'clients'
  | 'jobs'
  | 'pipeline'
  | 'interviews'
  | 'tasks'
  | 'reports'
  | 'settings';

interface SidebarProps {
  currentTab: NavItem;
  onSelectTab: (tab: NavItem) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onCloseMobile,
}) => {
  const {
    visibleCandidates,
    visibleClients,
    visibleJobs,
    visibleInterviews,
    visibleReminders,
    companySettings,
    currentUser,
  } = useCRM();

  const { isInstallable, promptInstall } = usePWAInstall();
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);
  const [iosInstallNotice, setIosInstallNotice] = useState(false);

  const openJobsCount = visibleJobs.filter((j) => j.status === 'Open').length;
  const scheduledInterviewsCount = visibleInterviews.filter(
    (i) => i.status === 'Scheduled'
  ).length;
  const pendingTasksCount = visibleReminders.filter((r) => r.status === 'Pending').length;

  const navItems: {
    id: NavItem;
    label: string;
    shortLabel: string;
    icon: React.FC<{ className?: string }>;
    badge?: number;
    badgeHighlight?: boolean;
    restricted?: boolean;
  }[] = [
    { id: 'dashboard', label: 'Dashboard', shortLabel: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'candidates',
      label: 'Candidates',
      shortLabel: 'Candidates',
      icon: Users,
      badge: visibleCandidates.length,
    },
    {
      id: 'clients',
      label: 'Client Companies',
      shortLabel: 'Clients',
      icon: Building2,
      badge: visibleClients.length,
    },
    {
      id: 'jobs',
      label: 'Job Openings',
      shortLabel: 'Jobs',
      icon: Briefcase,
      badge: openJobsCount,
    },
    { id: 'pipeline', label: 'Hiring Pipeline', shortLabel: 'Pipeline', icon: Kanban },
    {
      id: 'interviews',
      label: 'Interviews',
      shortLabel: 'Interviews',
      icon: Calendar,
      badge: scheduledInterviewsCount,
    },
    {
      id: 'tasks',
      label: 'Tasks & Reminders',
      shortLabel: 'Tasks',
      icon: CheckSquare,
      badge: pendingTasksCount,
      badgeHighlight: pendingTasksCount > 0,
    },
    {
      id: 'reports',
      label: 'Daily/Weekly Report',
      shortLabel: 'Reports',
      icon: BarChart3,
    },
    ...(currentUser.role === 'admin'
      ? [
          {
            id: 'settings' as NavItem,
            label: 'Settings',
            shortLabel: 'Settings',
            icon: Settings,
          },
        ]
      : []),
  ];

  // Primary 4 items for the phone bottom bar + "More"
  const primaryBottomIds: NavItem[] = ['dashboard', 'candidates', 'clients', 'tasks'];
  const moreBottomItems = navItems.filter((item) => !primaryBottomIds.includes(item.id));
  const isMoreActive = moreBottomItems.some((item) => item.id === currentTab);

  const handleInstallClick = async () => {
    const res = await promptInstall();
    if (res === 'ios') {
      setIosInstallNotice(true);
    } else if (res === 'accepted') {
      setIsMoreSheetOpen(false);
    }
  };

  return (
    <>
      {/* Dimmed Overlay for Slide-in Drawer (< 1024px) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar / Slide-in Drawer (< 1024px drawer, >= 1024px fixed sidebar) */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 lg:w-68 bg-[#0B1F4B] text-white flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-2xl pt-safe pb-safe ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/assets/aistudio/BJ-Bright-logo-circle_cb142036.png"
              alt="BJ Bright Logo"
              className="w-11 h-11 rounded-full object-contain bg-[#0B1F4B] ring-2 ring-[#F5A623]/40 shadow-md shrink-0"
            />
            <div className="min-w-0">
              <h1 className="font-bold text-sm tracking-tight text-white leading-tight truncate">
                {companySettings?.companyName || 'BJ Bright Enterprises'}
              </h1>
              <div className="flex items-center gap-1 text-[11px] text-amber-300/90 font-medium mt-0.5 truncate">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{companySettings?.city || 'Noida, UP'}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            className="lg:hidden min-w-[44px] min-h-[44px] p-2 rounded-xl text-slate-200 hover:text-white hover:bg-white/10 flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-300">
            Core Recruitment CRM
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[#F5A623] text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                    : 'text-slate-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-slate-950' : 'text-slate-300'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
                      isActive
                        ? 'bg-slate-950/20 text-slate-950'
                        : item.badgeHighlight
                        ? 'bg-rose-500 text-white'
                        : 'bg-white/15 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {isInstallable && (
            <button
              type="button"
              onClick={handleInstallClick}
              className="w-full min-h-[44px] mt-2 flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-[#F5A623] border border-[#F5A623]/30 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>Install CRM App</span>
            </button>
          )}
        </nav>

        {/* Active Role Footer Card */}
        <div className="p-4 m-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-300 font-medium">Access Level</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold text-[10px] uppercase">
              {(currentUser?.role || 'recruiter').replace('_', ' ')}
            </span>
          </div>
          <div className="text-[11px] text-slate-200 leading-relaxed">
            {currentUser?.role === 'admin'
              ? 'Full Administrative & User Control'
              : currentUser?.role === 'manager'
              ? 'Team View & Analytics Access'
              : 'Assigned Records & Sourcing View'}
          </div>
          <div className="pt-1 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-300">
            <span>GST: {(companySettings?.gstin || '09AAFCB4821M1Z5').slice(0, 9)}...</span>
            <span className="text-amber-400 font-semibold">v2.5 Pro</span>
          </div>
        </div>
      </aside>

      {/* Fixed Bottom Navigation Bar on Phones (< 768px) with 5 items: Dashboard, Candidates, Clients, Tasks, More */}
      <nav
        aria-label="Mobile bottom navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-[0_-4px_12px_rgba(15,23,42,0.06)] pb-safe"
      >
        <div className="grid grid-cols-5 items-stretch">
          {primaryBottomIds.map((id) => {
            const item = navItems.find((n) => n.id === id)!;
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setIsMoreSheetOpen(false);
                  onSelectTab(item.id);
                }}
                className={`min-h-[56px] py-1.5 px-1 flex flex-col items-center justify-center gap-0.5 relative transition-colors cursor-pointer ${
                  isActive
                    ? 'text-[#0B1F4B] font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 font-semibold'
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 left-3 right-3 h-0.5 rounded-b-full bg-[#F5A623]" />
                )}
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 ${
                      isActive ? 'text-[#0B1F4B]' : 'text-slate-500'
                    }`}
                  />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-extrabold flex items-center justify-center ${
                        item.badgeHighlight
                          ? 'bg-rose-600 text-white'
                          : isActive
                          ? 'bg-[#F5A623] text-slate-950'
                          : 'bg-slate-200 text-slate-800'
                      }`}
                    >
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] leading-tight truncate max-w-full">
                  {item.shortLabel}
                </span>
              </button>
            );
          })}

          {/* 5th Item: More */}
          <button
            type="button"
            onClick={() => setIsMoreSheetOpen((prev) => !prev)}
            className={`min-h-[56px] py-1.5 px-1 flex flex-col items-center justify-center gap-0.5 relative transition-colors cursor-pointer ${
              isMoreActive || isMoreSheetOpen
                ? 'text-[#0B1F4B] font-extrabold'
                : 'text-slate-600 hover:text-slate-900 font-semibold'
            }`}
          >
            {(isMoreActive || isMoreSheetOpen) && (
              <span className="absolute top-0 left-3 right-3 h-0.5 rounded-b-full bg-[#F5A623]" />
            )}
            <MoreHorizontal
              className={`w-5 h-5 ${
                isMoreActive || isMoreSheetOpen ? 'text-[#0B1F4B]' : 'text-slate-500'
              }`}
            />
            <span className="text-[10px] leading-tight">More</span>
          </button>
        </div>
      </nav>

      {/* "More" Bottom Sheet on Phones */}
      {isMoreSheetOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setIsMoreSheetOpen(false)}
          />
          <div className="relative z-10 bg-white text-slate-900 rounded-t-2xl border-t border-slate-200 shadow-2xl p-4 pb-safe space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-sm font-extrabold text-[#0B1F4B]">More CRM Sections</span>
              <button
                type="button"
                onClick={() => setIsMoreSheetOpen(false)}
                className="min-w-[44px] min-h-[44px] p-2 rounded-xl text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {moreBottomItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectTab(item.id);
                      setIsMoreSheetOpen(false);
                    }}
                    className={`min-h-[48px] p-3 rounded-xl border text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#0B1F4B] text-white border-[#0B1F4B] font-bold'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-900 border-slate-200 font-semibold'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-[#F5A623]' : 'text-[#0B1F4B]'
                        }`}
                      />
                      <span className="text-xs truncate">{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          isActive
                            ? 'bg-[#F5A623] text-slate-950'
                            : 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}

              {isInstallable && (
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="col-span-2 min-h-[48px] p-3 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Smartphone className="w-4 h-4 text-[#0B1F4B]" />
                  <span>Install BJ Bright CRM App to Home Screen</span>
                </button>
              )}
            </div>

            {iosInstallNotice && (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-slate-800 flex items-start justify-between gap-2">
                <span>
                  On iPhone/iPad: tap the <strong>Share</strong> button in Safari and select{' '}
                  <strong>"Add to Home Screen"</strong>.
                </span>
                <button
                  type="button"
                  onClick={() => setIosInstallNotice(false)}
                  className="text-slate-600 font-bold px-2"
                >
                  OK
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
