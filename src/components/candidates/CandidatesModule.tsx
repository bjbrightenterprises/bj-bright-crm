import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Filter,
  Download,
  Upload,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Share2,
  FileText,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  CheckCircle,
  Clock,
  Sparkles,
  Bell,
  UserCheck,
  CheckSquare,
  Square,
  Shield,
  Layers,
} from 'lucide-react';
import { Candidate, CandidateStatus } from '../../types/crm';
import { useCRM } from '../../context/CRMContext';
import { Badge } from '../common/Badge';
import { CandidateProfileModal } from './CandidateProfileModal';
import { CandidateFormModal } from './CandidateFormModal';
import { WhatsAppModal } from './WhatsAppModal';
import { StatusRemarkModal } from './StatusRemarkModal';
import { ExcelCsvImportModal } from '../common/ExcelCsvImportModal';
import { ExcelExportModal } from '../common/ExcelExportModal';
import { CANDIDATE_EXPORT_COLUMNS, generateCandidatesSummarySheet } from '../../lib/excelModuleConfigs';
import { SetReminderModal } from '../reminders/SetReminderModal';

interface CandidatesModuleProps {
  onScheduleInterviewForCandidate: (candidate: Candidate) => void;
}

export const CandidatesModule: React.FC<CandidatesModuleProps> = ({
  onScheduleInterviewForCandidate,
}) => {
  const {
    visibleCandidates,
    deleteCandidate,
    updateCandidate,
    addCandidateNote,
    bulkUpdateCandidateStatus,
    bulkAssignRecruiter,
    bulkDeleteCandidates,
    users,
    currentUser,
    companySettings,
    canCreateTasks,
  } = useCRM();


  // Filters
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedSource, setSelectedSource] = useState<string>('All');
  const [selectedCity, setSelectedCity] = useState<string>('All');
  const [selectedSkill, setSelectedSkill] = useState<string>('All');
  const [maxExpectedSalary, setMaxExpectedSalary] = useState<number>(50);
  const [minExp, setMinExp] = useState<number>(0);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Multi-select / Bulk actions state
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [bulkStatusToApply, setBulkStatusToApply] = useState<CandidateStatus | ''>('');
  const [bulkRecruiterToApply, setBulkRecruiterToApply] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals state
  const [activeProfileCandidate, setActiveProfileCandidate] = useState<Candidate | null>(null);
  const [candidateToEdit, setCandidateToEdit] = useState<Candidate | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [reminderCandidate, setReminderCandidate] = useState<Candidate | null>(null);
  const [whatsAppCandidate, setWhatsAppCandidate] = useState<Candidate | null>(null);
  const [statusChangeTarget, setStatusChangeTarget] = useState<{ candidate: Candidate; newStatus: CandidateStatus } | null>(null);
  const [bulkStatusTarget, setBulkStatusTarget] = useState<CandidateStatus | null>(null);

  // Status options
  const statusTabs: (CandidateStatus | 'All')[] = [
    'All',
    'New',
    'Screened',
    'Shortlisted',
    'Interview Scheduled',
    'Selected',
    'Offered',
    'Joined',
    'Rejected',
    'On Hold',
  ];

  // Unique cities in data
  const uniqueCities = useMemo(() => {
    const set = new Set<string>();
    visibleCandidates.forEach((c) => set.add(c.city.split(' ')[0]));
    return Array.from(set);
  }, [visibleCandidates]);

  // Filtered Candidates
  const filteredCandidates = useMemo(() => {
    return visibleCandidates.filter((cand) => {
      // Search
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        cand.fullName.toLowerCase().includes(q) ||
        cand.phone.includes(q) ||
        cand.email.toLowerCase().includes(q) ||
        cand.currentCompany.toLowerCase().includes(q) ||
        (cand.jobTitle && cand.jobTitle.toLowerCase().includes(q)) ||
        (cand.remarks && cand.remarks.toLowerCase().includes(q)) ||
        cand.skills.some((s) => s.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      // Status
      if (selectedStatus !== 'All' && cand.status !== selectedStatus) return false;

      // Source
      if (selectedSource !== 'All' && cand.source !== selectedSource) return false;

      // City
      if (selectedCity !== 'All' && !cand.city.toLowerCase().includes(selectedCity.toLowerCase()))
        return false;

      // Skill
      if (
        selectedSkill !== 'All' &&
        !cand.skills.some((s) => s.toLowerCase() === selectedSkill.toLowerCase())
      )
        return false;

      // Salary
      if (cand.expectedSalaryLPA > maxExpectedSalary) return false;

      // Experience
      if (cand.experienceYears < minExp) return false;

      return true;
    });
  }, [
    visibleCandidates,
    search,
    selectedStatus,
    selectedSource,
    selectedCity,
    selectedSkill,
    maxExpectedSalary,
    minExp,
  ]);

  // Paginated
  const totalPages = Math.ceil(filteredCandidates.length / pageSize) || 1;
  const paginatedCandidates = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCandidates.slice(start, start + pageSize);
  }, [filteredCandidates, currentPage]);

  // Checkbox Selection logic
  const isAllPaginatedSelected =
    paginatedCandidates.length > 0 &&
    paginatedCandidates.every((c) => selectedCandidateIds.includes(c.id));

  const toggleSelectAll = () => {
    if (isAllPaginatedSelected) {
      const pageIds = new Set(paginatedCandidates.map((c) => c.id));
      setSelectedCandidateIds((prev) => prev.filter((id) => !pageIds.has(id)));
    } else {
      const combined = new Set([...selectedCandidateIds, ...paginatedCandidates.map((c) => c.id)]);
      setSelectedCandidateIds(Array.from(combined));
    }
  };

  const toggleSelectCandidate = (id: string) => {
    setSelectedCandidateIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Status change with remarks handlers
  const handleConfirmSingleStatusRemark = (remark?: string) => {
    if (!statusChangeTarget) return;
    const { candidate, newStatus } = statusChangeTarget;
    const trimmed = remark?.trim();
    const updates: Partial<Candidate> = {
      status: newStatus,
      ...(trimmed
        ? {
            statusRemark: trimmed,
            statusRemarkAt: new Date().toISOString(),
            statusRemarkBy: currentUser.name,
          }
        : {}),
    };
    updateCandidate(
      candidate.id,
      updates,
      `Status changed from ${candidate.status} to ${newStatus}${trimmed ? `: "${trimmed}"` : ''}`
    );
    if (trimmed) {
      addCandidateNote(candidate.id, `Status changed to ${newStatus} — Remark: ${trimmed}`);
    }
    setStatusChangeTarget(null);
  };

  const handleConfirmBulkStatusRemark = (remark?: string) => {
    if (!bulkStatusTarget || selectedCandidateIds.length === 0) return;
    bulkUpdateCandidateStatus(selectedCandidateIds, bulkStatusTarget, remark);
    setBulkStatusTarget(null);
    setBulkStatusToApply('');
  };

  // Bulk operations
  const handleBulkStatusChange = (status: CandidateStatus) => {
    if (!status || selectedCandidateIds.length === 0) return;
    setBulkStatusTarget(status);
  };

  const handleBulkAssign = (recruiterId: string) => {
    if (!recruiterId || selectedCandidateIds.length === 0) return;
    const user = users.find((u) => u.id === recruiterId);
    if (!user) return;
    bulkAssignRecruiter(selectedCandidateIds, user.id, user.name);
    setBulkRecruiterToApply('');
  };

  const handleBulkDelete = () => {
    if (selectedCandidateIds.length === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedCandidateIds.length} selected candidates?`)) {
      bulkDeleteCandidates(selectedCandidateIds);
      setSelectedCandidateIds([]);
    }
  };

  const handleExportCSV = (onlySelected = false) => {
    const listToExport = onlySelected
      ? visibleCandidates.filter((c) => selectedCandidateIds.includes(c.id))
      : filteredCandidates;

    if (listToExport.length === 0) {
      alert('No candidate records to export.');
      return;
    }

    const headers = [
      'Full Name',
      'Phone Number',
      'Email Address',
      'City',
      'Current Organization',
      'Current CTC LPA',
      'Expected CTC LPA',
      'Experience Years',
      'Core Skills',
      'Education',
      'Sourcing Channel',
      'Status',
      'Assigned Recruiter',
    ];

    const rows = listToExport.map((c) => [
      `"${c.fullName}"`,
      `"${c.phone}"`,
      `"${c.email}"`,
      `"${c.city}"`,
      `"${c.currentCompany}"`,
      c.currentSalaryLPA,
      c.expectedSalaryLPA,
      c.experienceYears,
      `"${c.skills.join(', ')}"`,
      `"${c.education || ''}"`,
      `"${c.source}"`,
      `"${c.status}"`,
      `"${c.assignedRecruiterName}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BJ_Bright_${onlySelected ? 'Selected_' : ''}Candidates_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-[#F5A623]" />
            Candidate Master Directory
          </h2>
          <p className="text-xs text-slate-500">
            {filteredCandidates.length} candidate profiles available in active talent pool
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsExcelImportOpen(true)}
            className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <span>Import Excel / CSV</span>
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-white" />
            <span>Export to Excel</span>
          </button>

          <button
            onClick={() => {
              setCandidateToEdit(null);
              setIsFormModalOpen(true);
            }}
            className="px-4 py-2 rounded-lg bg-[#0B1F4B] hover:bg-[#163270] text-white text-xs font-bold shadow-md transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-[#F5A623]" />
            <span>Add Candidate</span>
          </button>
        </div>
      </div>

      {/* Status Tabs Bar */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
        {statusTabs.map((tab) => {
          const isActive = selectedStatus === tab;
          const count =
            tab === 'All'
              ? visibleCandidates.length
              : visibleCandidates.filter((c) => c.status === tab).length;

          return (
            <button
              key={tab}
              onClick={() => {
                setSelectedStatus(tab);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[#0B1F4B] text-white dark:bg-[#F5A623] dark:text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>{tab}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive
                    ? 'bg-white/20 text-white dark:bg-slate-950 dark:text-amber-300'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, position / role, phone, email, skills, company, or remarks..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
                showAdvancedFilters
                  ? 'bg-blue-50 border-blue-300 text-blue-900 dark:bg-blue-950/60 dark:border-blue-700 dark:text-blue-300'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-3.5 h-3.5 text-[#F5A623]" />
              <span>Filters</span>
              {(selectedSource !== 'All' ||
                selectedCity !== 'All' ||
                selectedSkill !== 'All' ||
                maxExpectedSalary < 50 ||
                minExp > 0) && (
                <span className="w-2 h-2 rounded-full bg-[#F5A623]" />
              )}
            </button>

            {(search ||
              selectedStatus !== 'All' ||
              selectedSource !== 'All' ||
              selectedCity !== 'All' ||
              selectedSkill !== 'All' ||
              maxExpectedSalary < 50 ||
              minExp > 0) && (
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedStatus('All');
                  setSelectedSource('All');
                  setSelectedCity('All');
                  setSelectedSkill('All');
                  setMaxExpectedSalary(50);
                  setMinExp(0);
                  setCurrentPage(1);
                }}
                className="text-xs text-rose-600 hover:underline font-semibold"
              >
                Reset All
              </button>
            )}
          </div>
        </div>

        {/* Advanced Filters Expandable Drawer */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            <div>
              <label className="font-bold text-slate-500 block mb-1">Source</label>
              <select
                value={selectedSource}
                onChange={(e) => {
                  setSelectedSource(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                <option value="All">All Sources</option>
                {companySettings.availableSources.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-500 block mb-1">City</label>
              <select
                value={selectedCity}
                onChange={(e) => {
                  setSelectedCity(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                <option value="All">All Cities</option>
                {uniqueCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-500 block mb-1">Core Skill</label>
              <select
                value={selectedSkill}
                onChange={(e) => {
                  setSelectedSkill(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                <option value="All">All Skills</option>
                {companySettings.availableSkills.map((sk) => (
                  <option key={sk} value={sk}>
                    {sk}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-500 block mb-1">
                Min Exp: {minExp} Years
              </label>
              <input
                type="range"
                min="0"
                max="15"
                step="1"
                value={minExp}
                onChange={(e) => {
                  setMinExp(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="w-full accent-[#0B1F4B] dark:accent-[#F5A623]"
              />
            </div>

            <div>
              <label className="font-bold text-slate-500 block mb-1">
                Max Salary: ₹{maxExpectedSalary} LPA
              </label>
              <input
                type="range"
                min="5"
                max="50"
                step="2"
                value={maxExpectedSalary}
                onChange={(e) => {
                  setMaxExpectedSalary(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="w-full accent-[#0B1F4B] dark:accent-[#F5A623]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Floating Bulk Actions Bar (Phase 2 Requirement) */}
      {selectedCandidateIds.length > 0 && (
        <div className="p-3 rounded-xl bg-[#0B1F4B] text-white flex flex-wrap items-center justify-between gap-3 shadow-xl animate-in fade-in slide-in-from-top duration-200 text-xs">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-lg bg-[#F5A623] text-slate-950 font-bold flex items-center justify-center">
              {selectedCandidateIds.length}
            </span>
            <span className="font-bold">
              {selectedCandidateIds.length} Candidates Selected
            </span>
            <button
              onClick={() => setSelectedCandidateIds([])}
              className="text-amber-300 hover:underline text-[11px]"
            >
              Deselect All
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Bulk Change Status */}
            <div className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-lg">
              <span className="text-[11px] text-slate-300">Change Status:</span>
              <select
                value={bulkStatusToApply}
                onChange={(e) => {
                  const val = e.target.value as CandidateStatus;
                  if (val) handleBulkStatusChange(val);
                }}
                className="bg-slate-900 text-white rounded px-2 py-1 text-xs border border-white/20 focus:outline-none"
              >
                <option value="">Select Status...</option>
                <option value="New">New</option>
                <option value="Screened">Screened</option>
                <option value="Shortlisted">Shortlisted</option>
                <option value="Interview Scheduled">Interview</option>
                <option value="Selected">Selected</option>
                <option value="Offered">Offered</option>
                <option value="Joined">Joined</option>
                <option value="Rejected">Rejected</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>

            {/* Bulk Assign Recruiter */}
            <div className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-lg">
              <span className="text-[11px] text-slate-300">Assign Recruiter:</span>
              <select
                value={bulkRecruiterToApply}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) handleBulkAssign(val);
                }}
                className="bg-slate-900 text-white rounded px-2 py-1 text-xs border border-white/20 focus:outline-none"
              >
                <option value="">Select Recruiter...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Bulk Export Selected */}
            <button
              onClick={() => handleExportCSV(true)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Selected</span>
            </button>

            {/* Bulk Delete */}
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* Candidates Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                <th className="py-3 px-3 w-8">
                  <input
                    type="checkbox"
                    checked={isAllPaginatedSelected}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-[#0B1F4B] focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">Candidate & Exp</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">Current Org & City</th>
                <th className="py-3 px-4">CTC (LPA)</th>
                <th className="py-3 px-4">Skills</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Recruiter</th>
                <th className="py-3 px-4">Remarks</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedCandidates.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    No candidates found matching the selected filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedCandidates.map((cand) => {
                  const isSelected = selectedCandidateIds.includes(cand.id);
                  const cleanPhone = cand.phone.replace(/\D/g, '');
                  const whatsappUrl = `https://wa.me/${cleanPhone}?text=Hi%20${encodeURIComponent(
                    cand.fullName
                  )},%20this%20is%20from%20BJ%20Bright%20Enterprises%20Noida.`;

                  return (
                    <tr
                      key={cand.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                        isSelected ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectCandidate(cand.id)}
                          className="rounded border-slate-300 text-[#0B1F4B] focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* Name & Exp & Position */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#0B1F4B]/10 dark:bg-blue-900/40 text-[#0B1F4B] dark:text-blue-300 font-bold flex items-center justify-center shrink-0">
                            {cand.fullName.charAt(0)}
                          </div>
                          <div>
                            <button
                              onClick={() => setActiveProfileCandidate(cand)}
                              className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-amber-400 text-left block"
                            >
                              {cand.fullName}
                            </button>
                            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                              <span className="text-[11px] text-slate-500">
                                {cand.experienceYears} Years Exp
                              </span>
                              {cand.jobTitle && (
                                <span
                                  className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                                    cand.isCustomPosition
                                      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                                      : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                                  }`}
                                  title={cand.isCustomPosition ? `Custom Role: ${cand.jobTitle}` : `Job Mandate: ${cand.jobTitle}`}
                                >
                                  {cand.jobTitle}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                            <Phone className="w-3 h-3 text-[#F5A623]" />
                            <a href={`tel:${cand.phone}`} className="hover:underline">
                              {cand.phone}
                            </a>
                            <button
                              type="button"
                              onClick={() => setWhatsAppCandidate(cand)}
                              className="p-1 rounded-md text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors ml-0.5 inline-flex items-center justify-center cursor-pointer"
                              title="Message on WhatsApp"
                            >
                              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                <path d="M12.031 2C6.511 2 2.022 6.488 2.022 12.008c0 1.83.498 3.548 1.365 5.029L2 22l5.12-1.341a9.98 9.98 0 0 0 4.911 1.357h.004c5.518 0 10.007-4.488 10.007-10.008 0-2.673-1.041-5.186-2.932-7.077A9.954 9.954 0 0 0 12.031 2zm0 18.23h-.003a8.214 8.214 0 0 1-4.187-1.15l-.3-.178-3.111.816.83-3.033-.196-.312a8.21 8.21 0 0 1-1.258-4.365c0-4.542 3.696-8.238 8.238-8.238 2.2 0 4.269.858 5.825 2.414a8.203 8.203 0 0 1 2.41 5.824c0 4.543-3.696 8.242-8.248 8.242zm4.518-6.166c-.248-.124-1.467-.724-1.694-.807-.228-.083-.394-.124-.56.124-.166.248-.642.807-.787.973-.145.166-.29.186-.538.062-.248-.124-1.047-.386-1.995-1.231-.738-.658-1.236-1.472-1.381-1.72-.145-.248-.016-.382.108-.506.112-.112.248-.29.373-.435.124-.145.166-.248.248-.414.083-.166.042-.311-.021-.435-.062-.124-.56-1.35-.767-1.85-.202-.486-.407-.42-.56-.428l-.477-.008c-.166 0-.435.062-.663.311-.228.248-.871.851-.871 2.074 0 1.223.891 2.404 1.016 2.57.124.166 1.753 2.678 4.248 3.755.594.256 1.058.409 1.42.524.597.19 1.14.163 1.569.099.479-.071 1.467-.6 1.674-1.18.207-.58.207-1.077.145-1.18-.062-.104-.228-.166-.476-.29z"/>
                              </svg>
                            </button>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <a href={`mailto:${cand.email}`} className="truncate max-w-[140px] hover:underline">
                              {cand.email}
                            </a>
                          </div>
                        </div>
                      </td>

                      {/* Current Org & City */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {cand.currentCompany}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{cand.city}</span>
                        </div>
                      </td>

                      {/* CTC (LPA) */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          ₹{cand.expectedSalaryLPA} LPA
                        </div>
                        <div className="text-[10px] text-slate-400">Cur: ₹{cand.currentSalaryLPA} LPA</div>
                      </td>

                      {/* Skills Tags */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {cand.skills.slice(0, 2).map((s) => (
                            <span
                              key={s}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                            >
                              {s}
                            </span>
                          ))}
                          {cand.skills.length > 2 && (
                            <span className="text-[10px] text-slate-400 self-center">
                              +{cand.skills.length - 2}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Source */}
                      <td className="py-3 px-4">
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {cand.source}
                        </span>
                      </td>

                      {/* Status Selector */}
                      <td className="py-3 px-4">
                        <select
                          value={cand.status}
                          onChange={(e) => {
                            const next = e.target.value as CandidateStatus;
                            if (next !== cand.status) {
                              setStatusChangeTarget({ candidate: cand, newStatus: next });
                            }
                          }}
                          className={`text-[11px] font-bold rounded-md px-2 py-1 border transition-colors cursor-pointer ${
                            cand.status === 'Joined'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : cand.status === 'Offered'
                              ? 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300'
                              : cand.status === 'Rejected'
                              ? 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300'
                              : 'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300'
                          }`}
                        >
                          <option value="New">New</option>
                          <option value="Screened">Screened</option>
                          <option value="Shortlisted">Shortlisted</option>
                          <option value="Interview Scheduled">Interview</option>
                          <option value="Selected">Selected</option>
                          <option value="Offered">Offered</option>
                          <option value="Joined">Joined</option>
                          <option value="Rejected">Rejected</option>
                          <option value="On Hold">On Hold</option>
                        </select>
                      </td>

                      {/* Assigned Recruiter */}
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-700 dark:text-slate-300 text-[11px]">
                          {cand.assignedRecruiterName.split(' ')[0]}
                        </span>
                      </td>

                      {/* Remarks (Status Remark takes priority with author/date; falls back to general remarks) */}
                      <td className="py-3 px-4 max-w-[200px]">
                        {cand.statusRemark ? (
                          <div
                            className="cursor-help"
                            title={`Status Remark: "${cand.statusRemark}"${cand.statusRemarkBy ? ` (by ${cand.statusRemarkBy}${cand.statusRemarkAt ? `, ${new Date(cand.statusRemarkAt).toLocaleDateString('en-IN')}` : ''})` : ''}`}
                          >
                            <div className="truncate text-slate-800 dark:text-slate-200 text-[11px] font-semibold">
                              {cand.statusRemark}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              by {cand.statusRemarkBy || 'Recruiter'}
                              {cand.statusRemarkAt ? ` • ${new Date(cand.statusRemarkAt).toLocaleDateString('en-IN')}` : ''}
                            </div>
                          </div>
                        ) : cand.remarks ? (
                          <div
                            className="truncate text-slate-700 dark:text-slate-300 text-[11px] font-medium cursor-help"
                            title={`Remarks: "${cand.remarks}"`}
                          >
                            {cand.remarks}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Message on WhatsApp Button */}
                          <button
                            type="button"
                            onClick={() => setWhatsAppCandidate(cand)}
                            className="p-1 rounded text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                            title="Message on WhatsApp"
                          >
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                              <path d="M12.031 2C6.511 2 2.022 6.488 2.022 12.008c0 1.83.498 3.548 1.365 5.029L2 22l5.12-1.341a9.98 9.98 0 0 0 4.911 1.357h.004c5.518 0 10.007-4.488 10.007-10.008 0-2.673-1.041-5.186-2.932-7.077A9.954 9.954 0 0 0 12.031 2zm0 18.23h-.003a8.214 8.214 0 0 1-4.187-1.15l-.3-.178-3.111.816.83-3.033-.196-.312a8.21 8.21 0 0 1-1.258-4.365c0-4.542 3.696-8.238 8.238-8.238 2.2 0 4.269.858 5.825 2.414a8.203 8.203 0 0 1 2.41 5.824c0 4.543-3.696 8.242-8.248 8.242zm4.518-6.166c-.248-.124-1.467-.724-1.694-.807-.228-.083-.394-.124-.56.124-.166.248-.642.807-.787.973-.145.166-.29.186-.538.062-.248-.124-1.047-.386-1.995-1.231-.738-.658-1.236-1.472-1.381-1.72-.145-.248-.016-.382.108-.506.112-.112.248-.29.373-.435.124-.145.166-.248.248-.414.083-.166.042-.311-.021-.435-.062-.124-.56-1.35-.767-1.85-.202-.486-.407-.42-.56-.428l-.477-.008c-.166 0-.435.062-.663.311-.228.248-.871.851-.871 2.074 0 1.223.891 2.404 1.016 2.57.124.166 1.753 2.678 4.248 3.755.594.256 1.058.409 1.42.524.597.19 1.14.163 1.569.099.479-.071 1.467-.6 1.674-1.18.207-.58.207-1.077.145-1.18-.062-.104-.228-.166-.476-.29z"/>
                            </svg>
                          </button>

                          {/* Set Reminder Button (Admin & HR Executive only) */}
                          {canCreateTasks && (
                            <button
                              onClick={() => setReminderCandidate(cand)}
                              className="p-1 rounded text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                              title="Set Follow-up Reminder"
                            >
                              <Bell className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => setActiveProfileCandidate(cand)}
                            className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="View Full Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>


                          <button
                            onClick={() => {
                              if (confirm(`Delete candidate ${cand.fullName}?`)) {
                                deleteCandidate(cand.id);
                              }
                            }}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredCandidates.length)} of{' '}
            {filteredCandidates.length} candidate entries
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-semibold text-slate-800 dark:text-slate-200">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Candidate Profile Modal */}
      <CandidateProfileModal
        isOpen={!!activeProfileCandidate}
        onClose={() => setActiveProfileCandidate(null)}
        candidate={activeProfileCandidate}
        onEdit={(cand) => {
          setActiveProfileCandidate(null);
          setCandidateToEdit(cand);
          setIsFormModalOpen(true);
        }}
        onScheduleInterview={(cand) => {
          setActiveProfileCandidate(null);
          onScheduleInterviewForCandidate(cand);
        }}
      />

      {/* Add / Edit Candidate Modal */}
      <CandidateFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setCandidateToEdit(null);
        }}
        candidateToEdit={candidateToEdit}
      />

      {/* Excel/CSV Ingestion Wizard Modal */}
      <ExcelCsvImportModal
        isOpen={isExcelImportOpen}
        onClose={() => setIsExcelImportOpen(false)}
        entityType="candidates"
      />

      {/* Analyst-Grade Excel Export Modal */}
      <ExcelExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        moduleName="Candidates"
        tableName="tblCandidates"
        sheetName="Candidates"
        columns={CANDIDATE_EXPORT_COLUMNS}
        filteredData={filteredCandidates}
        allAccessibleData={visibleCandidates}
        filtersDescription={`Status: ${selectedStatus}, Search: "${search || 'All'}"`}
        summaryGenerator={generateCandidatesSummarySheet}

      />

      {/* Set Reminder Modal for Candidate */}
      <SetReminderModal
        isOpen={!!reminderCandidate}
        onClose={() => setReminderCandidate(null)}
        relatedType="candidate"
        relatedId={reminderCandidate?.id}
        relatedName={reminderCandidate?.fullName}
        defaultTitle={reminderCandidate ? `Follow up with ${reminderCandidate.fullName} regarding ${reminderCandidate.currentCompany || 'recruitment'}` : undefined}
      />

      {/* WhatsApp Messaging Modal */}
      <WhatsAppModal
        isOpen={!!whatsAppCandidate}
        onClose={() => setWhatsAppCandidate(null)}
        candidate={whatsAppCandidate}
      />

      {/* Single Candidate Status Change Remark Modal */}
      <StatusRemarkModal
        isOpen={!!statusChangeTarget}
        onClose={() => setStatusChangeTarget(null)}
        onConfirm={handleConfirmSingleStatusRemark}
        candidateName={statusChangeTarget?.candidate.fullName || ''}
        oldStatus={statusChangeTarget?.candidate.status || ''}
        newStatus={statusChangeTarget?.newStatus || ''}
      />

      {/* Bulk Candidate Status Change Remark Modal */}
      <StatusRemarkModal
        isOpen={!!bulkStatusTarget}
        onClose={() => {
          setBulkStatusTarget(null);
          setBulkStatusToApply('');
        }}
        onConfirm={handleConfirmBulkStatusRemark}
        candidateName={`${selectedCandidateIds.length} Selected Candidates`}
        oldStatus="Selected Candidates"
        newStatus={bulkStatusTarget || ''}
        count={selectedCandidateIds.length}
      />
    </div>
  );
};
