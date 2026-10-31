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
import { Upload } from 'lucide-react';

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

  const handleExportCSV = () => {
    if (filteredJobs.length === 0) {
      alert('No jobs to export.');
      return;
    }

    const headers = [
      'Job Title',
      'Client Name',
      'Location',
      'Open Positions',
      'Salary Min LPA',
      'Salary Max LPA',
      'Min Exp Years',
      'Max Exp Years',
      'Required Skills',
      'Priority',
      'Status',
      'Deadline',
      'Assigned Recruiters',
    ];

    const rows = filteredJobs.map((j) => [
      `"${j.title}"`,
      `"${j.clientName}"`,
      `"${j.location}"`,
      j.positions,
      j.salaryMinLPA,
      j.salaryMaxLPA,
      j.minExpYears,
      j.maxExpYears,
      `"${j.skillsRequired.join(', ')}"`,
      `"${j.priority}"`,
      `"${j.status}"`,
      `"${j.deadline}"`,
      `"${j.assignedRecruiterNames.join(', ')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BJ_Bright_Jobs_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[#F5A623]" />
            Open Job Mandates & Client Requisitions
          </h2>
          <p className="text-xs text-slate-500">
            {filteredJobs.length} open mandates across Active Clients ({activeClientJobsCount}) & In Discussion ({inDiscussionJobsCount})
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {(currentUser.role === 'admin' || currentUser.role === 'manager') && (
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>Import Excel / CSV</span>
            </button>
          )}

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-white" />
            <span>Export to Excel</span>
          </button>

          <button
            onClick={() => {
              setJobToEdit(null);
              setIsFormOpen(true);
            }}
            className="px-4 py-2 rounded-lg bg-[#0B1F4B] hover:bg-[#163270] text-white text-xs font-bold shadow-md transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-[#F5A623]" />
            <span>New Requisition</span>
          </button>
        </div>
      </div>

      {/* Section Filter Tabs: All vs Active Clients (Green) vs In Discussion (Blue) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => setSelectedClientSection('All')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
            selectedClientSection === 'All'
              ? 'bg-[#0B1F4B] text-white border-[#0B1F4B] shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-slate-400'
          }`}
        >
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider opacity-80">All Mandates</p>
            <p className="text-xs font-semibold mt-0.5">Active + In Discussion Companies</p>
          </div>
          <span className="text-2xl font-extrabold">{visibleJobs.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedClientSection('Green')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
            selectedClientSection === 'Green'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
              : 'bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800/70 hover:border-emerald-400'
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
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
              ? 'bg-blue-600 text-white border-blue-600 shadow-md'
              : 'bg-blue-50/70 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800/70 hover:border-blue-400'
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <p className="text-[11px] font-extrabold uppercase tracking-wider">In Discussion (Blue)</p>
            </div>
            <p className="text-xs font-medium mt-0.5 opacity-90">Tyariexamki, Perfect Capital, Debt & Dues, NN Pure Herbs, etc.</p>
          </div>
          <span className="text-2xl font-extrabold">{inDiscussionJobsCount}</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by role title, client name, JD details, skills, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex-1 sm:flex-none"
          >
            <option value="All">All Statuses</option>
            <option value="Open">Open Only</option>
            <option value="On Hold">On Hold</option>
            <option value="Closed">Closed</option>
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-2 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex-1 sm:flex-none"
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
          <div className="bg-white dark:bg-slate-900 rounded-xl p-12 text-center text-slate-400 text-xs border border-slate-200 dark:border-slate-800">
            No active job requisitions matching your filter criteria.
          </div>
        ) : (
          filteredJobs.map((job) => {
            const pipelineCountForJob = pipeline.filter((p) => p.jobId === job.id).length;
            const companySection = getJobCompanySection(job);

            return (
              <div
                key={job.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-[#0B1F4B] dark:hover:border-amber-500 transition-all flex flex-col lg:flex-row lg:items-start justify-between gap-4"
              >
                {/* Left: Role Info, JD & Badges */}
                <div className="flex-1 min-w-0 space-y-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {job.title}
                    </h3>
                    {companySection === 'Green' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Active Client (Green)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
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

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <div className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200">
                      <Building2 className="w-3.5 h-3.5 text-[#F5A623]" />
                      <span>{job.clientName}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{job.location}</span>
                    </div>

                    <div className="flex items-center gap-1 font-semibold text-[#0B1F4B] dark:text-amber-400">
                      <span>₹{job.salaryMinLPA}-{job.salaryMaxLPA} LPA</span>
                    </div>

                    <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{job.minExpYears}-{job.maxExpYears} Years Exp</span>
                    </div>

                    <div className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                      <Users className="w-3.5 h-3.5" />
                      <span>{job.positions} Openings</span>
                    </div>

                    {job.deadline && (
                      <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Deadline: {job.deadline}</span>
                      </div>
                    )}
                  </div>

                  {/* Full Job Description (JD) Block with quick inline Edit */}
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                        Job Description (JD) & Mandate Details
                      </span>
                      {canEditJobJd && editingJdJobId !== job.id && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingJdJobId(job.id);
                            setJdDraft(job.description || '');
                          }}
                          className="text-[11px] font-bold text-blue-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
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
                          className="w-full px-3 py-2 text-xs rounded-lg border border-blue-400 dark:border-amber-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingJdJobId(null)}
                            className="px-2.5 py-1 rounded text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              updateJob(job.id, { description: jdDraft.trim() });
                              setEditingJdJobId(null);
                            }}
                            className="px-3 py-1 rounded bg-[#0B1F4B] hover:bg-[#163270] text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#F5A623]" />
                            <span>Save JD</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                        {job.description || 'No JD added yet. Click Edit JD to add requirements.'}
                      </p>
                    )}
                  </div>

                  {/* Skills tags */}
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {job.skillsRequired.map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 rounded text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right: Actions and Matching */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Set Reminder Button */}
                    <button
                      onClick={() => setReminderJob(job)}
                      className="p-2 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60"
                      title="Set Job Deadline or Submission Reminder"
                    >
                      <Bell className="w-4 h-4" />
                    </button>

                    {/* Auto Matching Candidate Engine */}
                    <button
                      onClick={() => setMatchingJob(job)}
                      className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all"
                    >
                      <Sparkles className="w-4 h-4 text-white" />
                      <span>Match Candidates</span>
                    </button>

                    {/* Pipeline Kanban */}
                    <button
                      onClick={() => onNavigateToPipeline(job.id)}
                      className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                      title="View Kanban board for this job"
                    >
                      <Kanban className="w-3.5 h-3.5 text-blue-600" />
                      <span>Pipeline ({pipelineCountForJob})</span>
                    </button>

                    <button
                      onClick={() => {
                        setJobToEdit(job);
                        setIsFormOpen(true);
                      }}
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
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
                        className="p-2 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        title="Delete Requisition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400">
                    Recruiters: <span className="font-semibold text-slate-600 dark:text-slate-300">{job.assignedRecruiterNames.join(', ')}</span>
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
        defaultTitle={reminderJob ? `Follow up on submissions for ${reminderJob.title} (${reminderJob.clientName})` : undefined}
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
