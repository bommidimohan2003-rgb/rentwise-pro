import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";

const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    "AIzaSyCrhJTILC8-I1ubNDA6wyHuUtdy8L3W8UY",
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mohan-9d77e.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mohan-9d77e",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    "mohan-9d77e.firebasestorage.app",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "405693280587",
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    "1:405693280587:web:f33c0d5823bcf52d4078ce",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

export async function signInWithGooglePopup() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const idToken = await user.getIdToken();
    return {
      user,
      idToken,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    };
  } catch (err: unknown) {
    const errorObj = err as { code?: string; message?: string };
    console.warn(
      "[Firebase] Popup sign-in warning/fallback:",
      errorObj?.code,
      errorObj?.message,
    );
    if (
      errorObj?.code === "auth/popup-blocked" ||
      errorObj?.code === "auth/popup-closed-by-user" ||
      errorObj?.code === "auth/unauthorized-domain"
    ) {
      // Fallback to redirect sign-in flow if popup is blocked
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw err;
  }
}

export async function handleRedirectResult() {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      const user = result.user;
      const idToken = await user.getIdToken();
      return {
        user,
        idToken,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      };
    }
    return null;
  } catch (err) {
    console.error("[Firebase] Redirect result error:", err);
    throw err;
  }
}

export async function signOutFirebase() {
  try {
    await firebaseSignOut(auth);
  } catch (err) {
    console.warn("[Firebase] Sign out error:", err);
  }
}

export { onAuthStateChanged, type FirebaseUser };
