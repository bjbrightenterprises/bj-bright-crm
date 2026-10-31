import {
  Candidate,
  Client,
  JobOpening,
  PipelineItem,
  Interview,
  ActivityLogItem,
  User,
  CompanySettings,
  ReminderTask,
  EditHistoryItem,
  ExportLogItem,
  ImportLogItem,
  getClientSection,
  sectionToClientStatus,
} from '../types/crm';
import { buildSeedData } from './mockData';

const STORAGE_KEYS = {
  SEED_VERSION: 'bj_production_live_v2',
  THEME: 'bj_theme',
  USERS: 'bj_users',
  CANDIDATES: 'bj_candidates',
  CLIENTS: 'bj_clients',
  JOBS: 'bj_jobs',
  PIPELINE: 'bj_pipeline',
  INTERVIEWS: 'bj_interviews',
  REMINDERS: 'bj_reminders',
  ACTIVITIES: 'bj_activities',
  SETTINGS: 'bj_settings',
  EDIT_HISTORIES: 'bj_edit_histories',
  READ_NOTIFS: 'bj_read_notifs',
  EXPORT_LOGS: 'bj_export_logs',
  IMPORT_LOGS: 'bj_import_logs',
} as const;

const SESSION_KEYS = {
  LOGGED_IN: 'bj_session_logged_in',
  CURRENT_USER_ID: 'bj_session_user_id',
  LAST_EMAIL: 'bj_session_last_email',
} as const;

const DEMO_USER_IDS = new Set(['usr_manager', 'usr_hr', 'usr_recruiter']);
const DEMO_USER_EMAILS = new Set([
  'manager@demo.bjbright.com',
  'hr@demo.bjbright.com',
  'recruiter@demo.bjbright.com',
  'manager@bjbright.com',
  'hr@bjbright.com',
  'recruiter@bjbright.com',
]);

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota / private browsing errors
  }
}

function normalizeClients(raw: any[]): Client[] {
  return raw.map((c) => {
    const sec = c.section || getClientSection(c);
    const baseDate = (c.createdAt || new Date().toISOString()).slice(0, 10);
    const rawContacts = Array.isArray(c.contactPersons)
      ? c.contactPersons
      : Array.isArray(c.hrContacts)
      ? c.hrContacts
      : [];
    const rawRemarks = Array.isArray(c.remarks)
      ? c.remarks.map((r: any) => ({
          id: r.id || `crem_${Date.now()}`,
          clientId: r.clientId || c.id,
          section: r.section || sec,
          text: r.text || '',
          authorUserId: r.authorUserId || r.createdByUserId || 'usr_admin',
          authorName: r.authorName || r.createdByUserName || 'Praveen Verma',
          authorRole: r.authorRole || 'admin',
          createdAt: r.createdAt || new Date().toISOString(),
        }))
      : [];

    return {
      ...c,
      name: c.name || c.companyName || 'Unnamed Company',
      contactPersons: rawContacts,
      agreementDetails: c.agreementDetails || 'Standard placement agreement',
      commissionPercent:
        typeof c.commissionPercent === 'number'
          ? c.commissionPercent
          : typeof c.commissionPercentage === 'number'
          ? c.commissionPercentage
          : 8.33,
      assignedAccountManagerId:
        c.assignedAccountManagerId || c.assignedRecruiterId || 'usr_admin',
      assignedAccountManagerName:
        c.assignedAccountManagerName || c.assignedRecruiterName || 'Praveen Verma',
      section: sec,
      status: sectionToClientStatus(sec),
      enquiryDate: c.enquiryDate || baseDate,
      lastContactedDate: c.lastContactedDate || (sec !== 'Red' ? baseDate : undefined),
      agreementSignedDate: c.agreementSignedDate || (sec === 'Green' ? baseDate : undefined),
      remarks: rawRemarks,
    };
  });
}

const DEMO_CANDIDATE_IDS = new Set([
  'cand_1', 'cand_2', 'cand_3', 'cand_4', 'cand_5',
  'cand_6', 'cand_7', 'cand_8', 'cand_9', 'cand_10',
  'cand_11', 'cand_12', 'cand_13', 'cand_14', 'cand_15',
  'cand_16', 'cand_17', 'cand_18', 'cand_19', 'cand_20',
  'cand_21', 'cand_22',
]);

