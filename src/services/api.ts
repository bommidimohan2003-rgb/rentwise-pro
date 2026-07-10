import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const user = window.localStorage.getItem("techrent:currentUser");
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
