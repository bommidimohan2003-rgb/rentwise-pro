import { adminApi, AdminBooking } from "./api";

export const bookingsService = {
  async getBookings(): Promise<AdminBooking[]> {
    const response = await adminApi.get("/bookings");
    return response.data;
  },

  async cancelBooking(id: string): Promise<AdminBooking> {
    const response = await adminApi.post(`/bookings/${id}/cancel`);
    return response.data;
  },

  async completeBooking(id: string): Promise<AdminBooking> {
    const response = await adminApi.post(`/bookings/${id}/complete`);
    return response.data;
  },

  async refundBooking(id: string): Promise<AdminBooking> {
    const response = await adminApi.post(`/bookings/${id}/refund`);
    return response.data;
  },
};
