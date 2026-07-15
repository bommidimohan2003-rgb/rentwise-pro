import { storage, STORAGE_KEYS } from "./storage";

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
};
