import { adminApi, AdminPayment } from "./api";

export const paymentsService = {
  async getPayments(): Promise<AdminPayment[]> {
    const response = await adminApi.get("/payments");
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  },

  async refundPayment(id: string): Promise<AdminPayment> {
    const response = await adminApi.post(`/payments/${encodeURIComponent(id)}/refund`);
    return response.data;
  },
};
