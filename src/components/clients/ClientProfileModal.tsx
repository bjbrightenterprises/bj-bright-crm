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
      <div className="space-y-5 text-slate-900">
        {/* Header Profile Summary */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-[#0B1F4B] text-[#F5A623] flex items-center justify-center font-bold text-xl shadow-md shrink-0">
              {liveClient.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-extrabold text-slate-900">
                  {liveClient.name}
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${SECTION_BADGE_STYLES[section]}`}
                >
                  {CLIENT_SECTION_LABELS[section]}
                </span>
                {!canManageClients && (
                  <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 text-[10px] font-bold uppercase">
                    Read-Only View
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 flex items-center gap-2 flex-wrap mt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
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
                      className="text-blue-700 hover:underline flex items-center gap-1 font-bold break-all"
                    >
                      <Globe className="w-3 h-3 shrink-0" />
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
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#F5A623] hover:bg-amber-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <Bell className="w-4 h-4" />
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
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <MessageSquarePlus className="w-4 h-4" />
                  <span>Add Remark</span>
                </button>

                <button
                  onClick={() => onRequestMove(liveClient)}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#0B1F4B] hover:bg-[#163270] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <ArrowRightLeft className="w-4 h-4 text-[#F5A623]" />
                  <span>Move Section</span>
                </button>

                <button
                  onClick={() => onEdit(liveClient)}
                  className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 cursor-pointer"
                  title="Edit Company"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </>
            )}

            {isAdmin && (
              <button
                onClick={() => onRequestDelete(liveClient)}
                className="w-11 h-11 flex items-center justify-center rounded-xl text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 cursor-pointer"
                title="Move Company to Trash (Admin Only)"
              >
                <Trash2 className="w-4 h-4" />
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
                className="min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingRemark}
                className="min-h-[40px] px-4 py-1.5 rounded-lg bg-[#0B1F4B] hover:bg-[#163270] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {isSubmittingRemark ? 'Saving...' : 'Save Remark'}
              </button>
            </div>
          </form>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 gap-4 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`min-h-[44px] pb-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'border-[#0B1F4B] text-[#0B1F4B]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Overview & Contacts
          </button>
          <button
            onClick={() => setActiveTab('remarks')}
            className={`min-h-[44px] pb-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'remarks'
                ? 'border-[#0B1F4B] text-[#0B1F4B]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Remarks Timeline ({remarksList.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`min-h-[44px] pb-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'history'
                ? 'border-[#0B1F4B] text-[#0B1F4B]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Edit History ({editHistoryList.length})
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`min-h-[44px] pb-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'jobs'
                ? 'border-[#0B1F4B] text-[#0B1F4B]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Job Openings & JD ({clientJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('placements')}
            className={`min-h-[44px] pb-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'placements'
                ? 'border-[#0B1F4B] text-[#0B1F4B]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Placed Candidates ({placedCandidates.length})
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Company JD / Hiring Requirements Block */}
            <div className="p-4 rounded-xl border-2 border-[#0B1F4B]/15 bg-blue-50/40 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3 className="font-extrabold text-xs sm:text-sm text-[#0B1F4B] flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-[#F5A623]" />
                  <span>Company JD & Current Hiring Requirements</span>
                </h3>
                {canManageClients && !isEditingJd && (
                  <button
                    type="button"
                    onClick={handleStartEditJd}
                    className="min-h-[40px] px-3 py-1.5 rounded-lg bg-[#0B1F4B] hover:bg-[#163270] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5 text-[#F5A623]" />
                    <span>Edit JD</span>
                  </button>
                )}
              </div>

              {isEditingJd && canManageClients ? (
                <form onSubmit={handleSaveJd} className="space-y-3 pt-1">
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">
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
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B1F4B] leading-relaxed"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">
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
                      className="w-full min-h-[44px] px-3 py-1.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
                    />
                  </div>
                  {jdEditError && (
                    <p className="text-xs text-rose-600 font-semibold">{jdEditError}</p>
                  )}
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingJd(false);
                        setJdEditError('');
                      }}
                      className="min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="min-h-[40px] px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                    >
                      Save JD Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-1.5">
                  {liveClient.agreementDetails ? (
                    <div className="grid grid-cols-1 gap-1.5 text-xs text-slate-800">
                      {liveClient.agreementDetails
                        .split(/\||\n/)
                        .map((line) => line.trim())
                        .filter(Boolean)
                        .map((point, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#F5A623] shrink-0 mt-1.5" />
                            <span className="leading-relaxed font-medium text-slate-900">{point}</span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600 italic">
                      No JD / Hiring Requirement details added yet. Click "Edit JD" to add.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <h3 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#F5A623]" />
                  <span>Key Dates & Section Status</span>
                </h3>
                <div className="space-y-2 text-xs text-slate-700">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-slate-600">Current Section:</span>
                    <span className="font-bold text-slate-900">
                      {section} — {CLIENT_SECTION_LABELS[section]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-slate-600">Enquiry Received Date:</span>
                    <span className="font-semibold text-slate-900">
                      {formatIndianDate(liveClient.enquiryDate || liveClient.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-slate-600">Last Contacted Date:</span>
                    <span className="font-semibold text-slate-900">
                      {formatIndianDate(liveClient.lastContactedDate)}
                    </span>
                  </div>
                  {section === 'Green' && (
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                      <span className="text-emerald-800 font-bold">
                        Agreement Signed Date:
                      </span>
                      <span className="font-bold text-emerald-800">
                        {formatIndianDate(liveClient.agreementSignedDate)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Next Follow-up Date:</span>
                    <span
                      className={`font-bold ${
                        isFollowUpOverdue ? 'text-rose-700' : 'text-slate-900'
                      }`}
                    >
                      {formatIndianDate(liveClient.nextFollowUpDate)}
                      {isFollowUpOverdue ? ' (Overdue)' : ''}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <h3 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#F5A623]" />
                  <span>Commercial & Account Details</span>
                </h3>
                <div className="space-y-2 text-xs text-slate-700">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-slate-600">Industry:</span>
                    <span className="font-semibold text-slate-900">{liveClient.industry}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-slate-600">Commission Rate:</span>
                    <span className="font-extrabold text-[#0B1F4B]">
                      {liveClient.commissionPercent}% of annual CTC
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-slate-600">Payment Terms:</span>
                    <span className="font-semibold text-slate-900">
                      {liveClient.paymentTerms || '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Latest Remark:</span>
                    <span className="font-medium text-slate-800 truncate max-w-[220px]">
                      {remarksList[0]?.text || 'No remarks recorded yet'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Persons */}
            <div className="space-y-3">
              <h3 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#F5A623]" />
                <span>Authorized Contact Persons</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {liveClient.contactPersons.map((cp) => (
                  <div
                    key={cp.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white text-xs flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{cp.name}</p>
                      <p className="text-xs text-slate-600 font-medium">{cp.designation}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-700 mt-1 flex-wrap">
                        <a href={`tel:${cp.phone}`} className="flex items-center gap-1 font-semibold text-blue-700 hover:underline">
                          <Phone className="w-3 h-3 text-[#F5A623]" />
                          {cp.phone}
                        </a>
                        <a href={`mailto:${cp.email}`} className="flex items-center gap-1 font-semibold text-blue-700 hover:underline">
                          <Mail className="w-3 h-3 text-slate-500" />
                          {cp.email}
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Remarks Timeline */}
        {activeTab === 'remarks' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-xs text-slate-600">
                Permanent remarks timeline (newest first). Remarks cannot be edited or deleted.
              </p>
              {canManageClients && !showAddRemarkBox && (
                <button
                  onClick={() => setShowAddRemarkBox(true)}
                  className="min-h-[40px] px-3.5 py-1.5 rounded-lg bg-[#0B1F4B] hover:bg-[#163270] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageSquarePlus className="w-3.5 h-3.5 text-[#F5A623]" />
                  <span>Add Remark</span>
                </button>
              )}
            </div>

            {remarksList.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
                No remarks have been logged for {liveClient.name} yet.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {remarksList.map((rem) => {
                  const remSec: ClientSection = rem.section || section;
                  return (
                    <div
                      key={rem.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${SECTION_BADGE_STYLES[remSec]}`}
                          >
                            {remSec} — {CLIENT_SECTION_LABELS[remSec]}
                          </span>
                          <span className="font-bold text-slate-900">
                            {rem.authorName}
                          </span>
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

        {/* Tab 3: Edit History */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-600">
              Permanent audit log of all edits made to this company (who, when, old value, new value, and reason). Not editable by anyone.
            </p>
            {editHistoryList.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
                No edits recorded for {liveClient.name} yet.
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {editHistoryList.map((eh) => (
                  <div
                    key={eh.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <History className="w-3.5 h-3.5 text-[#F5A623]" />
                        <span className="font-bold text-slate-900">
                          {eh.editedByUserName}
                        </span>
                        <span className="text-[10px] uppercase text-slate-600 font-bold">
                          ({eh.editedByUserRole})
                        </span>
                      </div>
                      <span className="text-xs text-slate-600">
                        {formatISTDateTime(eh.timestamp)}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs">
                      <span className="font-bold text-amber-950">Reason: </span>
                      <span className="text-slate-800">{eh.reason}</span>
                    </div>
                    {eh.changes.length > 0 && (
                      <div className="space-y-1 pt-1">
                        {eh.changes.map((chg, idx) => (
                          <div
                            key={idx}
                            className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs py-1 border-t border-slate-100"
                          >
                            <span className="font-bold text-slate-700 capitalize">
                              {chg.field}:
                            </span>
                            <span className="text-rose-700 line-through truncate">
                              {typeof chg.oldValue === 'object'
                                ? JSON.stringify(chg.oldValue)
                                : String(chg.oldValue ?? '-')}
                            </span>
                            <span className="text-emerald-800 font-semibold truncate">
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
              <p className="text-xs text-slate-600">
                Active Job Openings and full JD requirements mapped to {liveClient.name}.
              </p>
              {canManageClients && (
                <button
                  type="button"
                  onClick={() => onOpenCreateJobForClient(liveClient)}
                  className="min-h-[40px] px-3.5 py-1.5 rounded-lg bg-[#0B1F4B] hover:bg-[#163270] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Briefcase className="w-3.5 h-3.5 text-[#F5A623]" />
                  <span>+ Add New Job / JD</span>
                </button>
              )}
            </div>

            {clientJobs.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
                No active job openings mapped to this client currently.
              </div>
            ) : (
              clientJobs.map((j) => (
                <div
                  key={j.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 text-xs"
                >
                  {editingJobId === j.id && canManageClients ? (
                    <form onSubmit={(e) => handleSaveJobEdit(e, j.id)} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <label className="text-xs font-bold text-slate-800 block mb-1">
                            Job Role / Title *
                          </label>
                          <input
                            type="text"
                            value={jobTitleDraft}
                            onChange={(e) => setJobTitleDraft(e.target.value)}
                            className="w-full min-h-[44px] px-3 py-1.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-800 block mb-1">
                            Positions (Openings)
                          </label>
                          <input
                            type="number"
                            inputMode="numeric"
                            min={1}
                            value={jobPositionsDraft}
                            onChange={(e) => setJobPositionsDraft(Number(e.target.value) || 1)}
                            className="w-full min-h-[44px] px-3 py-1.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-800 block mb-1">
                            Location / Office Address
                          </label>
                          <input
                            type="text"
                            value={jobLocationDraft}
                            onChange={(e) => setJobLocationDraft(e.target.value)}
                            className="w-full min-h-[44px] px-3 py-1.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-800 block mb-1">
                            Salary Range (LPA Min – Max)
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              inputMode="decimal"
                              step="0.05"
                              value={jobSalaryMinDraft}
                              onChange={(e) => setJobSalaryMinDraft(Number(e.target.value) || 0)}
                              className="w-full min-h-[44px] px-2.5 py-1.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-900"
                            />
                            <span>to</span>
                            <input
                              type="number"
                              inputMode="decimal"
                              step="0.05"
                              value={jobSalaryMaxDraft}
                              onChange={(e) => setJobSalaryMaxDraft(Number(e.target.value) || 0)}
                              className="w-full min-h-[44px] px-2.5 py-1.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-900"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-800 block mb-1">
                            Experience (Years Min – Max)
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              inputMode="decimal"
                              step="0.5"
                              value={jobMinExpDraft}
                              onChange={(e) => setJobMinExpDraft(Number(e.target.value) || 0)}
                              className="w-full min-h-[44px] px-2.5 py-1.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-900"
                            />
                            <span>to</span>
                            <input
                              type="number"
                              inputMode="decimal"
                              step="0.5"
                              value={jobMaxExpDraft}
                              onChange={(e) => setJobMaxExpDraft(Number(e.target.value) || 0)}
                              className="w-full min-h-[44px] px-2.5 py-1.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-900"
                            />
                          </div>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs font-bold text-slate-800 block mb-1">
                            Required Skills (comma separated)
                          </label>
                          <input
                            type="text"
                            value={jobSkillsDraft}
                            onChange={(e) => setJobSkillsDraft(e.target.value)}
                            className="w-full min-h-[44px] px-3 py-1.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-900"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs font-bold text-slate-800 block mb-1">
                            Full Job Description (JD) & Eligibility Details *
                          </label>
                          <textarea
                            rows={4}
                            value={jobDescDraft}
                            onChange={(e) => setJobDescDraft(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 leading-relaxed"
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
                            className="w-full min-h-[44px] px-3 py-1.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-900"
                          />
                        </div>
                      </div>
                      {jobEditError && (
                        <p className="text-xs text-rose-600 font-semibold">{jobEditError}</p>
                      )}
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingJobId(null);
                            setJobEditError('');
                          }}
                          className="min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="min-h-[40px] px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                        >
                          Save Job JD
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-sm text-slate-900">
                              {j.title}
                            </span>
                            <Badge variant={j.status === 'Open' ? 'success' : 'neutral'} size="sm">
                              {j.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">
                            {j.positions} Positions • Budget: ₹{j.salaryMinLPA}–{j.salaryMaxLPA} LPA •{' '}
                            {j.minExpYears}–{j.maxExpYears} yrs Exp • {j.location}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {canManageClients && (
                            <button
                              type="button"
                              onClick={() => handleStartEditJob(j)}
                              className="min-h-[38px] px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5 text-[#F5A623]" />
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
                              className="px-2 py-0.5 rounded-md bg-blue-50 text-[#0B1F4B] text-[10px] font-bold border border-blue-200"
                            >
                              {sk}
                            </span>
                          ))}
                        </div>
                      )}

                      {j.description && (
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-600 block">
                            Full Job Description (JD) & Requirements
                          </span>
                          <div className="space-y-1 text-slate-800 leading-relaxed">
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
              <div className="py-8 text-center text-xs text-slate-500">
                No candidates placed with {liveClient.name} yet.
              </div>
            ) : (
              placedCandidates.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs gap-3 flex-wrap"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-900 font-bold flex items-center justify-center">
                      {c.fullName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{c.fullName}</p>
                      <p className="text-xs text-slate-600">
                        {c.skills.slice(0, 3).join(', ')} • {c.experienceYears}y Exp
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-800 block">
                      ₹{c.currentSalaryLPA || c.expectedSalaryLPA} LPA CTC
                    </span>
                    <span className="text-xs text-slate-600">Status: {c.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

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
