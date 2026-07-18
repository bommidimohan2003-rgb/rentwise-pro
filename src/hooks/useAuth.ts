import { useCallback, useEffect, useState } from "react";
import { STORAGE_KEYS, storage } from "@/utils/storage";
import { api } from "@/utils/api";
import type { User } from "@/types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
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
        } catch (err) {
          console.error("[Auth] Session validation failed:", err);
          storage.remove(STORAGE_KEYS.token);
          storage.remove(STORAGE_KEYS.currentUser);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setReady(true);
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
      return { ok: false, error: err.message || "Failed to initiate registration." };
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
