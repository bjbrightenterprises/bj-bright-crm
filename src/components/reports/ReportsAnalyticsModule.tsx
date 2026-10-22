import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  FileSpreadsheet,
  Printer,
  TrendingUp,
  TrendingDown,
  Users,
  CheckCircle2,
  Share2,
  Sparkles,
  Award,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { Badge } from '../common/Badge';
import { ExcelExportModal } from '../common/ExcelExportModal';
import {
  PERFORMANCE_REPORT_EXPORT_COLUMNS,
  generatePerformanceSummarySheet,
} from '../../lib/excelModuleConfigs';

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

  // Performance data calculation per user
  const performanceRows = useMemo(() => {
    return targetUsers.map((u) => {
      const userCands = candidates.filter((c) => c.assignedRecruiterId === u.id);
      const userInterviews = interviews.filter((i) => i.assignedToRecruiterId === u.id);
      const userSubmissions = pipeline.filter((p) => p.assignedRecruiterId === u.id && p.stage === 'Submitted to Client');
      const userOffers = userCands.filter((c) => c.status === 'Offered');
      const userJoinings = userCands.filter((c) => c.status === 'Joined');
      const userTasks = reminders.filter((r) => r.assignedToUserId === u.id && r.status === 'Completed');

      // Simulated previous period comparison (e.g., +10% or +1)
      const prevCands = Math.max(0, userCands.length - 2);
      const prevInterviews = Math.max(0, userInterviews.length - 1);
      const prevJoinings = Math.max(0, userJoinings.length - 1);

      return {
        id: u.id,
        name: u.name,
        designation: u.designation || u.role.toUpperCase(),
        avatar: u.avatar,
        candidatesAdded: userCands.length,
        candidatesDiff: userCands.length - prevCands,
        interviews: userInterviews.length,
        interviewsDiff: userInterviews.length - prevInterviews,
        submitted: userSubmissions.length,
        offers: userOffers.length,
        joinings: userJoinings.length,
        joiningsDiff: userJoinings.length - prevJoinings,
        tasksCompleted: userTasks.length,
      };
    });
  }, [targetUsers, candidates, interviews, pipeline, reminders]);

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
      conversionRatePercent: r.candidatesAdded > 0 ? Number(((r.joinings / r.candidatesAdded) * 100).toFixed(1)) : 0,
    }));
  }, [performanceRows]);

  const handlePrintPDF = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['Team Member', 'Role', 'Candidates Added', 'Interviews', 'Submitted to Client', 'Offers', 'Joinings', 'Tasks Completed'];
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
    link.setAttribute('download', `BJ_Bright_${period.toUpperCase()}_Performance_Report_${new Date().toISOString().slice(0, 10)}.csv`);
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
• Joinings: ${totals.joinings}
• Tasks Completed: ${totals.tasksCompleted}

💼 *Top Performers:*
${performanceRows.map((r) => `• ${r.name}: ${r.joinings} Joinings, ${r.interviews} Interviews`).join('\n')}

_Generated via ${companySettings.companyName} CRM (Noida Sec 62)_`;

    navigator.clipboard.writeText(text);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-bold uppercase mb-1">
            <span>Executive Analytics</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#F5A623]" />
            Daily & Weekly Performance Report
          </h2>
          <p className="text-xs text-slate-500">
            Recruiter activity, client submissions, interview conversions, and placement milestones
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Daily / Weekly Toggle */}
          <div className="flex p-1 rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
            <button
              onClick={() => setPeriod('daily')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                period === 'daily'
                  ? 'bg-[#0B1F4B] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Daily Report
            </button>
            <button
              onClick={() => setPeriod('weekly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                period === 'weekly'
                  ? 'bg-[#0B1F4B] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Weekly Report
            </button>
          </div>

          <button
            onClick={handleCopyWhatsApp}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copiedWhatsApp ? 'Copied to Clipboard!' : 'Copy for WhatsApp'}</span>
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            title="Export full workbook with live summary Excel formulas to .xlsx"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Export to Excel</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrintPDF}
            className="px-3.5 py-2 rounded-xl bg-[#0B1F4B] hover:bg-[#163270] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-[#F5A623]" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400">Candidates Added</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{totals.candidatesAdded}</p>
          <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +15% vs prev
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400">Interviews</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{totals.interviews}</p>
          <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +8% vs prev
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400">Client Submissions</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{totals.submitted}</p>
          <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Active pipeline
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400">Offers Released</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{totals.offers}</p>
          <span className="text-[10px] font-semibold text-amber-600 flex items-center gap-1">
            Pending joining
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400">Joinings</span>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{totals.joinings}</p>
          <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Successful
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400">Tasks Completed</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{totals.tasksCompleted}</p>
          <span className="text-[10px] font-semibold text-blue-600">On schedule</span>
        </div>
      </div>

      {/* Detailed Team Performance Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-[#0B1F4B]" />
            Team Member Breakdown ({period === 'daily' ? 'Today' : 'This Week'})
          </h3>
          <span className="text-xs text-slate-500">
            {isRecruiterOrHr ? 'Showing personal performance metrics' : 'Showing all Noida office consultants'}
          </span>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3 px-4">Consultant / Member</th>
              <th className="py-3 px-4 text-center">Candidates Added</th>
              <th className="py-3 px-4 text-center">Interviews</th>
              <th className="py-3 px-4 text-center">Client Submissions</th>
              <th className="py-3 px-4 text-center">Offers</th>
              <th className="py-3 px-4 text-center">Joinings</th>
              <th className="py-3 px-4 text-right">Tasks Done</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {performanceRows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="py-3 px-4 flex items-center gap-3">
                  <img src={row.avatar} alt={row.name} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{row.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase">{row.designation}</p>
                  </div>
                </td>
                <td className="py-3 px-4 text-center font-semibold">
                  {row.candidatesAdded}{' '}
                  <span className="text-[10px] text-emerald-600 font-bold">({row.candidatesDiff >= 0 ? `+${row.candidatesDiff}` : row.candidatesDiff})</span>
                </td>
                <td className="py-3 px-4 text-center font-semibold">
                  {row.interviews}{' '}
                  <span className="text-[10px] text-emerald-600 font-bold">({row.interviewsDiff >= 0 ? `+${row.interviewsDiff}` : row.interviewsDiff})</span>
                </td>
                <td className="py-3 px-4 text-center font-semibold">{row.submitted}</td>
                <td className="py-3 px-4 text-center font-semibold text-amber-600">{row.offers}</td>
                <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">{row.joinings}</td>
                <td className="py-3 px-4 text-right font-semibold text-slate-700 dark:text-slate-300">{row.tasksCompleted}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
        filtersDescription={`Period: ${period === 'daily' ? 'Daily' : 'Weekly'}, Scope: ${isRecruiterOrHr ? 'Own Performance' : 'All Consultants'}`}
        summaryGenerator={generatePerformanceSummarySheet}
      />
    </div>

  );
};

