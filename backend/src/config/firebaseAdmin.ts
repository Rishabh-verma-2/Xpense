import * as admin from 'firebase-admin';

// Track initialization to avoid duplicate app errors
let initialized = false;

/**
 * Initializes Firebase Admin SDK.
 * Safe to call multiple times — will skip if already initialized.
 * Silently degrades if env vars are missing (Google login simulation mode).
 */
export function initFirebaseAdmin(): admin.app.App | null {
  // Return existing app if already initialized
  if (initialized) {
    try {
      return admin.app();
    } catch {
      initialized = false;
    }
  }

  const projectId    = (process.env.FIREBASE_PROJECT_ID    || '').trim();
  const clientEmail  = (process.env.FIREBASE_CLIENT_EMAIL  || '').trim();
  const rawKey       = (process.env.FIREBASE_PRIVATE_KEY   || '').trim();

  if (!projectId || !clientEmail || !rawKey) {
    console.warn(
      '⚠️  Firebase Admin SDK: credentials incomplete. ' +
      'Google ID token verification is disabled. ' +
      'Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in env.',
    );
    return null;
  }

  // Unescape literal \n sequences that come from .env files / cloud env dashboards
  const privateKey = rawKey.replace(/\\n/g, '\n');

  try {
    const app = admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
    initialized = true;
    console.log('🔥  Firebase Admin SDK initialized successfully');
    return app;
  } catch (err: any) {
    // If the app is already initialized (race condition), return the existing one
    if (err.code === 'app/duplicate-app') {
      initialized = true;
      return admin.app();
    }
    console.warn('⚠️  Firebase Admin SDK initialization failed:', err.message);
    return null;
  }
}

/**
 * Verifies a Firebase ID Token.
 * Returns the decoded token payload, or null if Firebase is not configured.
 */
export async function verifyFirebaseIdToken(idToken: string): Promise<admin.auth.DecodedIdToken | null> {
  const app = initFirebaseAdmin();
  if (!app) return null;

  try {
    return await admin.auth(app).verifyIdToken(idToken);
  } catch (err: any) {
    console.warn('⚠️  Firebase ID token verification failed:', err.message);
    return null;
  }
}
