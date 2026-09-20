import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import {
  ShoppingBag,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Star,
  MapPin,
  Clock,
  Heart,
  RotateCcw,
  Check,
  Tag,
  ExternalLink,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import type { Product } from "@/types";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatOwnerAddress } from "@/utils/formatters";
import { getOptimizedImageUrl, getResponsiveImageSrcSet } from "@/utils/images";

import cameraImg from "@/assets/images/camera.webp";
import laptopImg from "@/assets/images/laptop.webp";
import droneImg from "@/assets/images/drone.webp";
import reClassic350Img from "@/assets/images/re_classic350.webp";
import toolImg from "@/assets/images/tool.webp";
import powerbankImg from "@/assets/images/powerbank.webp";

const fallbackMap: Record<string, string> = {
  cameras: cameraImg,
  camera: cameraImg,
  laptops: laptopImg,
  laptop: laptopImg,
  drones: droneImg,
  drone: droneImg,
  bikes: reClassic350Img,
  "bikes & rides": reClassic350Img,
  tools: toolImg,
  "electronic drilling tools": toolImg,
  powerbanks: powerbankImg,
  "power banks": powerbankImg,
};

const KNOWN_BRANDS = [
  "Sony",
  "DJI",
  "Apple",
  "Canon",
  "Nikon",
  "Fujifilm",
  "Blackmagic",
  "RED",
  "RODE",
  "Sennheiser",
  "Shure",
  "Aputure",
  "Godox",
  "GoPro",
  "Royal Enfield",
];

function getProductBrand(product: Product): string | null {
  if ((product as unknown as { brand?: string }).brand) {
    return (product as unknown as { brand: string }).brand;
  }
  const text = `${product.title} ${product.description || ""}`.toLowerCase();
  for (const b of KNOWN_BRANDS) {
    if (text.includes(b.toLowerCase())) {
      return b;
    }
  }
  return null;
}

export interface BrowseSwipeDeckProps {
  products: Product[];
  className?: string;
  onResetFilters?: () => void;
}

