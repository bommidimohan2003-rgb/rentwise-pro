import React from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ShoppingBag,
  Trash2,
  Calendar,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronRight,
  Truck,
  CheckCircle2,
} from "lucide-react";
import { MainLayout } from "@/layouts/MainLayout";
import { useCart } from "@/hooks/useCart";
import { cn } from "@/lib/utils";
import cameraFallback from "@/assets/images/camera.png";

export default function Cart() {
  const {
    cartItems,
    cartCount,
    subtotal,
    tax,
    total,
    isLoading,
    removeFromCart,
    clearCart,
  } = useCart();
  const navigate = useNavigate();

  const hasUnavailableItems = cartItems.some((item) => !item.is_available);

  const handleCheckout = () => {
    if (cartItems.length > 0) {
      navigate({
        to: "/checkout",
        search: { id: cartItems[0].product_id },
      });
    } else {
      navigate({ to: "/checkout" });
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-neutral-50/50 dark:bg-[#05090D] text-neutral-900 dark:text-white transition-colors py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-xs text-neutral-500 dark:text-[#8D98A3] mb-6">
            <Link to="/" className="hover:text-black dark:hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/browse" className="hover:text-black dark:hover:text-white transition-colors">
              Browse Gear
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-semibold text-neutral-900 dark:text-white">
              Rental Cart
            </span>
          </nav>

          {/* Page Title & Count Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/10 dark:border-white/10 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Your Rental Cart
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-neutral-500 dark:text-[#8D98A3]">
                {cartCount === 0
                  ? "No gear items added yet"
                  : cartCount === 1
                    ? "1 item selected for your rental project"
                    : `${cartCount} items selected for your rental project`}
              </p>
            </div>

            {cartItems.length > 0 && (
              <button
                type="button"
                onClick={() => clearCart()}
                className="self-start sm:self-auto text-xs text-neutral-500 hover:text-red-500 dark:text-[#8D98A3] dark:hover:text-red-400 font-semibold px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-white/10 hover:border-red-500/30 transition-all cursor-pointer"
              >
                Clear Cart
              </button>
            )}
          </div>

          {/* Unavailable Items Warning Banner */}
          {hasUnavailableItems && (
            <div className="mb-8 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-xs sm:text-sm text-red-500 dark:text-red-400">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Booking Date Conflict:</span> One or more items in your cart are already booked for the selected rental duration. Please adjust dates or remove them to proceed to checkout.
              </div>
            </div>
          )}

          {/* Main Grid: Left Items + Right Summary */}
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-neutral-200 dark:border-white/10 bg-white dark:bg-[#0D151D] p-12 sm:p-16 text-center shadow-sm">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100 dark:bg-white/5 text-neutral-400 dark:text-neutral-500 mb-5">
                <ShoppingBag className="h-10 w-10" />
              </div>
              <h2 className="text-lg font-bold tracking-tight">
                Your cart is empty
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-neutral-500 dark:text-[#8D98A3] max-w-sm">
                Explore our curated peer-to-peer catalog of cinema cameras, lenses, drones, laptops, and audio gear.
              </p>
              <Link
                to="/browse"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#161616] text-[#F2F0EA] dark:bg-[#F2F0EA] dark:text-[#161616] px-6 py-2.5 text-xs font-bold shadow-md hover:opacity-90 transition-opacity"
              >
                <span>Browse Gear</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Items List */}
              <div className="lg:col-span-8 space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl border bg-white dark:bg-[#0D151D] shadow-sm transition-all",
                      item.is_available
                        ? "border-neutral-200 dark:border-white/10"
                        : "border-red-500/30 bg-red-500/[0.02] dark:bg-red-500/[0.03]",
                    )}
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      {/* Thumbnail */}
                      <img
                        src={item.image || cameraFallback}
                        alt={item.title}
                        onError={(e) => {
                          e.currentTarget.src = cameraFallback;
                        }}
                        className="h-20 w-20 shrink-0 rounded-xl object-cover border border-neutral-200 dark:border-white/10 bg-neutral-100 dark:bg-neutral-800"
                      />

                      {/* Product Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 dark:text-[#8D98A3]">
                            {item.category}
                          </span>
                          {item.is_available ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-neutral-700 dark:text-neutral-300">
                              <span className="h-1.5 w-1.5 rounded-full bg-neutral-600 dark:bg-neutral-300" />
                              Available
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-500 dark:text-red-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                              {item.conflict_reason || "Booked for dates"}
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white truncate mt-0.5">
                          {item.title}
                        </h3>

                        {/* Dates Row */}
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-neutral-600 dark:text-neutral-300">
                          <div className="flex items-center gap-1 font-mono text-[11px]">
                            <Calendar className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                            <span>{item.start_date} → {item.end_date}</span>
                          </div>
                          <span className="rounded-md bg-neutral-100 dark:bg-white/10 px-1.5 py-0.5 text-[10px] font-bold">
                            {item.days} {item.days === 1 ? "day rental" : "days rental"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Side Price and Delete */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-neutral-100 dark:border-white/5 gap-2">
                      <div className="text-left sm:text-right">
                        <div className="text-base sm:text-lg font-black font-mono">
                          ₹{item.total_price.toLocaleString("en-IN")}
                        </div>
                        <div className="text-[11px] text-neutral-500 dark:text-[#8D98A3]">
                          ₹{(item.daily_price || item.price).toLocaleString("en-IN")}/day
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        aria-label={`Remove ${item.title}`}
                        className="text-neutral-400 hover:text-red-500 dark:text-[#8D98A3] dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Column: Order Summary Card */}
              <div className="lg:col-span-4 sticky top-[100px] space-y-4">
                <div className="rounded-3xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#0D151D] p-6 shadow-sm">
                  <h2 className="text-base font-extrabold tracking-tight pb-4 border-b border-neutral-100 dark:border-white/10">
                    Rental Summary
                  </h2>

                  <div className="mt-4 space-y-2.5 text-xs">
                    <div className="flex justify-between text-neutral-600 dark:text-[#AAB3BC]">
                      <span>Items Subtotal</span>
                      <span className="font-mono font-semibold">₹{subtotal.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-neutral-600 dark:text-[#AAB3BC]">
                      <span>Estimated Tax (8%)</span>
                      <span className="font-mono font-semibold">₹{tax.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-neutral-600 dark:text-[#AAB3BC]">
                      <span>Deposit / Security</span>
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">Covered by Payent Shield</span>
                    </div>

                    <div className="pt-4 border-t border-neutral-200 dark:border-white/10 flex justify-between items-baseline text-sm sm:text-base font-black text-neutral-950 dark:text-white">
                      <span>Total</span>
                      <span className="font-mono text-lg sm:text-xl">₹{total.toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={hasUnavailableItems}
                    onClick={handleCheckout}
                    id="cart-page-checkout-btn"
                    className={cn(
                      "mt-6 w-full flex items-center justify-center gap-2 rounded-full py-3 px-5 text-xs font-bold shadow-md transition-all",
                      hasUnavailableItems
                        ? "bg-neutral-300 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-600 cursor-not-allowed"
                        : "bg-[#161616] text-[#F2F0EA] hover:bg-[#262626] dark:bg-[#F2F0EA] dark:text-[#161616] dark:hover:bg-white cursor-pointer",
                    )}
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  {/* Guarantee points */}
                  <div className="mt-6 pt-6 border-t border-neutral-100 dark:border-white/5 space-y-2.5 text-[11px] text-neutral-500 dark:text-[#8D98A3]">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-neutral-700 dark:text-neutral-300 shrink-0" />
                      <span>Full gear protection & verified damage coverage</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-neutral-700 dark:text-neutral-300 shrink-0" />
                      <span>Local verified handover or insured door-step delivery</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-neutral-700 dark:text-neutral-300 shrink-0" />
                      <span>Instant KYC and government Aadhaar verification</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
