import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Star,
  Sparkles,
  TrendingUp,
  Layers,
  Heart,
  ArrowRight,
} from "lucide-react";
import type { Product } from "@/types";
import { tracker } from "@/utils/eventTracker";
import { useWishlist } from "@/hooks/useWishlist";
import { Button } from "@/components/common/Button";
import { Rating } from "@/components/common/Rating";
import { cn } from "@/lib/utils";

interface RecommendationSectionProps {
  title: string;
  subtitle?: string;
  products: Product[];
  type: "similar" | "trending" | "frequently_together" | "personalized";
  badge?: string;
  layout?: "grid" | "compact";
  className?: string;
}

export function RecommendationSection({
  title,
  subtitle,
  products,
  type,
  badge,
  layout = "grid",
  className,
}: RecommendationSectionProps) {
  const { has, toggle } = useWishlist();

  useEffect(() => {
    if (products && products.length > 0) {
      products.forEach((p) => {
        tracker.recommendationImpression(p.id, type);
      });
    }
  }, [products, type]);

  if (!products || products.length === 0) return null;

  const getIcon = () => {
    switch (type) {
      case "personalized":
        return <Sparkles className="h-4 w-4 text-[#FF5A5F]" />;
      case "trending":
        return <TrendingUp className="h-4 w-4 text-[#FF5A5F]" />;
      case "frequently_together":
        return <Layers className="h-4 w-4 text-[#FF5A5F]" />;
      default:
        return <Sparkles className="h-4 w-4 text-[#FF5A5F]" />;
    }
  };

  if (layout === "compact") {
    return (
      <div
        className={cn("space-y-4 pt-6 border-t border-border/80", className)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">{getIcon()}</div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight text-foreground font-display">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>
          {badge && (
            <span className="px-2.5 py-0.5 rounded-full bg-secondary text-[11px] font-bold text-muted-foreground">
              {badge}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {products.slice(0, 4).map((product) => (
            <Link
              key={product.id}
              to="/product/$id"
              params={{ id: product.id }}
              onClick={() => tracker.recommendationClick(product.id, type)}
              className="group flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/80 hover:border-primary/50 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <img
                src={product.image}
                alt={product.title}
                className="h-16 w-16 rounded-xl object-cover shrink-0 bg-secondary"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                  {product.title}
                </h4>
                <p className="text-[11px] font-extrabold text-foreground mt-0.5">
                  ₹{product.price.toLocaleString("en-IN")}
                  <span className="text-[10px] text-slate-400 font-normal">
                    /day
                  </span>
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
                  <span className="text-[11px] font-bold text-foreground">
                    {product.rating}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className={cn("py-8 space-y-6", className)}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-border/60 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-2">
            {getIcon()}
            <span>
              {badge ||
                (type === "personalized"
                  ? "Personalized For You"
                  : type === "trending"
                    ? "Trending Now"
                    : "Recommended")}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground font-display">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs md:text-sm text-muted-foreground font-medium mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Grid of Product Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => {
          const isWishlisted = has(product.id);
          return (
            <div
              key={product.id}
              className="group relative rounded-3xl bg-card border border-border/80 overflow-hidden shadow-md hover:shadow-xl hover:border-primary/40 transition-all duration-300 flex flex-col"
            >
              {/* Image & Wishlist Button */}
              <div className="relative aspect-4/3 overflow-hidden bg-secondary">
                <img
                  src={product.image}
                  alt={product.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(product.id);
                  }}
                  aria-label="Wishlist item"
                  className={cn(
                    "absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all duration-200 cursor-pointer shadow-md",
                    isWishlisted
                      ? "bg-[#FF5A5F] text-white"
                      : "bg-black/40 text-white hover:bg-black/60",
                  )}
                >
                  <Heart
                    className={cn("h-4 w-4", isWishlisted && "fill-white")}
                  />
                </button>

                <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider">
                  {product.category}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <Rating value={product.rating} />
                    {product.reviews > 0 && (
                      <span className="text-[11px] font-bold text-muted-foreground">
                        ({product.reviews} reviews)
                      </span>
                    )}
                  </div>

                  <Link
                    to="/product/$id"
                    params={{ id: product.id }}
                    onClick={() =>
                      tracker.recommendationClick(product.id, type)
                    }
                    className="block group-hover:text-primary transition-colors"
                  >
                    <h3 className="font-extrabold text-sm md:text-base text-foreground line-clamp-1">
                      {product.title}
                    </h3>
                  </Link>

                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1 font-normal">
                    {product.description}
                  </p>
                </div>

                {/* Footer / Price & Rent Button */}
                <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground font-medium block">
                      Daily Rental
                    </span>
                    <span className="text-base md:text-lg font-black text-foreground">
                      ₹{product.price.toLocaleString("en-IN")}
                      <span className="text-xs font-normal text-muted-foreground">
                        /day
                      </span>
                    </span>
                  </div>

                  <Link
                    to="/product/$id"
                    params={{ id: product.id }}
                    onClick={() =>
                      tracker.recommendationClick(product.id, type)
                    }
                  >
                    <Button
                      size="sm"
                      className="rounded-xl font-bold bg-primary text-primary-foreground hover:opacity-90 gap-1 text-xs"
                    >
                      <span>View</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
