import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  Plus,
  Menu,
  UserPlus,
  Briefcase,
  CalendarPlus,
  Building,
  Check,
  Shield,
  Eye,
  LogOut,
  KeyRound,
  Lock,
  X,
  ChevronRight,
  Cloud,
  RefreshCw,
  WifiOff,
  Download,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { NavItem } from './Sidebar';
import { Modal } from '../common/Modal';
import { Client } from '../../types/crm';
import {
  useDebouncedValue,
  searchCompanies,
  getSectionBadgeMeta,
  getLatestClientRemark,
  HighlightMatch,
} from '../../lib/companySearch';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface HeaderProps {
  onOpenMobileSidebar: () => void;
  onNavigate: (tab: NavItem) => void;
  onOpenAddCandidate: () => void;
  onOpenAddJob: () => void;
  onOpenAddClient: (initialName?: string) => void;
  onOpenClientProfile: (client: Client) => void;
  onOpenScheduleInterview: () => void;
  onOpenFirebaseModal: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileSidebar,
  onNavigate,
  onOpenAddCandidate,
  onOpenAddJob,
  onOpenAddClient,
  onOpenClientProfile,
  onOpenScheduleInterview,
  onLogout,
}) => {
  const {
    currentUser,
    syncStatus,
    globalSearch,
    setGlobalSearch,
    visibleCandidates,
    visibleClients,
    visibleJobs,
    notifications,
    unreadNotificationCount,
    markNotificationRead,
    clearAllNotifications,
    isRecruiterOrHr,
    viewAllToggle,
    setViewAllToggle,
    changeMyPassword,
  } = useCRM();

  const { isInstallable, promptInstall } = usePWAInstall();

  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isMobileSearchExpanded, setIsMobileSearchExpanded] = useState(false);

  // Change Password Modal
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const quickAddRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const globalSearchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  const debouncedGlobalSearch = useDebouncedValue(globalSearch, 200);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (quickAddRef.current && !quickAddRef.current.contains(e.target as Node)) {
        setShowQuickAdd(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut "/" to focus global search on desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const activeEl = document.activeElement;
      const isInputFocused =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl instanceof HTMLSelectElement ||
        (activeEl as HTMLElement | null)?.isContentEditable;
      if (isInputFocused) return;
      e.preventDefault();
      globalSearchInputRef.current?.focus();
      setShowSearchResults(true);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isMobileSearchExpanded) {
      setTimeout(() => mobileSearchInputRef.current?.focus(), 50);
    }
  }, [isMobileSearchExpanded]);

  const q = debouncedGlobalSearch.toLowerCase().trim();
  const matchedClients =
    q.length >= 1 ? searchCompanies(visibleClients, debouncedGlobalSearch).slice(0, 8) : [];
  const matchedCandidates =
    q.length >= 2
      ? visibleCandidates
          .filter(
            (c) =>
              c.fullName.toLowerCase().includes(q) ||
              c.phone.includes(q) ||
              c.skills.some((s) => s.toLowerCase().includes(q)) ||
              c.city.toLowerCase().includes(q)
          )
          .slice(0, 4)
      : [];

  const matchedJobs =
    q.length >= 2
      ? visibleJobs
          .filter(
            (j) =>
              j.title.toLowerCase().includes(q) ||
              j.clientName.toLowerCase().includes(q) ||
              j.location.toLowerCase().includes(q)
          )
          .slice(0, 3)
      : [];

  const totalMatches =
    matchedCandidates.length + matchedClients.length + matchedJobs.length;

  const renderSearchResultsDropdown = () => {
    if (!showSearchResults || q.length < 1) return null;
    return (
      <div className="absolute left-0 right-0 mt-2 bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 p-3 z-50 max-h-[75vh] overflow-y-auto space-y-3">
        {totalMatches === 0 ? (
          <div className="py-4 px-2 text-center space-y-2">
            <p className="text-xs text-slate-600 font-medium">
              No results found for "{globalSearch.trim()}"
            </p>
            {currentUser.role !== 'recruiter' && (
              <button
                type="button"
                onClick={() => {
                  const nameToAdd = globalSearch.trim();
                  setShowSearchResults(false);
                  setIsMobileSearchExpanded(false);
                  onOpenAddClient(nameToAdd);
                }}
                className="min-h-[40px] mx-auto px-3 py-1.5 rounded-lg bg-[#0B1F4B] hover:bg-[#163270] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#F5A623]" />
                <span>Add "{globalSearch.trim()}" as a Company</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {matchedClients.length > 0 && (
              <div>
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Companies ({matchedClients.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate('clients');
                      setShowSearchResults(false);
                      setIsMobileSearchExpanded(false);
                    }}
                    className="text-[11px] font-bold text-[#0B1F4B] hover:underline cursor-pointer"
                  >
                    See all in Clients
                  </button>
                </div>
                <div className="space-y-1 mt-1">
                  {matchedClients.map((cl) => {
                    const badge = getSectionBadgeMeta(cl);
                    const mainContact = cl.contactPersons?.[0];
                    const latestRem = getLatestClientRemark(cl);

                    return (
                      <button
                        key={cl.id}
                        type="button"
                        onClick={() => {
                          onOpenClientProfile(cl);
                          setShowSearchResults(false);
                          setIsMobileSearchExpanded(false);
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-100 flex items-start justify-between gap-2 text-xs cursor-pointer"
                      >
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 truncate">
                              <HighlightMatch text={cl.name} query={debouncedGlobalSearch} />
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.badgeClass}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`} />
                              {badge.label}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 truncate">
                            <HighlightMatch text={cl.city} query={debouncedGlobalSearch} /> •{' '}
                            <HighlightMatch
                              text={mainContact?.name || '-'}
                              query={debouncedGlobalSearch}
                            />
                            {mainContact?.phone ? (
                              <>
                                {' '}
                                (
                                <HighlightMatch
                                  text={mainContact.phone}
                                  query={debouncedGlobalSearch}
                                />
                                )
                              </>
                            ) : null}
                          </p>
                          {latestRem && (
                            <p className="text-[10px] text-slate-500 truncate">
                              Remark:{' '}
                              <HighlightMatch text={latestRem} query={debouncedGlobalSearch} />
                            </p>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {matchedCandidates.length > 0 && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 py-1">
                  Candidates ({matchedCandidates.length})
                </div>
                {matchedCandidates.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      onNavigate('candidates');
                      setShowSearchResults(false);
                      setIsMobileSearchExpanded(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-100 flex items-center justify-between text-xs cursor-pointer"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{c.fullName}</div>
                      <div className="text-[11px] text-slate-600">
                        {c.skills.slice(0, 3).join(', ')} • {c.city}
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200">
                      {c.status}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {matchedJobs.length > 0 && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 py-1">
                  Job Openings ({matchedJobs.length})
                </div>
                {matchedJobs.map((j) => (
                  <button
                    key={j.id}
                    type="button"
                    onClick={() => {
                      onNavigate('jobs');
                      setShowSearchResults(false);
                      setIsMobileSearchExpanded(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-100 flex items-center justify-between text-xs cursor-pointer"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{j.title}</div>
                      <div className="text-[11px] text-slate-600">
                        {j.clientName} • {j.location}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-800 font-bold">
                      ₹{j.salaryMinLPA}-{j.salaryMaxLPA} LPA
                    </span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 pt-safe">
      <div className="h-15 sm:h-16 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 relative">
        {/* Expanded Full-Width Mobile Search Bar Overlay */}
        {isMobileSearchExpanded && (
          <div className="md:hidden absolute inset-0 bg-white z-40 px-3 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                ref={mobileSearchInputRef}
                type="search"
                value={globalSearch}
                onChange={(e) => {
                  setGlobalSearch(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                placeholder="Search companies, candidates, jobs..."
                className="w-full pl-9 pr-8 py-2 text-base rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
              />
              {globalSearch && (
                <button
                  type="button"
                  onClick={() => setGlobalSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-900"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {renderSearchResultsDropdown()}
            </div>
            <button
              type="button"
              onClick={() => {
                setIsMobileSearchExpanded(false);
                setShowSearchResults(false);
              }}
              className="min-h-[44px] px-3 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 shrink-0"
            >
              Close
            </button>
          </div>
        )}

        {/* Left: Hamburger (< 1024px) + Compact Brand on Mobile + Global Search on Tablet/Desktop */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 max-w-xl">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            aria-label="Open menu"
            className="lg:hidden min-w-[44px] min-h-[44px] p-2 rounded-xl text-slate-700 hover:bg-slate-100 flex items-center justify-center shrink-0 cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Compact Logo & Title on Phones */}
          <div className="flex md:hidden items-center gap-2 min-w-0">
            <img
              src="/assets/aistudio/BJ-Bright-logo-circle_cb142036.png"
              alt="BJ Bright"
              className="w-8 h-8 rounded-full object-contain bg-[#0B1F4B] ring-1 ring-[#F5A623] shrink-0"
            />
            <span className="font-extrabold text-sm text-[#0B1F4B] truncate">
              BJ Bright CRM
            </span>
          </div>

          {/* Desktop/Tablet Global Search Input */}
          <div ref={searchRef} className="hidden md:block relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              ref={globalSearchInputRef}
              type="text"
              placeholder='Search company, candidate, skill, phone, or remark... (Press "/")'
              value={globalSearch}
              onChange={(e) => {
                setGlobalSearch(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setShowSearchResults(false);
                }
              }}
              className="w-full pl-10 pr-8 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0B1F4B] transition-all"
            />
            {globalSearch && (
              <button
                type="button"
                onClick={() => {
                  setGlobalSearch('');
                  globalSearchInputRef.current?.focus();
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded text-slate-500 hover:text-slate-900 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {renderSearchResultsDropdown()}
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Mobile Search Icon Button */}
          <button
            type="button"
            onClick={() => setIsMobileSearchExpanded(true)}
            aria-label="Search CRM"
            className="md:hidden min-w-[44px] min-h-[44px] p-2 rounded-xl text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Real-Time Cloud Sync Status Indicator */}
          <div
            title={
              syncStatus === 'Offline'
                ? 'Offline - changes will sync when you are back online'
                : syncStatus === 'Syncing...'
                ? 'Syncing changes with Firestore...'
                : 'All data synced across devices'
            }
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
              syncStatus === 'Offline'
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : syncStatus === 'Syncing...'
                ? 'bg-blue-50 border-blue-300 text-blue-900'
                : 'bg-emerald-50 border-emerald-300 text-emerald-900'
            }`}
          >
            {syncStatus === 'Offline' ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span className="hidden xl:inline">
                  Offline - changes will sync when you are back online
                </span>
                <span className="xl:hidden">Offline</span>
              </>
            ) : syncStatus === 'Syncing...' ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-blue-700 animate-spin shrink-0" />
                <span>Syncing...</span>
              </>
            ) : (
              <>
                <Cloud className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Synced</span>
              </>
            )}
          </div>

          {/* Recruiter / HR Scope Toggle */}
          {isRecruiterOrHr && (
            <button
              type="button"
              onClick={() => setViewAllToggle(!viewAllToggle)}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                viewAllToggle
                  ? 'bg-amber-100 border-amber-300 text-amber-950'
                  : 'bg-slate-100 border-slate-300 text-slate-800'
              }`}
              title="Switch between My Assigned Records and All Team Records"
            >
              <Eye className="w-3.5 h-3.5 text-[#0B1F4B]" />
              <span>{viewAllToggle ? 'Viewing: All Records' : 'Viewing: My Assigned'}</span>
            </button>
          )}

          {/* Quick Add Button */}
          <div ref={quickAddRef} className="relative">
            <button
              type="button"
              onClick={() => setShowQuickAdd(!showQuickAdd)}
              className="min-h-[44px] sm:min-h-[38px] flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0B1F4B] hover:bg-[#163270] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#F5A623]" />
              <span className="hidden sm:inline">Quick Add</span>
            </button>

            {showQuickAdd && (
              <div className="absolute right-0 mt-2 w-56 bg-white text-slate-900 rounded-xl shadow-xl border border-slate-200 py-1.5 z-50">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Create New Record
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowQuickAdd(false);
                    onOpenAddCandidate();
                  }}
                  className="w-full min-h-[44px] flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-800 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 text-blue-700" />
                  <span>Add New Candidate</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowQuickAdd(false);
                    onOpenScheduleInterview();
                  }}
                  className="w-full min-h-[44px] flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-800 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  <CalendarPlus className="w-4 h-4 text-purple-700" />
                  <span>Schedule Interview</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowQuickAdd(false);
                    onOpenAddJob();
                  }}
                  className="w-full min-h-[44px] flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-800 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  <Briefcase className="w-4 h-4 text-emerald-700" />
                  <span>Create Job Opening</span>
                </button>
                {currentUser.role !== 'recruiter' && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowQuickAdd(false);
                      onOpenAddClient('');
                    }}
                    className="w-full min-h-[44px] flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-800 hover:bg-slate-100 font-semibold cursor-pointer"
                  >
                    <Building className="w-4 h-4 text-amber-700" />
                    <span>Add New Company</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Notification Bell */}
          <div ref={notifRef} className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label="Notifications"
              className="relative min-w-[44px] min-h-[44px] p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-center cursor-pointer"
            >
              <Bell className="w-5 h-5" />
              {unreadNotificationCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-4.5 px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadNotificationCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 mt-2 sm:w-84 bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    Notifications ({unreadNotificationCount} Unread)
                  </span>
                  {notifications.length > 0 && (
                    <button
                      type="button"
                      onClick={clearAllNotifications}
                      className="text-[11px] text-[#0B1F4B] hover:underline font-bold cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      All caught up! No pending alerts today.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markNotificationRead(n.id);
                          onNavigate(n.targetTab as NavItem);
                          setShowNotifications(false);
                        }}
                        className={`p-3.5 text-xs cursor-pointer hover:bg-slate-50 transition-colors flex items-start gap-2.5 ${
                          !n.isRead ? 'bg-blue-50/60' : ''
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            n.type === 'overdue'
                              ? 'bg-rose-600'
                              : n.type === 'interview'
                              ? 'bg-purple-600'
                              : 'bg-amber-600'
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-bold ${
                              !n.isRead ? 'text-slate-900' : 'text-slate-600'
                            }`}
                          >
                            {n.title}
                          </p>
                          <p className="text-[11px] text-slate-600 mt-0.5">{n.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Menu */}
          <div ref={userRef} className="relative pl-1 sm:pl-2 border-l border-slate-200">
            <button
              type="button"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              aria-label="Account menu"
              className="min-h-[44px] flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-lg object-cover ring-2 ring-[#F5A623]/60"
              />
              <div className="hidden md:block text-left">
                <div className="text-xs font-bold text-slate-900 leading-none">
                  {currentUser.name}
                </div>
                <div className="text-[10px] font-semibold text-amber-800 uppercase tracking-wider mt-0.5 flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5" />
                  {currentUser.role.replace('_', ' ')}
                </div>
              </div>
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white text-slate-900 rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                <div className="px-3.5 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                  <p className="text-[11px] text-slate-600 truncate">{currentUser.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded bg-amber-100 text-amber-950 text-[10px] font-bold uppercase">
                    {currentUser.role.replace('_', ' ')}
                  </span>
                </div>

                {/* Mobile Scope Toggle inside menu */}
                {isRecruiterOrHr && (
                  <div className="px-2 pt-1.5 md:hidden">
                    <button
                      type="button"
                      onClick={() => {
                        setViewAllToggle(!viewAllToggle);
                        setShowUserDropdown(false);
                      }}
                      className="w-full min-h-[44px] flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-slate-800 hover:bg-slate-100 cursor-pointer"
                    >
                      <Eye className="w-4 h-4 text-[#0B1F4B]" />
                      <span>
                        {viewAllToggle ? 'Switch to My Assigned' : 'Switch to All Records'}
                      </span>
                    </button>
                  </div>
                )}

                {isInstallable && (
                  <div className="px-2 pt-1.5">
                    <button
                      type="button"
                      onClick={async () => {
                        setShowUserDropdown(false);
                        await promptInstall();
                      }}
                      className="w-full min-h-[44px] flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-[#0B1F4B] bg-amber-50 hover:bg-amber-100 cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-[#0B1F4B]" />
                      <span>Install BJ Bright CRM App</span>
                    </button>
                  </div>
                )}

                <div className="mt-1 pt-1 border-t border-slate-100 px-2 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserDropdown(false);
                      setPasswordError('');
                      setPasswordSuccess(false);
                      setNewPassword('');
                      setConfirmPassword('');
                      setIsChangePasswordOpen(true);
                    }}
                    className="w-full min-h-[44px] flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4 text-[#0B1F4B]" />
                    <span>Change My Password</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowUserDropdown(false);
                      onLogout();
                    }}
                    className="w-full min-h-[44px] flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out ({currentUser.name.split(' ')[0]})</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        title="Change My Password"
        subtitle={`Account: ${currentUser.name} (${currentUser.email})`}
        maxWidth="sm"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPasswordError('');
            if (newPassword.trim().length < 4) {
              setPasswordError('Password must be at least 4 characters.');
              return;
            }
            if (newPassword !== confirmPassword) {
              setPasswordError('Passwords do not match.');
              return;
            }
            changeMyPassword(newPassword.trim());
            setPasswordSuccess(true);
            setTimeout(() => {
              setIsChangePasswordOpen(false);
              setPasswordSuccess(false);
            }, 900);
          }}
          className="space-y-4 text-xs"
        >
          {passwordError && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-300 text-rose-800 font-semibold">
              {passwordError}
            </div>
          )}
          {passwordSuccess && (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 font-semibold">
              Password updated!
            </div>
          )}

          <div>
            <label className="font-bold text-slate-800 block mb-1">New Password *</label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1">Confirm New Password *</label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsChangePasswordOpen(false)}
              className="min-h-[44px] px-4 py-2 font-bold text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-4 py-2 bg-[#0B1F4B] hover:bg-[#163270] text-white font-bold rounded-lg shadow-xs cursor-pointer"
            >
              Update Password
            </button>
          </div>
        </form>
      </Modal>
    </header>
  );
};
