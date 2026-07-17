import { Heart, Check } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import type { Product } from "@/types";
import { Rating } from "./Rating";
import { useWishlist } from "@/hooks/useWishlist";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useProductSelection } from "@/hooks/useProductSelection";

export function ProductCard({
  product,
  index = 0,
  isReference = false,
}: {
  product: Product;
  index?: number;
  isReference?: boolean;
}) {
  const { has, toggle } = useWishlist();
  const liked = has(product.id);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isSelected, selectProduct } = useProductSelection();
  const selected = isSelected(product.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      onClick={() => selectProduct(selected ? null : product.id)}
      className={cn(
        "card-premium overflow-hidden group cursor-pointer transition-all duration-300",
        selected && "card-selected"
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        <img
          src={product.image}
          alt={product.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {!isReference && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!user) {
                toast.error("Please log in to add items to your wishlist.");
                navigate({ to: "/login" });
                return;
              }
              toggle(product.id);
            }}
            className={cn(
              "absolute top-3 transition-all duration-300 grid h-9 w-9 place-items-center rounded-full glass hover:scale-110",
              selected ? "right-14" : "right-3"
            )}
            aria-label="Wishlist"
          >
            <Heart
              className={cn(
                "h-4 w-4 transition-colors duration-300",
                liked 
                  ? (selected ? "fill-white text-white" : "fill-rose-500 text-rose-500") 
                  : (selected ? "text-white" : "text-foreground")
              )}
            />
          </button>
        )}
        {selected && (
          <div className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-pink-600 shadow-md animate-in zoom-in duration-200">
            <Check className="h-4.5 w-4.5 stroke-[3.5]" />
          </div>
        )}
        {!product.available && (
          <div className="absolute top-3 left-3 rounded-full bg-destructive/90 text-white text-xs px-3 py-1 font-medium">
            Unavailable
          </div>
        )}
      </div>
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className={cn("font-semibold text-base leading-tight line-clamp-2 transition-colors duration-300", selected ? "text-white" : "text-foreground")}>{product.title}</h3>
        </div>
        <div className="flex items-center justify-between text-sm">
          <Rating value={product.rating} count={product.reviews} className={cn("transition-colors duration-300", selected ? "text-white" : "text-foreground")} />
          <span className={cn("text-xs capitalize transition-colors duration-300", selected ? "text-white/80" : "text-muted-foreground")}>{product.category}</span>
        </div>
        <div className={cn("flex items-center justify-between pt-2 border-t transition-colors duration-300", selected ? "border-white/20" : "border-border")}>
          <div>
            <span className={cn("text-xl font-bold transition-colors duration-300", selected ? "text-white" : "text-foreground")}>₹{product.price}</span>
            <span className={cn("text-xs transition-colors duration-300", selected ? "text-white/80" : "text-muted-foreground")}> /day</span>
          </div>
          {isReference ? (
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
                e.stopPropagation();
                if (!user) {
                  e.preventDefault();
                  toast.error("Please log in to list your gear.");
                  navigate({ to: "/login" });
                }
              }}
              className={cn(
                "rounded-full px-4 h-9 text-sm font-medium inline-flex items-center transition-all duration-300",
                selected
                  ? "bg-white text-pink-600 hover:bg-white/90 shadow-md font-bold"
                  : "border border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              )}
            >
              List Yours
            </Link>
          ) : (
            <Link
              to="/product/$id"
              params={{ id: product.id }}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "rounded-full px-4 h-9 text-sm font-medium inline-flex items-center transition-all duration-300",
                selected
                  ? "bg-white text-pink-600 hover:bg-white/90 shadow-md font-bold"
                  : "btn-gradient text-white"
              )}
            >
              Rent
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}
