import axios from "axios";

const isLocal =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");
const API_BASE =
  import.meta.env.VITE_API_URL !== undefined
    ? import.meta.env.VITE_API_URL
    : isLocal
      ? "http://127.0.0.1:8001"
      : "";

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
