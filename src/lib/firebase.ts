import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged as fbOnAuthStateChanged,
  onIdTokenChanged as fbOnIdTokenChanged,
  setPersistence,
  browserLocalPersistence,
  type Auth,
  type User as FirebaseUser,
  type NextOrObserver,
  type Unsubscribe,
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
  measurementId:
    import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-MQXTJ87BXS",
};

function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === "undefined") return null;
  try {
    return !getApps().length ? initializeApp(firebaseConfig) : getApp();
  } catch (err) {
    console.warn("[Firebase] App init warning:", err);
    return null;
  }
}

export const app = getFirebaseApp();

function getFirebaseAuth(): Auth | null {
  if (typeof window === "undefined") return null;
  const currentApp = app || getFirebaseApp();
  if (!currentApp) return null;
  try {
    const authInstance = getAuth(currentApp);
    setPersistence(authInstance, browserLocalPersistence).catch((err) => {
      console.warn("[Firebase] Failed to set browserLocalPersistence:", err);
    });
    return authInstance;
  } catch (err) {
    console.warn("[Firebase] Auth init warning:", err);
    return null;
  }
}

export const auth = getFirebaseAuth();

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

function isMobileBrowser(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
}

export async function upsertFirestoreUser(user: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  pincode?: string | null;
  role?: string | null;
}) {
  if (typeof window === "undefined" || !user?.uid) return;
  const currentApp = app || getFirebaseApp();
  if (!currentApp) return;

  try {
    const { getFirestore, doc, setDoc, serverTimestamp } = await import(
      "firebase/firestore"
    );
    const firestoreDb = getFirestore(currentApp);
    const userRef = doc(firestoreDb, "users", user.uid);
    await setDoc(
      userRef,
      {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        phone: user.phone || null,
        address: user.address || null,
        city: user.city || null,
        pincode: user.pincode || null,
        role: user.role || "user",
        lastLoginAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (err) {
    console.warn("[Firestore] Sync notice:", err);
  }
}

export async function signInWithGooglePopup() {
  const currentAuth = auth || getFirebaseAuth();
  if (!currentAuth) return null;

  try {
    if (isMobileBrowser()) {
      await signInWithRedirect(currentAuth, googleProvider);
      return null;
    }

    const result = await signInWithPopup(currentAuth, googleProvider);
    const user = result.user;
    const idToken = await user.getIdToken();

    await upsertFirestoreUser({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    });

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
      "[Firebase] Google sign-in warning:",
      errorObj?.code,
      errorObj?.message,
    );

    if (
      errorObj?.code === "auth/popup-closed-by-user" ||
      errorObj?.code === "auth/cancelled-popup-request"
    ) {
      return null;
    }
    if (errorObj?.code === "auth/popup-blocked") {
      if (currentAuth) await signInWithRedirect(currentAuth, googleProvider);
      return null;
    }
    if (errorObj?.code === "auth/account-exists-with-different-credential") {
      throw new Error(
        "An account already exists with this email address. Please log in with your email and password.",
      );
    }
    throw err;
  }
}

export async function handleRedirectResult() {
  const currentAuth = auth || getFirebaseAuth();
  if (!currentAuth) return null;

  try {
    const result = await getRedirectResult(currentAuth);
    if (result) {
      const user = result.user;
      const idToken = await user.getIdToken();

      await upsertFirestoreUser({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      });

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
  const currentAuth = auth || getFirebaseAuth();
  if (!currentAuth) return;
  try {
    await firebaseSignOut(currentAuth);
  } catch (err) {
    console.warn("[Firebase] Sign out error:", err);
  }
}

export function onAuthStateChanged(
  nextOrObserver: NextOrObserver<FirebaseUser>,
): Unsubscribe {
  const currentAuth = auth || getFirebaseAuth();
  if (!currentAuth) {
    return () => {};
  }
  return fbOnAuthStateChanged(currentAuth, nextOrObserver);
}

export function onIdTokenChanged(
  nextOrObserver: NextOrObserver<FirebaseUser>,
): Unsubscribe {
  const currentAuth = auth || getFirebaseAuth();
  if (!currentAuth) {
    return () => {};
  }
  return fbOnIdTokenChanged(currentAuth, nextOrObserver);
}

export { type FirebaseUser };
