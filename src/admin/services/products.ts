import { adminApi, AdminProduct, AdminCategory } from "./api";

export const productsService = {
  async getProducts(): Promise<AdminProduct[]> {
    const response = await adminApi.get("/products");
    return response.data;
  },

  async getProductById(id: string): Promise<AdminProduct> {
    const response = await adminApi.get(`/products/${id}`);
    return response.data;
  },

  async updateProduct(id: string, data: Partial<AdminProduct>): Promise<AdminProduct> {
    const response = await adminApi.put(`/products/${id}`, data);
    return response.data;
  },

  async deleteProduct(id: string): Promise<void> {
    await adminApi.delete(`/products/${id}`);
  },

  async approveProduct(id: string): Promise<AdminProduct> {
    const response = await adminApi.post(`/products/${id}/approve`);
    return response.data;
  },

  async rejectProduct(id: string): Promise<AdminProduct> {
    const response = await adminApi.post(`/products/${id}/reject`);
    return response.data;
  },

  async toggleFeatureProduct(id: string): Promise<AdminProduct> {
    const response = await adminApi.post(`/products/${id}/toggle-feature`);
    return response.data;
  },

  async toggleHideProduct(id: string): Promise<AdminProduct> {
    const response = await adminApi.post(`/products/${id}/toggle-hide`);
    return response.data;
  },

  // Categories
  async getCategories(): Promise<AdminCategory[]> {
    const response = await adminApi.get("/categories");
    return response.data;
  },

  async createCategory(data: {
    name: string;
    icon?: string;
    color?: string;
  }): Promise<AdminCategory> {
    const response = await adminApi.post("/categories", data);
    return response.data;
  },

  async updateCategory(id: string, data: Partial<AdminCategory>): Promise<AdminCategory> {
    const response = await adminApi.put(`/categories/${id}`, data);
    return response.data;
  },

  async deleteCategory(id: string): Promise<void> {
    await adminApi.delete(`/categories/${id}`);
  },
};
