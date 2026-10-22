import React, { useState } from 'react';
import {
  Settings,
  Users,
  Building,
  ListFilter,
  Database,
  Plus,
  Trash2,
  Edit,
  ShieldCheck,
  CheckCircle2,
  Save,
  RotateCcw,
  Sparkles,
  Lock,
  Unlock,
  AlertTriangle,
  FileSpreadsheet,
  ArrowDownToLine,
  ArrowUpFromLine,
  Mail,
  MessageSquare,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { User, UserRole, WhatsAppTemplate } from '../../types/crm';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { DEFAULT_WHATSAPP_TEMPLATES } from '../../lib/whatsappTemplates';

export const SettingsModule: React.FC = () => {
  const {
    users,
    currentUser,
    canManageUsers,
    addUser,
    updateUser,
    toggleUserStatus,
    deleteUser,
    reassignmentTargetUser,
    setReassignmentTargetUser,
    reassignAndResolveUser,
    switchUser,
    firebaseAuthActive,
    sendPasswordSetupEmail,
    companySettings,
    updateCompanySettings,
    isFirebaseConfigured,
    firebaseConfig,
    saveFirebaseSettings,
    removeFirebaseSettings,
    resetAllData,
    exportLogs,
    importLogs,
  } = useCRM();

  const [activeTab, setActiveTab] = useState<'users' | 'company' | 'masters' | 'whatsapp' | 'firebase' | 'audit_logs'>('users');

  // WhatsApp Templates state
  const currentWhatsAppTemplates: WhatsAppTemplate[] =
    companySettings.whatsappTemplates && companySettings.whatsappTemplates.length > 0
      ? companySettings.whatsappTemplates
      : DEFAULT_WHATSAPP_TEMPLATES;

  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [templateEditTitle, setTemplateEditTitle] = useState('');
  const [templateEditBody, setTemplateEditBody] = useState('');
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [newTemplateTitle, setNewTemplateTitle] = useState('');
  const [newTemplateBody, setNewTemplateBody] = useState('');
  const [templateNotice, setTemplateNotice] = useState<string | null>(null);


  // Company form state
  const [companyName, setCompanyName] = useState(companySettings.companyName);
  const [tagline, setTagline] = useState(companySettings.tagline);
  const [address, setAddress] = useState(companySettings.address);
  const [city, setCity] = useState(companySettings.city);
  const [pincode, setPincode] = useState(companySettings.pincode);
  const [phone, setPhone] = useState(companySettings.phone);
  const [email, setEmail] = useState(companySettings.email);
  const [website, setWebsite] = useState(companySettings.website);
  const [gstin, setGstin] = useState(companySettings.gstin);
  const [companySaveNotice, setCompanySaveNotice] = useState(false);

  // User form modal
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('+91 ');
  const [userRole, setUserRole] = useState<UserRole>('recruiter');
  const [userDesignation, setUserDesignation] = useState('');
  const [userPassword, setUserPassword] = useState('');

  // Reassignment target user ID
  const [reassignNewUserId, setReassignNewUserId] = useState('');

  // Dropdown options
  const [newSkill, setNewSkill] = useState('');
  const [newSource, setNewSource] = useState('');
  const [newIndustry, setNewIndustry] = useState('');

  // Firebase tab inputs
  const [fbApiKey, setFbApiKey] = useState(firebaseConfig?.apiKey || '');
  const [fbProjectId, setFbProjectId] = useState(firebaseConfig?.projectId || '');
  const [fbAppId, setFbAppId] = useState(firebaseConfig?.appId || '');

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanySettings({
      companyName,
      tagline,
      address,
      city,
      pincode,
      phone,
      email,
      website,
      gstin,
    });
    setCompanySaveNotice(true);
    setTimeout(() => setCompanySaveNotice(false), 2000);
  };

  const handleOpenUserModal = (u?: User) => {
    if (u) {
      setUserToEdit(u);
      setUserName(u.name);
      setUserEmail(u.email);
      setUserPhone(u.phone);
      setUserRole(u.role);
      setUserDesignation(u.designation);
      setUserPassword('');
    } else {
      setUserToEdit(null);
      setUserName('');
      setUserEmail('');
      setUserPhone('+91 ');
      setUserRole('recruiter');
      setUserDesignation('Recruitment Consultant');
      setUserPassword('bjbright2026');
    }
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim()) return;

    if (userToEdit) {
      updateUser(userToEdit.id, {
        name: userName.trim(),
        email: userEmail.trim().toLowerCase(),
        phone: userPhone.trim(),
        role: userRole,
        designation: userDesignation.trim(),
        ...(userPassword ? { password: userPassword } : {}),
      });
    } else {
      addUser({
        name: userName.trim(),
        email: userEmail.trim().toLowerCase(),
        phone: userPhone.trim(),
        role: userRole,
        designation: userDesignation.trim(),
        avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
        active: true,
        password: userPassword || 'bjbright2026',
      });
    }
    setIsUserModalOpen(false);
  };

  const handleStartEditTemplate = (tmpl: WhatsAppTemplate) => {
    setEditingTemplateId(tmpl.id);
    setTemplateEditTitle(tmpl.title);
    setTemplateEditBody(tmpl.body);
  };

  const handleSaveEditedTemplate = (id: string) => {
    if (!templateEditTitle.trim() || !templateEditBody.trim()) return;
    const updated = currentWhatsAppTemplates.map((t) =>
      t.id === id ? { ...t, title: templateEditTitle.trim(), body: templateEditBody.trim() } : t
    );
    updateCompanySettings({ whatsappTemplates: updated });
    setEditingTemplateId(null);
    setTemplateNotice('Template updated successfully');
    setTimeout(() => setTemplateNotice(null), 2500);
  };

  const handleCreateNewTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateTitle.trim() || !newTemplateBody.trim()) return;
    const newTmpl: WhatsAppTemplate = {
      id: `tmpl_${Date.now()}`,
      title: newTemplateTitle.trim(),
      body: newTemplateBody.trim(),
    };
    const updated = [...currentWhatsAppTemplates, newTmpl];
    updateCompanySettings({ whatsappTemplates: updated });
    setIsAddingTemplate(false);
    setNewTemplateTitle('');
    setNewTemplateBody('');
    setTemplateNotice('New template added successfully');
    setTimeout(() => setTemplateNotice(null), 2500);
  };

  const handleDeleteTemplate = (id: string) => {
    if (currentWhatsAppTemplates.length <= 1) {
      alert('At least one template must remain in the system.');
      return;
    }
    if (confirm('Are you sure you want to delete this template?')) {
      const updated = currentWhatsAppTemplates.filter((t) => t.id !== id);
      updateCompanySettings({ whatsappTemplates: updated });
      setTemplateNotice('Template deleted');
      setTimeout(() => setTemplateNotice(null), 2500);
    }
  };

  const handleResetTemplates = () => {
    if (confirm('Reset all WhatsApp templates back to factory defaults? Any custom templates will be replaced.')) {
      updateCompanySettings({ whatsappTemplates: DEFAULT_WHATSAPP_TEMPLATES });
      setTemplateNotice('Reset templates to default library');
      setTimeout(() => setTemplateNotice(null), 2500);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#F5A623]" />
          Settings, User Roles & System Configuration
        </h2>
        <p className="text-xs text-slate-500">
          Manage team members, RBAC permission table, Noida office details, and system administration
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'users'
              ? 'border-[#0B1F4B] dark:border-[#F5A623] text-[#0B1F4B] dark:text-[#F5A623]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>User Management & Permissions ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('company')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'company'
              ? 'border-[#0B1F4B] dark:border-[#F5A623] text-[#0B1F4B] dark:text-[#F5A623]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Company Profile (Noida)</span>
        </button>

        <button
          onClick={() => setActiveTab('masters')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'masters'
              ? 'border-[#0B1F4B] dark:border-[#F5A623] text-[#0B1F4B] dark:text-[#F5A623]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ListFilter className="w-3.5 h-3.5" />
          <span>Dropdown Masters</span>
        </button>

        <button
          onClick={() => setActiveTab('whatsapp')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'whatsapp'
              ? 'border-[#0B1F4B] dark:border-[#F5A623] text-[#0B1F4B] dark:text-[#F5A623]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>WhatsApp Templates ({currentWhatsAppTemplates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('firebase')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'firebase'
              ? 'border-[#0B1F4B] dark:border-[#F5A623] text-[#0B1F4B] dark:text-[#F5A623]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Firebase Sync</span>
        </button>

        {currentUser.role === 'admin' && (
          <button
            onClick={() => setActiveTab('audit_logs')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'audit_logs'
                ? 'border-[#0B1F4B] dark:border-[#F5A623] text-[#0B1F4B] dark:text-[#F5A623]'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export & Import Logs ({exportLogs.length + importLogs.length})</span>
          </button>
        )}
      </div>


      {/* Tab 1: User Management & Permission Matrix */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-950 dark:text-blue-200">
            <div>
              <p className="font-bold">Strict Access Control</p>
              <p className="text-[11px] opacity-80 mt-0.5">
                Only email IDs added by Admin can log in. Disabling a user immediately revokes access and signs out active sessions.
              </p>
            </div>
            {canManageUsers && (
              <button
                onClick={() => handleOpenUserModal()}
                className="px-3.5 py-1.5 rounded-lg bg-[#0B1F4B] hover:bg-[#163270] text-white font-bold flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#F5A623]" />
                <span>Add Team Member</span>
              </button>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4">Role Access</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => {
                  const isCurrent = u.id === currentUser.id;
                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 ${
                        isCurrent ? 'bg-amber-50/30 dark:bg-amber-950/20' : ''
                      } ${!u.active ? 'opacity-50 bg-slate-100 dark:bg-slate-800/50' : ''}`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="w-8 h-8 rounded-full object-cover border"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {u.name}
                              </span>
                              {isCurrent && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-200 text-amber-900">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                        {u.designation}
                      </td>

                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{u.phone}</td>

                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            u.role === 'admin'
                              ? 'gold'
                              : u.role === 'manager'
                              ? 'primary'
                              : 'neutral'
                          }
                          size="sm"
                        >
                          {u.role.toUpperCase().replace('_', ' ')}
                        </Badge>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${u.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                          {u.active ? 'Active' : 'Disabled'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!firebaseAuthActive && (
                          <button
                            onClick={() => switchUser(u.id)}
                            className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-[11px] cursor-pointer"
                          >
                            Switch
                          </button>
                          )}

                          {firebaseAuthActive && canManageUsers && (
                            <button
                              onClick={async () => {
                                try {
                                  await sendPasswordSetupEmail(u.email);
                                  alert(`Password reset email sent to ${u.email}`);
                                } catch (err) {
                                  alert(`Could not send email: ${(err as Error).message}`);
                                }
                              }}
                              className="p-1 rounded text-slate-400 hover:text-blue-600 cursor-pointer"
                              title="Send password reset email"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {canManageUsers && (
                            <button
                              onClick={() => handleOpenUserModal(u)}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                              title="Edit User"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {canManageUsers && !isCurrent && (
                            <button
                              onClick={() => toggleUserStatus(u.id)}
                              className={`p-1 rounded cursor-pointer ${u.active ? 'text-amber-500 hover:text-amber-700' : 'text-emerald-500 hover:text-emerald-700'}`}
                              title={u.active ? 'Disable Access' : 'Enable Access'}
                            >
                              {u.active ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                            </button>
                          )}

                          {canManageUsers && users.length > 1 && !isCurrent && (
                            <button
                              onClick={() => {
                                if (confirm(`Permanently delete user ${u.name}?`)) {
                                  deleteUser(u.id);
                                }
                              }}
                              className="p-1 rounded text-rose-400 hover:text-rose-600 cursor-pointer"
                              title="Delete User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Role Permission Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#F5A623]" />
              Role Permission Matrix
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Capability</th>
                    <th className="py-2.5 px-3 text-center">Admin</th>
                    <th className="py-2.5 px-3 text-center">Manager</th>
                    <th className="py-2.5 px-3 text-center">HR Executive</th>
                    <th className="py-2.5 px-3 text-center">Recruiter</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  <tr>
                    <td className="py-2.5 px-3 font-medium">View All Records (Team Data)</td>
                    <td className="py-2.5 px-3 text-center text-emerald-500 font-bold">Yes</td>
                    <td className="py-2.5 px-3 text-center text-emerald-500 font-bold">Yes</td>
                    <td className="py-2.5 px-3 text-center text-rose-500">Assigned Only</td>
                    <td className="py-2.5 px-3 text-center text-rose-500">Assigned Only</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium">Create & Assign Tasks</td>
                    <td className="py-2.5 px-3 text-center text-emerald-500 font-bold">Yes</td>
                    <td className="py-2.5 px-3 text-center text-rose-500">No</td>
                    <td className="py-2.5 px-3 text-center text-emerald-500 font-bold">Yes</td>
                    <td className="py-2.5 px-3 text-center text-rose-500">No</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium">Edit Records (Mandatory Reason)</td>
                    <td className="py-2.5 px-3 text-center text-emerald-500 font-bold">Yes</td>
                    <td className="py-2.5 px-3 text-center text-emerald-500 font-bold">Yes</td>
                    <td className="py-2.5 px-3 text-center text-emerald-500 font-bold">Yes</td>
                    <td className="py-2.5 px-3 text-center text-emerald-500 font-bold">Yes</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium">Delete Records (Trash / Restore)</td>
                    <td className="py-2.5 px-3 text-center text-emerald-500 font-bold">Admin Only</td>
                    <td className="py-2.5 px-3 text-center text-rose-500">No</td>
                    <td className="py-2.5 px-3 text-center text-rose-500">No</td>
                    <td className="py-2.5 px-3 text-center text-rose-500">No</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium">User Management & Settings</td>
                    <td className="py-2.5 px-3 text-center text-emerald-500 font-bold">Admin Only</td>
                    <td className="py-2.5 px-3 text-center text-rose-500">No</td>
                    <td className="py-2.5 px-3 text-center text-rose-500">No</td>
                    <td className="py-2.5 px-3 text-center text-rose-500">No</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Company Profile */}
      {activeTab === 'company' && (
        <form
          onSubmit={handleSaveCompany}
          className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 text-xs max-w-3xl"
        >
          {companySaveNotice && (
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Company details updated successfully!</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Company Legal Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">GSTIN</label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Phone (+91)</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-[#0B1F4B] hover:bg-[#163270] text-white font-bold rounded-lg shadow-xs cursor-pointer"
          >
            Save Company Profile
          </button>
        </form>
      )}

      {/* Tab 3: Masters */}
      {activeTab === 'masters' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 text-xs space-y-4 max-w-3xl">
          <h3 className="font-bold text-slate-900 dark:text-white">Dropdown Master Options</h3>
          <p className="text-slate-500">Configure candidate sources and skill tags available across forms.</p>
          <div>
            <label className="font-bold block mb-1">Available Sources</label>
            <div className="flex flex-wrap gap-2">
              {companySettings.availableSources.map((s) => (
                <span key={s} className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-medium">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: WhatsApp Templates */}
      {activeTab === 'whatsapp' && (
        <div className="space-y-6 max-w-4xl">
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  WhatsApp Messaging Templates ({currentWhatsAppTemplates.length})
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage pre-configured recruiter WhatsApp message templates. Placeholders are auto-populated dynamically when opening a candidate chat.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetTemplates}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Restore standard library of 10 templates"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Reset Defaults</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddingTemplate(true)}
                className="px-3.5 py-1.5 rounded-lg bg-[#0B1F4B] hover:bg-[#163270] dark:bg-[#F5A623] dark:hover:bg-amber-500 text-white dark:text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Template</span>
              </button>
            </div>
          </div>

          {templateNotice && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{templateNotice}</span>
            </div>
          )}

          {/* Placeholders Guide Banner */}
          <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/40 text-xs space-y-2">
            <span className="font-bold text-blue-950 dark:text-blue-200 uppercase tracking-wider text-[10px]">
              Supported Dynamic Placeholders
            </span>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 font-mono text-blue-700 dark:text-blue-300">
                &#123;name&#125; <span className="text-slate-400 font-sans text-[10px]">(Candidate Name)</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 font-mono text-blue-700 dark:text-blue-300">
                &#123;position&#125; <span className="text-slate-400 font-sans text-[10px]">(Candidate Job Role)</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 font-mono text-blue-700 dark:text-blue-300">
                &#123;company&#125; <span className="text-slate-400 font-sans text-[10px]">(Client / Company)</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 font-mono text-blue-700 dark:text-blue-300">
                &#123;recruiter&#125; <span className="text-slate-400 font-sans text-[10px]">(Your Name)</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 font-mono text-blue-700 dark:text-blue-300">
                &#123;date&#125; <span className="text-slate-400 font-sans text-[10px]">(Date)</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 font-mono text-blue-700 dark:text-blue-300">
                &#123;time&#125; <span className="text-slate-400 font-sans text-[10px]">(Time)</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 font-mono text-blue-700 dark:text-blue-300">
                &#123;location&#125; <span className="text-slate-400 font-sans text-[10px]">(Interview Location)</span>
              </span>
            </div>
          </div>

          {/* New Template Form */}
          {isAddingTemplate && (
            <form
              onSubmit={handleCreateNewTemplate}
              className="p-5 rounded-xl bg-white dark:bg-slate-900 border-2 border-emerald-500/40 shadow-md space-y-4 text-xs animate-in fade-in"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-emerald-600" />
                  Add New Message Template
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAddingTemplate(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Template Title / Subject *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Assessment Test Link, Background Verification"
                  value={newTemplateTitle}
                  onChange={(e) => setNewTemplateTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Message Body * (Use placeholders like &#123;name&#125;, &#123;position&#125;)
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="Dear {name}, this is {recruiter} from BJ Bright Enterprises regarding your application for {position}..."
                  value={newTemplateBody}
                  onChange={(e) => setNewTemplateBody(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#0B1F4B] resize-y"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingTemplate(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors cursor-pointer shadow-xs"
                >
                  Save New Template
                </button>
              </div>
            </form>
          )}

          {/* Templates List */}
          <div className="space-y-3">
            {currentWhatsAppTemplates.map((tmpl) => {
              const isEditing = editingTemplateId === tmpl.id;

              return (
                <div
                  key={tmpl.id}
                  className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
                >
                  {isEditing ? (
                    <div className="space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white">
                          Edit Template
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ID: {tmpl.id}
                        </span>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Template Title
                        </label>
                        <input
                          type="text"
                          value={templateEditTitle}
                          onChange={(e) => setTemplateEditTitle(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Message Body
                        </label>
                        <textarea
                          rows={6}
                          value={templateEditBody}
                          onChange={(e) => setTemplateEditBody(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs resize-y"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingTemplateId(null)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEditedTemplate(tmpl.id)}
                          className="px-4 py-1.5 rounded-lg bg-[#0B1F4B] hover:bg-[#163270] dark:bg-[#F5A623] dark:hover:bg-amber-500 text-white dark:text-slate-950 text-xs font-bold cursor-pointer transition-colors"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                            {tmpl.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {tmpl.id}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStartEditTemplate(tmpl)}
                            className="p-1 rounded text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            title="Edit Template"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {currentWhatsAppTemplates.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteTemplate(tmpl.id)}
                              className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                              title="Delete Template"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">
                        {tmpl.body}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Firebase */}
      {activeTab === 'firebase' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 text-xs space-y-4 max-w-3xl">
          <h3 className="font-bold text-slate-900 dark:text-white">Firebase Backend Status</h3>
          <p className="text-slate-500">
            {isFirebaseConfigured ? 'Connected to Firebase Firestore project.' : 'Running on LocalStorage fallback mode.'}
          </p>
        </div>
      )}

      {/* Tab 5: Export & Import Audit Logs (Admin only) */}
      {activeTab === 'audit_logs' && currentUser.role === 'admin' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-950 dark:text-blue-200">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[#0B1F4B] dark:text-[#F5A623]" />
              <p className="font-bold text-sm">Data Analyst Audit Logs (Export & Import History)</p>
            </div>
            <p className="text-[11px] opacity-80 mt-1">
              Complete administrative log of all genuine .xlsx exports and candidate/client/job spreadsheet imports, capturing user roles, timestamps (IST), record scopes, filters applied, and row-level batch outcomes.
            </p>
          </div>

          {/* Export Log Section */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowUpFromLine className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Excel Export Log ({exportLogs.length})</h3>
              </div>
              <span className="text-[11px] text-slate-400">Captured at moment of .xlsx workbook generation</span>
            </div>

            {exportLogs.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                No exports have been generated in this session yet. Use &ldquo;Export to Excel&rdquo; on Candidates, Clients, Jobs, Interviews, Pipeline, or Reports.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Timestamp (IST)</th>
                      <th className="py-2.5 px-3">Exported By</th>
                      <th className="py-2.5 px-3">Module</th>
                      <th className="py-2.5 px-3">Rows</th>
                      <th className="py-2.5 px-3">Scope</th>
                      <th className="py-2.5 px-3">Filters Applied</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {exportLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                          {new Date(log.timestamp).toLocaleString('en-IN', {
                            timeZone: 'Asia/Kolkata',
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-900 dark:text-white">{log.userName}</span>
                          <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {log.userRole}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-[#0B1F4B] dark:text-[#F5A623]">{log.module}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300">{log.rowCount} rows</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              log.scope === 'all'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            }`}
                          >
                            {log.scope === 'all' ? 'All Accessible Records' : 'Current Filtered View'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-slate-500 max-w-xs truncate" title={log.filtersApplied || 'None'}>
                          {log.filtersApplied || 'None (Unfiltered)'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Import Log Section */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowDownToLine className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Excel / CSV Import Log ({importLogs.length})</h3>
              </div>
              <span className="text-[11px] text-slate-400">Recorded after batch processing</span>
            </div>

            {importLogs.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                No imports logged in this session. Use &ldquo;Import from Excel / CSV&rdquo; on Candidates, Clients, or Jobs.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Timestamp (IST)</th>
                      <th className="py-2.5 px-3">Imported By</th>
                      <th className="py-2.5 px-3">Module</th>
                      <th className="py-2.5 px-3">File Name</th>
                      <th className="py-2.5 px-3 text-emerald-600">Added</th>
                      <th className="py-2.5 px-3 text-blue-600">Updated</th>
                      <th className="py-2.5 px-3 text-amber-600">Skipped</th>
                      <th className="py-2.5 px-3 text-rose-600">Failed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {importLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                          {new Date(log.timestamp).toLocaleString('en-IN', {
                            timeZone: 'Asia/Kolkata',
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-900 dark:text-white">{log.userName}</span>
                          <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {log.userRole}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-[#0B1F4B] dark:text-[#F5A623]">{log.module}</td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">{log.fileName}</td>
                        <td className="py-2.5 px-3 font-bold text-emerald-600">+{log.addedCount}</td>
                        <td className="py-2.5 px-3 font-bold text-blue-600">{log.updatedCount}</td>
                        <td className="py-2.5 px-3 font-semibold text-amber-600">{log.skippedCount}</td>
                        <td className="py-2.5 px-3 font-semibold text-rose-600">{log.failedCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}


      {/* Reassignment Modal when disabling/deleting user */}
      {reassignmentTargetUser && (
        <Modal
          isOpen={true}
          onClose={() => setReassignmentTargetUser(null)}
          title={`Reassign Records from ${reassignmentTargetUser.user.name}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                This user currently owns candidates, job requisitions, or tasks. Please select another active team member to reassign all their active records before {reassignmentTargetUser.type}ing.
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Reassign Records To:</label>
              <select
                value={reassignNewUserId}
                onChange={(e) => setReassignNewUserId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
              >
                <option value="">Select active team member...</option>
                {users.filter(u => u.id !== reassignmentTargetUser.user.id && u.active).map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role.toUpperCase()})</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setReassignmentTargetUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!reassignNewUserId}
                onClick={() => {
                  if (reassignNewUserId) {
                    reassignAndResolveUser(reassignmentTargetUser.user.id, reassignNewUserId, reassignmentTargetUser.type);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-[#F5A623] hover:bg-amber-500 disabled:opacity-50 text-slate-950 font-extrabold cursor-pointer"
              >
                Reassign & {reassignmentTargetUser.type === 'disable' ? 'Disable' : 'Delete'} User
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add / Edit User Modal */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title={userToEdit ? 'Edit Team Member' : 'Add Team Member'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="e.g. Anjali Sharma"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Corporate Email ID *</label>
            <input
              type="email"
              required
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="anjali@bjbright.com"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Mobile Phone (+91)</label>
            <input
              type="text"
              value={userPhone}
              onChange={(e) => setUserPhone(e.target.value)}
              placeholder="+91 98110 00000"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Designation</label>
            <input
              type="text"
              value={userDesignation}
              onChange={(e) => setUserDesignation(e.target.value)}
              placeholder="e.g. Senior HR Recruiter"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {firebaseAuthActive ? (
            <p className="text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2.5">
              A login is created automatically and a password-setup email is sent to this address.
            </p>
          ) : (
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Password (min 8 chars)</label>
            <input
              type="text"
              value={userPassword}
              onChange={(e) => setUserPassword(e.target.value)}
              placeholder="bjbright2026"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
          )}

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Access Role</label>
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="admin">Admin (Full Access & User Control)</option>
              <option value="manager">Manager (Team View & Reports)</option>
              <option value="hr_executive">HR Executive (Sourcing & Tasks)</option>
              <option value="recruiter">Recruiter (Assigned Records Only)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsUserModalOpen(false)}
              className="px-4 py-2 font-semibold text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#0B1F4B] text-white font-bold rounded-lg shadow-xs cursor-pointer"
            >
              Save Team Member
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
