/**
 * Optional Firebase link for Care Circle live sync.
 *
 * The app stays offline-first: when no `EXPO_PUBLIC_FIREBASE_*` values are
 * present this module returns `null` everywhere and every caller degrades to
 * the local-only experience (Zustand + AsyncStorage).
 *
 * Uses the Firebase **JS SDK** (not React Native Firebase) so the app keeps
 * working in Expo Go without a development build.
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import * as firebaseAuth from 'firebase/auth';
import { Auth, getAuth, initializeAuth, signInAnonymously } from 'firebase/auth';
import { Firestore, getFirestore, initializeFirestore } from 'firebase/firestore';

/**
 * `getReactNativePersistence` is exported by the React Native build of
 * `firebase/auth` (which Metro selects) but is missing from the public web
 * typings, so we reach for it defensively.
 */
const rnAuth = firebaseAuth as typeof firebaseAuth & {
  getReactNativePersistence?: (storage: unknown) => firebaseAuth.Persistence;
};

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

/** True when enough config is present to attempt a cloud connection. */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured) return null;
  if (!app) {
    app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
  }
  return app;
}

export function getFirebaseAuth(): Auth | null {
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;
  if (auth) return auth;

  if (Platform.OS === 'web') {
    auth = getAuth(firebaseApp);
    return auth;
  }

  try {
    // Persist the anonymous session so a restart keeps the same uid (and with
    // it the circles this device belongs to).
    const persistence = rnAuth.getReactNativePersistence?.(AsyncStorage);
    auth = persistence
      ? initializeAuth(firebaseApp, { persistence })
      : getAuth(firebaseApp);
  } catch {
    // Already initialized (Fast Refresh) — reuse the existing instance.
    auth = getAuth(firebaseApp);
  }
  return auth;
}

export function getFirestoreDb(): Firestore | null {
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;
  if (db) return db;

  try {
    db = initializeFirestore(firebaseApp, {
      // React Native has no native fetch streaming; long-polling auto-detect
      // keeps listeners stable on device and web.
      experimentalAutoDetectLongPolling: true,
    });
  } catch {
    db = getFirestore(firebaseApp);
  }
  return db;
}

/**
 * Returns the signed-in uid, creating an anonymous account on first use.
 * Returns null when Firebase is not configured or sign-in fails.
 */
export async function ensureFirebaseUser(): Promise<string | null> {
  const firebaseAuth = getFirebaseAuth();
  if (!firebaseAuth) return null;
  if (firebaseAuth.currentUser) return firebaseAuth.currentUser.uid;

  try {
    const credential = await signInAnonymously(firebaseAuth);
    return credential.user.uid;
  } catch (err) {
    console.warn('[firebase] Anonymous sign-in failed:', err);
    return null;
  }
}
