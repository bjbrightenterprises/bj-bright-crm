import React from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  Kanban,
  CalendarDays,
  Settings,
  BarChart3,
  ShieldCheck,
  UserCheck,
  CheckSquare,
  ChevronRight,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';

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
    visibleJobs,
    visibleInterviews,
    visibleReminders,
    currentUser,
    companySettings,
  } = useCRM();

  const scheduledInterviewsCount = visibleInterviews.filter(
    (i) => i.status === 'Scheduled'
  ).length;

  const todayStr = new Date().toISOString().split('T')[0];
  const pendingTasksCount = visibleReminders.filter((r) => r.status === 'Pending').length;
  const overdueTasksCount = visibleReminders.filter(
    (r) => r.status === 'Pending' && r.dueDate < todayStr
  ).length;

  const navItems = [
    {
      id: 'dashboard' as NavItem,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'candidates' as NavItem,
      label: 'Candidates',
      icon: Users,
      badge: visibleCandidates.length,
    },
    {
      id: 'clients' as NavItem,
      label: 'Clients',
      icon: Building2,
    },
    {
      id: 'jobs' as NavItem,
      label: 'Job Openings',
      icon: Briefcase,
      badge: visibleJobs.filter((j) => j.status === 'Open').length,
    },
    {
      id: 'pipeline' as NavItem,
      label: 'Hiring Pipeline',
      icon: Kanban,
    },
    {
      id: 'interviews' as NavItem,
      label: 'Interviews',
      icon: CalendarDays,
      badge: scheduledInterviewsCount > 0 ? scheduledInterviewsCount : undefined,
      badgeColor: 'bg-purple-500 text-white',
    },
    {
      id: 'tasks' as NavItem,
      label: 'My Tasks & Reminders',
      icon: CheckSquare,
      badge: pendingTasksCount > 0 ? pendingTasksCount : undefined,
      badgeColor: overdueTasksCount > 0 ? 'bg-rose-500 text-white' : 'bg-[#F5A623] text-slate-950',
    },
    {
      id: 'reports' as NavItem,
      label: 'Daily / Weekly Report',
      icon: BarChart3,
    },
    ...(currentUser.role === 'admin'
      ? [
          {
            id: 'settings' as NavItem,
            label: 'Settings',
            icon: Settings,
          },
        ]
      : []),
  ];

  const handleNavClick = (tab: NavItem) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-68 bg-[#0B1F4B] text-slate-200 flex flex-col border-r border-[#163270]/50 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-18 px-5 flex items-center gap-3 border-b border-[#163270]/60 bg-[#071533]">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#F5A623] to-amber-600 flex items-center justify-center font-extrabold text-white shadow-md shadow-amber-500/20">
            <span className="text-xl tracking-tight">BJ</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-white tracking-wide truncate">
              {companySettings.companyName}
            </h1>
            <p className="text-[11px] text-amber-300/90 font-medium truncate flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Noida Sector 62 • HR CRM
            </p>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          <div>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Core CRM Modules
            </p>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#F5A623] text-slate-950 font-bold shadow-md shadow-amber-500/20'
                        : 'text-slate-300 hover:bg-[#163270]/60 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                    <span className="flex-1 text-left truncate">{item.label}</span>
                    {item.badge !== undefined && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isActive
                            ? 'bg-slate-950 text-white'
                            : item.badgeColor || 'bg-[#163270] text-slate-200'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Current User Card at Bottom */}
        <div className="p-3 bg-[#071533] border-t border-[#163270]/60">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-[#0B1F4B]/80 border border-[#163270]/50">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-9 h-9 rounded-full object-cover border-2 border-[#F5A623]"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                {currentUser.role === 'admin' ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-[#F5A623] shrink-0" />
                ) : (
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                )}
              </div>
              <p className="text-[10px] text-amber-200/90 font-medium truncate uppercase">
                {currentUser.role.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
