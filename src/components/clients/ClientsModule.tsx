import React, { useState, useMemo } from 'react';
import {
  Building2,
  Search,
  Plus,
  MapPin,
  Globe,
  Briefcase,
  Trophy,
  Phone,
  Mail,
  ExternalLink,
  Edit,
  Trash2,
  ChevronRight,
  ShieldCheck,
  Upload,
  Download,
  Bell,
} from 'lucide-react';
import { Client } from '../../types/crm';
import { useCRM } from '../../context/CRMContext';
import { Badge } from '../common/Badge';
import { ClientFormModal } from './ClientFormModal';
import { ClientProfileModal } from './ClientProfileModal';
import { ExcelCsvImportModal } from '../common/ExcelCsvImportModal';
import { ExcelExportModal } from '../common/ExcelExportModal';
import { CLIENT_EXPORT_COLUMNS, generateClientsSummarySheet } from '../../lib/excelModuleConfigs';
import { SetReminderModal } from '../reminders/SetReminderModal';

interface ClientsModuleProps {
  onOpenCreateJobForClient: (client: Client) => void;
}

export const ClientsModule: React.FC<ClientsModuleProps> = ({
  onOpenCreateJobForClient,
}) => {
  const { visibleClients, jobs, candidates, canDeleteClientOrJob, deleteClient, currentUser, canCreateTasks } = useCRM();


  const [search, setSearch] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Modals
  const [activeProfileClient, setActiveProfileClient] = useState<Client | null>(null);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [reminderClient, setReminderClient] = useState<Client | null>(null);

  // Filtered clients
  const filteredClients = useMemo(() => {
    return visibleClients.filter((cl) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        cl.name.toLowerCase().includes(q) ||
        cl.city.toLowerCase().includes(q) ||
        cl.industry.toLowerCase().includes(q) ||
        cl.contactPersons.some((cp) => cp.name.toLowerCase().includes(q) || cp.email.toLowerCase().includes(q));

      if (!matchesSearch) return false;
      if (selectedIndustry !== 'All' && cl.industry !== selectedIndustry) return false;
      if (selectedStatus !== 'All' && cl.status !== selectedStatus) return false;

      return true;
    });
  }, [visibleClients, search, selectedIndustry, selectedStatus]);

  // Unique industries
  const industries = useMemo(() => {
    const set = new Set<string>();
    visibleClients.forEach((cl) => set.add(cl.industry));
    return Array.from(set);
  }, [visibleClients]);

  const handleExportCSV = () => {
    if (filteredClients.length === 0) {
      alert('No clients to export.');
      return;
    }

    const headers = [
      'Company Name',
      'Industry Sector',
      'Location City',
      'Corporate Address',
      'Website',
      'Primary Contact Name',
      'Contact Designation',
      'Contact Phone',
      'Contact Email',
      'Commission Fee %',
      'Payment Terms',
      'Status',
    ];

    const rows = filteredClients.map((c) => [
      `"${c.name}"`,
      `"${c.industry}"`,
      `"${c.city}"`,
      `"${c.address}"`,
      `"${c.website}"`,
      `"${c.contactPersons[0]?.name || ''}"`,
      `"${c.contactPersons[0]?.designation || ''}"`,
      `"${c.contactPersons[0]?.phone || ''}"`,
      `"${c.contactPersons[0]?.email || ''}"`,
      c.commissionPercent,
      `"${c.paymentTerms}"`,
      `"${c.status}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BJ_Bright_Clients_${new Date().toISOString().slice(0, 10)}.csv`;
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
            <Building2 className="w-5 h-5 text-[#F5A623]" />
            Corporate Clients & Accounts
          </h2>
          <p className="text-xs text-slate-500">
            {filteredClients.length} enterprise corporate accounts across Noida & Delhi NCR
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
              setClientToEdit(null);
              setIsFormModalOpen(true);
            }}
            className="px-4 py-2 rounded-lg bg-[#0B1F4B] hover:bg-[#163270] text-white text-xs font-bold shadow-md transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-[#F5A623]" />
            <span>Onboard Client</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by client name, industry, city, or contact person..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="All">All Industries</option>
            {industries.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Prospect">Prospect</option>
          </select>
        </div>
      </div>

      {/* Client Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            No corporate clients found matching your search.
          </div>
        ) : (
          filteredClients.map((client) => {
            const clientJobsCount = jobs.filter((j) => j.clientId === client.id).length;
            const placedCount = candidates.filter(
              (c) => (c.clientId === client.id || c.clientName === client.name) && (c.status === 'Joined' || c.status === 'Offered')
            ).length;

            return (
              <div
                key={client.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-[#0B1F4B] dark:hover:border-amber-500 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Row: Initial Logo & Status */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-[#0B1F4B] text-white flex items-center justify-center font-bold text-lg shadow-sm border border-amber-500/30">
                        {client.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white hover:text-blue-600 cursor-pointer"
                          onClick={() => setActiveProfileClient(client)}
                        >
                          {client.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#F5A623]" />
                          <span>{client.city}</span>
                        </p>
                      </div>
                    </div>

                    <Badge
                      variant={
                        client.status === 'Active'
                          ? 'success'
                          : client.status === 'Prospect'
                          ? 'warning'
                          : 'neutral'
                      }
                      size="sm"
                    >
                      {client.status}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                    {client.industry}
                  </p>

                  {/* Primary Contact Person */}
                  {client.contactPersons.length > 0 && (
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-xs mb-3">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase mb-1">
                        <span>Lead Contact:</span>
                        <span>{client.contactPersons[0].designation}</span>
                      </div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {client.contactPersons[0].name}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-[#F5A623]" />
                          {client.contactPersons[0].phone}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Stats Pill */}
                  <div className="grid grid-cols-3 gap-2 text-center py-2 bg-slate-50/60 dark:bg-slate-800/30 rounded-lg text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">Open Jobs</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        {clientJobsCount}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">Placed</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {placedCount}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">Fee %</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {client.commissionPercent}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => onOpenCreateJobForClient(client)}
                    className="text-xs font-bold text-blue-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Job</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {canCreateTasks && (
                      <button
                        onClick={() => setReminderClient(client)}
                        className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                        title="Set Client Follow-up Reminder"
                      >
                        <Bell className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setClientToEdit(client);
                        setIsFormModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Edit Client"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setActiveProfileClient(client)}
                      className="px-2.5 py-1 rounded-lg bg-[#0B1F4B]/10 hover:bg-[#0B1F4B]/20 text-[#0B1F4B] dark:bg-blue-900/40 dark:text-blue-300 text-xs font-bold flex items-center gap-1"
                    >
                      <span>View</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Client Profile Modal */}
      <ClientProfileModal
        isOpen={!!activeProfileClient}
        onClose={() => setActiveProfileClient(null)}
        client={activeProfileClient}
        onEdit={(cl) => {
          setActiveProfileClient(null);
          setClientToEdit(cl);
          setIsFormModalOpen(true);
        }}
        onOpenCreateJobForClient={(cl) => {
          setActiveProfileClient(null);
          onOpenCreateJobForClient(cl);
        }}
      />

      {/* Client Form Modal */}
      <ClientFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setClientToEdit(null);
        }}
        clientToEdit={clientToEdit}
      />

      {/* Excel/CSV Ingestion Wizard Modal */}
      <ExcelCsvImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        entityType="clients"
      />

      {/* Analyst-Grade Excel Export Modal */}
      <ExcelExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        moduleName="Clients"
        tableName="tblClients"
        sheetName="Clients"
        columns={CLIENT_EXPORT_COLUMNS}
        filteredData={filteredClients}
        allAccessibleData={visibleClients}
        filtersDescription={`Industry: ${selectedIndustry}, Status: ${selectedStatus}, Search: "${search || 'All'}"`}
        summaryGenerator={generateClientsSummarySheet}
      />

      {/* Set Reminder Modal for Client */}
      <SetReminderModal
        isOpen={!!reminderClient}
        onClose={() => setReminderClient(null)}
        relatedType="client"
        relatedId={reminderClient?.id}
        relatedName={reminderClient?.name}
        defaultTitle={reminderClient ? `Follow up with ${reminderClient.name} regarding hiring requirements & payments` : undefined}
      />
    </div>
  );
};
