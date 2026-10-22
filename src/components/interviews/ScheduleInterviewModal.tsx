import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Interview, InterviewMode, InterviewStatus, Candidate } from '../../types/crm';
import { useCRM } from '../../context/CRMContext';
import { Calendar, Video, MapPin, Phone } from 'lucide-react';

interface ScheduleInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedCandidate?: Candidate | null;
  interviewToEdit?: Interview | null;
}

export const ScheduleInterviewModal: React.FC<ScheduleInterviewModalProps> = ({
  isOpen,
  onClose,
  preSelectedCandidate,
  interviewToEdit,
}) => {
  const { addInterview, updateInterview, candidates, clients, jobs, currentUser } = useCRM();

  const [candidateId, setCandidateId] = useState('');
  const [clientId, setClientId] = useState('');
  const [jobId, setJobId] = useState('');
  const [roundName, setRoundName] = useState('Round 1: Technical Screening');
  const [dateTime, setDateTime] = useState('');
  const [mode, setMode] = useState<InterviewMode>('Google Meet');
  const [venueOrLink, setVenueOrLink] = useState('https://meet.google.com/');
  const [interviewerName, setInterviewerName] = useState('Hiring Manager');
  const [status, setStatus] = useState<InterviewStatus>('Scheduled');
  const [isFollowUp, setIsFollowUp] = useState(false);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (interviewToEdit) {
      setCandidateId(interviewToEdit.candidateId);
      setClientId(interviewToEdit.clientId);
      setJobId(interviewToEdit.jobId);
      setRoundName(interviewToEdit.roundName);
      setDateTime(interviewToEdit.dateTime);
      setMode(interviewToEdit.mode);
      setVenueOrLink(interviewToEdit.venueOrLink);
      setInterviewerName(interviewToEdit.interviewerName);
      setStatus(interviewToEdit.status);
      setIsFollowUp(!!interviewToEdit.isFollowUp);
      setNotes(interviewToEdit.notes || '');
    } else {
      const selectedCand = preSelectedCandidate || candidates[0];
      setCandidateId(selectedCand?.id || '');
      setClientId(selectedCand?.clientId || clients[0]?.id || '');
      setJobId(selectedCand?.jobId || jobs[0]?.id || '');
      setRoundName('Round 1: Technical Screening');

      // Default to tomorrow 11:00 AM
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(11, 0, 0, 0);
      setDateTime(d.toISOString().slice(0, 16));

      setMode('Google Meet');
      setVenueOrLink('https://meet.google.com/bjb-interview-slot');
      setInterviewerName('Client Panel');
      setStatus('Scheduled');
      setIsFollowUp(false);
      setNotes('Candidate advised to join 5 minutes early with credentials.');
    }
    setErrors({});
  }, [interviewToEdit, preSelectedCandidate, isOpen, candidates, clients, jobs]);

  // Adjust venue when mode changes
  const handleModeChange = (newMode: InterviewMode) => {
    setMode(newMode);
    if (newMode === 'Google Meet') {
      setVenueOrLink('https://meet.google.com/bjb-hiring-meet');
    } else if (newMode === 'In-Person (Noida Office)') {
      setVenueOrLink('BJ Bright Office, Suite 408, Tower B, Logix Cyber Park, Sector 62, Noida');
    } else {
      const cand = candidates.find((c) => c.id === candidateId);
      setVenueOrLink(cand?.phone || '+91 98180 00000');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!candidateId) newErrors.candidateId = 'Please select candidate';
    if (!dateTime) newErrors.dateTime = 'Interview date & time is required';
    if (!venueOrLink.trim()) newErrors.venueOrLink = 'Meeting link or venue is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const cand = candidates.find((c) => c.id === candidateId);
    const client = clients.find((cl) => cl.id === clientId);
    const job = jobs.find((j) => j.id === jobId);

    if (interviewToEdit) {
      updateInterview(interviewToEdit.id, {
        candidateId,
        candidateName: cand?.fullName || 'Candidate',
        clientId,
        clientName: client?.name || 'Corporate Client',
        jobId,
        jobTitle: job?.title || 'Open Requisition',
        roundName,
        dateTime,
        mode,
        venueOrLink: venueOrLink.trim(),
        interviewerName: interviewerName.trim(),
        status,
        isFollowUp,
        notes: notes.trim(),
      });
    } else {
      addInterview({
        candidateId,
        candidateName: cand?.fullName || 'Candidate',
        clientId,
        clientName: client?.name || 'Corporate Client',
        jobId,
        jobTitle: job?.title || 'Open Requisition',
        roundName,
        dateTime,
        mode,
        venueOrLink: venueOrLink.trim(),
        interviewerName: interviewerName.trim(),
        status,
        isFollowUp,
        notes: notes.trim(),
        assignedToRecruiterId: cand?.assignedRecruiterId || currentUser.id,
      });
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={interviewToEdit ? 'Edit Interview / Follow-up' : 'Schedule Candidate Interview'}
      subtitle="BJ Bright Enterprises • Noida Interview Coordination"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Candidate */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Select Candidate *
            </label>
            <select
              value={candidateId}
              onChange={(e) => {
                setCandidateId(e.target.value);
                const c = candidates.find((cand) => cand.id === e.target.value);
                if (c?.clientId) setClientId(c.clientId);
                if (c?.jobId) setJobId(c.jobId);
              }}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
            >
              <option value="">-- Choose Candidate --</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} ({c.skills.slice(0, 2).join(', ')})
                </option>
              ))}
            </select>
            {errors.candidateId && <p className="text-[11px] text-rose-500 mt-1">{errors.candidateId}</p>}
          </div>

          {/* Client Company */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Client Company
            </label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
            >
              {clients.map((cl) => (
                <option key={cl.id} value={cl.id}>
                  {cl.name}
                </option>
              ))}
            </select>
          </div>

          {/* Job Mandate */}
          <div className="md:col-span-2">
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Target Job Opening
            </label>
            <select
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} • {j.clientName}
                </option>
              ))}
            </select>
          </div>

          {/* Round Name */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Round Name / Assessment
            </label>
            <input
              type="text"
              placeholder="e.g. L1 Technical Cloud Panel, Client HR Round"
              value={roundName}
              onChange={(e) => setRoundName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
            />
          </div>

          {/* Date & Time */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Date & Time Slot (IST) *
            </label>
            <input
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
            />
            {errors.dateTime && <p className="text-[11px] text-rose-500 mt-1">{errors.dateTime}</p>}
          </div>

          {/* Mode */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Interview Mode
            </label>
            <select
              value={mode}
              onChange={(e) => handleModeChange(e.target.value as InterviewMode)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
            >
              <option value="Google Meet">Google Meet (Online Video)</option>
              <option value="In-Person (Noida Office)">In-Person (BJ Bright Noida Office)</option>
              <option value="Telephonic">Telephonic Screening</option>
            </select>
          </div>

          {/* Interviewer Name */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Client Interviewer / Panelist
            </label>
            <input
              type="text"
              placeholder="e.g. Sanjeev Mukherji (VP Lateral Hiring)"
              value={interviewerName}
              onChange={(e) => setInterviewerName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
            />
          </div>

          {/* Meeting Link or Venue */}
          <div className="md:col-span-2">
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              {mode === 'Google Meet'
                ? 'Meeting URL Link *'
                : mode === 'In-Person (Noida Office)'
                ? 'Office Address Venue *'
                : 'Contact Phone Number *'}
            </label>
            <input
              type="text"
              placeholder="https://meet.google.com/..."
              value={venueOrLink}
              onChange={(e) => setVenueOrLink(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
            />
            {errors.venueOrLink && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.venueOrLink}</p>
            )}
          </div>

          {/* Follow-up flag */}
          <div className="md:col-span-2 flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isFollowUpCheck"
              checked={isFollowUp}
              onChange={(e) => setIsFollowUp(e.target.checked)}
              className="w-4 h-4 rounded text-[#0B1F4B] accent-[#0B1F4B]"
            />
            <label htmlFor="isFollowUpCheck" className="font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              Mark as Priority Task / Document Follow-up (Flags overdue in red if missed)
            </label>
          </div>

          {/* Notes */}
          <div className="md:col-span-2">
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Instructions & Preparation Notes
            </label>
            <textarea
              rows={2}
              placeholder="Important candidate instructions, salary guidelines, or specific client test topics..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-semibold text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-lg bg-[#0B1F4B] hover:bg-[#163270] text-white font-bold shadow-md transition-colors"
          >
            {interviewToEdit ? 'Save Changes' : 'Schedule Interview'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
