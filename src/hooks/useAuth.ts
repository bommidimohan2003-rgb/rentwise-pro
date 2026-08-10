import { useCallback, useEffect, useState } from "react";
import { STORAGE_KEYS, storage } from "@/utils/storage";
import { api } from "@/utils/api";
import type { User } from "@/types";
import {
  saveUserToFirebase,
  getUserFromFirebase,
  updateUserInFirebase,
} from "@/lib/firebase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    return storage.get<User | null>(STORAGE_KEYS.currentUser, null);
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const cachedUser = storage.get<User | null>(STORAGE_KEYS.currentUser, null);
      const token = storage.get<string | null>(STORAGE_KEYS.token, null);

      // Hydrate state immediately from local storage cache
      if (cachedUser) {
        setUser(cachedUser);
      }
      setReady(true);

      // Background session verification
      if (token) {
        try {
          const profile = await api.getMe(token);
          const loggedUser: User = {
            id: profile.email,
            fullName: profile.fullName || profile.email.split("@")[0],
            email: profile.email,
            role: profile.role,
          };
          storage.set(STORAGE_KEYS.currentUser, loggedUser);
          setUser(loggedUser);

          // Store/Sync user data in Firebase Firestore
          saveUserToFirebase(loggedUser);
        } catch (err: any) {
          console.warn("[Auth] Background session check warning:", err?.message || err);
          // ONLY clear session if explicitly revoked/expired (HTTP 401)
          if (err?.status === 401 || err?.message?.toLowerCase().includes("revoked") || err?.message?.toLowerCase().includes("expired")) {
            console.error("[Auth] Session revoked or expired by server. Clearing credentials.");
            storage.remove(STORAGE_KEYS.token);
            storage.remove(STORAGE_KEYS.currentUser);
            setUser(null);
          }
        }
      } else if (cachedUser?.email) {
        // Hydrate from Firebase Firestore if token is local/social
        try {
          const firestoreDoc = await getUserFromFirebase(cachedUser.email);
          if (firestoreDoc) {
            setUser(firestoreDoc);
            storage.set(STORAGE_KEYS.currentUser, firestoreDoc);
          }
        } catch (e) {
          console.warn("[Auth] Firestore cache fallback notice:", e);
        }
      }
    };

    initAuth();

    const onStorage = () => {
      setUser(storage.get<User | null>(STORAGE_KEYS.currentUser, null));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await api.login(email, password);
      if (res.success && res.token) {
        storage.set(STORAGE_KEYS.token, res.token);

        // Fetch user details from the backend using the token
        const profile = await api.getMe(res.token);
        const loggedUser: User = {
          id: profile.email,
          fullName: profile.fullName || profile.email.split("@")[0],
          email: profile.email,
          role: profile.role,
        };

        storage.set(STORAGE_KEYS.currentUser, loggedUser);
        setUser(loggedUser);

        // Save complete user profile to Firebase Firestore database
        saveUserToFirebase(loggedUser);

        return { ok: true };
      }
      return { ok: false, error: "Invalid credentials from server." };
    } catch (e) {
      const err = e as { message?: string };
      return { ok: false, error: err.message || "Invalid email or password." };
    }
  }, []);

  const register = useCallback(async (email: string, phone: string) => {
    try {
      await api.registerRequest(email, phone);
      return { ok: true };
    } catch (e) {
      const err = e as { message?: string };
      return {
        ok: false,
        error: err.message || "Failed to initiate registration.",
      };
    }
  }, []);

  const logout = useCallback(() => {
    storage.remove(STORAGE_KEYS.token);
    storage.remove(STORAGE_KEYS.currentUser);
    if (typeof window !== "undefined") {
      localStorage.removeItem("payent:admin:token");
      localStorage.removeItem("payent:admin:current_user");
    }
    setUser(null);
  }, []);

  const updateUser = useCallback((patch: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const merged = { ...prev, ...patch };
      storage.set(STORAGE_KEYS.currentUser, merged);

      // Persist user profile updates to Firebase Firestore
      if (merged.email) {
        updateUserInFirebase(merged.email, patch);
      }
      return merged;
    });
  }, []);

  const loginWithGoogleUser = useCallback((userObj: User) => {
    storage.set(STORAGE_KEYS.currentUser, userObj);
    storage.set(STORAGE_KEYS.token, `google-firebase-jwt-${Date.now()}`);
    setUser(userObj);
    saveUserToFirebase(userObj);
  }, []);

  return { user, ready, login, register, logout, updateUser, loginWithGoogleUser };
}


