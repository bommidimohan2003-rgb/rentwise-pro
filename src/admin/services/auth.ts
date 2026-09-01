import { adminApi, AdminUser } from "./api";

export const authService = {
  async login(
    email: string,
    password: string,
  ): Promise<{ success: boolean; token: string; user: AdminUser }> {
    const response = await adminApi.post("/auth/login", { email, password });
    if (response.data?.token) {
      const userPayload: AdminUser = response.data.user || {
        id: email,
        fullName: email.split("@")[0],
        email: email,
        phone: "",
        role: "admin",
        status: "active",
        verified: true,
        avatar: `https://ui-avatars.com/api/?name=${email}&background=10b981&color=fff`,
        createdAt: new Date().toISOString(),
      };

      if (typeof window !== "undefined") {
        localStorage.setItem("payent:admin:token", response.data.token);
        localStorage.setItem(
          "payent:admin:current_user",
          JSON.stringify(userPayload),
        );
        localStorage.setItem("payent:token", response.data.token);
        localStorage.setItem("payent:currentUser", JSON.stringify(userPayload));
        window.dispatchEvent(new Event("payent:admin:profile-updated"));
        window.dispatchEvent(new CustomEvent("payent:storage_change"));
      }
      return { success: true, token: response.data.token, user: userPayload };
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
      window.dispatchEvent(new Event("payent:admin:profile-updated"));
      window.dispatchEvent(new CustomEvent("payent:storage_change"));
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

  getCurrentUser(): AdminUser {
    if (typeof window === "undefined") {
      return {
        id: "admin@payent.com",
        fullName: "Administrator",
        email: "admin@payent.com",
        role: "admin",
        status: "active",
        verified: true,
        avatar: "https://ui-avatars.com/api/?name=Admin&background=10b981&color=fff",
        createdAt: new Date().toISOString(),
      };
    }

    const adminUser = localStorage.getItem("payent:admin:current_user");
    if (adminUser) {
      try {
        const u = JSON.parse(adminUser);
        if (u && (u.email || u.fullName)) {
          return {
            id: u.email || u.id || "admin@payent.com",
            fullName: u.fullName || u.email?.split("@")[0] || "Administrator",
            email: u.email || "admin@payent.com",
            phone: u.phone || "",
            role: "admin",
            status: "active",
            verified: true,
            avatar:
              u.avatar ||
              `https://ui-avatars.com/api/?name=${u.fullName || u.email || "Admin"}&background=10b981&color=fff`,
            createdAt: u.createdAt || new Date().toISOString(),
          };
        }
      } catch {
        // fallback
      }
    }

    const currentUserRaw = localStorage.getItem("payent:currentUser");
    if (currentUserRaw) {
      try {
        const u = JSON.parse(currentUserRaw);
        if (u) {
          return {
            id: u.email || u.id || "admin@payent.com",
            fullName: u.fullName || u.email?.split("@")[0] || "Administrator",
            email: u.email || "admin@payent.com",
            phone: u.phone || "",
            role: u.role || "admin",
            status: "active",
            verified: true,
            avatar:
              u.avatar ||
              `https://ui-avatars.com/api/?name=${u.fullName || u.email || "Admin"}&background=10b981&color=fff`,
            createdAt: u.createdAt || new Date().toISOString(),
          };
        }
      } catch {
        // fallback
      }
    }

    return {
      id: "admin@payent.com",
      fullName: "Administrator",
      email: "admin@payent.com",
      phone: "+91 8810519885",
      role: "admin",
      status: "active",
      verified: true,
      avatar: "https://ui-avatars.com/api/?name=Admin&background=10b981&color=fff",
      createdAt: new Date().toISOString(),
    };
  },
};
