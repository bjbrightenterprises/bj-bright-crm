import React, { useState, useMemo } from 'react';
import {
  Building2,
  Search,
  Plus,
  MapPin,
  Phone,
  Edit,
  Trash2,
  ChevronRight,
  Upload,
  Download,
  Bell,
  Calendar,
  MessageSquare,
  MessageSquarePlus,
  ArrowRightLeft,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Clock,
  X,
  Briefcase,
} from 'lucide-react';
import {
  Client,
  ClientSection,
  CLIENT_SECTION_LABELS,
  getClientSection,
  formatIndianDate,
} from '../../types/crm';
import { useCRM } from '../../context/CRMContext';
import { Modal } from '../common/Modal';
import { ClientFormModal } from './ClientFormModal';
import { ClientProfileModal } from './ClientProfileModal';
import { ExcelCsvImportModal } from '../common/ExcelCsvImportModal';
import { ExcelExportModal } from '../common/ExcelExportModal';
import { CLIENT_EXPORT_COLUMNS, generateClientsSummarySheet } from '../../lib/excelModuleConfigs';
import { SetReminderModal } from '../reminders/SetReminderModal';
import {
  useDebouncedValue,
  searchCompanies,
  getLatestClientRemark,
  getSectionBadgeMeta,
  HighlightMatch,
} from '../../lib/companySearch';

interface ClientsModuleProps {
  onOpenCreateJobForClient: (client: Client) => void;
  initialProfileClientId?: string;
  onClearInitialProfileClient?: () => void;
}

const SECTION_CONFIG: Array<{
  section: ClientSection;
  title: string;
  subtitle: string;
  keyDateLabel: string;
  headerBg: string;
  borderClass: string;
  badgeClass: string;
  summaryCardClass: string;
  dotClass: string;
}> = [
  {
    section: 'Green',
    title: 'Active Clients',
    subtitle: 'Agreement signed, currently hiring for us',
    keyDateLabel: 'Agreement Signed',
    headerBg: 'bg-emerald-700 text-white',
    borderClass: 'border-emerald-200 dark:border-emerald-800/70',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    summaryCardClass:
      'border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  {
    section: 'Blue',
    title: 'In Discussion',
    subtitle: 'We have spoken to them, agreement NOT signed yet',
    keyDateLabel: 'Last Contacted',
    headerBg: 'bg-blue-700 text-white',
    borderClass: 'border-blue-200 dark:border-blue-800/70',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
    summaryCardClass:
      'border-blue-300 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200',
    dotClass: 'bg-blue-500',
  },
  {
    section: 'Red',
    title: 'New Enquiries',
    subtitle: 'Enquiry received, no conversation has happened yet',
    keyDateLabel: 'Enquiry Received',
    headerBg: 'bg-rose-700 text-white',
    borderClass: 'border-rose-200 dark:border-rose-800/70',
    badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
    summaryCardClass:
      'border-rose-300 dark:border-rose-800 bg-rose-50/70 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200',
    dotClass: 'bg-rose-500',
  },
];

