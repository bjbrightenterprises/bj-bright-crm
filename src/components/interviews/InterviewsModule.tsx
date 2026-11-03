import React, { useState, useMemo } from 'react';
import {
  CalendarDays,
  List,
  Plus,
  Video,
  MapPin,
  AlertTriangle,
  Clock,
  ExternalLink,
  CheckCircle2,
  Edit,
  Trash2,
  Calendar,
  Download,
} from 'lucide-react';
import { Interview, Candidate } from '../../types/crm';
import { useCRM } from '../../context/CRMContext';
import { Badge } from '../common/Badge';
import { ScheduleInterviewModal } from './ScheduleInterviewModal';
import { Modal } from '../common/Modal';
import { ExcelExportModal } from '../common/ExcelExportModal';
import { INTERVIEW_EXPORT_COLUMNS } from '../../lib/excelModuleConfigs';

interface InterviewsModuleProps {
  onViewCandidateProfile: (candidate: Candidate) => void;
}

export const InterviewsModule: React.FC<InterviewsModuleProps> = ({
  onViewCandidateProfile,
}) => {
  const { visibleInterviews, updateInterview, deleteInterview, candidates } = useCRM();

  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Modals
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [interviewToEdit, setInterviewToEdit] = useState<Interview | null>(null);
  const [feedbackInterview, setFeedbackInterview] = useState<Interview | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Current date for overdue check
  const now = new Date();

  // Filtered interviews
  const filteredInterviews = useMemo(() => {
    return visibleInterviews.filter((i) => {
      if (selectedStatus !== 'All' && i.status !== selectedStatus) return false;
      return true;
    });
  }, [visibleInterviews, selectedStatus]);

  // Overdue count (scheduled interviews in the past, or follow-ups not completed)
  const overdueItems = useMemo(() => {
    return visibleInterviews.filter((i) => {
      if (i.status === 'Completed' || i.status === 'Cancelled') return false;
      const interviewDate = new Date(i.dateTime);
      return interviewDate < now;
    });
  }, [visibleInterviews, now]);

  const handleMarkComplete = (interview: Interview) => {
    setFeedbackInterview(interview);
    setFeedbackText(interview.feedback || '');
  };

  const handleSaveFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedbackInterview) {
      updateInterview(feedbackInterview.id, {
        status: 'Completed',
        feedback: feedbackText.trim() || 'Candidate cleared round successfully.',
      });
      setFeedbackInterview(null);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-[#F5A623] shrink-0" />
            <span>Interviews & Client Evaluation Schedule</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Coordinate Google Meet interviews, Noida office assessments, and recruiter follow-ups
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View mode toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-200 text-xs font-bold">
            <button
              onClick={() => setViewMode('list')}
              className={`min-h-[34px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`min-h-[34px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>
          </div>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="min-h-[42px] px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-white" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={() => {
              setInterviewToEdit(null);
              setIsScheduleOpen(true);
            }}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-[#0B1F4B] hover:bg-[#163270] text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#F5A623]" />
            <span>Schedule Slot</span>
          </button>
        </div>
      </div>

      {/* Overdue Warning Alert Box in Red */}
      {overdueItems.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 flex items-start justify-between gap-3 text-xs text-rose-950">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-sm text-rose-950">
                Attention: {overdueItems.length} Overdue Interview / Follow-up Tasks Pending!
              </p>
              <p className="mt-0.5 text-rose-800">
                The scheduled time for these tasks has passed without completion notes. Please update candidate feedback or reschedule.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {overdueItems.map((item) => (
                  <span
                    key={item.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white font-bold border border-rose-200 text-rose-900"
                  >
                    <span>{item.candidateName}</span>
                    <span className="text-slate-500 font-normal">({item.clientName})</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status filter tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 pb-2">
        {['All', 'Scheduled', 'Completed', 'Cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
              selectedStatus === status
                ? 'bg-[#0B1F4B] text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {filteredInterviews.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
              No interview interactions found for this filter.
            </div>
          ) : (
            filteredInterviews.map((item) => {
              const isPast = new Date(item.dateTime) < now && item.status !== 'Completed';
              const dateObj = new Date(item.dateTime);
              const candObj = candidates.find((c) => c.id === item.candidateId);

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all bg-white shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs ${
                    isPast ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
                  }`}
                >
                  {/* Left: Date badge + Details */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    {/* Date Block */}
                    <div
                      className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center font-bold text-center shrink-0 border ${
                        isPast
                          ? 'bg-rose-100 text-rose-900 border-rose-300'
                          : 'bg-slate-100 text-[#0B1F4B] border-slate-200'
                      }`}
                    >
                      <span className="text-base font-black leading-none">{dateObj.getDate()}</span>
                      <span className="text-[10px] uppercase font-bold mt-0.5">
                        {dateObj.toLocaleString('default', { month: 'short' })}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => {
                            if (candObj) onViewCandidateProfile(candObj);
                          }}
                          className="font-extrabold text-sm text-slate-900 hover:text-[#0B1F4B] hover:underline cursor-pointer"
                        >
                          {item.candidateName}
                        </button>
                        <span className="text-slate-400">•</span>
                        <span className="font-bold text-[#0B1F4B]">
                          {item.clientName}
                        </span>
                        <Badge
                          variant={
                            item.status === 'Completed'
                              ? 'success'
                              : isPast
                              ? 'danger'
                              : 'gold'
                          }
                          size="sm"
                        >
                          {isPast && item.status === 'Scheduled' ? 'Overdue' : item.status}
                        </Badge>
                        {item.isFollowUp && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-100 text-purple-900 border border-purple-200">
                            Follow-up
                          </span>
                        )}
                      </div>

                      <p className="font-bold text-slate-800">
                        {item.roundName} • <span className="font-normal text-slate-600">{item.jobTitle}</span>
                      </p>

                      <div className="flex items-center gap-4 text-[11px] text-slate-600 flex-wrap">
                        <span className="flex items-center gap-1 font-bold text-slate-900">
                          <Clock className="w-3.5 h-3.5 text-[#F5A623]" />
                          {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} IST
                        </span>
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          {item.mode === 'Google Meet' ? (
                            <Video className="w-3.5 h-3.5 text-blue-600" />
                          ) : (
                            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                          {item.mode}
                        </span>
                        <span>Interviewer: {item.interviewerName}</span>
                      </div>

                      {item.feedback && (
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-800 mt-1">
                          <strong>Panel Feedback:</strong> {item.feedback}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0 flex-wrap">
                    {item.venueOrLink.startsWith('http') && (
                      <a
                        href={item.venueOrLink}
                        target="_blank"
                        rel="noreferrer"
                        className="min-h-[38px] px-3 py-1.5 rounded-lg bg-blue-50 text-[#0B1F4B] border border-blue-200 text-xs font-bold hover:bg-blue-100 flex items-center gap-1"
                      >
                        <span>Join Meet</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}

                    {item.status !== 'Completed' && (
                      <button
                        onClick={() => handleMarkComplete(item)}
                        className="min-h-[38px] px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Log Result</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setInterviewToEdit(item);
                        setIsScheduleOpen(true);
                      }}
                      className="min-h-[38px] min-w-[38px] p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 border border-slate-200 flex items-center justify-center cursor-pointer"
                      title="Edit Slot"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm('Cancel this interview?')) {
                          deleteInterview(item.id);
                        }
                      }}
                      className="min-h-[38px] min-w-[38px] p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-slate-200 flex items-center justify-center cursor-pointer"
                      title="Cancel"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Calendar Grid View */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-xl p-4 sm:p-6 border border-slate-200 shadow-2xs space-y-4 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[540px]">
            <h3 className="font-extrabold text-base text-slate-900">
              October 2026 • Interview Pipeline
            </h3>
            <span className="text-xs text-slate-600">Dates are formatted in DD/MM/YYYY</span>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs min-w-[540px]">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="font-bold text-slate-600 py-1 uppercase text-[10px]">
                {day}
              </div>
            ))}

            {Array.from({ length: 31 }, (_, i) => i + 1).map((dayNum) => {
              const dayStr = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
              const dayInterviews = visibleInterviews.filter((item) =>
                item.dateTime.includes(`2026-10-${dayStr}`)
              );
              const isToday = dayNum === now.getDate();

              return (
                <div
                  key={dayNum}
                  className={`min-h-24 p-1.5 rounded-xl border text-left flex flex-col justify-between transition-colors ${
                    isToday
                      ? 'border-[#0B1F4B] bg-amber-50/40 font-bold'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`text-[11px] font-bold inline-block px-1.5 py-0.5 rounded-md ${
                      isToday ? 'bg-[#0B1F4B] text-white' : 'text-slate-700'
                    }`}
                  >
                    {dayNum}
                  </span>

                  <div className="space-y-1 mt-1">
                    {dayInterviews.map((intItem) => (
                      <div
                        key={intItem.id}
                        onClick={() => {
                          const cand = candidates.find((c) => c.id === intItem.candidateId);
                          if (cand) onViewCandidateProfile(cand);
                        }}
                        className="cursor-pointer p-1 rounded bg-blue-50 border border-blue-200 text-[10px] text-[#0B1F4B] truncate font-semibold"
                        title={`${intItem.candidateName} - ${intItem.roundName}`}
                      >
                        {intItem.candidateName.split(' ')[0]} ({intItem.clientName.split(' ')[0]})
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Schedule Interview Modal */}
      <ScheduleInterviewModal
        isOpen={isScheduleOpen}
        onClose={() => {
          setIsScheduleOpen(false);
          setInterviewToEdit(null);
        }}
        interviewToEdit={interviewToEdit}
      />

      {/* Log Result & Feedback Modal */}
      <Modal
        isOpen={!!feedbackInterview}
        onClose={() => setFeedbackInterview(null)}
        title="Record Interview Evaluation & Result"
        subtitle={`Outcome for ${feedbackInterview?.candidateName} • ${feedbackInterview?.clientName}`}
        maxWidth="md"
        footer={
          <div className="flex justify-end gap-2.5 w-full">
            <button
              type="button"
              onClick={() => setFeedbackInterview(null)}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="interview-feedback-form"
              className="min-h-[44px] px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
            >
              Mark Completed
            </button>
          </div>
        }
      >
        <form id="interview-feedback-form" onSubmit={handleSaveFeedback} className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Client Feedback / Next Steps
            </label>
            <textarea
              rows={4}
              placeholder="e.g. Candidate answered all questions well, passed coding assessment. Recommending for Round 2 with VP..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </form>
      </Modal>

      {/* Analyst-Grade Excel Export Modal */}
      <ExcelExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        moduleName="Interviews"
        tableName="tblInterviews"
        sheetName="Interviews"
        columns={INTERVIEW_EXPORT_COLUMNS}
        filteredData={filteredInterviews}
        allAccessibleData={visibleInterviews}
        filtersDescription={`Status: ${selectedStatus}`}
      />
    </div>
  );
};
