import { adminApi, AdminUser, AdminAgent } from "./api";

export const usersService = {
  async getUsers(): Promise<AdminUser[]> {
    const response = await adminApi.get("/users");
    return response.data;
  },

  async updateUser(id: string, data: Partial<AdminUser>): Promise<AdminUser> {
    const response = await adminApi.put(`/users/${id}`, data);
    return response.data;
  },

  async deleteUser(id: string): Promise<void> {
    await adminApi.delete(`/users/${id}`);
  },

  async suspendUser(id: string): Promise<AdminUser> {
    const response = await adminApi.post(`/users/${id}/suspend`);
    return response.data;
  },

  async activateUser(id: string): Promise<AdminUser> {
    const response = await adminApi.post(`/users/${id}/activate`);
    return response.data;
  },

  async getAgents(): Promise<AdminAgent[]> {
    const response = await adminApi.get("/agents");
    return response.data;
  },

  async suspendAgent(id: string): Promise<AdminAgent> {
    const response = await adminApi.post(`/agents/${id}/suspend`);
    return response.data;
  },

  async deleteAgent(id: string): Promise<void> {
    await adminApi.delete(`/agents/${id}`);
  },
};
