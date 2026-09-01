import { useCallback, useEffect, useState } from "react";
import { STORAGE_KEYS, storage } from "@/utils/storage";
import { api } from "@/utils/api";
import type { User } from "@/types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      // 1. Hydrate cached user session
      const cachedUser = storage.get<User | null>(
        STORAGE_KEYS.currentUser,
        null,
      );
      if (cachedUser) {
        setUser(cachedUser);
        setReady(true);
      }

      const token = storage.get<string | null>(STORAGE_KEYS.token, null);
      if (token) {
        try {
          const profile = await api.getMe(token);
          const loggedUser: User = {
            id: profile.email || profile.id || cachedUser?.id || token,
            fullName:
              profile.fullName ||
              cachedUser?.fullName ||
              profile.email?.split("@")[0] ||
              "User",
            email: profile.email || cachedUser?.email || "",
            phone: profile.phone || cachedUser?.phone || "",
            address: profile.address || cachedUser?.address || "",
            city: profile.city || cachedUser?.city || "",
            pincode: profile.pincode || cachedUser?.pincode || "",
            avatar: profile.avatar || cachedUser?.avatar,
            role: profile.role || cachedUser?.role || "customer",
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

    const onStorage = () => {
      setUser(storage.get<User | null>(STORAGE_KEYS.currentUser, null));
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("payent:storage_change", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("payent:storage_change", onStorage);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await api.login(email, password);
      if (res.success && res.token) {
        storage.set(STORAGE_KEYS.token, res.token);

        let loggedUser: User;
        if (res.user) {
          loggedUser = {
            id: res.user.email || res.user.id || email,
            fullName:
              res.user.fullName ||
              res.user.name ||
              email.split("@")[0],
            email: res.user.email || email,
            phone: res.user.phone || "",
            address: res.user.address || "",
            city: res.user.city || "",
            pincode: res.user.pincode || "",
            avatar: res.user.avatar,
            role: res.user.role || res.role || "customer",
          };
        } else {
          try {
            const profile = await api.getMe(res.token);
            loggedUser = {
              id: profile.email || email,
              fullName:
                profile.fullName ||
                profile.name ||
                email.split("@")[0],
              email: profile.email || email,
              phone: profile.phone || "",
              address: profile.address || "",
              city: profile.city || "",
              pincode: profile.pincode || "",
              avatar: profile.avatar,
              role: profile.role || res.role || "customer",
            };
          } catch {
            loggedUser = {
              id: email,
              fullName: email.split("@")[0],
              email: email,
              role: res.role || "customer",
            };
          }
        }

        storage.set(STORAGE_KEYS.currentUser, loggedUser);
        setUser(loggedUser);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("payent:storage_change"));
        }
        return { ok: true };
      }
      return { ok: false, error: "Invalid credentials from server." };
    } catch (e) {
      const err = e as { name?: string; message?: string };
      if (
        err?.name === "AbortError" ||
        err?.message?.includes("aborted") ||
        err?.message?.includes("signal is aborted")
      ) {
        return { ok: false, error: "Connection timed out. Please try logging in again." };
      }
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
