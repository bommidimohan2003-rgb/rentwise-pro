import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ShoppingBag,
  Trash2,
  Calendar,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useCart } from "@/hooks/useCart";
import { cn } from "@/lib/utils";
import cameraFallback from "@/assets/images/camera.png";

export function CartDrawer() {
  const {
    isCartOpen,
    closeCart,
    cartItems,
    cartCount,
    subtotal,
    tax,
    total,
    removeFromCart,
    clearCart,
  } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    closeCart();
    if (cartItems.length > 0) {
      navigate({
        to: "/checkout",
        search: { id: cartItems[0].product_id },
      });
    } else {
      navigate({ to: "/checkout" });
    }
  };

  const handleViewCartPage = () => {
    closeCart();
    navigate({ to: "/cart" });
  };

  const hasUnavailableItems = cartItems.some((item) => !item.is_available);

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeCart}
            aria-hidden="true"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Slide-out Drawer Container */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            role="dialog"
            aria-modal="true"
            aria-label="Rental Cart"
            id="cart-drawer-panel"
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white dark:bg-[#0A1017] border-l border-neutral-200 dark:border-white/10 shadow-2xl text-neutral-900 dark:text-white"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-white/10 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 dark:bg-white/10 text-neutral-900 dark:text-white">
                  <ShoppingBag className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-semibold tracking-tight">
                    Rental Cart
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {cartCount === 1 ? "1 gear item" : `${cartCount} gear items`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {cartItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => clearCart()}
                    className="text-xs text-neutral-500 hover:text-red-500 dark:text-neutral-400 dark:hover:text-red-400 px-2 py-1 rounded transition-colors"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeCart}
                  aria-label="Close cart"
                  id="close-cart-drawer-btn"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Unavailable Items Alert Banner */}
            {hasUnavailableItems && (
              <div className="mx-4 mt-3 flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-500 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  Some items in your cart are already booked for the selected dates. Please adjust dates or remove them to proceed.
                </span>
              </div>
            )}

            {/* Cart Items Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6 space-y-4">
              {cartItems.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-white/5 text-neutral-400 dark:text-neutral-500 mb-4">
                    <ShoppingBag className="h-8 w-8" />
                  </div>
                  <h3 className="text-sm font-semibold tracking-tight">
                    Your rental cart is empty
                  </h3>
                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 max-w-[220px]">
                    Find the professional cameras, drones, or gear for your next project.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      closeCart();
                      navigate({ to: "/browse" });
                    }}
                    className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-[#161616] text-[#F2F0EA] dark:bg-[#F2F0EA] dark:text-[#161616] px-5 py-2 text-xs font-semibold shadow-sm hover:opacity-90 transition-opacity"
                  >
                    <span>Explore Gear</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex flex-col gap-3 rounded-xl border p-3.5 transition-all bg-neutral-50/50 dark:bg-white/[0.03]",
                      item.is_available
                        ? "border-neutral-200 dark:border-white/10"
                        : "border-red-500/30 bg-red-500/[0.02] dark:bg-red-500/[0.04]",
                    )}
                  >
                    <div className="flex gap-3">
                      {/* Product Thumbnail */}
                      <img
                        src={item.image || cameraFallback}
                        alt={item.title}
                        onError={(e) => {
                          e.currentTarget.src = cameraFallback;
                        }}
                        className="h-16 w-16 shrink-0 rounded-lg object-cover border border-neutral-200 dark:border-white/10 bg-neutral-100 dark:bg-neutral-800"
                      />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="text-xs font-semibold truncate leading-tight">
                            {item.title}
                          </h4>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            aria-label={`Remove ${item.title} from cart`}
                            className="text-neutral-400 hover:text-red-500 dark:text-neutral-500 dark:hover:text-red-400 p-0.5 rounded transition-colors shrink-0"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 capitalize mt-0.5">
                          {item.category} • {item.city || "Available locally"}
                        </p>

                        {/* Date Range & Duration */}
                        <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-neutral-600 dark:text-neutral-300">
                          <Calendar className="h-3 w-3 text-neutral-400 shrink-0" />
                          <span className="font-mono">{item.start_date} → {item.end_date}</span>
                          <span className="rounded bg-neutral-200/70 dark:bg-white/10 px-1 py-0.2 font-medium">
                            {item.days} {item.days === 1 ? "day" : "days"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom row: Availability indicator & price */}
                    <div className="flex items-center justify-between pt-2 border-t border-neutral-200/60 dark:border-white/5">
                      {item.is_available ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-neutral-700 dark:text-neutral-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-neutral-600 dark:bg-neutral-300" />
                          Available for dates
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-red-500 dark:text-red-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                          {item.conflict_reason || "Conflict for dates"}
                        </span>
                      )}

                      <div className="text-right">
                        <div className="text-xs font-bold font-mono">
                          ₹{item.total_price.toLocaleString("en-IN")}
                        </div>
                        <div className="text-[9px] text-neutral-500 dark:text-neutral-400">
                          ₹{(item.daily_price || item.price).toLocaleString("en-IN")}/day
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Drawer Footer & Actions */}
            {cartItems.length > 0 && (
              <div className="border-t border-neutral-200 dark:border-white/10 bg-neutral-50/80 dark:bg-[#070B10] p-5 sm:p-6 space-y-3">
                {/* Summary Rows */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                    <span>Subtotal</span>
                    <span className="font-mono">₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                    <span>Estimated Tax (8%)</span>
                    <span className="font-mono">₹{tax.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-neutral-200 dark:border-white/10 text-sm font-bold text-neutral-900 dark:text-white">
                    <span>Total Rental</span>
                    <span className="font-mono">₹{total.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {/* Checkout CTA */}
                <button
                  type="button"
                  disabled={hasUnavailableItems}
                  onClick={handleCheckout}
                  id="cart-drawer-checkout-btn"
                  className={cn(
                    "w-full flex items-center justify-center gap-2 rounded-full py-2.5 px-4 text-xs font-bold shadow-md transition-all",
                    hasUnavailableItems
                      ? "bg-neutral-300 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-600 cursor-not-allowed"
                      : "bg-[#161616] text-[#F2F0EA] hover:bg-[#262626] dark:bg-[#F2F0EA] dark:text-[#161616] dark:hover:bg-white cursor-pointer",
                  )}
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>

                {/* Secondary Actions */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={handleViewCartPage}
                    id="cart-drawer-view-page-btn"
                    className="text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white underline underline-offset-4 cursor-pointer"
                  >
                    View Detailed Cart Page
                  </button>
                  <button
                    type="button"
                    onClick={closeCart}
                    className="text-neutral-500 dark:text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300 cursor-pointer"
                  >
                    Continue Browsing
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
