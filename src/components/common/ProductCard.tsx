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

  // Pick a location based on product ID for mockup reference accuracy
  const locations = ["Indiranagar, Bangalore", "Bandra West, Mumbai", "Connaught Place, Delhi", "HSR Layout, Bangalore", "Jubilee Hills, Hyderabad"];
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
        <div className="relative aspect-[4/3] overflow-hidden bg-secondary/60">
          <img
            src={product.image}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-108"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10 opacity-70 group-hover:opacity-90 transition-opacity duration-300 pointer-events-none" />
          
          {/* Top Left Verified Badge (Reference Mockup Style) */}
          <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-[#FF5A5F] text-white text-[10px] px-2.5 py-1 font-extrabold shadow-md backdrop-blur-md">
            <ShieldCheck className="h-3 w-3" />
            <span>Verified Gear</span>
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
            className="absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-full bg-white/90 dark:bg-black/80 text-slate-800 dark:text-white hover:scale-110 active:scale-95 transition-all shadow-md z-10 cursor-pointer"
            aria-label="Wishlist"
          >
            <Heart
              className={cn("h-4 w-4 transition-colors", liked ? "fill-[#FF5A5F] text-[#FF5A5F]" : "text-slate-700 dark:text-slate-200")}
            />
          </button>

          {/* Bottom Left Rating Pill on Image (Reference Mockup Style) */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-slate-950/80 backdrop-blur-md text-white text-[10px] px-2.5 py-1 font-bold border border-white/20 shadow-md">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span>{product.rating.toFixed(1)}</span>
            <span className="text-slate-400">({product.reviews})</span>
          </div>
        </div>

        {/* Card Content Body */}
        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span className="capitalize px-2.5 py-0.5 rounded-full bg-[#FF5A5F]/10 text-[#FF5A5F] border border-[#FF5A5F]/20 font-bold text-[11px]">
                {product.category}
              </span>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                <MapPin className="h-3 w-3 text-[#FF5A5F]" />
                <span className="truncate max-w-[110px]">{location}</span>
              </div>
            </div>

            <h3 className="font-extrabold text-base leading-snug line-clamp-2 text-foreground group-hover:text-[#FF5A5F] transition-colors pt-1">
              {product.title}
            </h3>
          </div>

          <div className="space-y-3 pt-3 border-t border-border/60">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-muted-foreground font-semibold">Daily Rate</span>
              <div>
                <span className="text-xl font-black text-[#FF5A5F] tracking-tight">₹{product.price}</span>
                <span className="text-xs text-muted-foreground font-medium"> /day</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/product/$id"
                params={{ id: product.id }}
                className="bg-[#FF5A5F] hover:bg-[#e0484d] text-white rounded-xl h-9 text-xs font-bold inline-flex items-center justify-center shadow-md shadow-[#FF5A5F]/20 active:scale-95 transition-all"
              >
                Rent Now
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
                className="border border-border hover:border-[#FF5A5F]/50 text-foreground hover:text-[#FF5A5F] bg-secondary/50 hover:bg-secondary rounded-xl h-9 text-xs font-bold inline-flex items-center justify-center transition-all active:scale-95"
              >
                List Yours
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </CSSTiltCard>
  );
}
