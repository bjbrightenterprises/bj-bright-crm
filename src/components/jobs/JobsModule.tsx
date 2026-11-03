import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  Search,
  Plus,
  Building2,
  MapPin,
  Calendar,
  Sparkles,
  Users,
  Kanban,
  Edit,
  Trash2,
  Clock,
  CheckCircle2,
  Download,
  Bell,
  Upload,
} from 'lucide-react';
import { JobOpening, Candidate } from '../../types/crm';
import { useCRM } from '../../context/CRMContext';
import { Badge } from '../common/Badge';
import { JobFormModal } from './JobFormModal';
import { CandidateMatchingModal } from './CandidateMatchingModal';
import { SetReminderModal } from '../reminders/SetReminderModal';
import { ExcelExportModal } from '../common/ExcelExportModal';
import { ExcelCsvImportModal } from '../common/ExcelCsvImportModal';
import { JOB_EXPORT_COLUMNS, generateJobsSummarySheet } from '../../lib/excelModuleConfigs';

interface JobsModuleProps {
  onNavigateToPipeline: (jobId?: string) => void;
  onViewCandidateProfile: (candidate: Candidate) => void;
}

export const JobsModule: React.FC<JobsModuleProps> = ({
  onNavigateToPipeline,
  onViewCandidateProfile,
}) => {
  const { visibleJobs, visibleClients, updateJob, deleteJob, canDeleteClientOrJob, pipeline, currentUser } = useCRM();

  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('Open');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [selectedClientSection, setSelectedClientSection] = useState<'All' | 'Green' | 'Blue'>('All');
  const [editingJdJobId, setEditingJdJobId] = useState<string | null>(null);
  const [jdDraft, setJdDraft] = useState<string>('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [jobToEdit, setJobToEdit] = useState<JobOpening | null>(null);
  const [matchingJob, setMatchingJob] = useState<JobOpening | null>(null);
  const [reminderJob, setReminderJob] = useState<JobOpening | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const canEditJobJd =
    currentUser.role === 'admin' ||
    currentUser.role === 'manager' ||
    currentUser.role === 'hr_executive';

  const getJobCompanySection = (job: JobOpening): 'Green' | 'Blue' | 'Red' => {
    const client = visibleClients.find(
      (c) => c.id === job.clientId || c.name.toLowerCase() === job.clientName.toLowerCase()
    );
    if (!client) return 'Green';
    if (client.section === 'Green' || client.status === 'Active') return 'Green';
    if (client.section === 'Blue' || client.status === 'Prospect') return 'Blue';
    return 'Red';
  };

  const activeClientJobsCount = useMemo(
    () => visibleJobs.filter((j) => getJobCompanySection(j) === 'Green').length,
    [visibleJobs, visibleClients]
  );

  const inDiscussionJobsCount = useMemo(
    () => visibleJobs.filter((j) => getJobCompanySection(j) === 'Blue').length,
    [visibleJobs, visibleClients]
  );

  // Filtered jobs
  const filteredJobs = useMemo(() => {
    return visibleJobs.filter((j) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        j.title.toLowerCase().includes(q) ||
        j.clientName.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q) ||
        (j.description && j.description.toLowerCase().includes(q)) ||
        j.skillsRequired.some((s) => s.toLowerCase().includes(q));

      if (!matchesSearch) return false;
      if (selectedStatus !== 'All' && j.status !== selectedStatus) return false;
      if (selectedPriority !== 'All' && j.priority !== selectedPriority) return false;
      if (selectedClientSection !== 'All' && getJobCompanySection(j) !== selectedClientSection) {
        return false;
      }

      return true;
    });
  }, [visibleJobs, visibleClients, search, selectedStatus, selectedPriority, selectedClientSection]);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[#F5A623] shrink-0" />
            <span>Open Job Mandates & Client Requisitions</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            {filteredJobs.length} open mandates across Active Clients ({activeClientJobsCount}) & In Discussion ({inDiscussionJobsCount})
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {(currentUser.role === 'admin' || currentUser.role === 'manager') && (
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="min-h-[42px] px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-[#0B1F4B]" />
              <span>Import Excel</span>
            </button>
          )}

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="min-h-[42px] px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-white" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={() => {
              setJobToEdit(null);
              setIsFormOpen(true);
            }}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-[#0B1F4B] hover:bg-[#163270] text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#F5A623]" />
            <span>New Requisition</span>
          </button>
        </div>
      </div>

      {/* Section Filter Tabs: All vs Active Clients (Green) vs In Discussion (Blue) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={() => setSelectedClientSection('All')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
            selectedClientSection === 'All'
              ? 'bg-[#0B1F4B] text-white border-[#0B1F4B] shadow-sm'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-400'
          }`}
        >
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider opacity-85">All Mandates</p>
            <p className="text-xs font-semibold mt-0.5">Active + In Discussion Companies</p>
          </div>
          <span className="text-2xl font-extrabold">{visibleJobs.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedClientSection('Green')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
            selectedClientSection === 'Green'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
              : 'bg-emerald-50 text-emerald-950 border-emerald-200 hover:border-emerald-400'
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <p className="text-[11px] font-extrabold uppercase tracking-wider">Active Clients (Green)</p>
            </div>
            <p className="text-xs font-medium mt-0.5 opacity-90">Smile India, BJ Bright, MyMoneyMantra</p>
          </div>
          <span className="text-2xl font-extrabold">{activeClientJobsCount}</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedClientSection('Blue')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
            selectedClientSection === 'Blue'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-blue-50 text-blue-950 border-blue-200 hover:border-blue-400'
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <p className="text-[11px] font-extrabold uppercase tracking-wider">In Discussion (Blue)</p>
            </div>
            <p className="text-xs font-medium mt-0.5 opacity-90">Tyariexamki, Perfect Capital, Debt & Dues, etc.</p>
          </div>
          <span className="text-2xl font-extrabold">{inDiscussionJobsCount}</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            inputMode="search"
            placeholder="Search by role title, client name, JD details, skills, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full min-h-[44px] pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold border border-slate-300 bg-white text-slate-900 flex-1 sm:flex-none"
          >
            <option value="All">All Statuses</option>
            <option value="Open">Open Only</option>
            <option value="On Hold">On Hold</option>
            <option value="Closed">Closed</option>
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold border border-slate-300 bg-white text-slate-900 flex-1 sm:flex-none"
          >
            <option value="All">All Priorities</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Jobs List View */}
      <div className="space-y-3">
        {filteredJobs.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center text-slate-500 text-xs border border-slate-200">
            No active job requisitions matching your filter criteria.
          </div>
        ) : (
          filteredJobs.map((job) => {
            const pipelineCountForJob = pipeline.filter((p) => p.jobId === job.id).length;
            const companySection = getJobCompanySection(job);

            return (
              <div
                key={job.id}
                className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs hover:border-[#0B1F4B] transition-all flex flex-col lg:flex-row lg:items-start justify-between gap-4"
              >
                {/* Left: Role Info, JD & Badges */}
                <div className="flex-1 min-w-0 space-y-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-extrabold text-slate-900">
                      {job.title}
                    </h3>
                    {companySection === 'Green' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        Active Client (Green)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-900 border border-blue-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                        In Discussion (Blue)
                      </span>
                    )}
                    <Badge
                      variant={
                        job.priority === 'High'
                          ? 'danger'
                          : job.priority === 'Medium'
                          ? 'warning'
                          : 'neutral'
                      }
                      size="sm"
                    >
                      {job.priority} Priority
                    </Badge>
                    <Badge variant={job.status === 'Open' ? 'success' : 'neutral'} size="sm">
                      {job.status}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-1 font-bold text-slate-900">
                      <Building2 className="w-3.5 h-3.5 text-[#F5A623]" />
                      <span>{job.clientName}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>{job.location}</span>
                    </div>

                    <div className="flex items-center gap-1 font-bold text-[#0B1F4B]">
                      <span>₹{job.salaryMinLPA}-{job.salaryMaxLPA} LPA</span>
                    </div>

                    <div className="flex items-center gap-1 text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{job.minExpYears}-{job.maxExpYears} Years Exp</span>
                    </div>

                    <div className="flex items-center gap-1 font-bold text-emerald-800">
                      <Users className="w-3.5 h-3.5" />
                      <span>{job.positions} Openings</span>
                    </div>

                    {job.deadline && (
                      <div className="flex items-center gap-1 text-rose-700 font-semibold">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Deadline: {job.deadline}</span>
                      </div>
                    )}
                  </div>

                  {/* Full Job Description (JD) Block with quick inline Edit */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                        Job Description (JD) & Mandate Details
                      </span>
                      {canEditJobJd && editingJdJobId !== job.id && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingJdJobId(job.id);
                            setJdDraft(job.description || '');
                          }}
                          className="min-h-[30px] px-2 text-xs font-bold text-[#0B1F4B] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Edit JD</span>
                        </button>
                      )}
                    </div>

                    {editingJdJobId === job.id ? (
                      <div className="space-y-2 pt-1">
                        <textarea
                          rows={3}
                          value={jdDraft}
                          onChange={(e) => setJdDraft(e.target.value)}
                          placeholder="Enter complete Job Description, salary, shift timing, location, and HR contact..."
                          className="w-full px-3 py-2 text-xs rounded-lg border border-[#0B1F4B] bg-white text-slate-900 focus:outline-none"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingJdJobId(null)}
                            className="min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 border border-slate-300 bg-white hover:bg-slate-50 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              updateJob(job.id, { description: jdDraft.trim() });
                              setEditingJdJobId(null);
                            }}
                            className="min-h-[36px] px-3.5 py-1.5 rounded-lg bg-[#0B1F4B] hover:bg-[#163270] text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#F5A623]" />
                            <span>Save JD</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-800 whitespace-pre-line leading-relaxed">
                        {job.description || 'No JD added yet. Click Edit JD to add requirements.'}
                      </p>
                    )}
                  </div>

                  {/* Skills tags */}
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {job.skillsRequired.map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 rounded-md text-[11px] bg-slate-100 text-slate-800 border border-slate-200 font-semibold"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right: Actions and Matching */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-between gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-200">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setReminderJob(job)}
                      className="min-h-[40px] min-w-[40px] p-2 rounded-xl text-amber-700 hover:bg-amber-50 border border-amber-200 flex items-center justify-center cursor-pointer"
                      title="Set Job Deadline or Submission Reminder"
                    >
                      <Bell className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setMatchingJob(job)}
                      className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#F5A623] hover:bg-[#e09312] text-slate-950 font-extrabold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-slate-950" />
                      <span>Match Candidates</span>
                    </button>

                    <button
                      onClick={() => onNavigateToPipeline(job.id)}
                      className="min-h-[40px] px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-900 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="View Kanban board for this job"
                    >
                      <Kanban className="w-3.5 h-3.5 text-[#0B1F4B]" />
                      <span>Pipeline ({pipelineCountForJob})</span>
                    </button>

                    <button
                      onClick={() => {
                        setJobToEdit(job);
                        setIsFormOpen(true);
                      }}
                      className="min-h-[40px] min-w-[40px] p-2 rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-200 flex items-center justify-center cursor-pointer"
                      title="Edit Full Requisition"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    {canDeleteClientOrJob && (
                      <button
                        onClick={() => {
                          if (confirm(`Delete requisition ${job.title}?`)) {
                            deleteJob(job.id);
                          }
                        }}
                        className="min-h-[40px] min-w-[40px] p-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-slate-200 flex items-center justify-center cursor-pointer"
                        title="Delete Requisition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-600">
                    Recruiters:{' '}
                    <span className="font-bold text-slate-900">
                      {job.assignedRecruiterNames.join(', ')}
                    </span>
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Candidate Matching Engine Modal */}
      <CandidateMatchingModal
        isOpen={!!matchingJob}
        onClose={() => setMatchingJob(null)}
        job={matchingJob}
        onViewCandidate={(cand) => {
          setMatchingJob(null);
          onViewCandidateProfile(cand);
        }}
      />

      {/* Job Form Modal */}
      <JobFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setJobToEdit(null);
        }}
        jobToEdit={jobToEdit}
      />

      {/* Set Reminder Modal for Job */}
      <SetReminderModal
        isOpen={!!reminderJob}
        onClose={() => setReminderJob(null)}
        relatedType="job"
        relatedId={reminderJob?.id}
        relatedName={reminderJob?.title}
        defaultTitle={
          reminderJob
            ? `Follow up on submissions for ${reminderJob.title} (${reminderJob.clientName})`
            : undefined
        }
      />

      {/* Excel/CSV Ingestion Wizard Modal */}
      <ExcelCsvImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        entityType="jobs"
      />

      {/* Analyst-Grade Excel Export Modal */}
      <ExcelExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        moduleName="Jobs"
        tableName="tblJobs"
        sheetName="Jobs"
        columns={JOB_EXPORT_COLUMNS}
        filteredData={filteredJobs}
        allAccessibleData={visibleJobs}
        filtersDescription={`Status: ${selectedStatus}, Priority: ${selectedPriority}, Search: "${search || 'All'}"`}
        summaryGenerator={generateJobsSummarySheet}
      />
    </div>
  );
};
