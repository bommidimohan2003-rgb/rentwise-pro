import { adminApi } from "./api";

export interface AdminAPIKey {
  id: string;
  name: string;
  key_prefix: string;
  user_email: string;
  scopes: string;
  rate_limit: number;
  is_active: boolean;
  expires_at: string | null;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface APIKeyCreateResult {
  success: boolean;
  apiKey: AdminAPIKey;
  secretKey: string;
  message: string;
}

export const apiKeysService = {
  async getApiKeys(page: number = 1, limit: number = 25, search?: string) {
    try {
      const query = new URLSearchParams();
      query.set("page", String(page));
      query.set("limit", String(limit));
      if (search) query.set("q", search);

      const res = await adminApi.get<{
        items: AdminAPIKey[];
        total: number;
        page: number;
        limit: number;
      }>(`/api/admin/api-keys?${query.toString()}`);
      return res;
    } catch {
      return {
        items: [],
        total: 0,
        page: 1,
        limit: 25,
      };
    }
  },

  async createApiKey(data: {
    name: string;
    scopes?: string[];
    rate_limit?: number;
    expires_at?: string;
  }): Promise<APIKeyCreateResult> {
    const res = await adminApi.post<APIKeyCreateResult>(
      "/api/admin/api-keys",
      data,
    );
    return res;
  },

  async updateApiKey(
    id: string,
    data: {
      name?: string;
      scopes?: string[];
      rate_limit?: number;
      is_active?: boolean;
      expires_at?: string;
    },
  ) {
    const res = await adminApi.put<{ success: boolean; apiKey: AdminAPIKey }>(
      `/api/admin/api-keys/${id}`,
      data,
    );
    return res;
  },

  async deleteApiKey(id: string) {
    const res = await adminApi.delete<{ success: boolean; message: string }>(
      `/api/admin/api-keys/${id}`,
    );
    return res;
  },
};
