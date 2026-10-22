import React, { useState, useMemo } from 'react';
import {
  Kanban,
  Filter,
  Plus,
  ArrowRight,
  ArrowLeft,
  Calendar,
  IndianRupee,
  Briefcase,
  Users,
  CheckCircle2,
  XCircle,
  Eye,
  Phone,
  Sparkles,
  Download,
} from 'lucide-react';
import { PipelineItem, PipelineStage, Candidate } from '../../types/crm';
import { useCRM } from '../../context/CRMContext';
import { Badge } from '../common/Badge';
import { ExcelExportModal } from '../common/ExcelExportModal';
import { PIPELINE_EXPORT_COLUMNS } from '../../lib/excelModuleConfigs';
import { WhatsAppModal } from '../candidates/WhatsAppModal';
import { StatusRemarkModal } from '../candidates/StatusRemarkModal';

const STAGES: PipelineStage[] = [
  'Sourced',
  'Screened',
  'Submitted to Client',
  'Interview',
  'Offer',
  'Joined',
  'Rejected',
];

interface PipelineKanbanModuleProps {
  initialJobId?: string;
  onViewCandidateProfile: (candidate: Candidate) => void;
  onScheduleInterview: (candidate: Candidate) => void;
}

export const PipelineKanbanModule: React.FC<PipelineKanbanModuleProps> = ({
  initialJobId,
  onViewCandidateProfile,
  onScheduleInterview,
}) => {
  const { visiblePipeline, movePipelineStage, jobs, candidates, currentUser } = useCRM();

  const [selectedJobId, setSelectedJobId] = useState<string>(initialJobId || 'all');
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [whatsAppCandidate, setWhatsAppCandidate] = useState<Candidate | null>(null);
  const [pendingStageMove, setPendingStageMove] = useState<{ item: PipelineItem; targetStage: PipelineStage } | null>(null);

  // Filter pipeline items
  const filteredPipeline = useMemo(() => {
    if (selectedJobId === 'all') return visiblePipeline;
    return visiblePipeline.filter((item) => item.jobId === selectedJobId);
  }, [visiblePipeline, selectedJobId]);

  // Group by stage
  const stageColumns = useMemo(() => {
    const map: Record<PipelineStage, PipelineItem[]> = {
      Sourced: [],
      Screened: [],
      'Submitted to Client': [],
      Interview: [],
      Offer: [],
      Joined: [],
      Rejected: [],
    };

    filteredPipeline.forEach((item) => {
      if (map[item.stage]) {
        map[item.stage].push(item);
      }
    });

    return map;
  }, [filteredPipeline]);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedItemId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStage: PipelineStage) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('text/plain') || draggedItemId;
    if (itemId) {
      const item = visiblePipeline.find((p) => p.id === itemId);
      if (item && item.stage !== targetStage) {
        setPendingStageMove({ item, targetStage });
      }
    }
    setDraggedItemId(null);
  };

  const handleNextStage = (item: PipelineItem) => {
    const currentIndex = STAGES.indexOf(item.stage);
    if (currentIndex < STAGES.length - 2) {
      const targetStage = STAGES[currentIndex + 1];
      setPendingStageMove({ item, targetStage });
    }
  };

  const handlePrevStage = (item: PipelineItem) => {
    const currentIndex = STAGES.indexOf(item.stage);
    if (currentIndex > 0) {
      const targetStage = STAGES[currentIndex - 1];
      setPendingStageMove({ item, targetStage });
    }
  };

  const handleConfirmStageRemark = (remark?: string) => {
    if (!pendingStageMove) return;
    movePipelineStage(pendingStageMove.item.id, pendingStageMove.targetStage, remark);
    setPendingStageMove(null);
  };

  const stageHeaderColors: Record<PipelineStage, string> = {
    Sourced: 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200',
    Screened: 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/30 text-sky-900 dark:text-sky-200',
    'Submitted to Client': 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200',
    Interview: 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200',
    Offer: 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/30 text-purple-900 dark:text-purple-200',
    Joined: 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200',
    Rejected: 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200',
  };

  return (
    <div className="space-y-4">
      {/* Board Header & Job Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Kanban className="w-5 h-5 text-[#F5A623]" />
            Hiring Pipeline Board
          </h2>
          <p className="text-xs text-slate-500">
            Drag candidates across stages or use 1-click stage transitions. Logs activity automatically.
          </p>
        </div>

        {/* Filter by job mandate & Export */}
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-xs font-bold text-slate-500 whitespace-nowrap">Filter Mandate:</label>
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
          >
            <option value="all">All Active Job Openings ({visiblePipeline.length} Candidates)</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} • {j.clientName}
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-white" />
            <span>Export to Excel</span>
          </button>
        </div>
      </div>

      {/* Kanban Horizontal Scrollable Columns */}
      <div className="flex gap-4 overflow-x-auto pb-6 pt-1 min-h-[calc(100vh-280px)]">
        {STAGES.map((stage) => {
          const items = stageColumns[stage] || [];

          return (
            <div
              key={stage}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage)}
              className="w-76 shrink-0 bg-slate-100/70 dark:bg-slate-850/60 rounded-2xl flex flex-col border border-slate-200/80 dark:border-slate-800 overflow-hidden"
            >
              {/* Column Header */}
              <div className={`p-3 border-t-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between ${stageHeaderColors[stage]}`}>
                <div className="flex items-center gap-2">
                  <span className="font-black text-xs">{stage}</span>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 shadow-xs">
                  {items.length}
                </span>
              </div>

              {/* Column Cards Container */}
              <div className="p-3 flex-1 overflow-y-auto space-y-3">
                {items.length === 0 ? (
                  <div className="h-28 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-400 text-xs">
                    Drop candidates here
                  </div>
                ) : (
                  items.map((item) => {
                    const candidateObj = candidates.find((c) => c.id === item.candidateId);

                    return (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item.id)}
                        className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-[#0B1F4B] dark:hover:border-amber-500 cursor-grab active:cursor-grabbing transition-all space-y-2 text-xs"
                      >
                        {/* Candidate name & client */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <button
                              onClick={() => {
                                if (candidateObj) onViewCandidateProfile(candidateObj);
                              }}
                              className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-amber-400 text-left block"
                            >
                              {item.candidateName}
                            </button>
                            <p className="text-[11px] text-slate-500 font-medium truncate">
                              {item.jobTitle || candidateObj?.jobTitle || 'General Pool'}
                            </p>
                          </div>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {item.clientName ? item.clientName.split(' ')[0] : (candidateObj?.isCustomPosition ? 'Custom' : 'Direct')}
                          </span>
                        </div>

                        {/* CTC & Exp Info */}
                        <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            ₹{item.candidateSalary} LPA
                          </span>
                          <span>{item.candidateExp}y Exp</span>
                        </div>

                        {/* Skills */}
                        <div className="flex flex-wrap gap-1">
                          {item.candidateSkills.slice(0, 2).map((sk) => (
                            <span
                              key={sk}
                              className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-blue-50 dark:bg-blue-950/50 text-[#0B1F4B] dark:text-blue-300"
                            >
                              {sk}
                            </span>
                          ))}
                        </div>

                        {/* Card Action Controls */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            {candidateObj && (
                              <button
                                type="button"
                                onClick={() => setWhatsAppCandidate(candidateObj)}
                                className="p-1 rounded text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                                title="Message on WhatsApp"
                              >
                                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                  <path d="M12.031 2C6.511 2 2.022 6.488 2.022 12.008c0 1.83.498 3.548 1.365 5.029L2 22l5.12-1.341a9.98 9.98 0 0 0 4.911 1.357h.004c5.518 0 10.007-4.488 10.007-10.008 0-2.673-1.041-5.186-2.932-7.077A9.954 9.954 0 0 0 12.031 2zm0 18.23h-.003a8.214 8.214 0 0 1-4.187-1.15l-.3-.178-3.111.816.83-3.033-.196-.312a8.21 8.21 0 0 1-1.258-4.365c0-4.542 3.696-8.238 8.238-8.238 2.2 0 4.269.858 5.825 2.414a8.203 8.203 0 0 1 2.41 5.824c0 4.543-3.696 8.242-8.248 8.242zm4.518-6.166c-.248-.124-1.467-.724-1.694-.807-.228-.083-.394-.124-.56.124-.166.248-.642.807-.787.973-.145.166-.29.186-.538.062-.248-.124-1.047-.386-1.995-1.231-.738-.658-1.236-1.472-1.381-1.72-.145-.248-.016-.382.108-.506.112-.112.248-.29.373-.435.124-.145.166-.248.248-.414.083-.166.042-.311-.021-.435-.062-.124-.56-1.35-.767-1.85-.202-.486-.407-.42-.56-.428l-.477-.008c-.166 0-.435.062-.663.311-.228.248-.871.851-.871 2.074 0 1.223.891 2.404 1.016 2.57.124.166 1.753 2.678 4.248 3.755.594.256 1.058.409 1.42.524.597.19 1.14.163 1.569.099.479-.071 1.467-.6 1.674-1.18.207-.58.207-1.077.145-1.18-.062-.104-.228-.166-.476-.29z"/>
                                </svg>
                              </button>
                            )}
                            {candidateObj && (
                              <button
                                onClick={() => onScheduleInterview(candidateObj)}
                                className="p-1 rounded text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                                title="Schedule Interview"
                              >
                                <Calendar className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {candidateObj && (
                              <button
                                onClick={() => onViewCandidateProfile(candidateObj)}
                                className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100"
                                title="View Full Profile"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Stage Transition Quick Arrows */}
                          <div className="flex items-center gap-1">
                            {stage !== 'Sourced' && (
                              <button
                                onClick={() => handlePrevStage(item)}
                                className="p-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                                title="Move to previous stage"
                              >
                                <ArrowLeft className="w-3 h-3" />
                              </button>
                            )}
                            {stage !== 'Joined' && stage !== 'Rejected' && (
                              <button
                                onClick={() => handleNextStage(item)}
                                className="p-1 rounded bg-[#0B1F4B] text-white hover:bg-[#163270]"
                                title="Advance to next stage"
                              >
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="text-[10px] text-slate-400 flex items-center justify-between">
                          <span>Updated by {item.lastMovedBy.split(' ')[0]}</span>
                          <span>{new Date(item.updatedAt).toLocaleDateString('en-GB')}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Analyst-Grade Excel Export Modal */}
      <ExcelExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        moduleName="Pipeline"
        tableName="tblPipeline"
        sheetName="Pipeline"
        columns={PIPELINE_EXPORT_COLUMNS}
        filteredData={filteredPipeline}
        allAccessibleData={visiblePipeline}
        filtersDescription={`Mandate: ${selectedJobId === 'all' ? 'All Requisitions' : selectedJobId}`}
      />

      {/* WhatsApp Messaging Modal */}
      <WhatsAppModal
        isOpen={!!whatsAppCandidate}
        onClose={() => setWhatsAppCandidate(null)}
        candidate={whatsAppCandidate}
      />

      {/* Stage Transition Status Remark Modal */}
      <StatusRemarkModal
        isOpen={!!pendingStageMove}
        onClose={() => setPendingStageMove(null)}
        onConfirm={handleConfirmStageRemark}
        candidateName={pendingStageMove?.item.candidateName || ''}
        oldStatus={pendingStageMove?.item.stage || ''}
        newStatus={pendingStageMove?.targetStage || ''}
      />
    </div>
  );
};
