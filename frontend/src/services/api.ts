import axios from "axios";

const getApiBase = () => {
  if (typeof window !== "undefined") {
    const win = window as unknown as { PAYENT_API_URL?: string };
    if (win.PAYENT_API_URL) return win.PAYENT_API_URL;
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const isLocal = host === "localhost" || host === "127.0.0.1";
    if (isLocal) return "http://127.0.0.1:8001";
    if (host.endsWith(".vercel.app")) {
      return "";
    }
    return window.location.origin;
  }
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return "";
};
const API_BASE = getApiBase();

export const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("payent:token");
    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }
    const user = window.localStorage.getItem("payent:currentUser");
    if (user) {
      try {
        const parsed = JSON.parse(user);
        if (parsed?.id) config.headers.set("X-User-Id", parsed.id);
      } catch {
        /* ignore */
      }
    }
  }
  return config;
});

export interface ReviewItem {
  id: string;
  productId?: string;
  productTitle?: string;
  productImage?: string;
  bookingId?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userLocation?: string;
  userRole?: string;
  rating: number;
  comment: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    "5": number;
    "4": number;
    "3": number;
    "2": number;
    "1": number;
  };
}

export interface ReviewsResponse {
  reviews: ReviewItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface EligibleBooking {
  bookingId: string;
  productId: string;
  productTitle: string;
  productImage?: string;
  startDate?: string;
  endDate?: string;
  status: string;
}

export const reviewsApi = {
  getReviews: async (params?: {
    page?: number;
    limit?: number;
    sort?: string;
    rating?: number;
    product_id?: string;
    verified_only?: boolean;
  }): Promise<ReviewsResponse> => {
    const res = await api.get<ReviewsResponse>("/reviews", { params });
    return res.data;
  },

  getStats: async (productId?: string): Promise<ReviewStats> => {
    const res = await api.get<ReviewStats>("/reviews/stats", {
      params: productId ? { product_id: productId } : undefined,
    });
    return res.data;
  },

  getEligibleBookings: async (): Promise<EligibleBooking[]> => {
    const res = await api.get<EligibleBooking[]>("/reviews/eligible-bookings");
    return res.data;
  },

  createReview: async (data: {
    productId?: string;
    bookingId?: string;
    rating: number;
    comment: string;
  }): Promise<ReviewItem> => {
    const res = await api.post<ReviewItem>("/reviews", data);
    return res.data;
  },

  updateReview: async (
    id: string,
    data: { rating?: number; comment?: string }
  ): Promise<ReviewItem> => {
    const res = await api.put<ReviewItem>(`/reviews/${id}`, data);
    return res.data;
  },

  deleteReview: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete<{ success: boolean; message: string }>(`/reviews/${id}`);
    return res.data;
  },
};

