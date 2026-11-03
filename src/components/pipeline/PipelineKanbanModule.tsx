import React, { useState, useMemo } from 'react';
import {
  Kanban,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Eye,
  Download,
  ArrowRightLeft,
} from 'lucide-react';
import { PipelineItem, PipelineStage, Candidate } from '../../types/crm';
import { useCRM } from '../../context/CRMContext';
import { Modal } from '../common/Modal';
import { ExcelExportModal } from '../common/ExcelExportModal';
import { PIPELINE_EXPORT_COLUMNS } from '../../lib/excelModuleConfigs';

const STAGES: PipelineStage[] = [
  'Sourced',
  'Screened',
  'Submitted to Client',
  'Interview',
  'Offer',
  'Placed',
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
  const { visiblePipeline, movePipelineStage, jobs, candidates } = useCRM();

  const [selectedJobId, setSelectedJobId] = useState<string>(initialJobId || 'all');
  const [mobileActiveStage, setMobileActiveStage] = useState<PipelineStage>('Sourced');
  const [moveModalItem, setMoveModalItem] = useState<PipelineItem | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

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
      Placed: [],
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
      movePipelineStage(itemId, targetStage);
    }
    setDraggedItemId(null);
  };

  const handleNextStage = (item: PipelineItem) => {
    const currentIndex = STAGES.indexOf(item.stage);
    if (currentIndex < STAGES.length - 2) {
      movePipelineStage(item.id, STAGES[currentIndex + 1]);
    }
  };

  const handlePrevStage = (item: PipelineItem) => {
    const currentIndex = STAGES.indexOf(item.stage);
    if (currentIndex > 0) {
      movePipelineStage(item.id, STAGES[currentIndex - 1]);
    }
  };

  const stageHeaderColors: Record<PipelineStage, string> = {
    Sourced: 'border-blue-500 bg-blue-50 text-blue-950',
    Screened: 'border-sky-500 bg-sky-50 text-sky-950',
    'Submitted to Client': 'border-indigo-500 bg-indigo-50 text-indigo-950',
    Interview: 'border-amber-500 bg-amber-50 text-amber-950',
    Offer: 'border-purple-500 bg-purple-50 text-purple-950',
    Placed: 'border-emerald-500 bg-emerald-50 text-emerald-950',
    Rejected: 'border-rose-500 bg-rose-50 text-rose-950',
  };

  const mobileStageItems = stageColumns[mobileActiveStage] || [];

  return (
    <div className="space-y-4">
      {/* Board Header & Job Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Kanban className="w-5 h-5 text-[#F5A623] shrink-0" />
            <span>Hiring Pipeline Board</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Drag candidates across stages or use 1-click stage transitions. Logs activity automatically.
          </p>
        </div>

        {/* Filter by job mandate & Export */}
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-xs font-bold text-slate-700 whitespace-nowrap">Filter Mandate:</label>
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="min-h-[42px] px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B1F4B] flex-1 sm:flex-none"
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
            className="min-h-[42px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-white" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* MOBILE VIEW (<768px): Horizontal Stage Pill Bar + Active Stage Cards + "Move Stage" Bottom Sheet */}
      <div className="md:hidden space-y-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5">
          {STAGES.map((stage) => {
            const count = (stageColumns[stage] || []).length;
            const isActive = mobileActiveStage === stage;
            return (
              <button
                key={stage}
                onClick={() => setMobileActiveStage(stage)}
                className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-[#0B1F4B] text-white border-[#0B1F4B] shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{stage}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                    isActive ? 'bg-[#F5A623] text-slate-950' : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          {mobileStageItems.length === 0 ? (
            <div className="p-8 rounded-xl bg-white border border-dashed border-slate-300 text-center text-xs text-slate-500">
              No candidates currently in <span className="font-bold text-slate-800">{mobileActiveStage}</span>.
            </div>
          ) : (
            mobileStageItems.map((item) => {
              const candidateObj = candidates.find((c) => c.id === item.candidateId);
              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <button
                        onClick={() => {
                          if (candidateObj) onViewCandidateProfile(candidateObj);
                        }}
                        className="font-extrabold text-sm text-slate-900 hover:text-[#0B1F4B] text-left block"
                      >
                        {item.candidateName}
                      </button>
                      <p className="text-xs text-slate-600 font-medium">
                        {item.jobTitle} • {item.clientName}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#0B1F4B] border border-blue-200 font-bold text-[11px] shrink-0">
                      ₹{item.candidateSalary} LPA • {item.candidateExp}y
                    </span>
                  </div>

                  {item.candidateSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.candidateSkills.slice(0, 3).map((sk) => (
                        <span
                          key={sk}
                          className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-200"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200">
                    <div className="flex items-center gap-1.5">
                      {candidateObj && (
                        <button
                          onClick={() => onViewCandidateProfile(candidateObj)}
                          className="min-h-[38px] px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#0B1F4B]" />
                          <span>Profile</span>
                        </button>
                      )}
                      {candidateObj && (
                        <button
                          onClick={() => onScheduleInterview(candidateObj)}
                          className="min-h-[38px] px-3 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-bold flex items-center gap-1"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Interview</span>
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => setMoveModalItem(item)}
                      className="min-h-[38px] px-3 rounded-lg bg-[#0B1F4B] text-white font-bold flex items-center gap-1.5"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5 text-[#F5A623]" />
                      <span>Move Stage</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* TABLET & DESKTOP VIEW (>=768px): Kanban Horizontal Scrollable Columns */}
      <div className="hidden md:flex gap-4 overflow-x-auto pb-6 pt-1 min-h-[calc(100vh-280px)]">
        {STAGES.map((stage) => {
          const items = stageColumns[stage] || [];

          return (
            <div
              key={stage}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage)}
              className="w-76 shrink-0 bg-slate-100/80 rounded-2xl flex flex-col border border-slate-200 overflow-hidden"
            >
              {/* Column Header */}
              <div className={`p-3 border-t-4 border-b border-slate-200 flex items-center justify-between ${stageHeaderColors[stage]}`}>
                <div className="flex items-center gap-2">
                  <span className="font-black text-xs">{stage}</span>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white text-slate-900 border border-slate-200 shadow-2xs">
                  {items.length}
                </span>
              </div>

              {/* Column Cards Container */}
              <div className="p-3 flex-1 overflow-y-auto space-y-3">
                {items.length === 0 ? (
                  <div className="h-28 border-2 border-dashed border-slate-300 bg-white/60 rounded-xl flex items-center justify-center text-slate-500 text-xs">
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
                        className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs hover:shadow-md hover:border-[#0B1F4B] cursor-grab active:cursor-grabbing transition-all space-y-2 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <button
                              onClick={() => {
                                if (candidateObj) onViewCandidateProfile(candidateObj);
                              }}
                              className="font-bold text-slate-900 hover:text-[#0B1F4B] hover:underline text-left block cursor-pointer"
                            >
                              {item.candidateName}
                            </button>
                            <p className="text-[11px] text-slate-600 font-medium truncate">
                              {item.jobTitle}
                            </p>
                          </div>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800">
                            {item.clientName.split(' ')[0]}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                          <span className="font-bold text-slate-900">
                            ₹{item.candidateSalary} LPA
                          </span>
                          <span>{item.candidateExp}y Exp</span>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {item.candidateSkills.slice(0, 2).map((sk) => (
                            <span
                              key={sk}
                              className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-[#0B1F4B] border border-blue-200"
                            >
                              {sk}
                            </span>
                          ))}
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            {candidateObj && (
                              <button
                                onClick={() => onScheduleInterview(candidateObj)}
                                className="p-1.5 rounded-lg text-purple-700 hover:bg-purple-50 cursor-pointer"
                                title="Schedule Interview"
                              >
                                <Calendar className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {candidateObj && (
                              <button
                                onClick={() => onViewCandidateProfile(candidateObj)}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-[#0B1F4B] hover:bg-slate-100 cursor-pointer"
                                title="View Full Profile"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            {stage !== 'Sourced' && (
                              <button
                                onClick={() => handlePrevStage(item)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer"
                                title="Move to previous stage"
                              >
                                <ArrowLeft className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {stage !== 'Placed' && stage !== 'Rejected' && (
                              <button
                                onClick={() => handleNextStage(item)}
                                className="p-1.5 rounded-lg bg-[#0B1F4B] text-white hover:bg-[#163270] cursor-pointer"
                                title="Advance to next stage"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="text-[10px] text-slate-500 flex items-center justify-between">
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

      {/* Mobile Move Stage Picker Modal */}
      <Modal
        isOpen={!!moveModalItem}
        onClose={() => setMoveModalItem(null)}
        title={moveModalItem ? `Move ${moveModalItem.candidateName}` : 'Move Stage'}
        subtitle={moveModalItem ? `Current Stage: ${moveModalItem.stage}` : undefined}
        maxWidth="md"
      >
        {moveModalItem && (
          <div className="space-y-2">
            {STAGES.map((targetStage) => {
              const isCurrent = moveModalItem.stage === targetStage;
              return (
                <button
                  key={targetStage}
                  onClick={() => {
                    if (!isCurrent) {
                      movePipelineStage(moveModalItem.id, targetStage);
                      setMobileActiveStage(targetStage);
                    }
                    setMoveModalItem(null);
                  }}
                  className={`w-full min-h-[44px] px-4 py-2.5 rounded-xl border text-left text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-[#0B1F4B] text-white border-[#0B1F4B]'
                      : 'bg-white text-slate-900 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{targetStage}</span>
                  {isCurrent && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F5A623] text-slate-950 font-extrabold">
                      Current
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </Modal>

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
    </div>
  );
};
