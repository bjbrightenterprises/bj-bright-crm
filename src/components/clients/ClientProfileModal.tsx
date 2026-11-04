import React, { useState, useMemo } from 'react';
import { Modal } from '../common/Modal';
import {
  Client,
  ClientSection,
  CompanyHiringRequirement,
  CLIENT_SECTION_LABELS,
  getClientSection,
  formatIndianDate,
} from '../../types/crm';
import { useCRM } from '../../context/CRMContext';
import {
  MapPin,
  Globe,
  Phone,
  Mail,
  Briefcase,
  FileText,
  Clock,
  Edit,
  Trash2,
  Users,
  Bell,
  MessageSquarePlus,
  ArrowRightLeft,
  History,
  ChevronDown,
  ChevronUp,
  Plus,
  CheckCircle2,
  Search,
  Award,
} from 'lucide-react';
import { SetReminderModal } from '../reminders/SetReminderModal';
import {
  CallSummaryBlock,
  getDefaultHiringRequirementsForCompany,
  formatMonthlySalaryParts,
} from '../../lib/companySearch';
import {
  ensureWorkProfileCategories,
  validateCustomWorkProfile,
  findMatchingExistingProfile,
} from '../../lib/workProfiles';

interface ClientProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onEdit: (client: Client) => void;
  onRequestMove: (client: Client, targetSection?: ClientSection) => void;
  onRequestDelete: (client: Client) => void;
  onOpenCreateJobForClient: (client: Client) => void;
}

const SECTION_BADGE_STYLES: Record<ClientSection, string> = {
  Green: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  Blue: 'bg-blue-100 text-blue-900 border-blue-300',
  Red: 'bg-rose-100 text-rose-900 border-rose-300',
};

export function formatISTDateTime(isoStr: string | undefined): string {
  if (!isoStr) return '-';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    return (
      d.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }) + ' IST'
    );
  } catch {
    return isoStr;
  }
}

type CollapsibleSectionKey =
  | 'eligibility'
  | 'benefitsTimings'
  | 'contacts'
  | 'addressMap'
  | 'agreementCommission'
  | 'remarks'
  | 'jobsPlacements'
  | 'editHistory';

const EMPTY_REQ_DRAFT = (defaultLocation: string): CompanyHiringRequirement => ({
  id: `req_${Date.now()}`,
  profile: 'Telecaller (Outbound)',
  profileIsCustom: false,
  location: defaultLocation,
  salaryMin: 15000,
  salaryMax: 18000,
  extras: '',
  openings: 1,
  gender: 'Any',
  ageRange: '18 to 32 years',
  qualification: '12th Pass / Graduate',
  experience: 'Freshers and experienced can apply',
  communication: 'Good communication skills',
  esi: 'As applicable',
  attendanceBonus: '',
  incentives: 'Performance incentives',
  weeklyOff: 'Sunday fixed weekly off',
  workingHours: '9:30 AM to 6:30 PM',
  interviewTiming: '11:00 AM to 4:30 PM',
});

