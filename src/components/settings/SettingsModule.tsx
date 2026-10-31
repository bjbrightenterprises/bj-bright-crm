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
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { User, UserRole } from '../../types/crm';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

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
    companySettings,
    updateCompanySettings,
    isFirebaseConfigured,
    firebaseConfig,
    saveFirebaseSettings,
    removeFirebaseSettings,
    resetAllData,
    downloadDemoData,
    exportLogs,
    importLogs,
  } = useCRM();

  const [activeTab, setActiveTab] = useState<'users' | 'company' | 'masters' | 'firebase' | 'audit_logs'>('users');
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [resetSuccessNotice, setResetSuccessNotice] = useState(false);


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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#F5A623]" />
            Settings, User Roles & System Configuration
          </h2>
          <p className="text-xs text-slate-500">
            Manage staff accounts, RBAC permissions, Noida office details, and CRM data backup
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={downloadDemoData}
            className="px-3.5 py-2 rounded-xl bg-[#0B1F4B] hover:bg-[#163270] text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <ArrowDownToLine className="w-4 h-4 text-[#F5A623]" />
            <span>Backup CRM Data (JSON)</span>
          </button>
        </div>
      </div>

      {resetSuccessNotice && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Company & Mandate records synced (3 Active Clients, 6 In-Discussion Clients, 13 Open Job Mandates).</span>
        </div>
      )}

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
          onClick={() => setActiveTab('firebase')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'firebase'
              ? 'border-[#0B1F4B] dark:border-[#F5A623] text-[#0B1F4B] dark:text-[#F5A623]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Data Backup & Storage</span>
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
                    <td className="py-2.5 px-3 font-medium">View Companies & Remarks Timeline</td>
                    <td className="py-2.5 px-3 text-center text-emerald-500 font-bold">Yes (All)</td>
                    <td className="py-2.5 px-3 text-center text-emerald-500 font-bold">Yes (All)</td>
                    <td className="py-2.5 px-3 text-center text-emerald-500 font-bold">Yes (All)</td>
                    <td className="py-2.5 px-3 text-center text-blue-500 font-bold">Read-Only (All)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium">Companies: Add, Edit, Move Section & Add Remarks</td>
                    <td className="py-2.5 px-3 text-center text-emerald-500 font-bold">Yes</td>
                    <td className="py-2.5 px-3 text-center text-emerald-500 font-bold">Yes</td>
                    <td className="py-2.5 px-3 text-center text-emerald-500 font-bold">Yes</td>
                    <td className="py-2.5 px-3 text-center text-rose-500">No</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium">View Candidates, Pipeline & Interviews</td>
                    <td className="py-2.5 px-3 text-center text-emerald-500 font-bold">Yes (All)</td>
                    <td className="py-2.5 px-3 text-center text-emerald-500 font-bold">Yes (All)</td>
                    <td className="py-2.5 px-3 text-center text-amber-600 font-semibold">Assigned Only</td>
                    <td className="py-2.5 px-3 text-center text-amber-600 font-semibold">Assigned Only</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium">Create & Assign Tasks</td>
                    <td className="py-2.5 px-3 text-center text-emerald-500 font-bold">Yes (Anyone)</td>
                    <td className="py-2.5 px-3 text-center text-rose-500">No</td>
                    <td className="py-2.5 px-3 text-center text-emerald-500 font-bold">Yes (Recruiters)</td>
                    <td className="py-2.5 px-3 text-center text-rose-500">No</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium">Delete Companies / Records (30-Day Trash & Restore)</td>
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
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Website URL</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Office Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">City & State</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">PIN Code</label>
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-[#0B1F4B] hover:bg-[#163270] text-white font-bold rounded-lg shadow-xs cursor-pointer flex items-center gap-2"
          >
            <Save className="w-4 h-4 text-[#F5A623]" />
            <span>Save Company Profile</span>
          </button>
        </form>
      )}

      {/* Tab 3: Masters */}
      {activeTab === 'masters' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
          {/* Skills Master */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Candidate Skill Tags ({companySettings.availableSkills.length})</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Skills available across candidate & job requisition forms</p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const val = newSkill.trim();
                if (!val || companySettings.availableSkills.includes(val)) return;
                updateCompanySettings({ availableSkills: [...companySettings.availableSkills, val] });
                setNewSkill('');
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add new skill (e.g. SAP FICO)"
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-[#0B1F4B] text-white font-bold cursor-pointer"
              >
                + Add
              </button>
            </form>
            <div className="flex flex-wrap gap-1.5 max-h-64 overflow-y-auto">
              {companySettings.availableSkills.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium"
                >
                  <span>{s}</span>
                  <button
                    type="button"
                    onClick={() =>
                      updateCompanySettings({
                        availableSkills: companySettings.availableSkills.filter((item) => item !== s),
                      })
                    }
                    className="text-slate-400 hover:text-rose-500 font-bold cursor-pointer"
                    title="Remove skill"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Sources Master */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Sourcing Channels ({companySettings.availableSources.length})</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Channels for tracking candidate acquisition</p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const val = newSource.trim();
                if (!val || companySettings.availableSources.includes(val)) return;
                updateCompanySettings({ availableSources: [...companySettings.availableSources, val] });
                setNewSource('');
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={newSource}
                onChange={(e) => setNewSource(e.target.value)}
                placeholder="Add source (e.g. Apna, Shine)"
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-[#0B1F4B] text-white font-bold cursor-pointer"
              >
                + Add
              </button>
            </form>
            <div className="flex flex-wrap gap-1.5">
              {companySettings.availableSources.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium"
                >
                  <span>{s}</span>
                  <button
                    type="button"
                    onClick={() =>
                      updateCompanySettings({
                        availableSources: companySettings.availableSources.filter((item) => item !== s),
                      })
                    }
                    className="text-slate-400 hover:text-rose-500 font-bold cursor-pointer"
                    title="Remove source"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Industries Master */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Client Industries ({companySettings.availableIndustries.length})</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Sectors available when onboarding corporate clients</p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const val = newIndustry.trim();
                if (!val || companySettings.availableIndustries.includes(val)) return;
                updateCompanySettings({ availableIndustries: [...companySettings.availableIndustries, val] });
                setNewIndustry('');
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={newIndustry}
                onChange={(e) => setNewIndustry(e.target.value)}
                placeholder="Add industry sector"
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-[#0B1F4B] text-white font-bold cursor-pointer"
              >
                + Add
              </button>
            </form>
            <div className="flex flex-wrap gap-1.5">
              {companySettings.availableIndustries.map((ind) => (
                <span
                  key={ind}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium"
                >
                  <span>{ind}</span>
                  <button
                    type="button"
                    onClick={() =>
                      updateCompanySettings({
                        availableIndustries: companySettings.availableIndustries.filter((item) => item !== ind),
                      })
                    }
                    className="text-slate-400 hover:text-rose-500 font-bold cursor-pointer"
                    title="Remove industry"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Data Backup & Storage Administration */}
      {activeTab === 'firebase' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#F5A623]" />
                  <span>Full CRM Data Backup (JSON)</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Persistent data service active (`src/lib/dataService.ts`)
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                PRODUCTION LIVE
              </span>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Export all CRM records (candidates, companies across Green/Blue/Red sections, open job mandates, pipeline, interviews, tasks, and edit histories) as a portable JSON backup file.
            </p>

            <button
              type="button"
              onClick={downloadDemoData}
              className="px-4 py-2.5 rounded-lg bg-[#0B1F4B] hover:bg-[#163270] text-white font-bold flex items-center gap-2 cursor-pointer"
            >
              <ArrowDownToLine className="w-4 h-4 text-[#F5A623]" />
              <span>Download Full Backup (JSON)</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-blue-600" />
              <span>Restore Default Companies & Job Mandates</span>
            </h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Ensure all 3 Active (Green) companies, 6 In-Discussion (Blue) companies, and 13 Open Job Mandates are synced with their complete JDs and HR contacts.
            </p>
            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Sync Company & Mandate Defaults</span>
            </button>
          </div>
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

      {/* Reset Demo Data Confirmation Modal */}
      <Modal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        title="Confirm Reset Demo Data"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Restore Initial Demo Seed Dataset?</p>
              <p className="mt-1 opacity-90 leading-relaxed">
                This will overwrite current browser changes and restore the 22 sample candidates, 8 companies across Green/Blue/Red sections, 8 job openings, today&apos;s interviews, client follow-ups, and the 4 demo user accounts.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(false)}
              className="px-4 py-2 rounded-lg font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                resetAllData();
                setIsResetConfirmOpen(false);
                setResetSuccessNotice(true);
                setTimeout(() => setResetSuccessNotice(false), 3500);
              }}
              className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Yes, Reset Demo Data</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
