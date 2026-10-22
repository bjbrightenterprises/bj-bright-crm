/**
 * Firebase project config (bj-bright-crm).
 *
 * Firebase Console -> Project settings (gear) -> General -> Your apps -> bj-bright-crm
 * -> SDK setup and configuration -> "Config", then paste the values below.
 *
 * These web config values are NOT secrets (they identify the project; the
 * Firestore security rules are what protect the data), so it is safe to keep
 * them in the code. Alternatively set VITE_FIREBASE_* variables in .env.local.
 */
import type { FirebaseConfigOptions } from './firebase';

const env = import.meta.env;

export const DEFAULT_FIREBASE_CONFIG: FirebaseConfigOptions = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyD_c9xudGb3XWlAhz-NQyTymfjdPSK0Yvo',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'bj-bright-crm.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'bj-bright-crm',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'bj-bright-crm.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '648876995431',
  appId: env.VITE_FIREBASE_APP_ID || '1:648876995431:web:c7d1a6c74139fa066bf5c2',
};

/** The first admin. Only this email can create its own admin profile on first login. */
export const FIRST_ADMIN_EMAIL = 'praveenverma1420@gmail.com';
