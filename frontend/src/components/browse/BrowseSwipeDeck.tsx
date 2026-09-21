import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Heart,
  RotateCcw,
  Tag,
  ArrowRight,
  Package,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import type { Product } from "@/types";
import { useWishlist } from "@/hooks/useWishlist";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getOptimizedImageUrl, getResponsiveImageSrcSet } from "@/utils/images";
import { api } from "@/utils/api";

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

export function getProductPrimaryImage(product?: Product | null): string {
  if (!product) return "";
  if (product.image && typeof product.image === "string" && product.image.trim()) {
    return product.image.trim();
  }
  if (
    Array.isArray(product.images) &&
    product.images.length > 0 &&
    typeof product.images[0] === "string" &&
    product.images[0].trim()
  ) {
    return product.images[0].trim();
  }
  return "";
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
  const [, setCycleIndex] = useState<number>(0);

  const { has, toggle } = useWishlist();
  const navigate = useNavigate();

  // Reset queue when products array changes (due to filter or search)
  useEffect(() => {
    setQueue(products);
    setCycleIndex(0);
  }, [products]);

  const activeProduct = queue[0] || null;
  const nextProduct = queue[1] || null;
  const thirdProduct = queue[2] || null;

  // Preload next 1-2 product images to guarantee zero flicker / blank card
  useEffect(() => {
    const nextImgUrl = getProductPrimaryImage(nextProduct);
    if (nextImgUrl) {
      const img = new Image();
      img.src = getOptimizedImageUrl(nextImgUrl, "card");
    }
    const thirdImgUrl = getProductPrimaryImage(thirdProduct);
    if (thirdImgUrl) {
      const img = new Image();
      img.src = getOptimizedImageUrl(thirdImgUrl, "card");
    }
  }, [nextProduct, thirdProduct]);

  const isAvailable = useMemo(() => {
    if (!activeProduct) return false;
    return (
      activeProduct.available !== false &&
      activeProduct.availability_status !== "unavailable"
    );
  }, [activeProduct]);

  const [imageErrorMap, setImageErrorMap] = useState<Record<string, boolean>>({});

  const displayImage = activeProduct ? getProductPrimaryImage(activeProduct) : "";

  // Motion values for real-time physics tracking on the active card
  const x = useMotionValue(0);

  // Subtle rotation: 3–6° max proportional to drag distance
  const rotate = useTransform(x, [-320, 320], [-6, 6]);

  // Subtle scale adjustment: 0.985 -> 1 -> 0.985
  const scale = useTransform(x, [-320, 0, 320], [0.985, 1, 0.985]);

  // Active card gentle opacity fade near full swipe boundaries
  const opacity = useTransform(x, [-450, -320, 0, 320, 450], [0.35, 0.9, 1, 0.9, 0.35]);

  // LINKED STACK TRANSITIONS: Background Card 2 rises & scales up in real-time as Card 1 is dragged away
  const nextScale = useTransform(x, [-320, 0, 320], [1, 0.96, 1]);
  const nextY = useTransform(x, [-320, 0, 320], [0, 12, 0]);
  const nextOpacity = useTransform(x, [-320, 0, 320], [1, 0.85, 1]);

  // LINKED STACK TRANSITIONS: Background Card 3 subtly scales up toward Card 2's position
  const thirdScale = useTransform(x, [-320, 0, 320], [0.96, 0.91, 0.96]);
  const thirdY = useTransform(x, [-320, 0, 320], [12, 24, 12]);
  const thirdOpacity = useTransform(x, [-320, 0, 320], [0.85, 0.5, 0.85]);

  // Gesture state tracking refs
  const cardRef = useRef<HTMLDivElement | null>(null);
  const isAnimatingRef = useRef<boolean>(false);
  const pointerDownRef = useRef<boolean>(false);
  const isDraggingRef = useRef<boolean>(false);
  const hasMeaningfulDragRef = useRef<boolean>(false);
  const directionLockRef = useRef<"horizontal" | "vertical" | null>(null);
  const startPosRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });
  const lastPosRef = useRef<{ x: number; time: number }>({ x: 0, time: 0 });
  const velocityRef = useRef<number>(0);
  const [isDraggingVisual, setIsDraggingVisual] = useState<boolean>(false);

  // Execute swipe: smooth exit followed by queue rotation
  const executeSwipe = useCallback(
    (direction: "left" | "right") => {
      if (queue.length === 0 || isAnimatingRef.current) return;
      isAnimatingRef.current = true;
      const targetX = direction === "left" ? -500 : 500;

      animate(x, targetX, {
        duration: 0.22,
        ease: [0.32, 0.72, 0, 1],
      }).then(() => {
        setQueue((prevQueue) => {
          if (prevQueue.length <= 1) return prevQueue;
          const [first, ...rest] = prevQueue;
          return [...rest, first];
        });
        x.set(0);
        setCycleIndex((c) => c + 1);
        isAnimatingRef.current = false;
      });
    },
    [queue.length, x],
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
        executeSwipe("left");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        executeSwipe("right");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [executeSwipe]);

  // REAL-TIME POINTER EVENT HANDLERS
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isAnimatingRef.current) return;
    if (e.button !== 0) return; // Only primary mouse button or touch

    pointerDownRef.current = true;
    isDraggingRef.current = false;
    hasMeaningfulDragRef.current = false;
    directionLockRef.current = null;

    const now = performance.now();
    startPosRef.current = { x: e.clientX, y: e.clientY, time: now };
    lastPosRef.current = { x: e.clientX, time: now };
    velocityRef.current = 0;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerDownRef.current || isAnimatingRef.current) return;

    const dx = e.clientX - startPosRef.current.x;
    const dy = e.clientY - startPosRef.current.y;
    const now = performance.now();
    const dt = Math.max(1, now - lastPosRef.current.time);
    velocityRef.current = (e.clientX - lastPosRef.current.x) / dt;
    lastPosRef.current = { x: e.clientX, time: now };

    // Initial gesture direction lock: ensure vertical scrolling is never blocked
    if (directionLockRef.current === null) {
      if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) {
        // Vertical motion dominant -> cancel card drag, allow native browser page scroll
        directionLockRef.current = "vertical";
        hasMeaningfulDragRef.current = true;
        pointerDownRef.current = false;
        return;
      }
      if (Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy)) {
        // Horizontal motion dominant -> lock to card drag
        directionLockRef.current = "horizontal";
        isDraggingRef.current = true;
        hasMeaningfulDragRef.current = true;
        setIsDraggingVisual(true);
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // Ignored if capture unsupported
        }
      }
    }

    if (directionLockRef.current === "horizontal") {
      hasMeaningfulDragRef.current = true;
      // Direct GPU translation: 1:1 real-time finger/mouse follow
      x.set(dx);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerDownRef.current && !isDraggingRef.current) return;
    pointerDownRef.current = false;
    setIsDraggingVisual(false);

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignored
    }

    if (directionLockRef.current === "horizontal" && isDraggingRef.current) {
      const dx = x.get();
      const cardWidth = cardRef.current?.offsetWidth || 380;
      const distanceThreshold = cardWidth * 0.22; // ~80px
      const velocityThreshold = 0.40; // ~400px/s flick

      const isFlick = Math.abs(velocityRef.current) > velocityThreshold;
      const isLongDrag = Math.abs(dx) > distanceThreshold;
      const sameDirection = isFlick ? (velocityRef.current > 0 ? dx > 0 : dx < 0) : true;

      if ((isLongDrag || isFlick) && sameDirection && dx !== 0) {
        // SUCCESSFUL SWIPE
        const direction = dx > 0 ? "right" : "left";
        executeSwipe(direction);
      } else {
        // FAILED SWIPE: Smooth spring settling back to center
        isAnimatingRef.current = true;
        animate(x, 0, {
          type: "spring",
          stiffness: 420,
          damping: 28,
          mass: 0.8,
        }).then(() => {
          isAnimatingRef.current = false;
        });
      }
    }

    // Reset drag flags after a short delay so onClick doesn't accidentally navigate
    setTimeout(() => {
      isDraggingRef.current = false;
      hasMeaningfulDragRef.current = false;
      directionLockRef.current = null;
    }, 150);
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    pointerDownRef.current = false;
    setIsDraggingVisual(false);

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignored
    }

    if (isDraggingRef.current) {
      isAnimatingRef.current = true;
      animate(x, 0, {
        type: "spring",
        stiffness: 420,
        damping: 28,
        mass: 0.8,
      }).then(() => {
        isAnimatingRef.current = false;
      });
    }

    setTimeout(() => {
      isDraggingRef.current = false;
      hasMeaningfulDragRef.current = false;
      directionLockRef.current = null;
    }, 150);
  };

  // Primary Interaction: Click/Tap on the product card navigates directly to the real product details page
  const handleCardClick = () => {
    if (
      hasMeaningfulDragRef.current ||
      isDraggingRef.current ||
      isAnimatingRef.current ||
      directionLockRef.current !== null
    ) {
      return;
    }
    if (!activeProduct) return;
    api.cacheProduct(activeProduct);
    navigate({
      to: "/product/$id",
      params: { id: activeProduct.id },
    });
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

  return (
    <div
      className={cn(
        "relative w-full flex flex-col items-center justify-center select-none py-2",
        className,
      )}
    >
      {/* Top Deck Header: Queue Counter & Swipe Controls */}
      <div className="w-full max-w-[430px] sm:max-w-[480px] lg:max-w-[500px] flex items-center justify-between mb-3 px-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/5 dark:bg-white/10 text-xs font-mono font-bold text-neutral-800 dark:text-[#E0E5EA] border border-black/5 dark:border-white/10">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              {1} / {queue.length} in queue
            </span>
          </span>
          <span className="hidden sm:inline-block text-[11px] text-neutral-400 dark:text-[#697680]">
            Swipe to browse • Tap card for full details
          </span>
        </div>

        {/* Swipe Left / Right Navigation Buttons (Desktop & Accessibility) */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => executeSwipe("left")}
            aria-label="Swipe to previous product"
            title="Swipe Next Product (Left Arrow)"
            id="browse-swipe-left-btn"
            className="h-9 w-9 rounded-full bg-white dark:bg-[#111A22] border border-black/10 dark:border-white/15 shadow-sm hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center text-neutral-700 dark:text-neutral-200 transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => executeSwipe("right")}
            aria-label="Swipe to next product"
            title="Swipe Next Product (Right Arrow)"
            id="browse-swipe-right-btn"
            className="h-9 w-9 rounded-full bg-white dark:bg-[#111A22] border border-black/10 dark:border-white/15 shadow-sm hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center text-neutral-700 dark:text-neutral-200 transition-colors cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* CARD STACK CONTAINER — IMAGE-FIRST PRESENTATION */}
      <div className="relative w-full max-w-[360px] sm:max-w-[420px] lg:max-w-[460px] min-h-[460px] sm:min-h-[500px] flex items-center justify-center">
        {/* SUBTLE BACKGROUND STACK CARD 3 (THIRD IN QUEUE) */}
        {thirdProduct && (
          <motion.div
            key={thirdProduct.id}
            style={{
              scale: thirdScale,
              y: thirdY,
              opacity: thirdOpacity,
              zIndex: 1,
            }}
            className="absolute inset-x-5 sm:inset-x-6 top-6 bottom-0 rounded-[28px] bg-white/40 dark:bg-[#090F15]/40 border border-black/5 dark:border-white/5 pointer-events-none shadow-sm overflow-hidden will-change-transform"
          >
            <img
              src={getOptimizedImageUrl(
                getProductPrimaryImage(thirdProduct),
                "card",
              )}
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover opacity-50 blur-[1px]"
            />
          </motion.div>
        )}

        {/* SUBTLE BACKGROUND STACK CARD 2 (NEXT CARD IN QUEUE) */}
        {nextProduct && (
          <motion.div
            key={nextProduct.id}
            style={{
              scale: nextScale,
              y: nextY,
              opacity: nextOpacity,
              zIndex: 2,
            }}
            className="absolute inset-x-2.5 sm:inset-x-3 top-3 bottom-0 rounded-[28px] bg-white/80 dark:bg-[#0B121A]/80 border border-black/10 dark:border-white/10 pointer-events-none shadow-md overflow-hidden will-change-transform"
          >
            {getProductPrimaryImage(nextProduct) ? (
              <img
                src={getOptimizedImageUrl(
                  getProductPrimaryImage(nextProduct),
                  "card",
                )}
                alt=""
                aria-hidden="true"
                className="w-full h-full object-cover opacity-70"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-900 text-muted-foreground/40">
                <Package className="h-8 w-8 mb-1 opacity-40" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white/90 text-xs font-bold">
              <span className="truncate">{nextProduct.title}</span>
              <span className="font-mono text-emerald-400">
                ₹{nextProduct.price.toLocaleString("en-IN")}/d
              </span>
            </div>
          </motion.div>
        )}

        {/* PRIMARY ACTIVE IMAGE-FIRST CARD */}
        <motion.div
          ref={cardRef}
          key={activeProduct.id}
          style={{
            x,
            rotate,
            scale,
            opacity,
            zIndex: 10,
            touchAction: "pan-y",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onClick={handleCardClick}
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
          className={cn(
            "group relative w-full aspect-[4/5] sm:aspect-[3/4] rounded-[28px] bg-neutral-900 border border-black/10 dark:border-white/15 shadow-2xl overflow-hidden will-change-transform select-none transition-shadow",
            isDraggingVisual
              ? "cursor-grabbing shadow-3xl"
              : "cursor-grab hover:shadow-3xl",
          )}
        >
          {/* REAL HERO PRODUCT IMAGE (Fills card) */}
          {displayImage && !imageErrorMap[activeProduct.id] ? (
            <img
              key={activeProduct.id}
              src={getOptimizedImageUrl(displayImage, "card")}
              srcSet={
                getResponsiveImageSrcSet(displayImage, [360, 480, 640]) ||
                undefined
              }
              sizes="(max-width: 640px) 90vw, 460px"
              alt={activeProduct.title}
              onError={() => {
                if (activeProduct?.id) {
                  setImageErrorMap((prev) => ({ ...prev, [activeProduct.id]: true }));
                }
              }}
              draggable={false}
              loading="eager"
              decoding="async"
              className="w-full h-full object-cover object-center pointer-events-none group-hover:scale-105 transition-transform duration-500 ease-out"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-900 text-muted-foreground/40 p-6 text-center">
              <Package className="h-16 w-16 mb-2 opacity-40 text-neutral-500" />
              <span className="text-sm font-semibold text-neutral-400">No image available</span>
            </div>
          )}

          {/* Ambient Cinematic Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent pointer-events-none" />

          {/* TOP CONTROLS: Real Availability & Wishlist */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20 pointer-events-auto">
            {/* Availability Badge */}
            <div
              onPointerDownCapture={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              {isAvailable ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 dark:bg-black/75 backdrop-blur-md px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30 shadow-md">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Available</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur-md px-3 py-1 text-xs font-bold text-neutral-300 border border-white/10 shadow-md">
                  <Clock className="h-3 w-3 text-neutral-400" />
                  <span>Not Available</span>
                </span>
              )}
            </div>

            {/* Wishlist Toggle Button */}
            <button
              type="button"
              onPointerDownCapture={(e) => e.stopPropagation()}
              onClick={handleWishlistToggle}
              aria-label="Toggle Wishlist"
              className="h-9 w-9 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-md text-white/90 hover:text-red-500 transition-colors shadow-md border border-white/20 flex items-center justify-center cursor-pointer"
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

          {/* BOTTOM IMAGE OVERLAY: Clean Minimal Header (Discover -> Swipe -> Select) */}
          <div className="absolute bottom-0 inset-x-0 p-5 sm:p-6 space-y-2 pointer-events-none text-left">
            {/* Category & Brand Pill */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-wider border border-white/15">
                <Tag className="h-3 w-3 text-emerald-400" />
                <span>{activeProduct.category}</span>
              </span>
              {brand && (
                <span className="px-2.5 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-white/90 text-[11px] font-bold border border-white/10">
                  {brand}
                </span>
              )}
            </div>

            {/* Product Title */}
            <h2
              id="active-product-card-title"
              className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight drop-shadow-md line-clamp-2"
            >
              {activeProduct.title}
            </h2>

            {/* Price & Swipe/Tap Navigation Cue */}
            <div className="pt-1 flex items-center justify-between text-white">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-white/70 block">
                  Daily Rate
                </span>
                <div className="text-xl sm:text-2xl font-black tracking-tight font-mono leading-none mt-0.5 text-white">
                  ₹{activeProduct.price.toLocaleString("en-IN")}
                  <span className="text-xs font-normal text-white/70 ml-0.5">
                    /day
                  </span>
                </div>
              </div>

              {/* Click / Tap Prompt: DISCOVER -> SWIPE -> SELECT */}
              <div className="flex items-center gap-1.5 text-xs font-bold bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-3.5 py-2 rounded-full border border-white/25 shadow-md">
                <span>Select Gear</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>
        </motion.div>
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
