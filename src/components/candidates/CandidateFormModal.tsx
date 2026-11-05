import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { Candidate, CandidateStatus } from '../../types/crm';
import { useCRM } from '../../context/CRMContext';
import {
  AlertTriangle,
  X,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Search,
  Clock,
  UserCheck,
  Briefcase,
  Edit3,
  Copy,
} from 'lucide-react';
import {
  ensureWorkProfileCategories,
  getAllFlatWorkProfiles,
  validateCustomWorkProfile,
  findMatchingExistingProfile,
  formatISTDateTime,
  formatOpenJobDropdownLabel,
  GENERAL_TALENT_POOL_LABEL,
} from '../../lib/workProfiles';

interface CandidateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateToEdit?: Candidate | null;
}

export const CandidateFormModal: React.FC<CandidateFormModalProps> = ({
  isOpen,
  onClose,
  candidateToEdit,
}) => {
  const {
    addCandidate,
    updateCandidate,
    checkDuplicate,
    users,
    jobs,
    companySettings,
    currentUser,
  } = useCRM();

  // Essentials
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Noida');
  const [experienceYears, setExperienceYears] = useState<number>(3);
  const [source, setSource] = useState<Candidate['source']>('Naukri');

  // Work Profile state
  const [selectedWorkProfile, setSelectedWorkProfile] = useState('');
  const [customWorkProfileInput, setCustomWorkProfileInput] = useState('');
  const [isWorkProfileDropdownOpen, setIsWorkProfileDropdownOpen] = useState(false);
  const [workProfileSearch, setWorkProfileSearch] = useState('');
  const workProfileDropdownRef = useRef<HTMLDivElement>(null);

  // Position / Job Applied For state
  const [appliedForMode, setAppliedForMode] = useState<
    'none' | 'job' | 'general' | 'profile' | 'other'
  >('general');
  const [selectedAppliedJobId, setSelectedAppliedJobId] = useState('');
  const [selectedAppliedProfile, setSelectedAppliedProfile] = useState('');
  const [customAppliedForInput, setCustomAppliedForInput] = useState('');
  const [isAppliedForDropdownOpen, setIsAppliedForDropdownOpen] = useState(false);
  const [appliedForSearch, setAppliedForSearch] = useState('');
  const appliedForDropdownRef = useRef<HTMLDivElement>(null);

  // Entry Date & Entered By state (read-only for non-Admin; Admin can correct on Edit)
  const [nowPreviewIso, setNowPreviewIso] = useState<string>(() => new Date().toISOString());
  const [isAdminEditingEntryMeta, setIsAdminEditingEntryMeta] = useState(false);
  const [adminEntryDateTimeLocal, setAdminEntryDateTimeLocal] = useState('');
  const [adminEnteredBy, setAdminEnteredBy] = useState('');

  // More Details (Collapsible — collapsed by default on Quick Add)
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [currentCompany, setCurrentCompany] = useState('');
  const [currentSalaryLPA, setCurrentSalaryLPA] = useState<number>(6);
  const [expectedSalaryLPA, setExpectedSalaryLPA] = useState<number>(9);
  const [education, setEducation] = useState('Graduate');
  const [skills, setSkills] = useState<string[]>(['Communication', 'IT Support']);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [assignedRecruiterId, setAssignedRecruiterId] = useState(currentUser.id);
  const [status, setStatus] = useState<CandidateStatus>('New');

  // Edit reason & Duplicate confirmation
  const [editReason, setEditReason] = useState('');
  const [quickReasonOption, setQuickReasonOption] = useState('Candidate updated details');
  const [confirmDuplicate, setConfirmDuplicate] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [duplicateMatch, setDuplicateMatch] = useState<Candidate | null>(null);

  const activeCategories = useMemo(
    () =>
      ensureWorkProfileCategories(companySettings.workProfileCategories).filter(
        (cat) => cat.active
      ),
    [companySettings.workProfileCategories]
  );

  const allMasterProfileNames = useMemo(
    () =>
      new Set(
        getAllFlatWorkProfiles(companySettings.workProfileCategories, true)
          .map((p) => p.name)
          .filter((name) => name.toLowerCase() !== 'other')
      ),
    [companySettings.workProfileCategories]
  );

  const openJobs = useMemo(
    () => jobs.filter((j) => j.status === 'Open' && !j.deletedAt),
    [jobs]
  );

  // Convert an ISO date string to YYYY-MM-DDTHH:mm in IST for datetime-local input
  const isoToISTDateTimeLocal = (isoStr?: string) => {
    const d = isoStr ? new Date(isoStr) : new Date();
    if (isNaN(d.getTime())) return '';
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(d);
    const get = (t: string) => parts.find((p) => p.type === t)?.value || '00';
    const hh = get('hour') === '24' ? '00' : get('hour');
    return `${get('year')}-${get('month')}-${get('day')}T${hh}:${get('minute')}`;
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        workProfileDropdownRef.current &&
        !workProfileDropdownRef.current.contains(e.target as Node)
      ) {
        setIsWorkProfileDropdownOpen(false);
      }
      if (
        appliedForDropdownRef.current &&
        !appliedForDropdownRef.current.contains(e.target as Node)
      ) {
        setIsAppliedForDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    setNowPreviewIso(new Date().toISOString());
    setIsWorkProfileDropdownOpen(false);
    setWorkProfileSearch('');
    setIsAppliedForDropdownOpen(false);
    setAppliedForSearch('');
    setIsAdminEditingEntryMeta(false);

    if (candidateToEdit) {
      setFullName(candidateToEdit.fullName);
      setPhone(candidateToEdit.phone);
      setEmail(candidateToEdit.email);
      setCity(candidateToEdit.city);
      setCurrentCompany(candidateToEdit.currentCompany);
      setCurrentSalaryLPA(candidateToEdit.currentSalaryLPA);
      setExpectedSalaryLPA(candidateToEdit.expectedSalaryLPA);
      setExperienceYears(candidateToEdit.experienceYears);
      setEducation(candidateToEdit.education);
      setSource(candidateToEdit.source);
      setSkills(candidateToEdit.skills || []);
      setAssignedRecruiterId(candidateToEdit.assignedRecruiterId);
      setStatus(candidateToEdit.status);
      setEditReason('');
      setShowMoreDetails(false);

      const existingWp = (candidateToEdit.workProfile || '').trim();
      if (existingWp) {
        if (candidateToEdit.workProfileIsCustom || !allMasterProfileNames.has(existingWp)) {
          setSelectedWorkProfile('Other');
          setCustomWorkProfileInput(existingWp);
        } else {
          setSelectedWorkProfile(existingWp);
          setCustomWorkProfileInput('');
        }
      } else {
        setSelectedWorkProfile('');
        setCustomWorkProfileInput('');
      }

      const existingJobId = (candidateToEdit.jobId || '').trim();
      const existingAf = (candidateToEdit.appliedFor || candidateToEdit.jobTitle || '').trim();
      if (existingJobId && jobs.some((j) => j.id === existingJobId)) {
        setAppliedForMode('job');
        setSelectedAppliedJobId(existingJobId);
        setSelectedAppliedProfile('');
        setCustomAppliedForInput('');
      } else if (existingAf) {
        if (existingAf === GENERAL_TALENT_POOL_LABEL) {
          setAppliedForMode('general');
          setSelectedAppliedJobId('');
          setSelectedAppliedProfile('');
          setCustomAppliedForInput('');
        } else if (candidateToEdit.appliedForIsCustom || !allMasterProfileNames.has(existingAf)) {
          setAppliedForMode('other');
          setSelectedAppliedJobId('');
          setSelectedAppliedProfile('');
          setCustomAppliedForInput(existingAf);
        } else {
          setAppliedForMode('profile');
          setSelectedAppliedJobId('');
          setSelectedAppliedProfile(existingAf);
          setCustomAppliedForInput('');
        }
      } else {
        setAppliedForMode('general');
        setSelectedAppliedJobId('');
        setSelectedAppliedProfile('');
        setCustomAppliedForInput('');
      }

      const baseEntryIso = candidateToEdit.entryDate || candidateToEdit.createdAt;
      setAdminEntryDateTimeLocal(isoToISTDateTimeLocal(baseEntryIso));
      setAdminEnteredBy(
        candidateToEdit.enteredBy || candidateToEdit.assignedRecruiterName || currentUser.name
      );
    } else {
      setFullName('');
      setPhone('+91 ');
      setEmail('');
      setCity('Noida');
      setCurrentCompany('');
      setCurrentSalaryLPA(5);
      setExpectedSalaryLPA(8);
      setExperienceYears(3);
      setEducation('Graduate');
      setSkills(['Communication']);
      setAssignedRecruiterId(currentUser.id);
      setStatus('New');
      setSelectedWorkProfile('');
      setCustomWorkProfileInput('');
      setAppliedForMode('general');
      setSelectedAppliedJobId('');
      setSelectedAppliedProfile('');
      setCustomAppliedForInput('');
      setEditReason('');
      setShowMoreDetails(false);
      setAdminEntryDateTimeLocal(isoToISTDateTimeLocal(new Date().toISOString()));
      setAdminEnteredBy(currentUser.name);
    }

    setErrors({});
    setDuplicateMatch(null);
    setConfirmDuplicate(false);
    setSuccessMessage('');
  }, [candidateToEdit, isOpen, currentUser, allMasterProfileNames, jobs]);

  // Live duplicate check while typing mobile or email
  useEffect(() => {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const cleanEmail = email.trim().toLowerCase();

    if ((cleanPhone.length >= 10 || cleanEmail.includes('@')) && isOpen) {
      const match = checkDuplicate(phone, email, candidateToEdit?.id);
      if (match) {
        setDuplicateMatch(match);
      } else {
        setDuplicateMatch(null);
        setConfirmDuplicate(false);
      }
    } else {
      setDuplicateMatch(null);
    }
  }, [phone, email, candidateToEdit, isOpen, checkDuplicate]);

  // Filtered categories and profiles for Work Profile searchable dropdown
  const filteredCategories = useMemo(() => {
    const q = workProfileSearch.trim().toLowerCase();
    return activeCategories
      .map((cat) => {
        const activeProfiles = cat.profiles.filter((p) => p.active);
        if (!q) return { ...cat, profiles: activeProfiles };
        const catMatches = cat.name.toLowerCase().includes(q);
        const matchingProfiles = activeProfiles.filter(
          (p) =>
            catMatches ||
            p.name.toLowerCase().includes(q) ||
            p.name.toLowerCase().replace(/\s+/g, '').includes(q.replace(/\s+/g, ''))
        );
        return { ...cat, profiles: matchingProfiles };
      })
      .filter((cat) => cat.profiles.length > 0 || cat.name.toLowerCase() === 'other');
  }, [activeCategories, workProfileSearch]);

  // Filtered groups for Position / Job Applied For searchable dropdown
  const filteredOpenJobsForApplied = useMemo(() => {
    const q = appliedForSearch.trim().toLowerCase();
    if (!q) return openJobs;
    return openJobs.filter((j) => {
      const label = formatOpenJobDropdownLabel(j).toLowerCase();
      return (
        label.includes(q) ||
        j.title.toLowerCase().includes(q) ||
        j.clientName.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q)
      );
    });
  }, [openJobs, appliedForSearch]);

  const showGeneralOptionInApplied = useMemo(() => {
    const q = appliedForSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      GENERAL_TALENT_POOL_LABEL.toLowerCase().includes(q) ||
      'general'.includes(q) ||
      'talent pool'.includes(q) ||
      'unassigned'.includes(q)
    );
  }, [appliedForSearch]);

  const filteredAppliedProfileCategories = useMemo(() => {
    const q = appliedForSearch.trim().toLowerCase();
    return activeCategories
      .filter((cat) => cat.name.toLowerCase() !== 'other')
      .map((cat) => {
        const activeProfiles = cat.profiles.filter(
          (p) => p.active && p.name.toLowerCase() !== 'other'
        );
        if (!q) return { ...cat, profiles: activeProfiles };
        const catMatches = cat.name.toLowerCase().includes(q);
        const matchingProfiles = activeProfiles.filter(
          (p) =>
            catMatches ||
            p.name.toLowerCase().includes(q) ||
            p.name.toLowerCase().replace(/\s+/g, '').includes(q.replace(/\s+/g, ''))
        );
        return { ...cat, profiles: matchingProfiles };
      })
      .filter((cat) => cat.profiles.length > 0);
  }, [activeCategories, appliedForSearch]);

  // Check if typed custom work profile matches an existing profile (ignoring case & spaces)
  const existingProfileMatch = useMemo(() => {
    if (selectedWorkProfile !== 'Other' || !customWorkProfileInput.trim()) return null;
    return findMatchingExistingProfile(
      customWorkProfileInput,
      companySettings.workProfileCategories
    );
  }, [selectedWorkProfile, customWorkProfileInput, companySettings.workProfileCategories]);

  // Check if typed custom Applied For matches an existing profile (ignoring case & spaces)
  const existingAppliedProfileMatch = useMemo(() => {
    if (appliedForMode !== 'other' || !customAppliedForInput.trim()) return null;
    return findMatchingExistingProfile(
      customAppliedForInput,
      companySettings.workProfileCategories
    );
  }, [appliedForMode, customAppliedForInput, companySettings.workProfileCategories]);

  const handleCopySameAsWorkProfile = () => {
    if (!selectedWorkProfile) return;
    if (selectedWorkProfile === 'Other') {
      setAppliedForMode('other');
      setSelectedAppliedJobId('');
      setSelectedAppliedProfile('');
      setCustomAppliedForInput(customWorkProfileInput);
    } else {
      setAppliedForMode('profile');
      setSelectedAppliedJobId('');
      setSelectedAppliedProfile(selectedWorkProfile);
      setCustomAppliedForInput('');
    }
    setIsAppliedForDropdownOpen(false);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.customAppliedFor;
      return next;
    });
  };

  const appliedForDisplayLabel = useMemo(() => {
    if (appliedForMode === 'job' && selectedAppliedJobId) {
      const job = jobs.find((j) => j.id === selectedAppliedJobId);
      if (job) return formatOpenJobDropdownLabel(job);
    }
    if (appliedForMode === 'general') {
      return GENERAL_TALENT_POOL_LABEL;
    }
    if (appliedForMode === 'profile' && selectedAppliedProfile) {
      return selectedAppliedProfile;
    }
    if (appliedForMode === 'other') {
      const formatted = validateCustomWorkProfile(customAppliedForInput).formatted;
      return formatted ? `Other: ${formatted}` : 'Other (Type job applied for below)';
    }
    return 'Select or search Job Applied For...';
  }, [
    appliedForMode,
    selectedAppliedJobId,
    selectedAppliedProfile,
    customAppliedForInput,
    jobs,
  ]);

  const handleAddSkill = () => {
    if (newSkillInput.trim() && !skills.includes(newSkillInput.trim())) {
      setSkills([...skills, newSkillInput.trim()]);
      setNewSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const nameRegex = /^[A-Za-z\s.]+$/;

    if (!fullName.trim() || fullName.trim().length < 2 || !nameRegex.test(fullName)) {
      newErrors.fullName = 'Valid full name required (letters, spaces, dot only, min 2 chars).';
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      newErrors.phone = 'Mobile must be 10 digits starting with 6, 7, 8, or 9.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim().toLowerCase())) {
      newErrors.email = 'Valid email format required.';
    }

    if (!selectedWorkProfile) {
      newErrors.workProfile = 'Work Profile is required.';
    } else if (selectedWorkProfile === 'Other') {
      const check = validateCustomWorkProfile(customWorkProfileInput);
      if (!check.valid) {
        newErrors.customWorkProfile = check.error || 'Valid work profile is required.';
      } else if (existingProfileMatch) {
        newErrors.customWorkProfile = `"${existingProfileMatch.name}" already exists in the master list. Please click the suggestion below to use it.`;
      }
    }

    if (appliedForMode === 'other') {
      const checkAf = validateCustomWorkProfile(customAppliedForInput);
      if (!checkAf.valid) {
        newErrors.customAppliedFor =
          checkAf.error?.replace('work profile', 'job applied for').replace('Work profile', 'Job applied for') ||
          'Please type the job applied for (2 to 60 characters).';
      } else if (existingAppliedProfileMatch) {
        newErrors.customAppliedFor = `"${existingAppliedProfileMatch.name}" already exists in the master list. Please click the suggestion below to use it.`;
      }
    }

    if (experienceYears < 0 || experienceYears > 40) {
      newErrors.experienceYears = 'Valid experience years required (0-40).';
    }

    if (candidateToEdit) {
      const finalReason = editReason.trim() || quickReasonOption;
      if (finalReason.length < 10) {
        newErrors.editReason = 'Mandatory edit reason must be at least 10 characters long.';
      }
      if (currentUser.role === 'admin' && isAdminEditingEntryMeta) {
        if (!adminEnteredBy.trim()) {
          newErrors.adminEntryMeta = 'Entered by name cannot be empty.';
        }
        if (!adminEntryDateTimeLocal) {
          newErrors.adminEntryMeta = 'Valid entry date and time required.';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (addAnother = false) => {
    if (!validateForm()) return;
    if (duplicateMatch && !confirmDuplicate) {
      setErrors((prev) => ({
        ...prev,
        duplicate: 'Please confirm by ticking the duplicate acknowledgement checkbox.',
      }));
      return;
    }

    const assignedRecruiter = users.find((u) => u.id === assignedRecruiterId);

    const isCustomWp = selectedWorkProfile === 'Other';
    const finalWorkProfile = isCustomWp
      ? validateCustomWorkProfile(customWorkProfileInput).formatted
      : selectedWorkProfile;

    let finalJobId: string | undefined;
    let finalJobTitle: string | undefined;
    let finalClientId: string | undefined;
    let finalClientName: string | undefined;
    let finalAppliedFor: string | undefined;
    let finalAppliedForIsCustom = false;

    if (appliedForMode === 'job' && selectedAppliedJobId) {
      const assignedJob = jobs.find((j) => j.id === selectedAppliedJobId);
      if (assignedJob) {
        finalJobId = assignedJob.id;
        finalJobTitle = assignedJob.title;
        finalClientId = assignedJob.clientId;
        finalClientName = assignedJob.clientName;
        finalAppliedFor = assignedJob.title;
        finalAppliedForIsCustom = false;
      }
    } else if (appliedForMode === 'general') {
      finalAppliedFor = GENERAL_TALENT_POOL_LABEL;
      finalAppliedForIsCustom = false;
    } else if (appliedForMode === 'profile' && selectedAppliedProfile) {
      finalAppliedFor = selectedAppliedProfile;
      finalAppliedForIsCustom = false;
    } else if (appliedForMode === 'other') {
      finalAppliedFor = validateCustomWorkProfile(customAppliedForInput).formatted;
      finalAppliedForIsCustom = true;
    }

    if (candidateToEdit) {
      const finalReason = editReason.trim() || quickReasonOption;
      const updatePayload: Partial<Candidate> = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        city: city.trim(),
        currentCompany: currentCompany.trim() || 'Confidential',
        currentSalaryLPA: Number(currentSalaryLPA) || 0,
        expectedSalaryLPA: Number(expectedSalaryLPA) || 0,
        experienceYears: Number(experienceYears) || 0,
        workProfile: finalWorkProfile,
        workProfileIsCustom: isCustomWp,
        appliedFor: finalAppliedFor || '',
        appliedForIsCustom: finalAppliedForIsCustom,
        skills,
        education: education.trim(),
        source,
        assignedRecruiterId,
        assignedRecruiterName: assignedRecruiter?.name || currentUser.name,
        status,
        jobId: finalJobId || '',
        jobTitle: finalJobTitle || '',
        clientId: finalClientId || '',
        clientName: finalClientName || '',
      };

      if (currentUser.role === 'admin' && isAdminEditingEntryMeta) {
        const parsedAdminDate = new Date(`${adminEntryDateTimeLocal}:00+05:30`);
        if (!isNaN(parsedAdminDate.getTime())) {
          updatePayload.entryDate = parsedAdminDate.toISOString();
        }
        if (adminEnteredBy.trim()) {
          updatePayload.enteredBy = adminEnteredBy.trim();
        }
      }

      updateCandidate(candidateToEdit.id, updatePayload, finalReason);
      onClose();
    } else {
      const res = addCandidate({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        city: city.trim(),
        currentCompany: currentCompany.trim() || 'Confidential',
        currentSalaryLPA: Number(currentSalaryLPA) || 0,
        expectedSalaryLPA: Number(expectedSalaryLPA) || 0,
        experienceYears: Number(experienceYears) || 0,
        workProfile: finalWorkProfile,
        workProfileIsCustom: isCustomWp,
        appliedFor: finalAppliedFor,
        appliedForIsCustom: finalAppliedForIsCustom,
        skills,
        education: education.trim(),
        source,
        assignedRecruiterId,
        assignedRecruiterName: assignedRecruiter?.name || currentUser.name,
        status: 'New',
        jobId: finalJobId,
        jobTitle: finalJobTitle,
        clientId: finalClientId,
        clientName: finalClientName,
      });

      if (res.success) {
        setSuccessMessage('Candidate added successfully!');
        if (addAnother) {
          setFullName('');
          setPhone('+91 ');
          setEmail('');
          setSelectedWorkProfile('');
          setCustomWorkProfileInput('');
          setAppliedForMode('general');
          setSelectedAppliedJobId('');
          setSelectedAppliedProfile('');
          setCustomAppliedForInput('');
          setNowPreviewIso(new Date().toISOString());
          setTimeout(() => setSuccessMessage(''), 3000);
        } else {
          setTimeout(() => {
            onClose();
          }, 800);
        }
      }
    }
  };

  const displayEntryDateIso = candidateToEdit
    ? candidateToEdit.entryDate || candidateToEdit.createdAt
    : nowPreviewIso;
  const displayEnteredBy = candidateToEdit
    ? candidateToEdit.enteredBy || candidateToEdit.assignedRecruiterName || currentUser.name
    : currentUser.name;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={candidateToEdit ? 'Edit Candidate Profile' : 'Quick Add Candidate'}
      maxWidth="2xl"
      footer={
        <div className="flex items-center justify-end gap-2.5 flex-wrap w-full">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer"
          >
            Cancel
          </button>

          {!candidateToEdit && (
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={Boolean(duplicateMatch && !confirmDuplicate)}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-900 font-bold text-xs transition-all cursor-pointer"
            >
              Save & Add Another
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={Boolean(duplicateMatch && !confirmDuplicate)}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-[#0B1F4B] hover:bg-[#163270] disabled:opacity-50 text-white font-extrabold text-xs transition-all shadow-md cursor-pointer"
          >
            {candidateToEdit ? 'Save Changes' : 'Save Candidate'}
          </button>
        </div>
      }
    >
      <div className="space-y-4 text-slate-900">
        {/* Read-only Entry Date & Entered By Info Banner */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-800">
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <Clock className="w-3.5 h-3.5 text-[#0B1F4B] shrink-0" />
              <span>
                Entry date:{' '}
                <strong className="text-slate-900">
                  {formatISTDateTime(displayEntryDateIso)}
                </strong>
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <UserCheck className="w-3.5 h-3.5 text-[#F5A623] shrink-0" />
              <span>
                Entered by: <strong className="text-slate-900">{displayEnteredBy}</strong>
              </span>
            </span>
          </div>

          {candidateToEdit && currentUser.role === 'admin' && (
            <button
              type="button"
              onClick={() => setIsAdminEditingEntryMeta(!isAdminEditingEntryMeta)}
              className="text-[11px] font-bold text-[#0B1F4B] hover:underline inline-flex items-center gap-1 self-start sm:self-auto cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              <span>{isAdminEditingEntryMeta ? 'Cancel Correction' : 'Correct Entry Date'}</span>
            </button>
          )}
        </div>

        {/* Admin-Only Entry Date & Entered By Correction Panel */}
        {candidateToEdit && currentUser.role === 'admin' && isAdminEditingEntryMeta && (
          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 space-y-2.5 text-xs">
            <p className="font-bold text-[#0B1F4B]">
              Admin Override: Correct Entry Date &amp; Entered By (Logged in Edit History)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Entry Date &amp; Time (IST)
                </label>
                <input
                  type="datetime-local"
                  value={adminEntryDateTimeLocal}
                  onChange={(e) => setAdminEntryDateTimeLocal(e.target.value)}
                  className="w-full min-h-[40px] px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Entered By
                </label>
                <input
                  type="text"
                  value={adminEnteredBy}
                  onChange={(e) => setAdminEnteredBy(e.target.value)}
                  placeholder="Enter staff name"
                  className="w-full min-h-[40px] px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900"
                />
              </div>
            </div>
            {errors.adminEntryMeta && (
              <p className="text-xs text-rose-600 font-bold">{errors.adminEntryMeta}</p>
            )}
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
            <span>{successMessage}</span>
          </div>
        )}

        {duplicateMatch && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>Duplicate Candidate Warning</span>
            </div>
            <p className="text-amber-900">
              A candidate with matching mobile or email already exists:{' '}
              <strong>{duplicateMatch.fullName}</strong> ({duplicateMatch.phone},{' '}
              {duplicateMatch.email}), Assigned to: {duplicateMatch.assignedRecruiterName}.
            </p>
            <label className="flex items-center gap-2.5 pt-1 font-bold cursor-pointer text-slate-900 min-h-[44px]">
              <input
                type="checkbox"
                checked={confirmDuplicate}
                onChange={(e) => setConfirmDuplicate(e.target.checked)}
                className="rounded border-amber-500 text-[#0B1F4B] focus:ring-[#0B1F4B] w-5 h-5"
              />
              <span>I confirm I want to proceed and save despite the duplicate match.</span>
            </label>
            {errors.duplicate && (
              <p className="text-xs text-rose-700 font-bold">{errors.duplicate}</p>
            )}
          </div>
        )}

        {/* Essentials Form (Single column on phones, 2 cols on sm+) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Full Name <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-[#0B1F4B] focus:outline-none"
            />
            {errors.fullName && (
              <p className="text-xs text-rose-600 font-semibold mt-1">{errors.fullName}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Mobile Number (+91) <span className="text-rose-600">*</span>
            </label>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-[#0B1F4B] focus:outline-none"
            />
            {errors.phone && (
              <p className="text-xs text-rose-600 font-semibold mt-1">{errors.phone}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Email Address <span className="text-rose-600">*</span>
            </label>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rahul.sharma@example.com"
              className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-[#0B1F4B] focus:outline-none"
            />
            {errors.email && (
              <p className="text-xs text-rose-600 font-semibold mt-1">{errors.email}</p>
            )}
          </div>

          {/* Searchable Grouped Work Profile Dropdown */}
          <div ref={workProfileDropdownRef} className="relative">
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Work Profile <span className="text-rose-600">*</span>
            </label>
            <button
              type="button"
              onClick={() => setIsWorkProfileDropdownOpen((prev) => !prev)}
              className={`w-full min-h-[44px] px-3 py-2 rounded-xl bg-white border text-left text-sm flex items-center justify-between gap-2 focus:ring-2 focus:ring-[#0B1F4B] focus:outline-none cursor-pointer ${
                errors.workProfile ? 'border-rose-500' : 'border-slate-300'
              }`}
            >
              <span
                className={`truncate flex items-center gap-1.5 ${
                  selectedWorkProfile ? 'text-slate-900 font-semibold' : 'text-slate-400'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 text-[#0B1F4B] shrink-0" />
                <span>
                  {selectedWorkProfile
                    ? selectedWorkProfile === 'Other' && customWorkProfileInput.trim()
                      ? `Other: ${validateCustomWorkProfile(customWorkProfileInput).formatted}`
                      : selectedWorkProfile
                    : 'Select or search Work Profile...'}
                </span>
              </span>
              <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
            </button>

            {isWorkProfileDropdownOpen && (
              <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-300 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="p-2 border-b border-slate-200 bg-slate-50">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      autoFocus
                      value={workProfileSearch}
                      onChange={(e) => setWorkProfileSearch(e.target.value)}
                      placeholder="Type to filter profiles or categories..."
                      className="w-full min-h-[36px] pl-8 pr-7 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
                    />
                    {workProfileSearch && (
                      <button
                        type="button"
                        onClick={() => setWorkProfileSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                  {filteredCategories.map((cat) => (
                    <div key={cat.id} className="py-1">
                      <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#0B1F4B] bg-slate-100/80 sticky top-0">
                        {cat.name}
                      </div>
                      {cat.profiles.map((prof) => {
                        const isSelected = selectedWorkProfile === prof.name;
                        return (
                          <button
                            key={prof.id}
                            type="button"
                            onClick={() => {
                              setSelectedWorkProfile(prof.name);
                              setIsWorkProfileDropdownOpen(false);
                              setWorkProfileSearch('');
                              setErrors((prev) => {
                                const next = { ...prev };
                                delete next.workProfile;
                                return next;
                              });
                            }}
                            className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-[#0B1F4B] text-white font-bold'
                                : 'text-slate-800 hover:bg-blue-50 font-medium'
                            }`}
                          >
                            <span>{prof.name}</span>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#F5A623]" />}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {errors.workProfile && (
              <p className="text-xs text-rose-600 font-semibold mt-1">{errors.workProfile}</p>
            )}
          </div>

          {/* Conditional "Other" Custom Work Profile Input */}
          {selectedWorkProfile === 'Other' && (
            <div className="sm:col-span-2 p-3.5 rounded-xl bg-amber-50/70 border border-amber-300 space-y-2">
              <label className="block text-xs font-bold text-slate-900">
                Type the work profile <span className="text-rose-600">*</span>{' '}
                <span className="text-[11px] font-normal text-slate-600">
                  (2–60 chars, stored in Title Case)
                </span>
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={60}
                value={customWorkProfileInput}
                onChange={(e) => {
                  setCustomWorkProfileInput(e.target.value);
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.customWorkProfile;
                    return next;
                  });
                }}
                onBlur={() => {
                  const v = validateCustomWorkProfile(customWorkProfileInput);
                  if (v.formatted) {
                    setCustomWorkProfileInput(v.formatted);
                  }
                }}
                placeholder="e.g. Debt Recovery Specialist"
                className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-[#0B1F4B] focus:outline-none"
              />

              {existingProfileMatch && (
                <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-300 text-xs text-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-[#0B1F4B]">Existing profile found: </span>
                    <span>
                      "{existingProfileMatch.name}" ({existingProfileMatch.category})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedWorkProfile(existingProfileMatch.name);
                      setCustomWorkProfileInput('');
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.customWorkProfile;
                        return next;
                      });
                    }}
                    className="min-h-[34px] px-3 py-1 rounded-lg bg-[#0B1F4B] hover:bg-[#163270] text-white font-bold text-xs shrink-0 cursor-pointer"
                  >
                    Use "{existingProfileMatch.name}"
                  </button>
                </div>
              )}

              {errors.customWorkProfile && (
                <p className="text-xs text-rose-600 font-semibold">{errors.customWorkProfile}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Current City</label>
            <input
              type="text"
              autoComplete="address-level2"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Noida / Delhi / Gurgaon"
              className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-[#0B1F4B] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Total Experience (Years)
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.5"
              min="0"
              max="40"
              value={experienceYears}
              onChange={(e) => setExperienceYears(Number(e.target.value))}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-[#0B1F4B] focus:outline-none"
            />
            {errors.experienceYears && (
              <p className="text-xs text-rose-600 font-semibold mt-1">{errors.experienceYears}</p>
            )}
          </div>

          {/* Searchable Grouped Position / Job Applied For Dropdown */}
          <div ref={appliedForDropdownRef} className="relative">
            <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
              <label className="block text-xs font-bold text-slate-800">
                Position / Job Applied For
              </label>
              <button
                type="button"
                onClick={handleCopySameAsWorkProfile}
                disabled={
                  !selectedWorkProfile ||
                  (selectedWorkProfile === 'Other' && !customWorkProfileInput.trim())
                }
                title="Copy the selected Work Profile into Position / Job Applied For"
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 hover:bg-blue-100 disabled:opacity-45 disabled:cursor-not-allowed border border-blue-200 text-[#0B1F4B] text-[11px] font-bold transition-colors cursor-pointer"
              >
                <Copy className="w-3 h-3 shrink-0" />
                <span>Same as Work Profile</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsAppliedForDropdownOpen((prev) => !prev)}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white border border-slate-300 text-left text-sm flex items-center justify-between gap-2 focus:ring-2 focus:ring-[#0B1F4B] focus:outline-none cursor-pointer"
            >
              <span
                className={`truncate flex items-center gap-1.5 ${
                  appliedForMode !== 'none' ? 'text-slate-900 font-semibold' : 'text-slate-400'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 text-[#0B1F4B] shrink-0" />
                <span className="truncate">{appliedForDisplayLabel}</span>
              </span>
              <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
            </button>

            {isAppliedForDropdownOpen && (
              <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-300 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="p-2 border-b border-slate-200 bg-slate-50">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      autoFocus
                      value={appliedForSearch}
                      onChange={(e) => setAppliedForSearch(e.target.value)}
                      placeholder="Type to filter open jobs, profiles, or categories..."
                      className="w-full min-h-[38px] pl-8 pr-7 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
                    />
                    {appliedForSearch && (
                      <button
                        type="button"
                        onClick={() => setAppliedForSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {/* a) Open job openings */}
                  {filteredOpenJobsForApplied.length > 0 && (
                    <div className="py-1">
                      <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-900 bg-emerald-50 border-b border-emerald-100 sticky top-0">
                        Open job openings ({filteredOpenJobsForApplied.length})
                      </div>
                      {filteredOpenJobsForApplied.map((j) => {
                        const isSelected =
                          appliedForMode === 'job' && selectedAppliedJobId === j.id;
                        const label = formatOpenJobDropdownLabel(j);
                        return (
                          <button
                            key={j.id}
                            type="button"
                            onClick={() => {
                              setAppliedForMode('job');
                              setSelectedAppliedJobId(j.id);
                              setSelectedAppliedProfile('');
                              setIsAppliedForDropdownOpen(false);
                              setAppliedForSearch('');
                            }}
                            className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer min-h-[42px] ${
                              isSelected
                                ? 'bg-[#0B1F4B] text-white font-bold'
                                : 'text-slate-900 hover:bg-blue-50 font-semibold'
                            }`}
                          >
                            <span className="leading-snug">{label}</span>
                            {isSelected && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#F5A623] shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* b) General */}
                  {showGeneralOptionInApplied && (
                    <div className="py-1">
                      <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#0B1F4B] bg-slate-100/90 sticky top-0">
                        General
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAppliedForMode('general');
                          setSelectedAppliedJobId('');
                          setSelectedAppliedProfile('');
                          setIsAppliedForDropdownOpen(false);
                          setAppliedForSearch('');
                        }}
                        className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer min-h-[42px] ${
                          appliedForMode === 'general'
                            ? 'bg-[#0B1F4B] text-white font-bold'
                            : 'text-slate-800 hover:bg-blue-50 font-medium'
                        }`}
                      >
                        <span>{GENERAL_TALENT_POOL_LABEL}</span>
                        {appliedForMode === 'general' && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#F5A623] shrink-0" />
                        )}
                      </button>
                    </div>
                  )}

                  {/* c) All job profiles (grouped by category) */}
                  {filteredAppliedProfileCategories.length > 0 && (
                    <div className="py-1">
                      <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#0B1F4B] bg-blue-50/90 border-b border-blue-100 sticky top-0">
                        All job profiles
                      </div>
                      {filteredAppliedProfileCategories.map((cat) => (
                        <div key={`af_${cat.id}`} className="py-0.5">
                          <div className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-50">
                            {cat.name}
                          </div>
                          {cat.profiles.map((prof) => {
                            const isSelected =
                              appliedForMode === 'profile' &&
                              selectedAppliedProfile === prof.name;
                            return (
                              <button
                                key={`af_prof_${prof.id}`}
                                type="button"
                                onClick={() => {
                                  setAppliedForMode('profile');
                                  setSelectedAppliedJobId('');
                                  setSelectedAppliedProfile(prof.name);
                                  setIsAppliedForDropdownOpen(false);
                                  setAppliedForSearch('');
                                }}
                                className={`w-full text-left px-4 py-2.5 text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer min-h-[40px] ${
                                  isSelected
                                    ? 'bg-[#0B1F4B] text-white font-bold'
                                    : 'text-slate-800 hover:bg-blue-50 font-medium'
                                }`}
                              >
                                <span>{prof.name}</span>
                                {isSelected && (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-[#F5A623] shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* d) Other as the last option */}
                  <div className="py-1">
                    <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#0B1F4B] bg-slate-100/90 sticky top-0">
                      Other
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedForMode('other');
                        setSelectedAppliedJobId('');
                        setSelectedAppliedProfile('');
                        setIsAppliedForDropdownOpen(false);
                        setAppliedForSearch('');
                      }}
                      className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer min-h-[42px] ${
                        appliedForMode === 'other'
                          ? 'bg-[#0B1F4B] text-white font-bold'
                          : 'text-slate-800 hover:bg-blue-50 font-medium'
                      }`}
                    >
                      <span>Other</span>
                      {appliedForMode === 'other' && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#F5A623] shrink-0" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Conditional "Other" Custom Applied For Input */}
          {appliedForMode === 'other' && (
            <div className="sm:col-span-2 p-3.5 rounded-xl bg-amber-50/70 border border-amber-300 space-y-2">
              <label className="block text-xs font-bold text-slate-900">
                Type the job applied for <span className="text-rose-600">*</span>{' '}
                <span className="text-[11px] font-normal text-slate-600">
                  (2–60 chars, stored in Title Case)
                </span>
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={60}
                value={customAppliedForInput}
                onChange={(e) => {
                  setCustomAppliedForInput(e.target.value);
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.customAppliedFor;
                    return next;
                  });
                }}
                onBlur={() => {
                  const v = validateCustomWorkProfile(customAppliedForInput);
                  if (v.formatted) {
                    setCustomAppliedForInput(v.formatted);
                  }
                }}
                placeholder="e.g. Senior Export Documentation Executive"
                className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-[#0B1F4B] focus:outline-none"
              />

              {existingAppliedProfileMatch && (
                <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-300 text-xs text-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-[#0B1F4B]">Existing profile found: </span>
                    <span>
                      "{existingAppliedProfileMatch.name}" ({existingAppliedProfileMatch.category})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedForMode('profile');
                      setSelectedAppliedProfile(existingAppliedProfileMatch.name);
                      setCustomAppliedForInput('');
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.customAppliedFor;
                        return next;
                      });
                    }}
                    className="min-h-[34px] px-3 py-1 rounded-lg bg-[#0B1F4B] hover:bg-[#163270] text-white font-bold text-xs shrink-0 cursor-pointer"
                  >
                    Use "{existingAppliedProfileMatch.name}"
                  </button>
                </div>
              )}

              {errors.customAppliedFor && (
                <p className="text-xs text-rose-600 font-semibold">{errors.customAppliedFor}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Source</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as any)}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-[#0B1F4B] focus:outline-none"
            >
              {companySettings.availableSources.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Collapsible More Details */}
        <div className="pt-2 border-t border-slate-200">
          <button
            type="button"
            onClick={() => setShowMoreDetails(!showMoreDetails)}
            className="min-h-[44px] w-full px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between text-xs font-bold text-[#0B1F4B] transition-colors cursor-pointer"
          >
            <span>
              {showMoreDetails
                ? 'Hide More Details'
                : 'More Details (Salary, Education, Skills, Recruiter)'}
            </span>
            {showMoreDetails ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {showMoreDetails && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 mt-2 bg-slate-50 border border-slate-200 p-4 rounded-xl">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Current Company
                </label>
                <input
                  type="text"
                  autoComplete="organization"
                  value={currentCompany}
                  onChange={(e) => setCurrentCompany(e.target.value)}
                  placeholder="e.g. TCS / Wipro"
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-[#0B1F4B] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Education</label>
                <input
                  type="text"
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  placeholder="B.Tech / MBA / MCA"
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-[#0B1F4B] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Current Salary (LPA)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  min="0"
                  value={currentSalaryLPA}
                  onChange={(e) => setCurrentSalaryLPA(Number(e.target.value))}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-[#0B1F4B] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Expected Salary (LPA)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  min="0"
                  value={expectedSalaryLPA}
                  onChange={(e) => setExpectedSalaryLPA(Number(e.target.value))}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-[#0B1F4B] focus:outline-none"
                />
                {expectedSalaryLPA < currentSalaryLPA && (
                  <p className="text-xs text-amber-800 font-semibold mt-1">
                    Warning: Expected salary is lower than current salary.
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-800 mb-1">Skills</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    placeholder="Add skill and press enter"
                    className="flex-1 min-h-[44px] px-3 py-2 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-[#0B1F4B] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-[#0B1F4B] hover:bg-[#163270] text-white text-xs font-bold cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-[#0B1F4B] text-xs font-bold"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="p-1 hover:text-rose-600 cursor-pointer"
                        title={`Remove ${skill}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Assigned Recruiter
                </label>
                <select
                  value={assignedRecruiterId}
                  onChange={(e) => setAssignedRecruiterId(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-[#0B1F4B] focus:outline-none"
                >
                  {users
                    .filter((u) => u.active)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role.toUpperCase()})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Candidate Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as CandidateStatus)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-[#0B1F4B] focus:outline-none"
                >
                  {[
                    'New',
                    'Screened',
                    'Shortlisted',
                    'Interview Scheduled',
                    'Selected',
                    'Offered',
                    'Placed',
                    'Rejected',
                    'On Hold',
                  ].map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Mandatory Edit Reason when Editing */}
        {candidateToEdit && (
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-300 space-y-3">
            <label className="block text-xs font-bold text-amber-950">
              Purpose / Reason for Edit <span className="text-rose-600">*</span> (Mandatory, min 10
              chars)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                'Candidate updated details',
                'Correction of wrong entry',
                'New information received',
                'Status update',
                'Other',
              ].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setQuickReasonOption(opt);
                    setEditReason(opt);
                  }}
                  className={`min-h-[44px] px-3 py-2 rounded-lg text-xs font-semibold border text-left transition-all cursor-pointer ${
                    quickReasonOption === opt
                      ? 'bg-[#0B1F4B] border-[#0B1F4B] text-white font-bold'
                      : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            <textarea
              rows={2}
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              placeholder="Or type specific edit reason here (minimum 10 characters)..."
              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-[#0B1F4B] focus:outline-none"
            />
            {errors.editReason && (
              <p className="text-xs text-rose-600 font-bold">{errors.editReason}</p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
