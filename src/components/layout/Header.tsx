import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  Plus,
  Moon,
  Sun,
  Bell,
  Database,
  CheckCircle2,
  Briefcase,
  Users,
  Building2,
  Calendar,
  ChevronDown,
  UserCheck,
  Shield,
  Receipt,
  AlertTriangle,
  Sparkles,
  CheckSquare,
  LogOut,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { NavItem } from './Sidebar';
import { Client } from '../../types/crm';
import {
  useDebouncedValue,
  searchCompanies,
  getLatestClientRemark,
  getSectionBadgeMeta,
  HighlightMatch,
} from '../../lib/companySearch';

interface HeaderProps {
  onOpenMobileSidebar: () => void;
  onNavigate: (tab: NavItem) => void;
  onOpenAddCandidate: () => void;
  onOpenAddJob: () => void;
  onOpenAddClient: (initialName?: string) => void;
  onOpenClientProfile?: (client: Client) => void;
  onOpenScheduleInterview: () => void;
  onOpenFirebaseModal: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileSidebar,
  onNavigate,
  onOpenAddCandidate,
  onOpenAddJob,
  onOpenAddClient,
  onOpenClientProfile,
  onOpenScheduleInterview,
  onOpenFirebaseModal,
  onLogout,
}) => {
  const {
    currentUser,
    syncStatus,
    changeMyPassword,
    isDarkMode,
    toggleDarkMode,
    visibleCandidates,
    visibleJobs,
    visibleClients,
    setGlobalSearch,
    notifications,
    unreadNotificationCount,
    markNotificationRead,
    clearAllNotifications,
  } = useCRM();

  const canManageClients =
    currentUser.role === 'admin' ||
    currentUser.role === 'manager' ||
    currentUser.role === 'hr_executive';

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [passwordSavedMsg, setPasswordSavedMsg] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebouncedValue(searchQuery, 200);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);
  const quickAddRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Pressing "/" anywhere (when not typing in an input/textarea/select) focuses the global search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      e.preventDefault();
      searchInputRef.current?.focus();
      setIsSearchOpen(true);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
      if (quickAddRef.current && !quickAddRef.current.contains(e.target as Node)) {
        setIsQuickAddOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeQuery = debouncedQuery.trim();

  const filteredClients = React.useMemo(() => {
    if (!activeQuery) return [];
    return searchCompanies(visibleClients, activeQuery);
  }, [visibleClients, activeQuery]);

  const filteredCandidates = React.useMemo(() => {
    if (!activeQuery) return [];
    const q = activeQuery.toLowerCase();
    return visibleCandidates.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.phone.includes(activeQuery) ||
        c.skills.some((s) => s.toLowerCase().includes(q))
    );
  }, [visibleCandidates, activeQuery]);

  const filteredJobs = React.useMemo(() => {
    if (!activeQuery) return [];
    const q = activeQuery.toLowerCase();
    return visibleJobs.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.clientName.toLowerCase().includes(q)
    );
  }, [visibleJobs, activeQuery]);

  return (
    <header className="sticky top-0 z-30 h-18 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 shadow-xs">
      {/* Left: Mobile hamburger & Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onOpenMobileSidebar}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden transition-colors"
          title="Open Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <div ref={searchRef} className="relative flex-1">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="Search companies, candidates, or jobs... (Press '/' to focus)"
              className="w-full pl-10 pr-8 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B1F4B] transition-all"
            />
            {!searchQuery && (
              <kbd className="hidden sm:inline-flex absolute right-2.5 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded">
                /
              </kbd>
            )}
          </div>

          {/* Search Dropdown Results */}
          {isSearchOpen && activeQuery.length > 0 && (
            <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-50 max-h-[28rem] overflow-y-auto space-y-3">
              {/* Companies Section */}
              <div>
                <div className="flex items-center justify-between px-2 mb-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Companies ({filteredClients.length})
                  </p>
                  {filteredClients.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setGlobalSearch(activeQuery);
                        onNavigate('clients');
                        setIsSearchOpen(false);
                      }}
                      className="text-[11px] font-bold text-blue-600 dark:text-amber-400 hover:underline cursor-pointer"
                    >
                      See all results ({filteredClients.length})
                    </button>
                  )}
                </div>

                {filteredClients.length > 0 ? (
                  <div className="space-y-1">
                    {filteredClients.slice(0, 8).map((cl) => {
                      const badge = getSectionBadgeMeta(cl);
                      const mainContact = cl.contactPersons?.[0];
                      const latestRemark = getLatestClientRemark(cl);

                      return (
                        <button
                          key={cl.id}
                          type="button"
                          onClick={() => {
                            if (onOpenClientProfile) {
                              onOpenClientProfile(cl);
                            } else {
                              setGlobalSearch(cl.name);
                              onNavigate('clients');
                            }
                            setIsSearchOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-start justify-between gap-2 text-xs transition-colors cursor-pointer"
                        >
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 dark:text-white truncate">
                                <HighlightMatch text={cl.name} query={activeQuery} />
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.badgeClass}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`} />
                                {badge.label}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate">
                              <HighlightMatch text={cl.city} query={activeQuery} /> • Contact:{' '}
                              <HighlightMatch
                                text={mainContact?.name || '-'}
                                query={activeQuery}
                              />
                              {mainContact?.phone ? (
                                <>
                                  {' '}
                                  (<HighlightMatch text={mainContact.phone} query={activeQuery} />)
                                </>
                              ) : null}
                            </p>
                            {latestRemark && (
                              <p className="text-[10px] text-slate-400 truncate">
                                Remark: <HighlightMatch text={latestRemark} query={activeQuery} />
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}

                    {filteredClients.length > 8 && (
                      <button
                        type="button"
                        onClick={() => {
                          setGlobalSearch(activeQuery);
                          onNavigate('clients');
                          setIsSearchOpen(false);
                        }}
                        className="w-full py-1.5 text-center text-xs font-bold text-blue-600 dark:text-amber-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer"
                      >
                        See all results ({filteredClients.length} companies)
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-2 text-xs">
                    <span className="text-slate-500">
                      No company found for "{activeQuery}"
                    </span>
                    {canManageClients && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsSearchOpen(false);
                          onOpenAddClient(activeQuery);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#0B1F4B] hover:bg-[#163270] text-white text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <Plus className="w-3 h-3 text-[#F5A623]" />
                        <span>Add this company</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {filteredCandidates.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1">
                    Candidates ({filteredCandidates.length})
                  </p>
                  <div className="space-y-1">
                    {filteredCandidates.slice(0, 5).map((cand) => (
                      <button
                        key={cand.id}
                        type="button"
                        onClick={() => {
                          onNavigate('candidates');
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-xs transition-colors cursor-pointer"
                      >
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">
                            <HighlightMatch text={cand.fullName} query={activeQuery} />
                          </p>
                          <p className="text-[10px] text-slate-500">
                            <HighlightMatch text={cand.phone} query={activeQuery} /> •{' '}
                            {cand.skills.slice(0, 3).join(', ')}
                          </p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                          {cand.status}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filteredJobs.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1">
                    Job Openings ({filteredJobs.length})
                  </p>
                  <div className="space-y-1">
                    {filteredJobs.slice(0, 4).map((job) => (
                      <button
                        key={job.id}
                        type="button"
                        onClick={() => {
                          onNavigate('jobs');
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-xs transition-colors cursor-pointer"
                      >
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">
                            <HighlightMatch text={job.title} query={activeQuery} />
                          </p>
                          <p className="text-[10px] text-slate-500">
                            <HighlightMatch text={job.clientName} query={activeQuery} /> • {job.location}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-amber-600">₹{job.salaryMaxLPA} LPA</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Actions & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Real-time Cloud Sync Status Indicator */}
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${
            syncStatus === 'Synced'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
              : syncStatus === 'Syncing...'
              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
              : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
          }`}
          title={
            syncStatus === 'Offline'
              ? 'Offline - changes will sync when you are back online'
              : `Firebase Cloud Status: ${syncStatus}`
          }
        >
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              syncStatus === 'Synced'
                ? 'bg-emerald-500'
                : syncStatus === 'Syncing...'
                ? 'bg-amber-500 animate-pulse'
                : 'bg-rose-500'
            }`}
          />
          <span className="truncate max-w-[210px] sm:max-w-none">
            {syncStatus === 'Offline'
              ? 'Offline - changes will sync when you are back online'
              : syncStatus}
          </span>
        </div>

        {/* Quick Add Dropdown */}
        <div ref={quickAddRef} className="relative">
          <button
            onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
            className="px-3.5 py-2 rounded-xl bg-[#0B1F4B] hover:bg-[#163270] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#F5A623]" />
            <span className="hidden sm:inline">Quick Add</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-300" />
          </button>

          {isQuickAddOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50">
              <button
                onClick={() => {
                  onOpenAddCandidate();
                  setIsQuickAddOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Users className="w-4 h-4 text-blue-600" />
                <span>+ Add Candidate</span>
              </button>
              <button
                onClick={() => {
                  onOpenAddJob();
                  setIsQuickAddOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Briefcase className="w-4 h-4 text-purple-600" />
                <span>+ Post Job Opening</span>
              </button>
              {canManageClients && (
                <button
                  onClick={() => {
                    onOpenAddClient();
                    setIsQuickAddOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Building2 className="w-4 h-4 text-amber-600" />
                  <span>+ Onboard Client</span>
                </button>
              )}
              <button
                onClick={() => {
                  onOpenScheduleInterview();
                  setIsQuickAddOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>+ Schedule Interview</span>
              </button>
            </div>
          )}
        </div>

        {/* Logged-in User Account Menu */}
        <div ref={roleRef} className="relative">
          <button
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Account Profile & Session"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover border-2 border-[#F5A623] bg-[#0B1F4B]"
            />
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{currentUser.name}</p>
              <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold uppercase">{currentUser.role.replace('_', ' ')}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isRoleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-50 space-y-2.5">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center gap-3">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-[#F5A623] bg-[#0B1F4B] shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">{currentUser.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300">
                    {currentUser.designation || currentUser.role.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <button
                  onClick={() => {
                    onNavigate('tasks');
                    setIsRoleDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                  <span>My Tasks & Follow-ups</span>
                </button>

                {currentUser.role === 'admin' && (
                  <button
                    onClick={() => {
                      onNavigate('settings');
                      setIsRoleDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Shield className="w-4 h-4 text-[#F5A623]" />
                    <span>Organization & User Settings</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsChangingPassword(!isChangingPassword);
                    setPasswordSavedMsg('');
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <span>Change Account Password</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isChangingPassword ? 'rotate-180' : ''}`} />
                </button>

                {isChangingPassword && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (newPasswordInput.trim().length < 6) {
                        setPasswordSavedMsg('Min 6 characters required');
                        return;
                      }
                      changeMyPassword(newPasswordInput.trim());
                      setNewPasswordInput('');
                      setPasswordSavedMsg('Password updated!');
                      setTimeout(() => {
                        setIsChangingPassword(false);
                        setPasswordSavedMsg('');
                      }, 1500);
                    }}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 space-y-2 border border-slate-200 dark:border-slate-700"
                  >
                    <input
                      type="password"
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      placeholder="New password (min 6 chars)"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                      required
                    />
                    <div className="flex items-center justify-between gap-2">
                      {passwordSavedMsg && (
                        <span className="text-[10px] font-bold text-emerald-600">{passwordSavedMsg}</span>
                      )}
                      <button
                        type="submit"
                        className="ml-auto px-3 py-1 rounded-lg bg-[#0B1F4B] text-white text-[11px] font-bold cursor-pointer"
                      >
                        Update Password
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {onLogout && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setIsRoleDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out Securely</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notifications Popover */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Notifications & Reminders"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#F5A623] text-slate-950 font-black text-[10px] flex items-center justify-center shadow-xs">
                {unreadNotificationCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-88 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-2.5 z-50">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>Notifications & Alerts</span>
                    {unreadNotificationCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200">
                        {unreadNotificationCount} unread
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] text-slate-400">Interviews, Overdue Tasks & Candidate Stages</p>
                </div>
                {unreadNotificationCount > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="text-[11px] font-bold text-blue-600 dark:text-amber-400 hover:underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No active notifications or pending reminders!
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        markNotificationRead(notif.id);
                        if (notif.targetTab) {
                          onNavigate(notif.targetTab as any);
                        }
                        setIsNotificationsOpen(false);
                      }}
                      className={`p-3 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer flex items-start gap-3 transition-colors ${
                        !notif.isRead ? 'bg-amber-50/30 dark:bg-amber-950/20' : ''
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                        <Bell className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <p className="font-bold text-slate-900 dark:text-white truncate">
                            {notif.title}
                          </p>
                          {!notif.isRead && (
                            <span className="w-2 h-2 rounded-full bg-[#F5A623] shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                          {notif.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 rounded-b-2xl flex items-center justify-between text-xs">
                <button
                  onClick={() => {
                    onNavigate('tasks');
                    setIsNotificationsOpen(false);
                  }}
                  className="font-bold text-blue-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Open My Tasks & Reminders</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Toggle Light / Dark Mode"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
