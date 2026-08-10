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
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    createdAt: "2026-01-10T09:30:00Z",
  },
  {
    id: "usr-2",
    fullName: "Marcus Vance",
    email: "marcus.vance@techgear.io",
    phone: "+91 98765 43210",
    role: "user",
    status: "active",
    verified: true,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    createdAt: "2026-02-15T14:20:00Z",
  },
  {
    id: "usr-3",
    fullName: "Elena Rostova",
    email: "elena.rostova@drones.com",
    phone: "+91 98123 45678",
    role: "user",
    status: "active",
    verified: true,
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150",
    createdAt: "2026-03-01T11:45:00Z",
  },
  {
    id: "usr-4",
    fullName: "Devon Carter",
    email: "devon.carter@creatives.co",
    phone: "+91 97654 32109",
    role: "user",
    status: "active",
    verified: true,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    createdAt: "2026-03-20T16:10:00Z",
  },
  {
    id: "usr-5",
    fullName: "Priya Sharma",
    email: "priya.sharma@studios.in",
    phone: "+91 99887 76655",
    role: "user",
    status: "active",
    verified: true,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    createdAt: "2026-04-05T08:15:00Z",
  },
];

const FALLBACK_AGENTS: AdminAgent[] = [
  {
    id: "agt-1",
    fullName: "Gear Hub India (Bengaluru)",
    email: "bengaluru@payent.com",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150",
    productsCount: 24,
    bookingsCount: 142,
    revenue: 340000,
    rating: 4.9,
    status: "active",
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "agt-2",
    fullName: "Cine Rental Express (Mumbai)",
    email: "mumbai@payent.com",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150",
    productsCount: 18,
    bookingsCount: 98,
    revenue: 280000,
    rating: 5.0,
    status: "active",
    createdAt: "2026-01-15T00:00:00Z",
  },
  {
    id: "agt-3",
    fullName: "Pro Drone Hub (Delhi NCR)",
    email: "delhi@payent.com",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
    productsCount: 12,
    bookingsCount: 64,
    revenue: 195000,
    rating: 4.8,
    status: "active",
    createdAt: "2026-02-01T00:00:00Z",
  },
];

export const usersService = {
  async getUsers(): Promise<AdminUser[]> {
    try {
      const response = await adminApi.get("/users");
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
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
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
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
      const agent = FALLBACK_AGENTS.find((a) => a.id === id) || FALLBACK_AGENTS[0];
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
