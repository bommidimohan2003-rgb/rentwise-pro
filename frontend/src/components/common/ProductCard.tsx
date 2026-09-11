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

import cameraImg from "@/assets/images/camera.png";
import laptopImg from "@/assets/images/laptop.png";
import droneImg from "@/assets/images/drone.png";
import bikeImg from "@/assets/images/bike.png";
import toolImg from "@/assets/images/tool.png";
import powerbankImg from "@/assets/images/powerbank.png";
import reClassic350Img from "@/assets/images/re_classic350.png";

const fallbackMap: Record<string, string> = {
  cameras: cameraImg,
  laptops: laptopImg,
  drones: droneImg,
  bikes: reClassic350Img,
  "bikes & rides": reClassic350Img,
  tools: toolImg,
  "electronic drilling tools": toolImg,
  powerbanks: powerbankImg,
  "power banks": powerbankImg,
};

export interface ProductCardProps {
  product: Product;
  className?: string;
  isDateAvailable?: boolean;
  availabilityReason?: string | null;
  selectedStartDate?: string;
  selectedEndDate?: string;
}

export function ProductCard({
  product,
  className,
  isDateAvailable = true,
  availabilityReason,
  selectedStartDate,
  selectedEndDate,
}: ProductCardProps) {
  const { has, toggle } = useWishlist();
  const liked = has(product.id);
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const catKey = (product.category || "").toLowerCase().trim();
  const fallbackImg = fallbackMap[catKey] || cameraImg;

  const [imgSrc, setImgSrc] = useState<string>(product.image || fallbackImg);

  useEffect(() => {
    setImgSrc(product.image || fallbackImg);
  }, [product.image, fallbackImg]);

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
    if (product) {
      api.cacheProduct(product);
      if (imgSrc && typeof window !== "undefined") {
        const img = new Image();
        img.src = imgSrc;
      }
    }
  };

  const handleCardClick = () => {
    handlePreload();
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
    navigate({ to: "/product/$id", params: { id: product.id } });
  };

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

    if (!isDateAvailable) {
      toast.error("This gear is not available for the selected rental dates.");
      return;
    }

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(threeDaysLater.getDate() + 4);

    const start = selectedStartDate || tomorrow.toISOString().split("T")[0];
    const end = selectedEndDate || threeDaysLater.toISOString().split("T")[0];

    setIsAdding(true);
    const success = await addToCart(product.id, start, end);
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
        className="w-full flex flex-col justify-between overflow-hidden rounded-[22px] bg-card border border-border/60 hover:border-primary/40 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer h-full"
      >
        {/* Card Header & Media */}
        <div className="relative aspect-[16/11] sm:aspect-[4/3] w-full overflow-hidden bg-secondary/60 p-0 flex items-center justify-center border-b border-border/40">
          <img
            src={imgSrc}
            alt={product.title}
            onError={() => setImgSrc(fallbackImg)}
            loading="eager"
            className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-108"
          />

          {/* Ambient Image Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent pointer-events-none opacity-85 group-hover:opacity-95 transition-opacity" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
            {product.isReference ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/90 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-extrabold text-black shadow-md">
                <Tag className="h-3 w-3" />
                Category Guide
              </span>
            ) : isDateAvailable ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-black/70 dark:bg-white/10 text-white backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold border border-white/20 shadow-md">
                <ShieldCheck className="h-3 w-3 text-neutral-300" />
                Verified Gear
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 text-red-400 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold border border-red-500/30 shadow-md">
                <Clock className="h-3 w-3 text-red-400" />
                Booked for Dates
              </span>
            )}
          </div>

          {/* Wishlist Button */}
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
              className="absolute top-3 right-3 z-10 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md p-2 text-white/90 hover:text-red-500 transition-colors shadow-md border border-white/20"
            >
              <Heart
                className={cn(
                  "h-4 w-4 transition-all",
                  liked && "fill-red-500 text-red-500 scale-110",
                )}
              />
            </button>
          )}

          {/* Bottom Overlay Location & Rating Bar */}
          <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[11px] font-semibold text-white/90 bg-black/60 backdrop-blur-md rounded-xl px-2.5 py-1 border border-white/10 shadow-sm z-10">
            <span className="inline-flex items-center gap-1 truncate max-w-[70%]">
              <MapPin className="h-3 w-3 text-neutral-300 shrink-0" />
              <span className="truncate">{location}</span>
            </span>
            <span className="inline-flex items-center gap-0.5 text-amber-400 font-black shrink-0">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {product.rating?.toFixed(1) || "5.0"}
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 flex flex-col justify-between flex-1 space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-wider uppercase text-neutral-500 dark:text-neutral-400">
                {product.category}
              </span>
              {/* Date Availability Indicator */}
              {!product.isReference && (
                <span
                  className={cn(
                    "text-[10px] font-semibold flex items-center gap-1",
                    isDateAvailable
                      ? "text-neutral-700 dark:text-neutral-300"
                      : "text-red-500 dark:text-red-400",
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      isDateAvailable ? "bg-neutral-600 dark:bg-neutral-300" : "bg-red-500",
                    )}
                  />
                  {isDateAvailable ? "Available" : "Unavailable"}
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold tracking-tight text-foreground line-clamp-1 group-hover:text-primary transition-colors mt-0.5">
              {product.title}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {product.description ||
                `High performance ${product.title} available for instant peer-to-peer rental.`}
            </p>
          </div>

          {/* Pricing and Action Buttons */}
          <div className="pt-2.5 border-t border-border/40 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">
                Day Rate
              </span>
              <div className="text-base font-black tracking-tight text-foreground font-mono">
                ₹{product.price.toLocaleString("en-IN")}
                <span className="text-xs font-normal text-muted-foreground ml-0.5">
                  /day
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              {product.isReference ? (
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="w-full bg-[#161616] text-[#F2F0EA] hover:bg-[#262626] dark:bg-[#F2F0EA] dark:text-[#161616] dark:hover:bg-white rounded-xl py-2 px-3 text-xs font-bold inline-flex items-center justify-center shadow-sm active:scale-95 transition-all text-center cursor-pointer"
                >
                  + Add Listing
                </button>
              ) : canDelete ? (
                <div className="flex items-center gap-1.5 w-full">
                  <Link
                    to="/product/$id"
                    params={{ id: product.id }}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 border border-neutral-300 dark:border-white/20 text-neutral-800 dark:text-neutral-200 bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 rounded-xl h-8 text-[11px] font-bold inline-flex items-center justify-center transition-all truncate px-1"
                  >
                    {isAdmin && !isOwner ? "Admin Manage" : "Your Listing"}
                  </Link>
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
                    className="h-8 w-8 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 flex items-center justify-center transition-all cursor-pointer shrink-0"
                    title="Delete Listing"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 w-full">
                  {/* Secondary: Details */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      navigate({
                        to: "/product/$id",
                        params: { id: product.id },
                      });
                    }}
                    className="flex-1 bg-white hover:bg-neutral-100 text-[#171717] border border-[#D6D6D6] dark:bg-transparent dark:text-[#F3F3F3] dark:border-white/25 dark:hover:bg-white/10 rounded-xl py-2 px-2 text-xs font-semibold inline-flex items-center justify-center transition-all cursor-pointer truncate"
                  >
                    Details
                  </button>

                  {/* Primary: Add to Cart */}
                  <button
                    type="button"
                    disabled={!isDateAvailable || isAdding}
                    onClick={handleAddToCart}
                    id={`add-to-cart-${product.id}`}
                    className={cn(
                      "flex-[1.4] rounded-xl py-2 px-3 text-xs font-bold inline-flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all text-center cursor-pointer",
                      !isDateAvailable
                        ? "bg-neutral-200 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500 cursor-not-allowed border border-neutral-300/40 dark:border-white/5"
                        : justAdded
                          ? "bg-neutral-900 text-white dark:bg-white dark:text-black"
                          : "bg-[#161616] text-[#F2F0EA] hover:bg-[#262626] dark:bg-[#F2F0EA] dark:text-[#161616] dark:hover:bg-white",
                    )}
                  >
                    {isAdding ? (
                      <span>Adding...</span>
                    ) : justAdded ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Added</span>
                      </>
                    ) : !isDateAvailable ? (
                      <span>Unavailable</span>
                    ) : (
                      <>
                        <ShoppingBag className="h-3.5 w-3.5" />
                        <span>Add to Cart</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </CSSTiltCard>
  );
}
