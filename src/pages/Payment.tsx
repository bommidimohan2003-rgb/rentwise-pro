import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  ShieldCheck,
  Lock,
  Clock,
  Smartphone,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Info,
  CreditCard,
  Building,
} from "lucide-react";
import { MainLayout } from "@/layouts/MainLayout";
import { Button } from "@/components/common/Button";
import { products } from "@/utils/mockData";
import { STORAGE_KEYS, storage } from "@/utils/storage";
import { api } from "@/utils/api";
import type { Order } from "@/types";
import { toast } from "sonner";

interface PaymentSearch {
  id?: string;
  total?: number | string;
  start?: string;
  end?: string;
}

export default function Payment() {
  const search = useSearch({ from: "/payment" }) as PaymentSearch;
  const navigate = useNavigate();

  const productId = search.id || "";
  const product = products.find((p) => p.id === productId) ?? products[0];

  const totalAmount = Number(search.total) || 0;
  const start = search.start || new Date().toISOString().slice(0, 10);
  const end = search.end || new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10);

  // States
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);

  // Timer Countdown Effect
  useEffect(() => {
    if (timeLeft <= 0) {
      toast.error("Transaction session expired. Please restart checkout.");
      navigate({ to: "/categories" });
      return;
    }
    const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, navigate]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSelectApp = (appName: string) => {
    setSelectedMethod(appName);
    setIsProcessing(true);

    // Auto simulate success after 3.5s or via manual confirmation button
    setTimeout(() => {
      // Allow manual simulation inside UI modal
    }, 500);
  };

  const handleConfirmMockPayment = () => {
    setIsProcessing(false);
    setPaySuccess(true);

    // Create and save order
    const order: Order = {
      id: crypto.randomUUID(),
      productId: product.id,
      productTitle: product.title,
      productImage: product.image,
      startDate: start,
      endDate: end,
      total: Math.round(totalAmount),
      status: "active",
      createdAt: new Date().toISOString(),
    };

    const token = storage.get<string | null>(STORAGE_KEYS.token, null);
    if (token) {
      api
        .createOrder(token, order)
        .catch((err) => console.error("Failed to create order on backend:", err));
    }

    toast.success("Payment Completed Successfully! 🎉");

    // Redirect to orders page after 2.5 seconds
    setTimeout(() => {
      navigate({ to: "/orders" });
    }, 2500);
  };

  const upiApps = [
    {
      id: "phonepe",
      name: "PhonePe",
      color:
        "bg-purple-600/10 hover:bg-purple-600/15 border-purple-500/20 text-purple-600 dark:text-purple-400",
      iconColor: "text-purple-600 dark:text-purple-400",
      accentBg: "bg-purple-600",
      tagline: "Pay using saved cards or bank account on PhonePe",
    },
    {
      id: "gpay",
      name: "Google Pay",
      color:
        "bg-blue-600/10 hover:bg-blue-600/15 border-blue-500/20 text-blue-600 dark:text-blue-400",
      iconColor: "text-blue-600 dark:text-blue-400",
      accentBg: "bg-blue-600",
      tagline: "Direct bank transfer using Google Pay secure account",
    },
    {
      id: "bhim",
      name: "BHIM UPI",
      color:
        "bg-emerald-600/10 hover:bg-emerald-600/15 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      accentBg: "bg-emerald-600",
      tagline: "Unified Payments Interface of India official app",
    },
    {
      id: "paytm",
      name: "Paytm Wallet / UPI",
      color:
        "bg-cyan-600/10 hover:bg-cyan-600/15 border-cyan-500/20 text-cyan-600 dark:text-cyan-400",
      iconColor: "text-cyan-600 dark:text-cyan-400",
      accentBg: "bg-cyan-600",
      tagline: "Fast Checkout using Paytm Balance or linked accounts",
    },
  ];

  return (
    <MainLayout>
      <section className="mx-auto max-w-4xl px-4 md:px-6 py-10">
        <button
          onClick={() => navigate({ to: `/checkout`, search: { id: product.id } as never })}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Checkout
        </button>

        <div className="grid lg:grid-cols-[1fr_340px] gap-8">
          {/* Left: Payment Gateway options */}
          <div className="space-y-6">
            <div className="card-premium p-6 border-primary/20 bg-gradient-to-b from-primary/5 via-card to-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 grid place-items-center">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">Secure Payment Portal</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Powered by Payent Encrypted Gateways
                    </p>
                  </div>
                </div>
                {/* Timer */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 w-fit self-start sm:self-center">
                  <Clock className="h-4 w-4 animate-pulse" />
                  <span className="text-xs font-mono font-bold">{formatTimer(timeLeft)}</span>
                </div>
              </div>

              {/* UPI Options Header */}
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  UPI Applications
                </h3>

                <div className="grid gap-3.5">
                  {upiApps.map((app) => (
                    <button
                      key={app.id}
                      onClick={() => handleSelectApp(app.name)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all duration-300 ${app.color} hover:translate-x-1 group shadow-sm`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`h-11 w-11 rounded-xl bg-card border border-border/40 grid place-items-center shadow-inner group-hover:scale-105 transition-transform ${app.iconColor}`}
                        >
                          <Smartphone className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-bold text-foreground group-hover:text-primary transition-colors">
                            {app.name}
                          </div>
                          <div className="text-xs text-muted-foreground/80 mt-0.5 max-w-[260px] sm:max-w-md truncate">
                            {app.tagline}
                          </div>
                        </div>
                      </div>
                      <div className="h-6 w-6 rounded-full bg-border/20 group-hover:bg-primary/20 grid place-items-center transition-colors">
                        <span className="text-xs text-muted-foreground group-hover:text-primary font-bold">
                          →
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Alternative Fallback options */}
              <div className="mt-8 pt-6 border-t border-border/60">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Other payment options
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => handleSelectApp("Credit/Debit Card")}
                    className="flex items-center gap-3 p-3.5 rounded-xl border border-border/60 hover:bg-secondary text-left text-sm font-medium transition-colors"
                  >
                    <CreditCard className="h-4.5 w-4.5 text-muted-foreground" />
                    <div>
                      <div className="font-semibold text-foreground">Cards</div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Visa, Mastercard, RuPay
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => handleSelectApp("Net Banking")}
                    className="flex items-center gap-3 p-3.5 rounded-xl border border-border/60 hover:bg-secondary text-left text-sm font-medium transition-colors"
                  >
                    <Building className="h-4.5 w-4.5 text-muted-foreground" />
                    <div>
                      <div className="font-semibold text-foreground">Net Banking</div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        All major Indian banks
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 justify-center text-[10px] text-muted-foreground mt-6 border-t border-border/40 pt-4">
                <Lock className="h-3.5 w-3.5 text-emerald-500" />
                Your security is our priority. Transactions are encrypted using AES 256-bit bank
                standards.
              </div>
            </div>
          </div>

          {/* Right: Booking Summary Sidebar */}
          <aside className="card-premium p-6 h-fit space-y-5">
            <div>
              <h3 className="font-bold text-lg">Order Summary</h3>
              <div className="mt-4 flex gap-3">
                <img
                  src={product.image}
                  alt=""
                  className="h-14 w-14 rounded-xl object-cover border border-border shrink-0"
                />
                <div className="min-w-0">
                  <div className="font-bold truncate text-sm text-foreground">{product.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Category: {product.category.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm pt-4 border-t border-border/60">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rental dates</span>
                <span className="font-medium text-right text-xs">
                  {start} to {end}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border/40 font-bold text-base">
                <span>To Pay</span>
                <span className="text-primary font-extrabold">₹{totalAmount.toFixed(0)}</span>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* Processing Loader Modal */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center p-4">
          <div className="w-full max-w-sm card-premium p-6 text-center space-y-6">
            <div className="relative h-16 w-16 mx-auto">
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
              <div className="absolute inset-0 grid place-items-center">
                <Smartphone className="h-6 w-6 text-primary animate-pulse" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-lg text-foreground">
                Waiting for payment confirmation
              </h3>
              <p className="text-xs text-muted-foreground mt-1.5 px-2">
                We've requested a secure checkout payment of{" "}
                <span className="font-bold text-foreground">₹{totalAmount.toFixed(0)}</span> on your{" "}
                <span className="font-semibold text-primary">{selectedMethod}</span> mobile app.
                Please approve the request on your phone.
              </p>
            </div>

            <div className="bg-secondary/40 p-3 rounded-xl border border-border/40 flex items-start gap-2.5 text-[10px] text-muted-foreground text-left leading-relaxed">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                Do not refresh this page or close the tab. This simulated gateway will automatically
                prompt to complete the process.
              </div>
            </div>

            {/* Simulated success confirm button */}
            <Button onClick={handleConfirmMockPayment} className="w-full">
              Confirm Payment (Mock Success)
            </Button>
          </div>
        </div>
      )}

      {/* Success Success Overlay */}
      {paySuccess && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md grid place-items-center p-4">
          <div className="w-full max-w-sm text-center space-y-5 animate-in fade-in zoom-in-95 duration-300">
            <div className="h-20 w-20 mx-auto rounded-full bg-emerald-500/10 grid place-items-center border border-emerald-500/20">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 animate-bounce" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Payment Successful!</h2>
              <p className="text-sm text-white/70 mt-2 px-4">
                Thank you! Your transaction of ₹{totalAmount.toFixed(0)} was processed securely.
                Redirecting to your Orders...
              </p>
            </div>
            <div className="h-1 w-24 bg-border/20 mx-auto rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full animate-[loading-bar_2.2s_ease-out]"
                style={{ width: "100%" }}
              />
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
