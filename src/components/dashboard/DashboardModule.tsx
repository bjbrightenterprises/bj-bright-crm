import React from 'react';
import {
  Users,
  Building2,
  Briefcase,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Video,
  MapPin,
  CheckSquare,
  Sparkles,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { NavItem } from '../layout/Sidebar';

interface DashboardModuleProps {
  onNavigate: (tab: NavItem) => void;
  onOpenCandidateForm: () => void;
  onOpenScheduleInterview: () => void;
}

export const DashboardModule: React.FC<DashboardModuleProps> = ({
  onNavigate,
  onOpenCandidateForm,
  onOpenScheduleInterview,
}) => {
  const {
    visibleCandidates,
    visibleClients,
    visibleJobs,
    visibleInterviews,
    visibleReminders,
    currentUser,
    updateReminder,
    updateCandidate,
  } = useCRM();

  // Metrics (4 KPI cards as requested)
  const totalCandidates = visibleCandidates.length;
  const activeClients = visibleClients.filter((c) => c.status === 'Active').length;
  const openJobs = visibleJobs.filter((j) => j.status === 'Open').length;
  const pendingTasksCount = visibleReminders.filter((r) => r.status === 'Pending').length;

  // Local Indian Date (IST) string YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const twoDaysLater = new Date();
  twoDaysLater.setDate(twoDaysLater.getDate() + 2);
  const twoDaysLaterStr = twoDaysLater.toISOString().split('T')[0];

  // Follow-up Alerts panel items
  // 1. Today's pending interviews
  const todaysInterviews = visibleInterviews.filter(
    (i) => i.status === 'Scheduled' && i.dateTime.startsWith(todayStr)
  );

  // 2. Client follow-ups due today or overdue
  const clientFollowUpsDue = visibleReminders.filter(
    (r) =>
      r.status === 'Pending' &&
      r.dueDate <= todayStr &&
      (r.category === 'Client Follow-up' || r.relatedType === 'client' || r.title.toLowerCase().includes('client'))
  );

  // 3. Candidate joinings due today, tomorrow, or within 2 days (or overdue)
  const candidateJoiningsDue = visibleCandidates.filter((c) => {
    if (c.status !== 'Selected' && c.status !== 'Offered') return false;
    if (!c.expectedJoiningDate) return false;
    return c.expectedJoiningDate <= twoDaysLaterStr;
  });

  const handleMarkTaskDone = (reminderId: string) => {
    updateReminder(reminderId, { status: 'Completed', completedAt: new Date().toISOString() });
  };

  const handleMarkCandidateJoined = (candidateId: string) => {
    updateCandidate(candidateId, { status: 'Joined' });
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0B1F4B] via-[#0e275f] to-[#163270] text-white p-6 md:p-8 shadow-xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#F5A623]/20 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-semibold backdrop-blur-xs mb-3 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-[#F5A623]" />
              <span>BJ Bright Enterprises • Noida Sec 62</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Namaste, {currentUser.name}
            </h2>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              Welcome to your recruitment dashboard. You have{' '}
              <span className="font-semibold text-amber-300">{todaysInterviews.length} interviews today</span>,{' '}
              <span className="font-semibold text-emerald-300">{openJobs} open jobs</span>, and{' '}
              <span className="font-semibold text-amber-300">{pendingTasksCount} pending tasks</span>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('tasks')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-xs border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <CheckSquare className="w-4 h-4 text-[#F5A623]" />
              <span>My Tasks ({pendingTasksCount})</span>
            </button>
            <button
              onClick={onOpenScheduleInterview}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-xs border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-[#F5A623]" />
              <span>Schedule Interview</span>
            </button>
            <button
              onClick={onOpenCandidateForm}
              className="px-4 py-2.5 rounded-xl bg-[#F5A623] hover:bg-[#e09312] text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>Add Candidate</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div
          onClick={() => onNavigate('candidates')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-[#0B1F4B] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0B1F4B] dark:text-blue-400 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
              Active Network
            </span>
          </div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Candidates</span>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1 group-hover:text-blue-600 transition-colors">
            {totalCandidates}
          </p>
        </div>

        <div
          onClick={() => onNavigate('clients')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-[#0B1F4B] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-[#F5A623] flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
              Verified Partners
            </span>
          </div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Clients</span>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1 group-hover:text-amber-500 transition-colors">
            {activeClients}
          </p>
        </div>

        <div
          onClick={() => onNavigate('jobs')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-[#0B1F4B] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Briefcase className="w-5 h-5" />
            </div>
            <span className="text-[10px] uppercase font-bold text-purple-600 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full">
              NCR Openings
            </span>
          </div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Open Job Mandates</span>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1 group-hover:text-purple-600 transition-colors">
            {openJobs}
          </p>
        </div>

        <div
          onClick={() => onNavigate('tasks')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-[#0B1F4B] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center font-bold">
              <CheckSquare className="w-5 h-5" />
            </div>
            <span className="text-[10px] uppercase font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full">
              Action Required
            </span>
          </div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Tasks</span>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1 group-hover:text-rose-600 transition-colors">
            {pendingTasksCount}
          </p>
        </div>
      </div>

      {/* Follow-up Alerts Panel (3 Columns) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#F5A623]" />
              Follow-up & Action Alerts (Noida IST)
            </h3>
            <p className="text-xs text-slate-500">
              Immediate action items requiring recruitment follow-up today
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1: Today's Pending Interviews */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-purple-600" />
                Interviews Today ({todaysInterviews.length})
              </span>
              <button
                onClick={() => onNavigate('interviews')}
                className="text-[11px] font-bold text-blue-600 dark:text-amber-400 hover:underline"
              >
                View All
              </button>
            </div>

            {todaysInterviews.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">No interviews scheduled for today.</p>
            ) : (
              <div className="space-y-2.5">
                {todaysInterviews.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onNavigate('interviews')}
                    className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs hover:border-purple-400 transition-all cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-xs text-slate-900 dark:text-white">{item.candidateName}</p>
                      <span className="text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded">
                        {item.dateTime.slice(11, 16)} IST
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">{item.roundName} @ {item.clientName}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Column 2: Client Follow-ups Due Today or Overdue */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#F5A623]" />
                Client Follow-ups ({clientFollowUpsDue.length})
              </span>
              <button
                onClick={() => onNavigate('tasks')}
                className="text-[11px] font-bold text-blue-600 dark:text-amber-400 hover:underline"
              >
                View Tasks
              </button>
            </div>

            {clientFollowUpsDue.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">All client follow-ups completed.</p>
            ) : (
              <div className="space-y-2.5">
                {clientFollowUpsDue.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-xs text-slate-900 dark:text-white leading-snug">{task.title}</p>
                      {task.dueDate < todayStr && (
                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold shrink-0">
                          Overdue
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-400 font-medium">Due: {task.dueDate}</span>
                      <button
                        onClick={() => handleMarkTaskDone(task.id)}
                        className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Mark Done</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Column 3: Candidate Joinings Due Today / Tomorrow / 2 Days */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                Candidate Joinings ({candidateJoiningsDue.length})
              </span>
              <button
                onClick={() => onNavigate('candidates')}
                className="text-[11px] font-bold text-blue-600 dark:text-amber-400 hover:underline"
              >
                View Candidates
              </button>
            </div>

            {candidateJoiningsDue.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">No joinings scheduled for next 48 hours.</p>
            ) : (
              <div className="space-y-2.5">
                {candidateJoiningsDue.map((cand) => {
                  const isOverdue = cand.expectedJoiningDate && cand.expectedJoiningDate < todayStr;
                  return (
                    <div
                      key={cand.id}
                      className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-xs text-slate-900 dark:text-white">{cand.fullName}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isOverdue ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                          {isOverdue ? 'Joining Overdue' : `Joining: ${cand.expectedJoiningDate}`}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">
                        {cand.jobTitle || 'Role'} @ {cand.clientName || 'Client'}
                      </p>
                      <div className="flex items-center justify-end pt-1">
                        <button
                          onClick={() => handleMarkCandidateJoined(cand.id)}
                          className="px-3 py-1 rounded bg-[#0B1F4B] hover:bg-[#163270] text-white text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                        >
                          <UserCheck className="w-3 h-3 text-[#F5A623]" />
                          <span>Mark Joined</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