export function BrowseSwipeDeck({
  products,
  className,
  onResetFilters,
}: BrowseSwipeDeckProps) {
  const [queue, setQueue] = useState<Product[]>(() => products);
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(null);
  const [cycleIndex, setCycleIndex] = useState<number>(0);
  const [isAddingToCart, setIsAddingToCart] = useState<boolean>(false);
  const [justAddedToCart, setJustAddedToCart] = useState<boolean>(false);
  const isDraggingRef = useRef<boolean>(false);

  const { addToCart } = useCart();
  const { has, toggle } = useWishlist();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Reset queue when products array changes (due to filter or search)
  useEffect(() => {
    setQueue(products);
    setCycleIndex(0);
  }, [products]);

  const activeProduct = queue[0] || null;
  const nextProduct = queue[1] || null;
  const thirdProduct = queue[2] || null;

  const isAvailable = useMemo(() => {
    if (!activeProduct) return false;
    return (
      activeProduct.available !== false &&
      activeProduct.availability_status !== "unavailable"
    );
  }, [activeProduct]);

  const activeCatKey = (activeProduct?.category || "").toLowerCase().trim();
  const activeFallback = fallbackMap[activeCatKey] || cameraImg;
  const [activeImgSrc, setActiveImgSrc] = useState<string>(
    activeProduct?.image || activeFallback,
  );

  useEffect(() => {
    if (activeProduct) {
      setActiveImgSrc(activeProduct.image || activeFallback);
    }
  }, [activeProduct, activeFallback]);

  // Motion values for interactive drag physics on primary card
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-250, 250], [-14, 14]);
  const opacity = useTransform(x, [-300, -200, 0, 200, 300], [0.4, 0.9, 1, 0.9, 0.4]);

  const handleSwipe = useCallback(
    (direction: "left" | "right") => {
      if (queue.length === 0 || exitDirection !== null) return;

      setExitDirection(direction);

      // Perform queue rotation after exit animation completes
      setTimeout(() => {
        setQueue((prevQueue) => {
          if (prevQueue.length <= 1) return prevQueue;
          const [first, ...rest] = prevQueue;
          return [...rest, first];
        });
        setExitDirection(null);
        setCycleIndex((c) => c + 1);
        x.set(0);
      }, 200);
    },
    [queue.length, exitDirection, x],
  );

  // Keyboard navigation for desktop users
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleSwipe("left");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleSwipe("right");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSwipe]);

  const handleDragStart = () => {
    isDraggingRef.current = true;
  };

  const handleDragEnd = (
    _: unknown,
    info: { offset: { x: number; y: number }; velocity: { x: number; y: number } },
  ) => {
    const SWIPE_DISTANCE_THRESHOLD = 60;
    const SWIPE_VELOCITY_THRESHOLD = 300;

    if (
      info.offset.x > SWIPE_DISTANCE_THRESHOLD ||
      info.velocity.x > SWIPE_VELOCITY_THRESHOLD
    ) {
      handleSwipe("right");
    } else if (
      info.offset.x < -SWIPE_DISTANCE_THRESHOLD ||
      info.velocity.x < -SWIPE_VELOCITY_THRESHOLD
    ) {
      handleSwipe("left");
    }

    // Small delay before clearing isDragging to prevent tap navigation on drag release
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 120);
  };

  // Primary Interaction: Click/Tap on the product card opens the new page showing all details
  const handleCardClick = () => {
    if (isDraggingRef.current) return;
    if (!activeProduct) return;
    navigate({
      to: "/product/$id",
      params: { id: activeProduct.id },
    });
  };

  // Add to Cart with real backend confirmation and cart drawer open
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!activeProduct) return;

    if (!user) {
      toast.info("Please log in to add items to your rental cart.");
      navigate({ to: "/login" });
      return;
    }

    if (!isAvailable) {
      toast.error("This product is currently not available for rental.");
      return;
    }

    setIsAddingToCart(true);
    const success = await addToCart(activeProduct.id);
    setIsAddingToCart(false);

    if (success) {
      setJustAddedToCart(true);
      setTimeout(() => setJustAddedToCart(false), 2400);
    }
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!activeProduct) return;
    toggle(activeProduct.id);
    toast.success(
      has(activeProduct.id) ? "Removed from wishlist" : "Saved to wishlist!",
    );
  };

  // If no products match the filters/search
  if (!activeProduct || queue.length === 0) {
    return (
      <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-black/10 dark:border-white/10 bg-black/[0.01] dark:bg-white/[0.01] max-w-xl mx-auto">
        <div className="h-12 w-12 rounded-2xl bg-neutral-100 dark:bg-white/5 mx-auto grid place-items-center text-neutral-400 mb-3">
          <Clock className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-neutral-900 dark:text-white">
          No gear in current swipe queue
        </h3>
        <p className="text-xs text-neutral-500 dark:text-[#8D98A3] mt-1 max-w-sm mx-auto">
          Try adjusting your price range, selected brand, or search keywords to populate available gear.
        </p>
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-4 px-5 py-2 rounded-full bg-[#161616] text-white dark:bg-[#F2F0EA] dark:text-[#161616] text-xs font-bold shadow-sm hover:opacity-90 cursor-pointer"
          >
            Reset All Filters
          </button>
        )}
      </div>
    );
  }

  const brand = getProductBrand(activeProduct);
  const location =
    activeProduct.location || formatOwnerAddress(activeProduct) || null;

  return (
    <div
      className={cn(
        "relative w-full flex flex-col items-center justify-center select-none py-2",
        className,
      )}
    >
      {/* Top Deck Header: Queue Counter & Swipe Controls */}
      <div className="w-full max-w-[430px] sm:max-w-[480px] lg:max-w-[500px] flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/5 dark:bg-white/10 text-xs font-mono font-bold text-neutral-800 dark:text-[#E0E5EA] border border-black/5 dark:border-white/10">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              {1} / {queue.length} in queue
            </span>
          </span>
          <span className="hidden sm:inline-block text-[11px] text-neutral-400 dark:text-[#697680]">
            Swipe to browse • Tap card for all details
          </span>
        </div>

        {/* Swipe Left / Right Navigation Buttons (Desktop & Accessibility) */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleSwipe("left")}
            aria-label="Swipe to previous product"
            title="Swipe Next Product (Left Arrow)"
            id="browse-swipe-left-btn"
            className="h-9 w-9 rounded-full bg-white dark:bg-[#111A22] border border-black/10 dark:border-white/15 shadow-sm hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center text-neutral-700 dark:text-neutral-200 transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleSwipe("right")}
            aria-label="Swipe to next product"
            title="Swipe Next Product (Right Arrow)"
            id="browse-swipe-right-btn"
            className="h-9 w-9 rounded-full bg-white dark:bg-[#111A22] border border-black/10 dark:border-white/15 shadow-sm hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center text-neutral-700 dark:text-neutral-200 transition-colors cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* CARD STACK CONTAINER */}
      <div className="relative w-full max-w-[360px] sm:max-w-[420px] lg:max-w-[460px] min-h-[500px] flex items-center justify-center">
        {/* SUBTLE BACKGROUND STACK CARD 3 */}
        {thirdProduct && (
          <div
            className="absolute inset-x-5 sm:inset-x-6 top-6 bottom-0 rounded-[28px] bg-white/40 dark:bg-[#090F15]/40 border border-black/5 dark:border-white/5 pointer-events-none transition-all duration-300 shadow-sm overflow-hidden"
            style={{
              transform: "translateY(24px) scale(0.90)",
              opacity: 0.5,
              zIndex: 1,
            }}
          >
            <img
              src={getOptimizedImageUrl(
                thirdProduct.image ||
                  fallbackMap[(thirdProduct.category || "").toLowerCase()] ||
                  cameraImg,
                "card",
              )}
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover opacity-50 blur-[1px]"
            />
          </div>
        )}

        {/* SUBTLE BACKGROUND STACK CARD 2 (NEXT CARD) */}
        {nextProduct && (
          <div
            className="absolute inset-x-2.5 sm:inset-x-3 top-3 bottom-0 rounded-[28px] bg-white/80 dark:bg-[#0B121A]/80 border border-black/10 dark:border-white/10 pointer-events-none transition-all duration-300 shadow-md overflow-hidden"
            style={{
              transform: "translateY(12px) scale(0.95)",
              opacity: 0.85,
              zIndex: 2,
            }}
          >
            <img
              src={getOptimizedImageUrl(
                nextProduct.image ||
                  fallbackMap[(nextProduct.category || "").toLowerCase()] ||
                  cameraImg,
                "card",
              )}
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover opacity-70"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white/80 text-xs font-bold">
              <span className="truncate">{nextProduct.title}</span>
              <span className="font-mono text-emerald-400">
                ₹{nextProduct.price.toLocaleString("en-IN")}/d
              </span>
            </div>
          </div>
        )}

        {/* PRIMARY ACTIVE CARD */}
        <AnimatePresence mode="popLayout">
          <motion.div
            key={`${activeProduct.id}-${cycleIndex}`}
            style={{
              x,
              rotate,
              opacity,
              zIndex: 10,
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.8}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onTap={handleCardClick}
            onClick={handleCardClick}
            initial={{
              scale: 0.94,
              opacity: 0,
              y: 16,
            }}
            animate={{
              scale: 1,
              opacity: 1,
              y: 0,
              transition: {
                type: "spring",
                damping: 24,
                stiffness: 280,
              },
            }}
            exit={{
              x: exitDirection === "left" ? -450 : 450,
              rotate: exitDirection === "left" ? -20 : 20,
              opacity: 0,
              transition: { duration: 0.22, ease: "easeOut" },
            }}
            layout
            id="browse-primary-active-card"
            role="button"
            tabIndex={0}
            aria-label={`View ${activeProduct.title} details`}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleCardClick();
              }
            }}
            className="group relative w-full rounded-[28px] bg-white dark:bg-[#0D151D] border border-black/10 dark:border-white/15 shadow-2xl overflow-hidden cursor-pointer active:cursor-grabbing transition-all hover:shadow-3xl"
          >
            {/* 1. MEDIA CONTAINER (HERO IMAGE) */}
            <div className="relative w-full aspect-[4/3] bg-neutral-900 overflow-hidden">
              <img
                src={getOptimizedImageUrl(activeImgSrc, "card")}
                srcSet={
                  getResponsiveImageSrcSet(activeImgSrc, [360, 480, 640]) ||
                  undefined
                }
                sizes="(max-width: 640px) 90vw, 460px"
                alt={activeProduct.title}
                onError={() => setActiveImgSrc(activeFallback)}
                draggable={false}
                loading="eager"
                decoding="async"
                className="w-full h-full object-cover object-center pointer-events-none group-hover:scale-105 transition-transform duration-500 ease-out"
              />

              {/* Ambient Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />

              {/* Top Floating Controls: Availability Badge & Wishlist Button */}
              <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-20 pointer-events-auto">
                {/* Availability Badge */}
                <div
                  onPointerDownCapture={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  {isAvailable ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 dark:bg-black/75 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-emerald-400 border border-emerald-500/30 shadow-md">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Available</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-neutral-300 border border-white/10 shadow-md">
                      <Clock className="h-3 w-3 text-neutral-400" />
                      <span>Not Available</span>
                    </span>
                  )}
                </div>

                {/* Right Action: Wishlist Toggle Button */}
                <button
                  type="button"
                  onPointerDownCapture={(e) => e.stopPropagation()}
                  onClick={handleWishlistToggle}
                  aria-label="Toggle Wishlist"
                  className="h-8 w-8 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-md text-white/90 hover:text-red-500 transition-colors shadow-md border border-white/20 flex items-center justify-center cursor-pointer"
                >
                  <Heart
                    className={cn(
                      "h-4 w-4 transition-all",
                      has(activeProduct.id) &&
                        "fill-red-500 text-red-500 scale-110",
                    )}
                  />
                </button>
              </div>

              {/* Image Footer Cue (Hover/Tap indication) */}
              <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between text-white/90 text-[11px] font-semibold pointer-events-none">
                <span className="px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-md border border-white/10 uppercase tracking-wider text-[10px] text-emerald-400 font-bold">
                  {activeProduct.category}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-white/80 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10">
                  <span>Swipe</span>
                  <ChevronRight className="h-3 w-3 text-white/70" />
                </span>
              </div>
            </div>

            {/* 2. CARD BODY & REAL DETAILS SUMMARY */}
            <div className="p-4 sm:p-5 space-y-3.5 bg-white dark:bg-[#0D151D] text-left">
              {/* Brand & Category strip */}
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1 font-bold text-neutral-500 dark:text-neutral-400">
                  <Tag className="h-3 w-3 text-emerald-500" />
                  <span>{activeProduct.category}</span>
                </span>
                {brand && (
                  <span className="px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/10 font-bold text-neutral-800 dark:text-[#E0E5EA] text-[11px]">
                    {brand}
                  </span>
                )}
              </div>

              {/* Product Title */}
              <div>
                <h2
                  id="active-product-card-title"
                  className="text-base sm:text-lg font-black tracking-tight text-neutral-950 dark:text-white leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1"
                >
                  {activeProduct.title}
                </h2>
                {activeProduct.description && (
                  <p className="mt-1 text-xs text-neutral-600 dark:text-[#8D98A3] line-clamp-2 leading-relaxed font-normal">
                    {activeProduct.description}
                  </p>
                )}
              </div>

              {/* Metadata Row: Rating & Location */}
              <div className="flex items-center gap-3 text-xs text-neutral-600 dark:text-neutral-300">
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  <span className="font-bold text-neutral-900 dark:text-white">
                    {activeProduct.rating?.toFixed(1) || "5.0"}
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    ({activeProduct.reviews || 0})
                  </span>
                </div>
                {location && (
                  <div className="flex items-center gap-1 truncate text-[11px]">
                    <MapPin className="h-3 w-3 text-emerald-500 shrink-0" />
                    <span className="truncate">{location}</span>
                  </div>
                )}
              </div>

              {/* Price Banner & Add to Cart Action */}
              <div className="pt-2 border-t border-black/5 dark:border-white/10 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block">
                    Daily Rate
                  </span>
                  <div className="text-lg font-black tracking-tight text-neutral-950 dark:text-white font-mono leading-none mt-0.5">
                    ₹{activeProduct.price.toLocaleString("en-IN")}
                    <span className="text-xs font-normal text-neutral-500 ml-0.5">
                      /day
                    </span>
                  </div>
                </div>

                {/* ADD TO CART BUTTON (Stops propagation so user can add without navigating) */}
                <button
                  type="button"
                  disabled={!isAvailable || isAddingToCart}
                  onPointerDownCapture={(e) => e.stopPropagation()}
                  onClick={handleAddToCart}
                  id={`browse-add-to-cart-${activeProduct.id}`}
                  className={cn(
                    "h-10 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer shrink-0",
                    !isAvailable
                      ? "bg-neutral-200 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500 cursor-not-allowed border border-neutral-300/40 dark:border-white/5 opacity-80"
                      : justAddedToCart
                        ? "bg-emerald-600 text-white active:scale-98"
                        : "bg-[#161616] text-[#FFFFFF] hover:bg-[#292929] active:bg-[#0B0B0B] dark:bg-[#F2F0EA] dark:text-[#0A0A0A] dark:hover:bg-[#FFFFFF] dark:active:bg-[#DCD9D1] active:scale-98",
                  )}
                >
                  {isAddingToCart ? (
                    <span>Adding...</span>
                  ) : justAddedToCart ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Added to Cart</span>
                    </>
                  ) : !isAvailable ? (
                    <span>Unavailable</span>
                  ) : (
                    <>
                      <ShoppingBag className="h-3.5 w-3.5" />
                      <span>Add to Cart</span>
                    </>
                  )}
                </button>
              </div>

              {/* Tap Card Navigation Prompt */}
              <div className="pt-1 flex items-center justify-center gap-1 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                <span>Click card to view all details & specs</span>
                <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Queue Indicators & Reset Action */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <div className="flex items-center gap-1.5">
          {queue.slice(0, Math.min(queue.length, 6)).map((p, idx) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setQueue((prev) => {
                  const targetIdx = prev.findIndex((item) => item.id === p.id);
                  if (targetIdx <= 0) return prev;
                  return [
                    prev[targetIdx],
                    ...prev.slice(0, targetIdx),
                    ...prev.slice(targetIdx + 1),
                  ];
                });
              }}
              title={p.title}
              className={cn(
                "h-2 rounded-full transition-all cursor-pointer",
                idx === 0
                  ? "w-6 bg-[#161616] dark:bg-[#F2F0EA]"
                  : "w-2 bg-black/20 dark:bg-white/20 hover:bg-black/40 dark:hover:bg-white/40",
              )}
            />
          ))}
          {queue.length > 6 && (
            <span className="text-[10px] font-mono text-neutral-400">
              +{queue.length - 6}
            </span>
          )}
        </div>

        {queue.length > 1 && (
          <button
            type="button"
            onClick={() => {
              setQueue(products);
              toast.info("Queue reset to initial order");
            }}
            title="Reset queue order"
            className="ml-3 text-[11px] text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}
