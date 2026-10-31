import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import {
  Client,
  ClientSection,
  CLIENT_SECTION_LABELS,
  getClientSection,
  formatIndianDate,
} from '../../types/crm';
import { useCRM } from '../../context/CRMContext';
import {
  Building2,
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
  Calendar,
} from 'lucide-react';
import { SetReminderModal } from '../reminders/SetReminderModal';

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
  Green: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
  Blue: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
  Red: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
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
    canCreateTasks,
    addClientRemark,
    updateClient,
    updateJob,
    getEditHistory,
  } = useCRM();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'remarks' | 'history' | 'jobs' | 'placements'
  >('overview');
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [showAddRemarkBox, setShowAddRemarkBox] = useState(false);
  const [newRemarkText, setNewRemarkText] = useState('');
  const [remarkError, setRemarkError] = useState('');
  const [isSubmittingRemark, setIsSubmittingRemark] = useState(false);

  // Inline Company JD editing state
  const [isEditingJd, setIsEditingJd] = useState(false);
  const [jdDraft, setJdDraft] = useState('');
  const [jdEditReason, setJdEditReason] = useState('');
  const [jdEditError, setJdEditError] = useState('');

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

  if (!client) return null;

  // Always read fresh client state from context so newly added remarks/edits reflect immediately
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
      (c.status === 'Joined' || c.status === 'Offered')
  );

  const remarksList = [...(liveClient.remarks || [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const editHistoryList = getEditHistory(liveClient.id);

  const handleStartEditJd = () => {
    if (!canManageClients) return;
    setJdDraft(liveClient.agreementDetails || '');
    setJdEditReason('Updated company JD and hiring requirement details');
    setJdEditError('');
    setIsEditingJd(true);
  };

  const handleSaveJd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageClients) return;
    const trimmedJd = jdDraft.trim();
    const trimmedReason = jdEditReason.trim();
    if (!trimmedJd) {
      setJdEditError('Please enter the JD / Hiring Requirement details.');
      return;
    }
    if (trimmedReason.length < 10) {
      setJdEditError('Reason for edit must be at least 10 characters.');
      return;
    }
    updateClient(liveClient.id, { agreementDetails: trimmedJd }, trimmedReason);
    setIsEditingJd(false);
    setJdEditError('');
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
    setActiveTab('remarks');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={liveClient.name}
      subtitle={`Corporate Client Profile • ${liveClient.industry} • ${liveClient.city}`}
      maxWidth="4xl"
    >
      <div className="space-y-5">
        {/* Header Profile Summary */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-50 to-blue-50/40 dark:from-slate-800/80 dark:to-slate-850 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#0B1F4B] text-[#F5A623] flex items-center justify-center font-bold text-xl shadow-md shrink-0">
              {liveClient.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {liveClient.name}
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${SECTION_BADGE_STYLES[section]}`}
                >
                  {CLIENT_SECTION_LABELS[section]}
                </span>
                {!canManageClients && (
                  <span className="px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase">
                    Read-Only View
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-2 flex-wrap mt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {liveClient.address ? `${liveClient.address}, ` : ''}
                  {liveClient.city}
                </span>
                {liveClient.website && (
                  <>
                    <span>•</span>
                    <a
                      href={liveClient.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Globe className="w-3 h-3" />
                      {liveClient.website}
                    </a>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {canCreateTasks && (
              <button
                onClick={() => setIsReminderOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Set Reminder</span>
              </button>
            )}

            {canManageClients && (
              <>
                <button
                  onClick={() => {
                    setShowAddRemarkBox((prev) => !prev);
                    setRemarkError('');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <MessageSquarePlus className="w-3.5 h-3.5" />
                  <span>Add Remark</span>
                </button>

                <button
                  onClick={() => onRequestMove(liveClient)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-[#F5A623]" />
                  <span>Move Section</span>
                </button>

                <button
                  onClick={() => onEdit(liveClient)}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
                  title="Edit Company"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </>
            )}

            {isAdmin && (
              <button
                onClick={() => onRequestDelete(liveClient)}
                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                title="Move Company to Trash (Admin Only)"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Inline Add Remark Form (Admin, Manager, HR Executive) */}
        {canManageClients && showAddRemarkBox && (
          <form
            onSubmit={handleAddRemarkSubmit}
            className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <MessageSquarePlus className="w-4 h-4 text-blue-600" />
                <span>Log New Client Remark (Section: {CLIENT_SECTION_LABELS[section]})</span>
              </label>
              <span className="text-[10px] text-slate-500 font-mono">
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
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
            />
            {remarkError && (
              <p className="text-[11px] text-rose-600 font-semibold">{remarkError}</p>
            )}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddRemarkBox(false);
                  setNewRemarkText('');
                  setRemarkError('');
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200/60 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingRemark}
                className="px-4 py-1.5 rounded-lg bg-[#0B1F4B] hover:bg-[#163270] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {isSubmittingRemark ? 'Saving...' : 'Save Remark'}
              </button>
            </div>
          </form>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-5 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'border-[#0B1F4B] dark:border-amber-400 text-[#0B1F4B] dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Overview & Contacts
          </button>
          <button
            onClick={() => setActiveTab('remarks')}
            className={`pb-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'remarks'
                ? 'border-[#0B1F4B] dark:border-amber-400 text-[#0B1F4B] dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Remarks Timeline ({remarksList.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'history'
                ? 'border-[#0B1F4B] dark:border-amber-400 text-[#0B1F4B] dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Edit History ({editHistoryList.length})
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`pb-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'jobs'
                ? 'border-[#0B1F4B] dark:border-amber-400 text-[#0B1F4B] dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Job Openings & JD ({clientJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('placements')}
            className={`pb-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'placements'
                ? 'border-[#0B1F4B] dark:border-amber-400 text-[#0B1F4B] dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Placed Candidates ({placedCandidates.length})
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Company JD / Hiring Requirements Block with Inline Edit */}
            <div className="p-4 rounded-xl border-2 border-[#0B1F4B]/15 dark:border-amber-500/30 bg-blue-50/40 dark:bg-slate-800/70 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3 className="font-extrabold text-xs sm:text-sm text-[#0B1F4B] dark:text-amber-400 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-[#F5A623]" />
                  <span>Company JD & Current Hiring Requirements</span>
                </h3>
                {canManageClients && !isEditingJd && (
                  <button
                    type="button"
                    onClick={handleStartEditJd}
                    className="px-3 py-1.5 rounded-lg bg-[#0B1F4B] hover:bg-[#163270] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5 text-[#F5A623]" />
                    <span>Edit JD</span>
                  </button>
                )}
              </div>

              {isEditingJd && canManageClients ? (
                <form onSubmit={handleSaveJd} className="space-y-3 pt-1">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Job Description (JD), Role, Eligibility, Salary, Shift & Location *
                    </label>
                    <textarea
                      rows={5}
                      value={jdDraft}
                      onChange={(e) => {
                        setJdDraft(e.target.value);
                        setJdEditError('');
                      }}
                      placeholder="Enter Role, Process, Eligibility & Skills, Salary & Benefits, Working Hours, Office Address..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B1F4B] leading-relaxed"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Reason for editing JD * (Minimum 10 characters — logged in Edit History)
                    </label>
                    <input
                      type="text"
                      value={jdEditReason}
                      onChange={(e) => {
                        setJdEditReason(e.target.value);
                        setJdEditError('');
                      }}
                      placeholder="e.g. Updated salary range and shift timing in company JD"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
                    />
                  </div>
                  {jdEditError && (
                    <p className="text-[11px] text-rose-600 font-semibold">{jdEditError}</p>
                  )}
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingJd(false);
                        setJdEditError('');
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200/70 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                    >
                      Save JD Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-1.5">
                  {liveClient.agreementDetails ? (
                    <div className="grid grid-cols-1 gap-1.5 text-xs text-slate-800 dark:text-slate-200">
                      {liveClient.agreementDetails
                        .split(/\||\n/)
                        .map((line) => line.trim())
                        .filter(Boolean)
                        .map((point, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2 bg-white/80 dark:bg-slate-900/70 px-3 py-1.5 rounded-lg border border-slate-200/70 dark:border-slate-800"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#F5A623] shrink-0 mt-1.5" />
                            <span className="leading-relaxed font-medium">{point}</span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">
                      No JD / Hiring Requirement details added yet. Click "Edit JD" to add.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-3">
                <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#F5A623]" />
                  <span>Key Dates & Section Status</span>
                </h3>
                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    <span className="text-slate-400">Current Section:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {section} — {CLIENT_SECTION_LABELS[section]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    <span className="text-slate-400">Enquiry Received Date:</span>
                    <span className="font-semibold">
                      {formatIndianDate(liveClient.enquiryDate || liveClient.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    <span className="text-slate-400">Last Contacted Date:</span>
                    <span className="font-semibold">
                      {formatIndianDate(liveClient.lastContactedDate)}
                    </span>
                  </div>
                  {section === 'Green' && (
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                        Agreement Signed Date:
                      </span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        {formatIndianDate(liveClient.agreementSignedDate)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Next Follow-up Date:</span>
                    <span
                      className={`font-bold ${
                        isFollowUpOverdue
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {formatIndianDate(liveClient.nextFollowUpDate)}
                      {isFollowUpOverdue ? ' (Overdue)' : ''}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-3">
                <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#F5A623]" />
                  <span>Commercial & Account Details</span>
                </h3>
                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    <span className="text-slate-400">Industry:</span>
                    <span className="font-semibold">{liveClient.industry}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    <span className="text-slate-400">Commission Rate:</span>
                    <span className="font-extrabold text-blue-600 dark:text-amber-400">
                      {liveClient.commissionPercent}% of annual CTC
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    <span className="text-slate-400">Payment Terms:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {liveClient.paymentTerms || '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Latest Remark:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[220px]">
                      {remarksList[0]?.text || 'No remarks recorded yet'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Persons */}
            <div className="space-y-3">
              <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-[#F5A623]" />
                <span>Authorized Contact Persons</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {liveClient.contactPersons.map((cp) => (
                  <div
                    key={cp.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{cp.name}</p>
                      <p className="text-[11px] text-slate-500 font-medium">{cp.designation}</p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-400 mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-[#F5A623]" />
                          {cp.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {cp.email}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Remarks Timeline (newest first, permanent & non-editable) */}
        {activeTab === 'remarks' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Permanent remarks timeline (newest first). Remarks cannot be edited or deleted.
              </p>
              {canManageClients && !showAddRemarkBox && (
                <button
                  onClick={() => setShowAddRemarkBox(true)}
                  className="px-3 py-1.5 rounded-lg bg-[#0B1F4B] hover:bg-[#163270] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageSquarePlus className="w-3.5 h-3.5 text-[#F5A623]" />
                  <span>Add Remark</span>
                </button>
              )}
            </div>

            {remarksList.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                No remarks have been logged for {liveClient.name} yet.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {remarksList.map((rem) => {
                  const remSec: ClientSection = rem.section || section;
                  return (
                    <div
                      key={rem.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${SECTION_BADGE_STYLES[remSec]}`}
                          >
                            {remSec} — {CLIENT_SECTION_LABELS[remSec]}
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {rem.authorName}
                          </span>
                          <span className="text-[10px] uppercase text-slate-400 font-semibold">
                            ({rem.authorRole.replace('_', ' ')})
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatISTDateTime(rem.createdAt)}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {rem.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Edit History (immutable) */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Permanent audit log of all edits made to this company (who, when, old value, new value, and reason). Not editable by anyone.
            </p>
            {editHistoryList.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                No edits recorded for {liveClient.name} yet.
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {editHistoryList.map((eh) => (
                  <div
                    key={eh.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <History className="w-3.5 h-3.5 text-[#F5A623]" />
                        <span className="font-bold text-slate-900 dark:text-white">
                          {eh.editedByUserName}
                        </span>
                        <span className="text-[10px] uppercase text-slate-400 font-bold">
                          ({eh.editedByUserRole})
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {formatISTDateTime(eh.timestamp)}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/60 text-[11px]">
                      <span className="font-bold text-amber-900 dark:text-amber-300">Reason: </span>
                      <span className="text-slate-700 dark:text-slate-300">{eh.reason}</span>
                    </div>
                    {eh.changes.length > 0 && (
                      <div className="space-y-1 pt-1">
                        {eh.changes.map((chg, idx) => (
                          <div
                            key={idx}
                            className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] py-1 border-t border-slate-100 dark:border-slate-800"
                          >
                            <span className="font-bold text-slate-500 capitalize">
                              {chg.field}:
                            </span>
                            <span className="text-rose-600 dark:text-rose-400 line-through truncate">
                              {typeof chg.oldValue === 'object'
                                ? JSON.stringify(chg.oldValue)
                                : String(chg.oldValue ?? '-')}
                            </span>
                            <span className="text-emerald-700 dark:text-emerald-400 font-semibold truncate">
                              {typeof chg.newValue === 'object'
                                ? JSON.stringify(chg.newValue)
                                : String(chg.newValue ?? '-')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Job Openings & JD */}
        {activeTab === 'jobs' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-xs text-slate-500">
                Active Job Openings and full JD requirements mapped to {liveClient.name}.
              </p>
              {canManageClients && (
                <button
                  type="button"
                  onClick={() => onOpenCreateJobForClient(liveClient)}
                  className="px-3 py-1.5 rounded-lg bg-[#0B1F4B] hover:bg-[#163270] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Briefcase className="w-3.5 h-3.5 text-[#F5A623]" />
                  <span>+ Add New Job / JD</span>
                </button>
              )}
            </div>

            {clientJobs.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                No active job openings mapped to this client currently.
              </div>
            ) : (
              clientJobs.map((j) => (
                <div
                  key={j.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 text-xs"
                >
                  {editingJobId === j.id && canManageClients ? (
                    <form onSubmit={(e) => handleSaveJobEdit(e, j.id)} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                            Job Role / Title *
                          </label>
                          <input
                            type="text"
                            value={jobTitleDraft}
                            onChange={(e) => setJobTitleDraft(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                            Positions (Openings)
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={jobPositionsDraft}
                            onChange={(e) => setJobPositionsDraft(Number(e.target.value) || 1)}
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                            Location / Office Address
                          </label>
                          <input
                            type="text"
                            value={jobLocationDraft}
                            onChange={(e) => setJobLocationDraft(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                            Salary Range (LPA Min – Max)
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="0.05"
                              value={jobSalaryMinDraft}
                              onChange={(e) => setJobSalaryMinDraft(Number(e.target.value) || 0)}
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                            />
                            <span>to</span>
                            <input
                              type="number"
                              step="0.05"
                              value={jobSalaryMaxDraft}
                              onChange={(e) => setJobSalaryMaxDraft(Number(e.target.value) || 0)}
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                            Experience (Years Min – Max)
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="0.5"
                              value={jobMinExpDraft}
                              onChange={(e) => setJobMinExpDraft(Number(e.target.value) || 0)}
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                            />
                            <span>to</span>
                            <input
                              type="number"
                              step="0.5"
                              value={jobMaxExpDraft}
                              onChange={(e) => setJobMaxExpDraft(Number(e.target.value) || 0)}
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                            />
                          </div>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                            Required Skills (comma separated)
                          </label>
                          <input
                            type="text"
                            value={jobSkillsDraft}
                            onChange={(e) => setJobSkillsDraft(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                            Full Job Description (JD) & Eligibility Details *
                          </label>
                          <textarea
                            rows={4}
                            value={jobDescDraft}
                            onChange={(e) => setJobDescDraft(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 leading-relaxed"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                            Reason for Edit *
                          </label>
                          <input
                            type="text"
                            value={jobEditReason}
                            onChange={(e) => setJobEditReason(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                          />
                        </div>
                      </div>
                      {jobEditError && (
                        <p className="text-[11px] text-rose-600 font-semibold">{jobEditError}</p>
                      )}
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingJobId(null);
                            setJobEditError('');
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                        >
                          Save Job JD
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                              {j.title}
                            </span>
                            <Badge variant={j.status === 'Open' ? 'success' : 'neutral'} size="sm">
                              {j.status}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {j.positions} Positions • Budget: ₹{j.salaryMinLPA}–{j.salaryMaxLPA} LPA •{' '}
                            {j.minExpYears}–{j.maxExpYears} yrs Exp • {j.location}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {canManageClients && (
                            <button
                              type="button"
                              onClick={() => handleStartEditJob(j)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Edit className="w-3 h-3 text-[#F5A623]" />
                              <span>Edit JD</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {j.skillsRequired && j.skillsRequired.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {j.skillsRequired.map((sk, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold border border-blue-200/60 dark:border-blue-800/60"
                            >
                              {sk}
                            </span>
                          ))}
                        </div>
                      )}

                      {j.description && (
                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Full Job Description (JD) & Requirements
                          </span>
                          <div className="space-y-1 text-slate-700 dark:text-slate-300 leading-relaxed">
                            {j.description
                              .split(/\||\n/)
                              .map((s) => s.trim())
                              .filter(Boolean)
                              .map((part, i) => (
                                <p key={i} className="flex items-start gap-1.5">
                                  <span className="text-[#F5A623] font-bold">•</span>
                                  <span>{part}</span>
                                </p>
                              ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 5: Placed Candidates */}
        {activeTab === 'placements' && (
          <div className="space-y-3">
            {placedCandidates.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No candidates placed with {liveClient.name} yet.
              </div>
            ) : (
              placedCandidates.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center">
                      {c.fullName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{c.fullName}</p>
                      <p className="text-[11px] text-slate-500">
                        {c.skills.slice(0, 3).join(', ')} • {c.experienceYears}y Exp
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                      ₹{c.currentSalaryLPA || c.expectedSalaryLPA} LPA CTC
                    </span>
                    <span className="text-[10px] text-slate-400">Status: {c.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Set Reminder Modal for Client */}
      <SetReminderModal
        isOpen={isReminderOpen}
        onClose={() => setIsReminderOpen(false)}
        relatedType="client"
        relatedId={liveClient.id}
        relatedName={liveClient.name}
        defaultTitle={`Follow up with ${liveClient.name} regarding contracts & hiring`}
      />
    </Modal>
  );
};
