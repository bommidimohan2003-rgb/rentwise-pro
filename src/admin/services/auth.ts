import { adminApi, AdminUser } from "./api";

export const authService = {
  async login(
    email: string,
    password: string,
  ): Promise<{ success: boolean; token: string; user: AdminUser }> {
    const response = await adminApi.post("/auth/login", { email, password });
    if (response.data?.token && response.data?.user) {
      if (typeof window !== "undefined") {
        localStorage.setItem("payent:admin:token", response.data.token);
        localStorage.setItem(
          "payent:admin:current_user",
          JSON.stringify(response.data.user),
        );
      }
    }
    return response.data;
  },

  async registerAdmin(data: {
    email: string;
    password: string;
    fullName?: string;
    adminCode?: string;
  }): Promise<{ success: boolean; message: string }> {
    const response = await adminApi.post("/auth/register", {
      email: data.email,
      password: data.password,
      full_name: data.fullName,
      admin_code: data.adminCode,
    });
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await adminApi.post("/auth/logout");
    } catch (err) {
      console.warn("Logout endpoint failed:", err);
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("payent:token");
      localStorage.removeItem("payent:currentUser");
      localStorage.removeItem("payent:admin:token");
      localStorage.removeItem("payent:admin:current_user");
    }
  },

  async getMe(): Promise<AdminUser> {
    const response = await adminApi.get("/auth/me");
    return response.data;
  },

  isAuthenticated(): boolean {
    if (typeof window === "undefined") return false;
    const adminToken = localStorage.getItem("payent:admin:token");
    const clientToken = localStorage.getItem("payent:token");
    const currentUserRaw = localStorage.getItem("payent:currentUser");

    if (adminToken) return true;
    if (clientToken && currentUserRaw) {
      try {
        const u = JSON.parse(currentUserRaw);
        return u?.role === "admin";
      } catch {
        return false;
      }
    }
    return false;
  },

  getCurrentUser(): AdminUser | null {
    if (typeof window === "undefined") return null;
    const adminUser = localStorage.getItem("payent:admin:current_user");
    if (adminUser) {
      try {
        return JSON.parse(adminUser);
      } catch {
        // fallback
      }
    }

    const currentUserRaw = localStorage.getItem("payent:currentUser");
    if (currentUserRaw) {
      try {
        const u = JSON.parse(currentUserRaw);
        if (u?.role === "admin") {
          return {
            id: u.email || u.id,
            fullName: u.fullName || u.email,
            email: u.email,
            phone: u.phone || "",
            role: "admin",
            status: "active",
            verified: true,
            avatar:
              u.avatar ||
              "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
            createdAt: new Date().toISOString(),
          };
        }
      } catch {
        return null;
      }
    }
    return null;
  },
};
