import { useNavigate, useSearch } from "@tanstack/react-router";
import { Check, CreditCard, QrCode, Phone, Smartphone, AlertCircle, Info } from "lucide-react";
import { useMemo, useState, useEffect, useRef } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Modal } from "@/components/common/Modal";
import { products } from "@/utils/mockData";
import { STORAGE_KEYS, storage } from "@/utils/storage";
import type { Order } from "@/types";
import { toast } from "sonner";

export default function Checkout() {
  const search = useSearch({ from: "/checkout" }) as { id?: string };
  const navigate = useNavigate();
  const product = products.find((p) => p.id === search.id) ?? products[0];

  // Dates
  const [start, setStart] = useState(new Date().toISOString().slice(0, 10));
  const [end, setEnd] = useState(new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10));

  // Promos
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState(false);

  // Modal & Processing Statuses
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Payment Method: "card" | "upi"
  const [paymentMethod, setPaymentMethod] = useState<"card" | "upi">("card");

  // Card details
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  // UPI details
  const [upiType, setUpiType] = useState<"id" | "qr">("id");
  const [upiId, setUpiId] = useState("");
  const [upiVerified, setUpiVerified] = useState(false);
  const [upiVerifying, setUpiVerifying] = useState(false);
  const [qrCountdown, setQrCountdown] = useState(120); // 2 minutes
  const [qrActive, setQrActive] = useState(false);

  const qrTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Rental Calculations
  const days = Math.max(1, Math.ceil((+new Date(end) - +new Date(start)) / 86400000));
  const subtotal = product.price * days;
  const discount = applied ? subtotal * 0.1 : 0;
  const tax = (subtotal - discount) * 0.08;
  const total = useMemo(() => subtotal - discount + tax, [subtotal, discount, tax]);

  // QR Timer Countdown Handler
  useEffect(() => {
    if (paymentMethod === "upi" && upiType === "qr" && qrActive && qrCountdown > 0) {
      qrTimerRef.current = setTimeout(() => {
        setQrCountdown((prev) => prev - 1);
      }, 1000);
    } else if (qrCountdown === 0) {
      toast.error("QR Code expired. Please generate a new one.");
      setQrActive(false);
    }
    return () => {
      if (qrTimerRef.current) clearTimeout(qrTimerRef.current);
    };
  }, [paymentMethod, upiType, qrCountdown, qrActive]);

  const handleGenerateQR = () => {
    setQrCountdown(120);
    setQrActive(true);
    toast.success("Payment QR Code generated!");
  };

  // Card brand detection
  const cardBrand = useMemo(() => {
    const clean = cardNumber.replace(/\D/g, "");
    if (clean.startsWith("4")) return "Visa";
    if (clean.startsWith("5")) return "Mastercard";
    if (clean.startsWith("3")) return "American Express";
    return "Card";
  }, [cardNumber]);

  // Format Card Number (adds spaces every 4 digits)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 16);
    const matches = val.match(/\d{1,4}/g);
    setCardNumber(matches ? matches.join(" ") : val);
  };

  // Format Card Expiry (adds slash MM/YY)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (val.length >= 2) {
      val = val.slice(0, 2) + "/" + val.slice(2);
    }
    setCardExpiry(val);
  };

  // Format Card CVV (adds limit to 3 digits)
  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 3);
    setCardCvv(val);
  };

  // UPI verification
  const handleVerifyUpi = () => {
    if (!upiId || !upiId.includes("@")) {
      toast.error("Please enter a valid UPI ID (e.g., name@okaxis)");
      return;
    }
    setUpiVerifying(true);
    setTimeout(() => {
      setUpiVerifying(false);
      setUpiVerified(true);
      toast.success("UPI ID verified: John Doe ✅");
    }, 1200);
  };

  // Simulate payment processing & submit
  const handlePay = () => {
    if (paymentMethod === "card") {
      const cleanNum = cardNumber.replace(/\D/g, "");
      if (cleanNum.length < 16) {
        toast.error("Please enter a valid 16-digit card number.");
        return;
      }
      if (!cardName.trim()) {
        toast.error("Please enter the cardholder name.");
        return;
      }
      if (cardExpiry.length < 5) {
        toast.error("Please enter a valid expiration date (MM/YY).");
        return;
      }
      if (cardCvv.length < 3) {
        toast.error("Please enter a valid 3-digit CVV.");
        return;
      }
    } else if (paymentMethod === "upi") {
      if (upiType === "id" && !upiVerified) {
        toast.error("Please verify your UPI ID before submitting payment.");
        return;
      }
      if (upiType === "qr" && !qrActive) {
        toast.error("Please generate a payment QR code first.");
        return;
      }
    }

    setIsProcessing(true);

    // Simulate Redirecting to payment portal
    setTimeout(() => {
      setIsProcessing(false);
      navigate({
        to: "/payment",
        search: {
          id: product.id,
          total: Math.round(total),
          start,
          end,
        } as never,
      });
    }, 1200);
  };

  // Helper for countdown display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <MainLayout>
      <section className="mx-auto max-w-5xl px-4 md:px-6 py-10">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Checkout</h1>
        <p className="text-muted-foreground mt-1">
          Review dates and complete your payment securely.
        </p>

        <div className="mt-8 grid lg:grid-cols-[1fr_380px] gap-8">
          <div className="space-y-6">
            {/* Rental Dates Card */}
            <div className="card-premium p-6">
              <h3 className="font-bold text-lg mb-4">Rental dates</h3>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="date"
                  label="Start"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                />
                <Input
                  type="date"
                  label="End"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  min={start}
                />
              </div>
            </div>

            {/* Payment Method Selector Card */}
            <div className="card-premium p-6">
              <h3 className="font-bold text-lg mb-4">Payment method</h3>

              {/* Tabs */}
              <div className="grid grid-cols-2 gap-2 bg-secondary p-1 rounded-xl mb-6">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`py-2 rounded-lg text-sm font-medium transition-all ${
                    paymentMethod === "card"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Credit / Debit Card
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("upi")}
                  className={`py-2 rounded-lg text-sm font-medium transition-all ${
                    paymentMethod === "upi"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  UPI Payment
                </button>
              </div>

              {/* Credit Card Flow */}
              {paymentMethod === "card" && (
                <div className="space-y-6">
                  {/* Visual Credit Card Preview */}
                  <div className="flex justify-center mb-6">
                    <div className="w-full max-w-[340px] aspect-[1.586] rounded-2xl p-6 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 text-white relative shadow-xl overflow-hidden flex flex-col justify-between">
                      {/* Grid overlay for aesthetic premium card texture */}
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />

                      <div className="flex justify-between items-start relative z-10">
                        {/* Golden Chip */}
                        <div className="w-10 h-7 rounded-md bg-gradient-to-r from-amber-400 to-yellow-200 border border-amber-300 relative overflow-hidden">
                          <div className="absolute inset-x-2 inset-y-1 border-r border-b border-amber-600/30 grid grid-cols-2 gap-0.5" />
                        </div>
                        <span className="text-xs uppercase font-extrabold tracking-wider bg-white/10 px-2 py-1 rounded-md backdrop-blur-sm">
                          {cardBrand}
                        </span>
                      </div>

                      <div className="my-4 text-xl tracking-widest font-mono text-center relative z-10 text-white drop-shadow-md">
                        {cardNumber || "•••• •••• •••• ••••"}
                      </div>

                      <div className="flex justify-between items-end relative z-10 text-xs font-mono uppercase">
                        <div>
                          <div className="text-[10px] text-white/60 tracking-tight">
                            Card Holder
                          </div>
                          <div className="font-semibold truncate max-w-[180px]">
                            {cardName || "CARDHOLDER NAME"}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-white/60 tracking-tight">Expires</div>
                          <div className="font-semibold">{cardExpiry || "MM/YY"}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Input Fields */}
                  <div className="space-y-4">
                    <Input
                      label="Cardholder Name"
                      placeholder="e.g. John Doe"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      required
                    />
                    <Input
                      label="Card Number"
                      placeholder="4111 2222 3333 4444"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      icon={<CreditCard className="h-4 w-4" />}
                      required
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Expiration Date"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={handleExpiryChange}
                        required
                      />
                      <Input
                        label="CVV"
                        placeholder="123"
                        type="password"
                        value={cardCvv}
                        onChange={handleCvvChange}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* UPI Flow */}
              {paymentMethod === "upi" && (
                <div className="space-y-6">
                  {/* UPI Mode Selector */}
                  <div className="flex gap-4 border-b border-border pb-4">
                    <button
                      type="button"
                      onClick={() => setUpiType("id")}
                      className={`text-sm font-semibold flex items-center gap-1.5 transition-colors ${
                        upiType === "id"
                          ? "text-primary border-b-2 border-primary pb-2 -mb-4.5"
                          : "text-muted-foreground"
                      }`}
                    >
                      <Smartphone className="h-4 w-4" /> UPI ID
                    </button>
                    <button
                      type="button"
                      onClick={() => setUpiType("qr")}
                      className={`text-sm font-semibold flex items-center gap-1.5 transition-colors ${
                        upiType === "qr"
                          ? "text-primary border-b-2 border-primary pb-2 -mb-4.5"
                          : "text-muted-foreground"
                      }`}
                    >
                      <QrCode className="h-4 w-4" /> QR Code
                    </button>
                  </div>

                  {/* UPI ID Form */}
                  {upiType === "id" && (
                    <div className="space-y-4 pt-2">
                      <div className="flex gap-2 items-end">
                        <div className="flex-1">
                          <Input
                            label="UPI ID"
                            placeholder="username@okaxis"
                            value={upiId}
                            onChange={(e) => {
                              setUpiId(e.target.value);
                              setUpiVerified(false); // Reset if changed
                            }}
                            required
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleVerifyUpi}
                          loading={upiVerifying}
                          className="h-12 border-border"
                          disabled={upiVerified}
                        >
                          {upiVerified ? "Verified ✓" : "Verify ID"}
                        </Button>
                      </div>
                      {upiVerified && (
                        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 text-emerald-600 rounded-xl text-xs font-semibold">
                          <Check className="h-4 w-4 shrink-0" /> Associated Account: John Doe
                        </div>
                      )}

                      {/* Mock UPI suggestions */}
                      <div className="pt-2">
                        <label className="text-xs uppercase text-muted-foreground font-semibold">
                          Popular handles
                        </label>
                        <div className="flex flex-wrap gap-2 mt-1.5">
                          {["@okaxis", "@okicici", "@ybl", "@paytm"].map((handle) => (
                            <button
                              type="button"
                              key={handle}
                              onClick={() => {
                                const base = upiId.includes("@")
                                  ? upiId.split("@")[0]
                                  : upiId || "user";
                                setUpiId(base + handle);
                                setUpiVerified(false);
                              }}
                              className="px-2.5 py-1 text-xs rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                            >
                              {handle}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* QR Code Block */}
                  {upiType === "qr" && (
                    <div className="pt-2 flex flex-col items-center text-center space-y-4">
                      {qrActive ? (
                        <>
                          <div className="p-4 bg-white rounded-2xl shadow-inner border border-border relative overflow-hidden flex flex-col items-center">
                            {/* SVG QR Code Simulation */}
                            <svg className="w-48 h-48 text-black" viewBox="0 0 100 100">
                              <rect width="100" height="100" fill="white" />
                              {/* Position boxes */}
                              <rect x="5" y="5" width="25" height="25" fill="black" />
                              <rect x="10" y="10" width="15" height="15" fill="white" />
                              <rect x="13" y="13" width="9" height="9" fill="black" />

                              <rect x="70" y="5" width="25" height="25" fill="black" />
                              <rect x="75" y="10" width="15" height="15" fill="white" />
                              <rect x="78" y="13" width="9" height="9" fill="black" />

                              <rect x="5" y="70" width="25" height="25" fill="black" />
                              <rect x="10" y="75" width="15" height="15" fill="white" />
                              <rect x="13" y="78" width="9" height="9" fill="black" />

                              {/* Tiny dots block simulation */}
                              <path
                                d="M 35 15 h 5 v 5 h -5 z M 45 5 h 10 v 5 h -10 z M 40 25 h 5 v 10 h -5 z M 55 20 h 5 v 5 h -5 z M 60 10 h 5 v 5 h -5 z M 55 35 h 10 v 5 h -10 z M 75 35 h 5 v 5 h -5 z M 90 35 h 5 v 5 h -5 z M 85 45 h 10 v 5 h -10 z M 70 50 h 10 v 5 h -10 z M 75 60 h 5 v 10 h -5 z M 90 70 h 10 v 5 h -10 z M 85 85 h 5 v 5 h -5 z M 60 75 h 5 v 5 h -5 z M 55 80 h 15 v 5 h -15 z M 35 70 h 10 v 5 h -10 z M 45 85 h 5 v 10 h -5 z M 35 90 h 5 v 5 h -5 z M 15 35 h 10 v 5 h -10 z M 25 45 h 5 v 5 h -5 z M 5 50 h 15 v 5 h -15 z M 10 60 h 10 v 5 h -10 z M 35 45 h 15 v 5 h -15 z M 50 50 h 5 v 10 h -5 z M 40 60 h 5 v 5 h -5 z"
                                fill="black"
                              />
                            </svg>
                            <div className="absolute inset-0 bg-black/5 pointer-events-none" />
                          </div>

                          <div className="space-y-1.5">
                            <p className="text-sm font-semibold flex items-center justify-center gap-1.5 text-primary">
                              <Smartphone className="h-4.5 w-4.5 animate-bounce" /> Scan using any
                              UPI App
                            </p>
                            <div className="text-xl font-bold font-mono tracking-wider">
                              {formatTime(qrCountdown)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              QR Code expires in 2 minutes
                            </p>
                          </div>

                          {/* Simulation button */}
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              toast.success("UPI App success simulated! Proceeding... ✅");
                              // Complete payment directly
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
                            }}
                            className="bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary"
                          >
                            Simulate UPI App Scan Success
                          </Button>
                        </>
                      ) : (
                        <div className="py-6 flex flex-col items-center space-y-4">
                          <div className="h-16 w-16 rounded-full bg-primary/10 grid place-items-center">
                            <QrCode className="h-8 w-8 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">Generate payment QR Code</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Generate a dynamic secure QR for scan and pay
                            </p>
                          </div>
                          <Button type="button" onClick={handleGenerateQR}>
                            Generate QR
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Booking Summary Sidebar */}
          <aside className="card-premium p-6 h-fit space-y-6">
            <div>
              <h3 className="font-bold text-lg">Booking summary</h3>
              <div className="mt-4 flex gap-3">
                <img
                  src={product.image}
                  alt=""
                  className="h-16 w-16 rounded-xl object-cover border border-border"
                />
                <div className="min-w-0">
                  <div className="font-semibold truncate text-sm">{product.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    ₹{product.price}/day × {days} day(s)
                  </div>
                </div>
              </div>
            </div>

            {/* Calculations */}
            <div className="space-y-3 pt-4 border-t border-border text-sm">
              <div className="flex items-center gap-2">
                <input
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder="Promo code"
                  className="flex-1 h-10 px-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:border-primary"
                />
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={() => {
                    const isValid = coupon.trim().toUpperCase() === "SAVE10";
                    setApplied(isValid);
                    if (isValid) toast.success("10% promo code applied!");
                    else toast.error("Invalid promo code.");
                  }}
                  className="border-border"
                >
                  Apply
                </Button>
              </div>
              {applied && (
                <p className="text-xs text-emerald-600 font-medium">10% discount applied! 🎉</p>
              )}

              <div className="flex justify-between mt-4">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">₹{subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount (10%)</span>
                  <span>-₹{discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax (8%)</span>
                <span className="font-medium">₹{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-border font-bold text-base text-foreground">
                <span>Total</span>
                <span className="text-primary font-extrabold">₹{total.toFixed(2)}</span>
              </div>
            </div>

            <Button size="lg" className="w-full" onClick={handlePay} loading={isProcessing}>
              {isProcessing ? "Processing..." : `Confirm & Pay ₹${total.toFixed(0)}`}
            </Button>

            {/* Secure Payment details */}
            <div className="flex items-center gap-2 justify-center text-[10px] text-muted-foreground mt-4 text-center">
              <Check className="h-3 w-3 text-emerald-500 shrink-0" /> Secure 256-bit SSL encrypted
              payments.
            </div>
          </aside>
        </div>

        {/* Success Modal */}
        <Modal
          open={open}
          onClose={() => {
            setOpen(false);
            navigate({ to: "/orders" });
          }}
          title="Booking Confirmed"
        >
          <div className="text-center py-6">
            <div className="h-16 w-16 mx-auto rounded-full bg-emerald-500/10 grid place-items-center">
              <Check className="h-8 w-8 text-emerald-500" />
            </div>
            <h3 className="mt-4 font-bold text-xl text-foreground">Your rental is booked!</h3>
            <p className="mt-2 text-sm text-muted-foreground px-4">
              We've processed your payment and sent a booking confirmation receipt to your email
              address.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Button
                onClick={() => {
                  setOpen(false);
                  navigate({ to: "/orders" });
                }}
              >
                Go to Orders
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setOpen(false);
                  navigate({ to: "/" });
                }}
              >
                Return Home
              </Button>
            </div>
          </div>
        </Modal>
      </section>
    </MainLayout>
  );
}
