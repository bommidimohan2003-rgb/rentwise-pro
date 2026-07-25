import { Heart } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import type { Product } from "@/types";
import { Rating } from "./Rating";
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

  return (
    <CSSTiltCard className="h-full">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.04, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="spatial-card overflow-hidden group flex flex-col h-full relative"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-secondary/80">
          <img
            src={product.image}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-108"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          
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
            className="absolute top-3 right-3 grid h-9 w-9 place-items-center rounded-full spatial-float hover:scale-110 active:scale-95 transition-all shadow-md z-10"
            aria-label="Wishlist"
          >
            <Heart
              className={cn("h-4 w-4 transition-colors", liked ? "fill-rose-500 text-rose-500" : "text-foreground")}
            />
          </button>
          {!product.available && (
            <div className="absolute top-3 left-3 rounded-full bg-destructive/90 text-white text-[11px] px-3 py-1 font-bold shadow-md backdrop-blur-md border border-white/20">
              Unavailable
            </div>
          )}
        </div>

        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span className="capitalize px-2 py-0.5 rounded-full bg-secondary/70 border border-border/50">
                {product.category}
              </span>
              <Rating value={product.rating} count={product.reviews} />
            </div>
            <h3 className="font-bold text-base leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors">
              {product.title}
            </h3>
          </div>

          <div className="space-y-3 pt-3 border-t border-border/50">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-muted-foreground font-semibold">Rental rate</span>
              <div>
                <span className="text-xl font-extrabold text-foreground tracking-tight">₹{product.price}</span>
                <span className="text-xs text-muted-foreground font-medium"> /day</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/product/$id"
                params={{ id: product.id }}
                className="btn-gradient rounded-xl h-9 text-xs font-bold inline-flex items-center justify-center text-white shadow-md active:scale-95 transition-all"
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
                className="border border-border hover:border-primary/50 text-foreground hover:text-primary bg-secondary/40 hover:bg-secondary/80 rounded-xl h-9 text-xs font-bold inline-flex items-center justify-center transition-all active:scale-95"
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
