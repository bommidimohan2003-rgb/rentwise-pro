import { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Heart,
  MapPin,
  Sparkles,
  Star,
} from "lucide-react";
import { api } from "@/utils/api";
import { useWishlist } from "@/hooks/useWishlist";
import { toast } from "sonner";

import cameraImg from "@/assets/images/camera.png";
import laptopImg from "@/assets/images/laptop.png";
import droneImg from "@/assets/images/drone.png";
import reClassic350Img from "@/assets/images/re_classic350.png";
import powerbankImg from "@/assets/images/powerbank.png";
import toolImg from "@/assets/images/tool.png";
import bikeImg from "@/assets/images/bike.png";

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

const fallbackFeatured: DisplayProduct[] = [
  {
    id: "sony-fx3",
    title: "Sony FX3 Full-Frame Cinema Camera",
    category: "Cameras",
    price: 2500,
    rating: 4.9,
    reviewsCount: 142,
    location: "Hyderabad, TS",
    image: cameraImg,
    badge: "Top Rated",
  },
  {
    id: "macbook-pro-m3",
    title: "Apple MacBook Pro 16\" M3 Max",
    category: "Laptops",
    price: 3500,
    rating: 4.9,
    reviewsCount: 98,
    location: "Bengaluru, KA",
    image: laptopImg,
    badge: "Pro Workstation",
  },
  {
    id: "dji-mavic-3",
    title: "DJI Mavic 3 Pro Cine Drone",
    category: "Drones",
    price: 3000,
    rating: 4.9,
    reviewsCount: 86,
    location: "Visakhapatnam, AP",
    image: droneImg,
    badge: "4K Cinema",
  },
  {
    id: "re-classic-350",
    title: "Royal Enfield Classic 350 Stealth",
    category: "Bikes",
    price: 1800,
    rating: 4.8,
    reviewsCount: 110,
    location: "Goa / Hyderabad",
    image: reClassic350Img,
    badge: "Popular Ride",
  },
  {
    id: "anker-powercore",
    title: "Anker 737 Fast Power Station 24K",
    category: "Powerbanks",
    price: 800,
    rating: 4.8,
    reviewsCount: 64,
    location: "Mumbai, MH",
    image: powerbankImg,
    badge: "Fast Charge",
  },
  {
    id: "dewalt-hammer-drill",
    title: "DeWalt 20V MAX Cordless Hammer Drill",
    category: "Drilling Machines",
    price: 600,
    rating: 4.7,
    reviewsCount: 45,
    location: "Hyderabad, TS",
    image: toolImg,
    badge: "Heavy Duty",
  },
  {
    id: "urban-terrain-cycle",
    title: "Urban Terrain Electric Mountain Cycle",
    category: "Cycles",
    price: 900,
    rating: 4.8,
    reviewsCount: 52,
    location: "Bengaluru, KA",
    image: bikeImg,
    badge: "Eco Ride",
  },
  {
    id: "sony-a7iv",
    title: "Sony Alpha A7 IV Full-Frame Hybrid",
    category: "Cameras",
    price: 2200,
    rating: 4.9,
    reviewsCount: 128,
    location: "Chennai, TN",
    image: cameraImg,
    badge: "Creator Pick",
  },
];

const categoryTabs = ["All", "Cameras", "Laptops", "Drones", "Bikes", "Powerbanks"];

