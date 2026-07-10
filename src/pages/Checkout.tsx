import { useNavigate, useSearch } from "@tanstack/react-router";
import { Check, CreditCard } from "lucide-react";
import { useMemo, useState } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Modal } from "@/components/common/Modal";
import { products } from "@/utils/mockData";
import { STORAGE_KEYS, storage } from "@/utils/storage";
import type { Order } from "@/types";

export default function Checkout() {
  const search = useSearch({ from: "/checkout" }) as { id?: string };
  const navigate = useNavigate();
  const product = products.find((p) => p.id === search.id) ?? products[0];
  const [start, setStart] = useState(new Date().toISOString().slice(0, 10));
  const [end, setEnd] = useState(new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10));
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState(false);
  const [open, setOpen] = useState(false);

  const days = Math.max(1, Math.ceil((+new Date(end) - +new Date(start)) / 86400000));
  const subtotal = product.price * days;
  const discount = applied ? subtotal * 0.1 : 0;
  const tax = (subtotal - discount) * 0.08;
  const total = useMemo(() => subtotal - discount + tax, [subtotal, discount, tax]);

  const pay = () => {
    const order: Order = {
      id: crypto.randomUUID(),
      productId: product.id,
      productTitle: product.title,
      productImage: product.image,
      startDate: start,
      endDate: end,
      total: Math.round(total),
      status: "active",
      createdAt: new Date().toISOString(),
    };
    const list = storage.get<Order[]>(STORAGE_KEYS.orders, []);
    storage.set(STORAGE_KEYS.orders, [order, ...list]);
    setOpen(true);
  };

  return (
    <MainLayout>
      <section className="mx-auto max-w-5xl px-4 md:px-6 py-10">
        <h1 className="text-3xl md:text-4xl font-bold">Checkout</h1>
        <div className="mt-8 grid lg:grid-cols-[1fr_360px] gap-6">
          <div className="space-y-6">
            <div className="card-premium p-6">
              <h3 className="font-semibold text-lg mb-4">Rental dates</h3>
              <div className="grid grid-cols-2 gap-4">
                <Input type="date" label="Start" value={start} onChange={(e) => setStart(e.target.value)} />
                <Input type="date" label="End" value={end} onChange={(e) => setEnd(e.target.value)} />
              </div>
            </div>
            <div className="card-premium p-6">
              <h3 className="font-semibold text-lg mb-4">Payment method</h3>
              <div className="p-4 rounded-xl border border-primary/40 bg-primary/5 flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <div className="text-sm font-medium">Visa ending 4242</div>
                  <div className="text-xs text-muted-foreground">Expires 12/28</div>
                </div>
                <Check className="h-4 w-4 text-primary" />
              </div>
            </div>
          </div>

          <aside className="card-premium p-6 h-fit">
            <h3 className="font-semibold text-lg">Booking summary</h3>
            <div className="mt-4 flex gap-3">
              <img src={product.image} alt="" className="h-16 w-16 rounded-xl object-cover" />
              <div className="min-w-0">
                <div className="font-medium truncate">{product.title}</div>
                <div className="text-xs text-muted-foreground">${product.price}/day × {days} day(s)</div>
              </div>
            </div>
            <div className="mt-6 space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <input
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder="Promo code"
                  className="flex-1 h-10 px-3 rounded-xl border border-border bg-card text-sm"
                />
                <Button size="sm" variant="outline" onClick={() => setApplied(coupon.trim().toUpperCase() === "SAVE10")}>Apply</Button>
              </div>
              {applied && <p className="text-xs text-emerald-600">10% off applied 🎉</p>}
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              {discount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>-${discount.toFixed(2)}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Tax (8%)</span><span>${tax.toFixed(2)}</span></div>
              <div className="flex justify-between pt-3 border-t border-border font-bold text-base"><span>Total</span><span>${total.toFixed(2)}</span></div>
            </div>
            <Button size="lg" className="w-full mt-6" onClick={pay}>Confirm & Pay</Button>
          </aside>
        </div>

        <Modal open={open} onClose={() => { setOpen(false); navigate({ to: "/orders" }); }} title="Booking confirmed">
          <div className="text-center py-4">
            <div className="h-14 w-14 mx-auto rounded-full bg-emerald-500/10 grid place-items-center">
              <Check className="h-7 w-7 text-emerald-500" />
            </div>
            <p className="mt-4 font-semibold text-lg">Your rental is booked!</p>
            <p className="mt-1 text-sm text-muted-foreground">We've sent a confirmation to your email.</p>
            <Button className="mt-6" onClick={() => { setOpen(false); navigate({ to: "/orders" }); }}>View orders</Button>
          </div>
        </Modal>
      </section>
    </MainLayout>
  );
}
