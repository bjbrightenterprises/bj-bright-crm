import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  writeBatch,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
} from 'firebase/auth';
import {
  db,
  auth,
  createAuthUserViaSecondaryApp,
  handleFirestoreError,
  OperationType,
  isInitialAdminEmail,
} from './firebase';
import {
  Candidate,
  Client,
  JobOpening,
  PipelineItem,
  Interview,
  ActivityLogItem,
  User,
  UserRole,
  CompanySettings,
  ReminderTask,
  EditHistoryItem,
  ExportLogItem,
  ImportLogItem,
  getClientSection,
  sectionToClientStatus,
} from '../types/crm';
import { buildSeedData } from './mockData';

// Strip undefined properties recursively before sending to Firestore
function stripUndefined<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => stripUndefined(item)) as unknown as T;
  }
  // Preserve Firestore FieldValue sentinels (e.g. serverTimestamp())
  if ((obj as any)._methodName) return obj;
  const cleaned: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj as Record<string, any>)) {
    if (v !== undefined) {
      cleaned[k] = stripUndefined(v);
    }
  }
  return cleaned as T;
}

export function normalizeClientRecord(c: any): Client {
  const sec = c.section || getClientSection(c);
  const baseDate = (
    typeof c.createdAt === 'string' ? c.createdAt : new Date().toISOString()
  ).slice(0, 10);
  const rawContacts = Array.isArray(c.contactPersons)
    ? c.contactPersons
    : Array.isArray(c.hrContacts)
    ? c.hrContacts
    : [];
  const rawRemarks = Array.isArray(c.remarks)
    ? c.remarks.map((r: any, idx: number) => ({
        id: r.id || `crem_${idx}`,
        clientId: r.clientId || c.id,
        section: r.section || sec,
        text: r.text || '',
        authorUserId: r.authorUserId || r.createdByUserId || 'usr_admin',
        authorName: r.authorName || r.createdByUserName || 'Praveen Verma',
        authorRole: r.authorRole || 'admin',
        createdAt:
          typeof r.createdAt === 'string'
            ? r.createdAt
            : new Date().toISOString(),
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
    lastContactedDate:
      c.lastContactedDate || (sec !== 'Red' ? baseDate : undefined),
    agreementSignedDate:
      c.agreementSignedDate || (sec === 'Green' ? baseDate : undefined),
    remarks: rawRemarks,
  };
}

// Safety net: treat any leftover "Joined" status/stage as "Placed" when reading data
export function normalizeCandidateRecord(c: any): Candidate {
  const normalizedStatus = (c.status as string) === 'Joined' ? 'Placed' : c.status;
  const normalizedRemarks = Array.isArray(c.remarks)
    ? c.remarks.map((r: any) =>
        (r?.statusChangedTo as string) === 'Joined'
          ? { ...r, statusChangedTo: 'Placed' }
          : r
      )
    : c.remarks;
  return {
    ...c,
    status: normalizedStatus,
    ...(normalizedRemarks !== undefined ? { remarks: normalizedRemarks } : {}),
  } as Candidate;
}

export function normalizePipelineRecord(p: any): PipelineItem {
  const normalizedStage = (p.stage as string) === 'Joined' ? 'Placed' : p.stage;
  return {
    ...p,
    stage: normalizedStage,
  } as PipelineItem;
}

// In-memory cache updated by real-time Firestore listeners for synchronous helper access
let cachedUsers: User[] = [];
let cachedCandidates: Candidate[] = [];
let cachedClients: Client[] = [];
let cachedJobs: JobOpening[] = [];
let cachedPipeline: PipelineItem[] = [];
let cachedInterviews: Interview[] = [];
let cachedTasks: ReminderTask[] = [];
let cachedEditHistory: EditHistoryItem[] = [];
let cachedActivities: ActivityLogItem[] = [];
let cachedSettings: CompanySettings = buildSeedData().companySettings;
export type SyncState = 'Synced' | 'Syncing...' | 'Offline';

export const dataService = {
  // Light-only theme enforced globally
  getTheme(): 'light' {
    return 'light';
  },
  setTheme(_theme: 'light'): void {},

  // Generate a new Firestore auto-ID for a given collection
  createAutoId(collectionName: string): string {
    return doc(collection(db, collectionName)).id;
  },

  // ==================== AUTHENTICATION & USER PROFILE ====================
  async loginWithEmail(email: string, password: string) {
    const cleanEmail = email.trim().toLowerCase();
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
    return cred.user;
  },

  async logoutFirebase() {
    await signOut(auth);
  },

  async sendPasswordReset(email: string) {
    await sendPasswordResetEmail(auth, email.trim().toLowerCase());
  },

  async updateCurrentUserPassword(newPassword: string) {
    if (auth.currentUser) {
      await updatePassword(auth.currentUser, newPassword);
    }
  },

  /**
   * Loads or bootstraps the signed-in user's profile from users/{uid}.
   * First Admin rule: If email is the initial Admin email and no users exist yet (or profile doesn't exist),
   * create users/{uid} with role: 'admin' and active: true.
   * Never allow anyone else to self-register.
   */
  async verifyOrBootstrapUserProfile(
    uid: string,
    email: string | null
  ): Promise<User | null> {
    const userDocRef = doc(db, 'users', uid);
    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data() as User;
        return { ...data, id: uid };
      }

      // Profile does not exist: check if this is the initial Admin
      if (isInitialAdminEmail(email)) {
        const adminProfile: User = {
          id: uid,
          name: 'Praveen Verma',
          email: (email || 'praveenverma1420@gmail.com').trim().toLowerCase(),
          phone: '+91 84488 92852',
          role: 'admin',
          designation: 'Founder & Managing Director',
          avatar: '/assets/aistudio/BJ-Bright-logo-circle_cb142036.png',
          active: true,
        };
        await setDoc(
          userDocRef,
          stripUndefined({
            ...adminProfile,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
        );
        return adminProfile;
      }

      // Check if an Admin pre-created a user document keyed by email or another ID, or reject
      return null;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${uid}`);
      throw err;
    }
  },

  /**
   * Admin-only: Create a new Firebase Auth account using the secondary Firebase App instance
   * (so Admin is NOT signed out), then create users/{uid} in Firestore.
   */
  async adminCreateUserAccount(
    userData: Omit<User, 'id'>,
    temporaryPassword: string
  ): Promise<User> {
    const cleanEmail = userData.email.trim().toLowerCase();
    const newUid = await createAuthUserViaSecondaryApp(
      cleanEmail,
      temporaryPassword
    );
    const newUser: User = {
      ...userData,
      id: newUid,
      email: cleanEmail,
      active: true,
    };
    const { password: _discardPassword, ...firestoreUser } = newUser as any;
    try {
      await setDoc(
        doc(db, 'users', newUid),
        stripUndefined({
          ...firestoreUser,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      );
      return newUser;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${newUid}`);
      throw err;
    }
  },

  async updateUserDoc(uid: string, updates: Partial<User>): Promise<void> {
    try {
      const { password: _discard, ...cleanUpdates } = updates as any;
      await updateDoc(
        doc(db, 'users', uid),
        stripUndefined({
          ...cleanUpdates,
          updatedAt: serverTimestamp(),
        })
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
      throw err;
    }
  },

  async setUserActiveStatus(uid: string, active: boolean): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), {
        active,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
      throw err;
    }
  },

  // ==================== REAL-TIME LISTENERS (onSnapshot) ====================
  subscribeToUserProfile(
    uid: string,
    onProfile: (user: User | null) => void,
    onError?: (err: unknown) => void
  ): Unsubscribe {
    const ref = doc(db, 'users', uid);
    return onSnapshot(
      ref,
      { includeMetadataChanges: true },
      (snap) => {
        if (!snap.exists()) {
          onProfile(null);
          return;
        }
        onProfile({ ...(snap.data() as User), id: snap.id });
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, `users/${uid}`);
        onError?.(err);
      }
    );
  },

  subscribeToUsers(
    onData: (users: User[]) => void,
    onSyncMeta?: (hasPendingWrites: boolean, fromCache: boolean) => void
  ): Unsubscribe {
    const colRef = collection(db, 'users');
    return onSnapshot(
      colRef,
      { includeMetadataChanges: true },
      (snap) => {
        onSyncMeta?.(snap.metadata.hasPendingWrites, snap.metadata.fromCache);
        const list = snap.docs.map((d) => ({
          ...(d.data() as User),
          id: d.id,
        }));
        cachedUsers = list;
        onData(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'users')
    );
  },

  subscribeToCandidates(
    uid: string,
    role: UserRole,
    onData: (candidates: Candidate[]) => void,
    onSyncMeta?: (hasPendingWrites: boolean, fromCache: boolean) => void
  ): Unsubscribe {
    const colRef = collection(db, 'candidates');
    const q =
      role === 'admin' || role === 'manager'
        ? colRef
        : query(colRef, where('assignedRecruiterId', '==', uid));

    return onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snap) => {
        onSyncMeta?.(snap.metadata.hasPendingWrites, snap.metadata.fromCache);
        const list = snap.docs
          .map((d) => normalizeCandidateRecord({ ...(d.data() as Candidate), id: d.id }))
          .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        cachedCandidates = list;
        onData(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'candidates')
    );
  },

  subscribeToClients(
    onData: (clients: Client[]) => void,
    onSyncMeta?: (hasPendingWrites: boolean, fromCache: boolean) => void
  ): Unsubscribe {
    const colRef = collection(db, 'clients');
    return onSnapshot(
      colRef,
      { includeMetadataChanges: true },
      (snap) => {
        onSyncMeta?.(snap.metadata.hasPendingWrites, snap.metadata.fromCache);
        const list = snap.docs.map((d) =>
          normalizeClientRecord({ ...d.data(), id: d.id })
        );
        cachedClients = list;
        onData(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'clients')
    );
  },

  subscribeToJobs(
    onData: (jobs: JobOpening[]) => void,
    onSyncMeta?: (hasPendingWrites: boolean, fromCache: boolean) => void
  ): Unsubscribe {
    const colRef = collection(db, 'jobs');
    return onSnapshot(
      colRef,
      { includeMetadataChanges: true },
      (snap) => {
        onSyncMeta?.(snap.metadata.hasPendingWrites, snap.metadata.fromCache);
        const list = snap.docs
          .map((d) => ({ ...(d.data() as JobOpening), id: d.id }))
          .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        cachedJobs = list;
        onData(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'jobs')
    );
  },

  subscribeToPipeline(
    uid: string,
    role: UserRole,
    onData: (pipeline: PipelineItem[]) => void,
    onSyncMeta?: (hasPendingWrites: boolean, fromCache: boolean) => void
  ): Unsubscribe {
    const colRef = collection(db, 'pipeline');
    const q =
      role === 'admin' || role === 'manager'
        ? colRef
        : query(colRef, where('assignedRecruiterId', '==', uid));

    return onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snap) => {
        onSyncMeta?.(snap.metadata.hasPendingWrites, snap.metadata.fromCache);
        const list = snap.docs.map((d) =>
          normalizePipelineRecord({
            ...(d.data() as PipelineItem),
            id: d.id,
          })
        );
        cachedPipeline = list;
        onData(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'pipeline')
    );
  },

  subscribeToInterviews(
    uid: string,
    role: UserRole,
    onData: (interviews: Interview[]) => void,
    onSyncMeta?: (hasPendingWrites: boolean, fromCache: boolean) => void
  ): Unsubscribe {
    const colRef = collection(db, 'interviews');
    const q =
      role === 'admin' || role === 'manager'
        ? colRef
        : query(colRef, where('assignedToRecruiterId', '==', uid));

    return onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snap) => {
        onSyncMeta?.(snap.metadata.hasPendingWrites, snap.metadata.fromCache);
        const list = snap.docs.map((d) => ({
          ...(d.data() as Interview),
          id: d.id,
        }));
        cachedInterviews = list;
        onData(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'interviews')
    );
  },

  subscribeToTasks(
    uid: string,
    role: UserRole,
    onData: (tasks: ReminderTask[]) => void,
    onSyncMeta?: (hasPendingWrites: boolean, fromCache: boolean) => void
  ): Unsubscribe {
    const colRef = collection(db, 'tasks');
    if (role === 'admin' || role === 'manager') {
      return onSnapshot(
        colRef,
        { includeMetadataChanges: true },
        (snap) => {
          onSyncMeta?.(snap.metadata.hasPendingWrites, snap.metadata.fromCache);
          const list = snap.docs.map((d) => ({
            ...(d.data() as ReminderTask),
            id: d.id,
          }));
          cachedTasks = list;
          onData(list);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'tasks')
      );
    }

    if (role === 'hr_executive') {
      let assignedList: ReminderTask[] = [];
      let createdList: ReminderTask[] = [];
      const emitMerged = () => {
        const map = new Map<string, ReminderTask>();
        assignedList.forEach((t) => map.set(t.id, t));
        createdList.forEach((t) => map.set(t.id, t));
        const merged = Array.from(map.values());
        cachedTasks = merged;
        onData(merged);
      };

      const unsub1 = onSnapshot(
        query(colRef, where('assignedToUserId', '==', uid)),
        { includeMetadataChanges: true },
        (snap) => {
          onSyncMeta?.(snap.metadata.hasPendingWrites, snap.metadata.fromCache);
          assignedList = snap.docs.map((d) => ({
            ...(d.data() as ReminderTask),
            id: d.id,
          }));
          emitMerged();
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'tasks')
      );

      const unsub2 = onSnapshot(
        query(colRef, where('createdByUserId', '==', uid)),
        { includeMetadataChanges: true },
        (snap) => {
          createdList = snap.docs.map((d) => ({
            ...(d.data() as ReminderTask),
            id: d.id,
          }));
          emitMerged();
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'tasks')
      );

      return () => {
        unsub1();
        unsub2();
      };
    }

    // Recruiter: assigned records only
    return onSnapshot(
      query(colRef, where('assignedToUserId', '==', uid)),
      { includeMetadataChanges: true },
      (snap) => {
        onSyncMeta?.(snap.metadata.hasPendingWrites, snap.metadata.fromCache);
        const list = snap.docs.map((d) => ({
          ...(d.data() as ReminderTask),
          id: d.id,
        }));
        cachedTasks = list;
        onData(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'tasks')
    );
  },

  subscribeToEditHistory(
    onData: (history: EditHistoryItem[]) => void
  ): Unsubscribe {
    const colRef = collection(db, 'editHistory');
    return onSnapshot(
      colRef,
      (snap) => {
        const list = snap.docs
          .map((d) => ({ ...(d.data() as EditHistoryItem), id: d.id }))
          .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
        cachedEditHistory = list;
        onData(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'editHistory')
    );
  },

  subscribeToSettings(
    onData: (settings: CompanySettings) => void
  ): Unsubscribe {
    const docRef = doc(db, 'settings', 'company');
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const merged = {
            ...buildSeedData().companySettings,
            ...(snap.data() as Partial<CompanySettings>),
          };
          cachedSettings = merged;
          onData(merged);
        } else {
          onData(cachedSettings);
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'settings/company')
    );
  },

  // ==================== FIRESTORE CRUD OPERATIONS ====================

  // Candidates
  async createCandidateDoc(candidate: Candidate): Promise<string> {
    const ref = candidate.id
      ? doc(db, 'candidates', candidate.id)
      : doc(collection(db, 'candidates'));
    const payload = stripUndefined({
      ...candidate,
      id: ref.id,
      lastEditReason: 'Initial creation',
      serverCreatedAt: serverTimestamp(),
      serverUpdatedAt: serverTimestamp(),
    });
    try {
      await setDoc(ref, payload);
      return ref.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `candidates/${ref.id}`);
      throw err;
    }
  },

  async updateCandidateDoc(
    id: string,
    updates: Partial<Candidate>,
    editReason: string = 'Record updated'
  ): Promise<void> {
    const cleanReason =
      editReason && editReason.trim().length > 0
        ? editReason.trim()
        : 'Record updated';
    try {
      await updateDoc(
        doc(db, 'candidates', id),
        stripUndefined({
          ...updates,
          lastEditReason: cleanReason,
          serverUpdatedAt: serverTimestamp(),
        })
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `candidates/${id}`);
      throw err;
    }
  },

  async deleteCandidateToTrash(
    candidate: Candidate,
    deletedByUser: User
  ): Promise<void> {
    const trashRef = doc(collection(db, 'trash'));
    try {
      const batch = writeBatch(db);
      batch.set(
        trashRef,
        stripUndefined({
          id: trashRef.id,
          entityType: 'candidate',
          entityId: candidate.id,
          data: candidate,
          deletedByUserId: deletedByUser.id,
          deletedByUserName: deletedByUser.name,
          deletedAt: new Date().toISOString(),
          serverDeletedAt: serverTimestamp(),
        })
      );
      batch.delete(doc(db, 'candidates', candidate.id));
      await batch.commit();
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.DELETE,
        `candidates/${candidate.id}`
      );
      throw err;
    }
  },

  // Clients (Companies)
  async createClientDoc(client: Client): Promise<string> {
    const ref = client.id
      ? doc(db, 'clients', client.id)
      : doc(collection(db, 'clients'));
    const payload = stripUndefined({
      ...client,
      id: ref.id,
      lastEditReason: 'Initial company creation',
      serverCreatedAt: serverTimestamp(),
      serverUpdatedAt: serverTimestamp(),
    });
    try {
      await setDoc(ref, payload);
      return ref.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `clients/${ref.id}`);
      throw err;
    }
  },

  async updateClientDoc(
    id: string,
    updates: Partial<Client>,
    editReason: string = 'Company details updated'
  ): Promise<void> {
    const cleanReason =
      editReason && editReason.trim().length > 0
        ? editReason.trim()
        : 'Company details updated';
    try {
      await updateDoc(
        doc(db, 'clients', id),
        stripUndefined({
          ...updates,
          lastEditReason: cleanReason,
          serverUpdatedAt: serverTimestamp(),
        })
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `clients/${id}`);
      throw err;
    }
  },

  async deleteClientToTrash(
    client: Client,
    deletedByUser: User
  ): Promise<void> {
    const trashRef = doc(collection(db, 'trash'));
    try {
      const batch = writeBatch(db);
      batch.set(
        trashRef,
        stripUndefined({
          id: trashRef.id,
          entityType: 'client',
          entityId: client.id,
          data: client,
          deletedByUserId: deletedByUser.id,
          deletedByUserName: deletedByUser.name,
          deletedAt: new Date().toISOString(),
          serverDeletedAt: serverTimestamp(),
        })
      );
      batch.delete(doc(db, 'clients', client.id));
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `clients/${client.id}`);
      throw err;
    }
  },

  // Jobs
  async createJobDoc(job: JobOpening): Promise<string> {
    const ref = job.id
      ? doc(db, 'jobs', job.id)
      : doc(collection(db, 'jobs'));
    const payload = stripUndefined({
      ...job,
      id: ref.id,
      lastEditReason: 'Initial job creation',
      serverCreatedAt: serverTimestamp(),
      serverUpdatedAt: serverTimestamp(),
    });
    try {
      await setDoc(ref, payload);
      return ref.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `jobs/${ref.id}`);
      throw err;
    }
  },

  async updateJobDoc(
    id: string,
    updates: Partial<JobOpening>,
    editReason: string = 'Job updated'
  ): Promise<void> {
    const cleanReason =
      editReason && editReason.trim().length > 0
        ? editReason.trim()
        : 'Job updated';
    try {
      await updateDoc(
        doc(db, 'jobs', id),
        stripUndefined({
          ...updates,
          lastEditReason: cleanReason,
          serverUpdatedAt: serverTimestamp(),
        })
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `jobs/${id}`);
      throw err;
    }
  },

  async deleteJobToTrash(job: JobOpening, deletedByUser: User): Promise<void> {
    const trashRef = doc(collection(db, 'trash'));
    try {
      const batch = writeBatch(db);
      batch.set(
        trashRef,
        stripUndefined({
          id: trashRef.id,
          entityType: 'job',
          entityId: job.id,
          data: job,
          deletedByUserId: deletedByUser.id,
          deletedByUserName: deletedByUser.name,
          deletedAt: new Date().toISOString(),
          serverDeletedAt: serverTimestamp(),
        })
      );
      batch.delete(doc(db, 'jobs', job.id));
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `jobs/${job.id}`);
      throw err;
    }
  },

  // Pipeline
  async createPipelineDoc(item: PipelineItem): Promise<string> {
    const ref = item.id
      ? doc(db, 'pipeline', item.id)
      : doc(collection(db, 'pipeline'));
    try {
      await setDoc(
        ref,
        stripUndefined({
          ...item,
          id: ref.id,
          serverCreatedAt: serverTimestamp(),
          serverUpdatedAt: serverTimestamp(),
        })
      );
      return ref.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `pipeline/${ref.id}`);
      throw err;
    }
  },

  async updatePipelineDoc(
    id: string,
    updates: Partial<PipelineItem>
  ): Promise<void> {
    try {
      await updateDoc(
        doc(db, 'pipeline', id),
        stripUndefined({
          ...updates,
          serverUpdatedAt: serverTimestamp(),
        })
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `pipeline/${id}`);
      throw err;
    }
  },

  async deletePipelineDoc(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'pipeline', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `pipeline/${id}`);
      throw err;
    }
  },

  // Interviews
  async createInterviewDoc(interview: Interview): Promise<string> {
    const ref = interview.id
      ? doc(db, 'interviews', interview.id)
      : doc(collection(db, 'interviews'));
    try {
      await setDoc(
        ref,
        stripUndefined({
          ...interview,
          id: ref.id,
          serverCreatedAt: serverTimestamp(),
          serverUpdatedAt: serverTimestamp(),
        })
      );
      return ref.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `interviews/${ref.id}`);
      throw err;
    }
  },

  async updateInterviewDoc(
    id: string,
    updates: Partial<Interview>
  ): Promise<void> {
    try {
      await updateDoc(
        doc(db, 'interviews', id),
        stripUndefined({
          ...updates,
          serverUpdatedAt: serverTimestamp(),
        })
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `interviews/${id}`);
      throw err;
    }
  },

  async deleteInterviewToTrash(
    interview: Interview,
    deletedByUser: User
  ): Promise<void> {
    const trashRef = doc(collection(db, 'trash'));
    try {
      const batch = writeBatch(db);
      batch.set(
        trashRef,
        stripUndefined({
          id: trashRef.id,
          entityType: 'interview',
          entityId: interview.id,
          data: interview,
          deletedByUserId: deletedByUser.id,
          deletedByUserName: deletedByUser.name,
          deletedAt: new Date().toISOString(),
          serverDeletedAt: serverTimestamp(),
        })
      );
      batch.delete(doc(db, 'interviews', interview.id));
      await batch.commit();
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.DELETE,
        `interviews/${interview.id}`
      );
      throw err;
    }
  },

  // Tasks (Reminders)
  async createTaskDoc(task: ReminderTask): Promise<string> {
    const ref = task.id
      ? doc(db, 'tasks', task.id)
      : doc(collection(db, 'tasks'));
    try {
      await setDoc(
        ref,
        stripUndefined({
          ...task,
          id: ref.id,
          serverCreatedAt: serverTimestamp(),
          serverUpdatedAt: serverTimestamp(),
        })
      );
      return ref.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `tasks/${ref.id}`);
      throw err;
    }
  },

  async updateTaskDoc(
    id: string,
    updates: Partial<ReminderTask>
  ): Promise<void> {
    try {
      await updateDoc(
        doc(db, 'tasks', id),
        stripUndefined({
          ...updates,
          serverUpdatedAt: serverTimestamp(),
        })
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `tasks/${id}`);
      throw err;
    }
  },

  async deleteTaskToTrash(
    task: ReminderTask,
    deletedByUser: User
  ): Promise<void> {
    const trashRef = doc(collection(db, 'trash'));
    try {
      const batch = writeBatch(db);
      batch.set(
        trashRef,
        stripUndefined({
          id: trashRef.id,
          entityType: 'task',
          entityId: task.id,
          data: task,
          deletedByUserId: deletedByUser.id,
          deletedByUserName: deletedByUser.name,
          deletedAt: new Date().toISOString(),
          serverDeletedAt: serverTimestamp(),
        })
      );
      batch.delete(doc(db, 'tasks', task.id));
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `tasks/${task.id}`);
      throw err;
    }
  },

  // Edit History (Create-only collection)
  async createEditHistoryDoc(item: EditHistoryItem): Promise<string> {
    const ref = doc(collection(db, 'editHistory'));
    try {
      await setDoc(
        ref,
        stripUndefined({
          ...item,
          id: ref.id,
          serverCreatedAt: serverTimestamp(),
        })
      );
      return ref.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `editHistory/${ref.id}`);
      throw err;
    }
  },

  // Remarks (Create-only collection)
  async createRemarkDoc(remarkData: Record<string, any>): Promise<string> {
    const ref = doc(collection(db, 'remarks'));
    try {
      await setDoc(
        ref,
        stripUndefined({
          ...remarkData,
          id: ref.id,
          serverCreatedAt: serverTimestamp(),
        })
      );
      return ref.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `remarks/${ref.id}`);
      throw err;
    }
  },

  // Settings
  async saveCompanySettingsDoc(settings: CompanySettings): Promise<void> {
    try {
      await setDoc(
        doc(db, 'settings', 'company'),
        stripUndefined({
          ...settings,
          updatedAt: serverTimestamp(),
        }),
        { merge: true }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/company');
      throw err;
    }
  },

  // ==================== ONE-TIME ADMIN MIGRATION: JOINED -> PLACED ====================
  /**
   * One-time Admin-only migration that runs automatically the first time an Admin signs in.
   * Converts in Firestore:
   * - every candidate with status "Joined" to "Placed"
   * - every candidate remark timeline entry with statusChangedTo "Joined" to "Placed"
   * - every pipeline item with stage "Joined" to "Placed"
   * - every standalone remark doc with statusChangedTo "Joined" to "Placed"
   * Uses batches of 500, is idempotent (tracked via settings/migration_joined_to_placed_v1),
   * does not alter any other field, and does not create editHistory entries.
   */
  async runJoinedToPlacedMigrationIfNeeded(
    adminUid: string
  ): Promise<{
    ran: boolean;
    updatedCount: number;
    candidatesBefore: number;
    candidatesAfter: number;
  }> {
    const flagRef = doc(db, 'settings', 'migration_joined_to_placed_v1');
    try {
      const flagSnap = await getDoc(flagRef);
      if (flagSnap.exists() && flagSnap.data()?.completed === true) {
        return {
          ran: false,
          updatedCount: 0,
          candidatesBefore: cachedCandidates.length,
          candidatesAfter: cachedCandidates.length,
        };
      }

      const [candSnap, pipeSnap, remSnap] = await Promise.all([
        getDocs(collection(db, 'candidates')),
        getDocs(collection(db, 'pipeline')),
        getDocs(collection(db, 'remarks')),
      ]);

      const candidatesBefore = candSnap.size;
      const operations: Array<{
        ref: ReturnType<typeof doc>;
        data: Record<string, any>;
      }> = [];

      candSnap.docs.forEach((d) => {
        const raw = d.data();
        const statusNeedsUpdate = raw.status === 'Joined';
        const remarksArr = Array.isArray(raw.remarks) ? raw.remarks : [];
        const remarksNeedUpdate = remarksArr.some(
          (r: any) => r && r.statusChangedTo === 'Joined'
        );

        if (statusNeedsUpdate || remarksNeedUpdate) {
          const updatePayload: Record<string, any> = {
            lastEditReason:
              typeof raw.lastEditReason === 'string' && raw.lastEditReason.trim().length > 0
                ? raw.lastEditReason
                : 'Migrated Joined to Placed',
          };
          if (statusNeedsUpdate) {
            updatePayload.status = 'Placed';
          }
          if (remarksNeedUpdate) {
            updatePayload.remarks = remarksArr.map((r: any) =>
              r && r.statusChangedTo === 'Joined'
                ? { ...r, statusChangedTo: 'Placed' }
                : r
            );
          }
          operations.push({
            ref: doc(db, 'candidates', d.id),
            data: stripUndefined(updatePayload),
          });
        }
      });

      pipeSnap.docs.forEach((d) => {
        const raw = d.data();
        if (raw.stage === 'Joined') {
          operations.push({
            ref: doc(db, 'pipeline', d.id),
            data: { stage: 'Placed' },
          });
        }
      });

      remSnap.docs.forEach((d) => {
        const raw = d.data();
        if (raw.statusChangedTo === 'Joined') {
          operations.push({
            ref: doc(db, 'remarks', d.id),
            data: { statusChangedTo: 'Placed' },
          });
        }
      });

      // Commit in batches of 500
      const BATCH_SIZE = 500;
      for (let i = 0; i < operations.length; i += BATCH_SIZE) {
        const chunk = operations.slice(i, i + BATCH_SIZE);
        const batch = writeBatch(db);
        chunk.forEach((op) => {
          batch.update(op.ref, op.data);
        });
        await batch.commit();
      }

      const candidatesAfter = candSnap.size;
      await setDoc(flagRef, {
        completed: true,
        updatedCount: operations.length,
        candidatesBefore,
        candidatesAfter,
        completedBy: adminUid,
        completedAt: serverTimestamp(),
      });

      return {
        ran: true,
        updatedCount: operations.length,
        candidatesBefore,
        candidatesAfter,
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/migration_joined_to_placed_v1');
      return {
        ran: false,
        updatedCount: 0,
        candidatesBefore: cachedCandidates.length,
        candidatesAfter: cachedCandidates.length,
      };
    }
  },

  // ==================== ADMIN STARTER DATA LOADER ====================
  /**
   * Admin-only: Writes the starter companies (and open job mandates) ONCE,
   * ONLY if the clients collection is currently empty.
   */
  async loadStarterDataIfEmpty(
    adminUid: string,
    adminName: string
  ): Promise<{ loaded: boolean; clientsCount: number; jobsCount: number }> {
    try {
      const existingSnap = await getDocs(collection(db, 'clients'));
      if (!existingSnap.empty) {
        return {
          loaded: false,
          clientsCount: existingSnap.size,
          jobsCount: cachedJobs.length,
        };
      }

      const seed = buildSeedData();
      const batch = writeBatch(db);

      // Write company settings
      batch.set(
        doc(db, 'settings', 'company'),
        stripUndefined({
          ...seed.companySettings,
          updatedAt: serverTimestamp(),
        })
      );

      // Map starter client IDs to new Firestore auto IDs
      const clientIdMap = new Map<string, string>();
      const normalizedSeedClients = seed.clients.map((c) =>
        normalizeClientRecord(c)
      );

      for (const client of normalizedSeedClients) {
        const clientRef = doc(collection(db, 'clients'));
        clientIdMap.set(client.id, clientRef.id);
        const updatedRemarks = (client.remarks || []).map((r) => ({
          ...r,
          clientId: clientRef.id,
          authorUserId: adminUid,
          authorName: adminName,
        }));
        batch.set(
          clientRef,
          stripUndefined({
            ...client,
            id: clientRef.id,
            assignedAccountManagerId: adminUid,
            assignedAccountManagerName: adminName,
            remarks: updatedRemarks,
            lastEditReason: 'Starter data initialization',
            serverCreatedAt: serverTimestamp(),
            serverUpdatedAt: serverTimestamp(),
          })
        );
      }

      for (const job of seed.jobs) {
        const jobRef = doc(collection(db, 'jobs'));
        const mappedClientId = clientIdMap.get(job.clientId) || job.clientId;
        batch.set(
          jobRef,
          stripUndefined({
            ...job,
            id: jobRef.id,
            clientId: mappedClientId,
            assignedRecruiterIds: [adminUid],
            assignedRecruiterNames: [adminName],
            lastEditReason: 'Starter data initialization',
            serverCreatedAt: serverTimestamp(),
            serverUpdatedAt: serverTimestamp(),
          })
        );
      }

      await batch.commit();
      return {
        loaded: true,
        clientsCount: normalizedSeedClients.length,
        jobsCount: seed.jobs.length,
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'clients/starterData');
      throw err;
    }
  },

  // ==================== COMPATIBILITY / SYNCHRONOUS HELPERS ====================
  ensureSeedDataInitialized(): void {
    // No-op: Automatic seeding is removed in Firebase mode. Admin uses "Load starter data".
  },
  resetToDemoSeedData() {
    const seed = buildSeedData();
    return {
      ...seed,
      clients: seed.clients.map((c) => normalizeClientRecord(c)),
    };
  },
  isSessionLoggedIn(): boolean {
    return !!auth.currentUser;
  },
  getSessionUserId(): string {
    return auth.currentUser?.uid || '';
  },
  getLastLoginEmail(): string {
    return auth.currentUser?.email || '';
  },
  startSession(_userId: string, _email: string): void {},
  setSessionUserId(_userId: string): void {},
  clearSession(): void {
    signOut(auth).catch(() => {});
  },

  getUsers(): User[] {
    return cachedUsers;
  },
  saveUsers(_users: User[]): void {},

  getCandidates(): Candidate[] {
    return cachedCandidates;
  },
  saveCandidates(_candidates: Candidate[]): void {},

  getClients(): Client[] {
    return cachedClients;
  },
  saveClients(_clients: Client[]): void {},

  getJobs(): JobOpening[] {
    return cachedJobs;
  },
  saveJobs(_jobs: JobOpening[]): void {},

  getPipeline(): PipelineItem[] {
    return cachedPipeline;
  },
  savePipeline(_pipeline: PipelineItem[]): void {},

  getInterviews(): Interview[] {
    return cachedInterviews;
  },
  saveInterviews(_interviews: Interview[]): void {},

  getReminders(): ReminderTask[] {
    return cachedTasks;
  },
  saveReminders(_reminders: ReminderTask[]): void {},

  getActivities(): ActivityLogItem[] {
    return cachedActivities;
  },
  saveActivities(activities: ActivityLogItem[]): void {
    cachedActivities = activities;
  },

  getCompanySettings(): CompanySettings {
    return cachedSettings;
  },
  saveCompanySettings(settings: CompanySettings): void {
    cachedSettings = settings;
    this.saveCompanySettingsDoc(settings).catch(() => {});
  },

  getEditHistories(): EditHistoryItem[] {
    return cachedEditHistory;
  },
  saveEditHistories(_items: EditHistoryItem[]): void {},

  getReadNotifIds(): string[] {
    return [];
  },
  saveReadNotifIds(_ids: string[]): void {},

  getExportLogs(): ExportLogItem[] {
    return [];
  },
  saveExportLogs(_logs: ExportLogItem[]): void {},

  getImportLogs(): ImportLogItem[] {
    return [];
  },
  saveImportLogs(_logs: ImportLogItem[]): void {},

  exportAllDemoDataAsJson(): string {
    const payload = {
      exportedAt: new Date().toISOString(),
      mode: 'FIREBASE_CLOUD_LIVE',
      companySettings: cachedSettings,
      users: cachedUsers.map(({ password, ...rest }) => rest),
      clients: cachedClients,
      jobs: cachedJobs,
      candidates: cachedCandidates,
      pipeline: cachedPipeline,
      interviews: cachedInterviews,
      tasks: cachedTasks,
      editHistories: cachedEditHistory,
      activities: cachedActivities,
    };
    return JSON.stringify(payload, null, 2);
  },
};
