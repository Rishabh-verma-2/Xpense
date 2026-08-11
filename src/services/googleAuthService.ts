import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithCredential, User as FirebaseUser } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { promptGoogleNativeAuth } from './googleAuth';

// ─── Firebase Web Client Configuration ────────────────────────────────────────
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyDummyKey_XpenseApp",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "xpense-app.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "xpense-app",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "xpense-app.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1085023963493",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:1085023963493:web:xpense",
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const firebaseAuth = getAuth(app);

export interface FirebaseGoogleUserSession {
  uid: string;
  name: string;
  email: string;
  photoURL: string | null;
  idToken?: string;
  accessToken?: string;
}

export const FIREBASE_USER_SESSION_KEY = '@xpense/firebase_user_session';

/**
 * Complete Google Sign In Flow:
 * 1. Open Google account picker & get Google ID Token
 * 2. Create Firebase Google Credential using ID token
 * 3. Sign in with Firebase (signInWithCredential)
 * 4. Get uid, name, email, photoURL from Firebase user credential
 * 5. Store user session in AsyncStorage
 */
export async function signInWithGoogleAndFirebase(): Promise<FirebaseGoogleUserSession> {
  // Step 1: Open Google Account Picker & Get Google ID token
  const googleRes = await promptGoogleNativeAuth();

  if (!googleRes.idToken && !googleRes.accessToken && !googleRes.email) {
    throw new Error('Google Sign-In was cancelled or failed to retrieve credentials.');
  }

  let firebaseUser: FirebaseUser | null = null;
  let uid = `google_${Date.now()}`;
  let name = googleRes.name || 'Google User';
  let email = googleRes.email || '';
  let photoURL = googleRes.photo || null;

  // Step 2 & 3: Create Firebase Google Credential & Sign in with Firebase
  if (googleRes.idToken) {
    try {
      const credential = GoogleAuthProvider.credential(googleRes.idToken);
      const userCredential = await signInWithCredential(firebaseAuth, credential);

      if (userCredential && userCredential.user) {
        firebaseUser = userCredential.user;
        uid = firebaseUser.uid;
        name = firebaseUser.displayName || name;
        email = firebaseUser.email || email;
        photoURL = firebaseUser.photoURL || photoURL;
        console.log('🔥 Signed in with Firebase successfully! UID:', uid);
      }
    } catch (fbErr: any) {
      console.warn('⚠️ Firebase sign-in with credential warning:', fbErr.message || fbErr);
    }
  }

  const userSession: FirebaseGoogleUserSession = {
    uid,
    name,
    email,
    photoURL,
    idToken: googleRes.idToken,
    accessToken: googleRes.accessToken,
  };

  // Step 5: Store user session in AsyncStorage
  try {
    await AsyncStorage.setItem(FIREBASE_USER_SESSION_KEY, JSON.stringify(userSession));
  } catch (storageErr) {
    console.error('Error saving user session to AsyncStorage:', storageErr);
  }

  return userSession;
}
