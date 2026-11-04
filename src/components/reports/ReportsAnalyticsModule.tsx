import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Briefcase,
  Download,
  FileSpreadsheet,
  Printer,
  TrendingUp,
  Users,
  Share2,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { ExcelExportModal } from '../common/ExcelExportModal';
import {
  PERFORMANCE_REPORT_EXPORT_COLUMNS,
  generatePerformanceSummarySheet,
} from '../../lib/excelModuleConfigs';
import { matchesEntryDateFilter } from '../../lib/workProfiles';

export const ReportsAnalyticsModule: React.FC = () => {
  const {
    candidates,
    interviews,
    pipeline,
    reminders,
    users,
    companySettings,
    currentUser,
    isRecruiterOrHr,
  } = useCRM();

  const [period, setPeriod] = useState<'daily' | 'weekly'>('weekly');
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Filter team members based on role
  const targetUsers = useMemo(() => {
    if (isRecruiterOrHr) {
      return users.filter((u) => u.id === currentUser.id);
    }
    return users;
  }, [users, currentUser, isRecruiterOrHr]);

  // Performance data calculation per user (counting Candidates Added using entryDate)
  const performanceRows = useMemo(() => {
    const filterMode = period === 'daily' ? 'Today' : 'This Week';
    return targetUsers.map((u) => {
      const userCands = candidates.filter((c) => c.assignedRecruiterId === u.id);
      const enteredByUserCands = candidates.filter((c) =>
        c.enteredByUserId
          ? c.enteredByUserId === u.id
          : c.enteredBy
          ? c.enteredBy.toLowerCase() === u.name.toLowerCase()
          : c.assignedRecruiterId === u.id
      );
      const periodAddedCands = enteredByUserCands.filter((c) =>
        matchesEntryDateFilter(c.entryDate, c.createdAt, filterMode)
      );
      const prevAddedCands =
        period === 'daily'
          ? enteredByUserCands.filter((c) =>
              matchesEntryDateFilter(c.entryDate, c.createdAt, 'Yesterday')
            )
          : [];

      const userInterviews = interviews.filter((i) => i.assignedToRecruiterId === u.id);
      const userSubmissions = pipeline.filter(
        (p) => p.assignedRecruiterId === u.id && p.stage === 'Submitted to Client'
      );
      const userOffers = userCands.filter((c) => c.status === 'Offered');
      const userJoinings = userCands.filter((c) => c.status === 'Placed');
      const userTasks = reminders.filter(
        (r) => r.assignedToUserId === u.id && r.status === 'Completed'
      );

      const addedCount = periodAddedCands.length;
      const prevCands = period === 'daily' ? prevAddedCands.length : Math.max(0, addedCount - 1);
      const prevInterviews = Math.max(0, userInterviews.length - 1);
      const prevJoinings = Math.max(0, userJoinings.length - 1);

      return {
        id: u.id,
        name: u.name,
        designation: u.designation || u.role.toUpperCase(),
        avatar: u.avatar,
        candidatesAdded: addedCount,
        totalCandidatesAssigned: userCands.length,
        candidatesDiff: addedCount - prevCands,
        interviews: userInterviews.length,
        interviewsDiff: userInterviews.length - prevInterviews,
        submitted: userSubmissions.length,
        offers: userOffers.length,
        joinings: userJoinings.length,
        joiningsDiff: userJoinings.length - prevJoinings,
        tasksCompleted: userTasks.length,
      };
    });
  }, [targetUsers, candidates, interviews, pipeline, reminders, period]);

  // Work Profile summary breakdown
  const workProfileBreakdown = useMemo(() => {
    const filterMode = period === 'daily' ? 'Today' : 'This Week';
    const visibleCandidates = isRecruiterOrHr
      ? candidates.filter((c) => c.assignedRecruiterId === currentUser.id)
      : candidates;
    const map = new Map<string, { total: number; periodAdded: number; placed: number }>();

    visibleCandidates.forEach((c) => {
      const profile = (c.workProfile || '').trim() || 'Unspecified';
      const entry = map.get(profile) || { total: 0, periodAdded: 0, placed: 0 };
      entry.total += 1;
      if (matchesEntryDateFilter(c.entryDate, c.createdAt, filterMode)) {
        entry.periodAdded += 1;
      }
      if (c.status === 'Placed') {
        entry.placed += 1;
      }
      map.set(profile, entry);
    });

    return Array.from(map.entries())
      .map(([profile, stats]) => ({ profile, ...stats }))
      .sort((a, b) => b.periodAdded - a.periodAdded || b.total - a.total)
      .slice(0, 12);
  }, [candidates, period, isRecruiterOrHr, currentUser.id]);

  // Totals
  const totals = useMemo(() => {
    return performanceRows.reduce(
      (acc, row) => ({
        candidatesAdded: acc.candidatesAdded + row.candidatesAdded,
        interviews: acc.interviews + row.interviews,
        submitted: acc.submitted + row.submitted,
        offers: acc.offers + row.offers,
        joinings: acc.joinings + row.joinings,
        tasksCompleted: acc.tasksCompleted + row.tasksCompleted,
      }),
      { candidatesAdded: 0, interviews: 0, submitted: 0, offers: 0, joinings: 0, tasksCompleted: 0 }
    );
  }, [performanceRows]);

  const exportPerformanceData = useMemo(() => {
    return performanceRows.map((r) => ({
      userId: r.id,
      userName: r.name,
      userRole: r.designation,
      candidatesSourced: r.candidatesAdded,
      candidatesScreened: r.submitted,
      interviewsScheduled: r.interviews,
      interviewsCompleted: r.interviews,
      offersExtended: r.offers,
      joiningsPlaced: r.joinings,
      tasksCompleted: r.tasksCompleted,
      pendingOverdueTasks: 0,
      conversionRatePercent:
        r.candidatesAdded > 0 ? Number(((r.joinings / r.candidatesAdded) * 100).toFixed(1)) : 0,
    }));
  }, [performanceRows]);

  const handlePrintPDF = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      'Team Member',
      'Role',
      'Candidates Added',
      'Interviews',
      'Submitted to Client',
      'Offers',
      'Placements',
      'Tasks Completed',
    ];
    const rows = performanceRows.map((r) => [
      r.name,
      r.designation,
      r.candidatesAdded,
      r.interviews,
      r.submitted,
      r.offers,
      r.joinings,
      r.tasksCompleted,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `BJ_Bright_${period.toUpperCase()}_Performance_Report_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyWhatsApp = () => {
    const text = `📊 *BJ Bright Enterprises • ${period === 'daily' ? 'Daily' : 'Weekly'} Performance Summary* (${new Date().toLocaleDateString('en-GB')})

👥 *Team Totals:*
• Candidates Added: ${totals.candidatesAdded}
• Interviews Scheduled: ${totals.interviews}
• Profiles Submitted: ${totals.submitted}
• Job Offers: ${totals.offers}
• Placements: ${totals.joinings}
• Tasks Completed: ${totals.tasksCompleted}

💼 *Top Performers:*
${performanceRows.map((r) => `• ${r.name}: ${r.joinings} Placements, ${r.interviews} Interviews`).join('\n')}

_Generated via ${companySettings.companyName} CRM (Noida Sec 62)_`;

    navigator.clipboard.writeText(text);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 2500);
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-bold uppercase mb-1">
            <span>Executive Analytics</span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#F5A623] shrink-0" />
            <span>Daily & Weekly Performance Report</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Recruiter activity, client submissions, interview conversions, and placement milestones
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Daily / Weekly Toggle */}
          <div className="flex p-1 rounded-xl bg-slate-200 border border-slate-300">
            <button
              onClick={() => setPeriod('daily')}
              className={`min-h-[34px] px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                period === 'daily'
                  ? 'bg-[#0B1F4B] text-white shadow-2xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Daily Report
            </button>
            <button
              onClick={() => setPeriod('weekly')}
              className={`min-h-[34px] px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                period === 'weekly'
                  ? 'bg-[#0B1F4B] text-white shadow-2xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Weekly Report
            </button>
          </div>

          <button
            onClick={handleCopyWhatsApp}
            className="min-h-[42px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copiedWhatsApp ? 'Copied!' : 'Copy for WhatsApp'}</span>
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="min-h-[42px] px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Export full workbook with live summary Excel formulas to .xlsx"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="min-h-[42px] px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrintPDF}
            className="min-h-[42px] px-3.5 py-2 rounded-xl bg-[#0B1F4B] hover:bg-[#163270] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-[#F5A623]" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards (2-col on mobile, 3-col on tablet, 6-col on desktop) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-600 block">Candidates Added</span>
          <p className="text-2xl font-extrabold text-slate-900">{totals.candidatesAdded}</p>
          <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +15% vs prev
          </span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-600 block">Interviews</span>
          <p className="text-2xl font-extrabold text-slate-900">{totals.interviews}</p>
          <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +8% vs prev
          </span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-600 block">Client Submissions</span>
          <p className="text-2xl font-extrabold text-slate-900">{totals.submitted}</p>
          <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Active pipeline
          </span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-600 block">Offers Released</span>
          <p className="text-2xl font-extrabold text-slate-900">{totals.offers}</p>
          <span className="text-[10px] font-semibold text-amber-800 flex items-center gap-1">
            Pending joining
          </span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-600 block">Placements</span>
          <p className="text-2xl font-extrabold text-emerald-700">{totals.joinings}</p>
          <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Successful
          </span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-600 block">Tasks Completed</span>
          <p className="text-2xl font-extrabold text-slate-900">{totals.tasksCompleted}</p>
          <span className="text-[10px] font-semibold text-[#0B1F4B]">On schedule</span>
        </div>
      </div>

      {/* MOBILE VIEW (<768px): Stacked Consultant Performance Cards */}
      <div className="md:hidden space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#0B1F4B]" />
            <span>Team Breakdown ({period === 'daily' ? 'Today' : 'This Week'})</span>
          </h3>
        </div>

        {performanceRows.map((row) => (
          <div
            key={row.id}
            className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3 text-xs"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <img
                  src={row.avatar}
                  alt={row.name}
                  className="w-9 h-9 rounded-full object-cover border border-slate-200"
                />
                <div>
                  <p className="font-extrabold text-sm text-slate-900">{row.name}</p>
                  <p className="text-[10px] text-slate-600 uppercase font-bold">{row.designation}</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-200 font-extrabold text-xs">
                {row.joinings} Placements
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center">
              <div>
                <span className="text-[10px] text-slate-500 font-bold block">Added</span>
                <span className="font-extrabold text-slate-900 text-sm">{row.candidatesAdded}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold block">Interviews</span>
                <span className="font-extrabold text-slate-900 text-sm">{row.interviews}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold block">Submitted</span>
                <span className="font-extrabold text-slate-900 text-sm">{row.submitted}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold block">Offers</span>
                <span className="font-extrabold text-amber-800 text-sm">{row.offers}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold block">Placements</span>
                <span className="font-extrabold text-emerald-700 text-sm">{row.joinings}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold block">Tasks Done</span>
                <span className="font-extrabold text-slate-900 text-sm">{row.tasksCompleted}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* TABLET & DESKTOP VIEW (>=768px): Detailed Team Performance Table */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#0B1F4B]" />
            <span>Team Member Breakdown ({period === 'daily' ? 'Today' : 'This Week'})</span>
          </h3>
          <span className="text-xs text-slate-600">
            {isRecruiterOrHr
              ? 'Showing personal performance metrics'
              : 'Showing all Noida office consultants'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 sticky-col-first">Consultant / Member</th>
                <th className="py-3.5 px-4 text-center">Candidates Added</th>
                <th className="py-3.5 px-4 text-center">Interviews</th>
                <th className="py-3.5 px-4 text-center">Client Submissions</th>
                <th className="py-3.5 px-4 text-center">Offers</th>
                <th className="py-3.5 px-4 text-center">Placements</th>
                <th className="py-3.5 px-4 text-right">Tasks Done</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {performanceRows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 bg-white">
                  <td className="py-3 px-4 sticky-col-first">
                    <div className="flex items-center gap-3">
                      <img
                        src={row.avatar}
                        alt={row.name}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div>
                        <p className="font-bold text-slate-900">{row.name}</p>
                        <p className="text-[10px] text-slate-600 uppercase font-semibold">
                          {row.designation}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center font-semibold text-slate-900">
                    {row.candidatesAdded}{' '}
                    <span className="text-[10px] text-emerald-700 font-bold">
                      ({row.candidatesDiff >= 0 ? `+${row.candidatesDiff}` : row.candidatesDiff})
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-semibold text-slate-900">
                    {row.interviews}{' '}
                    <span className="text-[10px] text-emerald-700 font-bold">
                      ({row.interviewsDiff >= 0 ? `+${row.interviewsDiff}` : row.interviewsDiff})
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-semibold text-slate-900">
                    {row.submitted}
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-amber-800">{row.offers}</td>
                  <td className="py-3 px-4 text-center font-extrabold text-emerald-700">
                    {row.joinings}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-800">
                    {row.tasksCompleted}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Work Profile Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-[#0B1F4B]" />
            <span>Candidates by Work Profile ({period === 'daily' ? 'Today' : 'This Week'} &amp; Total Pool)</span>
          </h3>
          <span className="text-xs text-slate-600">Counted by Entry Date (IST)</span>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {workProfileBreakdown.length === 0 ? (
            <p className="text-xs text-slate-500 col-span-full">No candidate profiles recorded yet.</p>
          ) : (
            workProfileBreakdown.map((item) => (
              <div
                key={item.profile}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-slate-900 truncate" title={item.profile}>
                    {item.profile}
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Added ({period === 'daily' ? 'Today' : 'This Week'}):{' '}
                    <span className="font-bold text-[#0B1F4B]">{item.periodAdded}</span> • Placed:{' '}
                    <span className="font-bold text-emerald-700">{item.placed}</span>
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-extrabold text-slate-900 shrink-0">
                  {item.total}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <ExcelExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        moduleName="Performance_Report"
        tableName="tblPerformance"
        sheetName="Performance"
        columns={PERFORMANCE_REPORT_EXPORT_COLUMNS}
        filteredData={exportPerformanceData}
        allAccessibleData={exportPerformanceData}
        filtersDescription={`Period: ${period === 'daily' ? 'Daily' : 'Weekly'}, Scope: ${
          isRecruiterOrHr ? 'Own Performance' : 'All Consultants'
        }`}
        summaryGenerator={generatePerformanceSummarySheet}
      />
    </div>
  );
};
