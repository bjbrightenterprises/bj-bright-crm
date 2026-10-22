import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { Client, formatIndianCurrency, formatIndianDate } from '../../types/crm';
import { useCRM } from '../../context/CRMContext';
import {
  Building2,
  MapPin,
  Globe,
  Phone,
  Mail,
  Briefcase,
  Trophy,
  FileText,
  Clock,
  Edit,
  Trash2,
  ExternalLink,
  Users,
  Bell,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { SetReminderModal } from '../reminders/SetReminderModal';

interface ClientProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onEdit: (client: Client) => void;
  onOpenCreateJobForClient: (client: Client) => void;
}

export const ClientProfileModal: React.FC<ClientProfileModalProps> = ({
  isOpen,
  onClose,
  client,
  onEdit,
  onOpenCreateJobForClient,
}) => {
  const { jobs, candidates, deleteClient, canDeleteClientOrJob, canCreateTasks } = useCRM();
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'placements'>('overview');
  const [isReminderOpen, setIsReminderOpen] = useState(false);

  if (!client) return null;

  // Filter client's jobs
  const clientJobs = jobs.filter((j) => j.clientId === client.id);

  // Filter client's placed candidates
  const placedCandidates = candidates.filter(
    (c) => (c.clientId === client.id || c.clientName === client.name) && (c.status === 'Joined' || c.status === 'Offered')
  );

  const handleDelete = () => {
    if (confirm(`Are you sure you want to remove client ${client.name}?`)) {
      deleteClient(client.id);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={client.name}
      subtitle={`Corporate Client Profile • ${client.industry} • ${client.city}`}
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* Header Profile Summary */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-50 to-blue-50/40 dark:from-slate-800/80 dark:to-slate-850 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#0B1F4B] text-[#F5A623] flex items-center justify-center font-bold text-xl shadow-md">
              {client.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {client.name}
                </h2>
                <Badge variant={client.status === 'Active' ? 'success' : 'neutral'} size="sm">
                  {client.status}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {client.address}, {client.city}
                </span>
                <span>•</span>
                <a
                  href={client.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <Globe className="w-3 h-3" />
                  {client.website}
                </a>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {canCreateTasks && (
              <button
                onClick={() => setIsReminderOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Set Reminder</span>
              </button>
            )}

            <button
              onClick={() => {
                onClose();
                onOpenCreateJobForClient(client);
              }}
              className="px-3 py-1.5 rounded-lg bg-[#0B1F4B] hover:bg-[#163270] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Briefcase className="w-3.5 h-3.5 text-[#F5A623]" />
              <span>+ Post Job</span>
            </button>

            <button
              onClick={() => onEdit(client)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              title="Edit Client"
            >
              <Edit className="w-4 h-4" />
            </button>

            {canDeleteClientOrJob && (
              <button
                onClick={handleDelete}
                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                title="Delete Client"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'border-[#0B1F4B] dark:border-amber-400 text-[#0B1F4B] dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Overview & Contacts
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`pb-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'jobs'
                ? 'border-[#0B1F4B] dark:border-amber-400 text-[#0B1F4B] dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Job Openings ({clientJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('placements')}
            className={`pb-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'placements'
                ? 'border-[#0B1F4B] dark:border-amber-400 text-[#0B1F4B] dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Placed Candidates ({placedCandidates.length})
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-3">
                <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#F5A623]" />
                  <span>Account Details</span>
                </h3>
                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    <span className="text-slate-400">Industry:</span>
                    <span className="font-semibold">{client.industry}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    <span className="text-slate-400">Account Manager:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {client.assignedAccountManagerName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Onboarded:</span>
                    <span className="font-semibold">{formatIndianDate(client.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-3">
                <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#F5A623]" />
                  <span>Agreement & Commercial Terms</span>
                </h3>
                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    <span className="text-slate-400">Commission Rate:</span>
                    <span className="font-extrabold text-blue-600 dark:text-amber-400">
                      {client.commissionPercent}% of candidate annual CTC
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    <span className="text-slate-400">Credit Period:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {client.paymentTerms}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 pt-1">
                    {client.agreementDetails}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Persons */}
            <div className="space-y-3">
              <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-[#F5A623]" />
                <span>Authorized Contact Persons</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {client.contactPersons.map((cp) => (
                  <div
                    key={cp.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{cp.name}</p>
                      <p className="text-[11px] text-slate-500 font-medium">{cp.designation}</p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-[#F5A623]" />
                          {cp.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {cp.email}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Requisitions */}
        {activeTab === 'jobs' && (
          <div className="space-y-3">
            {clientJobs.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No active job openings mapped to this client currently.
              </div>
            ) : (
              clientJobs.map((j) => (
                <div
                  key={j.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">{j.title}</span>
                      <Badge variant={j.status === 'Open' ? 'success' : 'neutral'} size="sm">
                        {j.status}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {j.positions} Positions • Budget: ₹{j.salaryMinLPA}-{j.salaryMaxLPA} LPA • {j.minExpYears}-{j.maxExpYears}y Exp
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Recruiter:</span>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                      {j.assignedRecruiterNames.join(', ')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Placements */}
        {activeTab === 'placements' && (
          <div className="space-y-3">
            {placedCandidates.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No candidates placed with {client.name} yet.
              </div>
            ) : (
              placedCandidates.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center">
                      {c.fullName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{c.fullName}</p>
                      <p className="text-[11px] text-slate-500">
                        {c.skills.slice(0, 3).join(', ')} • {c.experienceYears}y Exp
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                      ₹{c.currentSalaryLPA || c.expectedSalaryLPA} LPA CTC
                    </span>
                    <span className="text-[10px] text-slate-400">Status: {c.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Set Reminder Modal for Client */}
      <SetReminderModal
        isOpen={isReminderOpen}
        onClose={() => setIsReminderOpen(false)}
        relatedType="client"
        relatedId={client.id}
        relatedName={client.name}
        defaultTitle={`Follow up with ${client.name} regarding contracts & hiring`}
      />
    </Modal>
  );
};
