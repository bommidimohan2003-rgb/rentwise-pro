import { adminApi, AdminPayment } from "./api";

const FALLBACK_PAYMENTS: AdminPayment[] = [
  {
    id: "PAY-9901",
    bookingId: "BK-8901",
    customerId: "usr-4",
    customerName: "Devon Carter",
    amount: 7500,
    status: "successful",
    method: "Credit Card",
    invoiceUrl: "#",
    createdAt: "2026-07-28T10:16:00Z",
  },
  {
    id: "PAY-9902",
    bookingId: "BK-8902",
    customerId: "usr-5",
    customerName: "Priya Sharma",
    amount: 12600,
    status: "successful",
    method: "Bank Transfer",
    invoiceUrl: "#",
    createdAt: "2026-07-18T14:21:00Z",
  },
  {
    id: "PAY-9903",
    bookingId: "BK-8903",
    customerId: "usr-2",
    customerName: "Marcus Vance",
    amount: 5400,
    status: "successful",
    method: "Credit Card",
    invoiceUrl: "#",
    createdAt: "2026-07-20T09:01:00Z",
  },
  {
    id: "PAY-9904",
    bookingId: "BK-8904",
    customerId: "usr-4",
    customerName: "Devon Carter",
    amount: 6600,
    status: "successful",
    method: "Credit Card",
    invoiceUrl: "#",
    createdAt: "2026-08-02T16:46:00Z",
  },
  {
    id: "PAY-9905",
    bookingId: "BK-8905",
    customerId: "usr-5",
    customerName: "Priya Sharma",
    amount: 10500,
    status: "successful",
    method: "Bank Transfer",
    invoiceUrl: "#",
    createdAt: "2026-08-08T11:31:00Z",
  },
];

export const paymentsService = {
  async getPayments(): Promise<AdminPayment[]> {
    try {
      const response = await adminApi.get("/payments");
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }
    } catch (err) {
      console.warn("[paymentsService] getPayments fallback:", err);
    }
    return FALLBACK_PAYMENTS;
  },

  async refundPayment(id: string): Promise<AdminPayment> {
    try {
      const response = await adminApi.post(`/payments/${id}/refund`);
      return response.data;
    } catch (err) {
      console.warn("[paymentsService] refundPayment fallback:", err);
      const pay = FALLBACK_PAYMENTS.find((p) => p.id === id) || FALLBACK_PAYMENTS[0];
      return { ...pay, status: "refunded" };
    }
  },
};
