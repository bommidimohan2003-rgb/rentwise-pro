import { useCallback, useEffect, useState } from "react";
import { STORAGE_KEYS, storage } from "@/utils/storage";
import { api } from "@/utils/api";
import { auth, handleRedirectResult, onIdTokenChanged } from "@/lib/firebase";
import type { User } from "@/types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      // 1. Check for pending Google OAuth redirect result
      try {
        const redirectRes = await handleRedirectResult();
        if (redirectRes?.email) {
          const { email, displayName, idToken } = redirectRes;
          try {
            const syncRes = await api.googleSync({
              email,
              fullName: displayName || undefined,
              idToken,
            });
            if (syncRes?.success) {
              const loggedUser: User = syncRes.user || {
                id: email,
                fullName: displayName || email.split("@")[0],
                email,
                role: "user",
              };
              const userToken = syncRes.token || `google-session-${Date.now()}`;
              storage.set(STORAGE_KEYS.token, userToken);
              storage.set(STORAGE_KEYS.currentUser, loggedUser);
              setUser(loggedUser);
            }
          } catch (syncErr) {
            console.warn("[Auth] Redirect googleSync notice:", syncErr);
            const fallbackUser: User = {
              id: `google-user-${Date.now()}`,
              fullName: displayName || email.split("@")[0],
              email,
              role: "user",
            };
            const fallbackToken = `google-offline-token-${Date.now()}`;
            storage.set(STORAGE_KEYS.token, fallbackToken);
            storage.set(STORAGE_KEYS.currentUser, fallbackUser);
            setUser(fallbackUser);
          }
        }
      } catch (err) {
        console.warn("[Auth] Redirect result check warning:", err);
      }

      // 2. Hydrate cached user session
      const cachedUser = storage.get<User | null>(
        STORAGE_KEYS.currentUser,
        null,
      );
      if (cachedUser) {
        setUser(cachedUser);
      }

      const token = storage.get<string | null>(STORAGE_KEYS.token, null);
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
        } catch (err: unknown) {
          console.warn("[Auth] Session validation notice:", err);
          const errorObj = err as { status?: number; message?: string };
          // Only invalidate session if backend explicitly returned a 401 Unauthorized response
          const is401 =
            errorObj?.status === 401 ||
            (errorObj?.message &&
              (errorObj.message.includes("401") ||
                errorObj.message.includes("Invalid token") ||
                errorObj.message.includes("expired")));
          if (is401) {
            storage.remove(STORAGE_KEYS.token);
            storage.remove(STORAGE_KEYS.currentUser);
            setUser(null);
          }
        }
      } else if (!cachedUser) {
        setUser(null);
      }
      setReady(true);
    };

    initAuth();

    // 3. Register Firebase onIdTokenChanged to silently auto-refresh tokens in background
    let unsubscribeIdToken: (() => void) | undefined;
    try {
      unsubscribeIdToken = onIdTokenChanged(auth, async (fbUser) => {
        if (fbUser) {
          try {
            const newToken = await fbUser.getIdToken();
            if (newToken) {
              storage.set(STORAGE_KEYS.token, newToken);
            }
          } catch (tokenErr) {
            console.warn("[Auth] Background token refresh notice:", tokenErr);
          }
        }
      });
    } catch (e) {
      console.warn("[Auth] Failed to subscribe to onIdTokenChanged:", e);
    }

    const onStorage = () => {
      setUser(storage.get<User | null>(STORAGE_KEYS.currentUser, null));
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("payent:storage_change", onStorage);
    return () => {
      if (unsubscribeIdToken) unsubscribeIdToken();
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("payent:storage_change", onStorage);
    };
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
      return merged;
    });
  }, []);

  return { user, ready, login, register, logout, updateUser };
}
