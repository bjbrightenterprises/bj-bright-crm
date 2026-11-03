import React from 'react';
import {
  Users,
  Building2,
  Briefcase,
  Calendar,
  CheckCircle2,
  Video,
  CheckSquare,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { getClientSection } from '../../types/crm';
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

  // Metrics (4 KPI cards; Active Clients counts only Green companies)
  const totalCandidates = visibleCandidates.length;
  const activeClients = visibleClients.filter((c) => getClientSection(c) === 'Green').length;
  const openJobs = visibleJobs.filter((j) => j.status === 'Open').length;
  const pendingTasksCount = visibleReminders.filter((r) => r.status === 'Pending').length;

  // Local Indian Date (IST) string YYYY-MM-DD
  const toISTDateStr = (daysOffset = 0) => {
    const d = new Date(Date.now() + daysOffset * 86400000);
    return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  };
  const todayStr = toISTDateStr(0);
  const twoDaysLaterStr = toISTDateStr(2);

  // Follow-up Alerts panel items
  // 1. Today's pending interviews
  const todaysInterviews = visibleInterviews.filter(
    (i) => i.status === 'Scheduled' && i.dateTime.startsWith(todayStr)
  );

  // 2. Client follow-ups due today or overdue (tasks + client nextFollowUpDate)
  const clientFollowUpTasksDue = visibleReminders.filter(
    (r) =>
      r.status === 'Pending' &&
      r.dueDate <= todayStr &&
      (r.category === 'Client Follow-up' || r.relatedType === 'client' || r.title.toLowerCase().includes('client'))
  );
  const clientsWithDueFollowUp = visibleClients.filter(
    (c) => c.nextFollowUpDate && c.nextFollowUpDate <= todayStr
  );
  const totalClientFollowUpsCount = clientFollowUpTasksDue.length + clientsWithDueFollowUp.length;

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
    updateCandidate(candidateId, { status: 'Placed' }, 'Marked as Placed from Joining Alert');
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0B1F4B] via-[#0e275f] to-[#163270] text-white p-5 sm:p-6 md:p-8 shadow-md">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#F5A623]/20 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-semibold backdrop-blur-xs mb-2.5 border border-white/15">
              <Sparkles className="w-3.5 h-3.5 text-[#F5A623]" />
              <span>BJ Bright Enterprises • Noida Sec 62</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Namaste, {currentUser.name}
            </h2>
            <p className="text-slate-200 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
              Welcome to your recruitment dashboard. You have{' '}
              <span className="font-semibold text-amber-300">{todaysInterviews.length} interviews today</span>,{' '}
              <span className="font-semibold text-emerald-300">{openJobs} open jobs</span>, and{' '}
              <span className="font-semibold text-amber-300">{pendingTasksCount} pending tasks</span>.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate('tasks')}
              className="min-h-[44px] px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-xs border border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckSquare className="w-4 h-4 text-[#F5A623] shrink-0" />
              <span>My Tasks ({pendingTasksCount})</span>
            </button>
            <button
              onClick={onOpenScheduleInterview}
              className="min-h-[44px] px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-xs border border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-[#F5A623] shrink-0" />
              <span>Schedule Interview</span>
            </button>
            <button
              onClick={onOpenCandidateForm}
              className="col-span-2 sm:col-span-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-[#F5A623] hover:bg-[#e09312] text-slate-950 text-xs font-extrabold shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>Add Candidate</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 KPI Cards (2x2 on mobile/tablet, 4-across on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <div
          onClick={() => onNavigate('candidates')}
          className="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-[#0B1F4B] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2.5 sm:mb-3 gap-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-[#0B1F4B] flex items-center justify-center font-bold shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[10px] uppercase font-bold text-emerald-900 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full truncate">
              Active Network
            </span>
          </div>
          <span className="text-[11px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider block">
            Total Candidates
          </span>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 group-hover:text-[#0B1F4B] transition-colors">
            {totalCandidates}
          </p>
        </div>

        <div
          onClick={() => onNavigate('clients')}
          className="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-[#0B1F4B] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2.5 sm:mb-3 gap-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold shrink-0">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[10px] uppercase font-bold text-amber-900 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full truncate">
              Verified Partners
            </span>
          </div>
          <span className="text-[11px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider block">
            Active Clients
          </span>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 group-hover:text-amber-700 transition-colors">
            {activeClients}
          </p>
        </div>

        <div
          onClick={() => onNavigate('jobs')}
          className="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-[#0B1F4B] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2.5 sm:mb-3 gap-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold shrink-0">
              <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[10px] uppercase font-bold text-purple-900 bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-full truncate">
              NCR Openings
            </span>
          </div>
          <span className="text-[11px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider block">
            Open Job Mandates
          </span>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 group-hover:text-purple-700 transition-colors">
            {openJobs}
          </p>
        </div>

        <div
          onClick={() => onNavigate('tasks')}
          className="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-[#0B1F4B] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2.5 sm:mb-3 gap-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold shrink-0">
              <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[10px] uppercase font-bold text-rose-900 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-full truncate">
              Action Required
            </span>
          </div>
          <span className="text-[11px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider block">
            Pending Tasks
          </span>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 group-hover:text-rose-700 transition-colors">
            {pendingTasksCount}
          </p>
        </div>
      </div>

      {/* Follow-up Alerts Panel (3 Columns on Desktop, Stacked on Mobile) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3.5">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#F5A623] shrink-0" />
              <span>Follow-up & Action Alerts (Noida IST)</span>
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Immediate action items requiring recruitment follow-up today
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Column 1: Today's Pending Interviews */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                <span>Interviews Today ({todaysInterviews.length})</span>
              </span>
              <button
                onClick={() => onNavigate('interviews')}
                className="min-h-[32px] px-2 text-xs font-bold text-[#0B1F4B] hover:underline cursor-pointer"
              >
                View All
              </button>
            </div>

            {todaysInterviews.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">No interviews scheduled for today.</p>
            ) : (
              <div className="space-y-2.5">
                {todaysInterviews.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onNavigate('interviews')}
                    className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs hover:border-purple-400 transition-all cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-xs text-slate-900 truncate">{item.candidateName}</p>
                      <span className="text-[10px] font-mono font-bold text-purple-900 bg-purple-100 border border-purple-200 px-2 py-0.5 rounded shrink-0">
                        {item.dateTime.slice(11, 16)} IST
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-700 truncate">{item.roundName} @ {item.clientName}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Column 2: Client Follow-ups Due Today or Overdue */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Client Follow-ups ({totalClientFollowUpsCount})</span>
              </span>
              <button
                onClick={() => onNavigate('clients')}
                className="min-h-[32px] px-2 text-xs font-bold text-[#0B1F4B] hover:underline cursor-pointer"
              >
                View Clients
              </button>
            </div>

            {totalClientFollowUpsCount === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">All client follow-ups completed.</p>
            ) : (
              <div className="space-y-2.5">
                {clientsWithDueFollowUp.map((client) => (
                  <div
                    key={`client-fu-${client.id}`}
                    onClick={() => onNavigate('clients')}
                    className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs hover:border-amber-400 transition-all cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-xs text-slate-900 leading-snug">{client.companyName}</p>
                      {client.nextFollowUpDate && client.nextFollowUpDate < todayStr ? (
                        <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-900 border border-rose-200 font-bold shrink-0">
                          Overdue
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200 font-bold shrink-0">
                          Due Today
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-600">
                      <span className="truncate">{client.hrContacts?.[0]?.name || 'Contact'} • {client.city}</span>
                      <span className="font-medium shrink-0">Follow-up: {client.nextFollowUpDate}</span>
                    </div>
                  </div>
                ))}
                {clientFollowUpTasksDue.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-xs text-slate-900 leading-snug">{task.title}</p>
                      {task.dueDate < todayStr && (
                        <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-900 border border-rose-200 font-bold shrink-0">
                          Overdue
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-600 font-medium">Due: {task.dueDate}</span>
                      <button
                        onClick={() => handleMarkTaskDone(task.id)}
                        className="min-h-[34px] px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Done</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Column 3: Candidate Joinings Due Today / Tomorrow / 2 Days */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Candidate Joining ({candidateJoiningsDue.length})</span>
              </span>
              <button
                onClick={() => onNavigate('candidates')}
                className="min-h-[32px] px-2 text-xs font-bold text-[#0B1F4B] hover:underline cursor-pointer"
              >
                View Candidates
              </button>
            </div>

            {candidateJoiningsDue.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">No joinings scheduled for next 48 hours.</p>
            ) : (
              <div className="space-y-2.5">
                {candidateJoiningsDue.map((cand) => {
                  const isOverdue = cand.expectedJoiningDate && cand.expectedJoiningDate < todayStr;
                  return (
                    <div
                      key={cand.id}
                      className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-xs text-slate-900 truncate">{cand.fullName}</p>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${
                            isOverdue
                              ? 'bg-rose-100 text-rose-900 border-rose-200'
                              : 'bg-emerald-100 text-emerald-900 border-emerald-200'
                          }`}
                        >
                          {isOverdue ? 'Joining Overdue' : `Joining: ${cand.expectedJoiningDate}`}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-700 truncate">
                        {cand.jobTitle || 'Role'} @ {cand.clientName || 'Client'}
                      </p>
                      <div className="flex items-center justify-end pt-1">
                        <button
                          onClick={() => handleMarkCandidateJoined(cand.id)}
                          className="min-h-[34px] px-3 py-1.5 rounded-lg bg-[#0B1F4B] hover:bg-[#163270] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-[#F5A623]" />
                          <span>Placed</span>
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
