import { useState, useEffect } from "react";
import {
  Heart,
  MapPin,
  ShieldCheck,
  Tag,
  Star,
  Trash2,
  Clock,
  ShoppingBag,
  Check,
  ArrowRight,
  Package,
} from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import type { Product } from "@/types";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/hooks/useCart";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { storage, STORAGE_KEYS } from "@/utils/storage";
import { api } from "@/utils/api";
import { formatOwnerAddress } from "@/utils/formatters";
import { CSSTiltCard } from "./CSSTiltCard";
import { getOptimizedImageUrl, getResponsiveImageSrcSet } from "@/utils/images";

export interface ProductCardProps {
  product: Product;
  className?: string;
  isDateAvailable?: boolean;
  availabilityReason?: string | null;
  selectedStartDate?: string;
  selectedEndDate?: string;
  isNearby?: boolean;
}

export function ProductCard({
  product,
  className,
  isDateAvailable = true,
  availabilityReason,
  selectedStartDate,
  selectedEndDate,
  isNearby = false,
}: ProductCardProps) {
  const { has, toggle } = useWishlist();
  const liked = has(product.id);
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const primaryImg =
    product.image ||
    (Array.isArray(product.images) && product.images.length > 0
      ? product.images[0]
      : "");

  const [imgSrc, setImgSrc] = useState<string>(primaryImg);
  const [imgFailed, setImgFailed] = useState<boolean>(false);

  useEffect(() => {
    const nextPrimary =
      product.image ||
      (Array.isArray(product.images) && product.images.length > 0
        ? product.images[0]
        : "");
    setImgSrc(nextPrimary);
    setImgFailed(false);
  }, [product.image, product.images]);

  const ownerName = (
    product.owner?.name ||
    (product as Product & { owner_name?: string }).owner_name ||
    ""
  )
    .toLowerCase()
    .trim();
  const ownerEmail = (
    product.owner?.email ||
    (product as Product & { user_email?: string; userEmail?: string })
      .user_email ||
    (product as Product & { user_email?: string; userEmail?: string })
      .userEmail ||
    ""
  )
    .toLowerCase()
    .trim();
  const userFullName = user?.fullName?.toLowerCase().trim();
  const userEmail = user?.email?.toLowerCase().trim();
  const isAdmin =
    user?.role === "admin" || userEmail === "bommidimohan2003@gmail.com";

  const isOwner = Boolean(
    user &&
    !product.isReference &&
    ((ownerEmail && userEmail && ownerEmail === userEmail) ||
      (ownerName && userFullName && ownerName === userFullName) ||
      (ownerName && userEmail && ownerName === userEmail)),
  );

  const canDelete = Boolean(
    user && !product.isReference && (isOwner || isAdmin),
  );

  const location = formatOwnerAddress(product);

  const handlePreload = () => {
    if (product && product.id) {
      api.cacheProduct(product);
      if (imgSrc && typeof window !== "undefined") {
        const img = new Image();
        img.src = imgSrc;
      }
    }
  };

  const handleCardClick = () => {
    handlePreload();
    if (product && product.id) {
      api.cacheProduct(product);
    }
    if (product.isReference) {
      if (!user) {
        toast.error("Please log in to list your gear.");
        navigate({ to: "/login" });
        return;
      }
      navigate({
        to: "/become-lender",
        search: {
          title: product.title,
          category: product.category,
          price: product.price.toString(),
          description:
            product.description ||
            `High-performance ${product.title} available for rent on Payent.`,
        },
      });
      return;
    }
    navigate({ to: `/product/${product.id}` });
  };

  const isAvailable =
    product.available !== false &&
    isDateAvailable &&
    product.availability_status !== "unavailable";

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (product.isReference) {
      handleCardClick();
      return;
    }

    if (!user) {
      toast.info("Please log in to add items to your rental cart.");
      navigate({ to: "/login" });
      return;
    }

    if (!isAvailable) {
      toast.error("This product is currently not available.");
      return;
    }

    setIsAdding(true);
    const success = await addToCart(product.id);
    setIsAdding(false);

    if (success) {
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2500);
    }
  };

  return (
    <CSSTiltCard className={cn("group text-card-foreground p-0.5", className)}>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        onClick={handleCardClick}
        onMouseEnter={handlePreload}
        onPointerDown={handlePreload}
        className="group relative w-full aspect-[4/5] sm:aspect-[3/4] min-h-[360px] sm:min-h-[390px] flex flex-col justify-between rounded-[24px] overflow-hidden bg-neutral-950 border border-black/10 dark:border-white/15 shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer p-4 select-none"
      >
        {/* FULL-BLEED HERO BACKGROUND IMAGE */}
        <div className="absolute inset-0 w-full h-full overflow-hidden bg-neutral-900 pointer-events-none">
          {imgSrc && !imgFailed ? (
            <img
              src={getOptimizedImageUrl(imgSrc, "card")}
              srcSet={getResponsiveImageSrcSet(imgSrc, [320, 480, 640]) || undefined}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
              alt={product.title}
              onError={() => setImgFailed(true)}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-108 pointer-events-none"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/40 p-6 text-center bg-neutral-900">
              <Package className="h-12 w-12 mb-2 opacity-40 text-neutral-500" />
              <span className="text-xs font-semibold text-neutral-400">No image available</span>
            </div>
          )}

          {/* Multi-stop dark gradient overlay so text and badges sit inside the image */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/20 pointer-events-none" />
        </div>

        {/* TOP ROW: Badges & Wishlist / Delete */}
        <div className="relative z-10 flex items-center justify-between gap-2 pointer-events-auto">
          <div className="flex items-center gap-1.5 flex-wrap">
            {product.isReference ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/90 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-extrabold text-black shadow-md">
                <Tag className="h-3 w-3" />
                Category Guide
              </span>
            ) : isAvailable ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30 shadow-md">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Available</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold text-neutral-300 border border-white/10 shadow-md">
                <Clock className="h-3 w-3 text-neutral-400" />
                <span>Not Available</span>
              </span>
            )}

            {/* Rating Badge */}
            <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-white/15 shadow-sm">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span>{product.rating?.toFixed(1) || "5.0"}</span>
            </div>
          </div>

          {/* Top Right: Delete or Wishlist Button */}
          <div className="flex items-center gap-1.5">
            {canDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  const userToken =
                    storage.get<string | null>(STORAGE_KEYS.token, null) ||
                    (user as { token?: string })?.token;

                  if (!userToken) {
                    toast.error("Please log in to delete listings.");
                    return;
                  }

                  api
                    .deleteCustomProduct(userToken, product.id)
                    .then(() => {
                      toast.success("Listing deleted permanently!");
                      window.dispatchEvent(
                        new CustomEvent("payent_products_updated"),
                      );
                    })
                    .catch((err) => {
                      const msg =
                        err instanceof Error
                          ? err.message
                          : "Failed to delete listing";
                      toast.error(msg);
                    });
                }}
                className="h-8 w-8 rounded-full bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 flex items-center justify-center transition-all cursor-pointer shadow-md"
                title="Delete Listing"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}

            {!product.isReference && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  toggle(product.id);
                  toast.success(
                    liked ? "Removed from wishlist" : "Saved to wishlist!",
                  );
                }}
                aria-label="Toggle Wishlist"
                className="h-8 w-8 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-md text-white/90 hover:text-red-500 transition-colors shadow-md border border-white/20 flex items-center justify-center cursor-pointer"
              >
                <Heart
                  className={cn(
                    "h-3.5 w-3.5 transition-all",
                    liked && "fill-red-500 text-red-500 scale-110",
                  )}
                />
              </button>
            )}
          </div>
        </div>

        {/* BOTTOM ROW: Text details sitting directly on the image */}
        <div className="relative z-10 space-y-2 mt-auto text-left pointer-events-auto">
          {/* Category & Location Pill */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider border border-white/15">
              <Tag className="h-2.5 w-2.5 text-emerald-400" />
              <span>{product.category}</span>
            </span>
            {location && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-white/90 text-[10px] font-medium border border-white/10 truncate max-w-[140px]">
                <MapPin className={cn("h-2.5 w-2.5 shrink-0", isNearby ? "text-emerald-400" : "text-primary")} />
                <span className="truncate">{location}</span>
                {isNearby && (
                  <span className="text-[8px] font-extrabold uppercase px-1 py-0.2 rounded bg-emerald-500/30 text-emerald-300 shrink-0">
                    Nearby
                  </span>
                )}
              </span>
            )}
          </div>

          {/* Product Title */}
          <h3 className="font-extrabold text-base sm:text-lg leading-snug line-clamp-1 text-white drop-shadow-md font-display group-hover:text-primary transition-colors">
            {product.title}
          </h3>

          {/* Description */}
          <p className="text-xs text-white/80 line-clamp-1 leading-relaxed">
            {product.description || `High-performance ${product.title} available for instant peer-to-peer rental.`}
          </p>

          {/* Price & Action Button */}
          <div className="pt-2 border-t border-white/15 flex items-center justify-between">
            <div>
              <span className="text-[9px] uppercase font-bold tracking-wider text-white/70 block">
                Daily Rate
              </span>
              <div className="text-lg sm:text-xl font-black tracking-tight font-mono leading-none mt-0.5 text-white">
                ₹{product.price.toLocaleString("en-IN")}
                <span className="text-[11px] font-normal text-white/70 ml-0.5">
                  /day
                </span>
              </div>
            </div>

            {/* Action Button */}
            <div>
              {product.isReference ? (
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/25 rounded-full py-1.5 px-3 text-xs font-bold inline-flex items-center gap-1 shadow-md cursor-pointer transition-all active:scale-95"
                >
                  <span>+ Add Listing</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!isAvailable || isAdding}
                  onClick={handleAddToCart}
                  id={`add-to-cart-${product.id}`}
                  className={cn(
                    "rounded-full py-1.5 px-3 text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-md backdrop-blur-md transition-all text-center",
                    !isAvailable
                      ? "bg-black/50 text-neutral-400 cursor-not-allowed border border-white/10 opacity-75"
                      : justAdded
                        ? "bg-emerald-500 text-white border border-emerald-400 cursor-pointer active:scale-95"
                        : "bg-white/20 hover:bg-white/30 text-white border border-white/25 cursor-pointer active:scale-95",
                  )}
                >
                  {isAdding ? (
                    <span>Adding...</span>
                  ) : justAdded ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Added</span>
                    </>
                  ) : !isAvailable ? (
                    <span>Unavailable</span>
                  ) : (
                    <>
                      <ShoppingBag className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Rent Gear</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </CSSTiltCard>
  );
}