export const ClientProfileModal: React.FC<ClientProfileModalProps> = ({
  isOpen,
  onClose,
  client,
  onEdit,
  onRequestMove,
  onRequestDelete,
  onOpenCreateJobForClient,
}) => {
  const {
    clients,
    jobs,
    candidates,
    currentUser,
    companySettings,
    canCreateTasks,
    addClientRemark,
    updateClient,
    updateJob,
    getEditHistory,
  } = useCRM();

  // Collapsible sections: first two open by default, remaining 6 collapsed
  const [openSections, setOpenSections] = useState<Record<CollapsibleSectionKey, boolean>>({
    eligibility: true,
    benefitsTimings: true,
    contacts: false,
    addressMap: false,
    agreementCommission: false,
    remarks: false,
    jobsPlacements: false,
    editHistory: false,
  });

  const toggleSection = (key: CollapsibleSectionKey) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [showAddRemarkBox, setShowAddRemarkBox] = useState(false);
  const [newRemarkText, setNewRemarkText] = useState('');
  const [remarkError, setRemarkError] = useState('');
  const [isSubmittingRemark, setIsSubmittingRemark] = useState(false);

  // Hiring Requirement Form State (Admin, Manager, HR Executive only)
  const [showReqForm, setShowReqForm] = useState(false);
  const [editingReqId, setEditingReqId] = useState<string | null>(null);
  const [reqDraft, setReqDraft] = useState<CompanyHiringRequirement>(() =>
    EMPTY_REQ_DRAFT('Noida')
  );
  const [profileSearchQuery, setProfileSearchQuery] = useState('');
  const [isProfilePickerOpen, setIsProfilePickerOpen] = useState(false);
  const [selectedProfileOption, setSelectedProfileOption] = useState('Telecaller (Outbound)');
  const [customProfileInput, setCustomProfileInput] = useState('');
  const [reqEditReason, setReqEditReason] = useState('Added / updated hiring requirement on company');
  const [reqError, setReqError] = useState('');

  // Inline Job Opening JD editing state
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [jobTitleDraft, setJobTitleDraft] = useState('');
  const [jobPositionsDraft, setJobPositionsDraft] = useState<number>(1);
  const [jobSalaryMinDraft, setJobSalaryMinDraft] = useState<number>(1.8);
  const [jobSalaryMaxDraft, setJobSalaryMaxDraft] = useState<number>(2.5);
  const [jobMinExpDraft, setJobMinExpDraft] = useState<number>(0);
  const [jobMaxExpDraft, setJobMaxExpDraft] = useState<number>(3);
  const [jobLocationDraft, setJobLocationDraft] = useState('');
  const [jobSkillsDraft, setJobSkillsDraft] = useState('');
  const [jobDescDraft, setJobDescDraft] = useState('');
  const [jobEditReason, setJobEditReason] = useState('');
  const [jobEditError, setJobEditError] = useState('');

  const workProfileCategories = useMemo(
    () => ensureWorkProfileCategories(companySettings.workProfileCategories),
    [companySettings.workProfileCategories]
  );

  const filteredProfileCategories = useMemo(() => {
    const q = profileSearchQuery.trim().toLowerCase();
    return workProfileCategories
      .filter((c) => c.active)
      .map((cat) => ({
        ...cat,
        profiles: cat.profiles.filter(
          (p) =>
            p.active &&
            (!q ||
              p.name.toLowerCase().includes(q) ||
              cat.name.toLowerCase().includes(q) ||
              p.name.toLowerCase() === 'other')
        ),
      }))
      .filter((cat) => cat.profiles.length > 0);
  }, [workProfileCategories, profileSearchQuery]);

  if (!client) return null;

  const liveClient = clients.find((c) => c.id === client.id) || client;
  const isAdmin = currentUser.role === 'admin';
  const canManageClients =
    currentUser.role === 'admin' ||
    currentUser.role === 'manager' ||
    currentUser.role === 'hr_executive';
  const section = getClientSection(liveClient);
  const todayStr = new Date().toISOString().slice(0, 10);
  const isFollowUpOverdue =
    !!liveClient.nextFollowUpDate && liveClient.nextFollowUpDate < todayStr;

  const clientJobs = jobs.filter((j) => j.clientId === liveClient.id && !j.deletedAt);
  const placedCandidates = candidates.filter(
    (c) =>
      !c.deletedAt &&
      (c.clientId === liveClient.id || c.clientName === liveClient.name) &&
      (c.status === 'Placed' || c.status === 'Offered')
  );

  const effectiveRequirements: CompanyHiringRequirement[] =
    Array.isArray(liveClient.hiringRequirements) && liveClient.hiringRequirements.length > 0
      ? liveClient.hiringRequirements
      : getDefaultHiringRequirementsForCompany(liveClient);

  const remarksList = [...(liveClient.remarks || [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const editHistoryList = getEditHistory(liveClient.id);

  const suggestedExistingProfile =
    selectedProfileOption === 'Other' && customProfileInput.trim()
      ? findMatchingExistingProfile(customProfileInput, workProfileCategories)
      : null;

  const handleOpenAddRequirement = () => {
    if (!canManageClients) return;
    const defaultLoc =
      liveClient.address && liveClient.city
        ? `${liveClient.address}, ${liveClient.city}`
        : liveClient.address || liveClient.city || 'Noida';
    const fresh = EMPTY_REQ_DRAFT(defaultLoc);
    setEditingReqId(null);
    setReqDraft(fresh);
    setSelectedProfileOption(fresh.profile);
    setCustomProfileInput('');
    setProfileSearchQuery('');
    setReqEditReason('Added new hiring requirement on company');
    setReqError('');
    setShowReqForm(true);
  };

  const handleOpenEditRequirement = (req: CompanyHiringRequirement) => {
    if (!canManageClients) return;
    setEditingReqId(req.id);
    setReqDraft({ ...req });
    if (req.profileIsCustom) {
      setSelectedProfileOption('Other');
      setCustomProfileInput(req.profile);
    } else {
      setSelectedProfileOption(req.profile);
      setCustomProfileInput('');
    }
    setProfileSearchQuery('');
    setReqEditReason(`Updated hiring requirement (${req.profile})`);
    setReqError('');
    setShowReqForm(true);
  };

  const handleDeleteRequirement = (reqId: string) => {
    if (!canManageClients) return;
    const nextList = effectiveRequirements.filter((r) => r.id !== reqId);
    updateClient(
      liveClient.id,
      { hiringRequirements: nextList },
      'Removed hiring requirement from company profile'
    );
  };

  const handleSaveRequirement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageClients) return;

    let finalProfile = selectedProfileOption;
    let isCustom = false;

    if (selectedProfileOption === 'Other') {
      const existingMatch = findMatchingExistingProfile(
        customProfileInput,
        workProfileCategories
      );
      if (existingMatch) {
        setReqError(
          `Profile "${existingMatch.name}" already exists in master list. Click "Use existing" below.`
        );
        return;
      }
      const validation = validateCustomWorkProfile(customProfileInput);
      if (!validation.valid) {
        setReqError(validation.error || 'Invalid custom work profile.');
        return;
      }
      finalProfile = validation.formatted;
      isCustom = true;
    } else if (!finalProfile.trim()) {
      setReqError('Work Profile is required.');
      return;
    }

    if (!reqDraft.location.trim()) {
      setReqError('Location is required.');
      return;
    }

    const sMin = Number(reqDraft.salaryMin);
    const sMax = Number(reqDraft.salaryMax);
    if (isNaN(sMin) || isNaN(sMax) || sMin < 0 || sMax < 0) {
      setReqError('Salary Min and Salary Max must be valid numbers in Rs per month.');
      return;
    }
    if (sMin > sMax) {
      setReqError('Minimum salary cannot be greater than maximum salary.');
      return;
    }

    if (reqEditReason.trim().length < 5) {
      setReqError('Please enter a brief reason for saving this hiring requirement.');
      return;
    }

    const normalizedReq: CompanyHiringRequirement = {
      ...reqDraft,
      id: editingReqId || `req_${Date.now()}`,
      profile: finalProfile,
      profileIsCustom: isCustom,
      location: reqDraft.location.trim(),
      salaryMin: Math.round(sMin),
      salaryMax: Math.round(sMax),
      extras: (reqDraft.extras || '').trim(),
      openings: Math.max(1, Number(reqDraft.openings) || 1),
      gender: (reqDraft.gender || '').trim(),
      ageRange: (reqDraft.ageRange || '').trim(),
      qualification: (reqDraft.qualification || '').trim(),
      experience: (reqDraft.experience || '').trim(),
      communication: (reqDraft.communication || '').trim(),
      esi: (reqDraft.esi || '').trim(),
      attendanceBonus: (reqDraft.attendanceBonus || '').trim(),
      incentives: (reqDraft.incentives || '').trim(),
      weeklyOff: (reqDraft.weeklyOff || '').trim(),
      workingHours: (reqDraft.workingHours || '').trim(),
      interviewTiming: (reqDraft.interviewTiming || '').trim(),
    };

    const nextList = editingReqId
      ? effectiveRequirements.map((r) => (r.id === editingReqId ? normalizedReq : r))
      : [...effectiveRequirements, normalizedReq];

    updateClient(
      liveClient.id,
      { hiringRequirements: nextList },
      reqEditReason.trim()
    );
    setShowReqForm(false);
    setEditingReqId(null);
    setReqError('');
  };

  const handleStartEditJob = (j: (typeof clientJobs)[number]) => {
    if (!canManageClients) return;
    setEditingJobId(j.id);
    setJobTitleDraft(j.title);
    setJobPositionsDraft(j.positions);
    setJobSalaryMinDraft(j.salaryMinLPA);
    setJobSalaryMaxDraft(j.salaryMaxLPA);
    setJobMinExpDraft(j.minExpYears);
    setJobMaxExpDraft(j.maxExpYears);
    setJobLocationDraft(j.location);
    setJobSkillsDraft((j.skillsRequired || []).join(', '));
    setJobDescDraft(j.description || '');
    setJobEditReason('Updated job opening JD & requirement details');
    setJobEditError('');
  };

  const handleSaveJobEdit = (e: React.FormEvent, jobId: string) => {
    e.preventDefault();
    if (!canManageClients) return;
    if (!jobTitleDraft.trim()) {
      setJobEditError('Job role / title is required.');
      return;
    }
    if (jobEditReason.trim().length < 5) {
      setJobEditError('Please enter a brief reason for editing this JD.');
      return;
    }
    const parsedSkills = jobSkillsDraft
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    updateJob(
      jobId,
      {
        title: jobTitleDraft.trim(),
        positions: Math.max(1, Number(jobPositionsDraft) || 1),
        salaryMinLPA: Number(jobSalaryMinDraft) || 0,
        salaryMaxLPA: Number(jobSalaryMaxDraft) || 0,
        minExpYears: Number(jobMinExpDraft) || 0,
        maxExpYears: Number(jobMaxExpDraft) || 0,
        location: jobLocationDraft.trim(),
        skillsRequired: parsedSkills.length > 0 ? parsedSkills : ['Communication Skills'],
        description: jobDescDraft.trim(),
      },
      jobEditReason.trim()
    );
    setEditingJobId(null);
    setJobEditError('');
  };

  const handleAddRemarkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageClients || isSubmittingRemark) return;
    const trimmed = newRemarkText.trim();
    if (trimmed.length < 3) {
      setRemarkError('Remark must be at least 3 characters.');
      return;
    }
    if (trimmed.length > 500) {
      setRemarkError('Remark cannot exceed 500 characters.');
      return;
    }
    setIsSubmittingRemark(true);
    addClientRemark(liveClient.id, trimmed);
    setNewRemarkText('');
    setRemarkError('');
    setShowAddRemarkBox(false);
    setIsSubmittingRemark(false);
    setOpenSections((prev) => ({ ...prev, remarks: true }));
  };

  const renderSectionHeader = (
    key: CollapsibleSectionKey,
    title: string,
    icon: React.ReactNode,
    badgeCount?: number
  ) => {
    const isOpenSection = openSections[key];
    return (
      <button
        type="button"
        onClick={() => toggleSection(key)}
        className="w-full px-4 py-3 flex items-center justify-between gap-2 bg-slate-50 hover:bg-slate-100 text-left transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[#F5A623] shrink-0">{icon}</span>
          <span className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
            {title}
          </span>
          {typeof badgeCount === 'number' && (
            <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 text-[10px] font-bold">
              {badgeCount}
            </span>
          )}
        </div>
        {isOpenSection ? (
          <ChevronUp className="w-4 h-4 text-slate-600 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-600 shrink-0" />
        )}
      </button>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={liveClient.name}
      subtitle={`Corporate Client Profile • ${liveClient.industry} • ${liveClient.city}`}
      maxWidth="4xl"
    >
      <div className="space-y-4 text-slate-900">
        {/* 1. TOP "CALL SUMMARY" BLOCK (Very first thing at the top of the company profile, nothing above it) */}
        <CallSummaryBlock client={liveClient} jobs={jobs} variant="profile" />

        {/* Management Action Bar */}
        <div className="flex items-center justify-between gap-2 flex-wrap p-3 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2 flex-wrap">
            {canManageClients && (
              <button
                type="button"
                onClick={handleOpenAddRequirement}
                className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[#0B1F4B] hover:bg-[#163270] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#F5A623]" />
                <span>Add Hiring Requirement</span>
              </button>
            )}

            {canManageClients && (
              <button
                type="button"
                onClick={() => {
                  setShowAddRemarkBox((prev) => !prev);
                  setRemarkError('');
                }}
                className="min-h-[38px] px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
                <span>Add Remark</span>
              </button>
            )}

            {canCreateTasks && (
              <button
                type="button"
                onClick={() => setIsReminderOpen(true)}
                className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[#F5A623] hover:bg-amber-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Set Reminder</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {canManageClients && (
              <>
                <button
                  type="button"
                  onClick={() => onRequestMove(liveClient)}
                  className="min-h-[38px] px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-900 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-[#F5A623]" />
                  <span>Move Section</span>
                </button>

                <button
                  type="button"
                  onClick={() => onEdit(liveClient)}
                  className="min-h-[38px] px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-900 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5 text-[#0B1F4B]" />
                  <span>Edit Company</span>
                </button>
              </>
            )}

            {isAdmin && (
              <button
                type="button"
                onClick={() => onRequestDelete(liveClient)}
                className="min-h-[38px] px-2.5 py-1.5 rounded-lg bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                title="Move Company to Trash (Admin Only)"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Inline Add Remark Form */}
        {canManageClients && showAddRemarkBox && (
          <form
            onSubmit={handleAddRemarkSubmit}
            className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <MessageSquarePlus className="w-4 h-4 text-blue-700" />
                <span>Log New Client Remark (Section: {CLIENT_SECTION_LABELS[section]})</span>
              </label>
              <span className="text-xs text-slate-600 font-mono">
                {newRemarkText.trim().length}/500
              </span>
            </div>
            <textarea
              rows={2}
              maxLength={500}
              placeholder="Enter call summary, meeting notes, or status update (3–500 characters)..."
              value={newRemarkText}
              onChange={(e) => {
                setNewRemarkText(e.target.value);
                setRemarkError('');
              }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
            />
            {remarkError && (
              <p className="text-xs text-rose-600 font-semibold">{remarkError}</p>
            )}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddRemarkBox(false);
                  setNewRemarkText('');
                  setRemarkError('');
                }}
                className="min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingRemark}
                className="min-h-[38px] px-4 py-1.5 rounded-lg bg-[#0B1F4B] hover:bg-[#163270] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {isSubmittingRemark ? 'Saving...' : 'Save Remark'}
              </button>
            </div>
          </form>
        )}

        {/* Inline Add / Edit Hiring Requirement Form (Admin, Manager, HR Executive only) */}
        {canManageClients && showReqForm && (
          <form
            onSubmit={handleSaveRequirement}
            className="p-4 rounded-xl bg-amber-50/70 border border-amber-300 space-y-3 text-xs"
          >
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-extrabold text-sm text-[#0B1F4B] flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-[#F5A623]" />
                <span>
                  {editingReqId ? 'Edit Hiring Requirement' : 'Add Hiring Requirement on Company'}
                </span>
              </h4>
              <button
                type="button"
                onClick={() => setShowReqForm(false)}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Searchable Work Profile Dropdown */}
              <div className="sm:col-span-2 relative">
                <label className="font-bold text-slate-800 block mb-1">
                  Profile (Work Profile) *
                </label>
                <button
                  type="button"
                  onClick={() => setIsProfilePickerOpen((prev) => !prev)}
                  className="w-full min-h-[42px] px-3 py-2 text-left text-xs font-bold rounded-lg border border-slate-300 bg-white text-slate-900 flex items-center justify-between gap-2 cursor-pointer"
                >
                  <span className="truncate">
                    {selectedProfileOption === 'Other'
                      ? `Other${customProfileInput ? `: ${customProfileInput}` : ''}`
                      : selectedProfileOption}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                </button>

                {isProfilePickerOpen && (
                  <div className="absolute left-0 right-0 mt-1 bg-white rounded-xl border border-slate-300 shadow-xl z-30 p-2 max-h-64 overflow-y-auto space-y-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Type to filter profiles..."
                        value={profileSearchQuery}
                        onChange={(e) => setProfileSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none"
                      />
                    </div>
                    {filteredProfileCategories.map((cat) => (
                      <div key={cat.id} className="space-y-0.5">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 px-2 py-0.5">
                          {cat.name}
                        </p>
                        {cat.profiles.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setSelectedProfileOption(p.name);
                              setIsProfilePickerOpen(false);
                              setReqError('');
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                              selectedProfileOption === p.name
                                ? 'bg-[#0B1F4B] text-white'
                                : 'text-slate-800 hover:bg-slate-100'
                            }`}
                          >
                            {p.name}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Number of Openings
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={reqDraft.openings || 1}
                  onChange={(e) =>
                    setReqDraft({ ...reqDraft, openings: Math.max(1, Number(e.target.value) || 1) })
                  }
                  className="w-full min-h-[42px] px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900"
                />
              </div>

              {selectedProfileOption === 'Other' && (
                <div className="sm:col-span-3">
                  <label className="font-bold text-slate-800 block mb-1">
                    Type the work profile * (2–60 chars, stored in Title Case)
                  </label>
                  <input
                    type="text"
                    value={customProfileInput}
                    onChange={(e) => {
                      setCustomProfileInput(e.target.value);
                      setReqError('');
                    }}
                    placeholder="e.g. Client Relationship Associate (CRA) - Outbound Telecalling"
                    className="w-full min-h-[42px] px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900"
                  />
                  {suggestedExistingProfile && (
                    <div className="mt-1.5 p-2 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-800">
                        Matches existing profile:{' '}
                        <strong>{suggestedExistingProfile.name}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProfileOption(suggestedExistingProfile.name);
                          setCustomProfileInput('');
                          setReqError('');
                        }}
                        className="px-2.5 py-1 rounded bg-[#0B1F4B] text-white text-[11px] font-bold cursor-pointer"
                      >
                        Use "{suggestedExistingProfile.name}"
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="sm:col-span-3">
                <label className="font-bold text-slate-800 block mb-1">
                  Work Location (City and Area / Address) *
                </label>
                <input
                  type="text"
                  value={reqDraft.location}
                  onChange={(e) => setReqDraft({ ...reqDraft, location: e.target.value })}
                  placeholder="e.g. A-100, Sector 4, near Sector 16 Metro Station, Noida"
                  className="w-full min-h-[42px] px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Salary Min (Rs / month) *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={reqDraft.salaryMin}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '');
                    setReqDraft({ ...reqDraft, salaryMin: digits ? Number(digits) : 0 });
                  }}
                  placeholder="15100"
                  className="w-full min-h-[42px] px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Salary Max (Rs / month) *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={reqDraft.salaryMax}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '');
                    setReqDraft({ ...reqDraft, salaryMax: digits ? Number(digits) : 0 });
                  }}
                  placeholder="18000"
                  className="w-full min-h-[42px] px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Salary Extras Note
                </label>
                <input
                  type="text"
                  value={reqDraft.extras || ''}
                  onChange={(e) => setReqDraft({ ...reqDraft, extras: e.target.value })}
                  placeholder="+ Rs 500 attendance bonus + unlimited incentives + ESI"
                  className="w-full min-h-[42px] px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900"
                />
              </div>

              {/* Eligibility Fields */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">Gender</label>
                <input
                  type="text"
                  value={reqDraft.gender || ''}
                  onChange={(e) => setReqDraft({ ...reqDraft, gender: e.target.value })}
                  placeholder="e.g. Female candidates only / Any"
                  className="w-full min-h-[40px] px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Age Range</label>
                <input
                  type="text"
                  value={reqDraft.ageRange || ''}
                  onChange={(e) => setReqDraft({ ...reqDraft, ageRange: e.target.value })}
                  placeholder="e.g. 18 to below 30"
                  className="w-full min-h-[40px] px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Qualification</label>
                <input
                  type="text"
                  value={reqDraft.qualification || ''}
                  onChange={(e) => setReqDraft({ ...reqDraft, qualification: e.target.value })}
                  placeholder="e.g. 12th pass / graduation pursuing / graduate"
                  className="w-full min-h-[40px] px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Experience</label>
                <input
                  type="text"
                  value={reqDraft.experience || ''}
                  onChange={(e) => setReqDraft({ ...reqDraft, experience: e.target.value })}
                  placeholder="e.g. Freshers can apply"
                  className="w-full min-h-[40px] px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-slate-800 block mb-1">
                  Communication & Skills Requirement
                </label>
                <input
                  type="text"
                  value={reqDraft.communication || ''}
                  onChange={(e) => setReqDraft({ ...reqDraft, communication: e.target.value })}
                  placeholder="e.g. Basic communication / Good communication and convincing skills"
                  className="w-full min-h-[40px] px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900"
                />
              </div>

              {/* Benefits & Timings Fields */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">Working Hours</label>
                <input
                  type="text"
                  value={reqDraft.workingHours || ''}
                  onChange={(e) => setReqDraft({ ...reqDraft, workingHours: e.target.value })}
                  placeholder="e.g. 9:30 AM to 6:30 PM"
                  className="w-full min-h-[40px] px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Weekly Off</label>
                <input
                  type="text"
                  value={reqDraft.weeklyOff || ''}
                  onChange={(e) => setReqDraft({ ...reqDraft, weeklyOff: e.target.value })}
                  placeholder="e.g. Sunday fixed weekly off"
                  className="w-full min-h-[40px] px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Interview Timing</label>
                <input
                  type="text"
                  value={reqDraft.interviewTiming || ''}
                  onChange={(e) => setReqDraft({ ...reqDraft, interviewTiming: e.target.value })}
                  placeholder="e.g. 11:00 AM to 4:30 PM"
                  className="w-full min-h-[40px] px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">ESI</label>
                <input
                  type="text"
                  value={reqDraft.esi || ''}
                  onChange={(e) => setReqDraft({ ...reqDraft, esi: e.target.value })}
                  placeholder="e.g. ESI as applicable"
                  className="w-full min-h-[40px] px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Attendance Bonus</label>
                <input
                  type="text"
                  value={reqDraft.attendanceBonus || ''}
                  onChange={(e) => setReqDraft({ ...reqDraft, attendanceBonus: e.target.value })}
                  placeholder="e.g. Rs 500 attendance bonus"
                  className="w-full min-h-[40px] px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Incentives</label>
                <input
                  type="text"
                  value={reqDraft.incentives || ''}
                  onChange={(e) => setReqDraft({ ...reqDraft, incentives: e.target.value })}
                  placeholder="e.g. Unlimited incentives"
                  className="w-full min-h-[40px] px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="font-bold text-slate-800 block mb-1">
                  Reason for Saving * (Logged in Edit History)
                </label>
                <input
                  type="text"
                  value={reqEditReason}
                  onChange={(e) => setReqEditReason(e.target.value)}
                  className="w-full min-h-[40px] px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900"
                />
              </div>
            </div>

            {reqError && <p className="text-xs text-rose-600 font-bold">{reqError}</p>}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowReqForm(false)}
                className="min-h-[38px] px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[38px] px-4 py-1.5 rounded-lg bg-[#0B1F4B] hover:bg-[#163270] text-white font-bold cursor-pointer"
              >
                Save Hiring Requirement
              </button>
            </div>
          </form>
        )}

        {/* 2. EVERYTHING ELSE BELOW IN 8 COLLAPSIBLE SECTIONS (First 2 open by default, rest collapsed) */}
        <div className="space-y-2.5">
          {/* SECTION 1: Eligibility (OPEN BY DEFAULT) */}
          <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
            {renderSectionHeader(
              'eligibility',
              'Eligibility (Gender, Age Range, Qualification, Experience, Communication)',
              <CheckCircle2 className="w-4 h-4" />,
              effectiveRequirements.length
            )}
            {openSections.eligibility && (
              <div className="p-4 border-t border-slate-200 space-y-3 text-xs">
                {effectiveRequirements.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap border-b border-slate-200 pb-1.5">
                      <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                        {req.profile}
                      </span>
                      {canManageClients && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditRequirement(req)}
                            className="px-2 py-1 rounded bg-white border border-slate-300 text-[11px] font-bold text-[#0B1F4B] hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
                          >
                            <Edit className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          {effectiveRequirements.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteRequirement(req.id)}
                              className="px-2 py-1 rounded bg-white border border-rose-200 text-[11px] font-bold text-rose-600 hover:bg-rose-50 cursor-pointer"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-500 block">
                          Gender
                        </span>
                        <span className="font-semibold text-slate-900">
                          {req.gender || 'Any'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-500 block">
                          Age Range
                        </span>
                        <span className="font-semibold text-slate-900">
                          {req.ageRange || 'Open'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-500 block">
                          Qualification
                        </span>
                        <span className="font-semibold text-slate-900">
                          {req.qualification || '12th Pass / Graduate'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-500 block">
                          Experience
                        </span>
                        <span className="font-semibold text-slate-900">
                          {req.experience || 'Freshers & Experienced'}
                        </span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-[10px] font-bold uppercase text-slate-500 block">
                          Communication & Skills Requirement
                        </span>
                        <span className="font-semibold text-slate-900">
                          {req.communication || 'Good communication skills'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 2: Benefits and timings (OPEN BY DEFAULT) */}
          <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
            {renderSectionHeader(
              'benefitsTimings',
              'Benefits and Timings (ESI, Attendance Bonus, Incentives, Weekly Off, Working Hours, Interview Timing, Openings)',
              <Clock className="w-4 h-4" />,
              effectiveRequirements.length
            )}
            {openSections.benefitsTimings && (
              <div className="p-4 border-t border-slate-200 space-y-3 text-xs">
                {effectiveRequirements.map((req) => {
                  const sal = formatMonthlySalaryParts(req.salaryMin, req.salaryMax);
                  return (
                    <div
                      key={req.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap border-b border-slate-200 pb-1.5">
                        <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                          {req.profile} — {sal.rsText}{' '}
                          <span className="text-[11px] font-semibold text-slate-600">
                            ({sal.lpaText})
                          </span>
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-extrabold">
                          Openings: {req.openings || 1}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-500 block">
                            ESI
                          </span>
                          <span className="font-semibold text-slate-900">
                            {req.esi || 'As applicable'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-500 block">
                            Attendance Bonus
                          </span>
                          <span className="font-semibold text-slate-900">
                            {req.attendanceBonus || '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-500 block">
                            Incentives
                          </span>
                          <span className="font-semibold text-slate-900">
                            {req.incentives || req.extras || '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-500 block">
                            Weekly Off
                          </span>
                          <span className="font-semibold text-slate-900">
                            {req.weeklyOff || 'Sunday fixed weekly off'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-500 block">
                            Working Hours
                          </span>
                          <span className="font-semibold text-slate-900">
                            {req.workingHours || '9:30 AM to 6:30 PM'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-500 block">
                            Interview Timing
                          </span>
                          <span className="font-semibold text-slate-900">
                            {req.interviewTiming || '11:00 AM to 4:30 PM'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 3: Contact persons (COLLAPSED BY DEFAULT) */}
          <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
            {renderSectionHeader(
              'contacts',
              'Contact Persons',
              <Users className="w-4 h-4" />,
              liveClient.contactPersons.length
            )}
            {openSections.contacts && (
              <div className="p-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {liveClient.contactPersons.map((cp) => (
                  <div
                    key={cp.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between"
                  >
                    <div className="space-y-1 min-w-0">
                      <p className="font-bold text-slate-900">{cp.name}</p>
                      <p className="text-xs text-slate-600 font-medium">{cp.designation}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-700 pt-1 flex-wrap">
                        {cp.phone && (
                          <a
                            href={`tel:${cp.phone.replace(/\s+/g, '')}`}
                            className="flex items-center gap-1 font-bold text-[#0B1F4B] hover:underline"
                          >
                            <Phone className="w-3.5 h-3.5 text-[#F5A623]" />
                            {cp.phone}
                          </a>
                        )}
                        {cp.email && (
                          <a
                            href={`mailto:${cp.email}`}
                            className="flex items-center gap-1 font-bold text-blue-700 hover:underline break-all"
                          >
                            <Mail className="w-3.5 h-3.5 text-slate-500" />
                            {cp.email}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 4: Address and map link (COLLAPSED BY DEFAULT) */}
          <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
            {renderSectionHeader(
              'addressMap',
              'Address and Map Link',
              <MapPin className="w-4 h-4" />
            )}
            {openSections.addressMap && (
              <div className="p-4 border-t border-slate-200 space-y-2.5 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">
                    Full Office Address
                  </span>
                  <p className="font-semibold text-slate-900 mt-0.5">
                    {liveClient.address ? `${liveClient.address}, ` : ''}
                    {liveClient.city}
                  </p>
                </div>
                {liveClient.website && (
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">
                      Map / Website Link
                    </span>
                    <a
                      href={liveClient.website}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 font-bold text-blue-700 hover:underline mt-0.5 break-all"
                    >
                      <Globe className="w-3.5 h-3.5 shrink-0" />
                      <span>{liveClient.website}</span>
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECTION 5: Agreement and commission, payment terms (COLLAPSED BY DEFAULT) */}
          <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
            {renderSectionHeader(
              'agreementCommission',
              'Agreement, Commission & Payment Terms',
              <FileText className="w-4 h-4" />
            )}
            {openSections.agreementCommission && (
              <div className="p-4 border-t border-slate-200 space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">
                      Section Status
                    </span>
                    <span className="font-bold text-slate-900">
                      {section} — {CLIENT_SECTION_LABELS[section]}
                    </span>
                  </div>

                  {section === 'Green' && (
                    <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                      <span className="text-[10px] font-bold uppercase text-emerald-800 block">
                        Agreement Signed Date
                      </span>
                      <span className="font-bold text-emerald-950">
                        {formatIndianDate(liveClient.agreementSignedDate)}
                      </span>
                    </div>
                  )}

                  {section === 'Blue' && (
                    <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200">
                      <span className="text-[10px] font-bold uppercase text-blue-800 block">
                        Last Contacted Date
                      </span>
                      <span className="font-bold text-blue-950">
                        {formatIndianDate(liveClient.lastContactedDate)}
                      </span>
                    </div>
                  )}

                  {section === 'Red' && (
                    <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200">
                      <span className="text-[10px] font-bold uppercase text-rose-800 block">
                        Enquiry Received Date
                      </span>
                      <span className="font-bold text-rose-950">
                        {formatIndianDate(liveClient.enquiryDate || liveClient.createdAt)}
                      </span>
                    </div>
                  )}

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">
                      Next Follow-up Date
                    </span>
                    <span
                      className={`font-bold ${
                        isFollowUpOverdue ? 'text-rose-700' : 'text-slate-900'
                      }`}
                    >
                      {formatIndianDate(liveClient.nextFollowUpDate)}
                      {isFollowUpOverdue ? ' (Overdue)' : ''}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">
                      Commission Rate
                    </span>
                    <span className="font-extrabold text-[#0B1F4B]">
                      {liveClient.commissionPercent}% of annual CTC
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">
                      Payment Terms
                    </span>
                    <span className="font-semibold text-slate-900">
                      {liveClient.paymentTerms || '-'}
                    </span>
                  </div>
                </div>

                {liveClient.agreementDetails && (
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                      Agreement & SLA Notes
                    </span>
                    <p className="text-slate-800 leading-relaxed">{liveClient.agreementDetails}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECTION 6: Remarks timeline (COLLAPSED BY DEFAULT) */}
          <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
            {renderSectionHeader(
              'remarks',
              'Remarks Timeline',
              <MessageSquarePlus className="w-4 h-4" />,
              remarksList.length
            )}
            {openSections.remarks && (
              <div className="p-4 border-t border-slate-200 space-y-3 text-xs">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="text-xs text-slate-600">
                    Permanent remarks timeline (newest first). Remarks cannot be edited or deleted.
                  </p>
                  {canManageClients && !showAddRemarkBox && (
                    <button
                      type="button"
                      onClick={() => setShowAddRemarkBox(true)}
                      className="min-h-[36px] px-3 py-1.5 rounded-lg bg-[#0B1F4B] hover:bg-[#163270] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquarePlus className="w-3.5 h-3.5 text-[#F5A623]" />
                      <span>Add Remark</span>
                    </button>
                  )}
                </div>

                {remarksList.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
                    No remarks have been logged for {liveClient.name} yet.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {remarksList.map((rem) => {
                      const remSec: ClientSection = rem.section || section;
                      return (
                        <div
                          key={rem.id}
                          className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${SECTION_BADGE_STYLES[remSec]}`}
                              >
                                {remSec} — {CLIENT_SECTION_LABELS[remSec]}
                              </span>
                              <span className="font-bold text-slate-900">{rem.authorName}</span>
                              <span className="text-[10px] uppercase text-slate-600 font-bold">
                                ({rem.authorRole.replace('_', ' ')})
                              </span>
                            </div>
                            <span className="text-xs text-slate-600 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatISTDateTime(rem.createdAt)}
                            </span>
                          </div>
                          <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                            {rem.text}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECTION 7: Jobs and placed candidates linked to the company (COLLAPSED BY DEFAULT) */}
          <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
            {renderSectionHeader(
              'jobsPlacements',
              'Jobs and Placed Candidates Linked to the Company',
              <Award className="w-4 h-4" />,
              clientJobs.length + placedCandidates.length
            )}
            {openSections.jobsPlacements && (
              <div className="p-4 border-t border-slate-200 space-y-4 text-xs">
                {/* Linked Job Openings */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h4 className="font-extrabold text-slate-900">
                      Job Openings ({clientJobs.length})
                    </h4>
                    {canManageClients && (
                      <button
                        type="button"
                        onClick={() => onOpenCreateJobForClient(liveClient)}
                        className="min-h-[36px] px-3 py-1.5 rounded-lg bg-[#0B1F4B] hover:bg-[#163270] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Briefcase className="w-3.5 h-3.5 text-[#F5A623]" />
                        <span>+ Add New Job / JD</span>
                      </button>
                    )}
                  </div>

                  {clientJobs.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
                      No job openings created yet.
                    </div>
                  ) : (
                    clientJobs.map((j) => (
                      <div
                        key={j.id}
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2"
                      >
                        {editingJobId === j.id && canManageClients ? (
                          <form
                            onSubmit={(e) => handleSaveJobEdit(e, j.id)}
                            className="space-y-2.5"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <div className="sm:col-span-2">
                                <label className="text-xs font-bold text-slate-800 block mb-1">
                                  Job Role / Title *
                                </label>
                                <input
                                  type="text"
                                  value={jobTitleDraft}
                                  onChange={(e) => setJobTitleDraft(e.target.value)}
                                  className="w-full min-h-[40px] px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-bold text-slate-800 block mb-1">
                                  Positions
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  value={jobPositionsDraft}
                                  onChange={(e) =>
                                    setJobPositionsDraft(Number(e.target.value) || 1)
                                  }
                                  className="w-full min-h-[40px] px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-bold text-slate-800 block mb-1">
                                  Location
                                </label>
                                <input
                                  type="text"
                                  value={jobLocationDraft}
                                  onChange={(e) => setJobLocationDraft(e.target.value)}
                                  className="w-full min-h-[40px] px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900"
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <label className="text-xs font-bold text-slate-800 block mb-1">
                                  Full Job Description (JD) *
                                </label>
                                <textarea
                                  rows={3}
                                  value={jobDescDraft}
                                  onChange={(e) => setJobDescDraft(e.target.value)}
                                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900"
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <label className="text-xs font-bold text-slate-800 block mb-1">
                                  Reason for Edit *
                                </label>
                                <input
                                  type="text"
                                  value={jobEditReason}
                                  onChange={(e) => setJobEditReason(e.target.value)}
                                  className="w-full min-h-[40px] px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900"
                                />
                              </div>
                            </div>
                            {jobEditError && (
                              <p className="text-xs text-rose-600 font-semibold">{jobEditError}</p>
                            )}
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingJobId(null)}
                                className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white font-bold cursor-pointer"
                              >
                                Save Job JD
                              </button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-extrabold text-slate-900">{j.title}</p>
                                <p className="text-[11px] text-slate-600 mt-0.5">
                                  {j.location} • {j.positions} Positions • {j.salaryMinLPA}–
                                  {j.salaryMaxLPA} LPA
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 text-[10px] font-bold">
                                  {j.status}
                                </span>
                                {canManageClients && (
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditJob(j)}
                                    className="px-2 py-1 rounded bg-white border border-slate-300 text-[11px] font-bold text-[#0B1F4B] cursor-pointer"
                                  >
                                    Edit JD
                                  </button>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Placed / Offered Candidates */}
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <h4 className="font-extrabold text-slate-900">
                    Placed & Offered Candidates ({placedCandidates.length})
                  </h4>
                  {placedCandidates.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
                      No candidates placed with {liveClient.name} yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {placedCandidates.map((cand) => (
                        <div
                          key={cand.id}
                          className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">{cand.fullName}</p>
                            <p className="text-[11px] text-slate-600 truncate">
                              {cand.workProfile || cand.jobTitle} • {cand.phone}
                            </p>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-extrabold shrink-0">
                            {cand.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 8: Edit History (COLLAPSED BY DEFAULT) */}
          <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
            {renderSectionHeader(
              'editHistory',
              'Edit History',
              <History className="w-4 h-4" />,
              editHistoryList.length
            )}
            {openSections.editHistory && (
              <div className="p-4 border-t border-slate-200 space-y-2.5 text-xs">
                {editHistoryList.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
                    No edits recorded for {liveClient.name} yet.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {editHistoryList.map((eh) => (
                      <div
                        key={eh.id}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="font-bold text-slate-900">
                            {eh.editedByUserName} ({eh.editedByUserRole})
                          </span>
                          <span className="text-slate-600">
                            {formatISTDateTime(eh.timestamp)}
                          </span>
                        </div>
                        <p className="text-amber-950 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                          <strong>Reason:</strong> {eh.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <SetReminderModal
        isOpen={isReminderOpen}
        onClose={() => setIsReminderOpen(false)}
        relatedType="client"
        relatedId={liveClient.id}
        relatedName={liveClient.name}
        defaultTitle={`Follow up with ${liveClient.name} (${CLIENT_SECTION_LABELS[section]})`}
      />
    </Modal>
  );
};
