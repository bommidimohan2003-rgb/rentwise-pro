export const storage = {
  get<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  set<T>(key: string, value: T) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, JSON.stringify(value));
  },
  remove(key: string) {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
  },
};

export const STORAGE_KEYS = {
  users: "techrent:users",
  currentUser: "techrent:currentUser",
  wishlist: "techrent:wishlist",
  notifications: "techrent:notifications",
  messages: "techrent:messages",
  orders: "techrent:orders",
  theme: "techrent:theme",
  otp: "techrent:otp",
  otpEmail: "techrent:otpEmail",
} as const;