export const dataService = {
  // Initialize production company & job mandate data while stripping old demo sample candidates & demo accounts
  ensureSeedDataInitialized(): void {
    try {
      const isProductionSeeded = localStorage.getItem(STORAGE_KEYS.SEED_VERSION) === 'true';
      if (!isProductionSeeded) {
        const seed = buildSeedData();
        // Preserve any real user-added clients/jobs and merge all 9 Green/Blue companies & 13 job mandates
        const existingClients = readJson<any[]>(STORAGE_KEYS.CLIENTS, []);
        const seedClientMap = new Map(seed.clients.map((sc) => [sc.id, sc]));
        const mergedClients = existingClients.length > 0
          ? [
              ...existingClients.map((c) => {
                const sm = seedClientMap.get(c.id);
                return sm ? { ...sm, ...c, agreementDetails: c.agreementDetails || sm.agreementDetails, activeJobsCount: sm.activeJobsCount } : c;
              }),
              ...seed.clients.filter((sc) => !existingClients.some((ec) => ec.id === sc.id)),
            ]
          : seed.clients;

        const existingJobs = readJson<JobOpening[]>(STORAGE_KEYS.JOBS, []);
        const seedJobMap = new Map(seed.jobs.map((sj) => [sj.id, sj]));
        const mergedJobs = existingJobs.length > 0
          ? [
              ...existingJobs.map((j) => {
                const sj = seedJobMap.get(j.id);
                return sj
                  ? {
                      ...sj,
                      ...j,
                      title: sj.title,
                      description: j.description || sj.description,
                      assignedRecruiterIds: ['usr_admin'],
                      assignedRecruiterNames: ['Praveen Verma'],
                    }
                  : j;
              }),
              ...seed.jobs.filter((sj) => !existingJobs.some((ej) => ej.id === sj.id)),
            ]
          : seed.jobs;

        // Keep only non-demo candidates/pipeline/interviews/reminders if user added any real ones
        const existingCandidates = readJson<Candidate[]>(STORAGE_KEYS.CANDIDATES, []).filter(
          (c) => !DEMO_CANDIDATE_IDS.has(c.id)
        );
        const existingPipeline = readJson<PipelineItem[]>(STORAGE_KEYS.PIPELINE, []).filter(
          (p) => !DEMO_CANDIDATE_IDS.has(p.candidateId) && !p.id.startsWith('pipe_')
        );
        const existingInterviews = readJson<Interview[]>(STORAGE_KEYS.INTERVIEWS, []).filter(
          (i) => !DEMO_CANDIDATE_IDS.has(i.candidateId) && !['int_1', 'int_2', 'int_3', 'int_4', 'int_5'].includes(i.id)
        );
        const existingReminders = readJson<ReminderTask[]>(STORAGE_KEYS.REMINDERS, []).filter(
          (r) => !['rem_1', 'rem_2', 'rem_3', 'rem_4', 'rem_5'].includes(r.id)
        );

        // Keep Admin and any custom staff added by Admin, removing the 3 demo accounts
        const existingUsers = readJson<User[]>(STORAGE_KEYS.USERS, []).filter(
          (u) => !DEMO_USER_IDS.has(u.id) && !DEMO_USER_EMAILS.has(u.email.toLowerCase()) && u.id !== 'usr_admin'
        );
        const cleanedUsers = [...seed.users, ...existingUsers];

        writeJson(STORAGE_KEYS.USERS, cleanedUsers);
        writeJson(STORAGE_KEYS.SETTINGS, seed.companySettings);
        writeJson(STORAGE_KEYS.CLIENTS, normalizeClients(mergedClients));
        writeJson(STORAGE_KEYS.JOBS, mergedJobs);
        writeJson(STORAGE_KEYS.CANDIDATES, existingCandidates);
        writeJson(STORAGE_KEYS.PIPELINE, existingPipeline);
        writeJson(STORAGE_KEYS.INTERVIEWS, existingInterviews);
        writeJson(STORAGE_KEYS.REMINDERS, existingReminders);

        // Ensure current session points to usr_admin if it pointed to a removed demo user
        const currentSessionUser = sessionStorage.getItem(SESSION_KEYS.CURRENT_USER_ID);
        if (currentSessionUser && DEMO_USER_IDS.has(currentSessionUser)) {
          sessionStorage.setItem(SESSION_KEYS.CURRENT_USER_ID, 'usr_admin');
        }

        localStorage.setItem(STORAGE_KEYS.SEED_VERSION, 'true');
      }
    } catch {
      // Ignore initialization errors
    }
  },

  // Restore / Sync Default Company & Job Mandate Data
  resetToDemoSeedData() {
    const seed = buildSeedData();
    const normalizedClients = normalizeClients(seed.clients);
    writeJson(STORAGE_KEYS.USERS, seed.users);
    writeJson(STORAGE_KEYS.SETTINGS, seed.companySettings);
    writeJson(STORAGE_KEYS.CLIENTS, normalizedClients);
    writeJson(STORAGE_KEYS.JOBS, seed.jobs);
    writeJson(STORAGE_KEYS.CANDIDATES, seed.candidates);
    writeJson(STORAGE_KEYS.PIPELINE, seed.pipeline);
    writeJson(STORAGE_KEYS.INTERVIEWS, seed.interviews);
    writeJson(STORAGE_KEYS.REMINDERS, seed.reminders);
    writeJson(STORAGE_KEYS.ACTIVITIES, seed.activities);
    writeJson(STORAGE_KEYS.EDIT_HISTORIES, []);
    writeJson(STORAGE_KEYS.READ_NOTIFS, []);
    writeJson(STORAGE_KEYS.EXPORT_LOGS, []);
    writeJson(STORAGE_KEYS.IMPORT_LOGS, []);
    try {
      localStorage.setItem(STORAGE_KEYS.SEED_VERSION, 'true');
    } catch {
      // Ignore
    }
    return {
      ...seed,
      clients: normalizedClients,
    };
  },

  // Theme preference
  getTheme(): 'dark' | 'light' {
    try {
      return localStorage.getItem(STORAGE_KEYS.THEME) === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  },
  setTheme(theme: 'dark' | 'light'): void {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch {
      // Ignore
    }
  },

  // Session management (sessionStorage as required)
  isSessionLoggedIn(): boolean {
    try {
      return sessionStorage.getItem(SESSION_KEYS.LOGGED_IN) === 'true';
    } catch {
      return false;
    }
  },
  getSessionUserId(): string {
    try {
      const id = sessionStorage.getItem(SESSION_KEYS.CURRENT_USER_ID) || 'usr_admin';
      return DEMO_USER_IDS.has(id) ? 'usr_admin' : id;
    } catch {
      return 'usr_admin';
    }
  },
  getLastLoginEmail(): string {
    try {
      const email = sessionStorage.getItem(SESSION_KEYS.LAST_EMAIL) || '';
      if (DEMO_USER_EMAILS.has(email.toLowerCase()) || email.endsWith('@demo.bjbright.com')) {
        return '';
      }
      return email;
    } catch {
      return '';
    }
  },
  startSession(userId: string, email: string): void {
    try {
      sessionStorage.setItem(SESSION_KEYS.LOGGED_IN, 'true');
      sessionStorage.setItem(SESSION_KEYS.CURRENT_USER_ID, userId);
      sessionStorage.setItem(SESSION_KEYS.LAST_EMAIL, email);
    } catch {
      // Ignore
    }
  },
  setSessionUserId(userId: string): void {
    try {
      sessionStorage.setItem(SESSION_KEYS.CURRENT_USER_ID, userId);
    } catch {
      // Ignore
    }
  },
  clearSession(): void {
    try {
      sessionStorage.removeItem(SESSION_KEYS.LOGGED_IN);
      sessionStorage.removeItem(SESSION_KEYS.CURRENT_USER_ID);
    } catch {
      // Ignore
    }
  },

  // Collection getters & setters
  getUsers(): User[] {
    const seed = buildSeedData();
    const stored = readJson<User[]>(STORAGE_KEYS.USERS, seed.users).filter(
      (u) => !DEMO_USER_IDS.has(u.id) && !DEMO_USER_EMAILS.has(u.email.toLowerCase())
    );
    return stored.length > 0 ? stored : seed.users;
  },
  saveUsers(users: User[]): void {
    writeJson(STORAGE_KEYS.USERS, users);
  },

  getCandidates(): Candidate[] {
    const seed = buildSeedData();
    return readJson<Candidate[]>(STORAGE_KEYS.CANDIDATES, seed.candidates);
  },
  saveCandidates(candidates: Candidate[]): void {
    writeJson(STORAGE_KEYS.CANDIDATES, candidates);
  },

  getClients(): Client[] {
    const seed = buildSeedData();
    const raw = readJson<Client[]>(STORAGE_KEYS.CLIENTS, seed.clients);
    const seedMap = new Map(seed.clients.map((sc) => [sc.id, sc]));
    const updatedRaw = raw.map((c) => {
      const seedMatch = seedMap.get(c.id);
      if (seedMatch) {
        return {
          ...c,
          activeJobsCount: seedMatch.activeJobsCount,
          agreementDetails:
            !c.agreementDetails || c.agreementDetails === 'Standard placement agreement'
              ? seedMatch.agreementDetails
              : c.agreementDetails,
        };
      }
      return c;
    });
    const existingIds = new Set(updatedRaw.map((c) => c.id));
    const missingSeedClients = seed.clients.filter((sc) => !existingIds.has(sc.id));
    const merged = missingSeedClients.length > 0 ? [...updatedRaw, ...missingSeedClients] : updatedRaw;
    return normalizeClients(merged);
  },
  saveClients(clients: Client[]): void {
    writeJson(STORAGE_KEYS.CLIENTS, clients);
  },

  getJobs(): JobOpening[] {
    const seed = buildSeedData();
    const raw = readJson<JobOpening[]>(STORAGE_KEYS.JOBS, seed.jobs);
    const seedMap = new Map(seed.jobs.map((sj) => [sj.id, sj]));
    const updatedRaw = raw.map((j) => {
      const seedMatch = seedMap.get(j.id);
      return seedMatch ? { ...seedMatch, ...j, title: seedMatch.title, description: j.description || seedMatch.description } : j;
    });
    const existingIds = new Set(updatedRaw.map((j) => j.id));
    const missingSeedJobs = seed.jobs.filter((sj) => !existingIds.has(sj.id));
    return missingSeedJobs.length > 0 ? [...updatedRaw, ...missingSeedJobs] : updatedRaw;
  },
  saveJobs(jobs: JobOpening[]): void {
    writeJson(STORAGE_KEYS.JOBS, jobs);
  },

  getPipeline(): PipelineItem[] {
    const seed = buildSeedData();
    return readJson<PipelineItem[]>(STORAGE_KEYS.PIPELINE, seed.pipeline);
  },
  savePipeline(pipeline: PipelineItem[]): void {
    writeJson(STORAGE_KEYS.PIPELINE, pipeline);
  },

  getInterviews(): Interview[] {
    const seed = buildSeedData();
    return readJson<Interview[]>(STORAGE_KEYS.INTERVIEWS, seed.interviews);
  },
  saveInterviews(interviews: Interview[]): void {
    writeJson(STORAGE_KEYS.INTERVIEWS, interviews);
  },

  getReminders(): ReminderTask[] {
    const seed = buildSeedData();
    return readJson<ReminderTask[]>(STORAGE_KEYS.REMINDERS, seed.reminders);
  },
  saveReminders(reminders: ReminderTask[]): void {
    writeJson(STORAGE_KEYS.REMINDERS, reminders);
  },

  getActivities(): ActivityLogItem[] {
    const seed = buildSeedData();
    return readJson<ActivityLogItem[]>(STORAGE_KEYS.ACTIVITIES, seed.activities);
  },
  saveActivities(activities: ActivityLogItem[]): void {
    writeJson(STORAGE_KEYS.ACTIVITIES, activities);
  },

  getCompanySettings(): CompanySettings {
    const seed = buildSeedData();
    return readJson<CompanySettings>(STORAGE_KEYS.SETTINGS, seed.companySettings);
  },
  saveCompanySettings(settings: CompanySettings): void {
    writeJson(STORAGE_KEYS.SETTINGS, settings);
  },

  getEditHistories(): EditHistoryItem[] {
    return readJson<EditHistoryItem[]>(STORAGE_KEYS.EDIT_HISTORIES, []);
  },
  saveEditHistories(items: EditHistoryItem[]): void {
    writeJson(STORAGE_KEYS.EDIT_HISTORIES, items);
  },

  getReadNotifIds(): string[] {
    return readJson<string[]>(STORAGE_KEYS.READ_NOTIFS, []);
  },
  saveReadNotifIds(ids: string[]): void {
    writeJson(STORAGE_KEYS.READ_NOTIFS, ids);
  },

  getExportLogs(): ExportLogItem[] {
    return readJson<ExportLogItem[]>(STORAGE_KEYS.EXPORT_LOGS, []);
  },
  saveExportLogs(logs: ExportLogItem[]): void {
    writeJson(STORAGE_KEYS.EXPORT_LOGS, logs);
  },

  getImportLogs(): ImportLogItem[] {
    return readJson<ImportLogItem[]>(STORAGE_KEYS.IMPORT_LOGS, []);
  },
  saveImportLogs(logs: ImportLogItem[]): void {
    writeJson(STORAGE_KEYS.IMPORT_LOGS, logs);
  },

  // Export all current workspace data as a JSON snapshot
  exportAllDemoDataAsJson(): string {
    const payload = {
      exportedAt: new Date().toISOString(),
      mode: 'DEMO_MODE',
      companySettings: this.getCompanySettings(),
      users: this.getUsers().map(({ password, ...rest }) => rest),
      clients: this.getClients(),
      jobs: this.getJobs(),
      candidates: this.getCandidates(),
      pipeline: this.getPipeline(),
      interviews: this.getInterviews(),
      reminders: this.getReminders(),
      editHistories: this.getEditHistories(),
      activities: this.getActivities(),
    };
    return JSON.stringify(payload, null, 2);
  },
};
