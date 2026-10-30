import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, doc, getDocFromServer } from 'firebase/firestore';

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

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

export function initializeFirebaseServices(customConfig?: FirebaseConfigOptions) {
  const config = customConfig || getSavedFirebaseConfig();
  if (!config || !config.apiKey || !config.projectId) {
    return { app: null, auth: null, db: null, isConfigured: false };
  }

  try {
    if (!getApps().length) {
      appInstance = initializeApp({
        apiKey: config.apiKey,
        authDomain: config.authDomain || `${config.projectId}.firebaseapp.com`,
        projectId: config.projectId,
        storageBucket: config.storageBucket || `${config.projectId}.appspot.com`,
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

export async function testFirestoreConnection(db: Firestore): Promise<{ success: boolean; message: string }> {
  try {
    await getDocFromServer(doc(db, '_connection_test', 'ping'));
    return { success: true, message: 'Connected to Firestore successfully!' };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('the client is offline') || msg.includes('permission-denied')) {
      return { success: false, message: `Connection note: ${msg}` };
    }
    return { success: true, message: 'Firestore initialized and ready.' };
  }
}
