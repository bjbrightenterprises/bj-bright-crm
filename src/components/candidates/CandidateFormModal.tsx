import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Candidate, CandidateStatus } from '../../types/crm';
import { useCRM } from '../../context/CRMContext';
import { AlertTriangle, X, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';

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
  const [jobId, setJobId] = useState('');
  const [source, setSource] = useState<Candidate['source']>('Naukri');

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
      setJobId(candidateToEdit.jobId || '');
      setEditReason('');
      setShowMoreDetails(false);
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
      setJobId('');
      setEditReason('');
      setShowMoreDetails(false);
    }

    setErrors({});
    setDuplicateMatch(null);
    setConfirmDuplicate(false);
    setSuccessMessage('');
  }, [candidateToEdit, isOpen, currentUser]);

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

    if (candidateToEdit) {
      const finalReason = editReason.trim() || quickReasonOption;
      if (finalReason.length < 10) {
        newErrors.editReason = 'Mandatory edit reason must be at least 10 characters long.';
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
    const assignedJob = jobs.find((j) => j.id === jobId);

    if (candidateToEdit) {
      const finalReason = editReason.trim() || quickReasonOption;
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
          jobId: jobId || undefined,
          jobTitle: assignedJob?.title || undefined,
          clientId: assignedJob?.clientId || undefined,
          clientName: assignedJob?.clientName || undefined,
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
        jobId: jobId || undefined,
        jobTitle: assignedJob?.title || undefined,
        clientId: assignedJob?.clientId || undefined,
        clientName: assignedJob?.clientName || undefined,
      });

      if (res.success) {
        setSuccessMessage('Candidate added successfully!');
        if (addAnother) {
          setFullName('');
          setPhone('+91 ');
          setEmail('');
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
              A candidate with matching mobile or email already exists: <strong>{duplicateMatch.fullName}</strong> ({duplicateMatch.phone}, {duplicateMatch.email}), Assigned to: {duplicateMatch.assignedRecruiterName}.
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
            {errors.duplicate && <p className="text-xs text-rose-700 font-bold">{errors.duplicate}</p>}
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
            {errors.fullName && <p className="text-xs text-rose-600 font-semibold mt-1">{errors.fullName}</p>}
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
            {errors.phone && <p className="text-xs text-rose-600 font-semibold mt-1">{errors.phone}</p>}
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
            {errors.email && <p className="text-xs text-rose-600 font-semibold mt-1">{errors.email}</p>}
          </div>

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
            <label className="block text-xs font-bold text-slate-800 mb-1">Total Experience (Years)</label>
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
            {errors.experienceYears && <p className="text-xs text-rose-600 font-semibold mt-1">{errors.experienceYears}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Position / Job Applied For</label>
            <select
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-[#0B1F4B] focus:outline-none"
            >
              <option value="">General Talent Pool / Unassigned</option>
              {jobs.filter((j) => j.status === 'Open').map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} — {j.clientName}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-800 mb-1">Source</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as any)}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-[#0B1F4B] focus:outline-none"
            >
              {companySettings.availableSources.map((s) => (
                <option key={s} value={s}>{s}</option>
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
            <span>{showMoreDetails ? 'Hide More Details' : 'More Details (Salary, Education, Skills, Recruiter)'}</span>
            {showMoreDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showMoreDetails && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 mt-2 bg-slate-50 border border-slate-200 p-4 rounded-xl">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Current Company</label>
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
                <label className="block text-xs font-bold text-slate-800 mb-1">Current Salary (LPA)</label>
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
                <label className="block text-xs font-bold text-slate-800 mb-1">Expected Salary (LPA)</label>
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
                  <p className="text-xs text-amber-800 font-semibold mt-1">Warning: Expected salary is lower than current salary.</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-800 mb-1">Skills</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
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
                <label className="block text-xs font-bold text-slate-800 mb-1">Assigned Recruiter</label>
                <select
                  value={assignedRecruiterId}
                  onChange={(e) => setAssignedRecruiterId(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-[#0B1F4B] focus:outline-none"
                >
                  {users.filter(u => u.active).map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Candidate Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as CandidateStatus)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-[#0B1F4B] focus:outline-none"
                >
                  {['New', 'Screened', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Offered', 'Placed', 'Rejected', 'On Hold'].map((st) => (
                    <option key={st} value={st}>{st}</option>
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
              Purpose / Reason for Edit <span className="text-rose-600">*</span> (Mandatory, min 10 chars)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {['Candidate updated details', 'Correction of wrong entry', 'New information received', 'Status update', 'Other'].map((opt) => (
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
            {errors.editReason && <p className="text-xs text-rose-600 font-bold">{errors.editReason}</p>}
          </div>
        )}
      </div>
    </Modal>
  );
};
