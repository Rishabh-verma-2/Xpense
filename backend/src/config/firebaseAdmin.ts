import * as admin from 'firebase-admin';

let firebaseApp: admin.app.App | null = null;

export function initFirebaseAdmin() {
  if (firebaseApp) return firebaseApp;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (privateKey) {
    // Unescape escaped newlines if passed as a string in .env
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (projectId && clientEmail && privateKey) {
    try {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log('🔥  Firebase Admin SDK initialized successfully');
    } catch (err: any) {
      console.warn('⚠️  Firebase Admin SDK initialization warning:', err.message);
    }
  } else {
    console.warn('⚠️  Firebase credentials incomplete in .env. Google ID token verification will run in simulation mode for dev testing if requested.');
  }

  return firebaseApp;
}

export async function verifyFirebaseIdToken(idToken: string) {
  const app = initFirebaseAdmin();
  if (app) {
    return await admin.auth().verifyIdToken(idToken);
  }
  return null;
}
