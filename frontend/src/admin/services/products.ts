import { adminApi, AdminProduct, AdminCategory } from "./api";

export const productsService = {
  async getProducts(status?: string): Promise<AdminProduct[]> {
    const url = status
      ? `/products?status=${encodeURIComponent(status)}`
      : "/products";
    const response = await adminApi.get(url);
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  },

  async getProductById(id: string): Promise<AdminProduct> {
    const response = await adminApi.get(`/products/${encodeURIComponent(id)}`);
    return response.data;
  },

  async updateProduct(
    id: string,
    data: Partial<AdminProduct>,
  ): Promise<AdminProduct> {
    const response = await adminApi.put(`/products/${encodeURIComponent(id)}`, data);
    return response.data;
  },

  async deleteProduct(id: string): Promise<void> {
    await adminApi.delete(`/products/${encodeURIComponent(id)}`);
  },

  async approveProduct(id: string): Promise<AdminProduct> {
    const response = await adminApi.post(`/products/${encodeURIComponent(id)}/approve`);
    window.dispatchEvent(new CustomEvent("payent_products_updated"));
    return response.data;
  },

  async rejectProduct(id: string): Promise<AdminProduct> {
    const response = await adminApi.post(`/products/${encodeURIComponent(id)}/reject`);
    window.dispatchEvent(new CustomEvent("payent_products_updated"));
    return response.data;
  },

  async toggleFeatureProduct(id: string): Promise<AdminProduct> {
    const response = await adminApi.post(`/products/${encodeURIComponent(id)}/toggle-feature`);
    return response.data;
  },

  async toggleHideProduct(id: string): Promise<AdminProduct> {
    const response = await adminApi.post(`/products/${encodeURIComponent(id)}/toggle-hide`);
    return response.data;
  },

  // Categories
  async getCategories(): Promise<AdminCategory[]> {
    const response = await adminApi.get("/categories");
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  },

  async createCategory(data: {
    name: string;
    icon?: string;
    color?: string;
  }): Promise<AdminCategory> {
    const response = await adminApi.post("/categories", data);
    return response.data;
  },

  async updateCategory(
    id: string,
    data: Partial<AdminCategory>,
  ): Promise<AdminCategory> {
    const response = await adminApi.put(`/categories/${encodeURIComponent(id)}`, data);
    return response.data;
  },

  async deleteCategory(id: string): Promise<void> {
    await adminApi.delete(`/categories/${encodeURIComponent(id)}`);
  },
};
