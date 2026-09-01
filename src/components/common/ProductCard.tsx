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
import { storage } from "@/utils/storage";
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
  index = 0,
  onListGear,
}: {
  product: Product;
  index?: number;
  onListGear?: (product: Product) => void;
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

  const ownerName = product.owner?.name?.toLowerCase().trim();
  const ownerEmail = product.owner?.email?.toLowerCase().trim();
  const userFullName = user?.fullName?.toLowerCase().trim();
  const userEmail = user?.email?.toLowerCase().trim();

  const isOwner = Boolean(
    user &&
    !product.isReference &&
    ((ownerEmail && userEmail && ownerEmail === userEmail) ||
      (ownerName && userFullName && ownerName === userFullName) ||
      (ownerName && userEmail && ownerName === userEmail)),
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
    } else {
      navigate({
        to: "/product/$id",
        params: { id: product.id },
      });
    }
  };

  return (
    <CSSTiltCard>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        onClick={handleCardClick}
        className="group relative bg-card rounded-3xl overflow-hidden border border-border/80 hover:border-primary/50 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-full cursor-pointer"
      >
        <div className="relative aspect-4/3 overflow-hidden bg-secondary/80">
          <img
            src={imgSrc}
            alt={product.title}
            loading="lazy"
            decoding="async"
            onError={() => {
              if (imgSrc !== fallbackImg) setImgSrc(fallbackImg);
            }}
            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
          />

          {/* Top Left Badge: Reference (Black Badge) or Verified */}
          <div className="absolute top-3 left-3 flex items-center gap-1">
            {product.isReference ? (
              <div className="flex items-center gap-1 bg-black text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md tracking-wider border border-white/20">
                <Tag className="h-3 w-3 text-amber-400" />
                <span>Reference</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 bg-[#FF5A5F] text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md tracking-wider">
                <ShieldCheck className="h-3 w-3" />
                <span>Verified</span>
              </div>
            )}
          </div>

          {/* Top Right Wishlist Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              toggle(product.id);
            }}
            className={cn(
              "absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all duration-200 cursor-pointer shadow-md z-10",
              liked
                ? "bg-[#FF5A5F] text-white"
                : "bg-background/80 text-foreground hover:bg-background hover:scale-110",
            )}
            title={liked ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className={cn("h-3.5 w-3.5", liked && "fill-current")} />
          </button>

          {/* Rating Star Badge (Removed on Reference cards) */}
          {!product.isReference && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/10">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span>{product.rating || 5.0}</span>
            </div>
          )}
        </div>

        <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-1">
              <span className="inline-block text-[10px] font-black text-[#FF5A5F] bg-[#FF5A5F]/10 border border-[#FF5A5F]/20 px-2 py-0.5 rounded-full capitalize">
                {product.category}
              </span>
              <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                <MapPin className="h-2.5 w-2.5 text-[#FF5A5F]" />
                <span className="truncate max-w-[100px]">{location}</span>
              </div>
            </div>

            <h3 className="font-extrabold text-sm leading-tight line-clamp-2 text-foreground group-hover:text-primary transition-colors pt-0.5">
              {product.title}
            </h3>
          </div>

          <div className="space-y-2 pt-2 border-t border-border/60">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] text-muted-foreground font-semibold">
                Daily Rate
              </span>
              <div>
                <span className="text-lg font-black text-foreground tracking-tight">
                  ₹{product.price}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium">
                  {" "}
                  /day
                </span>
              </div>
            </div>

            {/* Action Buttons */}
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
            ) : isOwner && product.status === "pending" ? (
              <div className="flex items-center justify-between gap-1.5 w-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-lg px-2.5 py-1.5 text-[11px] font-bold">
                <span className="inline-flex items-center gap-1 truncate">
                  <Clock className="h-3.5 w-3.5 text-amber-500 animate-pulse shrink-0" />
                  Pending Admin Approval
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const currentCustom = storage.get<Product[]>(
                      "payent_custom_products",
                      [],
                    );
                    const updatedCustom = currentCustom.filter(
                      (p) => p.id !== product.id,
                    );
                    storage.set("payent_custom_products", updatedCustom);
                    window.dispatchEvent(
                      new CustomEvent("payent_products_updated"),
                    );
                    toast.success("Listing cancelled.");
                  }}
                  className="h-6 w-6 rounded hover:bg-red-500/20 text-red-500 flex items-center justify-center transition-all cursor-pointer shrink-0"
                  title="Cancel Listing"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ) : isOwner ? (
              <div className="flex items-center gap-1.5 w-full">
                <Link
                  to="/product/$id"
                  params={{ id: product.id }}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-lg h-8 text-[11px] font-bold inline-flex items-center justify-center transition-all truncate"
                >
                  Your Listing (Approved)
                </Link>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const currentCustom = storage.get<Product[]>(
                      "payent_custom_products",
                      [],
                    );
                    const updatedCustom = currentCustom.filter(
                      (p) => p.id !== product.id,
                    );
                    storage.set("payent_custom_products", updatedCustom);

                    const userToken = (user as { token?: string })?.token;
                    if (userToken) {
                      api
                        .deleteCustomProduct(userToken, product.id)
                        .then(() => {
                          toast.success("Listing deleted from database!");
                        })
                        .catch((err) => {
                          console.warn("Backend database delete notice:", err);
                          toast.success("Listing deleted!");
                        });
                    } else {
                      toast.success("Listing deleted!");
                    }

                    window.dispatchEvent(
                      new CustomEvent("payent_products_updated"),
                    );
                  }}
                  className="h-8 w-8 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 flex items-center justify-center transition-all cursor-pointer shrink-0"
                  title="Delete Listing from Database"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!user) {
                    toast.error("Please log in to book this item.");
                    navigate({ to: "/login" });
                    return;
                  }
                  navigate({
                    to: "/checkout",
                    search: { id: product.id } as never,
                  });
                }}
                className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-lg h-8 text-[11px] font-bold inline-flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer"
              >
                Rent Now
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </CSSTiltCard>
  );
}
