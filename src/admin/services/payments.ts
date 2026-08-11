import { adminApi, AdminPayment } from "./api";

export const paymentsService = {
  async getPayments(): Promise<AdminPayment[]> {
    const response = await adminApi.get("/payments");
    return response.data;
  },

  async refundPayment(id: string): Promise<AdminPayment> {
    const response = await adminApi.post(`/payments/${id}/refund`);
    return response.data;
  },
};
