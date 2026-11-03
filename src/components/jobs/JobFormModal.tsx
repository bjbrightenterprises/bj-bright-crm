import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { JobOpening, JobPriority, JobStatus } from '../../types/crm';
import { useCRM } from '../../context/CRMContext';
import { Plus, X } from 'lucide-react';

interface JobFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobToEdit?: JobOpening | null;
  preSelectedClientId?: string;
}

export const JobFormModal: React.FC<JobFormModalProps> = ({
  isOpen,
  onClose,
  jobToEdit,
  preSelectedClientId,
}) => {
  const { addJob, updateJob, clients, users, currentUser } = useCRM();

  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [location, setLocation] = useState('Noida (Sector 62)');
  const [positions, setPositions] = useState<number>(2);
  const [salaryMinLPA, setSalaryMinLPA] = useState<number>(14);
  const [salaryMaxLPA, setSalaryMaxLPA] = useState<number>(22);
  const [minExpYears, setMinExpYears] = useState<number>(4);
  const [maxExpYears, setMaxExpYears] = useState<number>(8);
  const [skillsRequired, setSkillsRequired] = useState<string[]>(['React.js', 'Node.js']);
  const [newSkill, setNewSkill] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('2026-12-15');
  const [priority, setPriority] = useState<JobPriority>('High');
  const [status, setStatus] = useState<JobStatus>('Open');
  const [assignedRecruiterIds, setAssignedRecruiterIds] = useState<string[]>([currentUser.id]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (jobToEdit) {
      setTitle(jobToEdit.title);
      setClientId(jobToEdit.clientId);
      setLocation(jobToEdit.location);
      setPositions(jobToEdit.positions);
      setSalaryMinLPA(jobToEdit.salaryMinLPA);
      setSalaryMaxLPA(jobToEdit.salaryMaxLPA);
      setMinExpYears(jobToEdit.minExpYears);
      setMaxExpYears(jobToEdit.maxExpYears);
      setSkillsRequired(jobToEdit.skillsRequired);
      setDescription(jobToEdit.description);
      setDeadline(jobToEdit.deadline);
      setPriority(jobToEdit.priority);
      setStatus(jobToEdit.status);
      setAssignedRecruiterIds(jobToEdit.assignedRecruiterIds);
    } else {
      setTitle('');
      setClientId(preSelectedClientId || (clients[0]?.id ?? ''));
      setLocation('Noida (Sector 62 / Hybrid)');
      setPositions(2);
      setSalaryMinLPA(12);
      setSalaryMaxLPA(18);
      setMinExpYears(3);
      setMaxExpYears(7);
      setSkillsRequired(['React.js', 'TypeScript']);
      setDescription('Key responsibility includes driving system architecture and delivery for client enterprise products.');
      setDeadline('2026-12-31');
      setPriority('High');
      setStatus('Open');
      setAssignedRecruiterIds([currentUser.id]);
    }
    setErrors({});
  }, [jobToEdit, preSelectedClientId, isOpen, clients, currentUser]);

  const handleAddSkill = () => {
    if (newSkill.trim() && !skillsRequired.includes(newSkill.trim())) {
      setSkillsRequired([...skillsRequired, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkillsRequired(skillsRequired.filter((s) => s !== skill));
  };

  const handleToggleRecruiter = (recruiterId: string) => {
    if (assignedRecruiterIds.includes(recruiterId)) {
      if (assignedRecruiterIds.length > 1) {
        setAssignedRecruiterIds(assignedRecruiterIds.filter((id) => id !== recruiterId));
      }
    } else {
      setAssignedRecruiterIds([...assignedRecruiterIds, recruiterId]);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Job title is required';
    if (!clientId) newErrors.clientId = 'Client company must be selected';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const selectedClient = clients.find((c) => c.id === clientId);
    const assignedRecruiterNames = users
      .filter((u) => assignedRecruiterIds.includes(u.id))
      .map((u) => u.name);

    if (jobToEdit) {
      updateJob(jobToEdit.id, {
        title: title.trim(),
        clientId,
        clientName: selectedClient?.name || 'Corporate Client',
        location: location.trim(),
        positions: Number(positions),
        salaryMinLPA: Number(salaryMinLPA),
        salaryMaxLPA: Number(salaryMaxLPA),
        minExpYears: Number(minExpYears),
        maxExpYears: Number(maxExpYears),
        skillsRequired,
        description: description.trim(),
        deadline,
        priority,
        status,
        assignedRecruiterIds,
        assignedRecruiterNames,
      });
    } else {
      addJob({
        title: title.trim(),
        clientId,
        clientName: selectedClient?.name || 'Corporate Client',
        location: location.trim(),
        positions: Number(positions),
        salaryMinLPA: Number(salaryMinLPA),
        salaryMaxLPA: Number(salaryMaxLPA),
        minExpYears: Number(minExpYears),
        maxExpYears: Number(maxExpYears),
        skillsRequired,
        description: description.trim(),
        deadline,
        priority,
        status,
        assignedRecruiterIds,
        assignedRecruiterNames,
      });
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={jobToEdit ? 'Edit Job Opening' : 'Create Job Opening'}
      subtitle="BJ Bright Enterprises • Client Recruitment Requisition"
      maxWidth="3xl"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 rounded-xl font-bold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-[#0B1F4B] hover:bg-[#163270] text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
          >
            {jobToEdit ? 'Save Changes' : 'Publish Requisition'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs text-slate-900">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Job Title */}
          <div className="md:col-span-2">
            <label className="font-bold text-slate-800 block mb-1">
              Job Title / Designation *
            </label>
            <input
              type="text"
              placeholder="e.g. Lead Full Stack React / Node Developer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
            />
            {errors.title && <p className="text-xs text-rose-600 font-semibold mt-1">{errors.title}</p>}
          </div>

          {/* Client Selection */}
          <div>
            <label className="font-bold text-slate-800 block mb-1">
              Client Company *
            </label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
            >
              <option value="">-- Select Corporate Client --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.city})
                </option>
              ))}
            </select>
            {errors.clientId && <p className="text-xs text-rose-600 font-semibold mt-1">{errors.clientId}</p>}
          </div>

          {/* Location */}
          <div>
            <label className="font-bold text-slate-800 block mb-1">
              Work Location
            </label>
            <input
              type="text"
              placeholder="e.g. Noida (Sector 62), Gurugram, Hybrid"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
            />
          </div>

          {/* Number of Positions */}
          <div>
            <label className="font-bold text-slate-800 block mb-1">
              Number of Openings
            </label>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              max="50"
              value={positions}
              onChange={(e) => setPositions(parseInt(e.target.value) || 1)}
              className="w-full min-h-[44px] px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="font-bold text-slate-800 block mb-1">
              Hiring Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as JobPriority)}
              className="w-full min-h-[44px] px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
            >
              <option value="High">High (Immediate SLA)</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Salary Min (LPA) */}
          <div>
            <label className="font-bold text-slate-800 block mb-1">
              Min Salary (₹ LPA)
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.5"
              min="0"
              value={salaryMinLPA}
              onChange={(e) => setSalaryMinLPA(parseFloat(e.target.value) || 0)}
              className="w-full min-h-[44px] px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
            />
          </div>

          {/* Salary Max (LPA) */}
          <div>
            <label className="font-bold text-slate-800 block mb-1">
              Max Salary (₹ LPA)
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.5"
              min="0"
              value={salaryMaxLPA}
              onChange={(e) => setSalaryMaxLPA(parseFloat(e.target.value) || 0)}
              className="w-full min-h-[44px] px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
            />
          </div>

          {/* Min Experience */}
          <div>
            <label className="font-bold text-slate-800 block mb-1">
              Min Exp (Years)
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.5"
              min="0"
              value={minExpYears}
              onChange={(e) => setMinExpYears(parseFloat(e.target.value) || 0)}
              className="w-full min-h-[44px] px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
            />
          </div>

          {/* Max Experience */}
          <div>
            <label className="font-bold text-slate-800 block mb-1">
              Max Exp (Years)
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.5"
              min="0"
              value={maxExpYears}
              onChange={(e) => setMaxExpYears(parseFloat(e.target.value) || 0)}
              className="w-full min-h-[44px] px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
            />
          </div>

          {/* Status */}
          <div>
            <label className="font-bold text-slate-800 block mb-1">
              Requisition Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as JobStatus)}
              className="w-full min-h-[44px] px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
            >
              <option value="Open">Open</option>
              <option value="On Hold">On Hold</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Deadline */}
          <div>
            <label className="font-bold text-slate-800 block mb-1">
              Closure Target Date
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
            />
          </div>
        </div>

        {/* Skills Required */}
        <div className="space-y-2 pt-2">
          <label className="font-bold text-slate-800 block">
            Skills Required (Used for automated candidate matching)
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {skillsRequired.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-[#0B1F4B] text-xs font-bold border border-blue-200"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="p-0.5 hover:text-rose-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add skill requirement (e.g. AWS Cloud, React.js, Python)..."
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSkill();
                }
              }}
              className="flex-1 min-h-[44px] px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="min-h-[44px] px-4 py-2 rounded-lg bg-[#0B1F4B] hover:bg-[#163270] text-white font-bold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Assigned Recruiters */}
        <div className="space-y-1.5 pt-2">
          <label className="font-bold text-slate-800 block">
            Assign Recruitment Team Members
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
            {users.map((u) => {
              const isSelected = assignedRecruiterIds.includes(u.id);
              return (
                <button
                  type="button"
                  key={u.id}
                  onClick={() => handleToggleRecruiter(u.id)}
                  className={`min-h-[44px] p-2.5 rounded-lg border text-left transition-colors flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'border-[#0B1F4B] bg-blue-50 text-[#0B1F4B] font-bold'
                      : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="w-4 h-4 accent-[#0B1F4B] pointer-events-none"
                  />
                  <span className="truncate">{u.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1 pt-2">
          <label className="font-bold text-slate-800 block">
            Job Description & Role Notes
          </label>
          <textarea
            rows={3}
            placeholder="Summarize candidate responsibilities, interview rounds, and client expectations..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-900"
          />
        </div>
      </form>
    </Modal>
  );
};
