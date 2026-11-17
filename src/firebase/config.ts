import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { doc, getDocFromServer, initializeFirestore } from 'firebase/firestore';
import provisionedConfig from '../../firebase-applet-config.json';

/**
 * ============================================================================
 * FIREBASE CONFIGURATION (SINGLE PLACE TO EDIT)
 * ============================================================================
 * By default, Ente Veedu loads from `firebase-applet-config.json`.
 * To connect your own Firebase project:
 *   1. Create a project in Firebase Console
 *   2. Enable Authentication -> Sign-in method -> Anonymous
 *   3. Create Firestore Database
 *   4. Add this app's domain under Authentication -> Settings -> Authorized domains
 *   5. Paste your Web App config below and publish `firestore.rules`
 */
export const FIREBASE_CONFIG = {
  apiKey: provisionedConfig.apiKey,
  authDomain: provisionedConfig.authDomain,
  projectId: provisionedConfig.projectId,
  storageBucket: provisionedConfig.storageBucket,
  messagingSenderId: provisionedConfig.messagingSenderId,
  appId: provisionedConfig.appId,
  firestoreDatabaseId: provisionedConfig.firestoreDatabaseId,
};

export function isFirebaseConfigured(): boolean {
  return Boolean(
    FIREBASE_CONFIG.apiKey &&
      FIREBASE_CONFIG.projectId &&
      !FIREBASE_CONFIG.projectId.includes('remixed-project-id') &&
      !FIREBASE_CONFIG.apiKey.includes('YOUR_')
  );
}

const app = initializeApp(FIREBASE_CONFIG);

export const db = initializeFirestore(
  app,
  { experimentalForceLongPolling: true },
  FIREBASE_CONFIG.firestoreDatabaseId || '(default)'
);

export const auth = getAuth(app);

export async function testConnection(): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline or unreachable — falling back to Demo Mode if needed.');
      return false;
    }
    return true;
  }
}

testConnection();
