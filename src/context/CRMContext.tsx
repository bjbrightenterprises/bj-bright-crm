import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Candidate,
  Client,
  JobOpening,
  PipelineItem,
  Interview,
  ActivityLogItem,
  User,
  CompanySettings,
  UserRole,
  PipelineStage,
  CandidateStatus,
  ReminderTask,
  CRMNotification,
  EditHistoryItem,
  ExportLogItem,
  ImportLogItem,
  CandidateRemark,
  ClientSection,
  ClientRemark,
  getClientSection,
  sectionToClientStatus,
  CLIENT_SECTION_LABELS,
} from '../types/crm';
import {
  INITIAL_USERS,
} from '../lib/mockData';
import { dataService } from '../lib/dataService';
import {
  FirebaseConfigOptions,
} from '../lib/firebase';

interface CRMContextType {
  currentUser: User;
  switchUser: (userId: string) => void;
  changeMyPassword: (newPassword: string) => void;
  users: User[];
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  globalSearch: string;
  setGlobalSearch: (q: string) => void;

  // Role permissions
  canManageUsers: boolean;
  canDeleteClientOrJob: boolean;
  isRecruiterOrHr: boolean;
  canCreateTasks: boolean;
  viewAllToggle: boolean;
  setViewAllToggle: (val: boolean) => void;

  // Candidates
  candidates: Candidate[];
  visibleCandidates: Candidate[];
  trashCandidates: Candidate[];
  addCandidate: (c: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt' | 'notes'>) => { success: boolean; duplicateWarning?: string; candidate?: Candidate };
  updateCandidate: (id: string, updates: Partial<Candidate>, reason?: string) => void;
  deleteCandidate: (id: string) => void; // Soft delete to trash (Admin only)
  restoreCandidate: (id: string) => void;
  addCandidateNote: (candidateId: string, text: string) => void;
  addCandidateRemark: (candidateId: string, text: string, statusChangedTo?: CandidateStatus) => void;
  deleteCandidateRemark: (candidateId: string, remarkId: string) => void;
  activeStatusRemarkModal: { candidate: Candidate; newStatus?: CandidateStatus; isStatusChange: boolean; bulkCandidateIds?: string[] } | null;
  openStatusRemarkModal: (candidate: Candidate, newStatus: CandidateStatus) => void;
  openBulkStatusRemarkModal: (candidateIds: string[], newStatus: CandidateStatus) => void;
  openAddRemarkModal: (candidate: Candidate) => void;
  closeStatusRemarkModal: () => void;
  submitStatusRemark: (text: string) => void;
  bulkImportCandidates: (newCandidates: Partial<Candidate>[]) => number;
  checkDuplicate: (phone: string, email: string, currentId?: string) => Candidate | undefined;

  // Bulk candidate actions
  bulkUpdateCandidateStatus: (candidateIds: string[], newStatus: CandidateStatus) => void;
  bulkAssignRecruiter: (candidateIds: string[], recruiterId: string, recruiterName: string) => void;
  bulkDeleteCandidates: (candidateIds: string[]) => void;

  // Clients
  clients: Client[];
  visibleClients: Client[];
  trashClients: Client[];
  addClient: (
    c: Omit<Client, 'id' | 'createdAt' | 'activeJobsCount' | 'placedCandidatesCount'>,
    initialRemark?: string
  ) => void;
  updateClient: (id: string, updates: Partial<Client>, reason: string) => void;
  moveClientSection: (
    id: string,
    targetSection: ClientSection,
    remarkText: string,
    keyDateValue: string
  ) => void;
  addClientRemark: (id: string, text: string) => void;
  deleteClient: (id: string, reason: string) => void;
  restoreClient: (id: string) => void;
  bulkImportClients: (newClients: Array<Partial<Client> & { latestRemark?: string }>) => number;

  // Jobs
  jobs: JobOpening[];
  visibleJobs: JobOpening[];
  trashJobs: JobOpening[];
  addJob: (j: Omit<JobOpening, 'id' | 'createdAt' | 'applicationsCount'>) => void;
  updateJob: (id: string, updates: Partial<JobOpening>, reason?: string) => void;
  deleteJob: (id: string) => void;
  restoreJob: (id: string) => void;
  bulkImportJobs: (newJobs: Partial<JobOpening>[]) => number;
  getMatchingCandidates: (job: JobOpening) => { candidate: Candidate; matchScore: number; matchReasons: string[] }[];

  // Candidate Import with update support
  processCandidateImport: (
    records: Array<{ isUpdate?: boolean; existingId?: string; data: Partial<Candidate> }>,
    updateReason?: string
  ) => { added: number; updated: number; skipped: number };

  // Export & Import Audit Logs
  exportLogs: ExportLogItem[];
  logExport: (module: string, rowCount: number, scope: 'filtered' | 'all', filtersApplied?: string) => void;
  importLogs: ImportLogItem[];
  logImport: (
    module: string,
    fileName: string,
    counts: { added: number; updated: number; skipped: number; failed: number }
  ) => void;

  // Pipeline
  pipeline: PipelineItem[];
  visiblePipeline: PipelineItem[];
  movePipelineStage: (id: string, newStage: PipelineStage) => void;
  addPipelineCandidate: (candidateId: string, jobId: string, stage?: PipelineStage) => void;

  // Interviews
  interviews: Interview[];
  visibleInterviews: Interview[];
  addInterview: (i: Omit<Interview, 'id'>) => void;
  updateInterview: (id: string, updates: Partial<Interview>) => void;
  deleteInterview: (id: string) => void;

  // Reminders & Tasks
  reminders: ReminderTask[];
  visibleReminders: ReminderTask[];
  completedReminders: ReminderTask[];
  addReminder: (r: Omit<ReminderTask, 'id' | 'createdAt' | 'assignedByUserId' | 'assignedByUserName'>) => ReminderTask;
  updateReminder: (id: string, updates: Partial<ReminderTask>) => void;
  deleteReminder: (id: string) => void;
  toggleReminderStatus: (id: string) => void;
  snoozeReminder: (id: string, days: number) => void;

  // Edit History
  editHistories: EditHistoryItem[];
  getEditHistory: (entityId: string) => EditHistoryItem[];

  // Notifications
  notifications: CRMNotification[];
  unreadNotificationCount: number;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;

  // Activities
  activities: ActivityLogItem[];
  logActivity: (category: ActivityLogItem['category'], action: string, details: string) => void;

  // Settings & Users
  companySettings: CompanySettings;
  updateCompanySettings: (settings: Partial<CompanySettings>) => void;
  addUser: (u: Omit<User, 'id'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  toggleUserStatus: (id: string) => void; // Disable / Enable user
  deleteUser: (id: string) => void;
  reassignmentTargetUser: { user: User; type: 'disable' | 'delete' } | null;
  setReassignmentTargetUser: (val: { user: User; type: 'disable' | 'delete' } | null) => void;
  reassignAndResolveUser: (oldUserId: string, newUserId: string, actionType: 'disable' | 'delete') => void;

  // Demo Mode & Data Controls
  isFirebaseConfigured: boolean;
  firebaseConfig: FirebaseConfigOptions | null;
  saveFirebaseSettings: (cfg: FirebaseConfigOptions) => void;
  removeFirebaseSettings: () => void;
  resetAllData: () => void;
  downloadDemoData: () => void;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export const CRMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Ensure realistic demo seed data is loaded on first run via the single dataService
  useState(() => {
    dataService.ensureSeedDataInitialized();
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return dataService.getTheme() === 'dark';
  });

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      dataService.setTheme(next ? 'dark' : 'light');
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const [globalSearch, setGlobalSearch] = useState('');

  const [users, setUsers] = useState<User[]>(() => dataService.getUsers());
  const [currentUserId, setCurrentUserId] = useState<string>(() => dataService.getSessionUserId());

  const currentUser = useMemo(() => {
    const found = users.find((u) => u.id === currentUserId);
    if (found && !found.active) {
      const activeUser = users.find((u) => u.active) || users[0];
      return activeUser;
    }
    return found || users[0] || INITIAL_USERS[0];
  }, [users, currentUserId]);

  const switchUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target && !target.active) {
      return;
    }
    setCurrentUserId(userId);
    dataService.setSessionUserId(userId);
    if (target) {
      logActivity(
        'system',
        'User Signed In',
        `Signed in as ${target.name} (${target.role.toUpperCase()})`
      );
    }
  };

