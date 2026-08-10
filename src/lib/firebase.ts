import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  type ConfirmationResult,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import type { User } from "@/types";

// Firebase Configuration from environment variables
const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    "AIzaSyCrhJTILC8-I1ubNDA6wyHuUtdy8L3W8UY",
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    "mohan-9d77e.firebaseapp.com",
  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID || "mohan-9d77e",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    "mohan-9d77e.firebasestorage.app",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "405693280587",
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    "1:405693280587:web:f33c0d5823bcf52d4078ce",
};

// Initialize Firebase App instance

export const app =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

/**
 * Sign in using Google OAuth via Firebase Popup.
 */
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const idToken = await user.getIdToken();
    const googleUser = {
      email: user.email || "",
      fullName: user.displayName || user.email?.split("@")[0] || "Google User",
      avatar: user.photoURL || undefined,
      phone: user.phoneNumber || "",
      uid: user.uid,
    };

    if (googleUser.email) {
      await saveUserToFirebase(googleUser);
    }

    return {
      success: true,
      idToken,
      googleUser,
    };
  } catch (error: any) {
    console.error("[Firebase Auth] Google Sign-In failed:", error);
    throw error;
  }
}


// -------------------------------------------------------------
// FIRESTORE DATABASE DATA STORAGE HELPERS
// -------------------------------------------------------------

/**
 * Normalizes user email for Firestore document ID.
 */
export function getDocId(email: string): string {
  return email.toLowerCase().trim().replace(/[/.]/g, "_");
}

/**
 * Save user profile data to Firebase Firestore `users` collection AND MySQL Workbench.
 */
export async function saveUserToFirebase(userData: Partial<User> & { email: string }) {
  try {
    const docId = getDocId(userData.email);
    const userRef = doc(db, "users", docId);
    
    const payload = {
      ...userData,
      updatedAt: serverTimestamp(),
    };

    // 1. Save to Google Firebase Firestore
    await setDoc(userRef, payload, { merge: true });
    console.log(`[Firebase Firestore] User profile successfully saved for ${userData.email}`);

    // 2. Sync to MySQL Workbench database
    try {
      const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8000";
      await fetch(`${apiBase}/api/auth/google-sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userData.email,
          fullName: userData.fullName || userData.email.split("@")[0],
          phone: userData.phone || "",
          avatar: userData.avatar || "",
          address: userData.address || "",
          city: userData.city || "",
          pincode: userData.pincode || "",
          role: userData.role || "user",
        }),
      });
      console.log(`[MySQL Workbench] User profile successfully synced to MySQL for ${userData.email}`);
    } catch (mysqlErr) {
      console.warn("[MySQL Workbench] Sync notice:", mysqlErr);
    }

    return { success: true };
  } catch (error) {
    console.error("[Firebase Firestore] Error saving user data:", error);
    // Silent fallback if credentials are placeholder demo mode
    return { success: false, error };
  }
}

/**
 * Fetch user profile from Firebase Firestore.
 */
export async function getUserFromFirebase(email: string): Promise<User | null> {
  try {
    const docId = getDocId(email);
    const userRef = doc(db, "users", docId);
    const snapshot = await getDoc(userRef);
    if (snapshot.exists()) {
      return snapshot.data() as User;
    }
    return null;
  } catch (error) {
    console.error("[Firebase Firestore] Error fetching user data:", error);
    return null;
  }
}

/**
 * Update specific fields in Firebase Firestore for a user.
 */
export async function updateUserInFirebase(email: string, patch: Record<string, any>) {
  try {
    const docId = getDocId(email);
    const userRef = doc(db, "users", docId);
    await updateDoc(userRef, {
      ...patch,
      updatedAt: serverTimestamp(),
    });
    console.log(`[Firebase Firestore] User profile patch updated for ${email}`);
    return { success: true };
  } catch (error) {
    console.error("[Firebase Firestore] Error updating user patch:", error);
    return { success: false, error };
  }
}

// -------------------------------------------------------------
// FIREBASE PHONE AUTHENTICATION & OTP HELPERS
// -------------------------------------------------------------

/**
 * Initialize RecaptchaVerifier for Phone Authentication.
 */
export function initRecaptcha(containerId: string = "recaptcha-container"): RecaptchaVerifier | null {
  try {
    if (typeof window === "undefined") return null;
    const element = document.getElementById(containerId);
    if (!element) {
      console.warn(`[Firebase Auth] Recaptcha element #${containerId} not found in DOM.`);
      return null;
    }

    const recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: "invisible",
      callback: () => {
        console.log("[Firebase Auth] reCAPTCHA solved automatically.");
      },
      "expired-callback": () => {
        console.warn("[Firebase Auth] reCAPTCHA expired.");
      },
    });

    return recaptchaVerifier;
  } catch (error) {
    console.error("[Firebase Auth] Failed to initialize RecaptchaVerifier:", error);
    return null;
  }
}

/**
 * Send SMS OTP using Firebase Phone Auth.
 */
export async function sendFirebaseOTP(
  phoneNumber: string,
  verifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
  // Ensure E.164 format (+91 for India if not specified)
  let formattedPhone = phoneNumber.trim().replace(/\s+/g, "");
  if (!formattedPhone.startsWith("+")) {
    formattedPhone = formattedPhone.length === 10 ? `+91${formattedPhone}` : `+${formattedPhone}`;
  }

  try {
    const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, verifier);
    console.log(`[Firebase Auth] SMS OTP sent successfully to ${formattedPhone}`);
    return confirmationResult;
  } catch (error) {
    console.error("[Firebase Auth] Error sending SMS OTP via Firebase:", error);
    throw error;
  }
}

/**
 * Confirm 6-digit SMS OTP using Firebase ConfirmationResult.
 */
export async function verifyFirebaseOTP(
  confirmationResult: ConfirmationResult,
  otpCode: string
) {
  try {
    const userCredential = await confirmationResult.confirm(otpCode);
    console.log("[Firebase Auth] OTP verified successfully via Firebase Phone Auth!");
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error("[Firebase Auth] Failed to confirm Firebase OTP code:", error);
    throw error;
  }
}
