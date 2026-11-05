import React, { useState, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { Candidate } from '../../types/crm';
import { useCRM } from '../../context/CRMContext';
import {
  Phone,
  Mail,
  MapPin,
  IndianRupee,
  FileText,
  Calendar,
  MessageSquare,
  Clock,
  Send,
  Edit,
  Trash2,
  Share2,
  Bell,
  Briefcase,
  UserCheck,
  Link2,
  CheckCircle2,
  X,
} from 'lucide-react';
import { SetReminderModal } from '../reminders/SetReminderModal';
import {
  formatISTDateTime,
  formatOpenJobDropdownLabel,
  getCandidateAppliedFor,
  GENERAL_TALENT_POOL_LABEL,
} from '../../lib/workProfiles';

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
  const {
    candidates,
    jobs,
    updateCandidate,
    addPipelineCandidate,
    addCandidateNote,
    deleteCandidate,
    canCreateTasks,
    openStatusRemarkModal,
    openAddRemarkModal,
    deleteCandidateRemark,
    currentUser,
  } = useCRM();
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'remarks' | 'timeline'>('overview');
  const [newNoteText, setNewNoteText] = useState('');
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [isLinkingJob, setIsLinkingJob] = useState(false);
  const [selectedJobIdToLink, setSelectedJobIdToLink] = useState('');

  const openJobs = useMemo(
    () => jobs.filter((j) => j.status === 'Open' && !j.deletedAt),
    [jobs]
  );

  if (!candidate) return null;

  // Always read latest candidate state from context so linking updates immediately
  const liveCandidate = candidates.find((c) => c.id === candidate.id) || candidate;
  const appliedForText = getCandidateAppliedFor(liveCandidate);

  const handleLinkToJobOpening = () => {
    if (!selectedJobIdToLink) return;
    const job = openJobs.find((j) => j.id === selectedJobIdToLink);
    if (!job) return;
    updateCandidate(
      liveCandidate.id,
      {
        jobId: job.id,
        jobTitle: job.title,
        clientId: job.clientId,
        clientName: job.clientName,
        appliedFor: job.title,
        appliedForIsCustom: false,
      },
      `Linked to job opening: ${job.title} (${job.clientName})`
    );
    addPipelineCandidate(liveCandidate.id, job.id, 'Sourced');
    setIsLinkingJob(false);
    setSelectedJobIdToLink('');
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    addCandidateNote(liveCandidate.id, newNoteText.trim());
    setNewNoteText('');
  };

  const handleStatusChange = (newStatus: Candidate['status']) => {
    openStatusRemarkModal(liveCandidate, newStatus);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete candidate ${liveCandidate.fullName}?`)) {
      deleteCandidate(liveCandidate.id);
      onClose();
    }
  };

  const cleanPhone = liveCandidate.phone.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=Hi%20${encodeURIComponent(
    liveCandidate.fullName
  )},%20this%20is%20from%20BJ%20Bright%20Enterprises%20Noida%20regarding%20your%20job%20application.`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={liveCandidate.fullName}
      subtitle={`Candidate ID: #BJB-${liveCandidate.id.slice(-6).toUpperCase()} • Noida HR Consultancy`}
      maxWidth="4xl"
    >
      <div className="space-y-5 text-slate-900">
        {/* Top Header Card */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-[#0B1F4B] text-white flex items-center justify-center font-bold text-xl shadow-md border-2 border-[#F5A623] shrink-0">
              {liveCandidate.fullName.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  {liveCandidate.fullName}
                </h2>
                <Badge
                  variant={
                    liveCandidate.status === 'Placed'
                      ? 'success'
                      : liveCandidate.status === 'Offered'
                      ? 'gold'
                      : liveCandidate.status === 'Rejected'
                      ? 'danger'
                      : 'primary'
                  }
                >
                  {liveCandidate.status}
                </Badge>
                {liveCandidate.workProfile && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-50 border border-blue-200 text-[#0B1F4B] text-xs font-bold">
                    <Briefcase className="w-3 h-3 text-[#F5A623]" />
                    <span>Work Profile: {liveCandidate.workProfile}</span>
                  </span>
                )}
                {appliedForText && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold">
                    <Briefcase className="w-3 h-3 text-emerald-700" />
                    <span>Applied For: {appliedForText}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-700 mt-1 flex items-center gap-2 flex-wrap">
                <span>{liveCandidate.currentCompany}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#F5A623]" />
                  {liveCandidate.city}
                </span>
                <span>•</span>
                <span>{liveCandidate.experienceYears} Years Exp</span>
              </p>
              <p className="text-[11px] text-slate-600 mt-1 flex items-center gap-x-3 gap-y-0.5 flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#0B1F4B]" />
                  <span>
                    Entry date:{' '}
                    <strong className="text-slate-900">
                      {formatISTDateTime(liveCandidate.entryDate || liveCandidate.createdAt)}
                    </strong>
                  </span>
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-[#F5A623]" />
                  <span>
                    Entered by:{' '}
                    <strong className="text-slate-900">
                      {liveCandidate.enteredBy || liveCandidate.assignedRecruiterName}
                    </strong>
                  </span>
                </span>
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="Open WhatsApp chat with prefilled message"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp</span>
            </a>

            <button
              onClick={() => onScheduleInterview(liveCandidate)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#0B1F4B] hover:bg-[#163270] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-[#F5A623]" />
              <span>Schedule Interview</span>
            </button>

            <button
              onClick={() => openAddRemarkModal(liveCandidate)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Add a status remark at any time"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Add Remark</span>
            </button>

            {canCreateTasks && (
              <button
                onClick={() => setIsReminderOpen(true)}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#F5A623] hover:bg-amber-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                title="Set a follow-up reminder for this candidate"
              >
                <Bell className="w-4 h-4" />
                <span>Set Reminder</span>
              </button>
            )}

            <button
              onClick={() => onEdit(liveCandidate)}
              className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 cursor-pointer"
              title="Edit Candidate"
            >
              <Edit className="w-4 h-4" />
            </button>

            <button
              onClick={handleDelete}
              className="w-11 h-11 flex items-center justify-center rounded-xl text-rose-600 hover:text-rose-800 bg-white border border-rose-200 hover:bg-rose-50 cursor-pointer"
              title="Delete Candidate"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 overflow-x-auto gap-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`min-h-[44px] px-4 py-2 text-xs font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'border-[#0B1F4B] text-[#0B1F4B]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Overview & Details
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`min-h-[44px] px-4 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'notes'
                ? 'border-[#0B1F4B] text-[#0B1F4B]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Recruiter Notes ({liveCandidate.notes?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('remarks')}
            className={`min-h-[44px] px-4 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'remarks'
                ? 'border-[#0B1F4B] text-[#0B1F4B]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Remarks Timeline ({liveCandidate.remarks?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`min-h-[44px] px-4 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'timeline'
                ? 'border-[#0B1F4B] text-[#0B1F4B]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Activity Timeline</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left Col: Contact & CTC */}
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Contact Information
                </h3>
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-600 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#F5A623]" />
                      Phone (+91)
                    </span>
                    <a
                      href={`tel:${liveCandidate.phone}`}
                      className="font-bold text-blue-700 hover:underline"
                    >
                      {liveCandidate.phone}
                    </a>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-600 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#F5A623]" />
                      Email
                    </span>
                    <a
                      href={`mailto:${liveCandidate.email}`}
                      className="font-bold text-blue-700 hover:underline truncate"
                    >
                      {liveCandidate.email}
                    </a>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-600 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#F5A623]" />
                      City
                    </span>
                    <span className="font-bold text-slate-900">
                      {liveCandidate.city}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-600">Work Profile</span>
                    <span className="px-2.5 py-0.5 rounded bg-blue-50 font-bold text-[#0B1F4B] border border-blue-200">
                      {liveCandidate.workProfile || 'Not Specified'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-600">Applied For</span>
                    <span className="px-2.5 py-0.5 rounded bg-emerald-50 font-bold text-emerald-900 border border-emerald-200">
                      {appliedForText || GENERAL_TALENT_POOL_LABEL}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-600">Sourcing Source</span>
                    <span className="px-2.5 py-0.5 rounded bg-slate-100 font-bold text-slate-800 border border-slate-200">
                      {liveCandidate.source}
                    </span>
                  </div>
                </div>
              </div>

              {/* Compensation Details in INR LPA */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-[#F5A623]" />
                  Compensation & Experience
                </h3>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-600 uppercase font-bold">Current CTC</span>
                    <p className="text-base font-extrabold text-slate-900 mt-0.5">
                      ₹{liveCandidate.currentSalaryLPA} LPA
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-300">
                    <span className="text-[10px] text-amber-900 uppercase font-bold">Expected CTC</span>
                    <p className="text-base font-extrabold text-amber-950 mt-0.5">
                      ₹{liveCandidate.expectedSalaryLPA} LPA
                    </p>
                  </div>
                </div>
                <div className="text-xs text-slate-700 pt-1">
                  Expected Hike:{' '}
                  <span className="font-bold text-emerald-700">
                    +{Math.round(((liveCandidate.expectedSalaryLPA - liveCandidate.currentSalaryLPA) / (liveCandidate.currentSalaryLPA || 1)) * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Right Col: Skills & Assignment */}
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Skills & Expertise Tags
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {liveCandidate.skills.map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-1 rounded-md bg-blue-50 text-[#0B1F4B] text-xs font-semibold border border-blue-200"
                    >
                      {s}
                    </span>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-200">
                  <span className="text-xs font-bold text-slate-600 block mb-1">Education</span>
                  <p className="text-xs font-semibold text-slate-900">
                    {liveCandidate.education}
                  </p>
                </div>
              </div>

              {/* Client & Recruiter Assignment */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Requisition & Owner
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setIsLinkingJob((prev) => !prev);
                      setSelectedJobIdToLink(liveCandidate.jobId || openJobs[0]?.id || '');
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0B1F4B] hover:bg-[#163270] text-white text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    <Link2 className="w-3.5 h-3.5 text-[#F5A623]" />
                    <span>Link to job opening</span>
                  </button>
                </div>

                {isLinkingJob && (
                  <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#0B1F4B]">
                        Select Open Job Opening to Link
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsLinkingJob(false)}
                        className="text-slate-500 hover:text-slate-800 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <select
                      value={selectedJobIdToLink}
                      onChange={(e) => setSelectedJobIdToLink(e.target.value)}
                      className="w-full min-h-[42px] px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-900"
                    >
                      <option value="">-- Choose Open Job Opening --</option>
                      {openJobs.map((j) => (
                        <option key={j.id} value={j.id}>
                          {formatOpenJobDropdownLabel(j)}
                        </option>
                      ))}
                    </select>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsLinkingJob(false)}
                        className="min-h-[36px] px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={!selectedJobIdToLink}
                        onClick={handleLinkToJobOpening}
                        className="min-h-[36px] px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirm Link</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-600">Assigned Recruiter</span>
                    <span className="font-bold text-slate-900">
                      {liveCandidate.assignedRecruiterName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-600">Applied For</span>
                    <span className="font-bold text-slate-900 text-right">
                      {appliedForText || GENERAL_TALENT_POOL_LABEL}
                    </span>
                  </div>
                  {liveCandidate.clientName && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-600">Target Client</span>
                      <span className="font-bold text-blue-700">
                        {liveCandidate.clientName}
                      </span>
                    </div>
                  )}
                  {liveCandidate.jobTitle && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-600">Linked Job Opening</span>
                      <span className="font-bold text-emerald-700">
                        {liveCandidate.jobTitle}
                      </span>
                    </div>
                  )}
                  {!liveCandidate.jobId && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-600">Job Link Status</span>
                      <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-900 font-bold text-[11px]">
                        In Talent Pool (Not linked to an opening)
                      </span>
                    </div>
                  )}
                  <div className="pt-2 flex items-center justify-between gap-2">
                    <span className="text-slate-700 font-semibold">Quick Status Transition</span>
                    <select
                      value={liveCandidate.status}
                      onChange={(e) => handleStatusChange(e.target.value as any)}
                      className="min-h-[44px] text-xs font-bold rounded-lg px-3 py-2 bg-white border border-slate-300 text-slate-900"
                    >
                      <option value="New">New</option>
                      <option value="Screened">Screened</option>
                      <option value="Shortlisted">Shortlisted</option>
                      <option value="Interview Scheduled">Interview Scheduled</option>
                      <option value="Selected">Selected</option>
                      <option value="Offered">Offered</option>
                      <option value="Placed">Placed</option>
                      <option value="Rejected">Rejected</option>
                      <option value="On Hold">On Hold</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Recruiter Notes */}
        {activeTab === 'notes' && (
          <div className="space-y-4">
            <form onSubmit={handleAddNote} className="space-y-2">
              <label className="text-xs font-bold text-slate-800 block">
                Add Screening Feedback / Client Notes
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="e.g. Candidate answered all system design questions well, agreed on ₹22 LPA CTC..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  className="flex-1 min-h-[44px] px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
                />
                <button
                  type="submit"
                  disabled={!newNoteText.trim()}
                  className="min-h-[44px] px-4 py-2 bg-[#0B1F4B] text-white hover:bg-[#163270] disabled:opacity-50 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Post Note</span>
                </button>
              </div>
            </form>

            <div className="space-y-3 pt-2">
              {!candidate.notes || candidate.notes.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No notes recorded yet. Add the first screening feedback above!
                </div>
              ) : (
                candidate.notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-600 mb-1 flex-wrap gap-2">
                      <span className="font-bold text-slate-900">
                        {note.authorName} • <span className="text-amber-800 font-bold">{note.authorRole}</span>
                      </span>
                      <span>{new Date(note.createdAt).toLocaleDateString('en-GB')}</span>
                    </div>
                    <p className="text-slate-800 leading-relaxed">{note.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab: Remarks Timeline */}
        {activeTab === 'remarks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-xs font-bold text-slate-800">
                Candidate Status Remarks Timeline (Newest First • IST)
              </p>
              <button
                onClick={() => openAddRemarkModal(candidate)}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#0B1F4B] hover:bg-[#163270] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-[#F5A623]" />
                <span>Add Remark</span>
              </button>
            </div>
            {!candidate.remarks || candidate.remarks.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No status remarks recorded yet. Click "Add Remark" or change candidate status to log a remark.
              </div>
            ) : (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {[...candidate.remarks]
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((rem) => (
                    <div
                      key={rem.id}
                      className="relative p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                    >
                      <span className="absolute -left-[22px] top-4 w-3 h-3 rounded-full bg-[#F5A623] border-2 border-white" />
                      <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant={
                              (rem.statusChangedTo || candidate.status) === 'Placed'
                                ? 'success'
                                : (rem.statusChangedTo || candidate.status) === 'Offered'
                                ? 'gold'
                                : (rem.statusChangedTo || candidate.status) === 'Rejected'
                                ? 'danger'
                                : 'primary'
                            }
                          >
                            {rem.statusChangedTo || candidate.status}
                          </Badge>
                          <span className="font-bold text-slate-900">
                            {rem.authorName}
                          </span>
                          <span className="text-xs text-amber-800 font-bold">
                            ({rem.authorRole.replace('_', ' ').toUpperCase()})
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <span>
                            {new Date(rem.createdAt).toLocaleString('en-IN', {
                              timeZone: 'Asia/Kolkata',
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            })}{' '}
                            IST
                          </span>
                          {currentUser.role === 'admin' && (
                            <button
                              onClick={() => deleteCandidateRemark(candidate.id, rem.id)}
                              className="p-2 rounded text-rose-600 hover:bg-rose-50 cursor-pointer"
                              title="Delete Remark (Admin Only)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                        {rem.text}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Timeline */}
        {activeTab === 'timeline' && (
          <div className="space-y-4">
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              <div className="relative">
                <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-[#F5A623] border-2 border-white" />
                <p className="text-xs font-bold text-slate-900">
                  Current Status: {candidate.status}
                </p>
                <p className="text-xs text-slate-600">
                  Last updated {new Date(candidate.updatedAt).toLocaleDateString('en-GB')}
                </p>
              </div>

              {candidate.status === 'Interview Scheduled' && (
                <div className="relative">
                  <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-blue-600 border-2 border-white" />
                  <p className="text-xs font-bold text-slate-900">
                    Interview Scheduled with Client
                  </p>
                  <p className="text-xs text-slate-600">
                    Coordinator: {candidate.assignedRecruiterName}
                  </p>
                </div>
              )}

              <div className="relative">
                <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-emerald-600 border-2 border-white" />
                <p className="text-xs font-bold text-slate-900">
                  Profile Sourced via {candidate.source}
                </p>
                <p className="text-xs text-slate-600">
                  Entry date: {formatISTDateTime(candidate.entryDate || candidate.createdAt)} • Entered by:{' '}
                  {candidate.enteredBy || candidate.assignedRecruiterName}
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
    </Modal>
  );
};
