import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Candidate, CandidateStatus } from '../../types/crm';
import { useCRM } from '../../context/CRMContext';
import { AlertTriangle, Plus, X, Link as LinkIcon, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';

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
  const [jobSelection, setJobSelection] = useState(''); // '' (General Pool), job.id, or '__OTHER__'
  const [customJobTitle, setCustomJobTitle] = useState('');
  const [remarks, setRemarks] = useState('');
  const [source, setSource] = useState<Candidate['source']>('Naukri');

  // More Details (Collapsible)
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

  useEffect(() => {
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
      setRemarks(candidateToEdit.remarks || '');

      const hasMatchingJob = Boolean(
        candidateToEdit.jobId && jobs.some((j) => j.id === candidateToEdit.jobId)
      );
      if (candidateToEdit.isCustomPosition || (candidateToEdit.jobTitle && !hasMatchingJob)) {
        setJobSelection('__OTHER__');
        setCustomJobTitle(candidateToEdit.jobTitle || '');
      } else if (candidateToEdit.jobId && hasMatchingJob) {
        setJobSelection(candidateToEdit.jobId);
        setCustomJobTitle('');
      } else {
        setJobSelection('');
        setCustomJobTitle('');
      }

      setEditReason('');
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
      setJobSelection('');
      setCustomJobTitle('');
      setRemarks('');
      setEditReason('');
    }

    setErrors({});
    setDuplicateMatch(null);
    setConfirmDuplicate(false);
    setSuccessMessage('');
  }, [candidateToEdit, isOpen, currentUser, jobs]);

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

    if (experienceYears < 0 || experienceYears > 40) {
      newErrors.experienceYears = 'Valid experience years required (0-40).';
    }

    if (jobSelection === '__OTHER__') {
      const trimmedCustom = customJobTitle.trim();
      if (!trimmedCustom || trimmedCustom.length < 2) {
        newErrors.customJobTitle = 'Job role / position is required (minimum 2 characters).';
      }
    }

    if (remarks && remarks.length > 500) {
      newErrors.remarks = 'Remarks cannot exceed 500 characters.';
    }

    if (candidateToEdit) {
      const currentJobTitle =
        jobSelection === '__OTHER__'
          ? customJobTitle.trim()
          : (jobs.find((j) => j.id === jobSelection)?.title || '');
      const prevJobTitle = candidateToEdit.jobTitle || '';
      const currentJobId = jobSelection === '__OTHER__' ? '' : jobSelection;
      const prevJobId = candidateToEdit.jobId || '';

      const otherFieldsChanged =
        fullName.trim() !== candidateToEdit.fullName ||
        phone.trim() !== candidateToEdit.phone ||
        email.trim().toLowerCase() !== candidateToEdit.email.toLowerCase() ||
        city.trim() !== candidateToEdit.city ||
        currentCompany.trim() !== (candidateToEdit.currentCompany || 'Confidential') ||
        Number(currentSalaryLPA) !== Number(candidateToEdit.currentSalaryLPA) ||
        Number(expectedSalaryLPA) !== Number(candidateToEdit.expectedSalaryLPA) ||
        Number(experienceYears) !== Number(candidateToEdit.experienceYears) ||
        education.trim() !== candidateToEdit.education ||
        source !== candidateToEdit.source ||
        assignedRecruiterId !== candidateToEdit.assignedRecruiterId ||
        status !== candidateToEdit.status ||
        JSON.stringify(skills) !== JSON.stringify(candidateToEdit.skills || []) ||
        currentJobTitle !== prevJobTitle ||
        currentJobId !== prevJobId;

      if (otherFieldsChanged) {
        const finalReason = editReason.trim() || quickReasonOption;
        if (finalReason.length < 10) {
          newErrors.editReason = 'Mandatory edit reason must be at least 10 characters long.';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (addAnother = false) => {
    if (!validateForm()) return;
    if (duplicateMatch && !confirmDuplicate) {
      alert('Duplicate candidate detected! Please confirm by ticking the duplicate acknowledgement checkbox.');
      return;
    }

    const assignedRecruiter = users.find((u) => u.id === assignedRecruiterId);
    const isOther = jobSelection === '__OTHER__';
    const assignedJob = !isOther && jobSelection ? jobs.find((j) => j.id === jobSelection) : undefined;

    if (candidateToEdit) {
      const finalReason = editReason.trim() || quickReasonOption || 'Updated candidate details';
      updateCandidate(
        candidateToEdit.id,
        {
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim().toLowerCase(),
          city: city.trim(),
          currentCompany: currentCompany.trim() || 'Confidential',
          currentSalaryLPA: Number(currentSalaryLPA) || 0,
          expectedSalaryLPA: Number(expectedSalaryLPA) || 0,
          experienceYears: Number(experienceYears) || 0,
          skills,
          education: education.trim(),
          source,
          assignedRecruiterId,
          assignedRecruiterName: assignedRecruiter?.name || currentUser.name,
          status,
          ...(isOther
            ? {
                jobId: '',
                jobTitle: customJobTitle.trim(),
                clientId: '',
                clientName: '',
                isCustomPosition: true,
              }
            : assignedJob
            ? {
                jobId: assignedJob.id,
                jobTitle: assignedJob.title,
                clientId: assignedJob.clientId,
                clientName: assignedJob.clientName,
                isCustomPosition: false,
              }
            : {
                jobId: '',
                jobTitle: '',
                clientId: '',
                clientName: '',
                isCustomPosition: false,
              }),
          ...(remarks.trim() ? { remarks: remarks.trim() } : { remarks: '' }),
        },
        finalReason
      );
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
        skills,
        education: education.trim(),
        source,
        assignedRecruiterId,
        assignedRecruiterName: assignedRecruiter?.name || currentUser.name,
        status: 'New',
        ...(isOther
          ? {
              jobId: '',
              jobTitle: customJobTitle.trim(),
              clientId: '',
              clientName: '',
              isCustomPosition: true,
            }
          : assignedJob
          ? {
              jobId: assignedJob.id,
              jobTitle: assignedJob.title,
              clientId: assignedJob.clientId,
              clientName: assignedJob.clientName,
              isCustomPosition: false,
            }
          : {
              jobId: '',
              jobTitle: '',
              clientId: '',
              clientName: '',
              isCustomPosition: false,
            }),
        ...(remarks.trim() ? { remarks: remarks.trim() } : {}),
      });

      if (res.success) {
        setSuccessMessage('Candidate added successfully!');
        if (addAnother) {
          setFullName('');
          setPhone('+91 ');
          setEmail('');
          setCustomJobTitle('');
          setRemarks('');
          setTimeout(() => setSuccessMessage(''), 3000);
        } else {
          setTimeout(() => {
            onClose();
          }, 800);
        }
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={candidateToEdit ? 'Edit Candidate Profile' : 'Quick Add Candidate'}
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 font-bold animate-pulse">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {duplicateMatch && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Duplicate Candidate Warning</span>
            </div>
            <p>
              A candidate with matching mobile or email already exists: <strong>{duplicateMatch.fullName}</strong> ({duplicateMatch.phone}, {duplicateMatch.email}), Assigned to: {duplicateMatch.assignedRecruiterName}.
            </p>
            <label className="flex items-center gap-2 pt-1 font-medium cursor-pointer text-white">
              <input
                type="checkbox"
                checked={confirmDuplicate}
                onChange={(e) => setConfirmDuplicate(e.target.checked)}
                className="rounded border-amber-500 text-amber-500 focus:ring-amber-500 w-4 h-4"
              />
              <span>I confirm I want to proceed and save despite the duplicate match.</span>
            </label>
          </div>
        )}

        {/* Essentials Form (Default Visible) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-[#F5A623] focus:outline-none"
            />
            {errors.fullName && <p className="text-[10px] text-rose-400 mt-1">{errors.fullName}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Mobile Number (+91) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-[#F5A623] focus:outline-none"
            />
            {errors.phone && <p className="text-[10px] text-rose-400 mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rahul.sharma@example.com"
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-[#F5A623] focus:outline-none"
            />
            {errors.email && <p className="text-[10px] text-rose-400 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Current City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Noida / Delhi / Gurgaon"
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-[#F5A623] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Total Experience (Years)</label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="40"
              value={experienceYears}
              onChange={(e) => setExperienceYears(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-[#F5A623] focus:outline-none"
            />
            {errors.experienceYears && <p className="text-[10px] text-rose-400 mt-1">{errors.experienceYears}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Position / Job Applied For</label>
            <select
              value={jobSelection}
              onChange={(e) => {
                setJobSelection(e.target.value);
                if (errors.customJobTitle) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.customJobTitle;
                    return next;
                  });
                }
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-[#F5A623] focus:outline-none"
            >
              <option value="">General Talent Pool / Unassigned</option>
              {jobs.filter((j) => j.status === 'Open').map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} — {j.clientName}
                </option>
              ))}
              <option value="__OTHER__">Other (not in list)</option>
            </select>

            {jobSelection === '__OTHER__' && (
              <div className="mt-2">
                <label className="block text-xs font-bold text-amber-400 mb-1">
                  Enter job role / position <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customJobTitle}
                  onChange={(e) => {
                    setCustomJobTitle(e.target.value);
                    if (errors.customJobTitle) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.customJobTitle;
                        return next;
                      });
                    }
                  }}
                  placeholder="e.g. Math Teacher, Accountant"
                  className={`w-full px-3 py-2 rounded-xl bg-slate-800 border text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-[#F5A623] focus:outline-none ${
                    errors.customJobTitle ? 'border-rose-500' : 'border-amber-500/60'
                  }`}
                />
                {errors.customJobTitle && (
                  <p className="text-[10px] text-rose-400 mt-1">{errors.customJobTitle}</p>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Source</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-[#F5A623] focus:outline-none"
            >
              {companySettings.availableSources.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Remarks Field (Prominent in main essentials section, max 500 chars) */}
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-300">
                Remarks
              </label>
              <span className={`text-[10px] font-mono ${remarks.length > 480 ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                {remarks.length}/500
              </span>
            </div>
            <textarea
              rows={2}
              maxLength={500}
              value={remarks}
              onChange={(e) => {
                setRemarks(e.target.value);
                if (errors.remarks) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.remarks;
                    return next;
                  });
                }
              }}
              placeholder="Any remark about this candidate, e.g. speaks fluent English, can join in 15 days"
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-[#F5A623] focus:outline-none resize-none"
            />
            {errors.remarks && <p className="text-[10px] text-rose-400 mt-1">{errors.remarks}</p>}
          </div>
        </div>

        {/* Collapsible More Details */}
        <div className="pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setShowMoreDetails(!showMoreDetails)}
            className="flex items-center gap-2 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
          >
            <span>{showMoreDetails ? 'Hide More Details' : 'Show More Details (Salary, Education, Skills, Recruiter)'}</span>
            {showMoreDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showMoreDetails && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 mt-2 border-t border-slate-800/60 bg-slate-850 p-4 rounded-xl">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Current Company</label>
                <input
                  type="text"
                  value={currentCompany}
                  onChange={(e) => setCurrentCompany(e.target.value)}
                  placeholder="e.g. TCS / Wipro"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-[#F5A623] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Education</label>
                <input
                  type="text"
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  placeholder="B.Tech / MBA / MCA"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-[#F5A623] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Current Salary (LPA)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={currentSalaryLPA}
                  onChange={(e) => setCurrentSalaryLPA(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-[#F5A623] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Expected Salary (LPA)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={expectedSalaryLPA}
                  onChange={(e) => setExpectedSalaryLPA(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-[#F5A623] focus:outline-none"
                />
                {expectedSalaryLPA < currentSalaryLPA && (
                  <p className="text-[10px] text-amber-400 mt-1">Warning: Expected salary is lower than current salary.</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1">Skills</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
                    placeholder="Add skill and press enter"
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-[#F5A623] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-medium"
                    >
                      {skill}
                      <button type="button" onClick={() => handleRemoveSkill(skill)} className="hover:text-rose-400">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Assigned Recruiter</label>
                <select
                  value={assignedRecruiterId}
                  onChange={(e) => setAssignedRecruiterId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-[#F5A623] focus:outline-none"
                >
                  {users.filter(u => u.active).map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Candidate Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as CandidateStatus)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-[#F5A623] focus:outline-none"
                >
                  {['New', 'Screened', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Offered', 'Joined', 'Rejected', 'On Hold'].map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Mandatory Edit Reason when Editing */}
        {candidateToEdit && (
          <div className="p-4 rounded-xl bg-slate-850 border border-slate-700 space-y-3">
            <label className="block text-xs font-bold text-amber-400">
              Purpose / Reason for Edit <span className="text-rose-500">*</span> (Mandatory, min 10 chars)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {['Candidate updated details', 'Correction of wrong entry', 'New information received', 'Status update', 'Other'].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setQuickReasonOption(opt);
                    setEditReason(opt);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border text-left transition-all cursor-pointer ${
                    quickReasonOption === opt
                      ? 'bg-[#F5A623]/20 border-[#F5A623] text-amber-300 font-bold'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
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
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-[#F5A623] focus:outline-none"
            />
            {errors.editReason && <p className="text-[10px] text-rose-400">{errors.editReason}</p>}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
          >
            Cancel
          </button>

          {!candidateToEdit && (
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={Boolean(duplicateMatch && !confirmDuplicate)}
              className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-bold text-xs transition-all cursor-pointer"
            >
              Save & Add Another
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={Boolean(duplicateMatch && !confirmDuplicate)}
            className="px-5 py-2 rounded-xl bg-[#F5A623] hover:bg-amber-500 disabled:opacity-50 text-slate-950 font-extrabold text-xs transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            {candidateToEdit ? 'Save Changes' : 'Save Candidate'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
