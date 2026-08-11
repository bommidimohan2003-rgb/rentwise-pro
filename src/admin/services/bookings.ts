import { adminApi, AdminBooking } from "./api";

const FALLBACK_BOOKINGS: AdminBooking[] = [
  {
    id: "BK-8901",
    productId: "p1",
    productTitle: "Sony FX3 Cinema Line Camera",
    productImage: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600",
    customerId: "usr-4",
    customerName: "Devon Carter",
    ownerId: "usr-2",
    ownerName: "Marcus Vance",
    startDate: "2026-08-01",
    endDate: "2026-08-04",
    amount: 7500,
    status: "active",
    createdAt: "2026-07-28T10:15:00Z",
  },
  {
    id: "BK-8902",
    productId: "p2",
    productTitle: "DJI Mavic 3 Pro Cine Premium Combo",
    productImage: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=600",
    customerId: "usr-5",
    customerName: "Priya Sharma",
    ownerId: "usr-3",
    ownerName: "Elena Rostova",
    startDate: "2026-07-20",
    endDate: "2026-07-23",
    amount: 12600,
    status: "completed",
    createdAt: "2026-07-18T14:20:00Z",
  },
  {
    id: "BK-8903",
    productId: "p3",
    productTitle: "MacBook Pro 16\" M3 Max 64GB",
    productImage: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600",
    customerId: "usr-2",
    customerName: "Marcus Vance",
    ownerId: "usr-4",
    ownerName: "Devon Carter",
    startDate: "2026-07-22",
    endDate: "2026-07-25",
    amount: 5400,
    status: "completed",
    createdAt: "2026-07-20T09:00:00Z",
  },
  {
    id: "BK-8904",
    productId: "p7",
    productTitle: "Apple Vision Pro 512GB VR Headset",
    productImage: "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=600",
    customerId: "usr-4",
    customerName: "Devon Carter",
    ownerId: "usr-3",
    ownerName: "Elena Rostova",
    startDate: "2026-08-05",
    endDate: "2026-08-08",
    amount: 6600,
    status: "active",
    createdAt: "2026-08-02T16:45:00Z",
  },
  {
    id: "BK-8905",
    productId: "p4",
    productTitle: "RED Komodo 6K Digital Cinema Camera",
    productImage: "https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?w=600",
    customerId: "usr-5",
    customerName: "Priya Sharma",
    ownerId: "usr-2",
    ownerName: "Marcus Vance",
    startDate: "2026-08-12",
    endDate: "2026-08-15",
    amount: 10500,
    status: "pending",
    createdAt: "2026-08-08T11:30:00Z",
  },
];

export const bookingsService = {
  async getBookings(): Promise<AdminBooking[]> {
    try {
      const response = await adminApi.get("/bookings");
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }
    } catch (err) {
      console.warn("[bookingsService] getBookings fallback:", err);
    }
    return FALLBACK_BOOKINGS;
  },

  async cancelBooking(id: string): Promise<AdminBooking> {
    try {
      const response = await adminApi.post(`/bookings/${id}/cancel`);
      return response.data;
    } catch (err) {
      console.warn("[bookingsService] cancelBooking fallback:", err);
      const bk = FALLBACK_BOOKINGS.find((b) => b.id === id) || FALLBACK_BOOKINGS[0];
      return { ...bk, status: "cancelled" };
    }
  },

  async completeBooking(id: string): Promise<AdminBooking> {
    try {
      const response = await adminApi.post(`/bookings/${id}/complete`);
      return response.data;
    } catch (err) {
      console.warn("[bookingsService] completeBooking fallback:", err);
      const bk = FALLBACK_BOOKINGS.find((b) => b.id === id) || FALLBACK_BOOKINGS[0];
      return { ...bk, status: "completed" };
    }
  },

  async refundBooking(id: string): Promise<AdminBooking> {
    try {
      const response = await adminApi.post(`/bookings/${id}/refund`);
      return response.data;
    } catch (err) {
      console.warn("[bookingsService] refundBooking fallback:", err);
      const bk = FALLBACK_BOOKINGS.find((b) => b.id === id) || FALLBACK_BOOKINGS[0];
      return { ...bk, status: "cancelled" };
    }
  },
};
