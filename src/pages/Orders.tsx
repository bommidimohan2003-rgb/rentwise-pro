import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/common/Button";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { STORAGE_KEYS, storage } from "@/utils/storage";
import { products } from "@/utils/mockData";
import type { Order } from "@/types";

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  useEffect(() => {
    const list = storage.get<Order[]>(STORAGE_KEYS.orders, []);
    if (!list.length) {
      const demo = products.slice(0, 4).map((p, i) => ({
        id: `o${i}`,
        productId: p.id,
        productTitle: p.title,
        productImage: p.image,
        startDate: "Mar 12",
        endDate: "Mar 18",
        total: p.price * 6,
        status: (i === 0
          ? "active"
          : i === 1
            ? "pending"
            : i === 2
              ? "completed"
              : "cancelled") as Order["status"],
        createdAt: new Date().toISOString(),
      }));
      storage.set(STORAGE_KEYS.orders, demo);
      setOrders(demo);
    } else setOrders(list);
  }, []);

  const handleCancelOrder = (orderId: string) => {
    const updated = orders.map((o) => {
      if (o.id === orderId) {
        return { ...o, status: "cancelled" as const };
      }
      return o;
    });
    setOrders(updated);
    storage.set(STORAGE_KEYS.orders, updated);
    toast.success("Order cancelled successfully!");
  };

  return (
    <DashboardLayout>
      <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
        <Package className="h-7 w-7" /> Orders
      </h1>
      <p className="mt-2 text-muted-foreground">Track and manage all your rentals.</p>
      <div className="mt-8 card-premium overflow-hidden">
        <div className="hidden md:grid grid-cols-[80px_1fr_120px_120px_100px] gap-4 p-4 border-b border-border text-xs uppercase text-muted-foreground">
          <div>Item</div>
          <div>Details</div>
          <div>Dates</div>
          <div>Total</div>
          <div>Status</div>
        </div>
        {orders.map((o) => (
          <div
            key={o.id}
            className="grid grid-cols-[80px_1fr_120px_120px_100px] gap-4 p-4 items-center border-b border-border last:border-0"
          >
            <img src={o.productImage} alt="" className="h-14 w-14 rounded-lg object-cover" />
            <div className="font-medium">{o.productTitle}</div>
            <div className="text-sm text-muted-foreground">
              {o.startDate} – {o.endDate}
            </div>
            <div className="font-semibold">₹{o.total}</div>
            <div className="flex flex-col gap-1 items-start">
              <span
                className={`text-xs px-2 py-1 rounded-full w-fit ${
                  o.status === "active"
                    ? "bg-emerald-500/10 text-emerald-600"
                    : o.status === "pending"
                      ? "bg-amber-500/10 text-amber-600"
                      : o.status === "cancelled"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-secondary text-muted-foreground"
                }`}
              >
                {o.status}
              </span>
              {(o.status === "active" || o.status === "pending") && (
                <button
                  onClick={() => setCancellingOrderId(o.id)}
                  className="text-[10px] mt-1 text-destructive hover:underline font-semibold"
                >
                  Cancel Rental
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <AnimatePresence>
        {cancellingOrderId && (
          <div className="fixed inset-0 z-50 grid place-items-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCancellingOrderId(null)}
              className="fixed inset-0 bg-background/85 backdrop-blur-md"
            />
            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-2xl backdrop-blur-xl z-10"
            >
              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-bold text-foreground">Cancel Gear Rental</h3>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to cancel this gear rental? Once cancelled, the reservation
                  holds will be released back to the lender. This action cannot be undone.
                </p>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setCancellingOrderId(null)}>
                  Keep Rental
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleCancelOrder(cancellingOrderId);
                    setCancellingOrderId(null);
                  }}
                >
                  Confirm Cancellation
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
