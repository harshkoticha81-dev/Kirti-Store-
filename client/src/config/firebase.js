import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

// Firebase Web App Configuration
// Values can be provided via environment variables in client/.env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'kirti-store',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

// Check if valid client API key is configured
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.apiKey.length > 5);

let app = null;
let auth = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
  } catch (err) {
    console.warn('[Firebase Auth]: Initialized in fallback mode:', err.message);
  }
}

export { app, auth, RecaptchaVerifier, signInWithPhoneNumber };
