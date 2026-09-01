import { useState, useEffect } from "react";
import {
  Heart,
  MapPin,
  ShieldCheck,
  Tag,
  Star,
  Trash2,
  Clock,
} from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import type { Product } from "@/types";
import { useWishlist } from "@/hooks/useWishlist";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { storage, STORAGE_KEYS } from "@/utils/storage";
import { api } from "@/utils/api";
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

export function ProductCard({
  product,
  className,
}: {
  product: Product;
  className?: string;
}) {
  const { has, toggle } = useWishlist();
  const liked = has(product.id);
  const { user } = useAuth();
  const navigate = useNavigate();

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

  const location =
    (product as Product & { location?: string }).location ||
    "Jubilee Hills, Hyderabad";

  const handleCardClick = () => {
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

  return (
    <CSSTiltCard className={cn("group text-card-foreground p-0.5", className)}>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        onClick={handleCardClick}
        className="w-full flex flex-col justify-between overflow-hidden rounded-[22px] bg-card border border-border/60 hover:border-primary/40 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer h-full"
      >
        {/* Card Header & Media */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/40 p-4 flex items-center justify-center">
          <img
            src={imgSrc}
            alt={product.title}
            onError={() => setImgSrc(fallbackImg)}
            className="h-full w-full object-contain object-center transition-transform duration-500 group-hover:scale-105"
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
            {product.isReference ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/90 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                <Tag className="h-3 w-3" />
                Category Guide
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                <ShieldCheck className="h-3 w-3" />
                Verified Gear
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
              className="absolute top-3 right-3 z-10 rounded-full bg-background/80 backdrop-blur-md p-2 text-foreground/80 hover:text-red-500 transition-colors shadow-sm"
            >
              <Heart
                className={cn(
                  "h-4 w-4 transition-all",
                  liked && "fill-red-500 text-red-500 scale-110",
                )}
              />
            </button>
          )}

          <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] font-semibold text-muted-foreground bg-background/60 backdrop-blur-md rounded-md px-2 py-1">
            <span className="inline-flex items-center gap-1 truncate">
              <MapPin className="h-3 w-3 text-primary shrink-0" />
              {location}
            </span>
            <span className="inline-flex items-center gap-0.5 text-amber-500 font-bold shrink-0">
              <Star className="h-3 w-3 fill-amber-500" />
              {product.rating?.toFixed(1) || "5.0"}
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 flex flex-col justify-between flex-1 space-y-3">
          <div>
            <span className="text-[10px] font-bold tracking-wider uppercase text-primary/80">
              {product.category}
            </span>
            <h3 className="text-sm font-bold tracking-tight text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {product.title}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {product.description ||
                `High performance ${product.title} available for instant peer-to-peer rental.`}
            </p>
          </div>

          <div className="pt-2 border-t border-border/40 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground font-medium">
                Day Rate
              </span>
              <div className="text-base font-black tracking-tight text-foreground">
                ₹{product.price.toLocaleString("en-IN")}
                <span className="text-xs font-normal text-muted-foreground">
                  /day
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="w-1/2 flex items-center justify-end">
              {product.isReference ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
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
                  }}
                  className="w-full bg-black text-white hover:bg-neutral-800 border-black dark:bg-white dark:text-black dark:hover:bg-neutral-200 dark:border-white rounded-xl py-2 px-3 text-xs font-black inline-flex items-center justify-center shadow-md active:scale-95 transition-all text-center cursor-pointer"
                >
                  + Add Listing
                </button>
              ) : canDelete ? (
                <div className="flex items-center gap-1.5 w-full">
                  <Link
                    to="/product/$id"
                    params={{ id: product.id }}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-lg h-8 text-[11px] font-bold inline-flex items-center justify-center transition-all truncate px-1"
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
                          toast.success("Listing deleted permanently from MySQL database!");
                          window.dispatchEvent(
                            new CustomEvent("payent_products_updated"),
                          );
                        })
                        .catch((err) => {
                          console.warn("Backend database delete notice:", err);
                          const msg =
                            err instanceof Error
                              ? err.message
                              : "Failed to delete listing from database";
                          toast.error(msg);
                        });
                    }}
                    className="h-8 w-8 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 flex items-center justify-center transition-all cursor-pointer shrink-0"
                    title="Delete Listing (Owner/Admin Only)"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
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
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl py-2 px-3 text-xs font-bold inline-flex items-center justify-center shadow-sm active:scale-95 transition-all text-center cursor-pointer"
                >
                  Rent Now
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </CSSTiltCard>
  );
}
