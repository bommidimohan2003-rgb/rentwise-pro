import { useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Heart, Package, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/hooks/useWishlist";
import { products } from "@/utils/mockData";
import { STORAGE_KEYS, storage } from "@/utils/storage";
import type { Order, Product, Notification } from "@/types";
import { Button } from "@/components/common/Button";

export default function Dashboard() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const { ids } = useWishlist();

  const [orders, setOrders] = useState<Order[]>([]);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (ready && !user) navigate({ to: "/login" });
  }, [ready, user, navigate]);

  useEffect(() => {
    let list = storage.get<Order[]>(STORAGE_KEYS.orders, []);
    if (!list.length) {
      list = products.slice(0, 3).map((p, i) => ({
        id: `demo-${i}`,
        productId: p.id,
        productTitle: p.title,
        productImage: p.image,
        startDate: "Mar 14",
        endDate: "Mar 20",
        total: p.price * 6,
        status: (i === 0 ? "active" : i === 1 ? "pending" : "completed") as Order["status"],
        createdAt: new Date().toISOString(),
      }));
      storage.set(STORAGE_KEYS.orders, list);
    }
    setOrders(list);
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

  const wishlistItems = products.filter((p) => ids.includes(p.id)).slice(0, 3);
  const myListings = storage.get<Product[]>(STORAGE_KEYS.customProducts, []);

  // Compute real-time dashboard details dynamically
  const activeRentalsCount = orders.filter(
    (o) => o.status === "active" || o.status === "pending",
  ).length;
  const monthlyTotal = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);
  const savedItemsCount = ids.length;
  const alertsList = storage.get<Notification[]>(STORAGE_KEYS.notifications, []);
  const alertsCount = alertsList.length || 3;

  const stats = [
    {
      icon: Package,
      label: "Active rentals",
      value: String(activeRentalsCount),
      color: "from-blue-500 to-indigo-500",
    },
    {
      icon: TrendingUp,
      label: "This month",
      value: `₹${monthlyTotal.toLocaleString("en-IN")}`,
      color: "from-emerald-500 to-teal-500",
    },
    {
      icon: Heart,
      label: "Saved items",
      value: String(savedItemsCount),
      color: "from-rose-500 to-pink-500",
    },
    {
      icon: Bell,
      label: "Alerts",
      value: String(alertsCount),
      color: "from-amber-500 to-orange-500",
    },
  ];

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-3xl md:text-4xl font-bold">
          Welcome back{user ? `, ${user.fullName.split(" ")[0]}` : ""} 👋
        </h1>
        <p className="mt-2 text-muted-foreground">Here's what's happening with your rentals.</p>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card-premium p-5"
            >
              <div
                className={`h-10 w-10 rounded-xl grid place-items-center bg-gradient-to-br ${s.color} mb-3`}
              >
                <s.icon className="h-5 w-5 text-white" />
              </div>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card-premium p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent rentals</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/orders" })}>
                View all
              </Button>
            </div>
            <div className="mt-4 space-y-3">
              {orders.slice(0, 5).map((o) => (
                <div
                  key={o.id}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-secondary transition-colors"
                >
                  <img src={o.productImage} alt="" className="h-14 w-14 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{o.productTitle}</div>
                    <div className="text-xs text-muted-foreground">
                      {o.startDate} – {o.endDate}
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1.5">
                    <div className="font-semibold">₹{o.total}</div>
                    <div className="flex items-center gap-2">
                      {(o.status === "active" || o.status === "pending") && (
                        <button
                          onClick={() => setCancellingOrderId(o.id)}
                          className="text-xs px-2 py-0.5 rounded bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all font-medium"
                        >
                          Cancel
                        </button>
                      )}
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {/* My Listings Card */}
            <div className="card-premium p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">My Listings ({myListings.length})</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate({ to: "/become-lender" })}
                >
                  Add gear
                </Button>
              </div>
              <div className="mt-4 space-y-3">
                {myListings.length ? (
                  myListings.slice(0, 3).map((p) => (
                    <div key={p.id} className="flex items-center gap-3">
                      <img src={p.image} alt="" className="h-12 w-12 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{p.title}</div>
                        <div className="text-xs text-muted-foreground">
                          ₹{p.price}/day • {p.category}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No items listed for rent yet.</p>
                )}
              </div>
            </div>

            {/* Wishlist Card */}
            <div className="card-premium p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Wishlist</h2>
                <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/wishlist" })}>
                  See all
                </Button>
              </div>
              <div className="mt-4 space-y-3">
                {wishlistItems.length ? (
                  wishlistItems.map((p) => (
                    <div key={p.id} className="flex items-center gap-3">
                      <img src={p.image} alt="" className="h-12 w-12 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{p.title}</div>
                        <div className="text-xs text-muted-foreground">₹{p.price}/day</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No saved items yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
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
