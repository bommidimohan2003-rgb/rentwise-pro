import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Bell, Heart, Package, TrendingUp } from "lucide-react";
import { useEffect } from "react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/hooks/useWishlist";
import { products } from "@/utils/mockData";
import { STORAGE_KEYS, storage } from "@/utils/storage";
import type { Order } from "@/types";
import { Button } from "@/components/common/Button";

const stats = [
  { icon: Package, label: "Active rentals", value: "3", color: "from-blue-500 to-indigo-500" },
  { icon: TrendingUp, label: "This month", value: "$482", color: "from-emerald-500 to-teal-500" },
  { icon: Heart, label: "Saved items", value: "12", color: "from-rose-500 to-pink-500" },
  { icon: Bell, label: "Alerts", value: "5", color: "from-amber-500 to-orange-500" },
];

export default function Dashboard() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const { ids } = useWishlist();

  useEffect(() => {
    if (ready && !user) navigate({ to: "/login" });
  }, [ready, user, navigate]);

  const orders = storage.get<Order[]>(STORAGE_KEYS.orders, []);
  const wishlistItems = products.filter((p) => ids.includes(p.id)).slice(0, 3);

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-3xl md:text-4xl font-bold">Welcome back{user ? `, ${user.fullName.split(" ")[0]}` : ""} 👋</h1>
        <p className="mt-2 text-muted-foreground">Here's what's happening with your rentals.</p>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card-premium p-5">
              <div className={`h-10 w-10 rounded-xl grid place-items-center bg-gradient-to-br ${s.color} mb-3`}>
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
              <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/orders" })}>View all</Button>
            </div>
            <div className="mt-4 space-y-3">
              {(orders.length ? orders : products.slice(0, 3).map((p, i) => ({
                id: `demo-${i}`,
                productId: p.id,
                productTitle: p.title,
                productImage: p.image,
                startDate: "Mar 14",
                endDate: "Mar 20",
                total: p.price * 6,
                status: (i === 0 ? "active" : i === 1 ? "pending" : "completed") as Order["status"],
                createdAt: "",
              }))).slice(0, 5).map((o) => (
                <div key={o.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-secondary transition-colors">
                  <img src={o.productImage} alt="" className="h-14 w-14 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{o.productTitle}</div>
                    <div className="text-xs text-muted-foreground">{o.startDate} – {o.endDate}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${o.total}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${o.status === "active" ? "bg-emerald-500/10 text-emerald-600" : o.status === "pending" ? "bg-amber-500/10 text-amber-600" : "bg-secondary text-muted-foreground"}`}>
                      {o.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card-premium p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Wishlist</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/wishlist" })}>See all</Button>
            </div>
            <div className="mt-4 space-y-3">
              {wishlistItems.length ? wishlistItems.map((p) => (
                <div key={p.id} className="flex items-center gap-3">
                  <img src={p.image} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{p.title}</div>
                    <div className="text-xs text-muted-foreground">${p.price}/day</div>
                  </div>
                </div>
              )) : <p className="text-sm text-muted-foreground">No saved items yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