  const changeMyPassword = (newPassword: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, password: newPassword } : u))
    );
    logActivity('system', 'Password Updated', `${currentUser.name} updated their account password`);
  };

  const [candidates, setCandidates] = useState<Candidate[]>(() => dataService.getCandidates());
  const [clients, setClients] = useState<Client[]>(() => dataService.getClients());
  const [jobs, setJobs] = useState<JobOpening[]>(() => dataService.getJobs());
  const [pipeline, setPipeline] = useState<PipelineItem[]>(() => dataService.getPipeline());
  const [interviews, setInterviews] = useState<Interview[]>(() => dataService.getInterviews());
  const [activities, setActivities] = useState<ActivityLogItem[]>(() => dataService.getActivities());
  const [companySettings, setCompanySettings] = useState<CompanySettings>(() =>
    dataService.getCompanySettings()
  );
  const [reminders, setReminders] = useState<ReminderTask[]>(() => dataService.getReminders());
  const [editHistories, setEditHistories] = useState<EditHistoryItem[]>(() =>
    dataService.getEditHistories()
  );
  const [readNotifIds, setReadNotifIds] = useState<string[]>(() => dataService.getReadNotifIds());
  const [exportLogs, setExportLogs] = useState<ExportLogItem[]>(() => dataService.getExportLogs());
  const [importLogs, setImportLogs] = useState<ImportLogItem[]>(() => dataService.getImportLogs());

  const [reassignmentTargetUser, setReassignmentTargetUser] = useState<{ user: User; type: 'disable' | 'delete' } | null>(null);

  const [firebaseConfig] = useState<FirebaseConfigOptions | null>(null);
  const [isFirebaseConfigured] = useState<boolean>(false);

  const [viewAllToggle, setViewAllToggle] = useState<boolean>(false);

  // Persist all changes via the single dataService
  useEffect(() => {
    dataService.saveUsers(users);
  }, [users]);
  useEffect(() => {
    dataService.saveCandidates(candidates);
  }, [candidates]);
  useEffect(() => {
    dataService.saveClients(clients);
  }, [clients]);
  useEffect(() => {
    dataService.saveJobs(jobs);
  }, [jobs]);
  useEffect(() => {
    dataService.savePipeline(pipeline);
  }, [pipeline]);
  useEffect(() => {
    dataService.saveInterviews(interviews);
  }, [interviews]);
  useEffect(() => {
    dataService.saveActivities(activities);
  }, [activities]);
  useEffect(() => {
    dataService.saveCompanySettings(companySettings);
  }, [companySettings]);
  useEffect(() => {
    dataService.saveReminders(reminders);
  }, [reminders]);
  useEffect(() => {
    dataService.saveEditHistories(editHistories);
  }, [editHistories]);
  useEffect(() => {
    dataService.saveReadNotifIds(readNotifIds);
  }, [readNotifIds]);
  useEffect(() => {
    dataService.saveExportLogs(exportLogs);
  }, [exportLogs]);
  useEffect(() => {
    dataService.saveImportLogs(importLogs);
  }, [importLogs]);

  // Permissions
  const canManageUsers = currentUser.role === 'admin';
  const canDeleteClientOrJob = currentUser.role === 'admin';
  const isRecruiterOrHr = currentUser.role === 'recruiter' || currentUser.role === 'hr_executive';
  const canCreateTasks = currentUser.role === 'admin' || currentUser.role === 'hr_executive';

  // Scoped lists (excluding soft-deleted / trash)
  const activeCandidates = useMemo(() => candidates.filter((c) => !c.deletedAt), [candidates]);
  const activeClients = useMemo(() => clients.filter((c) => !c.deletedAt), [clients]);
  const activeJobs = useMemo(() => jobs.filter((j) => !j.deletedAt), [jobs]);

  const trashCandidates = useMemo(() => candidates.filter((c) => c.deletedAt), [candidates]);
  const trashClients = useMemo(() => {
    const thirtyDaysAgo = Date.now() - 30 * 86400000;
    return clients.filter((c) => {
      if (!c.deletedAt) return false;
      const delTime = new Date(c.deletedAt).getTime();
      return isNaN(delTime) || delTime >= thirtyDaysAgo;
    });
  }, [clients]);
  const trashJobs = useMemo(() => jobs.filter((j) => j.deletedAt), [jobs]);

  const visibleCandidates = useMemo(() => {
    if (currentUser.role === 'admin' || currentUser.role === 'manager' || viewAllToggle) {
      return activeCandidates;
    }
    return activeCandidates.filter((c) => c.assignedRecruiterId === currentUser.id);
  }, [activeCandidates, currentUser, viewAllToggle]);

  const visibleClients = useMemo(() => {
    return activeClients;
  }, [activeClients]);

  const visibleJobs = useMemo(() => {
    return activeJobs;
  }, [activeJobs]);

  const visiblePipeline = useMemo(() => {
    if (currentUser.role === 'admin' || currentUser.role === 'manager' || viewAllToggle) {
      return pipeline;
    }
    return pipeline.filter((p) => p.assignedRecruiterId === currentUser.id);
  }, [pipeline, currentUser, viewAllToggle]);

  const visibleInterviews = useMemo(() => {
    if (currentUser.role === 'admin' || currentUser.role === 'manager' || viewAllToggle) {
      return interviews;
    }
    return interviews.filter((i) => i.assignedToRecruiterId === currentUser.id);
  }, [interviews, currentUser, viewAllToggle]);

  const activeReminders = useMemo(() => reminders.filter((r) => r.status === 'Pending'), [reminders]);
  const completedReminders = useMemo(() => reminders.filter((r) => r.status === 'Completed'), [reminders]);

  const visibleReminders = useMemo(() => {
    if (currentUser.role === 'admin' || viewAllToggle) {
      return activeReminders;
    }
    if (currentUser.role === 'hr_executive') {
      return activeReminders.filter((r) => r.assignedToUserId === currentUser.id || r.assignedByUserId === currentUser.id);
    }
    return activeReminders.filter((r) => r.assignedToUserId === currentUser.id);
  }, [activeReminders, currentUser, viewAllToggle]);

  const logActivity = (category: ActivityLogItem['category'], action: string, details: string) => {
    const newAct: ActivityLogItem = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action,
      details,
      timestamp: new Date().toISOString(),
      category: category || 'system',
    };
    setActivities((prev) => [newAct, ...prev]);
  };

  const logExport = (
    module: string,
    rowCount: number,
    scope: 'filtered' | 'all',
    filtersApplied?: string
  ) => {
    const item: ExportLogItem = {
      id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      module,
      rowCount,
      scope,
      filtersApplied,
      timestamp: new Date().toISOString(),
    };
    setExportLogs((prev) => [item, ...prev]);
    logActivity('system', 'Excel Export', `Exported ${rowCount} records from ${module} (${scope})`);
  };

  const logImport = (
    module: string,
    fileName: string,
    counts: { added: number; updated: number; skipped: number; failed: number }
  ) => {
    const item: ImportLogItem = {
      id: `imp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      module,
      fileName,
      addedCount: counts.added,
      updatedCount: counts.updated,
      skippedCount: counts.skipped,
      failedCount: counts.failed,
      timestamp: new Date().toISOString(),
    };
    setImportLogs((prev) => [item, ...prev]);
    logActivity(
      'system',
      'Excel Import',
      `Imported into ${module} from ${fileName}: ${counts.added} added, ${counts.updated} updated, ${counts.skipped} skipped, ${counts.failed} failed`
    );
  };

  const addEditHistory = (
    entityId: string,
    entityType: 'candidate' | 'client' | 'job',
    reason: string,
    changes: { field: string; oldValue: any; newValue: any }[]
  ) => {
    const item: EditHistoryItem = {
      id: `eh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      entityId,
      entityType,
      editedByUserId: currentUser.id,
      editedByUserName: currentUser.name,
      editedByUserRole: currentUser.role,
      timestamp: new Date().toISOString(),
      reason,
      changes,
    };
    setEditHistories((prev) => [item, ...prev]);
  };

  const getEditHistory = (entityId: string) => {
    return editHistories.filter((eh) => eh.entityId === entityId);
  };

  // Candidate Actions
  const checkDuplicate = (phone: string, email: string, currentId?: string) => {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const cleanEmail = email.trim().toLowerCase();

    return activeCandidates.find((c) => {
      if (currentId && c.id === currentId) return false;
      const cPhone = c.phone.replace(/\D/g, '').slice(-10);
      const cEmail = c.email.trim().toLowerCase();
      return (cleanPhone && cPhone === cleanPhone) || (cleanEmail && cEmail === cleanEmail);
    });
  };

  const addCandidate = (c: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt' | 'notes'>) => {
    const newCand: Candidate = {
      ...c,
      id: `cand_${Date.now()}`,
      notes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCandidates((prev) => [newCand, ...prev]);
    logActivity('candidate', 'Candidate Added', `Added candidate ${newCand.fullName} (${newCand.phone})`);
    return { success: true, candidate: newCand };
  };

  const updateCandidate = (id: string, updates: Partial<Candidate>, reason = 'Candidate updated details') => {
    const old = candidates.find((c) => c.id === id);
    if (!old) return;

    const changes: { field: string; oldValue: any; newValue: any }[] = [];
    Object.keys(updates).forEach((key) => {
      const k = key as keyof Candidate;
      if (JSON.stringify(old[k]) !== JSON.stringify(updates[k])) {
        changes.push({
          field: k,
          oldValue: old[k],
          newValue: updates[k],
        });
      }
    });

    if (changes.length > 0) {
      addEditHistory(id, 'candidate', reason || 'Candidate updated details', changes);
    }

    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c))
    );
    logActivity('candidate', 'Candidate Updated', `Updated profile for ${old.fullName}. Reason: ${reason}`);
  };

  const deleteCandidate = (id: string) => {
    if (currentUser.role !== 'admin') {
      alert('Access Restricted: Only Admin can delete records.');
      return;
    }
    const target = candidates.find((c) => c.id === id);
    setCandidates((prev) => prev.map((c) => (c.id === id ? { ...c, deletedAt: new Date().toISOString() } : c)));
    logActivity('candidate', 'Candidate Moved to Trash', `Moved candidate ${target?.fullName || id} to Trash`);
  };

  const restoreCandidate = (id: string) => {
    if (currentUser.role !== 'admin') return;
    setCandidates((prev) => prev.map((c) => (c.id === id ? { ...c, deletedAt: undefined } : c)));
    logActivity('candidate', 'Candidate Restored', `Restored candidate ID ${id} from Trash`);
  };

  const addCandidateNote = (candidateId: string, text: string) => {
    const note = {
      id: `not_${Date.now()}`,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      text,
      createdAt: new Date().toISOString(),
    };

    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, notes: [note, ...c.notes], updatedAt: new Date().toISOString() } : c))
    );
    logActivity('candidate', 'Note Added', `Added note on candidate profile`);
  };

  const [activeStatusRemarkModal, setActiveStatusRemarkModal] = useState<{
    candidate: Candidate;
    newStatus?: CandidateStatus;
    isStatusChange: boolean;
    bulkCandidateIds?: string[];
  } | null>(null);

  const openStatusRemarkModal = (candidate: Candidate, newStatus: CandidateStatus) => {
    if (candidate.status === newStatus) return;
    setActiveStatusRemarkModal({
      candidate,
      newStatus,
      isStatusChange: true,
    });
  };

  const openBulkStatusRemarkModal = (candidateIds: string[], newStatus: CandidateStatus) => {
    const firstCand = candidates.find((c) => candidateIds.includes(c.id));
    if (!firstCand) return;
    setActiveStatusRemarkModal({
      candidate: {
        ...firstCand,
        fullName: candidateIds.length > 1 ? `${candidateIds.length} Selected Candidates` : firstCand.fullName,
      },
      newStatus,
      isStatusChange: true,
      bulkCandidateIds: candidateIds,
    });
  };

  const openAddRemarkModal = (candidate: Candidate) => {
    setActiveStatusRemarkModal({
      candidate,
      isStatusChange: false,
    });
  };

  const closeStatusRemarkModal = () => {
    setActiveStatusRemarkModal(null);
  };

  const addCandidateRemark = (candidateId: string, text: string, statusChangedTo?: CandidateStatus) => {
    const remark: CandidateRemark = {
      id: `remk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      candidateId,
      statusChangedTo,
      text: text.trim() || (statusChangedTo ? `Status changed to ${statusChangedTo}` : 'General remark'),
      authorUserId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      createdAt: new Date().toISOString(),
    };

    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id === candidateId) {
          const existingRemarks = c.remarks || [];
          return {
            ...c,
            ...(statusChangedTo ? { status: statusChangedTo } : {}),
            remarks: [remark, ...existingRemarks],
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      })
    );
    logActivity(
      'candidate',
      statusChangedTo ? 'Status Changed & Remark Logged' : 'Remark Logged',
      `Remark added for candidate${statusChangedTo ? ` (Status: ${statusChangedTo})` : ''}`
    );
  };

  const deleteCandidateRemark = (candidateId: string, remarkId: string) => {
    if (currentUser.role !== 'admin') return;
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id === candidateId && c.remarks) {
          return {
            ...c,
            remarks: c.remarks.filter((r) => r.id !== remarkId),
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      })
    );
    logActivity('candidate', 'Remark Deleted', `Deleted remark ID ${remarkId} for candidate ${candidateId}`);
  };

  const submitStatusRemark = (text: string) => {
    if (!activeStatusRemarkModal) return;
    const { candidate, newStatus, isStatusChange, bulkCandidateIds } = activeStatusRemarkModal;

    if (bulkCandidateIds && bulkCandidateIds.length > 0 && newStatus) {
      const idSet = new Set(bulkCandidateIds);
      const nowIso = new Date().toISOString();
      setCandidates((prev) =>
        prev.map((c) => {
          if (idSet.has(c.id)) {
            const rem: CandidateRemark = {
              id: `remk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              candidateId: c.id,
              statusChangedTo: newStatus,
              text: text.trim() || `Bulk status updated to ${newStatus}`,
              authorUserId: currentUser.id,
              authorName: currentUser.name,
              authorRole: currentUser.role,
              createdAt: nowIso,
            };
            return {
              ...c,
              status: newStatus,
              remarks: [rem, ...(c.remarks || [])],
              updatedAt: nowIso,
            };
          }
          return c;
        })
      );
      logActivity('candidate', 'Bulk Status Update & Remarks', `Updated ${bulkCandidateIds.length} candidates to ${newStatus}`);
    } else if (isStatusChange && newStatus) {
      addCandidateRemark(candidate.id, text, newStatus);
    } else {
      addCandidateRemark(candidate.id, text);
    }
    setActiveStatusRemarkModal(null);
  };

  const bulkUpdateCandidateStatus = (candidateIds: string[], newStatus: CandidateStatus) => {
    openBulkStatusRemarkModal(candidateIds, newStatus);
  };

  const bulkAssignRecruiter = (candidateIds: string[], recruiterId: string, recruiterName: string) => {
    const idSet = new Set(candidateIds);
    setCandidates((prev) =>
      prev.map((c) =>
        idSet.has(c.id)
          ? { ...c, assignedRecruiterId: recruiterId, assignedRecruiterName: recruiterName, updatedAt: new Date().toISOString() }
          : c
      )
    );
    logActivity('candidate', 'Bulk Reassignment', `Reassigned ${candidateIds.length} candidates to ${recruiterName}`);
  };

  const bulkDeleteCandidates = (candidateIds: string[]) => {
    if (currentUser.role !== 'admin') {
      alert('Access Restricted: Only Admin can delete records.');
      return;
    }
    const idSet = new Set(candidateIds);
    setCandidates((prev) => prev.map((c) => (idSet.has(c.id) ? { ...c, deletedAt: new Date().toISOString() } : c)));
    logActivity('candidate', 'Bulk Trash', `Moved ${candidateIds.length} candidates to Trash`);
  };

  const bulkImportCandidates = (newItems: Partial<Candidate>[]): number => {
    let imported = 0;
    const toAdd: Candidate[] = [];

    newItems.forEach((item) => {
      if (item.fullName && (item.phone || item.email)) {
        toAdd.push({
          id: `cand_bulk_${Date.now()}_${imported}`,
          fullName: item.fullName,
          phone: item.phone || '+91 98000 00000',
          email: item.email || `imported_${Date.now()}_${imported}@example.com`,
          city: item.city || 'Noida',
          currentCompany: item.currentCompany || 'Confidential',
          currentSalaryLPA: Number(item.currentSalaryLPA) || 6.0,
          expectedSalaryLPA: Number(item.expectedSalaryLPA) || 8.5,
          experienceYears: Number(item.experienceYears) || 3,
          skills: Array.isArray(item.skills) ? item.skills : ['IT Support'],
          education: item.education || 'Graduate',
          source: (item.source as any) || 'Naukri',
          assignedRecruiterId: currentUser.id,
          assignedRecruiterName: currentUser.name,
          status: (item.status as any) || 'New',
          notes: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        imported++;
      }
    });

    if (toAdd.length > 0) {
      setCandidates((prev) => [...toAdd, ...prev]);
      logActivity('candidate', 'Bulk CSV Imported', `Imported ${imported} candidates`);
    }
    return imported;
  };

  const processCandidateImport = (
    records: Array<{
      isUpdate?: boolean;
      existingId?: string;
      data: Partial<Candidate>;
    }>,
    updateReason = 'Bulk update via Excel import'
  ): { added: number; updated: number; skipped: number } => {
    let added = 0;
    let updated = 0;
    let skipped = 0;

    const newCandidates: Candidate[] = [];
    const updatesMap = new Map<string, Partial<Candidate>>();

    records.forEach((r) => {
      if (r.isUpdate && r.existingId) {
        updatesMap.set(r.existingId, r.data);
        updated++;
      } else if (!r.isUpdate && r.data.fullName && (r.data.phone || r.data.email)) {
        // Recruiter and HR can only import candidates assigned to themselves
        const assignedId =
          currentUser.role === 'recruiter' || currentUser.role === 'hr_executive'
            ? currentUser.id
            : r.data.assignedRecruiterId || currentUser.id;
        const assignedName =
          currentUser.role === 'recruiter' || currentUser.role === 'hr_executive'
            ? currentUser.name
            : r.data.assignedRecruiterName || currentUser.name;

        newCandidates.push({
          id: `cand_bulk_${Date.now()}_${added}`,
          fullName: r.data.fullName.trim(),
          phone: r.data.phone ? r.data.phone.trim() : '+91 98000 00000',
          email: r.data.email
            ? r.data.email.trim().toLowerCase()
            : `imported_${Date.now()}_${added}@example.com`,
          city: r.data.city ? r.data.city.trim() : 'Noida',
          currentCompany: r.data.currentCompany ? r.data.currentCompany.trim() : 'Confidential',
          currentSalaryLPA: Number(r.data.currentSalaryLPA) || 6.0,
          expectedSalaryLPA: Number(r.data.expectedSalaryLPA) || 8.5,
          experienceYears: Number(r.data.experienceYears) || 3,
          skills: Array.isArray(r.data.skills)
            ? r.data.skills
            : r.data.skills
            ? String(r.data.skills)
                .split(';')
                .map((s) => s.trim())
            : ['IT'],
          education: r.data.education ? r.data.education.trim() : 'Graduate',
          source: (r.data.source as any) || 'Naukri',
          assignedRecruiterId: assignedId,
          assignedRecruiterName: assignedName,
          status: (r.data.status as any) || 'New',
          jobTitle: r.data.jobTitle,
          clientName: r.data.clientName,
          expectedJoiningDate: r.data.expectedJoiningDate,
          notes: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        added++;
      } else {
        skipped++;
      }
    });

    if (updatesMap.size > 0) {
      setCandidates((prev) =>
        prev.map((c) => {
          if (updatesMap.has(c.id)) {
            const updates = updatesMap.get(c.id)!;
            const changes: { field: string; oldValue: any; newValue: any }[] = [];
            Object.keys(updates).forEach((k) => {
              const key = k as keyof Candidate;
              if (JSON.stringify(c[key]) !== JSON.stringify(updates[key])) {
                changes.push({ field: key, oldValue: c[key], newValue: updates[key] });
              }
            });
            if (changes.length > 0) {
              addEditHistory(c.id, 'candidate', updateReason, changes);
            }
            return { ...c, ...updates, updatedAt: new Date().toISOString() };
          }
          return c;
        })
      );
    }

    if (newCandidates.length > 0) {
      setCandidates((prev) => [...newCandidates, ...prev]);
    }

    logActivity(
      'candidate',
      'Excel Bulk Import',
      `Processed candidate import: ${added} added, ${updated} updated, ${skipped} skipped`
    );
    return { added, updated, skipped };
  };

  // Client Actions (Admin, Manager, HR Executive for create, update, move, remark, import; Admin only for delete & restore)
  const canManageClients =
    currentUser.role === 'admin' ||
    currentUser.role === 'manager' ||
    currentUser.role === 'hr_executive';

  const addClient = (
    c: Omit<Client, 'id' | 'createdAt' | 'activeJobsCount' | 'placedCandidatesCount'>,
    initialRemark?: string
  ) => {
    if (!canManageClients) return;
    const nowIso = new Date().toISOString();
    const clientId = `cli_${Date.now()}`;
    const sec: ClientSection = c.section || getClientSection(c);
    const trimmedRemark = (initialRemark || '').trim();
    const initialRemarksList: ClientRemark[] =
      trimmedRemark.length >= 3
        ? [
            {
              id: `crem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              clientId,
              section: sec,
              text: trimmedRemark,
              authorUserId: currentUser.id,
              authorName: currentUser.name,
              authorRole: currentUser.role,
              createdAt: nowIso,
            },
          ]
        : c.remarks || [];

    const newClient: Client = {
      ...c,
      id: clientId,
      name: c.name.trim(),
      city: c.city.trim(),
      address: c.address.trim(),
      website: c.website.trim(),
      paymentTerms: c.paymentTerms.trim(),
      section: sec,
      status: sectionToClientStatus(sec),
      remarks: initialRemarksList,
      createdAt: nowIso,
      updatedAt: nowIso,
      activeJobsCount: 0,
      placedCandidatesCount: 0,
    };
    setClients((prev) => [newClient, ...prev]);
    logActivity(
      'client',
      'Client Onboarded',
      `Added client company: ${newClient.name} (${CLIENT_SECTION_LABELS[sec]})`
    );
  };

  const updateClient = (id: string, updates: Partial<Client>, reason: string) => {
    if (!canManageClients) return;
    const trimmedReason = (reason || '').trim();
    if (trimmedReason.length < 10) return;

    const old = clients.find((c) => c.id === id);
    if (!old) return;

    const nextSection: ClientSection = updates.section || old.section || getClientSection(old);
    const normalizedUpdates: Partial<Client> = {
      ...updates,
      section: nextSection,
      status: sectionToClientStatus(nextSection),
      updatedAt: new Date().toISOString(),
    };

    const changes: { field: string; oldValue: any; newValue: any }[] = [];
    Object.keys(normalizedUpdates).forEach((key) => {
      if (key === 'updatedAt' || key === 'status') return;
      const k = key as keyof Client;
      if (JSON.stringify(old[k]) !== JSON.stringify(normalizedUpdates[k])) {
        changes.push({ field: k, oldValue: old[k], newValue: normalizedUpdates[k] });
      }
    });
    if (changes.length > 0) {
      addEditHistory(id, 'client', trimmedReason, changes);
    }

    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...normalizedUpdates } : c)));

    // Keep linked jobs & candidates company name in sync if company name was edited
    if (normalizedUpdates.name && normalizedUpdates.name !== old.name) {
      const newName = normalizedUpdates.name;
      setJobs((prev) =>
        prev.map((j) => (j.clientId === id ? { ...j, clientName: newName } : j))
      );
      setCandidates((prev) =>
        prev.map((cand) =>
          cand.clientId === id || cand.clientName === old.name
            ? { ...cand, clientName: newName }
            : cand
        )
      );
      setPipeline((prev) =>
        prev.map((p) => (p.clientId === id ? { ...p, clientName: newName } : p))
      );
      setInterviews((prev) =>
        prev.map((i) => (i.clientId === id ? { ...i, clientName: newName } : i))
      );
    }

    logActivity('client', 'Client Updated', `Updated client ${old.name}. Reason: ${trimmedReason}`);
  };

  const moveClientSection = (
    id: string,
    targetSection: ClientSection,
    remarkText: string,
    keyDateValue: string
  ) => {
    if (!canManageClients) return;
    const trimmedRemark = remarkText.trim();
    if (trimmedRemark.length < 3 || !keyDateValue) return;

    const old = clients.find((c) => c.id === id);
    if (!old) return;

    const oldSection = getClientSection(old);
    const nowIso = new Date().toISOString();

    const newRemark: ClientRemark = {
      id: `crem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      clientId: id,
      section: targetSection,
      text: trimmedRemark,
      authorUserId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      createdAt: nowIso,
    };

    const dateUpdates: Partial<Client> =
      targetSection === 'Green'
        ? { agreementSignedDate: keyDateValue }
        : targetSection === 'Blue'
        ? { lastContactedDate: keyDateValue }
        : { enquiryDate: keyDateValue };

    if (oldSection !== targetSection) {
      addEditHistory(id, 'client', `Moved section: ${trimmedRemark}`, [
        {
          field: 'section',
          oldValue: `${oldSection} (${CLIENT_SECTION_LABELS[oldSection]})`,
          newValue: `${targetSection} (${CLIENT_SECTION_LABELS[targetSection]})`,
        },
      ]);
    }

    setClients((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        return {
          ...c,
          ...dateUpdates,
          section: targetSection,
          status: sectionToClientStatus(targetSection),
          remarks: [newRemark, ...(c.remarks || [])],
          updatedAt: nowIso,
        };
      })
    );

    logActivity(
      'client',
      'Client Section Moved',
      `Moved ${old.name} to ${CLIENT_SECTION_LABELS[targetSection]}. Remark: ${trimmedRemark}`
    );
  };

  const addClientRemark = (id: string, text: string) => {
    if (!canManageClients) return;
    const trimmed = text.trim();
    if (trimmed.length < 3 || trimmed.length > 500) return;

    const target = clients.find((c) => c.id === id);
    if (!target) return;

    const sec = getClientSection(target);
    const nowIso = new Date().toISOString();
    const newRemark: ClientRemark = {
      id: `crem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      clientId: id,
      section: sec,
      text: trimmed,
      authorUserId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      createdAt: nowIso,
    };

    setClients((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              remarks: [newRemark, ...(c.remarks || [])],
              updatedAt: nowIso,
            }
          : c
      )
    );
    logActivity('client', 'Client Remark Added', `Added remark on ${target.name}`);
  };

  const deleteClient = (id: string, reason: string) => {
    if (currentUser.role !== 'admin') return;
    const trimmedReason = (reason || '').trim();
    if (trimmedReason.length < 3) return;

    const target = clients.find((c) => c.id === id);
    if (!target) return;

    const sec = getClientSection(target);
    const nowIso = new Date().toISOString();
    const deleteRemark: ClientRemark = {
      id: `crem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      clientId: id,
      section: sec,
      text: `[Moved to Trash] ${trimmedReason}`,
      authorUserId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      createdAt: nowIso,
    };

    setClients((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              deletedAt: nowIso,
              deleteReason: trimmedReason,
              remarks: [deleteRemark, ...(c.remarks || [])],
              updatedAt: nowIso,
            }
          : c
      )
    );
    logActivity(
      'client',
      'Client Moved to Trash',
      `Moved client ${target.name} to Trash (30 days). Reason: ${trimmedReason}`
    );
  };

  const restoreClient = (id: string) => {
    if (currentUser.role !== 'admin') return;
    const target = clients.find((c) => c.id === id);
    setClients((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, deletedAt: undefined, deleteReason: undefined, updatedAt: new Date().toISOString() }
          : c
      )
    );
    logActivity('client', 'Client Restored', `Restored client ${target?.name || id} from Trash`);
  };

  const bulkImportClients = (newItems: Array<Partial<Client> & { latestRemark?: string }>): number => {
    if (!canManageClients) return 0;
    let imported = 0;
    const toAdd: Client[] = [];
    const seenNames = new Set(clients.map((c) => c.name.trim().toLowerCase()));
    const todayStr = new Date().toISOString().slice(0, 10);

    newItems.forEach((item) => {
      const cleanName = (item.name || '').trim();
      if (cleanName && !seenNames.has(cleanName.toLowerCase())) {
        seenNames.add(cleanName.toLowerCase());
        const clientId = `cli_bulk_${Date.now()}_${imported}`;
        const rawSec = String(item.section || item.status || 'Green').trim().toLowerCase();
        let sec: ClientSection = 'Green';
        if (rawSec.includes('blue') || rawSec.includes('discussion') || rawSec.includes('prospect')) {
          sec = 'Blue';
        } else if (rawSec.includes('red') || rawSec.includes('enquir') || rawSec.includes('inactive')) {
          sec = 'Red';
        }

        const nowIso = new Date().toISOString();
        const remarkStr = (item.latestRemark || '').trim();
        const remarksList: ClientRemark[] =
          remarkStr.length >= 3
            ? [
                {
                  id: `crem_bulk_${Date.now()}_${imported}`,
                  clientId,
                  section: sec,
                  text: remarkStr.slice(0, 500),
                  authorUserId: currentUser.id,
                  authorName: currentUser.name,
                  authorRole: currentUser.role,
                  createdAt: nowIso,
                },
              ]
            : [];

        toAdd.push({
          id: clientId,
          name: cleanName,
          industry: (item.industry || 'Information Technology & Services').trim(),
          address: (item.address || 'Corporate Office').trim(),
          city: (item.city || 'Noida').trim(),
          website: (item.website || 'https://example.com').trim(),
          contactPersons: item.contactPersons || [
            {
              id: `cp_${Date.now()}_${imported}`,
              name: 'HR Head',
              designation: 'HR Manager',
              phone: '+91 98110 00000',
              email: 'hr@example.com',
            },
          ],
          agreementDetails: (item.agreementDetails || 'Standard SLA').trim(),
          commissionPercent: Number(item.commissionPercent) || 8.33,
          paymentTerms: (item.paymentTerms || '30 days net').trim(),
          section: sec,
          status: sectionToClientStatus(sec),
          enquiryDate: item.enquiryDate || todayStr,
          lastContactedDate: item.lastContactedDate || (sec !== 'Red' ? todayStr : undefined),
          nextFollowUpDate: item.nextFollowUpDate || undefined,
          agreementSignedDate: item.agreementSignedDate || (sec === 'Green' ? todayStr : undefined),
          remarks: remarksList,
          createdAt: nowIso,
          updatedAt: nowIso,
          assignedAccountManagerId: currentUser.id,
          assignedAccountManagerName: currentUser.name,
          activeJobsCount: 0,
          placedCandidatesCount: 0,
        });
        imported++;
      }
    });
    if (toAdd.length > 0) {
      setClients((prev) => [...toAdd, ...prev]);
      logActivity('client', 'Bulk Clients Imported', `Imported ${imported} clients`);
    }
    return imported;
  };

  // Job Actions
  const addJob = (j: Omit<JobOpening, 'id' | 'createdAt' | 'applicationsCount'>) => {
    const newJob: JobOpening = {
      ...j,
      id: `job_${Date.now()}`,
      createdAt: new Date().toISOString(),
      applicationsCount: 0,
    };
    setJobs((prev) => [newJob, ...prev]);
    setClients((prev) =>
      prev.map((c) => (c.id === j.clientId ? { ...c, activeJobsCount: (c.activeJobsCount || 0) + 1 } : c))
    );
    logActivity('job', 'Job Created', `Created requisition: ${j.title} for ${j.clientName}`);
  };

  const updateJob = (id: string, updates: Partial<JobOpening>, reason = 'Job requisition updated') => {
    const old = jobs.find((j) => j.id === id);
    if (!old) return;

    const changes: { field: string; oldValue: any; newValue: any }[] = [];
    Object.keys(updates).forEach((key) => {
      const k = key as keyof JobOpening;
      if (JSON.stringify(old[k]) !== JSON.stringify(updates[k])) {
        changes.push({ field: k, oldValue: old[k], newValue: updates[k] });
      }
    });
    if (changes.length > 0) {
      addEditHistory(id, 'job', reason || 'Job requisition updated', changes);
    }

    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...updates } : j)));
    logActivity('job', 'Job Updated', `Updated requisition ${old.title}. Reason: ${reason}`);
  };

  const deleteJob = (id: string) => {
    if (currentUser.role !== 'admin') {
      alert('Access Restricted: Only Admin can delete records.');
      return;
    }
    const target = jobs.find((j) => j.id === id);
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, deletedAt: new Date().toISOString() } : j)));
    logActivity('job', 'Job Moved to Trash', `Moved job ${target?.title || id} to Trash`);
  };

  const restoreJob = (id: string) => {
    if (currentUser.role !== 'admin') return;
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, deletedAt: undefined } : j)));
    logActivity('job', 'Job Restored', `Restored job ID ${id}`);
  };

  const bulkImportJobs = (newItems: Partial<JobOpening>[]): number => {
    let imported = 0;
    const toAdd: JobOpening[] = [];
    newItems.forEach((item) => {
      if (item.title && (item.clientName || item.clientId)) {
        const matchedClient = clients.find(
          (c) => c.name.toLowerCase() === (item.clientName || '').toLowerCase()
        );
        toAdd.push({
          id: `job_bulk_${Date.now()}_${imported}`,
          title: item.title.trim(),
          clientId: matchedClient?.id || item.clientId || 'cli_tcs',
          clientName: item.clientName ? item.clientName.trim() : matchedClient?.name || 'Corporate Client',
          location: item.location ? item.location.trim() : 'Noida',
          positions: Number(item.positions) || 1,
          salaryMinLPA: Number(item.salaryMinLPA) || 6.0,
          salaryMaxLPA: Number(item.salaryMaxLPA) || 12.0,
          minExpYears: Number(item.minExpYears) || 2,
          maxExpYears: Number(item.maxExpYears) || 6,
          skillsRequired: Array.isArray(item.skillsRequired)
            ? item.skillsRequired
            : item.skillsRequired
            ? String(item.skillsRequired)
                .split(';')
                .map((s) => s.trim())
            : ['General IT'],
          description:
            item.description || `Requisition for ${item.title} at ${item.clientName || 'Partner'}`,
          deadline:
            item.deadline ||
            new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          priority: (item.priority as any) || 'Medium',
          status: (item.status as any) || 'Open',
          assignedRecruiterIds: [currentUser.id],
          assignedRecruiterNames: [currentUser.name],
          createdAt: new Date().toISOString(),
          applicationsCount: 0,
        });
        imported++;
      }
    });

    if (toAdd.length > 0) {
      setJobs((prev) => [...toAdd, ...prev]);
      logActivity('job', 'Bulk Jobs Imported', `Imported ${imported} job requisitions`);
    }
    return imported;
  };

  const getMatchingCandidates = (job: JobOpening) => {
    return candidates
      .filter((c) => !c.deletedAt)
      .map((c) => {
        let score = 0;
        const reasons: string[] = [];
        if (c.experienceYears >= job.minExpYears && c.experienceYears <= job.maxExpYears + 2) {
          score += 35;
          reasons.push(`${c.experienceYears} yrs experience fits req`);
        } else if (c.experienceYears >= job.minExpYears) {
          score += 20;
          reasons.push(`${c.experienceYears} yrs experience`);
        }
        const matchingSkills = c.skills.filter((s) =>
          job.skillsRequired.some((req) => req.toLowerCase() === s.toLowerCase())
        );
        if (job.skillsRequired.length > 0) {
          const skillScore = Math.round((matchingSkills.length / job.skillsRequired.length) * 45);
          score += skillScore;
          if (matchingSkills.length > 0) {
            reasons.push(`Matches ${matchingSkills.length}/${job.skillsRequired.length} skills`);
          }
        }
        return { candidate: c, matchScore: Math.min(score, 100), matchReasons: reasons };
      })
      .sort((a, b) => b.matchScore - a.matchScore);
  };

  // Pipeline Actions
  const movePipelineStage = (id: string, newStage: PipelineStage) => {
    const item = pipeline.find((p) => p.id === id);
    setPipeline((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stage: newStage, updatedAt: new Date().toISOString(), lastMovedBy: currentUser.name } : p))
    );
    logActivity('candidate', 'Pipeline Stage Moved', `Moved candidate stage to ${newStage}`);

    if (item) {
      const cand = candidates.find((c) => c.id === item.candidateId);
      if (cand) {
        const stageToStatusMap: Record<PipelineStage, CandidateStatus> = {
          Sourced: 'New',
          Screened: 'Screened',
          'Submitted to Client': 'Shortlisted',
          Interview: 'Interview Scheduled',
          Offer: 'Offered',
          Joined: 'Joined',
          Rejected: 'Rejected',
        };
        const mappedStatus = stageToStatusMap[newStage];
        if (mappedStatus && cand.status !== mappedStatus) {
          openStatusRemarkModal(cand, mappedStatus);
        }
      }
    }
  };

  const addPipelineCandidate = (candidateId: string, jobId: string, stage: PipelineStage = 'Sourced') => {
    const cand = candidates.find((c) => c.id === candidateId);
    const job = jobs.find((j) => j.id === jobId);
    if (!cand || !job) return;

    const exists = pipeline.some((p) => p.candidateId === candidateId && p.jobId === jobId);
    if (exists) return;

    const newItem: PipelineItem = {
      id: `pipe_${Date.now()}`,
      candidateId: cand.id,
      candidateName: cand.fullName,
      candidatePhone: cand.phone,
      candidateEmail: cand.email,
      candidateExp: cand.experienceYears,
      candidateSalary: cand.expectedSalaryLPA,
      candidateSkills: cand.skills,
      jobId: job.id,
      jobTitle: job.title,
      clientId: job.clientId,
      clientName: job.clientName,
      stage,
      assignedRecruiterId: cand.assignedRecruiterId,
      updatedAt: new Date().toISOString(),
      lastMovedBy: currentUser.name,
    };

    setPipeline((prev) => [newItem, ...prev]);
    logActivity('candidate', 'Added to Pipeline', `Enrolled ${cand.fullName} into hiring pipeline for ${job.title}`);
  };

  // Interviews
  const addInterview = (i: Omit<Interview, 'id'>) => {
    const newInt: Interview = {
      ...i,
      id: `int_${Date.now()}`,
    };
    setInterviews((prev) => [newInt, ...prev]);
    logActivity('interview', 'Interview Scheduled', `Scheduled ${i.roundName} for ${i.candidateName} with ${i.clientName}`);
  };

  const updateInterview = (id: string, updates: Partial<Interview>) => {
    setInterviews((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
    logActivity('interview', 'Interview Updated', `Updated interview schedule ID ${id}`);
  };

  const deleteInterview = (id: string) => {
    if (currentUser.role !== 'admin') {
      alert('Access Restricted: Only Admin can delete interviews.');
      return;
    }
    setInterviews((prev) => prev.filter((i) => i.id !== id));
    logActivity('interview', 'Interview Cancelled', `Deleted interview ID ${id}`);
  };

  // Tasks & Reminders
  const addReminder = (r: Omit<ReminderTask, 'id' | 'createdAt' | 'assignedByUserId' | 'assignedByUserName'>) => {
    if (!canCreateTasks) {
      alert('Access Restricted: Only Admin and HR Executive can create or assign tasks.');
      throw new Error('Unauthorized');
    }
    const newRem: ReminderTask = {
      ...r,
      id: `rem_${Date.now()}`,
      assignedByUserId: currentUser.id,
      assignedByUserName: currentUser.name,
      createdAt: new Date().toISOString(),
    };
    setReminders((prev) => [newRem, ...prev]);
    logActivity('system', 'Task Created', `Assigned task "${r.title}" to ${r.assignedToUserName}`);
    return newRem;
  };

  const updateReminder = (id: string, updates: Partial<ReminderTask>) => {
    const rem = reminders.find((r) => r.id === id);
    if (!rem) return;

    const isAssigner = rem.assignedByUserId === currentUser.id;
    if (currentUser.role !== 'admin' && !(currentUser.role === 'hr_executive' && isAssigner)) {
      alert('Access Restricted: Only Admin or the HR Executive who created this task can edit it.');
      return;
    }

    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
    logActivity('system', 'Task Updated', `Updated task: ${rem.title}`);
  };

  const deleteReminder = (id: string) => {
    const rem = reminders.find((r) => r.id === id);
    if (!rem) return;

    const isAssigner = rem.assignedByUserId === currentUser.id;
    if (currentUser.role !== 'admin' && !(currentUser.role === 'hr_executive' && isAssigner)) {
      alert('Access Restricted: Only Admin or the HR Executive who created this task can delete it.');
      return;
    }

    setReminders((prev) => prev.filter((r) => r.id !== id));
    logActivity('system', 'Task Deleted', `Deleted task: ${rem.title}`);
  };

  const toggleReminderStatus = (id: string) => {
    const rem = reminders.find((r) => r.id === id);
    if (!rem) return;

    const isAssignee = rem.assignedToUserId === currentUser.id;
    if (!isAssignee && currentUser.role !== 'admin') {
      alert('Access Restricted: Only the task assignee or Admin can mark this task as done.');
      return;
    }

    const nextStatus = rem.status === 'Pending' ? 'Completed' : 'Pending';
    const completedAt = nextStatus === 'Completed' ? new Date().toISOString() : undefined;

    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: nextStatus, completedAt } : r))
    );
    logActivity('system', 'Task Completed', `Marked task "${rem.title}" as completed`);
  };

  const snoozeReminder = (id: string, days: number) => {
    const rem = reminders.find((r) => r.id === id);
    if (!rem) return;

    const isAssigner = rem.assignedByUserId === currentUser.id;
    if (currentUser.role !== 'admin' && !(currentUser.role === 'hr_executive' && isAssigner)) {
      alert('Access Restricted: Only Admin or the HR Executive who created this task can postpone it.');
      return;
    }

    setReminders((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const d = new Date(r.dueDate);
          d.setDate(d.getDate() + days);
          return {
            ...r,
            dueDate: d.toISOString().split('T')[0],
            snoozedUntil: new Date().toISOString(),
          };
        }
        return r;
      })
    );
  };

  // Notifications
  const notifications = useMemo(() => {
    const list: CRMNotification[] = [];
    const todayStr = new Date().toISOString().split('T')[0];

    interviews.forEach((item) => {
      if (item.status === 'Scheduled') {
        const itemDate = item.dateTime.split('T')[0];
        if (itemDate === todayStr) {
          list.push({
            id: `notif_int_${item.id}`,
            title: `Interview Today: ${item.candidateName}`,
            message: `${item.roundName} with ${item.clientName} at ${item.dateTime.slice(11, 16)} IST`,
            type: 'interview',
            targetTab: 'interviews',
            targetId: item.id,
            isRead: readNotifIds.includes(`notif_int_${item.id}`),
            timestamp: item.dateTime,
          });
        }
      }
    });

    visibleReminders.forEach((r) => {
      if (r.dueDate < todayStr && r.status === 'Pending') {
        list.push({
          id: `notif_rem_${r.id}`,
          title: `Overdue Task: ${r.title}`,
          message: `Due on ${r.dueDate} (Assigned to: ${r.assignedToUserName})`,
          type: 'overdue',
          targetTab: 'tasks',
          targetId: r.id,
          isRead: readNotifIds.includes(`notif_rem_${r.id}`),
          timestamp: r.createdAt,
        });
      }
    });

    return list;
  }, [interviews, visibleReminders, readNotifIds]);

  const unreadNotificationCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const markNotificationRead = (id: string) => {
    setReadNotifIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const clearAllNotifications = () => {
    setReadNotifIds(notifications.map((n) => n.id));
  };

  // Settings & User Management
  const updateCompanySettings = (settings: Partial<CompanySettings>) => {
    setCompanySettings((prev) => ({ ...prev, ...settings }));
    logActivity('system', 'Settings Updated', 'Updated company profile configuration');
  };

  const addUser = (u: Omit<User, 'id'>) => {
    if (currentUser.role !== 'admin') {
      alert('Access Restricted: Only Admin can add users.');
      return;
    }
    const newUser: User = {
      ...u,
      id: `usr_${Date.now()}`,
      active: true,
      password: u.password || 'bjbright2026',
    };
    setUsers((prev) => [...prev, newUser]);
    logActivity('system', 'User Created', `Added team member ${u.name} as ${u.role.toUpperCase()}`);
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    if (currentUser.role !== 'admin') {
      alert('Access Restricted: Only Admin can update user roles/credentials.');
      return;
    }
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
    logActivity('system', 'User Updated', `Updated account for user ID ${id}`);
  };

  const toggleUserStatus = (id: string) => {
    if (currentUser.role !== 'admin') {
      alert('Access Restricted: Only Admin can disable or enable users.');
      return;
    }
    const target = users.find((u) => u.id === id);
    if (!target) return;

    if (target.active) {
      // Disabling: check if user owns candidates, jobs, or tasks
      const ownedCandidates = candidates.filter((c) => c.assignedRecruiterId === id && !c.deletedAt);
      const ownedJobs = jobs.filter((j) => j.assignedRecruiterIds?.includes(id) && !j.deletedAt);
      const ownedTasks = reminders.filter((r) => r.assignedToUserId === id && r.status === 'Pending');

      if (ownedCandidates.length > 0 || ownedJobs.length > 0 || ownedTasks.length > 0) {
        setReassignmentTargetUser({ user: target, type: 'disable' });
        return;
      }
    }

    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, active: !u.active } : u)));
    logActivity('system', target.active ? 'User Disabled' : 'User Enabled', `Toggled access for ${target.name}`);
  };

  const deleteUser = (id: string) => {
    if (currentUser.role !== 'admin') {
      alert('Access Restricted: Only Admin can delete users.');
      return;
    }
    if (users.length <= 1) {
      alert('Cannot delete the last remaining user.');
      return;
    }
    const target = users.find((u) => u.id === id);
    if (!target) return;

    const ownedCandidates = candidates.filter((c) => c.assignedRecruiterId === id && !c.deletedAt);
    const ownedJobs = jobs.filter((j) => j.assignedRecruiterIds?.includes(id) && !j.deletedAt);
    const ownedTasks = reminders.filter((r) => r.assignedToUserId === id && r.status === 'Pending');

    if (ownedCandidates.length > 0 || ownedJobs.length > 0 || ownedTasks.length > 0) {
      setReassignmentTargetUser({ user: target, type: 'delete' });
      return;
    }

    setUsers((prev) => prev.filter((u) => u.id !== id));
    logActivity('system', 'User Deleted', `Removed team member ${target.name}`);
  };

  const reassignAndResolveUser = (oldUserId: string, newUserId: string, actionType: 'disable' | 'delete') => {
    const newUser = users.find((u) => u.id === newUserId);
    if (!newUser) return;

    // Reassign candidates
    setCandidates((prev) =>
      prev.map((c) => (c.assignedRecruiterId === oldUserId ? { ...c, assignedRecruiterId: newUser.id, assignedRecruiterName: newUser.name } : c))
    );
    // Reassign jobs
    setJobs((prev) =>
      prev.map((j) => ({
        ...j,
        assignedRecruiterIds: j.assignedRecruiterIds?.map((id) => (id === oldUserId ? newUser.id : id)),
        assignedRecruiterNames: j.assignedRecruiterNames?.map((name) => (name === users.find(u => u.id === oldUserId)?.name ? newUser.name : name)),
      }))
    );
    // Reassign tasks
    setReminders((prev) =>
      prev.map((r) => (r.assignedToUserId === oldUserId ? { ...r, assignedToUserId: newUser.id, assignedToUserName: newUser.name } : r))
    );

    if (actionType === 'disable') {
      setUsers((prev) => prev.map((u) => (u.id === oldUserId ? { ...u, active: false } : u)));
      logActivity('system', 'User Disabled & Reassigned', `Disabled user and reassigned records to ${newUser.name}`);
    } else {
      setUsers((prev) => prev.filter((u) => u.id !== oldUserId));
      logActivity('system', 'User Deleted & Reassigned', `Deleted user and reassigned records to ${newUser.name}`);
    }

    setReassignmentTargetUser(null);
  };

  // Demo Mode Data Controls (via single dataService)
  const saveFirebaseSettings = (_cfg: FirebaseConfigOptions) => {};
  const removeFirebaseSettings = () => {};

  const resetAllData = () => {
    if (currentUser.role !== 'admin') return;
    const restored = dataService.resetToDemoSeedData();
    setUsers(restored.users);
    setCompanySettings(restored.companySettings);
    setClients(restored.clients);
    setJobs(restored.jobs);
    setCandidates(restored.candidates);
    setPipeline(restored.pipeline);
    setInterviews(restored.interviews);
    setReminders(restored.reminders);
    setActivities(restored.activities);
    setEditHistories([]);
    setReadNotifIds([]);
    setExportLogs([]);
    setImportLogs([]);
    logActivity('system', 'Demo Data Reset', 'Restored sample seed dataset');
  };

  const downloadDemoData = () => {
    if (currentUser.role !== 'admin') return;
    const jsonString = dataService.exportAllDemoDataAsJson();
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    link.href = url;
    link.download = `bj-bright-crm-demo-data-${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    logActivity('system', 'Demo Data Downloaded', 'Downloaded JSON snapshot of demo data');
  };

  return (
    <CRMContext.Provider
      value={{
        currentUser,
        switchUser,
        changeMyPassword,
        users,
        isDarkMode,
        toggleDarkMode,
        globalSearch,
        setGlobalSearch,
        canManageUsers,
        canDeleteClientOrJob,
        isRecruiterOrHr,
        canCreateTasks,
        viewAllToggle,
        setViewAllToggle,
        candidates,
        visibleCandidates,
        trashCandidates,
        addCandidate,
        updateCandidate,
        deleteCandidate,
        restoreCandidate,
        addCandidateNote,
        addCandidateRemark,
        deleteCandidateRemark,
        activeStatusRemarkModal,
        openStatusRemarkModal,
        openBulkStatusRemarkModal,
        openAddRemarkModal,
        closeStatusRemarkModal,
        submitStatusRemark,
        bulkImportCandidates,
        checkDuplicate,
        bulkUpdateCandidateStatus,
        bulkAssignRecruiter,
        bulkDeleteCandidates,
        clients,
        visibleClients,
        trashClients,
        addClient,
        updateClient,
        moveClientSection,
        addClientRemark,
        deleteClient,
        restoreClient,
        bulkImportClients,
        jobs,
        visibleJobs,
        trashJobs,
        addJob,
        updateJob,
        deleteJob,
        restoreJob,
        bulkImportJobs,
        getMatchingCandidates,
        processCandidateImport,
        exportLogs,
        logExport,
        importLogs,
        logImport,
        pipeline,
        visiblePipeline,
        movePipelineStage,
        addPipelineCandidate,
        interviews,
        visibleInterviews,
        addInterview,
        updateInterview,
        deleteInterview,
        reminders,
        visibleReminders,
        completedReminders,
        addReminder,
        updateReminder,
        deleteReminder,
        toggleReminderStatus,
        snoozeReminder,
        editHistories,
        getEditHistory,
        notifications,
        unreadNotificationCount,
        markNotificationRead,
        clearAllNotifications,
        activities,
        logActivity,
        companySettings,
        updateCompanySettings,
        addUser,
        updateUser,
        toggleUserStatus,
        deleteUser,
        reassignmentTargetUser,
        setReassignmentTargetUser,
        reassignAndResolveUser,
        isFirebaseConfigured,
        firebaseConfig,
        saveFirebaseSettings,
        removeFirebaseSettings,
        resetAllData,
        downloadDemoData,
      }}
    >
      {children}
    </CRMContext.Provider>
  );
};

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
};
