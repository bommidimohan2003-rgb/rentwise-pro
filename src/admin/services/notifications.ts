import {
  adminApi,
  AdminNotification,
  AdminSupportTicket,
  AdminReport,
  AdminReview,
  AdminSettings,
  AdminActivityLog,
} from "./api";

export interface DashboardStats {
  totalUsers: number;
  totalAgents: number;
  totalProducts: number;
  pendingProducts: number;
  approvedProducts: number;
  rejectedProducts: number;
  totalCategories: number;
  bookingsToday: number;
  monthlyBookings: number;
  revenueToday: number;
  monthlyRevenue: number;
  pendingReports: number;
  unreadNotifications: number;
  websiteVisitors: number;
}

export interface DashboardCharts {
  revenueChart: { name: string; revenue: number }[];
  bookingChart: { name: string; bookings: number }[];
  userGrowth: { name: string; users: number }[];
  productGrowth: { name: string; products: number }[];
  categoryDistribution: { name: string; value: number }[];
  topProducts: { name: string; rentals: number; revenue: number }[];
}

export interface DashboardActivity {
  id: string;
  type: string;
  title: string;
  detail: string;
  time: string;
  icon: string;
}

export const notificationsService = {
  // Notifications
  async getNotifications(): Promise<AdminNotification[]> {
    try {
      const response = await adminApi.get("/notifications");
      if (response.data) return response.data;
    } catch (err) {
      console.warn("Notifications fallback:", err);
    }
    return [
      {
        id: "NT-1",
        title: "New Product Listing Pending Approval",
        message:
          "Devon Carter listed 'Aputure LS 600d Pro Daylight LED' for ₹2,900/day.",
        type: "warning",
        read: false,
        createdAt: "2026-08-10T12:00:00Z",
      },
      {
        id: "NT-2",
        title: "Razorpay Payout Completed",
        message:
          "Payout of ₹12,600 to Elena Rostova was processed successfully.",
        type: "success",
        read: false,
        createdAt: "2026-08-09T16:30:00Z",
      },
    ];
  },

  async markAllRead(): Promise<void> {
    try {
      await adminApi.post("/notifications/mark-read");
    } catch {
      // offline silent
    }
  },

  async deleteNotification(id: string): Promise<void> {
    try {
      await adminApi.delete(`/notifications/${id}`);
    } catch {
      // offline silent
    }
  },

  // Support Tickets
  async getSupportTickets(): Promise<AdminSupportTicket[]> {
    try {
      const response = await adminApi.get("/support");
      if (response.data) return response.data;
    } catch (err) {
      console.warn("Support tickets fallback:", err);
    }
    return [];
  },

  async replyToTicket(
    id: string,
    message: string,
  ): Promise<AdminSupportTicket> {
    const response = await adminApi.post(`/support/${id}/reply`, { message });
    return response.data;
  },

  async updateTicketStatus(
    id: string,
    status: AdminSupportTicket["status"],
  ): Promise<AdminSupportTicket> {
    const response = await adminApi.post(`/support/${id}/status`, { status });
    return response.data;
  },

  // Reports
  async getReports(): Promise<AdminReport[]> {
    try {
      const response = await adminApi.get("/reports");
      if (response.data) return response.data;
    } catch (err) {
      console.warn("Reports fallback:", err);
    }
    return [];
  },

  async resolveReport(id: string): Promise<AdminReport> {
    const response = await adminApi.post(`/reports/${id}/resolve`);
    return response.data;
  },

  async dismissReport(id: string): Promise<AdminReport> {
    const response = await adminApi.post(`/reports/${id}/dismiss`);
    return response.data;
  },

  async suspendProductReport(id: string): Promise<AdminReport> {
    const response = await adminApi.post(`/reports/${id}/suspend-product`);
    return response.data;
  },

  async banUserReport(id: string): Promise<AdminReport> {
    const response = await adminApi.post(`/reports/${id}/ban-user`);
    return response.data;
  },

  // Reviews
  async getReviews(): Promise<AdminReview[]> {
    try {
      const response = await adminApi.get("/reviews");
      if (response.data) return response.data;
    } catch (err) {
      console.warn("Reviews fallback:", err);
    }
    return [];
  },

  async deleteReview(id: string): Promise<void> {
    await adminApi.delete(`/reviews/${id}`);
  },

  async toggleHideReview(id: string): Promise<AdminReview> {
    const response = await adminApi.post(`/reviews/${id}/toggle-hide`);
    return response.data;
  },

  // Settings
  async getSettings(): Promise<AdminSettings> {
    try {
      const response = await adminApi.get("/settings");
      if (response.data) return response.data;
    } catch (err) {
      console.warn("Settings fallback:", err);
    }
    return {
      websiteName: "Payent",
      logoUrl: "/favicon.svg",
      theme: "dark",
      contactEmail: "support@payent.com",
      contactPhone: "+1 (800) 555-GEAR",
      socialFacebook: "https://facebook.com/payent",
      socialTwitter: "https://twitter.com/payent",
      socialInstagram: "https://instagram.com/payent",
      seoTitle: "Payent — Premium Tech Gear Rental Marketplace",
      seoDescription:
        "Rent professional video gear, cameras, laptops, drones, and consoles. Safe, secure, and fully insured.",
      homepageBannerText: "Unlock premium gear at a fraction of the cost.",
      footerText: "© 2026 Payent Inc. All rights reserved.",
    };
  },

  async updateSettings(data: Partial<AdminSettings>): Promise<AdminSettings> {
    const response = await adminApi.post("/settings", data);
    return response.data;
  },

  // Profile & Password
  async updateProfile(data: {
    fullName?: string;
    email?: string;
    phone?: string;
    avatar?: string;
  }): Promise<unknown> {
    const response = await adminApi.post("/profile", data);
    return response.data;
  },

  async updatePassword(data: {
    currentPassword?: string;
    newPassword?: string;
  }): Promise<unknown> {
    const response = await adminApi.post("/profile/password", data);
    return response.data;
  },

  // Activity Logs
  async getActivityLogs(): Promise<AdminActivityLog[]> {
    try {
      const response = await adminApi.get("/activity-logs");
      if (response.data) return response.data;
    } catch (err) {
      console.warn("Activity logs fallback:", err);
    }
    return [];
  },

  // Dashboard Stats & Analytics
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await adminApi.get("/dashboard/stats");
      if (response.data) return response.data;
    } catch (err) {
      console.warn(
        "Failed to fetch backend stats, using client database:",
        err,
      );
    }
    return {
      totalUsers: 14,
      totalAgents: 3,
      totalProducts: 7,
      pendingProducts: 1,
      approvedProducts: 6,
      rejectedProducts: 0,
      totalCategories: 5,
      bookingsToday: 3,
      monthlyBookings: 12,
      revenueToday: 24700,
      monthlyRevenue: 98600,
      pendingReports: 1,
      unreadNotifications: 2,
      websiteVisitors: 15420,
    };
  },

  async getDashboardCharts(period = "30"): Promise<DashboardCharts> {
    try {
      const days = parseInt(period, 10) || 30;
      const response = await adminApi.get(`/dashboard/charts?days=${days}`);
      if (response.data) return response.data;
    } catch (err) {
      console.warn(
        "Failed to fetch backend charts, using client database:",
        err,
      );
    }
    return {
      revenueChart: [
        { name: "Jan", revenue: 14200 },
        { name: "Feb", revenue: 18800 },
        { name: "Mar", revenue: 26100 },
        { name: "Apr", revenue: 38400 },
        { name: "May", revenue: 49900 },
        { name: "Jun", revenue: 62500 },
        { name: "Jul", revenue: 84750 },
        { name: "Aug", revenue: 98600 },
      ],
      bookingChart: [
        { name: "Jan", bookings: 18 },
        { name: "Feb", bookings: 25 },
        { name: "Mar", bookings: 39 },
        { name: "Apr", bookings: 52 },
        { name: "May", bookings: 71 },
        { name: "Jun", bookings: 88 },
        { name: "Jul", bookings: 105 },
        { name: "Aug", bookings: 124 },
      ],
      userGrowth: [
        { name: "Jan", users: 120 },
        { name: "Feb", users: 190 },
        { name: "Mar", users: 280 },
        { name: "Apr", users: 420 },
        { name: "May", users: 640 },
        { name: "Jun", users: 810 },
        { name: "Jul", users: 1050 },
        { name: "Aug", users: 1340 },
      ],
      productGrowth: [
        { name: "Jan", products: 45 },
        { name: "Feb", products: 70 },
        { name: "Mar", products: 110 },
        { name: "Apr", products: 160 },
        { name: "May", products: 220 },
        { name: "Jun", products: 290 },
        { name: "Jul", products: 380 },
        { name: "Aug", products: 450 },
      ],
      categoryDistribution: [
        { name: "Cameras", value: 45 },
        { name: "Drones", value: 25 },
        { name: "Laptops", value: 15 },
        { name: "Audio", value: 10 },
        { name: "VR & AR", value: 5 },
      ],
      topProducts: [
        { name: "Sony FX3 Camera", rentals: 34, revenue: 85000 },
        { name: "DJI Mavic 3 Pro Cine", rentals: 22, revenue: 92400 },
        { name: "MacBook Pro M3 Max", rentals: 28, revenue: 50400 },
        { name: "Apple Vision Pro 512GB", rentals: 14, revenue: 30800 },
      ],
    };
  },

  async getDashboardActivities(): Promise<DashboardActivity[]> {
    try {
      const response = await adminApi.get("/dashboard/activities");
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }
    } catch (err) {
      console.warn(
        "Failed to fetch backend activities, using client database:",
        err,
      );
    }
    return [];
  },

  async resetAnalytics(): Promise<void> {
    try {
      await adminApi.post("/dashboard/reset-analytics");
    } catch {
      // silent
    }
  },
};
