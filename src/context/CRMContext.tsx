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
} from '../types/crm';
import {
  INITIAL_USERS,
  INITIAL_CLIENTS,
  INITIAL_JOBS,
  INITIAL_CANDIDATES,
  INITIAL_PIPELINE,
  INITIAL_INTERVIEWS,
  INITIAL_ACTIVITIES,
  INITIAL_COMPANY_SETTINGS,
  INITIAL_REMINDERS,
} from '../lib/mockData';
import {
  getSavedFirebaseConfig,
  getActiveFirebaseConfig,
  saveFirebaseConfig,
  clearFirebaseConfig,
  initializeFirebaseServices,
  getFirebaseAuth,
  getFirebaseDb,
  withSecondaryAuth,
  friendlyFirebaseError,
  FirebaseConfigOptions,
} from '../lib/firebase';
import { FIRST_ADMIN_EMAIL } from '../lib/firebaseConfig';
import { useCollectionSync } from '../lib/firestoreSync';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc, setDoc, orderBy, limit } from 'firebase/firestore';

interface CRMContextType {
  currentUser: User;
  switchUser: (userId: string) => void;
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
  bulkImportCandidates: (newCandidates: Partial<Candidate>[]) => number;
  checkDuplicate: (phone: string, email: string, currentId?: string) => Candidate | undefined;

  // Bulk candidate actions
  bulkUpdateCandidateStatus: (candidateIds: string[], newStatus: CandidateStatus, remark?: string) => void;
  bulkAssignRecruiter: (candidateIds: string[], recruiterId: string, recruiterName: string) => void;
  bulkDeleteCandidates: (candidateIds: string[]) => void;

  // Clients
  clients: Client[];
  visibleClients: Client[];
  trashClients: Client[];
  addClient: (c: Omit<Client, 'id' | 'createdAt' | 'activeJobsCount' | 'placedCandidatesCount'>) => void;
  updateClient: (id: string, updates: Partial<Client>, reason?: string) => void;
  deleteClient: (id: string) => void;
  restoreClient: (id: string) => void;
  bulkImportClients: (newClients: Partial<Client>[]) => number;

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
  movePipelineStage: (id: string, newStage: PipelineStage, remark?: string) => void;
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

  // Firebase auth + sync
  firebaseAuthActive: boolean; // true when Firebase is configured (real login + cloud sync)
  authReady: boolean;
  isAuthenticated: boolean;
  authError: string;
  syncReady: boolean;
  syncError: string;
  dismissSyncError: () => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  sendPasswordSetupEmail: (email: string) => Promise<void>;

