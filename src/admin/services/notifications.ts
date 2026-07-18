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
    const response = await adminApi.get("/notifications");
    return response.data;
  },

  async markAllRead(): Promise<void> {
    await adminApi.post("/notifications/mark-read");
  },

  async deleteNotification(id: string): Promise<void> {
    await adminApi.delete(`/notifications/${id}`);
  },

  // Support Tickets
  async getSupportTickets(): Promise<AdminSupportTicket[]> {
    const response = await adminApi.get("/support");
    return response.data;
  },

  async replyToTicket(id: string, message: string): Promise<AdminSupportTicket> {
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
    const response = await adminApi.get("/reports");
    return response.data;
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
    const response = await adminApi.get("/reviews");
    return response.data;
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
    const response = await adminApi.get("/settings");
    return response.data;
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

  async updatePassword(data: { currentPassword?: string; newPassword?: string }): Promise<unknown> {
    const response = await adminApi.post("/profile/password", data);
    return response.data;
  },

  // Activity Logs
  async getActivityLogs(): Promise<AdminActivityLog[]> {
    const response = await adminApi.get("/activity-logs");
    return response.data;
  },

  // Dashboard Stats & Analytics
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await adminApi.get("/dashboard/stats");
    return response.data;
  },

  async getDashboardCharts(): Promise<DashboardCharts> {
    const response = await adminApi.get("/dashboard/charts");
    return response.data;
  },

  async getDashboardActivities(): Promise<DashboardActivity[]> {
    const response = await adminApi.get("/dashboard/activities");
    return response.data;
  },
};
