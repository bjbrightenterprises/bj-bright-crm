import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { ReminderPriority, ReminderCategory } from '../../types/crm';
import { useCRM } from '../../context/CRMContext';

interface SetReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  relatedType?: 'candidate' | 'client' | 'job' | 'invoice';
  relatedId?: string;
  relatedName?: string;
  defaultTitle?: string;
}

export const SetReminderModal: React.FC<SetReminderModalProps> = ({
  isOpen,
  onClose,
  relatedType,
  relatedId,
  relatedName,
  defaultTitle,
}) => {
  const { addReminder, users, currentUser, canCreateTasks } = useCRM();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('11:00');
  const [priority, setPriority] = useState<ReminderPriority>('Medium');
  const [category, setCategory] = useState<ReminderCategory>('Follow-up');

  const eligibleAssignees = useMemo(() => {
    if (currentUser.role === 'hr_executive') {
      return users.filter((u) => u.role === 'recruiter' && u.active);
    }
    return users.filter((u) => u.active);
  }, [users, currentUser]);

  const [assignedToUserId, setAssignedToUserId] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle(defaultTitle || (relatedName ? `Follow up on ${relatedName}` : ''));
      setDescription('');
      const d = new Date();
      d.setDate(d.getDate() + 1);
      setDueDate(d.toISOString().split('T')[0]);
      setDueTime('11:00');
      setPriority('Medium');
      setCategory(
        relatedType === 'invoice'
          ? 'Client Payment'
          : relatedType === 'candidate'
          ? 'Follow-up'
          : 'General'
      );
      if (currentUser.role === 'hr_executive') {
        const firstRec = users.find((u) => u.role === 'recruiter' && u.active);
        setAssignedToUserId(firstRec?.id || '');
      } else {
        setAssignedToUserId(currentUser.id);
      }
    }
  }, [isOpen, defaultTitle, relatedName, relatedType, currentUser, users]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!canCreateTasks) return;
    if (!title.trim() || !dueDate) return;

    if (currentUser.role === 'hr_executive') {
      const assigned = users.find((u) => u.id === assignedToUserId);
      if (!assigned || assigned.role !== 'recruiter' || !assigned.active) return;
    }

    const assignedUser = users.find((u) => u.id === assignedToUserId);

    addReminder({
      title: title.trim(),
      description: description.trim(),
      dueDate,
      dueTime,
      priority,
      status: 'Pending',
      category,
      relatedType,
      relatedId,
      relatedName,
      assignedToUserId,
      assignedToUserName: assignedUser?.name || currentUser.name,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Set Follow-up Reminder & Task"
      subtitle={relatedName ? `Linked to: ${relatedName} (${relatedType?.toUpperCase()})` : 'BJ Bright Enterprises • Task Manager'}
      maxWidth="md"
      footer={
        <div className="flex justify-end gap-2.5 w-full">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 font-bold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            className="min-h-[44px] px-5 py-2 bg-[#0B1F4B] hover:bg-[#163270] text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
          >
            Set Reminder
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs text-slate-900">
        <div>
          <label className="font-bold text-slate-800 block mb-1">
            Reminder Title *
          </label>
          <input
            type="text"
            placeholder="e.g. Call candidate to confirm joining date / Collect documents"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full min-h-[44px] px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="font-bold text-slate-800 block mb-1">
              Due Date *
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900"
              required
            />
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1">
              Time (IST)
            </label>
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="font-bold text-slate-800 block mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ReminderCategory)}
              className="w-full min-h-[44px] px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900"
            >
              <option value="Follow-up">Candidate Follow-up</option>
              <option value="Interview">Interview Coordination</option>
              <option value="Client Payment">Client Payment Collection</option>
              <option value="Candidate Task">Document / Onboarding</option>
              <option value="General">General CRM Task</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as ReminderPriority)}
              className="w-full min-h-[44px] px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900"
            >
              <option value="High">High (Critical SLA)</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        <div>
          <label className="font-bold text-slate-800 block mb-1">
            {currentUser.role === 'hr_executive' ? 'Assign To Active Recruiter *' : 'Assign To Team Member *'}
          </label>
          <select
            value={assignedToUserId}
            onChange={(e) => setAssignedToUserId(e.target.value)}
            className="w-full min-h-[44px] px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900"
            required
          >
            {eligibleAssignees.length === 0 ? (
              <option value="">No active recruiters available</option>
            ) : (
              eligibleAssignees.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role.replace('_', ' ').toUpperCase()})
                </option>
              ))
            )}
          </select>
          {currentUser.role === 'hr_executive' && (
            <p className="text-xs text-slate-600 mt-1">
              As HR Executive, company policy allows assigning tasks exclusively to active Recruiters.
            </p>
          )}
        </div>

        <div>
          <label className="font-bold text-slate-800 block mb-1">
            Notes & Action Description
          </label>
          <textarea
            rows={2}
            placeholder="Add relevant context or checklist..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-900"
          />
        </div>
      </form>
    </Modal>
  );
};
