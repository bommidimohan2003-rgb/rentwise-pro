import { storage, STORAGE_KEYS } from "./storage";
import type { Order, Product } from "@/types";

const API_BASE = "http://localhost:8000";

export const api = {
  async registerRequest(email: string, phone: string) {
    const res = await fetch(`${API_BASE}/api/register/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, phone }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || "Failed to request registration code.");
    }
    const data = await res.json();
    if (data && data.otp) {
      storage.set(STORAGE_KEYS.otp, data.otp);
    } else {
      storage.remove(STORAGE_KEYS.otp);
    }
    return data;
  },

  async registerVerify(
    email: string,
    phone: string,
    otp: string,
    password: string,
    fullName?: string,
  ) {
    const res = await fetch(`${API_BASE}/api/register/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        phone,
        otp,
        password,
        full_name: fullName || null,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || "Failed to verify registration.");
    }
    return res.json();
  },

  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || "Invalid email or password.");
    }
    return res.json(); // returns { success, token, role, message }
  },

  async forgotPasswordRequest(email: string) {
    const res = await fetch(`${API_BASE}/api/forgot-password/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || "Failed to request password reset.");
    }
    const data = await res.json();
    if (data && data.otp) {
      storage.set(STORAGE_KEYS.otp, data.otp);
    } else {
      storage.remove(STORAGE_KEYS.otp);
    }
    return data;
  },

  async forgotPasswordReset(email: string, otp: string, new_password: string) {
    const res = await fetch(`${API_BASE}/api/forgot-password/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp, new_password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || "Failed to reset password.");
    }
    return res.json();
  },

  async getMe(token: string) {
    const res = await fetch(`${API_BASE}/api/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || "Failed to fetch user profile.");
    }
    return res.json(); // returns { email, role, fullName }
  },

  async getWishlist(token: string) {
    const res = await fetch(`${API_BASE}/api/wishlist`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("Failed to fetch wishlist");
    return res.json() as Promise<string[]>;
  },

  async toggleWishlist(token: string, productId: string) {
    const res = await fetch(`${API_BASE}/api/wishlist/toggle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ product_id: productId }),
    });
    if (!res.ok) throw new Error("Failed to toggle wishlist item");
    return res.json();
  },

  async getOrders(token: string) {
    const res = await fetch(`${API_BASE}/api/orders`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("Failed to fetch orders");
    return res.json();
  },

  async createOrder(token: string, orderData: Order) {
    const res = await fetch(`${API_BASE}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(orderData),
    });
    if (!res.ok) throw new Error("Failed to create order");
    return res.json();
  },

  async cancelOrder(token: string, orderId: string) {
    const res = await fetch(`${API_BASE}/api/orders/${orderId}/cancel`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("Failed to cancel order");
    return res.json();
  },

  async getCustomProducts(token: string) {
    const res = await fetch(`${API_BASE}/api/products/custom`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("Failed to fetch custom products");
    return res.json();
  },

  async getPublicCustomProducts() {
    const res = await fetch(`${API_BASE}/api/products/custom/public`, {
      method: "GET",
    });
    if (!res.ok) throw new Error("Failed to fetch public custom products");
    return res.json();
  },

  async createCustomProduct(token: string, productData: Product) {
    const res = await fetch(`${API_BASE}/api/products/custom`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(productData),
    });
    if (!res.ok) throw new Error("Failed to create custom product");
    return res.json();
  },

  async getNotifications(token: string) {
    const res = await fetch(`${API_BASE}/api/notifications`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("Failed to fetch notifications");
    return res.json();
  },

  async markNotificationsRead(token: string) {
    const res = await fetch(`${API_BASE}/api/notifications/read`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("Failed to mark notifications as read");
    return res.json();
  },
};
