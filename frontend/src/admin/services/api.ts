import axios from "axios";

// ----------------------------------------------------------------------
// 1. Interfaces & Types
// ----------------------------------------------------------------------

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: "admin" | "agent" | "user";
  status: "active" | "suspended" | "pending" | "rejected" | "approved";
  verified: boolean;
  avatar: string;
  profilePhotoUrl?: string;
  address?: string;
  city?: string;
  pincode?: string;
  createdAt: string;
}

export interface AdminAgent {
  id: string;
  fullName: string;
  email: string;
  avatar: string;
  productsCount: number;
  bookingsCount: number;
  revenue: number;
  rating: number;
  status: "active" | "suspended";
  createdAt: string;
}

export interface AdminProduct {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  rating: number;
  reviewsCount: number;
  available: boolean;
  status: "pending" | "approved" | "rejected";
  featured: boolean;
  hidden: boolean;
  image: string;
  images: string[];
  documents: string[];
  createdAt: string;
  owner: {
    id: string;
    name: string;
    avatar: string;
    rating: number;
    email: string;
  };
}

export interface AdminCategory {
  id: string;
  name: string;
  icon: string; // Lucide icon name
  count: number;
  color: string; // Tailwind class color or hex
  enabled: boolean;
}

export interface AdminBooking {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string;
  customerId: string;
  customerName: string;
  ownerId: string;
  ownerName: string;
  startDate: string;
  endDate: string;
  amount: number;
  status: "pending" | "active" | "completed" | "cancelled";
  createdAt: string;
}

export interface AdminPayment {
  id: string;
  bookingId: string;
  customerId: string;
  customerName: string;
  amount: number;
  status: "successful" | "refunded" | "failed";
  method: "Credit Card" | "PayPal" | "Apple Pay" | "Bank Transfer";
  invoiceUrl: string;
  createdAt: string;
}

export interface AdminReview {
  id: string;
  productId: string;
  productTitle: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  hidden: boolean;
  createdAt: string;
}

export interface AdminReport {
  id: string;
  reason: string;
  evidence: string;
  productId: string;
  productTitle: string;
  reporterName: string;
  ownerName: string;
  ownerId: string;
  status: "open" | "resolved" | "dismissed";
  createdAt: string;
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
}

export interface AdminSupportTicket {
  id: string;
  subject: string;
  category: string;
  status: "open" | "pending" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  userName: string;
  userEmail: string;
  messages: {
    id: string;
    sender: "user" | "admin";
    message: string;
    createdAt: string;
  }[];
  createdAt: string;
}

export interface AdminSettings {
  websiteName: string;
  logoUrl: string;
  theme: "light" | "dark" | "system";
  contactEmail: string;
  contactPhone: string;
  socialFacebook: string;
  socialTwitter: string;
  socialInstagram: string;
  seoTitle: string;
  seoDescription: string;
  homepageBannerText: string;
  footerText: string;
}

export interface AdminActivityLog {
  id: string;
  timestamp: string;
  userName: string;
  action: string;
  module: string;
  ipAddress: string;
}

// ----------------------------------------------------------------------
// 2. Axios Client & Interceptors (Zero Fake Data / Zero Offline Bypass)
// ----------------------------------------------------------------------

const getAdminApiBase = () => {
  if (typeof window !== "undefined") {
    const win = window as unknown as { PAYENT_API_URL?: string };
    if (win.PAYENT_API_URL) return win.PAYENT_API_URL;
  }
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== "undefined") {
    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    if (isLocal) return "http://127.0.0.1:8001";
    return window.location.origin;
  }
  return "";
};
const API_BASE = getAdminApiBase();

export const adminApi = axios.create({
  baseURL: `${API_BASE}/api/admin`,
  timeout: 30000,
});

adminApi.interceptors.request.use((config) => {
  let token =
    localStorage.getItem("payent:admin:token") ||
    localStorage.getItem("payent:token");
  if (token) {
    token = token.trim();
    if (token.startsWith('"') && token.endsWith('"')) {
      token = token.slice(1, -1).trim();
    }
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const isOfflineMode = () => false;

adminApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    if (status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("payent:admin:token");
      localStorage.removeItem("payent:admin:current_user");
      localStorage.removeItem("payent:token");
      localStorage.removeItem("payent:currentUser");

      if (window.location.pathname !== "/admin/login") {
        window.location.href = "/admin/login";
      }
    }
    return Promise.reject(error);
  }
);
