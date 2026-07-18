import { adminApi, AdminUser } from "./api";

export const authService = {
  async login(
    email: string,
    password: string,
  ): Promise<{ success: boolean; token: string; user: AdminUser }> {
    const response = await adminApi.post("/auth/login", { email, password });
    return response.data;
  },

  async logout(): Promise<void> {
    await adminApi.post("/auth/logout");
    if (typeof window !== "undefined") {
      localStorage.removeItem("payent:token");
      localStorage.removeItem("payent:currentUser");
    }
  },

  async getMe(): Promise<AdminUser> {
    const response = await adminApi.get("/auth/me");
    return response.data;
  },

  isAuthenticated(): boolean {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("payent:admin:token");
  },

  getCurrentUser(): AdminUser | null {
    if (typeof window === "undefined") return null;
    const user = localStorage.getItem("payent:admin:current_user");
    return user ? JSON.parse(user) : null;
  },
};
