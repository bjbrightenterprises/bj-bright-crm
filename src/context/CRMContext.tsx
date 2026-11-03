import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, Unsubscribe } from 'firebase/auth';
import {
  Candidate,
  Client,
  JobOpening,
  PipelineItem,
  Interview,
  ActivityLogItem,
  User,
  CompanySettings,
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
import { INITIAL_USERS, buildSeedData } from '../lib/mockData';
import { dataService, SyncState } from '../lib/dataService';
import { auth, FIREBASE_CONFIG, FirebaseConfig } from '../lib/firebase';

interface CRMContextType {
  // Firebase Auth & Sync State
  authLoading: boolean;
  isAuthenticated: boolean;
  accessDeniedMessage: string;
  clearAccessDeniedMessage: () => void;
  syncStatus: SyncState;
  loginWithFirebase: (email: string, password: string) => Promise<void>;
  logoutFromFirebase: () => Promise<void>;
  sendForgotPasswordEmail: (email: string) => Promise<void>;
  loadStarterData: () => Promise<{ loaded: boolean; clientsCount: number; jobsCount: number }>;
  migrationNotice: string;
  clearMigrationNotice: () => void;

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
  addCandidate: (c: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt' | 'notes'>) => {
    success: boolean;
    duplicateWarning?: string;
    candidate?: Candidate;
  };
  updateCandidate: (id: string, updates: Partial<Candidate>, reason?: string) => void;
  deleteCandidate: (id: string) => void;
  restoreCandidate: (id: string) => void;
  addCandidateNote: (candidateId: string, text: string) => void;
  addCandidateRemark: (candidateId: string, text: string, statusChangedTo?: CandidateStatus) => void;
  deleteCandidateRemark: (candidateId: string, remarkId: string) => void;
  activeStatusRemarkModal: {
    candidate: Candidate;
    newStatus?: CandidateStatus;
    isStatusChange: boolean;
    bulkCandidateIds?: string[];
  } | null;
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
  getMatchingCandidates: (
    job: JobOpening
  ) => { candidate: Candidate; matchScore: number; matchReasons: string[] }[];

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
  addReminder: (
    r: Omit<ReminderTask, 'id' | 'createdAt' | 'assignedByUserId' | 'assignedByUserName'>
  ) => ReminderTask;
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
  addUser: (u: Omit<User, 'id'>) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => void;
  toggleUserStatus: (id: string) => void;
  deleteUser: (id: string) => void;
  reassignmentTargetUser: { user: User; type: 'disable' | 'delete' } | null;
  setReassignmentTargetUser: (val: { user: User; type: 'disable' | 'delete' } | null) => void;
  reassignAndResolveUser: (oldUserId: string, newUserId: string, actionType: 'disable' | 'delete') => void;

  // Cloud & Data Controls
  isFirebaseConfigured: boolean;
  firebaseConfig: FirebaseConfig | null;
  saveFirebaseSettings: (cfg: FirebaseConfig) => void;
  removeFirebaseSettings: () => void;
  resetAllData: () => void;
  downloadDemoData: () => void;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export const CRMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isDarkMode = false;
  const toggleDarkMode = () => {};

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
  }, []);

  const [globalSearch, setGlobalSearch] = useState('');

  // Auth & Real-time Sync states
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState<string>('');
  const [authenticatedProfile, setAuthenticatedProfile] = useState<User | null>(null);
  const [isBrowserOnline, setIsBrowserOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [hasPendingWrites, setHasPendingWrites] = useState<boolean>(false);
  const [migrationNotice, setMigrationNotice] = useState<string>('');
  const clearMigrationNotice = () => setMigrationNotice('');

  // Firestore Collections State
  const [users, setUsers] = useState<User[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [pipeline, setPipeline] = useState<PipelineItem[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [reminders, setReminders] = useState<ReminderTask[]>([]);
  const [editHistories, setEditHistories] = useState<EditHistoryItem[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings>(
    () => buildSeedData().companySettings
  );
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);
  const [readNotifIds, setReadNotifIds] = useState<string[]>([]);
  const [exportLogs, setExportLogs] = useState<ExportLogItem[]>([]);
  const [importLogs, setImportLogs] = useState<ImportLogItem[]>([]);
  const [reassignmentTargetUser, setReassignmentTargetUser] = useState<{
    user: User;
    type: 'disable' | 'delete';
  } | null>(null);
  const [viewAllToggle, setViewAllToggle] = useState<boolean>(false);

  // Track browser online/offline state
  useEffect(() => {
    const handleOnline = () => setIsBrowserOnline(true);
    const handleOffline = () => setIsBrowserOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncStatus: SyncState = useMemo(() => {
    if (!isBrowserOnline) return 'Offline';
    if (hasPendingWrites) return 'Syncing...';
    return 'Synced';
  }, [isBrowserOnline, hasPendingWrites]);

  const handleSyncMeta = (pending: boolean, _fromCache: boolean) => {
    setHasPendingWrites(pending);
  };

  // Listen to Firebase Auth state & User Profile in users/{uid}
  useEffect(() => {
    let profileUnsub: Unsubscribe | null = null;

    const authUnsub = onAuthStateChanged(auth, async (fbUser) => {
      if (profileUnsub) {
        profileUnsub();
        profileUnsub = null;
      }

      if (!fbUser) {
        setAuthenticatedProfile(null);
        setIsAuthenticated(false);
        setAuthLoading(false);
        return;
      }

      setAuthLoading(true);
      try {
        const initialProfile = await dataService.verifyOrBootstrapUserProfile(
          fbUser.uid,
          fbUser.email
        );

        if (!initialProfile || initialProfile.active === false) {
          setAccessDeniedMessage('Your access is not active. Please contact your Admin.');
          await dataService.logoutFirebase();
          setAuthenticatedProfile(null);
          setIsAuthenticated(false);
          setAuthLoading(false);
          return;
        }

        setAccessDeniedMessage('');
        setAuthenticatedProfile(initialProfile);
        setIsAuthenticated(true);
        setAuthLoading(false);

        // Real-time subscription to users/{uid} so if Admin disables access, user is signed out immediately
        profileUnsub = dataService.subscribeToUserProfile(fbUser.uid, async (liveProfile) => {
          if (!liveProfile || liveProfile.active === false) {
            setAccessDeniedMessage('Your access is not active. Please contact your Admin.');
            await dataService.logoutFirebase();
            setAuthenticatedProfile(null);
            setIsAuthenticated(false);
          } else {
            setAuthenticatedProfile(liveProfile);
          }
        });
      } catch {
        setAccessDeniedMessage('Your access is not active. Please contact your Admin.');
        await dataService.logoutFirebase();
        setAuthenticatedProfile(null);
        setIsAuthenticated(false);
        setAuthLoading(false);
      }
    });

    return () => {
      authUnsub();
      if (profileUnsub) profileUnsub();
    };
  }, []);

  // Attach role-based Firestore onSnapshot listeners when authenticated & active
  useEffect(() => {
    if (!isAuthenticated || !authenticatedProfile || !authenticatedProfile.active) {
      setUsers([]);
      setCandidates([]);
      setClients([]);
      setJobs([]);
      setPipeline([]);
      setInterviews([]);
      setReminders([]);
      setEditHistories([]);
      return;
    }

    const uid = authenticatedProfile.id;
    const role = authenticatedProfile.role;

    const unsubs: Unsubscribe[] = [
      dataService.subscribeToUsers(setUsers, handleSyncMeta),
      dataService.subscribeToCandidates(uid, role, setCandidates, handleSyncMeta),
      dataService.subscribeToClients(setClients, handleSyncMeta),
      dataService.subscribeToJobs(setJobs, handleSyncMeta),
      dataService.subscribeToPipeline(uid, role, setPipeline, handleSyncMeta),
      dataService.subscribeToInterviews(uid, role, setInterviews, handleSyncMeta),
      dataService.subscribeToTasks(uid, role, setReminders, handleSyncMeta),
      dataService.subscribeToEditHistory(setEditHistories),
      dataService.subscribeToSettings(setCompanySettings),
    ];

    if (role === 'admin') {
      dataService
        .runJoinedToPlacedMigrationIfNeeded(uid)
        .then((res) => {
          if (res.ran) {
            setMigrationNotice(`Updated ${res.updatedCount} records to Placed`);
          }
        })
        .catch(() => {});
    }

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [isAuthenticated, authenticatedProfile?.id, authenticatedProfile?.role, authenticatedProfile?.active]);

  const currentUser: User = useMemo(() => {
    if (authenticatedProfile) {
      const fromList = users.find((u) => u.id === authenticatedProfile.id);
      return fromList || authenticatedProfile;
    }
    return users[0] || INITIAL_USERS[0];
  }, [authenticatedProfile, users]);

  const clearAccessDeniedMessage = () => setAccessDeniedMessage('');

  const loginWithFirebase = async (email: string, password: string) => {
    setAccessDeniedMessage('');
    const fbUser = await dataService.loginWithEmail(email, password);
    const profile = await dataService.verifyOrBootstrapUserProfile(fbUser.uid, fbUser.email);
    if (!profile || profile.active === false) {
      await dataService.logoutFirebase();
      const msg = 'Your access is not active. Please contact your Admin.';
      setAccessDeniedMessage(msg);
      throw new Error(msg);
    }
  };

  const logoutFromFirebase = async () => {
    await dataService.logoutFirebase();
    setAuthenticatedProfile(null);
    setIsAuthenticated(false);
  };

  const sendForgotPasswordEmail = async (email: string) => {
    await dataService.sendPasswordReset(email);
  };

  const loadStarterData = async () => {
    if (currentUser.role !== 'admin') {
      throw new Error('Only Admin can load starter data.');
    }
    const res = await dataService.loadStarterDataIfEmpty(currentUser.id, currentUser.name);
    if (res.loaded) {
      logActivity(
        'system',
        'Starter Data Loaded',
        `Loaded ${res.clientsCount} starter companies and ${res.jobsCount} open job mandates into Firestore`
      );
    }
    return res;
  };

  const switchUser = (_userId: string) => {};

  const changeMyPassword = (newPassword: string) => {
    dataService.updateCurrentUserPassword(newPassword).catch(() => {});
    logActivity('system', 'Password Updated', `${currentUser.name} updated their account password`);
  };

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

  const visibleClients = useMemo(() => activeClients, [activeClients]);
  const visibleJobs = useMemo(() => activeJobs, [activeJobs]);

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
  const completedReminders = useMemo(
    () => reminders.filter((r) => r.status === 'Completed'),
    [reminders]
  );

  const visibleReminders = useMemo(() => {
    if (currentUser.role === 'admin' || currentUser.role === 'manager' || viewAllToggle) {
      return activeReminders;
    }
    if (currentUser.role === 'hr_executive') {
      return activeReminders.filter(
        (r) =>
          r.assignedToUserId === currentUser.id ||
          r.assignedByUserId === currentUser.id ||
          (r as any).createdByUserId === currentUser.id
      );
    }
    return activeReminders.filter((r) => r.assignedToUserId === currentUser.id);
  }, [activeReminders, currentUser, viewAllToggle]);

  const logActivity = (category: ActivityLogItem['category'], action: string, details: string) => {
    const newAct: ActivityLogItem = {
      id: dataService.createAutoId('activities'),
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
    const cleanReason = reason && reason.trim().length > 0 ? reason.trim() : 'Record updated';
    const item: EditHistoryItem = {
      id: dataService.createAutoId('editHistory'),
      entityId,
      entityType,
      editedByUserId: currentUser.id,
      editedByUserName: currentUser.name,
      editedByUserRole: currentUser.role,
      timestamp: new Date().toISOString(),
      reason: cleanReason,
      changes,
    };
    setEditHistories((prev) => [item, ...prev]);
    dataService.createEditHistoryDoc(item).catch(() => {});
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
    const autoId = dataService.createAutoId('candidates');
    const nowIso = new Date().toISOString();
    const newCand: Candidate = {
      ...c,
      id: autoId,
      assignedRecruiterId: c.assignedRecruiterId || currentUser.id,
      assignedRecruiterName: c.assignedRecruiterName || currentUser.name,
      notes: [],
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    setCandidates((prev) => [newCand, ...prev]);
    dataService.createCandidateDoc(newCand).catch(() => {});
    logActivity('candidate', 'Candidate Added', `Added candidate ${newCand.fullName} (${newCand.phone})`);
    return { success: true, candidate: newCand };
  };

  const updateCandidate = (id: string, updates: Partial<Candidate>, reason = 'Candidate updated details') => {
    const old = candidates.find((c) => c.id === id);
    if (!old) return;

    const cleanReason = reason && reason.trim().length > 0 ? reason.trim() : 'Candidate updated details';
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
      addEditHistory(id, 'candidate', cleanReason, changes);
    }

    const updatedAt = new Date().toISOString();
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates, updatedAt } : c))
    );
    dataService.updateCandidateDoc(id, { ...updates, updatedAt }, cleanReason).catch(() => {});
    logActivity('candidate', 'Candidate Updated', `Updated profile for ${old.fullName}. Reason: ${cleanReason}`);
  };

  const deleteCandidate = (id: string) => {
    if (currentUser.role !== 'admin') return;
    const target = candidates.find((c) => c.id === id);
    if (!target) return;
    const deletedAt = new Date().toISOString();
    setCandidates((prev) => prev.map((c) => (c.id === id ? { ...c, deletedAt } : c)));
    dataService.deleteCandidateToTrash(target, currentUser).catch(() => {});
    logActivity('candidate', 'Candidate Moved to Trash', `Moved candidate ${target.fullName || id} to Trash`);
  };

  const restoreCandidate = (id: string) => {
    if (currentUser.role !== 'admin') return;
    const target = candidates.find((c) => c.id === id);
    if (!target) return;
    const restored: Candidate = { ...target, deletedAt: undefined, updatedAt: new Date().toISOString() };
    setCandidates((prev) => prev.map((c) => (c.id === id ? restored : c)));
    dataService.createCandidateDoc(restored).catch(() => {});
    logActivity('candidate', 'Candidate Restored', `Restored candidate ID ${id} from Trash`);
  };

  const addCandidateNote = (candidateId: string, text: string) => {
    const old = candidates.find((c) => c.id === candidateId);
    if (!old) return;
    const nowIso = new Date().toISOString();
    const note = {
      id: dataService.createAutoId('remarks'),
      authorName: currentUser.name,
      authorRole: currentUser.role,
      text,
      createdAt: nowIso,
    };
    const nextNotes = [note, ...(old.notes || [])];
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, notes: nextNotes, updatedAt: nowIso } : c))
    );
    dataService.updateCandidateDoc(candidateId, { notes: nextNotes, updatedAt: nowIso }, 'Note added').catch(() => {});
    dataService
      .createRemarkDoc({
        entityType: 'candidate',
        entityId: candidateId,
        text,
        authorUserId: currentUser.id,
        authorName: currentUser.name,
        authorRole: currentUser.role,
        createdAt: nowIso,
      })
      .catch(() => {});
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
    const target = candidates.find((c) => c.id === candidateId);
    if (!target) return;
    const nowIso = new Date().toISOString();
    const remarkText =
      text.trim() || (statusChangedTo ? `Status changed to ${statusChangedTo}` : 'General remark');
    const remark: CandidateRemark = {
      id: dataService.createAutoId('remarks'),
      candidateId,
      statusChangedTo,
      text: remarkText,
      authorUserId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      createdAt: nowIso,
    };

    const nextRemarks = [remark, ...(target.remarks || [])];
    const updates: Partial<Candidate> = {
      ...(statusChangedTo ? { status: statusChangedTo } : {}),
      remarks: nextRemarks,
      updatedAt: nowIso,
    };

    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, ...updates } : c))
    );
    dataService.updateCandidateDoc(candidateId, updates, remarkText).catch(() => {});
    dataService
      .createRemarkDoc({
        ...remark,
        entityType: 'candidate',
        entityId: candidateId,
      })
      .catch(() => {});

    logActivity(
      'candidate',
      statusChangedTo ? 'Status Changed & Remark Logged' : 'Remark Logged',
      `Remark added for candidate${statusChangedTo ? ` (Status: ${statusChangedTo})` : ''}`
    );
  };

  const deleteCandidateRemark = (candidateId: string, remarkId: string) => {
    if (currentUser.role !== 'admin') return;
    const target = candidates.find((c) => c.id === candidateId);
    if (!target || !target.remarks) return;
    const nowIso = new Date().toISOString();
    const nextRemarks = target.remarks.filter((r) => r.id !== remarkId);
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, remarks: nextRemarks, updatedAt: nowIso } : c))
    );
    dataService
      .updateCandidateDoc(candidateId, { remarks: nextRemarks, updatedAt: nowIso }, 'Deleted remark')
      .catch(() => {});
    logActivity('candidate', 'Remark Deleted', `Deleted remark ID ${remarkId} for candidate ${candidateId}`);
  };

  const submitStatusRemark = (text: string) => {
    if (!activeStatusRemarkModal) return;
    const { candidate, newStatus, isStatusChange, bulkCandidateIds } = activeStatusRemarkModal;

    if (bulkCandidateIds && bulkCandidateIds.length > 0 && newStatus) {
      bulkCandidateIds.forEach((cid) => {
        addCandidateRemark(cid, text || `Bulk status updated to ${newStatus}`, newStatus);
      });
      logActivity(
        'candidate',
        'Bulk Status Update & Remarks',
        `Updated ${bulkCandidateIds.length} candidates to ${newStatus}`
      );
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
    const nowIso = new Date().toISOString();
    setCandidates((prev) =>
      prev.map((c) =>
        idSet.has(c.id)
          ? {
              ...c,
              assignedRecruiterId: recruiterId,
              assignedRecruiterName: recruiterName,
              updatedAt: nowIso,
            }
          : c
      )
    );
    candidateIds.forEach((id) => {
      dataService
        .updateCandidateDoc(
          id,
          { assignedRecruiterId: recruiterId, assignedRecruiterName: recruiterName, updatedAt: nowIso },
          `Reassigned to ${recruiterName}`
        )
        .catch(() => {});
    });
    logActivity(
      'candidate',
      'Bulk Reassignment',
      `Reassigned ${candidateIds.length} candidates to ${recruiterName}`
    );
  };

  const bulkDeleteCandidates = (candidateIds: string[]) => {
    if (currentUser.role !== 'admin') return;
    candidateIds.forEach((id) => deleteCandidate(id));
  };

  const bulkImportCandidates = (newItems: Partial<Candidate>[]): number => {
    let imported = 0;
    newItems.forEach((item) => {
      if (item.fullName && (item.phone || item.email)) {
        addCandidate({
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
          status:
            ((item.status as string) === 'Joined' ? 'Placed' : (item.status as any)) || 'New',
        });
        imported++;
      }
    });
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

    records.forEach((r) => {
      if (r.isUpdate && r.existingId) {
        updateCandidate(r.existingId, r.data, updateReason);
        updated++;
      } else if (!r.isUpdate && r.data.fullName && (r.data.phone || r.data.email)) {
        const assignedId =
          currentUser.role === 'recruiter' || currentUser.role === 'hr_executive'
            ? currentUser.id
            : r.data.assignedRecruiterId || currentUser.id;
        const assignedName =
          currentUser.role === 'recruiter' || currentUser.role === 'hr_executive'
            ? currentUser.name
            : r.data.assignedRecruiterName || currentUser.name;

        addCandidate({
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
          status:
            ((r.data.status as string) === 'Joined' ? 'Placed' : (r.data.status as any)) || 'New',
          jobTitle: r.data.jobTitle,
          clientName: r.data.clientName,
          expectedJoiningDate: r.data.expectedJoiningDate,
        });
        added++;
      } else {
        skipped++;
      }
    });

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
    const clientId = dataService.createAutoId('clients');
    const sec: ClientSection = c.section || getClientSection(c);
    const trimmedRemark = (initialRemark || '').trim();
    const initialRemarkObj: ClientRemark | null =
      trimmedRemark.length >= 3
        ? {
            id: dataService.createAutoId('remarks'),
            clientId,
            section: sec,
            text: trimmedRemark,
            authorUserId: currentUser.id,
            authorName: currentUser.name,
            authorRole: currentUser.role,
            createdAt: nowIso,
          }
        : null;
    const initialRemarksList: ClientRemark[] = initialRemarkObj
      ? [initialRemarkObj]
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
    dataService.createClientDoc(newClient).catch(() => {});
    if (initialRemarkObj) {
      dataService
        .createRemarkDoc({
          ...initialRemarkObj,
          entityType: 'client',
          entityId: clientId,
        })
        .catch(() => {});
    }
    logActivity(
      'client',
      'Client Onboarded',
      `Added client company: ${newClient.name} (${CLIENT_SECTION_LABELS[sec]})`
    );
  };

  const updateClient = (id: string, updates: Partial<Client>, reason: string) => {
    if (!canManageClients) return;
    const trimmedReason = (reason || '').trim();
    if (trimmedReason.length < 3) return;

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
    dataService.updateClientDoc(id, normalizedUpdates, trimmedReason).catch(() => {});

    // Keep linked jobs & candidates company name in sync if company name was edited
    if (normalizedUpdates.name && normalizedUpdates.name !== old.name) {
      const newName = normalizedUpdates.name;
      jobs
        .filter((j) => j.clientId === id)
        .forEach((j) => {
          dataService.updateJobDoc(j.id, { clientName: newName }, `Company renamed to ${newName}`).catch(() => {});
        });
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
      id: dataService.createAutoId('remarks'),
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

    const nextRemarks = [newRemark, ...(old.remarks || [])];
    const updates: Partial<Client> = {
      ...dateUpdates,
      section: targetSection,
      status: sectionToClientStatus(targetSection),
      remarks: nextRemarks,
      updatedAt: nowIso,
    };

    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    dataService.updateClientDoc(id, updates, `Moved section: ${trimmedRemark}`).catch(() => {});
    dataService
      .createRemarkDoc({
        ...newRemark,
        entityType: 'client',
        entityId: id,
      })
      .catch(() => {});

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
      id: dataService.createAutoId('remarks'),
      clientId: id,
      section: sec,
      text: trimmed,
      authorUserId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      createdAt: nowIso,
    };

    const nextRemarks = [newRemark, ...(target.remarks || [])];
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, remarks: nextRemarks, updatedAt: nowIso } : c))
    );
    dataService
      .updateClientDoc(id, { remarks: nextRemarks, updatedAt: nowIso }, `Added remark: ${trimmed}`)
      .catch(() => {});
    dataService
      .createRemarkDoc({
        ...newRemark,
        entityType: 'client',
        entityId: id,
      })
      .catch(() => {});
    logActivity('client', 'Client Remark Added', `Added remark on ${target.name}`);
  };

  const deleteClient = (id: string, reason: string) => {
    if (currentUser.role !== 'admin') return;
    const trimmedReason = (reason || '').trim();
    if (trimmedReason.length < 3) return;

    const target = clients.find((c) => c.id === id);
    if (!target) return;

    const nowIso = new Date().toISOString();
    setClients((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, deletedAt: nowIso, deleteReason: trimmedReason, updatedAt: nowIso } : c
      )
    );
    dataService.deleteClientToTrash(target, currentUser).catch(() => {});
    logActivity(
      'client',
      'Client Moved to Trash',
      `Moved client ${target.name} to Trash. Reason: ${trimmedReason}`
    );
  };

  const restoreClient = (id: string) => {
    if (currentUser.role !== 'admin') return;
    const target = clients.find((c) => c.id === id);
    if (!target) return;
    const restored: Client = {
      ...target,
      deletedAt: undefined,
      deleteReason: undefined,
      updatedAt: new Date().toISOString(),
    };
    setClients((prev) => prev.map((c) => (c.id === id ? restored : c)));
    dataService.createClientDoc(restored).catch(() => {});
    logActivity('client', 'Client Restored', `Restored client ${target.name || id} from Trash`);
  };

  const bulkImportClients = (newItems: Array<Partial<Client> & { latestRemark?: string }>): number => {
    if (!canManageClients) return 0;
    let imported = 0;
    const seenNames = new Set(clients.map((c) => c.name.trim().toLowerCase()));
    const todayStr = new Date().toISOString().slice(0, 10);

    newItems.forEach((item) => {
      const cleanName = (item.name || '').trim();
      if (cleanName && !seenNames.has(cleanName.toLowerCase())) {
        seenNames.add(cleanName.toLowerCase());
        const rawSec = String(item.section || item.status || 'Green').trim().toLowerCase();
        let sec: ClientSection = 'Green';
        if (rawSec.includes('blue') || rawSec.includes('discussion') || rawSec.includes('prospect')) {
          sec = 'Blue';
        } else if (rawSec.includes('red') || rawSec.includes('enquir') || rawSec.includes('inactive')) {
          sec = 'Red';
        }

        addClient(
          {
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
            assignedAccountManagerId: currentUser.id,
            assignedAccountManagerName: currentUser.name,
          },
          item.latestRemark
        );
        imported++;
      }
    });
    return imported;
  };

  // Job Actions
  const addJob = (j: Omit<JobOpening, 'id' | 'createdAt' | 'applicationsCount'>) => {
    const newJob: JobOpening = {
      ...j,
      id: dataService.createAutoId('jobs'),
      createdAt: new Date().toISOString(),
      applicationsCount: 0,
    };
    setJobs((prev) => [newJob, ...prev]);
    dataService.createJobDoc(newJob).catch(() => {});

    const parentClient = clients.find((c) => c.id === j.clientId);
    if (parentClient) {
      const nextCount = (parentClient.activeJobsCount || 0) + 1;
      dataService
        .updateClientDoc(parentClient.id, { activeJobsCount: nextCount }, `Added job: ${j.title}`)
        .catch(() => {});
    }
    logActivity('job', 'Job Created', `Created requisition: ${j.title} for ${j.clientName}`);
  };

  const updateJob = (id: string, updates: Partial<JobOpening>, reason = 'Job requisition updated') => {
    const old = jobs.find((j) => j.id === id);
    if (!old) return;

    const cleanReason = reason && reason.trim().length > 0 ? reason.trim() : 'Job requisition updated';
    const changes: { field: string; oldValue: any; newValue: any }[] = [];
    Object.keys(updates).forEach((key) => {
      const k = key as keyof JobOpening;
      if (JSON.stringify(old[k]) !== JSON.stringify(updates[k])) {
        changes.push({ field: k, oldValue: old[k], newValue: updates[k] });
      }
    });
    if (changes.length > 0) {
      addEditHistory(id, 'job', cleanReason, changes);
    }

    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...updates } : j)));
    dataService.updateJobDoc(id, updates, cleanReason).catch(() => {});
    logActivity('job', 'Job Updated', `Updated requisition ${old.title}. Reason: ${cleanReason}`);
  };

  const deleteJob = (id: string) => {
    if (currentUser.role !== 'admin') return;
    const target = jobs.find((j) => j.id === id);
    if (!target) return;
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, deletedAt: new Date().toISOString() } : j)));
    dataService.deleteJobToTrash(target, currentUser).catch(() => {});
    logActivity('job', 'Job Moved to Trash', `Moved job ${target.title || id} to Trash`);
  };

  const restoreJob = (id: string) => {
    if (currentUser.role !== 'admin') return;
    const target = jobs.find((j) => j.id === id);
    if (!target) return;
    const restored: JobOpening = { ...target, deletedAt: undefined };
    setJobs((prev) => prev.map((j) => (j.id === id ? restored : j)));
    dataService.createJobDoc(restored).catch(() => {});
    logActivity('job', 'Job Restored', `Restored job ID ${id}`);
  };

  const bulkImportJobs = (newItems: Partial<JobOpening>[]): number => {
    let imported = 0;
    newItems.forEach((item) => {
      if (item.title && (item.clientName || item.clientId)) {
        const matchedClient = clients.find(
          (c) => c.name.toLowerCase() === (item.clientName || '').toLowerCase()
        );
        addJob({
          title: item.title.trim(),
          clientId: matchedClient?.id || item.clientId || '',
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
        });
        imported++;
      }
    });
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
    const nowIso = new Date().toISOString();
    setPipeline((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, stage: newStage, updatedAt: nowIso, lastMovedBy: currentUser.name } : p
      )
    );
    dataService
      .updatePipelineDoc(id, { stage: newStage, updatedAt: nowIso, lastMovedBy: currentUser.name })
      .catch(() => {});
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
          Placed: 'Placed',
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
      id: dataService.createAutoId('pipeline'),
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
      assignedRecruiterId: cand.assignedRecruiterId || currentUser.id,
      updatedAt: new Date().toISOString(),
      lastMovedBy: currentUser.name,
    };

    setPipeline((prev) => [newItem, ...prev]);
    dataService.createPipelineDoc(newItem).catch(() => {});
    logActivity('candidate', 'Added to Pipeline', `Enrolled ${cand.fullName} into hiring pipeline for ${job.title}`);
  };

  // Interviews
  const addInterview = (i: Omit<Interview, 'id'>) => {
    const newInt: Interview = {
      ...i,
      id: dataService.createAutoId('interviews'),
      assignedToRecruiterId: i.assignedToRecruiterId || currentUser.id,
    };
    setInterviews((prev) => [newInt, ...prev]);
    dataService.createInterviewDoc(newInt).catch(() => {});
    logActivity('interview', 'Interview Scheduled', `Scheduled ${i.roundName} for ${i.candidateName} with ${i.clientName}`);
  };

  const updateInterview = (id: string, updates: Partial<Interview>) => {
    setInterviews((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
    dataService.updateInterviewDoc(id, updates).catch(() => {});
    logActivity('interview', 'Interview Updated', `Updated interview schedule ID ${id}`);
  };

  const deleteInterview = (id: string) => {
    if (currentUser.role !== 'admin') return;
    const target = interviews.find((i) => i.id === id);
    if (!target) return;
    setInterviews((prev) => prev.filter((i) => i.id !== id));
    dataService.deleteInterviewToTrash(target, currentUser).catch(() => {});
    logActivity('interview', 'Interview Cancelled', `Deleted interview ID ${id}`);
  };

  // Tasks & Reminders
  const addReminder = (
    r: Omit<ReminderTask, 'id' | 'createdAt' | 'assignedByUserId' | 'assignedByUserName'>
  ) => {
    if (!canCreateTasks) {
      throw new Error('Access Restricted: Only Admin and HR Executive can create or assign tasks.');
    }
    const assignee = users.find((u) => u.id === r.assignedToUserId);
    const assigneeRole = assignee?.role || 'recruiter';

    const newRem: ReminderTask & { createdByUserId?: string; assignedToUserRole?: string } = {
      ...r,
      id: dataService.createAutoId('tasks'),
      assignedByUserId: currentUser.id,
      assignedByUserName: currentUser.name,
      createdByUserId: currentUser.id,
      assignedToUserRole: assigneeRole,
      createdAt: new Date().toISOString(),
    };
    setReminders((prev) => [newRem, ...prev]);
    dataService.createTaskDoc(newRem).catch(() => {});
    logActivity('system', 'Task Created', `Assigned task "${r.title}" to ${r.assignedToUserName}`);
    return newRem;
  };

  const updateReminder = (id: string, updates: Partial<ReminderTask>) => {
    const rem = reminders.find((r) => r.id === id);
    if (!rem) return;

    const isAssigner =
      rem.assignedByUserId === currentUser.id || (rem as any).createdByUserId === currentUser.id;
    const isAssignee = rem.assignedToUserId === currentUser.id;
    if (
      currentUser.role !== 'admin' &&
      !(currentUser.role === 'hr_executive' && isAssigner) &&
      !isAssignee
    ) {
      return;
    }

    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
    dataService.updateTaskDoc(id, updates).catch(() => {});
    logActivity('system', 'Task Updated', `Updated task: ${rem.title}`);
  };

  const deleteReminder = (id: string) => {
    if (currentUser.role !== 'admin') return;
    const rem = reminders.find((r) => r.id === id);
    if (!rem) return;

    setReminders((prev) => prev.filter((r) => r.id !== id));
    dataService.deleteTaskToTrash(rem, currentUser).catch(() => {});
    logActivity('system', 'Task Deleted', `Deleted task: ${rem.title}`);
  };

  const toggleReminderStatus = (id: string) => {
    const rem = reminders.find((r) => r.id === id);
    if (!rem) return;

    const isAssignee = rem.assignedToUserId === currentUser.id;
    if (!isAssignee && currentUser.role !== 'admin') return;

    const nextStatus = rem.status === 'Pending' ? 'Completed' : 'Pending';
    const completedAt = nextStatus === 'Completed' ? new Date().toISOString() : undefined;

    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: nextStatus, completedAt } : r))
    );
    dataService.updateTaskDoc(id, { status: nextStatus, completedAt }).catch(() => {});
    logActivity('system', 'Task Completed', `Marked task "${rem.title}" as completed`);
  };

  const snoozeReminder = (id: string, days: number) => {
    const rem = reminders.find((r) => r.id === id);
    if (!rem) return;

    const d = new Date(rem.dueDate);
    d.setDate(d.getDate() + days);
    const dueDate = d.toISOString().split('T')[0];
    const snoozedUntil = new Date().toISOString();

    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, dueDate, snoozedUntil } : r))
    );
    dataService.updateTaskDoc(id, { dueDate, snoozedUntil }).catch(() => {});
  };

  // Notifications
  const notifications = useMemo(() => {
    const list: CRMNotification[] = [];
    const todayStr = new Date().toISOString().split('T')[0];

    visibleInterviews.forEach((item) => {
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
  }, [visibleInterviews, visibleReminders, readNotifIds]);

  const unreadNotificationCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const markNotificationRead = (id: string) => {
    setReadNotifIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const clearAllNotifications = () => {
    setReadNotifIds(notifications.map((n) => n.id));
  };

  // Settings & User Management (Admin only)
  const updateCompanySettings = (settings: Partial<CompanySettings>) => {
    setCompanySettings((prev) => {
      const next = { ...prev, ...settings };
      dataService.saveCompanySettingsDoc(next).catch(() => {});
      return next;
    });
    logActivity('system', 'Settings Updated', 'Updated company profile configuration');
  };

  const addUser = async (u: Omit<User, 'id'>) => {
    if (currentUser.role !== 'admin') {
      throw new Error('Access Restricted: Only Admin can add users.');
    }
    const tempPassword = u.password && u.password.length >= 6 ? u.password : 'bjbright2026';
    const createdUser = await dataService.adminCreateUserAccount(u, tempPassword);
    logActivity(
      'system',
      'User Created',
      `Created Firebase Auth & CRM account for ${createdUser.name} (${createdUser.role.toUpperCase()})`
    );
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    if (currentUser.role !== 'admin') return;
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
    dataService.updateUserDoc(id, updates).catch(() => {});
    logActivity('system', 'User Updated', `Updated account for user ID ${id}`);
  };

  const toggleUserStatus = (id: string) => {
    if (currentUser.role !== 'admin') return;
    const target = users.find((u) => u.id === id);
    if (!target) return;

    if (target.active) {
      const ownedCandidates = candidates.filter((c) => c.assignedRecruiterId === id && !c.deletedAt);
      const ownedJobs = jobs.filter((j) => j.assignedRecruiterIds?.includes(id) && !j.deletedAt);
      const ownedTasks = reminders.filter((r) => r.assignedToUserId === id && r.status === 'Pending');

      if (ownedCandidates.length > 0 || ownedJobs.length > 0 || ownedTasks.length > 0) {
        setReassignmentTargetUser({ user: target, type: 'disable' });
        return;
      }
    }

    const nextActive = !target.active;
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, active: nextActive } : u)));
    dataService.setUserActiveStatus(id, nextActive).catch(() => {});
    logActivity(
      'system',
      nextActive ? 'User Re-enabled' : 'User Access Removed',
      `${nextActive ? 'Re-enabled' : 'Disabled'} access for ${target.name}`
    );
  };

  // Requirement 4: Do not try to delete Firebase Auth accounts from browser; use disable (active=false) instead
  const deleteUser = (id: string) => {
    if (currentUser.role !== 'admin') return;
    const target = users.find((u) => u.id === id);
    if (!target) return;
    if (target.active) {
      toggleUserStatus(id);
    }
  };

  const reassignAndResolveUser = (
    oldUserId: string,
    newUserId: string,
    _actionType: 'disable' | 'delete'
  ) => {
    const newUser = users.find((u) => u.id === newUserId);
    if (!newUser) return;

    candidates
      .filter((c) => c.assignedRecruiterId === oldUserId && !c.deletedAt)
      .forEach((c) => {
        dataService
          .updateCandidateDoc(
            c.id,
            { assignedRecruiterId: newUser.id, assignedRecruiterName: newUser.name },
            `Reassigned from disabled user to ${newUser.name}`
          )
          .catch(() => {});
      });

    jobs
      .filter((j) => j.assignedRecruiterIds?.includes(oldUserId) && !j.deletedAt)
      .forEach((j) => {
        const nextIds = j.assignedRecruiterIds?.map((id) => (id === oldUserId ? newUser.id : id));
        const oldName = users.find((u) => u.id === oldUserId)?.name;
        const nextNames = j.assignedRecruiterNames?.map((n) => (n === oldName ? newUser.name : n));
        dataService
          .updateJobDoc(
            j.id,
            { assignedRecruiterIds: nextIds, assignedRecruiterNames: nextNames },
            `Reassigned from disabled user to ${newUser.name}`
          )
          .catch(() => {});
      });

    reminders
      .filter((r) => r.assignedToUserId === oldUserId && r.status === 'Pending')
      .forEach((r) => {
        dataService
          .updateTaskDoc(r.id, { assignedToUserId: newUser.id, assignedToUserName: newUser.name })
          .catch(() => {});
      });

    dataService.setUserActiveStatus(oldUserId, false).catch(() => {});
    logActivity(
      'system',
      'User Access Removed & Reassigned',
      `Set active=false and reassigned records to ${newUser.name}`
    );
    setReassignmentTargetUser(null);
  };

  const saveFirebaseSettings = (_cfg: FirebaseConfig) => {};
  const removeFirebaseSettings = () => {};

  const resetAllData = () => {
    if (currentUser.role !== 'admin') return;
    loadStarterData().catch(() => {});
  };

  const downloadDemoData = () => {
    if (currentUser.role !== 'admin') return;
    const jsonString = dataService.exportAllDemoDataAsJson();
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    link.href = url;
    link.download = `bj-bright-crm-backup-${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    logActivity('system', 'CRM Data Backup Downloaded', 'Downloaded JSON snapshot of Firestore data');
  };

  return (
    <CRMContext.Provider
      value={{
        authLoading,
        isAuthenticated,
        accessDeniedMessage,
        clearAccessDeniedMessage,
        syncStatus,
        loginWithFirebase,
        logoutFromFirebase,
        sendForgotPasswordEmail,
        loadStarterData,
        migrationNotice,
        clearMigrationNotice,
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
        isFirebaseConfigured: true,
        firebaseConfig: FIREBASE_CONFIG,
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
