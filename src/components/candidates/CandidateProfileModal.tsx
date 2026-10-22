import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { Candidate } from '../../types/crm';
import { useCRM } from '../../context/CRMContext';
import {
  Phone,
  Mail,
  MapPin,
  Briefcase,
  IndianRupee,
  FileText,
  Calendar,
  MessageSquare,
  Clock,
  Send,
  ExternalLink,
  Edit,
  Trash2,
  Share2,
  CheckCircle2,
  Bell,
  ArrowRight,
} from 'lucide-react';
import { SetReminderModal } from '../reminders/SetReminderModal';
import { WhatsAppModal } from './WhatsAppModal';
import { StatusRemarkModal } from './StatusRemarkModal';

interface CandidateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
  onEdit: (c: Candidate) => void;
  onScheduleInterview: (c: Candidate) => void;
}

export const CandidateProfileModal: React.FC<CandidateProfileModalProps> = ({
  isOpen,
  onClose,
  candidate,
  onEdit,
  onScheduleInterview,
}) => {
  const { addCandidateNote, deleteCandidate, updateCandidate, canCreateTasks, currentUser, getEditHistory } = useCRM();
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'timeline'>('overview');
  const [newNoteText, setNewNoteText] = useState('');
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [statusChangeTarget, setStatusChangeTarget] = useState<Candidate['status'] | null>(null);
  const [isEditingRemarks, setIsEditingRemarks] = useState(false);
  const [editedRemarks, setEditedRemarks] = useState('');
  const [remarksSaveMsg, setRemarksSaveMsg] = useState(false);

  useEffect(() => {
    if (candidate) {
      setEditedRemarks(candidate.remarks || '');
      setIsEditingRemarks(false);
    }
  }, [candidate]);

  if (!candidate) return null;

  const handleSaveRemarks = () => {
    const trimmed = editedRemarks.trim();
    updateCandidate(
      candidate.id,
      trimmed ? { remarks: trimmed } : { remarks: '' },
      'Updated candidate remarks'
    );
    setIsEditingRemarks(false);
    setRemarksSaveMsg(true);
    setTimeout(() => setRemarksSaveMsg(false), 2500);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    addCandidateNote(candidate.id, newNoteText.trim());
    setNewNoteText('');
  };

  const handleConfirmStatusRemark = (remark?: string) => {
    if (!statusChangeTarget) return;
    const trimmed = remark?.trim();
    const updates: Partial<Candidate> = {
      status: statusChangeTarget,
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
      `Status changed from ${candidate.status} to ${statusChangeTarget}${trimmed ? `: "${trimmed}"` : ''}`
    );
    if (trimmed) {
      addCandidateNote(candidate.id, `Status changed to ${statusChangeTarget} — Remark: ${trimmed}`);
    }
    setStatusChangeTarget(null);
  };

  const statusHistory = React.useMemo(() => {
    if (!candidate) return [];
    const eh = getEditHistory(candidate.id);
    return eh.filter(
      (item) =>
        item.changes.some((c) => c.field === 'status' || c.field === 'statusRemark') ||
        item.reason.toLowerCase().includes('status') ||
        item.reason.toLowerCase().includes('remark')
    );
  }, [candidate, getEditHistory]);

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete candidate ${candidate.fullName}?`)) {
      deleteCandidate(candidate.id);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={candidate.fullName}
      subtitle={`Candidate ID: #BJB-${candidate.id.slice(-6).toUpperCase()} • Noida HR Consultancy`}
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#0B1F4B] text-white flex items-center justify-center font-bold text-xl shadow-md border-2 border-[#F5A623]">
              {candidate.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {candidate.fullName}
                </h2>
                <Badge
                  variant={
                    candidate.status === 'Joined'
                      ? 'success'
                      : candidate.status === 'Offered'
                      ? 'gold'
                      : candidate.status === 'Rejected'
                      ? 'danger'
                      : 'primary'
                  }
                >
                  {candidate.status}
                </Badge>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                <span>{candidate.currentCompany}</span>
                {candidate.jobTitle && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-semibold text-[#0B1F4B] dark:text-[#F5A623]">
                      <Briefcase className="w-3 h-3 text-[#F5A623]" />
                      {candidate.jobTitle}
                      {candidate.isCustomPosition && (
                        <span className="text-[10px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-bold">
                          Custom
                        </span>
                      )}
                    </span>
                  </>
                )}
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#F5A623]" />
                  {candidate.city}
                </span>
                <span>•</span>
                <span>{candidate.experienceYears} Years Exp</span>
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsWhatsAppOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Message on WhatsApp"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12.031 2C6.511 2 2.022 6.488 2.022 12.008c0 1.83.498 3.548 1.365 5.029L2 22l5.12-1.341a9.98 9.98 0 0 0 4.911 1.357h.004c5.518 0 10.007-4.488 10.007-10.008 0-2.673-1.041-5.186-2.932-7.077A9.954 9.954 0 0 0 12.031 2zm0 18.23h-.003a8.214 8.214 0 0 1-4.187-1.15l-.3-.178-3.111.816.83-3.033-.196-.312a8.21 8.21 0 0 1-1.258-4.365c0-4.542 3.696-8.238 8.238-8.238 2.2 0 4.269.858 5.825 2.414a8.203 8.203 0 0 1 2.41 5.824c0 4.543-3.696 8.242-8.248 8.242zm4.518-6.166c-.248-.124-1.467-.724-1.694-.807-.228-.083-.394-.124-.56.124-.166.248-.642.807-.787.973-.145.166-.29.186-.538.062-.248-.124-1.047-.386-1.995-1.231-.738-.658-1.236-1.472-1.381-1.72-.145-.248-.016-.382.108-.506.112-.112.248-.29.373-.435.124-.145.166-.248.248-.414.083-.166.042-.311-.021-.435-.062-.124-.56-1.35-.767-1.85-.202-.486-.407-.42-.56-.428l-.477-.008c-.166 0-.435.062-.663.311-.228.248-.871.851-.871 2.074 0 1.223.891 2.404 1.016 2.57.124.166 1.753 2.678 4.248 3.755.594.256 1.058.409 1.42.524.597.19 1.14.163 1.569.099.479-.071 1.467-.6 1.674-1.18.207-.58.207-1.077.145-1.18-.062-.104-.228-.166-.476-.29z"/>
              </svg>
              <span>Message on WhatsApp</span>
            </button>

            <button
              onClick={() => onScheduleInterview(candidate)}
              className="px-3 py-1.5 rounded-lg bg-[#0B1F4B] hover:bg-[#163270] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 text-[#F5A623]" />
              <span>Schedule Interview</span>
            </button>

            {canCreateTasks && (
              <button
                onClick={() => setIsReminderOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                title="Set a follow-up reminder for this candidate"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Set Reminder</span>
              </button>
            )}

            <button
              onClick={() => onEdit(candidate)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
              title="Edit Candidate"
            >
              <Edit className="w-4 h-4" />
            </button>

            <button
              onClick={handleDelete}
              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              title="Delete Candidate"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-[#0B1F4B] dark:border-[#F5A623] text-[#0B1F4B] dark:text-[#F5A623]'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Overview & Details
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'notes'
                ? 'border-[#0B1F4B] dark:border-[#F5A623] text-[#0B1F4B] dark:text-[#F5A623]'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Recruiter Notes ({candidate.notes?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'timeline'
                ? 'border-[#0B1F4B] dark:border-[#F5A623] text-[#0B1F4B] dark:text-[#F5A623]'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Activity Timeline</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Remarks Section (Visible to every role, directly editable) */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#F5A623]" />
                  Remarks
                </h3>
                {!isEditingRemarks ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditedRemarks(candidate.remarks || '');
                      setIsEditingRemarks(true);
                    }}
                    className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Edit className="w-3 h-3" />
                    <span>{candidate.remarks ? 'Edit Remark' : 'Add Remark'}</span>
                  </button>
                ) : (
                  <span className={`text-[10px] font-mono ${editedRemarks.length > 480 ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                    {editedRemarks.length}/500
                  </span>
                )}
              </div>

              {remarksSaveMsg && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Remarks updated successfully</span>
                </div>
              )}

              {isEditingRemarks ? (
                <div className="space-y-2">
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={editedRemarks}
                    onChange={(e) => setEditedRemarks(e.target.value)}
                    placeholder="Any remark about this candidate, e.g. speaks fluent English, can join in 15 days"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B1F4B] dark:focus:ring-[#F5A623] resize-none"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditedRemarks(candidate.remarks || '');
                        setIsEditingRemarks(false);
                      }}
                      className="px-3 py-1.5 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveRemarks}
                      className="px-4 py-1.5 text-xs rounded-lg bg-[#0B1F4B] hover:bg-[#163270] dark:bg-[#F5A623] dark:hover:bg-amber-500 text-white dark:text-slate-950 font-bold cursor-pointer transition-colors shadow-xs"
                    >
                      Save Remarks
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {candidate.remarks ? (
                    candidate.remarks
                  ) : (
                    <span className="italic text-slate-400">
                      No remarks recorded yet. Every role can click &quot;Add Remark&quot; to add observations (e.g. communication skills, notice period, interview notes).
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Col: Contact & CTC */}
              <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Contact Information
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#F5A623]" />
                      Phone (+91)
                    </span>
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${candidate.phone}`}
                        className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {candidate.phone}
                      </a>
                      <button
                        type="button"
                        onClick={() => setIsWhatsAppOpen(true)}
                        className="p-1 rounded text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                        title="Message on WhatsApp"
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M12.031 2C6.511 2 2.022 6.488 2.022 12.008c0 1.83.498 3.548 1.365 5.029L2 22l5.12-1.341a9.98 9.98 0 0 0 4.911 1.357h.004c5.518 0 10.007-4.488 10.007-10.008 0-2.673-1.041-5.186-2.932-7.077A9.954 9.954 0 0 0 12.031 2zm0 18.23h-.003a8.214 8.214 0 0 1-4.187-1.15l-.3-.178-3.111.816.83-3.033-.196-.312a8.21 8.21 0 0 1-1.258-4.365c0-4.542 3.696-8.238 8.238-8.238 2.2 0 4.269.858 5.825 2.414a8.203 8.203 0 0 1 2.41 5.824c0 4.543-3.696 8.242-8.248 8.242zm4.518-6.166c-.248-.124-1.467-.724-1.694-.807-.228-.083-.394-.124-.56.124-.166.248-.642.807-.787.973-.145.166-.29.186-.538.062-.248-.124-1.047-.386-1.995-1.231-.738-.658-1.236-1.472-1.381-1.72-.145-.248-.016-.382.108-.506.112-.112.248-.29.373-.435.124-.145.166-.248.248-.414.083-.166.042-.311-.021-.435-.062-.124-.56-1.35-.767-1.85-.202-.486-.407-.42-.56-.428l-.477-.008c-.166 0-.435.062-.663.311-.228.248-.871.851-.871 2.074 0 1.223.891 2.404 1.016 2.57.124.166 1.753 2.678 4.248 3.755.594.256 1.058.409 1.42.524.597.19 1.14.163 1.569.099.479-.071 1.467-.6 1.674-1.18.207-.58.207-1.077.145-1.18-.062-.104-.228-.166-.476-.29z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#F5A623]" />
                      Email
                    </span>
                    <a
                      href={`mailto:${candidate.email}`}
                      className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {candidate.email}
                    </a>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#F5A623]" />
                      City
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {candidate.city}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Sourcing Source</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                      {candidate.source}
                    </span>
                  </div>
                </div>
              </div>

              {/* Compensation Details in INR LPA */}
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-[#F5A623]" />
                  Compensation & Experience
                </h3>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Current CTC</span>
                    <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      ₹{candidate.currentSalaryLPA} LPA
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                    <span className="text-[10px] text-amber-800 dark:text-amber-300 uppercase font-bold">Expected CTC</span>
                    <p className="text-base font-bold text-amber-900 dark:text-amber-200 mt-0.5">
                      ₹{candidate.expectedSalaryLPA} LPA
                    </p>
                  </div>
                </div>
                <div className="text-xs text-slate-500 pt-1">
                  Expected Hike:{' '}
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    +{Math.round(((candidate.expectedSalaryLPA - candidate.currentSalaryLPA) / (candidate.currentSalaryLPA || 1)) * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Right Col: Skills & Assignment */}
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Skills & Expertise Tags
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.skills.map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/50 text-[#0B1F4B] dark:text-blue-300 text-xs font-medium border border-blue-200 dark:border-blue-800"
                    >
                      {s}
                    </span>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-500 block mb-1">Education</span>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                    {candidate.education}
                  </p>
                </div>
              </div>

              {/* Client & Recruiter Assignment */}
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Requisition & Owner
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Assigned Recruiter</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {candidate.assignedRecruiterName}
                    </span>
                  </div>
                  {candidate.clientName && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Target Client</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {candidate.clientName}
                      </span>
                    </div>
                  )}
                  {candidate.jobTitle && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">
                        {candidate.isCustomPosition ? 'Applied Position (Custom)' : 'Job Position'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {candidate.jobTitle}
                        </span>
                        {candidate.isCustomPosition && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-bold">
                            Custom Role
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-slate-500">Quick Status Transition</span>
                    <select
                      value={candidate.status}
                      onChange={(e) => {
                        const next = e.target.value as Candidate['status'];
                        if (next !== candidate.status) {
                          setStatusChangeTarget(next);
                        }
                      }}
                      className="text-xs font-semibold rounded-lg px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      <option value="New">New</option>
                      <option value="Screened">Screened</option>
                      <option value="Shortlisted">Shortlisted</option>
                      <option value="Interview Scheduled">Interview Scheduled</option>
                      <option value="Selected">Selected</option>
                      <option value="Offered">Offered</option>
                      <option value="Joined">Joined</option>
                      <option value="Rejected">Rejected</option>
                      <option value="On Hold">On Hold</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Status Remarks & Stage Transition Trail */}
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-[#F5A623]" />
                    Status Remarks & Stage Trail
                  </h3>
                  {candidate.statusRemark && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold">
                      Active Remark
                    </span>
                  )}
                </div>

                {candidate.statusRemark ? (
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-amber-900 dark:text-amber-200">
                        Latest Remark ({candidate.status})
                      </span>
                      <span className="text-slate-500 text-[10px]">
                        by {candidate.statusRemarkBy || 'Recruiter'}
                        {candidate.statusRemarkAt ? ` • ${new Date(candidate.statusRemarkAt).toLocaleDateString('en-IN')}` : ''}
                      </span>
                    </div>
                    <p className="text-slate-800 dark:text-slate-200 font-medium italic">
                      &ldquo;{candidate.statusRemark}&rdquo;
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    No stage remark recorded for the current status.
                  </p>
                )}

                {statusHistory.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2 max-h-48 overflow-y-auto pr-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Audit Trail of Status Changes ({statusHistory.length})
                    </span>
                    {statusHistory.map((item) => (
                      <div
                        key={item.id}
                        className="text-xs p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3"
                      >
                        <div className="space-y-0.5">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {item.reason}
                          </p>
                          <div className="text-[10px] text-slate-400">
                            by {item.editedByUserName} ({item.editedByUserRole})
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {new Date(item.timestamp).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

        {/* Tab 2: Recruiter Notes */}
        {activeTab === 'notes' && (
          <div className="space-y-4">
            {/* Note form */}
            <form onSubmit={handleAddNote} className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Add Screening Feedback / Client Notes
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Candidate answered all system design questions well, agreed on ₹22 LPA CTC..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
                />
                <button
                  type="submit"
                  disabled={!newNoteText.trim()}
                  className="px-4 py-2 bg-[#0B1F4B] text-white hover:bg-[#163270] disabled:opacity-50 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post Note</span>
                </button>
              </div>
            </form>

            {/* Notes List */}
            <div className="space-y-3 pt-2">
              {!candidate.notes || candidate.notes.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No notes recorded yet. Add the first screening feedback above!
                </div>
              ) : (
                candidate.notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700 text-xs"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {note.authorName} • <span className="text-amber-600 font-medium">{note.authorRole}</span>
                      </span>
                      <span>{new Date(note.createdAt).toLocaleDateString('en-GB')}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{note.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Timeline */}
        {activeTab === 'timeline' && (
          <div className="space-y-4">
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              <div className="relative">
                <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-[#F5A623] border-2 border-white dark:border-slate-900" />
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Current Status: {candidate.status}
                </p>
                <p className="text-[11px] text-slate-500">
                  Last updated {new Date(candidate.updatedAt).toLocaleDateString('en-GB')}
                </p>
              </div>

              {candidate.status === 'Interview Scheduled' && (
                <div className="relative">
                  <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white dark:border-slate-900" />
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Interview Scheduled with Client
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Coordinator: {candidate.assignedRecruiterName}
                  </p>
                </div>
              )}

              <div className="relative">
                <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Profile Sourced via {candidate.source}
                </p>
                <p className="text-[11px] text-slate-500">
                  Created on {new Date(candidate.createdAt).toLocaleDateString('en-GB')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <SetReminderModal
        isOpen={isReminderOpen}
        onClose={() => setIsReminderOpen(false)}
        relatedType="candidate"
        relatedId={candidate.id}
        relatedName={candidate.fullName}
        defaultTitle={`Follow up with ${candidate.fullName} (${candidate.currentCompany})`}
      />

      <WhatsAppModal
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        candidate={candidate}
      />

      <StatusRemarkModal
        isOpen={!!statusChangeTarget}
        onClose={() => setStatusChangeTarget(null)}
        onConfirm={handleConfirmStatusRemark}
        candidateName={candidate.fullName}
        oldStatus={candidate.status}
        newStatus={statusChangeTarget || ''}
      />
    </Modal>
  );
};
