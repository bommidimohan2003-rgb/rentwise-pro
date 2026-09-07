import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Heart,
  MapPin,
  Sparkles,
  Star,
} from "lucide-react";
import { api } from "@/utils/api";
import { storage, STORAGE_KEYS } from "@/utils/storage";
import { useWishlist } from "@/hooks/useWishlist";
import { toast } from "sonner";
import type { Product } from "@/types";

interface DisplayProduct {
  id: string;
  title: string;
  category: string;
  price: number;
  rating: number;
  reviewsCount: number;
  location: string;
  image: string;
  badge?: string;
}

export function FeaturedProducts() {
  const navigate = useNavigate();
  const { has, toggle } = useWishlist();
  const [products, setProducts] = useState<DisplayProduct[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const loadRealProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      let realListings: Product[] = [];

      // 1. Fetch real products from backend public listings
      const serverProds = await api.getPublicProducts();
      if (Array.isArray(serverProds) && serverProds.length > 0) {
        realListings = serverProds;
      } else {
        // 2. Fetch real lender listings from local custom products and server cache
        const localCustom = storage.get<Product[]>(STORAGE_KEYS.customProducts, []);
        const cachedServer = storage.get<Product[]>("payent_server_products", []);
        realListings = [...localCustom, ...cachedServer];
      }

      // Deduplicate by ID and only accept real approved items (no fake hardcoded items)
      const seen = new Set<string>();
      const uniqueReal = realListings.filter((p) => {
        if (!p || !p.id || !p.title || seen.has(p.id)) return false;
        seen.add(p.id);
        return p.status === "approved" || !p.status;
      });

      const mapped: DisplayProduct[] = uniqueReal.map((p, idx) => ({
        id: p.id,
        title: p.title,
        category: p.category || "Gear",
        price: Number(p.price) || 0,
        rating: Number(p.rating) || 5.0,
        reviewsCount: Number(p.reviews) || 0,
        location: p.location || p.owner?.city || p.owner?.address || "India",
        image: p.image || (p.images && p.images[0]) || "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600",
        badge: idx === 0 ? "Featured" : p.status === "approved" ? "Verified" : undefined,
      }));

      setProducts(mapped);
    } catch (err) {
      console.warn("[FeaturedProducts] Could not load real products:", err);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRealProducts();

    // Listen for live product updates from lenders or admins
    const handleUpdate = () => loadRealProducts();
    window.addEventListener("payent_products_updated", handleUpdate);
    window.addEventListener("payent:storage_change", handleUpdate);

    return () => {
      window.removeEventListener("payent_products_updated", handleUpdate);
      window.removeEventListener("payent:storage_change", handleUpdate);
    };
  }, [loadRealProducts]);

  const handleWishlist = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    toggle(id);
    const isLiked = has(id);
    toast.success(isLiked ? "Removed from wishlist" : "Saved to wishlist!");
  };

  const handleDetails = (id: string) => {
    navigate({ to: "/product/$id", params: { id } });
  };

  // Dynamically compute category tabs strictly from existing real items
  const categoryTabs = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
    return cats.length > 0 ? ["All", ...cats] : ["All"];
  }, [products]);

  const filteredProducts =
    selectedCategory === "All"
      ? products
      : products.filter(
          (p) =>
            p.category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
            selectedCategory.toLowerCase().includes(p.category.toLowerCase())
        );

  const displayedProducts = filteredProducts.slice(0, 8);

  return (
    <section className="relative overflow-hidden bg-white dark:bg-[#05090D] py-12 sm:py-16 text-neutral-900 dark:text-white border-b border-black/5 dark:border-white/10 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950 dark:text-white">
                Featured Rentals
              </h2>
              <span className="inline-block w-8 h-[3px] bg-[#FF1744] rounded-full" />
            </div>
            <p className="mt-1.5 text-xs sm:text-sm text-neutral-500 dark:text-[#A8B1BA]">
              Real verified equipment listed by trusted creators across India.
            </p>
          </div>

          {/* Interactive Filter Pills & View All Link */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {categoryTabs.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-neutral-100 dark:bg-[#0A1017] border border-black/5 dark:border-white/10">
                {categoryTabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setSelectedCategory(tab)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      selectedCategory === tab
                        ? "bg-white dark:bg-[#141F2B] text-neutral-950 dark:text-white shadow-xs border border-black/5 dark:border-white/10"
                        : "text-neutral-500 dark:text-[#8B98A5] hover:text-neutral-900 dark:hover:text-white"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            )}

            <Link
              to="/categories"
              className="text-xs sm:text-sm font-semibold text-neutral-600 dark:text-[#A8B1BA] hover:text-[#FF1744] dark:hover:text-white flex items-center gap-1.5 transition-colors group ml-2"
            >
              <span>Browse All Gear</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 text-[#FF1744]" />
            </Link>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-2xl bg-neutral-100 dark:bg-[#0A1017] border border-black/5 dark:border-white/10 h-72 animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Empty State (Only Real Items Allowed - Zero Fake Mock Data) */}
        {!isLoading && displayedProducts.length === 0 && (
          <div className="rounded-2xl p-8 sm:p-12 border border-dashed border-black/15 dark:border-white/15 bg-neutral-50/50 dark:bg-[#070D13] text-center max-w-xl mx-auto flex flex-col items-center justify-center">
            <div className="h-12 w-12 rounded-full bg-[#FF1744]/10 text-[#FF1744] flex items-center justify-center mb-3">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-neutral-950 dark:text-white">
              No Live Rentals Yet
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm text-neutral-500 dark:text-[#A8B1BA] max-w-md">
              Be the first creator or lender to list your equipment and start earning daily rental income.
            </p>
            <Link
              to="/become-lender"
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FF1744] hover:bg-[#FF2355] text-white text-xs sm:text-sm font-semibold shadow-md shadow-[#FF1744]/25 transition-all cursor-pointer"
            >
              <span>List Your Gear Now</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {/* Responsive Showcase Grid (Real Listings Only) */}
        {!isLoading && displayedProducts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {displayedProducts.map((p) => {
              const isLiked = has(p.id);

              return (
                <div
                  key={p.id}
                  onClick={() => handleDetails(p.id)}
                  className="group relative rounded-2xl overflow-hidden bg-white dark:bg-[#0A1017] hover:bg-neutral-50/80 dark:hover:bg-[#0E1722] border border-black/8 dark:border-white/10 hover:border-[#FF1744]/40 dark:hover:border-[#FF1744]/50 shadow-sm hover:shadow-xl dark:shadow-none dark:hover:shadow-[0_16px_40px_rgba(0,0,0,0.6)] transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between cursor-pointer p-3.5"
                >
                  {/* Top Image Stage */}
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-neutral-100/90 dark:bg-[#05090D] flex items-center justify-center p-3">
                    {/* Badge */}
                    {p.badge && (
                      <span className="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/75 dark:bg-black/80 text-white backdrop-blur-md border border-white/10 shadow-sm">
                        {p.badge}
                      </span>
                    )}

                    {/* Wishlist Button */}
                    <button
                      type="button"
                      onClick={(e) => handleWishlist(e, p.id)}
                      aria-label="Save to wishlist"
                      className="absolute top-2.5 right-2.5 z-10 h-7 w-7 rounded-full bg-white/80 dark:bg-black/60 backdrop-blur-md flex items-center justify-center text-neutral-600 dark:text-white hover:text-[#FF1744] hover:bg-white dark:hover:bg-black transition-all cursor-pointer shadow-sm"
                    >
                      <Heart
                        className={`h-3.5 w-3.5 transition-colors ${
                          isLiked
                            ? "fill-[#FF1744] text-[#FF1744]"
                            : "stroke-[2]"
                        }`}
                      />
                    </button>

                    {/* Product Image */}
                    <img
                      src={p.image}
                      alt={p.title}
                      loading="lazy"
                      className="max-h-full max-w-full object-contain filter contrast-110 drop-shadow-[0_8px_16px_rgba(0,0,0,0.12)] dark:drop-shadow-[0_12px_24px_rgba(0,0,0,0.7)] group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Card Content */}
                  <div className="mt-3 flex flex-col flex-1 justify-between">
                    <div>
                      {/* Meta Row: Category + Location */}
                      <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-[#8B98A5] mb-1">
                        <span className="font-semibold uppercase tracking-wider text-[#FF1744]">
                          {p.category}
                        </span>
                        <div className="flex items-center gap-1 truncate max-w-[120px]">
                          <MapPin className="h-3 w-3 text-neutral-400 shrink-0" />
                          <span className="truncate">{p.location}</span>
                        </div>
                      </div>

                      {/* Product Title */}
                      <h3 className="font-bold text-sm sm:text-[15px] text-neutral-900 dark:text-white group-hover:text-[#FF1744] transition-colors line-clamp-1 leading-snug">
                        {p.title}
                      </h3>

                      {/* Rating & Reviews */}
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs">
                        <div className="flex items-center text-amber-400">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <span className="ml-1 font-bold text-neutral-900 dark:text-white text-xs">
                            {p.rating.toFixed(1)}
                          </span>
                        </div>
                        <span className="text-[11px] text-neutral-400 dark:text-[#697680]">
                          ({p.reviewsCount} reviews)
                        </span>
                      </div>
                    </div>

                    {/* Action & Pricing Footer */}
                    <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/10 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-neutral-400 dark:text-[#8B98A5] block leading-none">
                          Rent for
                        </span>
                        <div className="text-sm font-black text-neutral-950 dark:text-white mt-0.5">
                          ₹{p.price.toLocaleString("en-IN")}
                          <span className="text-[10px] font-normal text-neutral-400 dark:text-[#8B98A5] ml-0.5">
                            /day
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDetails(p.id);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#FF1744] hover:bg-[#FF2355] text-white text-xs font-semibold shadow-xs hover:shadow-sm hover:shadow-[#FF1744]/30 transition-all cursor-pointer"
                      >
                        Rent Now
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
