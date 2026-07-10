import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { STORAGE_KEYS, storage } from "@/utils/storage";
import { products } from "@/utils/mockData";
import type { Order } from "@/types";

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
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
        status: (i === 0 ? "active" : i === 1 ? "pending" : i === 2 ? "completed" : "cancelled") as Order["status"],
        createdAt: new Date().toISOString(),
      }));
      storage.set(STORAGE_KEYS.orders, demo);
      setOrders(demo);
    } else setOrders(list);
  }, []);

  return (
    <DashboardLayout>
      <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3"><Package className="h-7 w-7" /> Orders</h1>
      <p className="mt-2 text-muted-foreground">Track and manage all your rentals.</p>
      <div className="mt-8 card-premium overflow-hidden">
        <div className="hidden md:grid grid-cols-[80px_1fr_120px_120px_100px] gap-4 p-4 border-b border-border text-xs uppercase text-muted-foreground">
          <div>Item</div><div>Details</div><div>Dates</div><div>Total</div><div>Status</div>
        </div>
        {orders.map((o) => (
          <div key={o.id} className="grid grid-cols-[80px_1fr_120px_120px_100px] gap-4 p-4 items-center border-b border-border last:border-0">
            <img src={o.productImage} alt="" className="h-14 w-14 rounded-lg object-cover" />
            <div className="font-medium">{o.productTitle}</div>
            <div className="text-sm text-muted-foreground">{o.startDate} – {o.endDate}</div>
            <div className="font-semibold">${o.total}</div>
            <span className={`text-xs px-2 py-1 rounded-full w-fit ${o.status === "active" ? "bg-emerald-500/10 text-emerald-600" : o.status === "pending" ? "bg-amber-500/10 text-amber-600" : o.status === "cancelled" ? "bg-destructive/10 text-destructive" : "bg-secondary text-muted-foreground"}`}>
              {o.status}
            </span>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
