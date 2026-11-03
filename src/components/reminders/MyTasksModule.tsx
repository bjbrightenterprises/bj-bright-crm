import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  Calendar,
  Plus,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { ReminderTask, Candidate, Client } from '../../types/crm';
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
    const canModifyTask =
      currentUser.role === 'admin' ||
      (currentUser.role === 'hr_executive' && task.assignedByUserId === currentUser.id);

    return (
      <div
        key={task.id}
        className={`p-4 rounded-xl border transition-all text-xs bg-white shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isOverdue
            ? 'border-rose-300 bg-rose-50/40'
            : task.status === 'Completed'
            ? 'border-slate-200 opacity-70'
            : 'border-slate-200 hover:border-[#0B1F4B]'
        }`}
      >
        {/* Left: Checkbox & Title */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <input
            type="checkbox"
            checked={task.status === 'Completed'}
            onChange={() => toggleReminderStatus(task.id)}
            className="w-4 h-4 mt-1 rounded text-[#0B1F4B] accent-[#0B1F4B] cursor-pointer shrink-0"
          />

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`font-bold text-sm ${
                  task.status === 'Completed'
                    ? 'line-through text-slate-500'
                    : 'text-slate-900'
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
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800">
                {task.category}
              </span>
            </div>

            {task.description && (
              <p className="text-slate-600 line-clamp-2">{task.description}</p>
            )}

            <div className="flex items-center gap-3 text-[11px] text-slate-600 flex-wrap pt-0.5">
              <span className="flex items-center gap-1 font-bold text-slate-900">
                <Clock className="w-3.5 h-3.5 text-[#F5A623]" />
                Due: {task.dueDate} {task.dueTime ? `at ${task.dueTime} IST` : ''}
              </span>

              {task.relatedName && (
                <button
                  type="button"
                  onClick={() => handleEntityClick(task)}
                  className="text-[#0B1F4B] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Linked: {task.relatedName}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}

              <span>Assigned: {task.assignedToUserName.split(' ')[0]}</span>
            </div>
          </div>
        </div>

        {/* Right: Snooze & Delete */}
        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
          {task.status !== 'Completed' && canModifyTask && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => snoozeReminder(task.id, 1)}
                className="min-h-[36px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-bold text-xs cursor-pointer"
                title="Snooze task by +1 day"
              >
                +1 Day
              </button>
              <button
                onClick={() => snoozeReminder(task.id, 3)}
                className="min-h-[36px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-bold text-xs cursor-pointer"
                title="Snooze task by +3 days"
              >
                +3 Days
              </button>
            </div>
          )}

          {canModifyTask && (
            <button
              onClick={() => deleteReminder(task.id)}
              className="min-h-[36px] min-w-[36px] p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 flex items-center justify-center cursor-pointer"
              title="Delete Reminder"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-[#F5A623] shrink-0" />
            <span>My Follow-ups & Task Reminders</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Action items grouped by urgency: Overdue, Today, and Upcoming recruitment tasks
          </p>
        </div>

        {canCreateTasks && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-[#0B1F4B] hover:bg-[#163270] text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#F5A623]" />
            <span>Add Reminder</span>
          </button>
        )}
      </div>

      {/* Tabs & Category Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('active')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'active'
                ? 'bg-[#0B1F4B] text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Active Tasks ({overdueTasks.length + todayTasks.length + upcomingTasks.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'completed'
                ? 'bg-[#0B1F4B] text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Completed ({completedTasks.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 font-bold uppercase text-[10px]">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="min-h-[40px] px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-900"
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
              <div className="flex items-center gap-2 text-rose-700 font-extrabold text-xs uppercase tracking-wider">
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
            <div className="flex items-center gap-2 text-amber-800 font-extrabold text-xs uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-[#F5A623]" />
              <span>Today's Tasks ({todayTasks.length})</span>
            </div>
            {todayTasks.length === 0 ? (
              <div className="p-4 rounded-xl bg-white text-slate-500 text-xs border border-dashed border-slate-300 text-center">
                No reminders scheduled specifically for today.
              </div>
            ) : (
              <div className="space-y-2.5">{todayTasks.map((t) => renderTaskCard(t))}</div>
            )}
          </div>

          {/* 3. UPCOMING TASKS */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-extrabold text-xs uppercase tracking-wider">
              <Clock className="w-4 h-4 text-[#0B1F4B]" />
              <span>Upcoming Tasks ({upcomingTasks.length})</span>
            </div>
            {upcomingTasks.length === 0 ? (
              <div className="p-4 rounded-xl bg-white text-slate-500 text-xs border border-dashed border-slate-300 text-center">
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
            <div className="py-12 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
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