export const ClientsModule: React.FC<ClientsModuleProps> = ({
  onOpenCreateJobForClient,
  initialProfileClientId,
  onClearInitialProfileClient,
}) => {
  const {
    visibleClients,
    trashClients,
    currentUser,
    canCreateTasks,
    globalSearch,
    setGlobalSearch,
    moveClientSection,
    deleteClient,
    restoreClient,
    addClientRemark,
    updateClient,
  } = useCRM();

  const isAdmin = currentUser.role === 'admin';
  const canManageClients =
    currentUser.role === 'admin' ||
    currentUser.role === 'manager' ||
    currentUser.role === 'hr_executive';
  const todayStr = new Date().toISOString().slice(0, 10);

  // Search & Filters
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 200);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [selectedSectionChip, setSelectedSectionChip] = useState<'All' | ClientSection>('All');
  const [onlyOverdueFollowUp, setOnlyOverdueFollowUp] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>('All');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('All');
  const [showTrash, setShowTrash] = useState(false);

  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const searchContainerRef = React.useRef<HTMLDivElement>(null);

  // Modals
  const [activeProfileClient, setActiveProfileClient] = useState<Client | null>(null);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [addClientInitialName, setAddClientInitialName] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [reminderClient, setReminderClient] = useState<Client | null>(null);

  // Automatically focus the search box when the Clients page opens
  React.useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Sync from globalSearch if navigated via "See all results"
  React.useEffect(() => {
    if (globalSearch && globalSearch.trim()) {
      setSearch(globalSearch);
      setIsSearchDropdownOpen(false);
      setGlobalSearch('');
    }
  }, [globalSearch, setGlobalSearch]);

  // Open profile if navigated from global search result click
  React.useEffect(() => {
    if (initialProfileClientId) {
      const target = visibleClients.find((c) => c.id === initialProfileClientId);
      if (target) {
        setActiveProfileClient(target);
      }
      onClearInitialProfileClient?.();
    }
  }, [initialProfileClientId, visibleClients, onClearInitialProfileClient]);

  // Close search dropdown on outside click
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Move Section Modal state
  const [moveDialog, setMoveDialog] = useState<{
    client: Client;
    targetSection: ClientSection;
  } | null>(null);
  const [moveDate, setMoveDate] = useState('');
  const [moveRemark, setMoveRemark] = useState('');
  const [moveError, setMoveError] = useState('');
  const [isMoving, setIsMoving] = useState(false);

  // Delete Client Modal state (Admin only)
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Quick Add Remark Modal state
  const [remarkTarget, setRemarkTarget] = useState<Client | null>(null);
  const [quickRemarkText, setQuickRemarkText] = useState('');
  const [quickRemarkError, setQuickRemarkError] = useState('');
  const [isSavingQuickRemark, setIsSavingQuickRemark] = useState(false);

  // Quick Edit JD Modal & Expandable JD on Cards state
  const [expandedJdClientIds, setExpandedJdClientIds] = useState<Record<string, boolean>>({});
  const [jdEditTarget, setJdEditTarget] = useState<Client | null>(null);
  const [jdEditText, setJdEditText] = useState('');
  const [jdEditReason, setJdEditReason] = useState('');
  const [jdEditError, setJdEditError] = useState('');

  // Drag & drop state
  const [draggedClientId, setDraggedClientId] = useState<string | null>(null);
  const [dragOverSection, setDragOverSection] = useState<ClientSection | null>(null);

  // Unique cities and industries for filter dropdowns
  const cities = useMemo(() => {
    const set = new Set<string>();
    visibleClients.forEach((cl) => {
      if (cl.city?.trim()) set.add(cl.city.trim());
    });
    return Array.from(set).sort();
  }, [visibleClients]);

  const industries = useMemo(() => {
    const set = new Set<string>();
    visibleClients.forEach((cl) => {
      if (cl.industry?.trim()) set.add(cl.industry.trim());
    });
    return Array.from(set).sort();
  }, [visibleClients]);

  const overdueCount = useMemo(() => {
    return visibleClients.filter(
      (c) => !!c.nextFollowUpDate && c.nextFollowUpDate < todayStr
    ).length;
  }, [visibleClients, todayStr]);

  // Forgiving company search matches (before section/city/industry/overdue filters)
  const searchMatchedClients = useMemo(() => {
    return searchCompanies(visibleClients, debouncedSearch);
  }, [visibleClients, debouncedSearch]);

  // Filtered clients applying search + quick filter chips + city + industry
  const filteredClients = useMemo(() => {
    return searchMatchedClients.filter((cl) => {
      const sec = getClientSection(cl);
      if (selectedSectionChip !== 'All' && sec !== selectedSectionChip) return false;
      if (onlyOverdueFollowUp) {
        const isOverdue = !!cl.nextFollowUpDate && cl.nextFollowUpDate < todayStr;
        if (!isOverdue) return false;
      }
      if (selectedCity !== 'All' && (cl.city || '').trim() !== selectedCity) return false;
      if (selectedIndustry !== 'All' && cl.industry !== selectedIndustry) return false;
      return true;
    });
  }, [
    searchMatchedClients,
    selectedSectionChip,
    onlyOverdueFollowUp,
    selectedCity,
    selectedIndustry,
    todayStr,
  ]);

  const hasActiveFilters =
    search.trim().length > 0 ||
    selectedSectionChip !== 'All' ||
    onlyOverdueFollowUp ||
    selectedCity !== 'All' ||
    selectedIndustry !== 'All';

  const handleClearAllFilters = () => {
    setSearch('');
    setSelectedSectionChip('All');
    setOnlyOverdueFollowUp(false);
    setSelectedCity('All');
    setSelectedIndustry('All');
    setIsSearchDropdownOpen(false);
    searchInputRef.current?.focus();
  };

  // Total counts across all visibleClients (for summary bar & "X of Y" headers)
  const totalSectionCounts = useMemo(() => {
    const counts: Record<ClientSection, number> = { Green: 0, Blue: 0, Red: 0 };
    visibleClients.forEach((c) => {
      counts[getClientSection(c)]++;
    });
    return counts;
  }, [visibleClients]);

  const clientsBySection = useMemo(() => {
    const groups: Record<ClientSection, Client[]> = { Green: [], Blue: [], Red: [] };
    filteredClients.forEach((c) => {
      groups[getClientSection(c)].push(c);
    });
    return groups;
  }, [filteredClients]);

  const openMoveModal = (client: Client, presetTarget?: ClientSection) => {
    if (!canManageClients) return;
    const currentSec = getClientSection(client);
    const defaultTarget: ClientSection =
      presetTarget && presetTarget !== currentSec
        ? presetTarget
        : currentSec === 'Red'
        ? 'Blue'
        : currentSec === 'Blue'
        ? 'Green'
        : 'Blue';

    const existingDate =
      defaultTarget === 'Green'
        ? client.agreementSignedDate || todayStr
        : defaultTarget === 'Blue'
        ? client.lastContactedDate || todayStr
        : client.enquiryDate || client.createdAt?.slice(0, 10) || todayStr;

    setMoveDialog({ client, targetSection: defaultTarget });
    setMoveDate(existingDate);
    setMoveRemark('');
    setMoveError('');
    setIsMoving(false);
  };

  const handleTargetSectionChange = (newTarget: ClientSection) => {
    if (!moveDialog) return;
    const { client } = moveDialog;
    const existingDate =
      newTarget === 'Green'
        ? client.agreementSignedDate || todayStr
        : newTarget === 'Blue'
        ? client.lastContactedDate || todayStr
        : client.enquiryDate || client.createdAt?.slice(0, 10) || todayStr;
    setMoveDialog({ client, targetSection: newTarget });
    setMoveDate(existingDate);
    setMoveError('');
  };

  const handleConfirmMove = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageClients || !moveDialog || isMoving) return;

    const { client, targetSection } = moveDialog;
    const trimmedRemark = moveRemark.trim();

    if (trimmedRemark.length < 3 || trimmedRemark.length > 500) {
      setMoveError('A remark between 3 and 500 characters is required when moving sections.');
      return;
    }

    if (!moveDate) {
      setMoveError(
        targetSection === 'Green'
          ? 'Agreement Signed Date is required when moving to Active Clients.'
          : targetSection === 'Blue'
          ? 'Last Contacted Date is required when moving to In Discussion.'
          : 'Enquiry Received Date is required when moving to New Enquiries.'
      );
      return;
    }

    if (moveDate > todayStr) {
      setMoveError('Date cannot be in the future.');
      return;
    }

    const effectiveEnquiry = client.enquiryDate || client.createdAt?.slice(0, 10);
    if (targetSection === 'Green' && effectiveEnquiry && moveDate < effectiveEnquiry) {
      setMoveError('Agreement Signed Date cannot be before the Enquiry Received Date.');
      return;
    }

    setIsMoving(true);
    moveClientSection(client.id, targetSection, trimmedRemark, moveDate);
    setMoveDialog(null);
    setIsMoving(false);
  };

  const openDeleteModal = (client: Client) => {
    if (!isAdmin) return;
    setDeleteTarget(client);
    setDeleteReason('');
    setDeleteError('');
    setIsDeleting(false);
  };

  const handleConfirmDelete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !deleteTarget || isDeleting) return;
    const trimmed = deleteReason.trim();
    if (trimmed.length < 3 || trimmed.length > 500) {
      setDeleteError('Please enter a valid reason (3 to 500 characters) to move this company to Trash.');
      return;
    }
    setIsDeleting(true);
    deleteClient(deleteTarget.id, trimmed);
    if (activeProfileClient?.id === deleteTarget.id) {
      setActiveProfileClient(null);
    }
    setDeleteTarget(null);
    setIsDeleting(false);
  };

  const handleSaveQuickRemark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageClients || !remarkTarget || isSavingQuickRemark) return;
    const trimmed = quickRemarkText.trim();
    if (trimmed.length < 3 || trimmed.length > 500) {
      setQuickRemarkError('Remark must be between 3 and 500 characters.');
      return;
    }
    setIsSavingQuickRemark(true);
    addClientRemark(remarkTarget.id, trimmed);
    setRemarkTarget(null);
    setQuickRemarkText('');
    setQuickRemarkError('');
    setIsSavingQuickRemark(false);
  };

  const openQuickEditJdModal = (client: Client) => {
    if (!canManageClients) return;
    setJdEditTarget(client);
    setJdEditText(client.agreementDetails || '');
    setJdEditReason('Updated company JD and hiring requirement details');
    setJdEditError('');
  };

  const handleSaveQuickJd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageClients || !jdEditTarget) return;
    const trimmedJd = jdEditText.trim();
    const trimmedReason = jdEditReason.trim();
    if (!trimmedJd) {
      setJdEditError('Please enter the JD / Hiring Requirement details.');
      return;
    }
    if (trimmedReason.length < 10) {
      setJdEditError('Reason for edit must be at least 10 characters.');
      return;
    }
    updateClient(jdEditTarget.id, { agreementDetails: trimmedJd }, trimmedReason);
    setJdEditTarget(null);
    setJdEditText('');
    setJdEditReason('');
    setJdEditError('');
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#F5A623]" />
            Clients & Corporate Companies
          </h2>
          <p className="text-xs text-slate-500">
            {visibleClients.length} total companies across Active Clients, In Discussion, and New Enquiries
            {!canManageClients && ' • Read-Only View'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin && (
            <button
              onClick={() => setShowTrash((prev) => !prev)}
              className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                showTrash
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Trash ({trashClients.length})</span>
            </button>
          )}

          {canManageClients && (
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>Import Excel</span>
            </button>
          )}

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-white" />
            <span>Export Excel</span>
          </button>

          {canManageClients && (
            <button
              onClick={() => {
                setClientToEdit(null);
                setAddClientInitialName('');
                setIsFormModalOpen(true);
              }}
              className="px-4 py-2 rounded-lg bg-[#0B1F4B] hover:bg-[#163270] text-white text-xs font-bold shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#F5A623]" />
              <span>Add Company</span>
            </button>
          )}
        </div>
      </div>

      {/* Top Summary Bar: Prominent Search + Quick Filter Chips + Three Colour-Coded Counts */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        {/* Prominent Search Box & Dropdown */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <div ref={searchContainerRef} className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0B1F4B] dark:text-[#F5A623] pointer-events-none" />
            <input
              ref={searchInputRef}
              autoFocus
              type="text"
              placeholder="Search companies by name, industry, city, address, website, contact person, phone, email, or remark..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setIsSearchDropdownOpen(true);
              }}
              onFocus={() => {
                if (search.trim()) setIsSearchDropdownOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsSearchDropdownOpen(false);
                } else if (e.key === 'Enter') {
                  setIsSearchDropdownOpen(false);
                }
              }}
              className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm font-medium rounded-xl border-2 border-[#0B1F4B]/20 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0B1F4B] dark:focus:border-[#F5A623] focus:ring-2 focus:ring-[#0B1F4B]/15 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setIsSearchDropdownOpen(false);
                  searchInputRef.current?.focus();
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Instant Search Dropdown (First 8 Matches + "See all results") */}
            {isSearchDropdownOpen && debouncedSearch.trim().length > 0 && (
              <div className="absolute left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2.5 z-40 max-h-96 overflow-y-auto space-y-1.5">
                <div className="flex items-center justify-between px-2.5 py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Matching Companies ({filteredClients.length})
                  </span>
                  {filteredClients.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsSearchDropdownOpen(false)}
                      className="text-[11px] font-bold text-blue-600 dark:text-amber-400 hover:underline cursor-pointer"
                    >
                      See all results ({filteredClients.length})
                    </button>
                  )}
                </div>

                {filteredClients.length > 0 ? (
                  <>
                    <div className="space-y-1">
                      {filteredClients.slice(0, 8).map((cl) => {
                        const badge = getSectionBadgeMeta(cl);
                        const mainContact = cl.contactPersons?.[0];
                        const latestRem = getLatestClientRemark(cl);

                        return (
                          <button
                            key={cl.id}
                            type="button"
                            onClick={() => {
                              setActiveProfileClient(cl);
                              setIsSearchDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-start justify-between gap-3 text-xs transition-colors cursor-pointer"
                          >
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-extrabold text-slate-900 dark:text-white truncate">
                                  <HighlightMatch text={cl.name} query={debouncedSearch} />
                                </span>
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.badgeClass}`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`} />
                                  {badge.label}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 truncate">
                                <HighlightMatch text={cl.city} query={debouncedSearch} /> •{' '}
                                <HighlightMatch text={cl.industry} query={debouncedSearch} /> • Contact:{' '}
                                <HighlightMatch
                                  text={mainContact?.name || '-'}
                                  query={debouncedSearch}
                                />
                                {mainContact?.phone ? (
                                  <>
                                    {' '}
                                    (<HighlightMatch text={mainContact.phone} query={debouncedSearch} />)
                                  </>
                                ) : null}
                              </p>
                              {latestRem && (
                                <p className="text-[11px] text-slate-400 truncate">
                                  Latest remark:{' '}
                                  <HighlightMatch text={latestRem} query={debouncedSearch} />
                                </p>
                              )}
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                          </button>
                        );
                      })}
                    </div>

                    {filteredClients.length > 8 && (
                      <button
                        type="button"
                        onClick={() => setIsSearchDropdownOpen(false)}
                        className="w-full py-2 text-center text-xs font-bold text-blue-600 dark:text-amber-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl transition-colors cursor-pointer"
                      >
                        See all results ({filteredClients.length} companies)
                      </button>
                    )}
                  </>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between gap-3 text-xs">
                    <span className="text-slate-500 font-medium">
                      No company found for "{debouncedSearch.trim()}"
                    </span>
                    {canManageClients && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsSearchDropdownOpen(false);
                          setClientToEdit(null);
                          setAddClientInitialName(search.trim());
                          setIsFormModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#0B1F4B] hover:bg-[#163270] text-white text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#F5A623]" />
                        <span>Add this company</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="All">All Cities</option>
              {cities.map((ct) => (
                <option key={ct} value={ct}>
                  {ct}
                </option>
              ))}
            </select>

            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="All">All Industries</option>
              {industries.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Filter Chips: All, Green, Blue, Red, Overdue Follow-up, and Clear */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Quick Filters:
            </span>
            <button
              type="button"
              onClick={() => setSelectedSectionChip('All')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                selectedSectionChip === 'All'
                  ? 'bg-[#0B1F4B] text-white border-[#0B1F4B]'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              All ({visibleClients.length})
            </button>

            <button
              type="button"
              onClick={() =>
                setSelectedSectionChip((prev) => (prev === 'Green' ? 'All' : 'Green'))
              }
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                selectedSectionChip === 'Green'
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100/70'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Green ({totalSectionCounts.Green})</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setSelectedSectionChip((prev) => (prev === 'Blue' ? 'All' : 'Blue'))
              }
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                selectedSectionChip === 'Blue'
                  ? 'bg-blue-700 text-white border-blue-700'
                  : 'bg-blue-50/70 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-100/70'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span>Blue ({totalSectionCounts.Blue})</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setSelectedSectionChip((prev) => (prev === 'Red' ? 'All' : 'Red'))
              }
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                selectedSectionChip === 'Red'
                  ? 'bg-rose-700 text-white border-rose-700'
                  : 'bg-rose-50/70 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800 hover:bg-rose-100/70'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>Red ({totalSectionCounts.Red})</span>
            </button>

            <button
              type="button"
              onClick={() => setOnlyOverdueFollowUp((prev) => !prev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                onlyOverdueFollowUp
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100/70'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Overdue Follow-up ({overdueCount})</span>
            </button>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearAllFilters}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Three Section Summary Counts */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SECTION_CONFIG.map((cfg) => {
            const matchedCount = clientsBySection[cfg.section].length;
            const totalCount = totalSectionCounts[cfg.section];
            return (
              <div
                key={cfg.section}
                onClick={() =>
                  setSelectedSectionChip((prev) =>
                    prev === cfg.section ? 'All' : cfg.section
                  )
                }
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  cfg.summaryCardClass
                } ${selectedSectionChip === cfg.section ? 'ring-2 ring-[#0B1F4B] dark:ring-[#F5A623]' : ''}`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${cfg.dotClass}`} />
                    <span className="text-xs font-extrabold uppercase tracking-wide">
                      {cfg.title}
                    </span>
                  </div>
                  <p className="text-[11px] opacity-80 mt-0.5">{cfg.subtitle}</p>
                </div>
                <span className="text-xl font-black">
                  {hasActiveFilters ? `${matchedCount} of ${totalCount}` : totalCount}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 30-Day Trash Drawer (Admin Only) */}
      {isAdmin && showTrash && (
        <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-rose-900 dark:text-rose-200 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Deleted Companies Trash (Retained for 30 Days)</span>
              </h3>
              <p className="text-[11px] text-rose-700 dark:text-rose-300">
                Admin can restore any deleted company back to its section within 30 days.
              </p>
            </div>
          </div>

          {trashClients.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">Trash is empty.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {trashClients.map((tc) => (
                <div
                  key={tc.id}
                  className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white truncate">{tc.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {tc.industry} • {tc.city}
                    </p>
                    {tc.deleteReason && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400">
                        Reason: {tc.deleteReason}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-400">
                      Deleted on {formatIndianDate(tc.deletedAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => restoreClient(tc.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restore</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Global Empty State when no company matches search */}
      {filteredClients.length === 0 && debouncedSearch.trim().length > 0 && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3 shadow-xs">
          <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
            No company found for "{debouncedSearch.trim()}"
          </p>
          <p className="text-xs text-slate-500">
            We checked company names, industries, cities, addresses, websites, contacts, and remarks.
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            {canManageClients && (
              <button
                type="button"
                onClick={() => {
                  setClientToEdit(null);
                  setAddClientInitialName(search.trim());
                  setIsFormModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-[#0B1F4B] hover:bg-[#163270] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#F5A623]" />
                <span>Add this company</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleClearAllFilters}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
            >
              Clear Search
            </button>
          </div>
        </div>
      )}

      {/* Three Colour-Coded Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {SECTION_CONFIG.map((cfg) => {
          const sectionClients = clientsBySection[cfg.section];
          const totalInSec = totalSectionCounts[cfg.section];
          const isDropTarget = canManageClients && dragOverSection === cfg.section;

          return (
            <div
              key={cfg.section}
              onDragOver={(e) => {
                if (!canManageClients) return;
                e.preventDefault();
                setDragOverSection(cfg.section);
              }}
              onDragLeave={() => {
                if (!canManageClients) return;
                setDragOverSection(null);
              }}
              onDrop={(e) => {
                if (!canManageClients) return;
                e.preventDefault();
                setDragOverSection(null);
                const cId = draggedClientId || e.dataTransfer.getData('text/plain');
                setDraggedClientId(null);
                if (!cId) return;
                const found = visibleClients.find((c) => c.id === cId);
                if (found && getClientSection(found) !== cfg.section) {
                  openMoveModal(found, cfg.section);
                }
              }}
              className={`rounded-2xl border bg-slate-50/70 dark:bg-slate-900/50 overflow-hidden transition-all ${
                cfg.borderClass
              } ${isDropTarget ? 'ring-2 ring-[#F5A623] scale-[1.005]' : ''}`}
            >
              {/* Coloured Section Header */}
              <div className={`px-4 py-3.5 ${cfg.headerBg} flex items-center justify-between gap-2`}>
                <div>
                  <h3 className="text-sm font-extrabold tracking-wide flex items-center gap-2">
                    <span>{cfg.title}</span>
                  </h3>
                  <p className="text-[11px] text-white/85 mt-0.5">{cfg.subtitle}</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-white/20 text-white font-black text-xs whitespace-nowrap">
                  {hasActiveFilters
                    ? `${cfg.section} ${sectionClients.length} of ${totalInSec}`
                    : `${cfg.section} ${sectionClients.length} of ${totalInSec}`}
                </span>
              </div>

              {/* Cards List inside Section */}
              <div className="p-3.5 space-y-3 min-h-[220px]">
                {sectionClients.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    No companies in {cfg.title}.
                  </div>
                ) : (
                  sectionClients.map((client) => {
                    const mainContact = client.contactPersons?.[0];
                    const keyDateValue =
                      cfg.section === 'Green'
                        ? client.agreementSignedDate || client.createdAt
                        : cfg.section === 'Blue'
                        ? client.lastContactedDate || client.createdAt
                        : client.enquiryDate || client.createdAt;

                    const isOverdue =
                      !!client.nextFollowUpDate && client.nextFollowUpDate < todayStr;

                    const sortedRemarks = [...(client.remarks || [])].sort(
                      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    );
                    const latestRemark = sortedRemarks[0]?.text || '';

                    return (
                      <div
                        key={client.id}
                        draggable={canManageClients}
                        onDragStart={(e) => {
                          if (!canManageClients) return;
                          setDraggedClientId(client.id);
                          e.dataTransfer.setData('text/plain', client.id);
                        }}
                        onDragEnd={() => {
                          setDraggedClientId(null);
                          setDragOverSection(null);
                        }}
                        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs hover:border-[#0B1F4B] dark:hover:border-amber-500 transition-all space-y-3"
                      >
                        {/* Company Name, Industry, City */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4
                              onClick={() => setActiveProfileClient(client)}
                              className="font-extrabold text-sm text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-amber-400 cursor-pointer truncate"
                              title={client.name}
                            >
                              <HighlightMatch text={client.name} query={debouncedSearch} />
                            </h4>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              <HighlightMatch text={client.industry} query={debouncedSearch} />
                            </p>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold flex items-center gap-1 shrink-0">
                            <MapPin className="w-3 h-3 text-[#F5A623]" />
                            <HighlightMatch text={client.city} query={debouncedSearch} />
                          </span>
                        </div>

                        {/* Main Contact Person & Phone */}
                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-xs flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">
                              Main Contact
                            </span>
                            <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                              <HighlightMatch
                                text={mainContact?.name || '-'}
                                query={debouncedSearch}
                              />
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-[#F5A623]" />
                              <HighlightMatch
                                text={mainContact?.phone || '-'}
                                query={debouncedSearch}
                              />
                            </span>
                          </div>
                        </div>

                        {/* Key Date for Section & Next Follow-up Date */}
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="p-2 rounded-lg bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] text-slate-400 font-bold block">
                              {cfg.keyDateLabel}
                            </span>
                            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {formatIndianDate(keyDateValue)}
                            </span>
                          </div>

                          <div
                            className={`p-2 rounded-lg border ${
                              isOverdue
                                ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
                                : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800'
                            }`}
                          >
                            <span className="text-[10px] text-slate-400 font-bold block">
                              Next Follow-up
                            </span>
                            <span
                              className={`font-bold flex items-center gap-1 mt-0.5 ${
                                isOverdue
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : 'text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              <Clock className="w-3 h-3 shrink-0" />
                              {client.nextFollowUpDate
                                ? formatIndianDate(client.nextFollowUpDate)
                                : 'Not set'}
                            </span>
                          </div>
                        </div>

                        {/* Company JD / Hiring Requirements (with Expand & Quick Edit JD) */}
                        <div className="p-2.5 rounded-lg bg-blue-50/50 dark:bg-slate-800/70 border border-blue-200/70 dark:border-slate-700 text-[11px] space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] uppercase font-extrabold text-[#0B1F4B] dark:text-amber-400 flex items-center gap-1">
                              <Briefcase className="w-3 h-3 text-[#F5A623]" />
                              Company JD / Hiring Requirement
                            </span>
                            <div className="flex items-center gap-1.5">
                              {client.agreementDetails && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedJdClientIds((prev) => ({
                                      ...prev,
                                      [client.id]: !prev[client.id],
                                    }))
                                  }
                                  className="text-[10px] font-bold text-blue-600 dark:text-amber-400 hover:underline cursor-pointer"
                                >
                                  {expandedJdClientIds[client.id] ? 'Hide JD' : 'Full JD'}
                                </button>
                              )}
                              {canManageClients && (
                                <button
                                  type="button"
                                  onClick={() => openQuickEditJdModal(client)}
                                  className="px-1.5 py-0.5 rounded bg-[#0B1F4B] hover:bg-[#163270] text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                  title="Edit Company JD"
                                >
                                  <Edit className="w-2.5 h-2.5 text-[#F5A623]" />
                                  <span>Edit JD</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {client.agreementDetails ? (
                            expandedJdClientIds[client.id] ? (
                              <div className="space-y-1 pt-0.5 text-slate-700 dark:text-slate-200">
                                {client.agreementDetails
                                  .split(/\||\n/)
                                  .map((s) => s.trim())
                                  .filter(Boolean)
                                  .map((line, idx) => (
                                    <p key={idx} className="flex items-start gap-1.5 leading-snug">
                                      <span className="text-[#F5A623] font-bold">•</span>
                                      <span>
                                        <HighlightMatch text={line} query={debouncedSearch} />
                                      </span>
                                    </p>
                                  ))}
                              </div>
                            ) : (
                              <p
                                onClick={() =>
                                  setExpandedJdClientIds((prev) => ({
                                    ...prev,
                                    [client.id]: true,
                                  }))
                                }
                                title={client.agreementDetails}
                                className="text-slate-700 dark:text-slate-300 line-clamp-2 font-medium cursor-pointer"
                              >
                                <HighlightMatch
                                  text={client.agreementDetails}
                                  query={debouncedSearch}
                                />
                              </p>
                            )
                          ) : (
                            <p className="text-slate-400 italic">
                              No JD added yet.{' '}
                              {canManageClients ? 'Click "Edit JD" to add requirements.' : ''}
                            </p>
                          )}
                        </div>

                        {/* Latest Remark (Truncated, full text on hover) */}
                        <div
                          title={latestRemark || 'No remarks logged yet'}
                          className="p-2.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 text-[11px]"
                        >
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-0.5">
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3 text-[#F5A623]" />
                              Latest Remark
                            </span>
                            {sortedRemarks[0] && (
                              <span>{formatIndianDate(sortedRemarks[0].createdAt)}</span>
                            )}
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 truncate font-medium">
                            {latestRemark ? (
                              <HighlightMatch text={latestRemark} query={debouncedSearch} />
                            ) : (
                              'No remarks recorded yet.'
                            )}
                          </p>
                        </div>

                        {/* Card Footer Actions */}
                        <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <button
                            onClick={() => setActiveProfileClient(client)}
                            className="px-2.5 py-1 rounded-lg bg-[#0B1F4B]/10 hover:bg-[#0B1F4B]/20 text-[#0B1F4B] dark:bg-blue-900/40 dark:text-blue-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <span>View Profile</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>

                          <div className="flex items-center gap-1">
                            {canCreateTasks && (
                              <button
                                onClick={() => setReminderClient(client)}
                                className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 cursor-pointer"
                                title="Set Follow-up Reminder"
                              >
                                <Bell className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {canManageClients && (
                              <>
                                <button
                                  onClick={() => {
                                    setRemarkTarget(client);
                                    setQuickRemarkText('');
                                    setQuickRemarkError('');
                                  }}
                                  className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
                                  title="Add Remark"
                                >
                                  <MessageSquarePlus className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => openMoveModal(client)}
                                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                                  title="Move to another section"
                                >
                                  <ArrowRightLeft className="w-3 h-3 text-[#F5A623]" />
                                  <span>Move to</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setClientToEdit(client);
                                    setIsFormModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                  title="Edit Company"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            {isAdmin && (
                              <button
                                onClick={() => openDeleteModal(client)}
                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                                title="Delete Company"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Move Between Sections Dialog (Admin, Manager, HR Executive) */}
      {canManageClients && moveDialog && (
        <Modal
          isOpen={!!moveDialog}
          onClose={() => setMoveDialog(null)}
          title={`Move "${moveDialog.client.name}" to Another Section`}
          subtitle={`Current Section: ${CLIENT_SECTION_LABELS[getClientSection(moveDialog.client)]}`}
          maxWidth="lg"
        >
          <form onSubmit={handleConfirmMove} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Select Target Section *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {SECTION_CONFIG.map((cfg) => {
                  const selected = moveDialog.targetSection === cfg.section;
                  return (
                    <button
                      key={cfg.section}
                      type="button"
                      onClick={() => handleTargetSectionChange(cfg.section)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        selected
                          ? `${cfg.headerBg} border-transparent shadow-sm`
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <span className="font-extrabold block">{cfg.section.toUpperCase()}</span>
                      <span className="text-[11px] opacity-90">{cfg.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Required Date for Target Section */}
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {moveDialog.targetSection === 'Green'
                  ? 'Agreement Signed Date * (Required for Active Clients)'
                  : moveDialog.targetSection === 'Blue'
                  ? 'Last Contacted Date * (Required for In Discussion)'
                  : 'Enquiry Received Date * (Required for New Enquiries)'}
              </label>
              <input
                type="date"
                max={todayStr}
                value={moveDate}
                onChange={(e) => {
                  setMoveDate(e.target.value);
                  setMoveError('');
                }}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            {/* Required Remark */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Remark for Moving Section * (Required, 3–500 chars)
                </label>
                <span className="text-[10px] font-mono text-slate-400">
                  {moveRemark.trim().length}/500
                </span>
              </div>
              <textarea
                rows={3}
                maxLength={500}
                placeholder="Explain the status update (e.g. Agreement signed today with HR Director, or Initial call completed)..."
                value={moveRemark}
                onChange={(e) => {
                  setMoveRemark(e.target.value);
                  setMoveError('');
                }}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            {moveError && (
              <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{moveError}</span>
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setMoveDialog(null)}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isMoving}
                className="px-5 py-2 rounded-lg bg-[#0B1F4B] hover:bg-[#163270] text-white font-bold shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isMoving ? 'Moving...' : `Confirm Move to ${CLIENT_SECTION_LABELS[moveDialog.targetSection]}`}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Company Dialog with Required Reason (Admin Only) */}
      {isAdmin && deleteTarget && (
        <Modal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title={`Move "${deleteTarget.name}" to Trash`}
          subtitle="Company will be held in Trash for 30 days and can be restored by Admin"
          maxWidth="md"
        >
          <form onSubmit={handleConfirmDelete} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200">
              Please provide a mandatory reason for deleting this company. This reason will be permanently logged in the company's Remarks timeline.
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Reason for Deletion * (3–500 characters)
                </label>
                <span className="text-[10px] font-mono text-slate-400">
                  {deleteReason.trim().length}/500
                </span>
              </div>
              <textarea
                rows={3}
                maxLength={500}
                placeholder="Enter reason for moving this company to Trash..."
                value={deleteReason}
                onChange={(e) => {
                  setDeleteReason(e.target.value);
                  setDeleteError('');
                }}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              {deleteError && (
                <p className="text-[11px] text-rose-600 font-semibold mt-1">{deleteError}</p>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isDeleting}
                className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Moving to Trash...' : 'Move to Trash (30 Days)'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Quick Add Remark Modal (Admin, Manager, HR Executive) */}
      {canManageClients && remarkTarget && (
        <Modal
          isOpen={!!remarkTarget}
          onClose={() => setRemarkTarget(null)}
          title={`Add Remark — ${remarkTarget.name}`}
          subtitle={`Section: ${CLIENT_SECTION_LABELS[getClientSection(remarkTarget)]}`}
          maxWidth="md"
        >
          <form onSubmit={handleSaveQuickRemark} className="space-y-4 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Remark Text * (3–500 characters, permanent)
                </label>
                <span className="text-[10px] font-mono text-slate-400">
                  {quickRemarkText.trim().length}/500
                </span>
              </div>
              <textarea
                rows={3}
                maxLength={500}
                placeholder="Log call notes, client feedback, or meeting outcome..."
                value={quickRemarkText}
                onChange={(e) => {
                  setQuickRemarkText(e.target.value);
                  setQuickRemarkError('');
                }}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              {quickRemarkError && (
                <p className="text-[11px] text-rose-600 font-semibold mt-1">{quickRemarkError}</p>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setRemarkTarget(null)}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingQuickRemark}
                className="px-5 py-2 rounded-lg bg-[#0B1F4B] hover:bg-[#163270] text-white font-bold shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSavingQuickRemark ? 'Saving...' : 'Save Remark'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Quick Edit Company JD Modal (Admin, Manager, HR Executive) */}
      {canManageClients && jdEditTarget && (
        <Modal
          isOpen={!!jdEditTarget}
          onClose={() => setJdEditTarget(null)}
          title={`Edit Company JD — ${jdEditTarget.name}`}
          subtitle="Update Job Description, Role, Eligibility, Salary, Shift & Hiring Requirements"
          maxWidth="lg"
        >
          <form onSubmit={handleSaveQuickJd} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Company JD & Hiring Requirement Details *
              </label>
              <textarea
                rows={6}
                placeholder="Enter Job Role, Process, Eligibility & Skills, Salary & Benefits, Working Hours, Office Address..."
                value={jdEditText}
                onChange={(e) => {
                  setJdEditText(e.target.value);
                  setJdEditError('');
                }}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Tip: Separate key points with "|" or new lines for clean bullet points on the card and profile.
              </span>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Reason for Editing JD * (Minimum 10 characters — logged in Edit History)
              </label>
              <input
                type="text"
                placeholder="e.g. Updated salary range and shift timing in company JD"
                value={jdEditReason}
                onChange={(e) => {
                  setJdEditReason(e.target.value);
                  setJdEditError('');
                }}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
              />
            </div>

            {jdEditError && (
              <p className="text-[11px] text-rose-600 font-semibold">{jdEditError}</p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setJdEditTarget(null)}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-[#0B1F4B] hover:bg-[#163270] text-white font-bold shadow-sm cursor-pointer"
              >
                Save JD Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Client Profile Modal */}
      <ClientProfileModal
        isOpen={!!activeProfileClient}
        onClose={() => setActiveProfileClient(null)}
        client={activeProfileClient}
        onEdit={(cl) => {
          setActiveProfileClient(null);
          setClientToEdit(cl);
          setIsFormModalOpen(true);
        }}
        onRequestMove={(cl, targetSec) => {
          openMoveModal(cl, targetSec);
        }}
        onRequestDelete={(cl) => {
          openDeleteModal(cl);
        }}
        onOpenCreateJobForClient={(cl) => {
          setActiveProfileClient(null);
          onOpenCreateJobForClient(cl);
        }}
      />

      {/* Client Form Modal (Admin, Manager, HR Executive) */}
      <ClientFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setClientToEdit(null);
          setAddClientInitialName('');
        }}
        clientToEdit={clientToEdit}
        initialName={addClientInitialName}
        onOpenExistingClient={(cl) => {
          setIsFormModalOpen(false);
          setClientToEdit(null);
          setAddClientInitialName('');
          setActiveProfileClient(cl);
        }}
      />

      {/* Excel/CSV Ingestion Wizard Modal (Admin, Manager, HR Executive) */}
      {canManageClients && (
        <ExcelCsvImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          entityType="clients"
        />
      )}

      {/* Analyst-Grade Excel Export Modal */}
      <ExcelExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        moduleName="Clients"
        tableName="tblClients"
        sheetName="Clients"
        columns={CLIENT_EXPORT_COLUMNS}
        filteredData={filteredClients}
        allAccessibleData={visibleClients}
        filtersDescription={`City: ${selectedCity}, Industry: ${selectedIndustry}, Search: "${search || 'All'}"`}
        summaryGenerator={generateClientsSummarySheet}
      />

      {/* Set Reminder Modal for Client */}
      <SetReminderModal
        isOpen={!!reminderClient}
        onClose={() => setReminderClient(null)}
        relatedType="client"
        relatedId={reminderClient?.id}
        relatedName={reminderClient?.name}
        defaultTitle={
          reminderClient
            ? `Follow up with ${reminderClient.name} regarding hiring requirements`
            : undefined
        }
      />
    </div>
  );
};
