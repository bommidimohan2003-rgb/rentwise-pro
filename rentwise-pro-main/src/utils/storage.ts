const USER_SPECIFIC_KEYS = new Set([
  "payent:wishlist",
  "payent:notifications",
  "payent:messages",
  "payent:orders",
  "payent:customProducts",
]);

function getNamespacedKey(key: string): string {
  if (typeof window === "undefined") return key;
  if (USER_SPECIFIC_KEYS.has(key)) {
    try {
      const rawUser = window.localStorage.getItem("payent:currentUser");
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        if (parsed?.email) {
          // Namespace by user email to keep data strictly separated per user
          return `${key}:${parsed.email}`;
        }
      }
    } catch {
      /* ignore and return default key */
    }
  }
  return key;
}

export const storage = {
  get<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    try {
      const namespaced = getNamespacedKey(key);
      const raw = window.localStorage.getItem(namespaced);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  set<T>(key: string, value: T) {
    if (typeof window === "undefined") return;
    const namespaced = getNamespacedKey(key);
    window.localStorage.setItem(namespaced, JSON.stringify(value));
  },
  remove(key: string) {
    if (typeof window === "undefined") return;
    const namespaced = getNamespacedKey(key);
    window.localStorage.removeItem(namespaced);
  },
};

export const STORAGE_KEYS = {
  users: "payent:users",
  currentUser: "payent:currentUser",
  token: "payent:token",
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
