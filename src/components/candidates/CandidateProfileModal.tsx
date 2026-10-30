import React, { useState } from 'react';
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
} from 'lucide-react';
import { SetReminderModal } from '../reminders/SetReminderModal';

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
    addCandidateNote,
    deleteCandidate,
    updateCandidate,
    canCreateTasks,
    openStatusRemarkModal,
    openAddRemarkModal,
    deleteCandidateRemark,
    currentUser,
  } = useCRM();
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'remarks' | 'timeline'>('overview');
  const [newNoteText, setNewNoteText] = useState('');
  const [isReminderOpen, setIsReminderOpen] = useState(false);

  if (!candidate) return null;

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    addCandidateNote(candidate.id, newNoteText.trim());
    setNewNoteText('');
  };

  const handleStatusChange = (newStatus: Candidate['status']) => {
    openStatusRemarkModal(candidate, newStatus);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete candidate ${candidate.fullName}?`)) {
      deleteCandidate(candidate.id);
      onClose();
    }
  };

  // Clean phone for whatsapp
  const cleanPhone = candidate.phone.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=Hi%20${encodeURIComponent(
    candidate.fullName
  )},%20this%20is%20from%20BJ%20Bright%20Enterprises%20Noida%20regarding%20your%20job%20application.`;

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
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-2">
                <span>{candidate.currentCompany}</span>
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
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Open WhatsApp chat with prefilled message"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>

            <button
              onClick={() => onScheduleInterview(candidate)}
              className="px-3 py-1.5 rounded-lg bg-[#0B1F4B] hover:bg-[#163270] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 text-[#F5A623]" />
              <span>Schedule Interview</span>
            </button>

            <button
              onClick={() => openAddRemarkModal(candidate)}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Add a status remark at any time"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Add Remark</span>
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
            onClick={() => setActiveTab('remarks')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'remarks'
                ? 'border-[#0B1F4B] dark:border-[#F5A623] text-[#0B1F4B] dark:text-[#F5A623]'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Remarks Timeline ({candidate.remarks?.length || 0})</span>
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
                    <a
                      href={`tel:${candidate.phone}`}
                      className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {candidate.phone}
                    </a>
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
                      <span className="text-slate-500">Job Position</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {candidate.jobTitle}
                      </span>
                    </div>
                  )}
                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-slate-500">Quick Status Transition</span>
                    <select
                      value={candidate.status}
                      onChange={(e) => handleStatusChange(e.target.value as any)}
                      className="text-xs font-semibold rounded-lg px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
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

        {/* Tab: Remarks Timeline */}
        {activeTab === 'remarks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Candidate Status Remarks Timeline (Newest First • IST)
              </p>
              <button
                onClick={() => openAddRemarkModal(candidate)}
                className="px-3 py-1.5 rounded-lg bg-[#0B1F4B] hover:bg-[#163270] text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#F5A623]" />
                <span>Add Remark</span>
              </button>
            </div>
            {!candidate.remarks || candidate.remarks.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No status remarks recorded yet. Click "Add Remark" or change candidate status to log a remark.
              </div>
            ) : (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {[...candidate.remarks]
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((rem) => (
                    <div
                      key={rem.id}
                      className="relative p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700 text-xs"
                    >
                      <span className="absolute -left-[22px] top-4 w-3 h-3 rounded-full bg-[#F5A623] border-2 border-white dark:border-slate-900" />
                      <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              (rem.statusChangedTo || candidate.status) === 'Joined'
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
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {rem.authorName}
                          </span>
                          <span className="text-[11px] text-amber-600 font-medium">
                            ({rem.authorRole.replace('_', ' ').toUpperCase()})
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
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
                              className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              title="Delete Remark (Admin Only)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
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
    </Modal>
  );
};
