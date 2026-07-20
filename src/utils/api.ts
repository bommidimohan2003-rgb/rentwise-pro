import { storage, STORAGE_KEYS } from "./storage";
import type { Order, Product } from "@/types";
import { ADMIN_SETUP_CODE } from "./adminSetup";

const isLocal = typeof window !== "undefined" && (
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
);
const API_BASE = import.meta.env.VITE_API_URL || (isLocal ? "http://localhost:8000" : "https://rentwise-backend.onrender.com");

export const api = {
  async registerRequest(email: string, phone: string) {
    try {
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
    } catch (err) {
      console.warn("Register request failed, falling back to mock registration:", err);
      // Generate a mock OTP and save it in local storage
      const mockOtp = "123456";
      storage.set(STORAGE_KEYS.otp, mockOtp);
      return { success: true, otp: mockOtp, message: "Mock OTP generated (demo mode)" };
    }
  },

  async registerVerify(
    email: string,
    phone: string,
    otp: string,
    password: string,
    fullName?: string,
    adminCode?: string,
  ) {
    try {
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
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to verify registration.");
      }
      return await res.json();
    } catch (err) {
      console.warn("Register verify failed, falling back to mock verify:", err);
      
      let role = "user";
      if (adminCode) {
        if (adminCode === ADMIN_SETUP_CODE) {
          role = "admin";
        } else {
          throw new Error("Invalid admin setup code.");
        }
      }

      const savedOtp = storage.get<string | null>(STORAGE_KEYS.otp, null);
      if (otp !== savedOtp && otp !== "123456") {
        throw new Error("Invalid verification code.");
      }
      
      // Store user in local list so they can log in
      const users = storage.get<any[]>(STORAGE_KEYS.users, []);
      const existingUserIdx = users.findIndex((u) => u.email === email);
      const newUser = {
        email,
        phone,
        password,
        fullName: fullName || email.split("@")[0],
        role,
      };
      if (existingUserIdx !== -1) {
        users[existingUserIdx] = newUser;
      } else {
        users.push(newUser);
      }
      storage.set(STORAGE_KEYS.users, users);

      return { success: true, message: "Mock verification successful (demo mode)" };
    }
  },

  async login(email: string, password: string) {
    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Invalid email or password.");
      }
      return await res.json(); // returns { success, token, role, message }
    } catch (err) {
      console.warn("Login API failed, falling back to mock login:", err);
      
      // 1. Check registered mock users
      const users = storage.get<any[]>(STORAGE_KEYS.users, []);
      const user = users.find((u) => u.email === email && u.password === password);
      if (user) {
        return {
          success: true,
          token: "mock-user-token-" + email,
          role: user.role || "user",
          message: "Mock login successful",
        };
      }
      
      // 2. Fallback to standard platform mock accounts (password optional or name + '123' / anything)
      const mockStandardUsers = [
        { email: "alex@example.com", fullName: "Alex Mercer", role: "agent" },
        { email: "emily@example.com", fullName: "Emily Davis", role: "agent" },
        { email: "michael@example.com", fullName: "Michael Chang", role: "user" },
        { email: "jessica@example.com", fullName: "Jessica Ross", role: "user" },
      ];
      const standardUser = mockStandardUsers.find((u) => u.email === email);
      if (standardUser) {
        return {
          success: true,
          token: "mock-user-token-" + email,
          role: standardUser.role,
          message: "Mock login successful",
        };
      }

      throw new Error("Invalid email or password.");
    }
  },

  async forgotPasswordRequest(email: string) {
    try {
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
    } catch (err) {
      console.warn("Forgot password request failed, falling back to mock:", err);
      const mockOtp = "654321";
      storage.set(STORAGE_KEYS.otp, mockOtp);
      return { success: true, otp: mockOtp, message: "Mock reset code generated (demo mode)" };
    }
  },

  async forgotPasswordReset(email: string, otp: string, new_password: string) {
    try {
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
    } catch (err) {
      console.warn("Forgot password reset failed, falling back to mock:", err);
      const savedOtp = storage.get<string | null>(STORAGE_KEYS.otp, null);
      if (otp !== savedOtp && otp !== "654321") {
        throw new Error("Invalid verification code.");
      }

      // Update the user's password in mock database
      const users = storage.get<any[]>(STORAGE_KEYS.users, []);
      const idx = users.findIndex((u) => u.email === email);
      if (idx !== -1) {
        users[idx].password = new_password;
        storage.set(STORAGE_KEYS.users, users);
      }
      return { success: true, message: "Mock password reset successful" };
    }
  },

  async getMe(token: string) {
    try {
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
      return await res.json(); // returns { email, role, fullName }
    } catch (err) {
      console.warn("getMe API failed, falling back to mock:", err);
      if (token.startsWith("mock-user-token-")) {
        const email = token.replace("mock-user-token-", "");
        
        // Find user in registered list
        const users = storage.get<any[]>(STORAGE_KEYS.users, []);
        const user = users.find((u) => u.email === email);
        if (user) {
          return {
            email: user.email,
            role: user.role || "user",
            fullName: user.fullName,
          };
        }
        
        // Find user in standard mock users
        const mockStandardUsers = [
          { email: "alex@example.com", fullName: "Alex Mercer", role: "agent" },
          { email: "emily@example.com", fullName: "Emily Davis", role: "agent" },
          { email: "michael@example.com", fullName: "Michael Chang", role: "user" },
          { email: "jessica@example.com", fullName: "Jessica Ross", role: "user" },
        ];
        const standardUser = mockStandardUsers.find((u) => u.email === email);
        if (standardUser) {
          return {
            email: standardUser.email,
            role: standardUser.role,
            fullName: standardUser.fullName,
          };
        }
      }
      throw new Error("Unauthorized");
    }
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
    const res = await fetch(`${API_BASE}/api/products/custom/${productId}/toggle-availability`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("Failed to toggle custom product availability");
    return res.json();
  },
};
