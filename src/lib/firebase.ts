import { initializeApp, getApps, getApp, deleteApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, doc, getDocFromServer } from 'firebase/firestore';
import { DEFAULT_FIREBASE_CONFIG } from './firebaseConfig';

export interface FirebaseConfigOptions {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  firestoreDatabaseId?: string;
}

const STORAGE_KEY = 'bj_bright_firebase_config';

export function getSavedFirebaseConfig(): FirebaseConfigOptions | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.error('Failed to parse saved Firebase config', err);
  }
  return null;
}

export function saveFirebaseConfig(config: FirebaseConfigOptions): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save Firebase config', err);
  }
}

export function clearFirebaseConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/** Config in use: config saved from the Settings modal wins, otherwise the one in firebaseConfig.ts / .env */
export function getActiveFirebaseConfig(): FirebaseConfigOptions | null {
  const saved = getSavedFirebaseConfig();
  if (saved?.apiKey && saved?.projectId) return saved;
  if (DEFAULT_FIREBASE_CONFIG.apiKey && DEFAULT_FIREBASE_CONFIG.projectId) return DEFAULT_FIREBASE_CONFIG;
  return null;
}

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

export function initializeFirebaseServices(customConfig?: FirebaseConfigOptions) {
  const config = customConfig || getActiveFirebaseConfig();
  if (!config || !config.apiKey || !config.projectId) {
    return { app: null, auth: null, db: null, isConfigured: false };
  }

  try {
    if (!getApps().length) {
      appInstance = initializeApp({
        apiKey: config.apiKey,
        authDomain: config.authDomain || `${config.projectId}.firebaseapp.com`,
        projectId: config.projectId,
        storageBucket: config.storageBucket || `${config.projectId}.firebasestorage.app`,
        messagingSenderId: config.messagingSenderId,
        appId: config.appId,
      });
    } else {
      appInstance = getApp();
    }

    authInstance = getAuth(appInstance);
    dbInstance = getFirestore(appInstance, config.firestoreDatabaseId || '(default)');

    return {
      app: appInstance,
      auth: authInstance,
      db: dbInstance,
      isConfigured: true,
    };
  } catch (error) {
    console.warn('Firebase initialization notice:', error);
    return { app: null, auth: null, db: null, isConfigured: false, error };
  }
}

export function getFirebaseAuth(): Auth | null {
  return authInstance;
}

export function getFirebaseDb(): Firestore | null {
  return dbInstance;
}

/**
 * Secondary app used only to create accounts for new team members, so the
 * admin who is creating them does not get signed out of the main app.
 */
export async function withSecondaryAuth<T>(fn: (auth: Auth) => Promise<T>): Promise<T> {
  const config = getActiveFirebaseConfig();
  if (!config) throw new Error('Firebase is not configured.');
  const name = `secondary_${Date.now()}`;
  const secondary = initializeApp(
    {
      apiKey: config.apiKey,
      authDomain: config.authDomain || `${config.projectId}.firebaseapp.com`,
      projectId: config.projectId,
      appId: config.appId,
    },
    name
  );
  try {
    return await fn(getAuth(secondary));
  } finally {
    try {
      await deleteApp(secondary);
    } catch {
      /* ignore */
    }
  }
}

export async function testFirestoreConnection(db: Firestore): Promise<{ success: boolean; message: string }> {
  try {
    await getDocFromServer(doc(db, '_connection_test', 'ping'));
    return { success: true, message: 'Connected to Firestore successfully!' };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    // A permission error still proves we reached Firestore (rules just require login).
    if (msg.includes('permission-denied') || msg.includes('Missing or insufficient permissions')) {
      return { success: true, message: 'Reached Firestore. Rules require login (expected).' };
    }
    return { success: false, message: msg };
  }
}

export function friendlyFirebaseError(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return 'Invalid email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes or reset your password.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/email-already-in-use':
      return 'This email already has a login. Use "Forgot password" or ask Admin to reset it.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not enabled in Firebase Console (Authentication > Sign-in method).';
    case 'auth/network-request-failed':
      return 'Network error. Check your internet connection.';
    case 'permission-denied':
    case 'firestore/permission-denied':
      return 'Permission denied by Firestore rules. Publish the rules from firestore.rules and check your user role.';
    default:
      return (err as Error)?.message || 'Something went wrong.';
  }
}
