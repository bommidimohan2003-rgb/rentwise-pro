import { adminApi, AdminUser, AdminAgent } from "./api";

const FALLBACK_USERS: AdminUser[] = [
  {
    id: "usr-1",
    fullName: "Bommidi Mohan",
    email: "bommidimohan304@gmail.com",
    phone: "+91 8810519885",
    role: "admin",
    status: "active",
    verified: true,
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    createdAt: "2026-01-10T09:30:00Z",
  },
];

const FALLBACK_AGENTS: AdminAgent[] = [];

export const usersService = {
  async getUsers(): Promise<AdminUser[]> {
    try {
      const response = await adminApi.get("/users");
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }
    } catch (err) {
      console.warn("[usersService] getUsers fallback:", err);
    }
    return FALLBACK_USERS;
  },

  async updateUser(id: string, data: Partial<AdminUser>): Promise<AdminUser> {
    try {
      const response = await adminApi.put(`/users/${id}`, data);
      return response.data;
    } catch (err) {
      console.warn("[usersService] updateUser fallback:", err);
      const user = FALLBACK_USERS.find((u) => u.id === id) || FALLBACK_USERS[0];
      return { ...user, ...data };
    }
  },

  async deleteUser(id: string): Promise<void> {
    try {
      await adminApi.delete(`/users/${id}`);
    } catch (err) {
      console.warn("[usersService] deleteUser fallback:", err);
    }
  },

  async suspendUser(id: string): Promise<AdminUser> {
    try {
      const response = await adminApi.post(`/users/${id}/suspend`);
      return response.data;
    } catch (err) {
      console.warn("[usersService] suspendUser fallback:", err);
      const user = FALLBACK_USERS.find((u) => u.id === id) || FALLBACK_USERS[0];
      return { ...user, status: "suspended" };
    }
  },

  async activateUser(id: string): Promise<AdminUser> {
    try {
      const response = await adminApi.post(`/users/${id}/activate`);
      return response.data;
    } catch (err) {
      console.warn("[usersService] activateUser fallback:", err);
      const user = FALLBACK_USERS.find((u) => u.id === id) || FALLBACK_USERS[0];
      return { ...user, status: "active" };
    }
  },

  async getAgents(): Promise<AdminAgent[]> {
    try {
      const response = await adminApi.get("/agents");
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }
    } catch (err) {
      console.warn("[usersService] getAgents fallback:", err);
    }
    return FALLBACK_AGENTS;
  },

  async suspendAgent(id: string): Promise<AdminAgent> {
    try {
      const response = await adminApi.post(`/agents/${id}/suspend`);
      return response.data;
    } catch (err) {
      console.warn("[usersService] suspendAgent fallback:", err);
      const agent =
        FALLBACK_AGENTS.find((a) => a.id === id) || FALLBACK_AGENTS[0];
      return { ...agent, status: "suspended" };
    }
  },

  async deleteAgent(id: string): Promise<void> {
    try {
      await adminApi.delete(`/agents/${id}`);
    } catch (err) {
      console.warn("[usersService] deleteAgent fallback:", err);
    }
  },
};
