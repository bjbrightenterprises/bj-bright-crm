import React from 'react';
import { Modal } from '../common/Modal';
import { JobOpening, Candidate } from '../../types/crm';
import { useCRM } from '../../context/CRMContext';
import { CheckCircle2, UserPlus } from 'lucide-react';

interface CandidateMatchingModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobOpening | null;
  onViewCandidate: (c: Candidate) => void;
}

export const CandidateMatchingModal: React.FC<CandidateMatchingModalProps> = ({
  isOpen,
  onClose,
  job,
  onViewCandidate,
}) => {
  const { getMatchingCandidates, addPipelineCandidate, pipeline } = useCRM();

  if (!job) return null;

  const matches = getMatchingCandidates(job);

  const handleAddToPipeline = (candidateId: string) => {
    addPipelineCandidate(candidateId, job.id, 'Sourced');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Candidate Matching Engine • ${job.title}`}
      subtitle={`Auto-ranked talent matches for ${job.clientName} (Budget: ₹${job.salaryMinLPA}-${job.salaryMaxLPA} LPA)`}
      maxWidth="4xl"
    >
      <div className="space-y-4 text-slate-900">
        {/* Banner with Job Requirements */}
        <div className="p-4 rounded-xl bg-[#0B1F4B] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-extrabold text-sm text-white">{job.title}</span>
              <span className="px-2 py-0.5 rounded-full bg-[#F5A623] text-slate-950 font-bold text-[10px]">
                {job.positions} Openings
              </span>
            </div>
            <p className="text-slate-200">
              Exp: {job.minExpYears}-{job.maxExpYears} Years • Location: {job.location}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {job.skillsRequired.map((skill) => (
              <span
                key={skill}
                className="px-2 py-0.5 rounded bg-white/15 text-white text-[11px] font-semibold"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Matching list */}
        <div className="space-y-3">
          {matches.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No candidates in the database matching these skills or criteria yet.
            </div>
          ) : (
            matches.map(({ candidate, matchScore, matchReasons }) => {
              const inPipeline = pipeline.some(
                (p) => p.candidateId === candidate.id && p.jobId === job.id
              );

              return (
                <div
                  key={candidate.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-[#0B1F4B] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs shadow-xs"
                >
                  {/* Left: Score & Candidate Info */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className={`w-13 h-13 rounded-2xl flex flex-col items-center justify-center font-bold text-center shrink-0 border ${
                        matchScore >= 80
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                          : matchScore >= 60
                          ? 'bg-amber-50 border-amber-300 text-amber-900'
                          : 'bg-slate-100 border-slate-300 text-slate-800'
                      }`}
                    >
                      <span className="text-sm font-black leading-none">{matchScore}%</span>
                      <span className="text-[9px] uppercase font-bold tracking-tight mt-0.5">Match</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => onViewCandidate(candidate)}
                          className="font-bold text-sm text-slate-900 hover:text-blue-700 text-left cursor-pointer"
                        >
                          {candidate.fullName}
                        </button>
                        <span className="text-xs text-slate-600">
                          {candidate.experienceYears} Years Exp • {candidate.currentCompany}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-blue-50 text-blue-900 border border-blue-200">
                          {candidate.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-700 mt-1 flex-wrap">
                        <span>Expected CTC: <strong className="text-slate-900">₹{candidate.expectedSalaryLPA} LPA</strong></span>
                        <span>•</span>
                        <span>Location: <strong className="text-slate-900">{candidate.city}</strong></span>
                      </div>

                      {/* Match reasons breakdown */}
                      <div className="mt-2 space-y-1">
                        {matchReasons.map((reason, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 text-xs text-emerald-800 font-medium"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 self-stretch md:self-center shrink-0">
                    <button
                      onClick={() => onViewCandidate(candidate)}
                      className="min-h-[44px] flex-1 md:flex-none px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                    >
                      View Profile
                    </button>

                    {inPipeline ? (
                      <span className="min-h-[44px] px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-900 font-bold text-xs border border-emerald-300 flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>In Pipeline</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAddToPipeline(candidate.id)}
                        className="min-h-[44px] flex-1 md:flex-none px-4 py-2 rounded-xl bg-[#0B1F4B] hover:bg-[#163270] text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4 text-[#F5A623]" />
                        <span>Map to Pipeline</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
};
