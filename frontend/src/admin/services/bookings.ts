import { adminApi, AdminBooking } from "./api";

export const bookingsService = {
  async getBookings(): Promise<AdminBooking[]> {
    const response = await adminApi.get("/bookings");
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  },

  async cancelBooking(id: string): Promise<AdminBooking> {
    const response = await adminApi.post(`/bookings/${encodeURIComponent(id)}/cancel`);
    return response.data;
  },

  async completeBooking(id: string): Promise<AdminBooking> {
    const response = await adminApi.post(`/bookings/${encodeURIComponent(id)}/complete`);
    return response.data;
  },

  async refundBooking(id: string): Promise<AdminBooking> {
    const response = await adminApi.post(`/bookings/${encodeURIComponent(id)}/refund`);
    return response.data;
  },
};
