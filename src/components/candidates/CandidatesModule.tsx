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
  Share2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  Bell,
} from 'lucide-react';
import { Candidate, CandidateStatus } from '../../types/crm';
import { useCRM } from '../../context/CRMContext';
import { CandidateProfileModal } from './CandidateProfileModal';
import { CandidateFormModal } from './CandidateFormModal';
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
    bulkUpdateCandidateStatus,
    bulkAssignRecruiter,
    bulkDeleteCandidates,
    users,
    companySettings,
    canCreateTasks,
    openStatusRemarkModal,
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

  // Status options
  const statusTabs: (CandidateStatus | 'All')[] = [
    'All',
    'New',
    'Screened',
    'Shortlisted',
    'Interview Scheduled',
    'Selected',
    'Offered',
    'Placed',
    'Rejected',
    'On Hold',
  ];

  // Unique cities in data
  const uniqueCities = useMemo(() => {
    const set = new Set<string>();
    visibleCandidates.forEach((c) => {
      if (c.city) set.add(c.city.split(' ')[0]);
    });
    return Array.from(set);
  }, [visibleCandidates]);

  const activeFilterCount =
    (selectedSource !== 'All' ? 1 : 0) +
    (selectedCity !== 'All' ? 1 : 0) +
    (selectedSkill !== 'All' ? 1 : 0) +
    (maxExpectedSalary < 50 ? 1 : 0) +
    (minExp > 0 ? 1 : 0);

  // Filtered Candidates
  const filteredCandidates = useMemo(() => {
    return visibleCandidates.filter((cand) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        cand.fullName.toLowerCase().includes(q) ||
        cand.phone.includes(q) ||
        cand.email.toLowerCase().includes(q) ||
        cand.currentCompany.toLowerCase().includes(q) ||
        cand.skills.some((s) => s.toLowerCase().includes(q)) ||
        (cand.remarks && cand.remarks.some((r) => r.text.toLowerCase().includes(q)));

      if (!matchesSearch) return false;
      if (selectedStatus !== 'All' && cand.status !== selectedStatus) return false;
      if (selectedSource !== 'All' && cand.source !== selectedSource) return false;
      if (selectedCity !== 'All' && !cand.city.toLowerCase().includes(selectedCity.toLowerCase()))
        return false;
      if (
        selectedSkill !== 'All' &&
        !cand.skills.some((s) => s.toLowerCase() === selectedSkill.toLowerCase())
      )
        return false;
      if (cand.expectedSalaryLPA > maxExpectedSalary) return false;
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

  // Bulk operations
  const handleBulkStatusChange = (status: CandidateStatus) => {
    if (!status || selectedCandidateIds.length === 0) return;
    bulkUpdateCandidateStatus(selectedCandidateIds, status);
    setBulkStatusToApply('');
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

    if (listToExport.length === 0) return;

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

  const getStatusSelectStyle = (status: CandidateStatus) => {
    if (status === 'Placed') return 'bg-emerald-100 text-emerald-900 border-emerald-300';
    if (status === 'Offered' || status === 'Selected') return 'bg-amber-100 text-amber-900 border-amber-300';
    if (status === 'Rejected') return 'bg-rose-100 text-rose-900 border-rose-300';
    return 'bg-blue-50 text-[#0B1F4B] border-blue-200';
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#F5A623] shrink-0" />
            <span>Candidate Master Directory</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            {filteredCandidates.length} candidate profiles available in active talent pool
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsExcelImportOpen(true)}
            className="min-h-[42px] px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-[#0B1F4B]" />
            <span>Import Excel</span>
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="min-h-[42px] px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-white" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={() => {
              setCandidateToEdit(null);
              setIsFormModalOpen(true);
            }}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-[#0B1F4B] hover:bg-[#163270] text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#F5A623]" />
            <span>Add Candidate</span>
          </button>
        </div>
      </div>

      {/* Status Tabs Bar (Horizontal Scrollable) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 border-b border-slate-200">
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
              className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-[#0B1F4B] text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>{tab}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                  isActive
                    ? 'bg-[#F5A623] text-slate-950'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              inputMode="search"
              placeholder="Search by candidate name, phone (+91), email, skills, or company..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full min-h-[44px] pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                showAdvancedFilters || activeFilterCount > 0
                  ? 'bg-blue-50 border-[#0B1F4B] text-[#0B1F4B]'
                  : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-4 h-4 text-[#F5A623]" />
              <span>Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}</span>
            </button>

            {(search || selectedStatus !== 'All' || activeFilterCount > 0) && (
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
                className="min-h-[44px] px-3 text-xs text-rose-700 hover:underline font-bold cursor-pointer"
              >
                Reset All
              </button>
            )}
          </div>
        </div>

        {/* Advanced Filters Expandable Drawer */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Source</label>
              <select
                value={selectedSource}
                onChange={(e) => {
                  setSelectedSource(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full min-h-[42px] px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900"
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
              <label className="font-bold text-slate-700 block mb-1">City</label>
              <select
                value={selectedCity}
                onChange={(e) => {
                  setSelectedCity(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full min-h-[42px] px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900"
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
              <label className="font-bold text-slate-700 block mb-1">Core Skill</label>
              <select
                value={selectedSkill}
                onChange={(e) => {
                  setSelectedSkill(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full min-h-[42px] px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900"
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
              <label className="font-bold text-slate-700 block mb-1">
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
                className="w-full accent-[#0B1F4B] mt-2"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
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
                className="w-full accent-[#0B1F4B] mt-2"
              />
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bulk Actions Bar */}
      {selectedCandidateIds.length > 0 && (
        <div className="sticky top-16 z-20 p-3 rounded-xl bg-[#0B1F4B] text-white flex flex-wrap items-center justify-between gap-3 shadow-lg text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-[#F5A623] text-slate-950 font-extrabold flex items-center justify-center">
              {selectedCandidateIds.length}
            </span>
            <span className="font-bold">
              {selectedCandidateIds.length} Selected
            </span>
            <button
              onClick={() => setSelectedCandidateIds([])}
              className="text-amber-300 hover:underline text-xs font-semibold cursor-pointer ml-1"
            >
              Clear
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1.5 rounded-lg">
              <span className="text-[11px] text-slate-200 font-semibold">Status:</span>
              <select
                value={bulkStatusToApply}
                onChange={(e) => {
                  const val = e.target.value as CandidateStatus;
                  if (val) handleBulkStatusChange(val);
                }}
                className="bg-white text-slate-900 rounded px-2 py-1 text-xs font-semibold border border-slate-300 focus:outline-none"
              >
                <option value="">Select...</option>
                <option value="New">New</option>
                <option value="Screened">Screened</option>
                <option value="Shortlisted">Shortlisted</option>
                <option value="Interview Scheduled">Interview</option>
                <option value="Selected">Selected</option>
                <option value="Offered">Offered</option>
                <option value="Placed">Placed</option>
                <option value="Rejected">Rejected</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1.5 rounded-lg">
              <span className="text-[11px] text-slate-200 font-semibold">Assign:</span>
              <select
                value={bulkRecruiterToApply}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) handleBulkAssign(val);
                }}
                className="bg-white text-slate-900 rounded px-2 py-1 text-xs font-semibold border border-slate-300 focus:outline-none"
              >
                <option value="">Recruiter...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => handleExportCSV(true)}
              className="min-h-[36px] px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            <button
              onClick={handleBulkDelete}
              className="min-h-[36px] px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* MOBILE VIEW (<768px): Stacked Candidate Cards */}
      <div className="md:hidden space-y-3">
        {paginatedCandidates.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-slate-500 text-xs border border-slate-200">
            No candidates found matching the selected filter criteria.
          </div>
        ) : (
          paginatedCandidates.map((cand) => {
            const isSelected = selectedCandidateIds.includes(cand.id);
            const cleanPhone = cand.phone.replace(/\D/g, '');
            const whatsappUrl = `https://wa.me/${cleanPhone}?text=Hi%20${encodeURIComponent(
              cand.fullName
            )},%20this%20is%20from%20BJ%20Bright%20Enterprises%20Noida.`;

            return (
              <div
                key={cand.id}
                className={`bg-white rounded-xl border p-4 shadow-2xs space-y-3 transition-colors ${
                  isSelected ? 'border-[#0B1F4B] bg-blue-50/20' : 'border-slate-200'
                }`}
              >
                {/* Top row: Checkbox, Name, Status Dropdown */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectCandidate(cand.id)}
                      className="mt-1 w-4 h-4 rounded border-slate-300 text-[#0B1F4B] accent-[#0B1F4B]"
                    />
                    <div className="min-w-0">
                      <button
                        onClick={() => setActiveProfileCandidate(cand)}
                        className="font-extrabold text-sm text-slate-900 hover:text-[#0B1F4B] text-left truncate block"
                      >
                        {cand.fullName}
                      </button>
                      <p className="text-xs text-slate-600 truncate">
                        {cand.currentCompany} • {cand.experienceYears} Yrs
                      </p>
                    </div>
                  </div>

                  <select
                    value={cand.status}
                    onChange={(e) => openStatusRemarkModal(cand, e.target.value as CandidateStatus)}
                    className={`min-h-[34px] text-xs font-bold rounded-lg px-2 py-1 border shrink-0 ${getStatusSelectStyle(
                      cand.status
                    )}`}
                  >
                    <option value="New">New</option>
                    <option value="Screened">Screened</option>
                    <option value="Shortlisted">Shortlisted</option>
                    <option value="Interview Scheduled">Interview</option>
                    <option value="Selected">Selected</option>
                    <option value="Offered">Offered</option>
                    <option value="Placed">Placed</option>
                    <option value="Rejected">Rejected</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>

                {/* Middle Info Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Expected / Cur CTC</span>
                    <span className="font-bold text-slate-900">
                      ₹{cand.expectedSalaryLPA}L <span className="text-slate-500 font-normal">(₹{cand.currentSalaryLPA}L)</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">City & Source</span>
                    <span className="font-semibold text-slate-800 truncate block">
                      {cand.city} • {cand.source}
                    </span>
                  </div>
                </div>

                {/* Skills & Latest Remark */}
                {cand.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {cand.skills.slice(0, 4).map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 rounded-md text-[11px] bg-slate-100 text-slate-800 font-medium border border-slate-200"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                {cand.remarks && cand.remarks.length > 0 && (
                  <p className="text-xs text-slate-700 bg-amber-50/70 border border-amber-200 rounded-lg px-2.5 py-1.5 line-clamp-2">
                    <span className="font-bold text-slate-900">Remark: </span>
                    {cand.remarks[0].text}
                  </p>
                )}

                {/* Bottom Action Bar (44px touch targets) */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`tel:${cand.phone}`}
                      className="min-h-[40px] px-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0B1F4B] border border-blue-200 font-bold text-xs flex items-center gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </a>
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="min-h-[40px] px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs flex items-center gap-1.5"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  </div>

                  <div className="flex items-center gap-1">
                    {canCreateTasks && (
                      <button
                        onClick={() => setReminderCandidate(cand)}
                        className="w-10 h-10 rounded-lg text-amber-700 hover:bg-amber-50 border border-slate-200 flex items-center justify-center"
                        title="Set Reminder"
                      >
                        <Bell className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setActiveProfileCandidate(cand)}
                      className="min-h-[40px] px-3 rounded-lg bg-[#0B1F4B] text-white font-bold text-xs flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#F5A623]" />
                      <span>View</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete candidate ${cand.fullName}?`)) {
                          deleteCandidate(cand.id);
                        }
                      }}
                      className="w-10 h-10 rounded-lg text-rose-600 hover:bg-rose-50 border border-slate-200 flex items-center justify-center"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* TABLET & DESKTOP VIEW (>=768px): Table with Sticky First Column */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase tracking-wider text-[10px] font-extrabold">
                <th className="py-3.5 px-3 w-8">
                  <input
                    type="checkbox"
                    checked={isAllPaginatedSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-[#0B1F4B] accent-[#0B1F4B] cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-4 sticky-col-first">Candidate & Exp</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">Current Org & City</th>
                <th className="py-3.5 px-4">CTC (LPA)</th>
                <th className="py-3.5 px-4">Skills</th>
                <th className="py-3.5 px-4">Source</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Last Remark</th>
                <th className="py-3.5 px-4">Recruiter</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginatedCandidates.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500">
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
                      className={`hover:bg-slate-50 transition-colors ${
                        isSelected ? 'bg-blue-50/40' : 'bg-white'
                      }`}
                    >
                      <td className="py-3 px-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectCandidate(cand.id)}
                          className="w-4 h-4 rounded border-slate-300 text-[#0B1F4B] accent-[#0B1F4B] cursor-pointer"
                        />
                      </td>

                      <td className="py-3 px-4 sticky-col-first">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#0B1F4B] text-white font-bold flex items-center justify-center shrink-0">
                            {cand.fullName.charAt(0)}
                          </div>
                          <div>
                            <button
                              onClick={() => setActiveProfileCandidate(cand)}
                              className="font-bold text-slate-900 hover:text-[#0B1F4B] hover:underline text-left block cursor-pointer"
                            >
                              {cand.fullName}
                            </button>
                            <span className="text-[11px] text-slate-600">
                              {cand.experienceYears} Years Exp
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                            <Phone className="w-3 h-3 text-[#0B1F4B]" />
                            <a href={`tel:${cand.phone}`} className="hover:underline">
                              {cand.phone}
                            </a>
                            <a
                              href={whatsappUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-700 hover:text-emerald-800 ml-0.5"
                              title="Chat on WhatsApp"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </a>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-600">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <a href={`mailto:${cand.email}`} className="truncate max-w-[140px] hover:underline">
                              {cand.email}
                            </a>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {cand.currentCompany}
                        </div>
                        <div className="text-[11px] text-slate-600 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{cand.city}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          ₹{cand.expectedSalaryLPA} LPA
                        </div>
                        <div className="text-[11px] text-slate-600">Cur: ₹{cand.currentSalaryLPA} LPA</div>
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {cand.skills.slice(0, 2).map((s) => (
                            <span
                              key={s}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-800 border border-slate-200 font-semibold"
                            >
                              {s}
                            </span>
                          ))}
                          {cand.skills.length > 2 && (
                            <span className="text-[10px] text-slate-600 font-semibold self-center">
                              +{cand.skills.length - 2}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                          {cand.source}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <select
                          value={cand.status}
                          onChange={(e) => openStatusRemarkModal(cand, e.target.value as CandidateStatus)}
                          className={`text-[11px] font-bold rounded-lg px-2 py-1 border transition-colors cursor-pointer ${getStatusSelectStyle(
                            cand.status
                          )}`}
                        >
                          <option value="New">New</option>
                          <option value="Screened">Screened</option>
                          <option value="Shortlisted">Shortlisted</option>
                          <option value="Interview Scheduled">Interview</option>
                          <option value="Selected">Selected</option>
                          <option value="Offered">Offered</option>
                          <option value="Placed">Placed</option>
                          <option value="Rejected">Rejected</option>
                          <option value="On Hold">On Hold</option>
                        </select>
                      </td>

                      <td className="py-3 px-4 max-w-[180px]" title={cand.remarks && cand.remarks.length > 0 ? cand.remarks[0].text : 'No remarks'}>
                        <span className="text-[11px] text-slate-700 truncate block">
                          {cand.remarks && cand.remarks.length > 0 ? cand.remarks[0].text : <span className="text-slate-400 italic">No remarks</span>}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 text-[11px]">
                          {cand.assignedRecruiterName.split(' ')[0]}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canCreateTasks && (
                            <button
                              onClick={() => setReminderCandidate(cand)}
                              className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-50 cursor-pointer"
                              title="Set Follow-up Reminder"
                            >
                              <Bell className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => setActiveProfileCandidate(cand)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-[#0B1F4B] hover:bg-slate-100 cursor-pointer"
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
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
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
      </div>

      {/* Pagination Footer */}
      <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 shadow-2xs">
        <div>
          Showing {filteredCandidates.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
          {Math.min(currentPage * pageSize, filteredCandidates.length)} of{' '}
          {filteredCandidates.length} candidate entries
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="min-h-[40px] min-w-[40px] p-2 rounded-xl border border-slate-300 bg-white text-slate-800 disabled:opacity-40 hover:bg-slate-50 flex items-center justify-center cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 py-1 font-bold text-slate-900">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="min-h-[40px] min-w-[40px] p-2 rounded-xl border border-slate-300 bg-white text-slate-800 disabled:opacity-40 hover:bg-slate-50 flex items-center justify-center cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
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
        defaultTitle={
          reminderCandidate
            ? `Follow up with ${reminderCandidate.fullName} regarding ${reminderCandidate.currentCompany || 'recruitment'}`
            : undefined
        }
      />
    </div>
  );
};
