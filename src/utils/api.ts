import { storage, STORAGE_KEYS } from "./storage";
import type { Order, Product } from "@/types";

const isLocal =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");
const API_BASE =
  import.meta.env.VITE_API_URL !== undefined
    ? import.meta.env.VITE_API_URL
    : isLocal
      ? "http://127.0.0.1:8000"
      : "";

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
    adminCode?: string,
    address?: string,
    city?: string,
    pincode?: string,
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
        admin_code: adminCode || null,
        address: address || null,
        city: city || null,
        pincode: pincode || null,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || "Failed to verify registration.");
    }
    return await res.json();
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
    return await res.json();
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
    // Return cached user profile if using Firebase / Social Auth token
    if (token.startsWith("google-firebase-jwt-") || token.startsWith("firebase-")) {
      const cached = storage.get<{ email: string; fullName: string; role?: "user" | "admin" } | null>(
        STORAGE_KEYS.currentUser,
        null
      );
      if (cached) {
        return {
          email: cached.email,
          fullName: cached.fullName,
          role: cached.role || "user",
        };
      }
    }

    const res = await fetch(`${API_BASE}/api/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      if (res.status === 401 && typeof window !== "undefined") {
        const cached = storage.get(STORAGE_KEYS.currentUser, null);
        if (!cached) {
          window.dispatchEvent(
            new CustomEvent("payent-session-expired", {
              detail: { loginPath: "/login" },
            })
          );
        }
      }
      const data = await res.json().catch(() => ({}));
      const err = new Error(data.detail || "Failed to fetch user profile.") as Error & { status?: number };
      err.status = res.status;
      throw err;
    }
    return await res.json();
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

  async getLenderOrders(token: string) {
    const res = await fetch(`${API_BASE}/api/lender/orders`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("Failed to fetch lender orders");
    return res.json();
  },

  async deleteCustomProduct(token: string, productId: string) {
    const res = await fetch(`${API_BASE}/api/products/custom/${productId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("Failed to delete custom product");
    return res.json();
  },

  async toggleCustomProductAvailability(token: string, productId: string) {
    const res = await fetch(
      `${API_BASE}/api/products/custom/${productId}/toggle-availability`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    if (!res.ok)
      throw new Error("Failed to toggle custom product availability");
    return res.json();
  },

  async updateCustomProduct(
    token: string,
    productId: string,
    patchData: Partial<Product>,
  ) {
    const res = await fetch(`${API_BASE}/api/products/custom/${productId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(patchData),
    });
    if (!res.ok) throw new Error("Failed to update custom product");
    return res.json();
  },

  async createRazorpayOrder(
    token: string,
    productId: string,
    startDate: string,
    endDate: string,
    couponCode?: string,
  ) {
    const res = await fetch(`${API_BASE}/api/payments/create-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        product_id: productId,
        start_date: startDate,
        end_date: endDate,
        coupon_code: couponCode || null,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || "Failed to create Razorpay order.");
    }
    return res.json();
  },

  async verifyRazorpayPayment(
    token: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
  ) {
    const res = await fetch(`${API_BASE}/api/payments/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || "Razorpay signature verification failed.");
    }
    return res.json();
  },

  async processRefund(
    token: string,
    orderId: string,
    amount?: number,
    reason?: string,
  ) {
    const res = await fetch(`${API_BASE}/api/payments/refund`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        order_id: orderId,
        amount: amount || null,
        reason: reason || null,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || "Failed to process refund.");
    }
    return res.json();
  },

  // Recommendation Engine API Methods
  async getSimilarRecommendations(productId: string): Promise<Product[]> {
    try {
      const res = await fetch(
        `${API_BASE}/api/recommendations/similar/${encodeURIComponent(productId)}`,
      );
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  async getTrendingRecommendations(): Promise<Product[]> {
    try {
      const res = await fetch(`${API_BASE}/api/recommendations/trending`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  async getFrequentlyTogetherRecommendations(
    productId: string,
  ): Promise<Product[]> {
    try {
      const res = await fetch(
        `${API_BASE}/api/recommendations/frequently-together/${encodeURIComponent(productId)}`,
      );
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  async getPersonalizedRecommendations(userEmail?: string, sessionId?: string) {
    try {
      const params = new URLSearchParams();
      if (userEmail) params.append("user_email", userEmail);
      if (sessionId) params.append("session_id", sessionId);

      const url = `${API_BASE}/api/recommendations/personalized${params.toString() ? "?" + params.toString() : ""}`;
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async getMLStatus() {
    try {
      const res = await fetch(`${API_BASE}/api/recommendations/ml-status`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async searchML(
    query: string,
    category?: string,
    userEmail?: string,
    sessionId?: string,
    limit: number = 20,
  ) {
    try {
      const res = await fetch(`${API_BASE}/api/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: (query || "").trim(),
          category: category === "all" ? undefined : category,
          user_email: userEmail,
          session_id: sessionId,
          limit,
        }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async getSearchStats() {
    try {
      const res = await fetch(`${API_BASE}/api/search/stats`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },
};
