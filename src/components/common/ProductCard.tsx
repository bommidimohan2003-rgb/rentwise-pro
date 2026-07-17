import { Heart } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import type { Product } from "@/types";
import { Rating } from "./Rating";
import { useWishlist } from "@/hooks/useWishlist";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function ProductCard({
  product,
  index = 0,
}: {
  product: Product;
  index?: number;
}) {
  const { has, toggle } = useWishlist();
  const liked = has(product.id);
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="card-premium overflow-hidden group"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        <img
          src={product.image}
          alt={product.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
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
          className="absolute top-3 right-3 grid h-9 w-9 place-items-center rounded-full glass hover:scale-110 transition-transform"
          aria-label="Wishlist"
        >
          <Heart
            className={cn("h-4 w-4", liked ? "fill-rose-500 text-rose-500" : "text-foreground")}
          />
        </button>
        {!product.available && (
          <div className="absolute top-3 left-3 rounded-full bg-destructive/90 text-white text-xs px-3 py-1 font-medium">
            Unavailable
          </div>
        )}
      </div>
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-base leading-tight line-clamp-2">{product.title}</h3>
        </div>
        <div className="flex items-center justify-between text-sm">
          <Rating value={product.rating} count={product.reviews} />
          <span className="text-xs text-muted-foreground capitalize">{product.category}</span>
        </div>
        
        <div className="flex flex-col gap-3 pt-3 border-t border-border">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-muted-foreground font-medium">Rental price</span>
            <div>
              <span className="text-xl font-bold">₹{product.price}</span>
              <span className="text-xs text-muted-foreground"> /day</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/product/$id"
              params={{ id: product.id }}
              className="btn-gradient rounded-xl h-9 text-xs font-semibold inline-flex items-center justify-center text-white"
            >
              Rent
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
              className="border border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-xl h-9 text-xs font-semibold inline-flex items-center justify-center transition-colors duration-200"
            >
              List Yours
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