  // Firebase
  isFirebaseConfigured: boolean;
  firebaseConfig: FirebaseConfigOptions | null;
  saveFirebaseSettings: (cfg: FirebaseConfigOptions) => void;
  removeFirebaseSettings: () => void;
  resetAllData: () => void;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export const CRMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('bj_theme') === 'dark';
  });

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('bj_theme', next ? 'dark' : 'light');
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

  const loadStored = <T,>(key: string, fallback: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  };

  const [users, setUsers] = useState<User[]>(() => loadStored('bj_users', INITIAL_USERS));
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return localStorage.getItem('bj_current_user_id') || 'usr_admin';
  });

  const currentUser = useMemo(() => {
    const found = users.find((u) => u.id === currentUserId);
    if (found && !found.active) {
      // If current user is disabled, fallback to admin or first active user
      const activeUser = users.find((u) => u.active) || users[0];
      return activeUser;
    }
    return found || users[0] || INITIAL_USERS[0];
  }, [users, currentUserId]);

  const switchUser = (userId: string) => {
    if (getFirebaseAuth() && getActiveFirebaseConfig()) return; // real login: role switching is for offline demo only
    const target = users.find((u) => u.id === userId);
    if (target && !target.active) {
      alert('This user account is disabled by Admin.');
      return;
    }
    setCurrentUserId(userId);
    localStorage.setItem('bj_current_user_id', userId);
    if (target) {
      logActivity(
        'system',
        'User Switched',
        `Switched active role to ${target.name} (${target.role.toUpperCase()})`
      );
    }
  };

  const [candidates, setCandidates] = useState<Candidate[]>(() =>
    loadStored('bj_candidates', INITIAL_CANDIDATES)
  );
  const [clients, setClients] = useState<Client[]>(() => loadStored('bj_clients', INITIAL_CLIENTS));
  const [jobs, setJobs] = useState<JobOpening[]>(() => loadStored('bj_jobs', INITIAL_JOBS));
  const [pipeline, setPipeline] = useState<PipelineItem[]>(() =>
    loadStored('bj_pipeline', INITIAL_PIPELINE)
  );
  const [interviews, setInterviews] = useState<Interview[]>(() =>
    loadStored('bj_interviews', INITIAL_INTERVIEWS)
  );
  const [activities, setActivities] = useState<ActivityLogItem[]>(() =>
    loadStored('bj_activities', INITIAL_ACTIVITIES)
  );
  const [companySettings, setCompanySettings] = useState<CompanySettings>(() =>
    loadStored('bj_settings', INITIAL_COMPANY_SETTINGS)
  );
  const [reminders, setReminders] = useState<ReminderTask[]>(() =>
    loadStored('bj_reminders', INITIAL_REMINDERS)
  );
  const [editHistories, setEditHistories] = useState<EditHistoryItem[]>(() =>
    loadStored('bj_edit_histories', [])
  );
  const [readNotifIds, setReadNotifIds] = useState<string[]>(() =>
    loadStored('bj_read_notifs', [])
  );
  const [exportLogs, setExportLogs] = useState<ExportLogItem[]>(() =>
    loadStored('bj_export_logs', [])
  );
  const [importLogs, setImportLogs] = useState<ImportLogItem[]>(() =>
    loadStored('bj_import_logs', [])
  );

  const [reassignmentTargetUser, setReassignmentTargetUser] = useState<{ user: User; type: 'disable' | 'delete' } | null>(null);

  // Firebase state
  const [firebaseConfig, setFirebaseConfig] = useState<FirebaseConfigOptions | null>(() =>
    getActiveFirebaseConfig()
  );
  const [isFirebaseConfigured, setIsFirebaseConfigured] = useState<boolean>(() => {
    const s = initializeFirebaseServices();
    return s.isConfigured;
  });

  // Firebase Auth state
  const [authReady, setAuthReady] = useState<boolean>(() => !isFirebaseConfigured);
  const [fbUid, setFbUid] = useState<string | null>(null);
  const [profileReady, setProfileReady] = useState(false);
  const [authError, setAuthError] = useState('');
  const [syncError, setSyncError] = useState('');

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const auth = getFirebaseAuth();
    const db = getFirebaseDb();
    if (!auth || !db) return;

    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setFbUid(null);
        setProfileReady(false);
        setAuthReady(true);
        return;
      }
      try {
        const ref = doc(db, 'users', fbUser.uid);
        const snap = await getDoc(ref);
        const email = (fbUser.email || '').toLowerCase();
        let profile: User;

        if (!snap.exists()) {
          if (email === FIRST_ADMIN_EMAIL.toLowerCase()) {
            // first ever login of the owner: create the admin profile
            profile = {
              id: fbUser.uid,
              name: fbUser.displayName || 'Admin',
              email,
              role: 'admin',
              phone: '',
              avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
              designation: 'Admin',
              active: true,
            };
            await setDoc(ref, profile);
          } else {
            await signOut(auth);
            setAuthError('Access denied. Only users added by Admin can log in.');
            setAuthReady(true);
            return;
          }
        } else {
          profile = { ...(snap.data() as User), id: fbUser.uid };
        }

        if (!profile.active) {
          await signOut(auth);
          setAuthError('Your account has been disabled by Admin. Please contact administrator.');
          setAuthReady(true);
          return;
        }

        setAuthError('');
        setUsers([profile]);
        setCurrentUserId(fbUser.uid);
        setFbUid(fbUser.uid);
        setProfileReady(true);
      } catch (e) {
        setAuthError(friendlyFirebaseError(e));
        try {
          await signOut(auth);
        } catch {
          /* ignore */
        }
      } finally {
        setAuthReady(true);
      }
    });
    return () => unsub();
  }, [isFirebaseConfigured]);

  const syncEnabled = isFirebaseConfigured && profileReady;
  const onSyncError = (msg: string) => setSyncError(msg);
  const isAdminUser = currentUser.role === 'admin';

  const usersSync = useCollectionSync<User>({
    name: 'users', items: users, setItems: setUsers, enabled: syncEnabled,
    allowDelete: isAdminUser, allowWrite: isAdminUser, exclude: ['password'], onError: onSyncError,
  });
  const candidatesSync = useCollectionSync<Candidate>({
    name: 'candidates', items: candidates, setItems: setCandidates, enabled: syncEnabled, allowDelete: isAdminUser, onError: onSyncError,
  });
  const clientsSync = useCollectionSync<Client>({
    name: 'clients', items: clients, setItems: setClients, enabled: syncEnabled, allowDelete: isAdminUser, onError: onSyncError,
  });
  const jobsSync = useCollectionSync<JobOpening>({
    name: 'jobs', items: jobs, setItems: setJobs, enabled: syncEnabled, allowDelete: isAdminUser, onError: onSyncError,
  });
  const pipelineSync = useCollectionSync<PipelineItem>({
    name: 'pipeline', items: pipeline, setItems: setPipeline, enabled: syncEnabled, allowDelete: true, onError: onSyncError,
  });
  const interviewsSync = useCollectionSync<Interview>({
    name: 'interviews', items: interviews, setItems: setInterviews, enabled: syncEnabled, allowDelete: true, onError: onSyncError,
  });
  const remindersSync = useCollectionSync<ReminderTask>({
    name: 'reminders', items: reminders, setItems: setReminders, enabled: syncEnabled, allowDelete: true, onError: onSyncError,
  });
  const activitiesSync = useCollectionSync<ActivityLogItem>({
    name: 'activities', items: activities, setItems: setActivities, enabled: syncEnabled,
    constraints: [orderBy('timestamp', 'desc'), limit(500)], onError: onSyncError,
  });
  const editHistoriesSync = useCollectionSync<EditHistoryItem>({
    name: 'editHistories', items: editHistories, setItems: setEditHistories, enabled: syncEnabled,
    constraints: [orderBy('timestamp', 'desc'), limit(1000)], onError: onSyncError,
  });
  const exportLogsSync = useCollectionSync<ExportLogItem>({
    name: 'exportLogs', items: exportLogs, setItems: setExportLogs, enabled: syncEnabled,
    constraints: [orderBy('timestamp', 'desc'), limit(500)], onError: onSyncError,
  });
  const importLogsSync = useCollectionSync<ImportLogItem>({
    name: 'importLogs', items: importLogs, setItems: setImportLogs, enabled: syncEnabled,
    constraints: [orderBy('timestamp', 'desc'), limit(500)], onError: onSyncError,
  });

  // company settings live in a single document: settings/company
  const settingsItems = useMemo(() => [{ ...companySettings, id: 'company' }], [companySettings]);
  const settingsSync = useCollectionSync<CompanySettings & { id: string }>({
    name: 'settings',
    items: settingsItems,
    setItems: (list) => {
      const c = list.find((i) => i.id === 'company');
      if (c) {
        const { id: _id, ...rest } = c;
        setCompanySettings(rest as CompanySettings);
      }
    },
    enabled: syncEnabled,
    allowWrite: isAdminUser,
    onError: onSyncError,
  });

  const syncReady =
    syncEnabled &&
    usersSync.loaded && candidatesSync.loaded && clientsSync.loaded && jobsSync.loaded &&
    pipelineSync.loaded && interviewsSync.loaded && remindersSync.loaded && activitiesSync.loaded &&
    editHistoriesSync.loaded && exportLogsSync.loaded && importLogsSync.loaded && settingsSync.loaded;

  // if the admin disables / deletes the logged-in user, sign them out
  useEffect(() => {
    if (!syncReady || !fbUid) return;
    const me = users.find((u) => u.id === fbUid);
    if (!me || !me.active) {
      const auth = getFirebaseAuth();
      if (auth) signOut(auth).finally(() => window.location.reload());
    }
  }, [syncReady, fbUid, users]);

  const login = async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase is not configured.');
    setAuthError('');
    await signInWithEmailAndPassword(auth, email.trim(), password);
  };

  const logout = async () => {
    const auth = getFirebaseAuth();
    try {
      if (auth) await signOut(auth);
    } finally {
      localStorage.removeItem('bj_logged_in');
      window.location.reload(); // clears all in-memory company data
    }
  };

  const sendPasswordSetupEmail = async (email: string) => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase is not configured.');
    await sendPasswordResetEmail(auth, email.trim());
  };

  const [viewAllToggle, setViewAllToggle] = useState<boolean>(false);

  // Save to localStorage
  useEffect(() => {
    if (isFirebaseConfigured) return; // cloud mode: data lives in Firestore, not in the browser
    localStorage.setItem('bj_users', JSON.stringify(users));
  }, [users]);
  useEffect(() => {
    if (isFirebaseConfigured) return; // cloud mode: data lives in Firestore, not in the browser
    localStorage.setItem('bj_candidates', JSON.stringify(candidates));
  }, [candidates]);
  useEffect(() => {
    if (isFirebaseConfigured) return; // cloud mode: data lives in Firestore, not in the browser
    localStorage.setItem('bj_clients', JSON.stringify(clients));
  }, [clients]);
  useEffect(() => {
    if (isFirebaseConfigured) return; // cloud mode: data lives in Firestore, not in the browser
    localStorage.setItem('bj_jobs', JSON.stringify(jobs));
  }, [jobs]);
  useEffect(() => {
    if (isFirebaseConfigured) return; // cloud mode: data lives in Firestore, not in the browser
    localStorage.setItem('bj_pipeline', JSON.stringify(pipeline));
  }, [pipeline]);
  useEffect(() => {
    if (isFirebaseConfigured) return; // cloud mode: data lives in Firestore, not in the browser
    localStorage.setItem('bj_interviews', JSON.stringify(interviews));
  }, [interviews]);
  useEffect(() => {
    if (isFirebaseConfigured) return; // cloud mode: data lives in Firestore, not in the browser
    localStorage.setItem('bj_activities', JSON.stringify(activities));
  }, [activities]);
  useEffect(() => {
    if (isFirebaseConfigured) return; // cloud mode: data lives in Firestore, not in the browser
    localStorage.setItem('bj_settings', JSON.stringify(companySettings));
  }, [companySettings]);
  useEffect(() => {
    if (isFirebaseConfigured) return; // cloud mode: data lives in Firestore, not in the browser
    localStorage.setItem('bj_reminders', JSON.stringify(reminders));
  }, [reminders]);
  useEffect(() => {
    if (isFirebaseConfigured) return; // cloud mode: data lives in Firestore, not in the browser
    localStorage.setItem('bj_edit_histories', JSON.stringify(editHistories));
  }, [editHistories]);
  useEffect(() => {
    localStorage.setItem('bj_read_notifs', JSON.stringify(readNotifIds));
  }, [readNotifIds]);
  useEffect(() => {
    if (isFirebaseConfigured) return; // cloud mode: data lives in Firestore, not in the browser
    localStorage.setItem('bj_export_logs', JSON.stringify(exportLogs));
  }, [exportLogs]);
  useEffect(() => {
    if (isFirebaseConfigured) return; // cloud mode: data lives in Firestore, not in the browser
    localStorage.setItem('bj_import_logs', JSON.stringify(importLogs));
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
  const trashClients = useMemo(() => clients.filter((c) => c.deletedAt), [clients]);
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

  const bulkUpdateCandidateStatus = (candidateIds: string[], newStatus: CandidateStatus, remark?: string) => {
    const idSet = new Set(candidateIds);
    const nowIso = new Date().toISOString();
    setCandidates((prev) =>
      prev.map((c) => {
        if (!idSet.has(c.id)) return c;
        const oldStatus = c.status;
        const changes = [
          { field: 'status', oldValue: oldStatus, newValue: newStatus },
          ...(remark ? [{ field: 'statusRemark', oldValue: c.statusRemark || '', newValue: remark }] : []),
        ];
        addEditHistory(c.id, 'candidate', `Bulk status changed to ${newStatus}${remark ? `: ${remark}` : ''}`, changes);
        return {
          ...c,
          status: newStatus,
          ...(remark
            ? {
                statusRemark: remark,
                statusRemarkAt: nowIso,
                statusRemarkBy: currentUser.name,
              }
            : {}),
          updatedAt: nowIso,
        };
      })
    );
    logActivity(
      'candidate',
      'Bulk Status Update',
      `Updated ${candidateIds.length} candidates to status: ${newStatus}${remark ? ` (Remark: ${remark})` : ''}`
    );
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
          ...(item.jobTitle ? { jobTitle: item.jobTitle.trim(), isCustomPosition: item.isCustomPosition ?? true } : {}),
          ...(item.remarks ? { remarks: item.remarks.trim() } : {}),
          ...(item.statusRemark
            ? {
                statusRemark: item.statusRemark.trim(),
                statusRemarkAt: item.statusRemarkAt || new Date().toISOString(),
                statusRemarkBy: item.statusRemarkBy || currentUser.name,
              }
            : {}),
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
          ...(r.data.jobTitle ? { jobTitle: r.data.jobTitle.trim(), isCustomPosition: r.data.isCustomPosition ?? true } : {}),
          ...(r.data.clientName ? { clientName: r.data.clientName.trim() } : {}),
          ...(r.data.expectedJoiningDate ? { expectedJoiningDate: r.data.expectedJoiningDate.trim() } : {}),
          ...(r.data.remarks ? { remarks: r.data.remarks.trim() } : {}),
          ...(r.data.statusRemark
            ? {
                statusRemark: r.data.statusRemark.trim(),
                statusRemarkAt: r.data.statusRemarkAt || new Date().toISOString(),
                statusRemarkBy: r.data.statusRemarkBy || currentUser.name,
              }
            : {}),
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
            const rawUpdates = updatesMap.get(c.id)!;
            const updates: Partial<Candidate> = {};
            Object.keys(rawUpdates).forEach((k) => {
              const val = (rawUpdates as any)[k];
              if (val !== undefined) {
                (updates as any)[k] = val;
              }
            });
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

  // Client Actions
  const addClient = (c: Omit<Client, 'id' | 'createdAt' | 'activeJobsCount' | 'placedCandidatesCount'>) => {
    const newClient: Client = {
      ...c,
      id: `cli_${Date.now()}`,
      createdAt: new Date().toISOString(),
      activeJobsCount: 0,
      placedCandidatesCount: 0,
    };
    setClients((prev) => [newClient, ...prev]);
    logActivity('client', 'Client Onboarded', `Onboarded client company: ${c.name}`);
  };

  const updateClient = (id: string, updates: Partial<Client>, reason = 'Client updated details') => {
    const old = clients.find((c) => c.id === id);
    if (!old) return;

    const changes: { field: string; oldValue: any; newValue: any }[] = [];
    Object.keys(updates).forEach((key) => {
      const k = key as keyof Client;
      if (JSON.stringify(old[k]) !== JSON.stringify(updates[k])) {
        changes.push({ field: k, oldValue: old[k], newValue: updates[k] });
      }
    });
    if (changes.length > 0) {
      addEditHistory(id, 'client', reason || 'Client updated details', changes);
    }

    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    logActivity('client', 'Client Updated', `Updated client ${old.name}. Reason: ${reason}`);
  };

  const deleteClient = (id: string) => {
    if (currentUser.role !== 'admin') {
      alert('Access Restricted: Only Admin can delete records.');
      return;
    }
    const target = clients.find((c) => c.id === id);
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, deletedAt: new Date().toISOString() } : c)));
    logActivity('client', 'Client Moved to Trash', `Moved client ${target?.name || id} to Trash`);
  };

  const restoreClient = (id: string) => {
    if (currentUser.role !== 'admin') return;
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, deletedAt: undefined } : c)));
    logActivity('client', 'Client Restored', `Restored client ID ${id}`);
  };

  const bulkImportClients = (newItems: Partial<Client>[]): number => {
    let imported = 0;
    const toAdd: Client[] = [];
    newItems.forEach((item) => {
      if (item.name) {
        toAdd.push({
          id: `cli_bulk_${Date.now()}_${imported}`,
          name: item.name,
          industry: item.industry || 'Information Technology',
          address: item.address || 'Sector 62',
          city: item.city || 'Noida',
          website: item.website || 'https://example.com',
          contactPersons: item.contactPersons || [{ id: 'cp_1', name: 'HR Head', designation: 'HR', phone: '+91 98110 00000', email: 'hr@example.com' }],
          agreementDetails: item.agreementDetails || 'Standard SLA',
          commissionPercent: Number(item.commissionPercent) || 8.33,
          paymentTerms: item.paymentTerms || '30 days net',
          status: 'Active',
          createdAt: new Date().toISOString(),
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
  const movePipelineStage = (id: string, newStage: PipelineStage, remark?: string) => {
    const item = pipeline.find((p) => p.id === id);
    setPipeline((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stage: newStage, updatedAt: new Date().toISOString(), lastMovedBy: currentUser.name } : p))
    );
    if (item) {
      const stageToStatusMap: Record<PipelineStage, CandidateStatus> = {
        Sourced: 'New',
        Screened: 'Screened',
        'Submitted to Client': 'Shortlisted',
        Interview: 'Interview Scheduled',
        Offer: 'Offered',
        Joined: 'Joined',
        Rejected: 'Rejected',
      };
      const candStatus = stageToStatusMap[newStage];
      if (candStatus) {
        const trimmedRemark = remark?.trim();
        updateCandidate(
          item.candidateId,
          {
            status: candStatus,
            ...(trimmedRemark
              ? {
                  statusRemark: trimmedRemark,
                  statusRemarkAt: new Date().toISOString(),
                  statusRemarkBy: currentUser.name,
                }
              : {}),
          },
          `Pipeline stage moved to ${newStage}${trimmedRemark ? `: "${trimmedRemark}"` : ''}`
        );
        if (trimmedRemark) {
          addCandidateNote(item.candidateId, `Pipeline stage moved to ${newStage} — Remark: ${trimmedRemark}`);
        }
      }
    }
    logActivity('candidate', 'Pipeline Stage Moved', `Moved candidate stage to ${newStage}${remark ? ` (Remark: ${remark})` : ''}`);
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
    if (isFirebaseConfigured) {
      // Real account: Firebase Auth user with a random password; the person sets their own via the emailed link
      (async () => {
        try {
          const email = u.email.trim().toLowerCase();
          const tempPassword = `${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}Aa1!`;
          const cred = await withSecondaryAuth((a) => createUserWithEmailAndPassword(a, email, tempPassword));
          const { password: _pw, ...rest } = u;
          setUsers((prev) => [...prev, { ...rest, email, id: cred.user.uid, active: true }]);
          logActivity('system', 'User Created', `Added team member ${u.name} as ${u.role.toUpperCase()}`);
          try {
            await sendPasswordSetupEmail(email);
            alert(`User created. A password-setup email was sent to ${email}.`);
          } catch (e) {
            alert(`User created, but the password email failed: ${friendlyFirebaseError(e)}. Use "Forgot password" on the login screen.`);
          }
        } catch (e) {
          alert(`Could not create user: ${friendlyFirebaseError(e)}`);
        }
      })();
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
    let safeUpdates = updates;
    if (isFirebaseConfigured) {
      const { password: _pw, email: _em, ...rest } = updates; // login email/password are managed by Firebase Auth
      safeUpdates = rest;
      if (_em !== undefined || _pw) {
        alert('Note: login email and password are managed by Firebase. Use "Forgot password" to reset a password. Other changes were saved.');
      }
    }
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...safeUpdates } : u)));
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

  // Firebase config
  const saveFirebaseSettings = (cfg: FirebaseConfigOptions) => {
    saveFirebaseConfig(cfg);
    setFirebaseConfig(cfg);
    const s = initializeFirebaseServices(cfg);
    setIsFirebaseConfigured(s.isConfigured);
    setTimeout(() => window.location.reload(), 1600); // restart so login + sync start with the new project
  };

  const removeFirebaseSettings = () => {
    clearFirebaseConfig();
    setFirebaseConfig(null);
    setIsFirebaseConfigured(false);
    setTimeout(() => window.location.reload(), 300);
  };

  const resetAllData = () => {
    if (currentUser.role !== 'admin') {
      alert('Access Restricted: Only Admin can reset system data.');
      return;
    }
    if (isFirebaseConfigured) {
      alert('Reset is disabled while connected to Firebase, because it would overwrite the live cloud data.');
      return;
    }
    setUsers(INITIAL_USERS);
    setClients(INITIAL_CLIENTS);
    setJobs(INITIAL_JOBS);
    setCandidates(INITIAL_CANDIDATES);
    setPipeline(INITIAL_PIPELINE);
    setInterviews(INITIAL_INTERVIEWS);
    setActivities(INITIAL_ACTIVITIES);
    setCompanySettings(INITIAL_COMPANY_SETTINGS);
    setReminders(INITIAL_REMINDERS);
    setEditHistories([]);
    setReadNotifIds([]);
    localStorage.clear();
    logActivity('system', 'System Reset', 'Restored initial production demo dataset');
  };

  return (
    <CRMContext.Provider
      value={{
        currentUser,
        switchUser,
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
        firebaseAuthActive: isFirebaseConfigured,
        authReady,
        isAuthenticated: !!fbUid && profileReady,
        authError,
        syncReady,
        syncError,
        dismissSyncError: () => setSyncError(''),
        login,
        logout,
        sendPasswordSetupEmail,
        isFirebaseConfigured,
        firebaseConfig,
        saveFirebaseSettings,
        removeFirebaseSettings,
        resetAllData,
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
