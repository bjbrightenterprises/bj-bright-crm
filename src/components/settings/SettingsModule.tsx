import React, { useState } from 'react';
import {
  Settings,
  Users,
  Building,
  ListFilter,
  Database,
  Plus,
  Edit,
  ShieldCheck,
  CheckCircle2,
  Save,
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
    clients,
    currentUser,
    canManageUsers,
    addUser,
    updateUser,
    toggleUserStatus,
    reassignmentTargetUser,
    setReassignmentTargetUser,
    reassignAndResolveUser,
    companySettings,
    updateCompanySettings,
    loadStarterData,
    sendForgotPasswordEmail,
    downloadDemoData,
    exportLogs,
    importLogs,
  } = useCRM();

  const [activeTab, setActiveTab] = useState<'users' | 'company' | 'masters' | 'firebase' | 'audit_logs'>('users');
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [starterNotice, setStarterNotice] = useState<string>('');
  const [isLoadingStarter, setIsLoadingStarter] = useState(false);
  const [userSaveError, setUserSaveError] = useState('');
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [resetEmailNotice, setResetEmailNotice] = useState('');

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
    setUserSaveError('');
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

  const handleLoadStarterData = async () => {
    setIsLoadingStarter(true);
    setStarterNotice('');
    try {
      const result = await loadStarterData();
      if (result.loaded) {
        setStarterNotice(
          `Starter data loaded: ${result.clientsCount} companies and ${result.jobsCount} open job mandates added to Firestore.`
        );
      } else {
        setStarterNotice(
          `Starter data skipped: Firestore already has ${result.clientsCount} companies.`
        );
      }
    } catch (err: any) {
      setStarterNotice(err?.message || 'Could not load starter data.');
    } finally {
      setIsLoadingStarter(false);
      setIsResetConfirmOpen(false);
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim()) return;
    setUserSaveError('');
    setIsSavingUser(true);

    try {
      if (userToEdit) {
        updateUser(userToEdit.id, {
          name: userName.trim(),
          email: userEmail.trim().toLowerCase(),
          phone: userPhone.trim(),
          role: userRole,
          designation: userDesignation.trim(),
        });
      } else {
        await addUser({
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
    } catch (err: any) {
      setUserSaveError(err?.message || 'Failed to create user account in Firebase Auth.');
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleSendPasswordReset = async (emailAddr: string) => {
    setResetEmailNotice('');
    try {
      await sendForgotPasswordEmail(emailAddr);
      setResetEmailNotice(`Password reset email sent to ${emailAddr}`);
      setTimeout(() => setResetEmailNotice(''), 4000);
    } catch (err: any) {
      setResetEmailNotice(err?.message || `Failed to send reset email to ${emailAddr}`);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#F5A623] shrink-0" />
            <span>Settings, User Roles & System Configuration</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Manage Firebase Auth staff accounts, RBAC permissions, Noida office details, and cloud backups
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {currentUser.role === 'admin' && (
            <button
              type="button"
              disabled={isLoadingStarter || clients.length > 0}
              onClick={handleLoadStarterData}
              className="min-h-[42px] px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-2xs cursor-pointer"
              title={
                clients.length > 0
                  ? 'Starter data already loaded (collection is not empty)'
                  : 'Write starter companies and job mandates once into Firestore'
              }
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{isLoadingStarter ? 'Loading...' : 'Load starter data'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={downloadDemoData}
            className="min-h-[42px] px-3.5 py-2 rounded-xl bg-[#0B1F4B] hover:bg-[#163270] text-white text-xs font-bold flex items-center gap-2 shadow-2xs cursor-pointer"
          >
            <ArrowDownToLine className="w-4 h-4 text-[#F5A623]" />
            <span>Backup CRM Data (JSON)</span>
          </button>
        </div>
      </div>

      {starterNotice && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
          <span>{starterNotice}</span>
        </div>
      )}

      {resetEmailNotice && (
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#0B1F4B]" />
          <span>{resetEmailNotice}</span>
        </div>
      )}

      {/* Horizontal Scrollable Tabs */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('users')}
          className={`min-h-[44px] px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'users'
              ? 'border-[#0B1F4B] text-[#0B1F4B]'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>User Management & Permissions ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('company')}
          className={`min-h-[44px] px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'company'
              ? 'border-[#0B1F4B] text-[#0B1F4B]'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Company Profile (Noida)</span>
        </button>

        <button
          onClick={() => setActiveTab('masters')}
          className={`min-h-[44px] px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'masters'
              ? 'border-[#0B1F4B] text-[#0B1F4B]'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <ListFilter className="w-3.5 h-3.5" />
          <span>Dropdown Masters</span>
        </button>

        <button
          onClick={() => setActiveTab('firebase')}
          className={`min-h-[44px] px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'firebase'
              ? 'border-[#0B1F4B] text-[#0B1F4B]'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Data Backup & Storage</span>
        </button>

        {currentUser.role === 'admin' && (
          <button
            onClick={() => setActiveTab('audit_logs')}
            className={`min-h-[44px] px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'audit_logs'
                ? 'border-[#0B1F4B] text-[#0B1F4B]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-950">
            <div>
              <p className="font-bold text-[#0B1F4B]">Strict Access Control</p>
              <p className="text-[11px] text-slate-700 mt-0.5">
                Only email IDs added by Admin can log in. Disabling a user immediately revokes access and signs out active sessions.
              </p>
            </div>
            {canManageUsers && (
              <button
                onClick={() => handleOpenUserModal()}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-[#0B1F4B] hover:bg-[#163270] text-white font-bold flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-2xs cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#F5A623]" />
                <span>Add Team Member</span>
              </button>
            )}
          </div>

          {/* MOBILE VIEW (<768px): Stacked User Cards */}
          <div className="md:hidden space-y-3">
            {users.map((u) => {
              const isCurrent = u.id === currentUser.id;
              return (
                <div
                  key={u.id}
                  className={`p-4 rounded-xl bg-white border shadow-2xs space-y-3 text-xs ${
                    isCurrent ? 'border-[#0B1F4B] bg-amber-50/20' : 'border-slate-200'
                  } ${!u.active ? 'opacity-60 bg-slate-50' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={u.avatar}
                        alt={u.name}
                        className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-sm text-slate-900 truncate">
                            {u.name}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-200 text-amber-950">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 truncate">{u.email}</p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                        u.active
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
                          : 'bg-rose-100 text-rose-900 border-rose-200'
                      }`}
                    >
                      {u.active ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Role</span>
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
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Designation</span>
                      <span className="font-semibold text-slate-800 truncate block">{u.designation || '-'}</span>
                    </div>
                  </div>

                  {canManageUsers && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleSendPasswordReset(u.email)}
                        className="min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 cursor-pointer"
                      >
                        Reset Password
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenUserModal(u)}
                        className="min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      {!isCurrent && (
                        <button
                          type="button"
                          onClick={() => toggleUserStatus(u.id)}
                          className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 border cursor-pointer ${
                            u.active
                              ? 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {u.active ? (
                            <>
                              <Lock className="w-3.5 h-3.5" />
                              <span>Remove access</span>
                            </>
                          ) : (
                            <>
                              <Unlock className="w-3.5 h-3.5" />
                              <span>Re-enable</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* TABLET & DESKTOP VIEW (>=768px): User Table */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4 sticky-col-first">User</th>
                    <th className="py-3.5 px-4">Designation</th>
                    <th className="py-3.5 px-4">Contact Phone</th>
                    <th className="py-3.5 px-4">Role Access</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {users.map((u) => {
                    const isCurrent = u.id === currentUser.id;
                    return (
                      <tr
                        key={u.id}
                        className={`hover:bg-slate-50 ${
                          isCurrent ? 'bg-amber-50/30' : 'bg-white'
                        } ${!u.active ? 'opacity-60 bg-slate-50' : ''}`}
                      >
                        <td className="py-3 px-4 sticky-col-first">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={u.avatar}
                              alt={u.name}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900">
                                  {u.name}
                                </span>
                                {isCurrent && (
                                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-200 text-amber-950">
                                    You
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-600">{u.email}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {u.designation}
                        </td>

                        <td className="py-3 px-4 text-slate-700">{u.phone}</td>

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
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              u.active
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
                                : 'bg-rose-100 text-rose-900 border-rose-200'
                            }`}
                          >
                            {u.active ? 'Active' : 'Disabled'}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {canManageUsers && (
                              <button
                                type="button"
                                onClick={() => handleSendPasswordReset(u.email)}
                                className="min-h-[32px] px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 cursor-pointer"
                                title="Send Firebase Password Reset Email"
                              >
                                Reset Password
                              </button>
                            )}

                            {canManageUsers && (
                              <button
                                type="button"
                                onClick={() => handleOpenUserModal(u)}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                                title="Edit User"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}

                            {canManageUsers && !isCurrent && (
                              <button
                                type="button"
                                onClick={() => toggleUserStatus(u.id)}
                                className={`min-h-[32px] px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 border cursor-pointer ${
                                  u.active
                                    ? 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                }`}
                                title={
                                  u.active
                                    ? 'Remove access (sets active=false)'
                                    : 'Re-enable access (sets active=true)'
                                }
                              >
                                {u.active ? (
                                  <>
                                    <Lock className="w-3 h-3" />
                                    <span>Remove access</span>
                                  </>
                                ) : (
                                  <>
                                    <Unlock className="w-3 h-3" />
                                    <span>Re-enable</span>
                                  </>
                                )}
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
          </div>

          {/* Role Permission Table */}
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 space-y-3 shadow-2xs">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#F5A623]" />
              <span>Role Permission Matrix</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[520px]">
                <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 sticky-col-first">Capability</th>
                    <th className="py-2.5 px-3 text-center">Admin</th>
                    <th className="py-2.5 px-3 text-center">Manager</th>
                    <th className="py-2.5 px-3 text-center">HR Executive</th>
                    <th className="py-2.5 px-3 text-center">Recruiter</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  <tr>
                    <td className="py-2.5 px-3 font-semibold sticky-col-first">View Companies & Remarks Timeline</td>
                    <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">Yes (All)</td>
                    <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">Yes (All)</td>
                    <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">Yes (All)</td>
                    <td className="py-2.5 px-3 text-center text-[#0B1F4B] font-bold">Read-Only (All)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold sticky-col-first">Companies: Add, Edit, Move Section & Add Remarks</td>
                    <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">Yes</td>
                    <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">Yes</td>
                    <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">Yes</td>
                    <td className="py-2.5 px-3 text-center text-rose-700 font-semibold">No</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold sticky-col-first">View Candidates, Pipeline & Interviews</td>
                    <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">Yes (All)</td>
                    <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">Yes (All)</td>
                    <td className="py-2.5 px-3 text-center text-amber-800 font-bold">Assigned Only</td>
                    <td className="py-2.5 px-3 text-center text-amber-800 font-bold">Assigned Only</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold sticky-col-first">Create & Assign Tasks</td>
                    <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">Yes (Anyone)</td>
                    <td className="py-2.5 px-3 text-center text-rose-700 font-semibold">No</td>
                    <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">Yes (Recruiters)</td>
                    <td className="py-2.5 px-3 text-center text-rose-700 font-semibold">No</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold sticky-col-first">Delete Companies / Records (30-Day Trash & Restore)</td>
                    <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">Admin Only</td>
                    <td className="py-2.5 px-3 text-center text-rose-700 font-semibold">No</td>
                    <td className="py-2.5 px-3 text-center text-rose-700 font-semibold">No</td>
                    <td className="py-2.5 px-3 text-center text-rose-700 font-semibold">No</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold sticky-col-first">User Management & Settings</td>
                    <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">Admin Only</td>
                    <td className="py-2.5 px-3 text-center text-rose-700 font-semibold">No</td>
                    <td className="py-2.5 px-3 text-center text-rose-700 font-semibold">No</td>
                    <td className="py-2.5 px-3 text-center text-rose-700 font-semibold">No</td>
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
          className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-2xs space-y-4 text-xs max-w-3xl"
        >
          {companySaveNotice && (
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-300 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>Company details updated successfully!</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">Company Legal Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">GSTIN</label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Email</label>
              <input
                type="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Phone (+91)</label>
              <input
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Website URL</label>
              <input
                type="url"
                inputMode="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">Office Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">City & State</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">PIN Code</label>
              <input
                type="text"
                inputMode="numeric"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
              />
            </div>
          </div>
          <button
            type="submit"
            className="min-h-[44px] px-5 py-2.5 bg-[#0B1F4B] hover:bg-[#163270] text-white font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-2"
          >
            <Save className="w-4 h-4 text-[#F5A623]" />
            <span>Save Company Profile</span>
          </button>
        </form>
      )}

      {/* Tab 3: Masters */}
      {activeTab === 'masters' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 text-xs">
          {/* Skills Master */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 space-y-4 shadow-2xs">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                Candidate Skill Tags ({companySettings.availableSkills.length})
              </h3>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Skills available across candidate & job requisition forms
              </p>
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
                className="flex-1 min-h-[42px] px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900"
              />
              <button
                type="submit"
                className="min-h-[42px] px-3.5 py-1.5 rounded-lg bg-[#0B1F4B] text-white font-bold cursor-pointer"
              >
                + Add
              </button>
            </form>
            <div className="flex flex-wrap gap-1.5 max-h-64 overflow-y-auto">
              {companySettings.availableSkills.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 font-semibold"
                >
                  <span>{s}</span>
                  <button
                    type="button"
                    onClick={() =>
                      updateCompanySettings({
                        availableSkills: companySettings.availableSkills.filter((item) => item !== s),
                      })
                    }
                    className="text-slate-500 hover:text-rose-600 font-bold cursor-pointer px-1"
                    title="Remove skill"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Sources Master */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 space-y-4 shadow-2xs">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                Sourcing Channels ({companySettings.availableSources.length})
              </h3>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Channels for tracking candidate acquisition
              </p>
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
                className="flex-1 min-h-[42px] px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900"
              />
              <button
                type="submit"
                className="min-h-[42px] px-3.5 py-1.5 rounded-lg bg-[#0B1F4B] text-white font-bold cursor-pointer"
              >
                + Add
              </button>
            </form>
            <div className="flex flex-wrap gap-1.5">
              {companySettings.availableSources.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 font-semibold"
                >
                  <span>{s}</span>
                  <button
                    type="button"
                    onClick={() =>
                      updateCompanySettings({
                        availableSources: companySettings.availableSources.filter((item) => item !== s),
                      })
                    }
                    className="text-slate-500 hover:text-rose-600 font-bold cursor-pointer px-1"
                    title="Remove source"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Industries Master */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 space-y-4 shadow-2xs">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                Client Industries ({companySettings.availableIndustries.length})
              </h3>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Sectors available when onboarding corporate clients
              </p>
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
                className="flex-1 min-h-[42px] px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900"
              />
              <button
                type="submit"
                className="min-h-[42px] px-3.5 py-1.5 rounded-lg bg-[#0B1F4B] text-white font-bold cursor-pointer"
              >
                + Add
              </button>
            </form>
            <div className="flex flex-wrap gap-1.5">
              {companySettings.availableIndustries.map((ind) => (
                <span
                  key={ind}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 font-semibold"
                >
                  <span>{ind}</span>
                  <button
                    type="button"
                    onClick={() =>
                      updateCompanySettings({
                        availableIndustries: companySettings.availableIndustries.filter((item) => item !== ind),
                      })
                    }
                    className="text-slate-500 hover:text-rose-600 font-bold cursor-pointer px-1"
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
          <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#F5A623]" />
                  <span>Full CRM Data Backup (JSON)</span>
                </h3>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Persistent data service active (`src/lib/dataService.ts`)
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                PRODUCTION LIVE
              </span>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              Export all CRM records (candidates, companies across Green/Blue/Red sections, open job mandates, pipeline, interviews, tasks, and edit histories) as a portable JSON backup file.
            </p>

            <button
              type="button"
              onClick={downloadDemoData}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#0B1F4B] hover:bg-[#163270] text-white font-bold flex items-center gap-2 cursor-pointer"
            >
              <ArrowDownToLine className="w-4 h-4 text-[#F5A623]" />
              <span>Download Full Backup (JSON)</span>
            </button>
          </div>

          <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 space-y-4 shadow-2xs">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#F5A623]" />
              <span>Load Starter Data (Admin Only)</span>
            </h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Writes the starter companies (Smile India Trust, BJ Bright Enterprises, MyMoneyMantra Fintech Pvt. Ltd., and 6 In-Discussion companies) and 13 Open Job Mandates once into Firestore (only if the clients collection is empty).
            </p>
            <button
              type="button"
              disabled={isLoadingStarter || clients.length > 0}
              onClick={handleLoadStarterData}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>
                {clients.length > 0
                  ? `Starter Data Already Loaded (${clients.length} Companies)`
                  : isLoadingStarter
                  ? 'Loading starter data...'
                  : 'Load starter data'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 5: Export & Import Audit Logs (Admin only) */}
      {activeTab === 'audit_logs' && currentUser.role === 'admin' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-950">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[#0B1F4B]" />
              <p className="font-bold text-sm text-[#0B1F4B]">Data Analyst Audit Logs (Export & Import History)</p>
            </div>
            <p className="text-[11px] text-slate-700 mt-1">
              Complete administrative log of all genuine .xlsx exports and candidate/client/job spreadsheet imports, capturing user roles, timestamps (IST), record scopes, filters applied, and row-level batch outcomes.
            </p>
          </div>

          {/* Export Log Section */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ArrowUpFromLine className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-extrabold text-slate-900">Excel Export Log ({exportLogs.length})</h3>
              </div>
              <span className="text-[11px] text-slate-500">Captured at .xlsx generation</span>
            </div>

            {exportLogs.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs border border-dashed border-slate-300 rounded-xl">
                No exports have been generated in this session yet. Use &ldquo;Export to Excel&rdquo; on Candidates, Clients, Jobs, Interviews, Pipeline, or Reports.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[560px]">
                  <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-extrabold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Timestamp (IST)</th>
                      <th className="py-2.5 px-3">Exported By</th>
                      <th className="py-2.5 px-3">Module</th>
                      <th className="py-2.5 px-3">Rows</th>
                      <th className="py-2.5 px-3">Scope</th>
                      <th className="py-2.5 px-3">Filters Applied</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {exportLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">
                          {new Date(log.timestamp).toLocaleString('en-IN', {
                            timeZone: 'Asia/Kolkata',
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-900">{log.userName}</span>
                          <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold bg-slate-100 border border-slate-200 text-slate-700">
                            {log.userRole}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-[#0B1F4B]">{log.module}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{log.rowCount} rows</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              log.scope === 'all'
                                ? 'bg-purple-100 text-purple-900 border-purple-200'
                                : 'bg-blue-100 text-blue-900 border-blue-200'
                            }`}
                          >
                            {log.scope === 'all' ? 'All Accessible Records' : 'Current Filtered View'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-slate-600 max-w-xs truncate" title={log.filtersApplied || 'None'}>
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
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ArrowDownToLine className="w-4 h-4 text-[#0B1F4B]" />
                <h3 className="text-sm font-extrabold text-slate-900">Excel / CSV Import Log ({importLogs.length})</h3>
              </div>
              <span className="text-[11px] text-slate-500">Recorded after batch processing</span>
            </div>

            {importLogs.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs border border-dashed border-slate-300 rounded-xl">
                No imports logged in this session. Use &ldquo;Import from Excel / CSV&rdquo; on Candidates, Clients, or Jobs.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[560px]">
                  <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-extrabold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Timestamp (IST)</th>
                      <th className="py-2.5 px-3">Imported By</th>
                      <th className="py-2.5 px-3">Module</th>
                      <th className="py-2.5 px-3">File Name</th>
                      <th className="py-2.5 px-3 text-emerald-700">Added</th>
                      <th className="py-2.5 px-3 text-blue-700">Updated</th>
                      <th className="py-2.5 px-3 text-amber-800">Skipped</th>
                      <th className="py-2.5 px-3 text-rose-700">Failed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {importLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">
                          {new Date(log.timestamp).toLocaleString('en-IN', {
                            timeZone: 'Asia/Kolkata',
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-900">{log.userName}</span>
                          <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold bg-slate-100 border border-slate-200 text-slate-700">
                            {log.userRole}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-[#0B1F4B]">{log.module}</td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700">{log.fileName}</td>
                        <td className="py-2.5 px-3 font-bold text-emerald-700">+{log.addedCount}</td>
                        <td className="py-2.5 px-3 font-bold text-blue-700">{log.updatedCount}</td>
                        <td className="py-2.5 px-3 font-semibold text-amber-800">{log.skippedCount}</td>
                        <td className="py-2.5 px-3 font-semibold text-rose-700">{log.failedCount}</td>
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
          footer={
            <div className="flex justify-end gap-2.5 w-full">
              <button
                type="button"
                onClick={() => setReassignmentTargetUser(null)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!reassignNewUserId}
                onClick={() => {
                  if (reassignNewUserId) {
                    reassignAndResolveUser(
                      reassignmentTargetUser.user.id,
                      reassignNewUserId,
                      reassignmentTargetUser.type
                    );
                  }
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#F5A623] hover:bg-amber-500 disabled:opacity-50 text-slate-950 text-xs font-extrabold cursor-pointer"
              >
                Reassign & {reassignmentTargetUser.type === 'disable' ? 'Disable' : 'Delete'} User
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                This user currently owns candidates, job requisitions, or tasks. Please select another active team member to reassign all their active records before {reassignmentTargetUser.type}ing.
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Reassign Records To:</label>
              <select
                value={reassignNewUserId}
                onChange={(e) => setReassignNewUserId(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900"
              >
                <option value="">Select active team member...</option>
                {users
                  .filter((u) => u.id !== reassignmentTargetUser.user.id && u.active)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role.toUpperCase()})
                    </option>
                  ))}
              </select>
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
        footer={
          <div className="flex justify-end gap-2.5 w-full">
            <button
              type="button"
              onClick={() => setIsUserModalOpen(false)}
              className="min-h-[44px] px-4 py-2 border border-slate-300 bg-white font-bold text-slate-700 hover:bg-slate-50 rounded-xl text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="settings-user-form"
              disabled={isSavingUser}
              className="min-h-[44px] px-5 py-2 bg-[#0B1F4B] hover:bg-[#163270] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
            >
              {isSavingUser ? 'Creating Account...' : 'Save Team Member'}
            </button>
          </div>
        }
      >
        <form id="settings-user-form" onSubmit={handleSaveUser} className="space-y-4 text-xs">
          {userSaveError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{userSaveError}</span>
            </div>
          )}

          <div>
            <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="e.g. Anjali Sharma"
              className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Corporate Email ID *</label>
            <input
              type="email"
              inputMode="email"
              required
              disabled={!!userToEdit}
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="anjali@bjbright.com"
              className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Mobile Phone (+91)</label>
            <input
              type="tel"
              inputMode="tel"
              value={userPhone}
              onChange={(e) => setUserPhone(e.target.value)}
              placeholder="+91 98110 00000"
              className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Designation</label>
            <input
              type="text"
              value={userDesignation}
              onChange={(e) => setUserDesignation(e.target.value)}
              placeholder="e.g. Senior HR Recruiter"
              className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
            />
          </div>

          {!userToEdit && (
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Temporary Password (min 6 chars) *
              </label>
              <input
                type="text"
                required
                minLength={6}
                value={userPassword}
                onChange={(e) => setUserPassword(e.target.value)}
                placeholder="bjbright2026"
                className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
              />
            </div>
          )}

          <div>
            <label className="font-bold text-slate-700 block mb-1">Access Role</label>
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value as UserRole)}
              className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
            >
              <option value="admin">Admin (Full Access & User Control)</option>
              <option value="manager">Manager (Team View & Reports)</option>
              <option value="hr_executive">HR Executive (Sourcing & Tasks)</option>
              <option value="recruiter">Recruiter (Assigned Records Only)</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* Load Starter Data Confirmation Modal */}
      <Modal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        title="Load Starter Data"
        maxWidth="md"
        footer={
          <div className="flex justify-end gap-2.5 w-full">
            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(false)}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-700 hover:bg-slate-50 text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleLoadStarterData}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Starter Data</span>
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Load Starter Companies & Job Mandates?</p>
              <p className="mt-1 text-slate-700 leading-relaxed">
                This writes the starter companies and open job mandates once into Firestore if the clients collection is empty.
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
