import axios from "axios";

const getApiBase = () => {
  if (typeof window !== "undefined") {
    const win = window as unknown as { PAYENT_API_URL?: string };
    if (win.PAYENT_API_URL) return win.PAYENT_API_URL;
  }
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const isLocal = host === "localhost" || host === "127.0.0.1";
    if (isLocal) return "http://127.0.0.1:8001";
    if (host.endsWith(".onrender.com")) {
      return "https://payent-backend.onrender.com";
    }
    return window.location.origin;
  }
  return "";
};
const API_BASE = getApiBase();

export const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const user = window.localStorage.getItem("payent:currentUser");
    if (user) {
      try {
        const parsed = JSON.parse(user);
        if (parsed?.id) config.headers.set("X-User-Id", parsed.id);
      } catch {
        /* ignore */
      }
    }
  }
  return config;
});
