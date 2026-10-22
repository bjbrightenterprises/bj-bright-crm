import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  Calendar,
  Plus,
  Trash2,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { ReminderTask, ReminderPriority, ReminderCategory, Candidate, Client } from '../../types/crm';
import { Badge } from '../common/Badge';
import { SetReminderModal } from './SetReminderModal';

interface MyTasksModuleProps {
  onViewCandidateProfile?: (candidate: Candidate) => void;
  onViewClientProfile?: (client: Client) => void;
}

export const MyTasksModule: React.FC<MyTasksModuleProps> = ({
  onViewCandidateProfile,
  onViewClientProfile,
}) => {
  const {
    visibleReminders,
    toggleReminderStatus,
    snoozeReminder,
    deleteReminder,
    candidates,
    clients,
    currentUser,
    canCreateTasks,
  } = useCRM();

  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  // Filtered by category
  const filteredReminders = useMemo(() => {
    return visibleReminders.filter((r) => {
      if (selectedCategory !== 'All' && r.category !== selectedCategory) return false;
      return true;
    });
  }, [visibleReminders, selectedCategory]);

  // Grouped active tasks
  const overdueTasks = useMemo(() => {
    return filteredReminders.filter(
      (r) => r.status === 'Pending' && r.dueDate < todayStr
    );
  }, [filteredReminders, todayStr]);

  const todayTasks = useMemo(() => {
    return filteredReminders.filter(
      (r) => r.status === 'Pending' && r.dueDate === todayStr
    );
  }, [filteredReminders, todayStr]);

  const upcomingTasks = useMemo(() => {
    return filteredReminders.filter(
      (r) => r.status === 'Pending' && r.dueDate > todayStr
    );
  }, [filteredReminders, todayStr]);

  const completedTasks = useMemo(() => {
    return filteredReminders.filter((r) => r.status === 'Completed');
  }, [filteredReminders]);

  const handleEntityClick = (r: ReminderTask) => {
    if (r.relatedType === 'candidate' && r.relatedId && onViewCandidateProfile) {
      const cand = candidates.find((c) => c.id === r.relatedId);
      if (cand) onViewCandidateProfile(cand);
    } else if (r.relatedType === 'client' && r.relatedId && onViewClientProfile) {
      const cl = clients.find((c) => c.id === r.relatedId);
      if (cl) onViewClientProfile(cl);
    }
  };

  const renderTaskCard = (task: ReminderTask, isOverdue = false) => {
    const canModifyTask = currentUser.role === 'admin' || (currentUser.role === 'hr_executive' && task.assignedByUserId === currentUser.id);

    return (
      <div
        key={task.id}
        className={`p-4 rounded-xl border transition-all text-xs bg-white dark:bg-slate-900 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isOverdue
            ? 'border-rose-300 dark:border-rose-800 bg-rose-50/30'
            : task.status === 'Completed'
            ? 'border-slate-200 dark:border-slate-800 opacity-60'
            : 'border-slate-200 dark:border-slate-800 hover:border-[#0B1F4B] dark:hover:border-amber-500'
        }`}
      >
        {/* Left: Checkbox & Title */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <input
            type="checkbox"
            checked={task.status === 'Completed'}
            onChange={() => toggleReminderStatus(task.id)}
            className="w-4 h-4 mt-0.5 rounded text-[#0B1F4B] accent-[#0B1F4B] cursor-pointer"
          />

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`font-bold text-sm ${
                  task.status === 'Completed'
                    ? 'line-through text-slate-400'
                    : 'text-slate-900 dark:text-white'
                }`}
              >
                {task.title}
              </span>
              <Badge
                variant={
                  task.priority === 'High'
                    ? 'danger'
                    : task.priority === 'Medium'
                    ? 'warning'
                    : 'neutral'
                }
                size="sm"
              >
                {task.priority}
              </Badge>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {task.category}
              </span>
            </div>

            {task.description && (
              <p className="text-slate-500 line-clamp-2">{task.description}</p>
            )}

            <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap pt-0.5">
              <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                <Clock className="w-3 h-3 text-[#F5A623]" />
                Due: {task.dueDate} {task.dueTime ? `at ${task.dueTime} IST` : ''}
              </span>

              {task.relatedName && (
                <button
                  type="button"
                  onClick={() => handleEntityClick(task)}
                  className="text-blue-600 dark:text-amber-400 font-semibold hover:underline flex items-center gap-1"
                >
                  <span>Linked: {task.relatedName}</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </button>
              )}

              <span>Assigned: {task.assignedToUserName.split(' ')[0]}</span>
            </div>
          </div>
        </div>

        {/* Right: Snooze & Delete */}
        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
          {task.status !== 'Completed' && canModifyTask && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => snoozeReminder(task.id, 1)}
                className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-semibold text-[11px]"
                title="Snooze task by +1 day"
              >
                +1 Day
              </button>
              <button
                onClick={() => snoozeReminder(task.id, 3)}
                className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-semibold text-[11px]"
                title="Snooze task by +3 days"
              >
                +3 Days
              </button>
            </div>
          )}

          {canModifyTask && (
            <button
              onClick={() => deleteReminder(task.id)}
              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Delete Reminder"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-[#F5A623]" />
            My Follow-ups & Task Reminders
          </h2>
          <p className="text-xs text-slate-500">
            Action items grouped by urgency: Overdue, Today, and Upcoming recruitment tasks
          </p>
        </div>

        {canCreateTasks && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-[#0B1F4B] hover:bg-[#163270] text-white text-xs font-bold shadow-md transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 text-[#F5A623]" />
            <span>Add Reminder</span>
          </button>
        )}
      </div>

      {/* Tabs & Category Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'active'
                ? 'bg-[#0B1F4B] text-white dark:bg-[#F5A623] dark:text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Active Tasks ({overdueTasks.length + todayTasks.length + upcomingTasks.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'completed'
                ? 'bg-[#0B1F4B] text-white dark:bg-[#F5A623] dark:text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Completed ({completedTasks.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-bold uppercase text-[10px]">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="All">All Categories</option>
            <option value="Follow-up">Follow-up</option>
            <option value="Interview">Interview</option>
            <option value="Client Payment">Client Payment</option>
            <option value="Candidate Task">Document / Onboarding</option>
            <option value="General">General</option>
          </select>
        </div>
      </div>

      {activeTab === 'active' && (
        <div className="space-y-6">
          {/* 1. OVERDUE TASKS (Red Section) */}
          {overdueTasks.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-rose-600 font-extrabold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4" />
                <span>Overdue Tasks ({overdueTasks.length}) - Action Required</span>
              </div>
              <div className="space-y-2.5">
                {overdueTasks.map((t) => renderTaskCard(t, true))}
              </div>
            </div>
          )}

          {/* 2. TODAY'S TASKS */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-extrabold text-xs uppercase tracking-wider">
              <Calendar className="w-4 h-4" />
              <span>Today's Tasks ({todayTasks.length})</span>
            </div>
            {todayTasks.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850/60 text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 text-center">
                No reminders scheduled specifically for today.
              </div>
            ) : (
              <div className="space-y-2.5">{todayTasks.map((t) => renderTaskCard(t))}</div>
            )}
          </div>

          {/* 3. UPCOMING TASKS */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-extrabold text-xs uppercase tracking-wider">
              <Clock className="w-4 h-4 text-blue-500" />
              <span>Upcoming Tasks ({upcomingTasks.length})</span>
            </div>
            {upcomingTasks.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850/60 text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 text-center">
                No upcoming follow-ups scheduled for future dates.
              </div>
            ) : (
              <div className="space-y-2.5">{upcomingTasks.map((t) => renderTaskCard(t))}</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'completed' && (
        <div className="space-y-3">
          {completedTasks.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              No completed tasks recorded yet.
            </div>
          ) : (
            <div className="space-y-2.5">{completedTasks.map((t) => renderTaskCard(t))}</div>
          )}
        </div>
      )}

      {/* Set Reminder Modal */}
      <SetReminderModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
};
