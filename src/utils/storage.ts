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
  users: "payent:users",
  currentUser: "payent:currentUser",
  wishlist: "payent:wishlist",
  notifications: "payent:notifications",
  messages: "payent:messages",
  orders: "payent:orders",
  theme: "payent:theme",
  otp: "payent:otp",
  otpEmail: "payent:otpEmail",
  customProducts: "payent:customProducts",
  pendingUser: "payent:pendingUser",
} as const;