export function FeaturedProducts() {
  const navigate = useNavigate();
  const { has, toggle } = useWishlist();
  const [products, setProducts] = useState<DisplayProduct[]>(fallbackFeatured);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  useEffect(() => {
    let isMounted = true;
    api
      .getPublicProducts()
      .then((serverProds) => {
        if (isMounted && Array.isArray(serverProds) && serverProds.length > 0) {
          const mapped: DisplayProduct[] = serverProds.map((p, idx) => ({
            id: p.id || `prod-${idx}`,
            title: p.title,
            category: p.category || "Gear",
            price: Number(p.price) || 2500,
            rating: Number(p.rating) || 4.9,
            reviewsCount: Number(p.reviewsCount) || 80 + idx * 15,
            location: p.owner_address || p.location || "Hyderabad, TS",
            image: p.image || (fallbackFeatured[idx % fallbackFeatured.length]?.image ?? cameraImg),
            badge: idx === 0 ? "Featured" : idx === 1 ? "Top Rated" : undefined,
          }));

          // Merge with reference catalog if backend has few products
          if (mapped.length < 4) {
            const combined = [...mapped];
            for (let i = mapped.length; i < fallbackFeatured.length; i++) {
              combined.push(fallbackFeatured[i]);
            }
            setProducts(combined);
          } else {
            setProducts(mapped);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load featured products:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

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
    <section className="relative overflow-hidden bg-white dark:bg-[#05090D] py-14 sm:py-18 text-neutral-900 dark:text-white border-b border-black/5 dark:border-white/10 transition-colors duration-300">
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
              Hand-picked, verified equipment ready to rent from trusted creators across India.
            </p>
          </div>

          {/* Interactive Filter Pills & View All Link */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
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

            <Link
              to="/categories"
              className="text-xs sm:text-sm font-semibold text-neutral-600 dark:text-[#A8B1BA] hover:text-[#FF1744] dark:hover:text-white flex items-center gap-1.5 transition-colors group ml-2"
            >
              <span>View All Rentals</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 text-[#FF1744]" />
            </Link>
          </div>
        </div>

        {/* Responsive Showcase Grid (4 columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {displayedProducts.map((p) => {
            const isLiked = has(p.id);

            return (
              <div
                key={p.id}
                onClick={() => handleDetails(p.id)}
                className="group relative rounded-2xl overflow-hidden bg-white dark:bg-[#0A1017] hover:bg-neutral-50/80 dark:hover:bg-[#0E1722] border border-black/8 dark:border-white/10 hover:border-[#FF1744]/40 dark:hover:border-[#FF1744]/50 shadow-sm hover:shadow-xl dark:shadow-none dark:hover:shadow-[0_16px_40px_rgba(0,0,0,0.6)] transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between cursor-pointer p-3.5"
              >
                {/* Product Media Stage */}
                <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-b from-neutral-100/90 via-neutral-100/40 to-transparent dark:from-white/[0.05] dark:via-white/[0.02] dark:to-transparent p-3 flex items-center justify-center">
                  {/* Subtle radial glow on hover */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,23,68,0.12)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  {/* Top-Left Floating Badge */}
                  {p.badge && (
                    <div className="absolute top-2.5 left-2.5 z-10 px-2.5 py-0.5 rounded-full bg-neutral-950/85 dark:bg-[#070D14]/90 text-white text-[10px] font-bold tracking-wide backdrop-blur-md border border-white/10 flex items-center gap-1.5 shadow-xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#FF1744] animate-pulse" />
                      <span>{p.badge}</span>
                    </div>
                  )}

                  {/* Top-Right Floating Wishlist Button */}
                  <button
                    type="button"
                    onClick={(e) => handleWishlist(e, p.id)}
                    aria-label="Add to wishlist"
                    className="absolute top-2.5 right-2.5 z-10 h-8 w-8 rounded-full bg-white/90 hover:bg-white dark:bg-[#070D14]/90 dark:hover:bg-[#121B24] border border-black/8 dark:border-white/10 flex items-center justify-center text-neutral-700 dark:text-white transition-all cursor-pointer shadow-xs hover:scale-110 active:scale-95"
                  >
                    <Heart
                      className={`h-4 w-4 transition-colors ${
                        isLiked
                          ? "fill-[#FF1744] text-[#FF1744]"
                          : "text-neutral-500 dark:text-neutral-300"
                      }`}
                    />
                  </button>

                  {/* Floor shadow */}
                  <div className="absolute bottom-2 w-32 sm:w-36 h-2.5 bg-black/10 dark:bg-black/50 rounded-[100%] blur-xs group-hover:w-40 transition-all duration-300" />

                  {/* Product Cutout Image */}
                  <img
                    src={p.image}
                    alt={p.title}
                    loading="lazy"
                    className="relative z-5 w-full h-full object-contain filter drop-shadow-md group-hover:scale-108 transition-transform duration-300 ease-out"
                  />
                </div>

                {/* Card Content & Details */}
                <div className="pt-3.5 pb-1 px-1 flex flex-col flex-1 justify-between text-left space-y-3">
                  <div>
                    {/* Category & Location */}
                    <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-[#8B98A5] mb-1">
                      <span className="font-semibold text-neutral-600 dark:text-[#A8B1BA] uppercase tracking-wider text-[10px]">
                        {p.category}
                      </span>
                      <div className="flex items-center gap-1 truncate max-w-[140px]">
                        <MapPin className="h-3 w-3 text-[#FF1744] shrink-0" />
                        <span className="truncate">{p.location}</span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold text-neutral-900 dark:text-white group-hover:text-[#FF1744] transition-colors leading-snug line-clamp-1">
                      {p.title}
                    </h3>

                    {/* Star Rating */}
                    <div className="flex items-center gap-1.5 mt-1.5 text-xs">
                      <div className="flex items-center gap-0.5 text-amber-500 font-bold">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        <span>{p.rating.toFixed(1)}</span>
                      </div>
                      <span className="text-neutral-400 dark:text-[#697680]">
                        ({p.reviewsCount} reviews)
                      </span>
                    </div>
                  </div>

                  {/* Price & Action Row */}
                  <div className="pt-3 border-t border-black/5 dark:border-white/10 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[10px] text-neutral-400 dark:text-[#697680] uppercase tracking-wider font-semibold">
                        Rent for
                      </div>
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-lg font-extrabold text-neutral-950 dark:text-white">
                          ₹{p.price.toLocaleString("en-IN")}
                        </span>
                        <span className="text-xs text-neutral-500 dark:text-[#8B98A5]">
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
                      className="px-3.5 py-2 rounded-xl bg-[#FF1744] hover:bg-[#E91E4D] text-white text-xs font-bold shadow-sm shadow-[#FF1744]/20 hover:shadow-[#FF1744]/40 flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                    >
                      <span>Rent Now</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
