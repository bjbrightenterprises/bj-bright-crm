import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  Firestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseAppletConfig from '../../firebase-applet-config.json';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  firestoreDatabaseId?: string;
}

export const FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: firebaseAppletConfig.apiKey || 'AIzaSyD_c9xudGb3XWlAhz-NQyTymfjdPSK0Yvo',
  authDomain: firebaseAppletConfig.authDomain || 'bj-bright-crm.firebaseapp.com',
  projectId: firebaseAppletConfig.projectId || 'bj-bright-crm',
  storageBucket: firebaseAppletConfig.storageBucket || 'bj-bright-crm.firebasestorage.app',
  messagingSenderId: firebaseAppletConfig.messagingSenderId || '648876995431',
  appId: firebaseAppletConfig.appId || '1:648876995431:web:c7d1a6c74139fa066bf5c2',
  firestoreDatabaseId: firebaseAppletConfig.firestoreDatabaseId,
};

// Initialize primary Firebase App once (Authentication + Firestore only)
const primaryApp: FirebaseApp =
  getApps().find((a) => a.name === '[DEFAULT]') || initializeApp(FIREBASE_CONFIG);

export const auth: Auth = getAuth(primaryApp);

function initPrimaryFirestore(app: FirebaseApp, databaseId?: string): Firestore {
  try {
    return initializeFirestore(
      app,
      {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      },
      databaseId
    );
  } catch {
    return databaseId ? getFirestore(app, databaseId) : getFirestore(app);
  }
}

export const db: Firestore = initPrimaryFirestore(
  primaryApp,
  FIREBASE_CONFIG.firestoreDatabaseId
);

// Secondary Firebase App instance used ONLY by Admin to create new user accounts without signing out the Admin
const SECONDARY_APP_NAME = 'SecondaryAdminAuthApp';

export async function createAuthUserViaSecondaryApp(
  email: string,
  temporaryPassword: string
): Promise<string> {
  const existingSecondary = getApps().find((a) => a.name === SECONDARY_APP_NAME);
  const secondaryApp =
    existingSecondary || initializeApp(FIREBASE_CONFIG, SECONDARY_APP_NAME);
  const secondaryAuth = getAuth(secondaryApp);

  const credential = await createUserWithEmailAndPassword(
    secondaryAuth,
    email.trim().toLowerCase(),
    temporaryPassword
  );
  const newUid = credential.user.uid;
  await signOut(secondaryAuth);
  return newUid;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): void {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

// Validate connection to Firestore on startup
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export const INITIAL_ADMIN_EMAIL = 'praveenverma1420@gmail.com';
export const SECONDARY_ADMIN_EMAIL = 'admin@bjbright.com';

export function isInitialAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return clean === INITIAL_ADMIN_EMAIL || clean === SECONDARY_ADMIN_EMAIL;
}

export const getStoredFirebaseConfig = (): FirebaseConfig => FIREBASE_CONFIG;
export const saveFirebaseConfig = () => {};
export const clearFirebaseConfig = () => {};
export const getFirebaseClient = () => ({ app: primaryApp, db, auth });
