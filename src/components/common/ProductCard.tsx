import { Heart, MapPin, ShieldCheck, Star } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import type { Product } from "@/types";
import { useWishlist } from "@/hooks/useWishlist";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { CSSTiltCard } from "./CSSTiltCard";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { has, toggle } = useWishlist();
  const liked = has(product.id);
  const { user } = useAuth();
  const navigate = useNavigate();

  const locations = ["Indiranagar, Bangalore", "Bandra West, Mumbai", "Connaught Place, Delhi", "HSR Layout, Bangalore", "Jubilee Hills, Hyderabad"];
  const isOwner = Boolean(user && (user.fullName === product.owner.name || user.email === product.owner.name));
  const location = locations[parseInt(product.id.replace(/\D/g, "") || "0") % locations.length];

  return (
    <CSSTiltCard className="h-full">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.04, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-3xl bg-card border border-border/80 hover:border-[#FF5A5F]/40 overflow-hidden group flex flex-col h-full relative shadow-lg hover:shadow-2xl hover:shadow-[#FF5A5F]/10 transition-all duration-300"
      >
        {/* Image Stage */}
        <div className="relative aspect-[16/10] overflow-hidden bg-secondary/60">
          <img
            src={product.image}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-108"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10 opacity-70 group-hover:opacity-90 transition-opacity duration-300 pointer-events-none" />
          
          {/* Top Left Verified / Reference Badge */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1">
            {product.isReference ? (
              <span className="rounded-md bg-black text-white dark:bg-white dark:text-black text-[9px] px-2 py-0.5 font-black tracking-wider uppercase shadow-md">
                REFERENCE
              </span>
            ) : (
              <div className="flex items-center gap-1 rounded-full bg-[#FF5A5F] text-white text-[9px] px-2 py-0.5 font-extrabold shadow-md backdrop-blur-md">
                <ShieldCheck className="h-2.5 w-2.5" />
                <span>Verified</span>
              </div>
            )}
          </div>

          {/* Top Right Wishlist Heart */}
          <button
            onClick={(e) => {
              e.preventDefault();
              if (!user) {
                toast.error("Please log in to add items to your wishlist.");
                navigate({ to: "/login" });
                return;
              }
              toggle(product.id);
            }}
            className="absolute top-2.5 right-2.5 grid h-7 w-7 place-items-center rounded-full bg-white/90 dark:bg-black/80 text-slate-800 dark:text-white hover:scale-110 active:scale-95 transition-all shadow-md z-10 cursor-pointer"
            aria-label="Wishlist"
          >
            <Heart
              className={cn("h-3.5 w-3.5 transition-colors", liked ? "fill-[#FF5A5F] text-[#FF5A5F]" : "text-slate-700 dark:text-slate-200")}
            />
          </button>

          {/* Bottom Left Rating Pill */}
          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-full bg-slate-950/80 backdrop-blur-md text-white text-[9px] px-2 py-0.5 font-bold border border-white/20 shadow-md">
            <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
            <span>{product.rating.toFixed(1)}</span>
            <span className="text-slate-400">({product.reviews})</span>
          </div>
        </div>

        {/* Card Content Body */}
        <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span className="capitalize px-2 py-0.5 rounded-full bg-[#FF5A5F]/10 text-[#FF5A5F] border border-[#FF5A5F]/20 font-bold text-[10px]">
                {product.category}
              </span>
              <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                <MapPin className="h-2.5 w-2.5 text-[#FF5A5F]" />
                <span className="truncate max-w-[100px]">{location}</span>
              </div>
            </div>

            <h3 className="font-extrabold text-sm leading-tight line-clamp-2 text-foreground group-hover:text-[#FF5A5F] transition-colors pt-0.5">
              {product.title}
            </h3>
          </div>

          <div className="space-y-2 pt-2 border-t border-border/60">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] text-muted-foreground font-semibold">Daily Rate</span>
              <div>
                <span className="text-lg font-black text-[#FF5A5F] tracking-tight">₹{product.price}</span>
                <span className="text-[10px] text-muted-foreground font-medium"> /day</span>
              </div>
            </div>

            {/* Action Buttons */}
            {product.isReference ? (
              <div className="grid grid-cols-2 gap-1.5">
                <Link
                  to="/product/$id"
                  params={{ id: product.id }}
                  className="border border-border hover:border-primary text-foreground bg-secondary/50 hover:bg-secondary rounded-lg h-8 text-[11px] font-bold inline-flex items-center justify-center transition-all active:scale-95"
                >
                  View Details
                </Link>
                <Link
                  to={user ? "/become-lender" : "/login"}
                  search={
                    user
                      ? {
                          title: product.title,
                          category: product.category,
                          price: product.price.toString(),
                          description: product.description,
                        }
                      : undefined
                  }
                  onClick={(e) => {
                    if (!user) {
                      e.preventDefault();
                      toast.error("Please log in to list your gear.");
                      navigate({ to: "/login" });
                    }
                  }}
                  className="bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-lg h-8 text-[11px] font-bold inline-flex items-center justify-center shadow-md active:scale-95 transition-all"
                >
                  List Yours
                </Link>
              </div>
            ) : isOwner ? (
              <Link
                to="/product/$id"
                params={{ id: product.id }}
                className="w-full border border-border text-muted-foreground bg-secondary/40 rounded-lg h-8 text-[11px] font-bold inline-flex items-center justify-center transition-all"
              >
                Your Listing
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (!user) {
                    toast.error("Please log in to book this item.");
                    navigate({ to: "/login" });
                    return;
                  }
                  navigate({ to: "/checkout", search: { id: product.id } as never });
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
