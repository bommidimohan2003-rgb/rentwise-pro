import { useCallback, useEffect, useState } from "react";
import { STORAGE_KEYS, storage } from "@/utils/storage";
import type { User } from "@/types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(storage.get<User | null>(STORAGE_KEYS.currentUser, null));
    setReady(true);
    const onStorage = () => setUser(storage.get<User | null>(STORAGE_KEYS.currentUser, null));
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const login = useCallback((email: string, password: string) => {
    const users = storage.get<User[]>(STORAGE_KEYS.users, []);
    const found = users.find((u) => u.email === email && u.password === password);
    if (!found) return { ok: false, error: "Invalid email or password" };
    storage.set(STORAGE_KEYS.currentUser, found);
    setUser(found);
    return { ok: true };
  }, []);

  const register = useCallback((data: Omit<User, "id" | "createdAt">) => {
    const users = storage.get<User[]>(STORAGE_KEYS.users, []);
    if (users.some((u) => u.email === data.email)) {
      return { ok: false, error: "Email already registered" };
    }
    const newUser: User = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    storage.set(STORAGE_KEYS.users, [...users, newUser]);
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    storage.remove(STORAGE_KEYS.currentUser);
    setUser(null);
  }, []);

  const updateUser = useCallback((patch: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const merged = { ...prev, ...patch };
      storage.set(STORAGE_KEYS.currentUser, merged);
      const users = storage.get<User[]>(STORAGE_KEYS.users, []);
      storage.set(
        STORAGE_KEYS.users,
        users.map((u) => (u.id === merged.id ? merged : u)),
      );
      return merged;
    });
  }, []);

  return { user, ready, login, register, logout, updateUser };
}
