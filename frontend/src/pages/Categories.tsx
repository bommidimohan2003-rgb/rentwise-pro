import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search as SearchIcon,
  X,
  ArrowUpDown,
  ChevronDown,
  Check,
  Star,
  ArrowRight,
  SlidersHorizontal,
  Layers,
  Camera,
  Laptop,
  Plane,
  Bike,
  Hammer,
  Zap,
  Mic,
  Sun,
  RefreshCw,
  MapPin,
  Sparkles,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import { MainLayout } from "@/layouts/MainLayout";
import { ProductCard } from "@/components/common/ProductCard";
import { advancedSearch, isProductInLocation } from "@/utils/searchEngine";
import { searchWithML } from "@/utils/smartSearch";
import type { Product, Category, ProductAvailabilityItem } from "@/types";
import { cn } from "@/lib/utils";
import { useSearch, useNavigate } from "@tanstack/react-router";
import { tracker } from "@/utils/eventTracker";
import { storage } from "@/utils/storage";
import { api } from "@/utils/api";
import { useAuth } from "@/hooks/useAuth";
import { useUserLocation } from "@/hooks/useUserLocation";

import cameraImg from "@/assets/images/camera.png";

type SortOption = "featured" | "newest" | "price_asc" | "price_desc" | "rating";

const popularTags = [
  "Sony FX3",
  "Canon R5",
  "DJI Mavic 3",
  "MacBook Pro",
  "Cinema Camera",
  "Audio Gear",
];

const categoryIconMap: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  all: Layers,
  cameras: Camera,
  camera: Camera,
  laptops: Laptop,
  laptop: Laptop,
  drones: Plane,
  drone: Plane,
  audio: Mic,
  sound: Mic,
  lighting: Sun,
  light: Sun,
  bikes: Bike,
  bike: Bike,
  tools: Hammer,
  powerbanks: Zap,
};

const matchCategory = (productCat: string, targetId: string) => {
  if (!productCat) return false;
  const pCat = productCat.toLowerCase().trim();
  const tId = targetId.toLowerCase().trim();
  if (tId === "all") return true;
  if (pCat === tId) return true;
  if (
    (tId === "bikes" || tId === "bike") &&
    (pCat.includes("bike") ||
      pCat.includes("motorcycle") ||
      pCat.includes("ride") ||
      pCat.includes("cycle"))
  )
    return true;
  if (
    (tId === "tools" || tId === "tool") &&
    (pCat.includes("tool") || pCat.includes("drill"))
  )
    return true;
  if (
    (tId === "powerbanks" || tId === "powerbank") &&
    (pCat.includes("power") || pCat.includes("battery"))
  )
    return true;
  if (
    (tId === "cameras" || tId === "camera") &&
    (pCat.includes("camera") ||
      pCat.includes("cinema") ||
      pCat.includes("lens"))
  )
    return true;
  if (
    (tId === "laptops" || tId === "laptop") &&
    (pCat.includes("laptop") ||
      pCat.includes("macbook") ||
      pCat.includes("computer"))
  )
    return true;
  if ((tId === "drones" || tId === "drone") && pCat.includes("drone"))
    return true;
  if (
    (tId === "audio" || tId === "sound") &&
    (pCat.includes("audio") || pCat.includes("mic") || pCat.includes("sound"))
  )
    return true;
  if (
    (tId === "lighting" || tId === "light") &&
    (pCat.includes("light") || pCat.includes("led") || pCat.includes("softbox"))
  )
    return true;
  return false;
};

const ITEMS_PER_PAGE = 12;

export default function Categories() {
  const { user } = useAuth();
  const search = useSearch({ strict: false }) as {
    q?: string;
    cat?: string;
    city?: string;
  };
  const navigate = useNavigate();

  const activeCategory = search.cat || "all";
  const [q, setLocalQ] = useState(search.q || "");
  const [sort, setSort] = useState<SortOption>("featured");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Additional filter states
  const [maxPriceFilter, setMaxPriceFilter] = useState<number | null>(null);
  const [minRatingFilter, setMinRatingFilter] = useState<number>(0);
  const [availableOnlyFilter, setAvailableOnlyFilter] =
    useState<boolean>(false);

  const [allProductsList, setAllProductsList] = useState<Product[]>(() => {
    return storage.get<Product[]>("payent_server_products", []);
  });
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(() => {
    const cached = storage.get<Product[]>("payent_server_products", []);
    return cached.length === 0;
  });
  const [fetchError, setFetchError] = useState<boolean>(false);

  const [liveCategories, setLiveCategories] = useState<Category[]>([]);
  const [mlResults, setMlResults] = useState<Product[] | null>(null);
  const [didYouMean, setDidYouMean] = useState<string | null>(null);
  const [popularQueries] = useState<string[]>(popularTags);

  const sortRef = useRef<HTMLDivElement>(null);

  // User location detection (Auto-detected only)
  const {
    city: detectedCity,
    isDetecting,
    detectLocation,
  } = useUserLocation();

  const [isNationwide, setIsNationwide] = useState<boolean>(false);

  const isLocationActive = Boolean(
    detectedCity &&
      detectedCity !== "Location unavailable" &&
      detectedCity !== "All Cities",
  );

  // Effective city filter: URL param if provided, else detected city unless user toggled nationwide
  const effectiveCity = search.city
    ? search.city
    : !isNationwide && isLocationActive
      ? detectedCity
      : null;

  // Sync search keyword from URL
  useEffect(() => {
    setLocalQ(search.q || "");
    setCurrentPage(1);
  }, [search.q]);

  // Track category
  useEffect(() => {
    if (activeCategory && activeCategory !== "all") {
      tracker.browseCategory(activeCategory);
    }
    setCurrentPage(1);
  }, [activeCategory]);

  // Track search
  useEffect(() => {
    if (search.q && search.q.trim()) {
      const timer = setTimeout(() => {
        tracker.search(search.q!);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [search.q]);

  // Fetch real products from backend
  const fetchPublicProducts = useCallback(() => {
    setIsLoadingProducts(true);
    setFetchError(false);
    api
      .getPublicProducts()
      .then((serverProducts) => {
        if (Array.isArray(serverProducts)) {
          setAllProductsList(serverProducts);
          storage.set("payent_server_products", serverProducts);
        } else {
          setAllProductsList([]);
        }
      })
      .catch((err) => {
        console.warn("[Browse] Server products fetch notice:", err);
        setFetchError(true);
      })
      .finally(() => {
        setIsLoadingProducts(false);
      });
  }, []);

  useEffect(() => {
    fetchPublicProducts();
    window.addEventListener("payent_products_updated", fetchPublicProducts);
    return () => {
      window.removeEventListener(
        "payent_products_updated",
        fetchPublicProducts,
      );
    };
  }, [fetchPublicProducts]);

  // Fetch real categories from backend
  useEffect(() => {
    api
      .getPublicCategories()
      .then((cats) => {
        if (Array.isArray(cats) && cats.length > 0) {
          setLiveCategories(cats);
        }
      })
      .catch((err) =>
        console.warn("[Browse] Public categories fetch notice:", err),
      );
  }, []);



  // ML-powered Search
  useEffect(() => {
    let isMounted = true;
    if (q && q.trim()) {
      searchWithML(allProductsList, q, activeCategory).then((res) => {
        if (isMounted) {
          setMlResults(res.results);
          setDidYouMean(res.didYouMean);
        }
      });
    } else {
      setMlResults(null);
      setDidYouMean(null);
    }
    return () => {
      isMounted = false;
    };
  }, [q, activeCategory, allProductsList]);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Dynamic max price calculation
  const highestPriceInCatalog = useMemo(() => {
    if (!allProductsList.length) return 10000;
    const maxVal = Math.max(...allProductsList.map((p) => p.price || 0));
    return maxVal > 0 ? Math.ceil(maxVal / 500) * 500 : 10000;
  }, [allProductsList]);

  // Set initial max price filter once catalog loads
  useEffect(() => {
    if (maxPriceFilter === null && highestPriceInCatalog > 0) {
      setMaxPriceFilter(highestPriceInCatalog);
    }
  }, [highestPriceInCatalog, maxPriceFilter]);

  // Handlers for navigation / filters
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    navigate({
      to: "/browse",
      search: (prev: Record<string, unknown>) => ({
        ...prev,
        q: q.trim() || undefined,
        city: search.city || undefined,
      }),
    });
    setCurrentPage(1);
  };

  const handleCategorySelect = (catId: string) => {
    navigate({
      to: "/browse",
      search: (prev: Record<string, unknown>) => ({
        ...prev,
        cat: catId === "all" ? undefined : catId,
      }),
    });
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setLocalQ("");
    setMaxPriceFilter(highestPriceInCatalog);
    setMinRatingFilter(0);
    setAvailableOnlyFilter(false);
    setSort("featured");
    setIsNationwide(false);
    navigate({
      to: "/browse",
      search: {},
    });
    setCurrentPage(1);
  };

  // Filtered & Sorted Product List
  const filteredProducts = useMemo(() => {
    let list =
      mlResults !== null
        ? mlResults
        : allProductsList.filter((p) =>
            activeCategory === "all"
              ? true
              : matchCategory(p.category, activeCategory),
          );

    if (mlResults === null && q && q.trim()) {
      list = advancedSearch(list, q.trim());
    }

    // Public approval filter
    list = list.filter((p) => {
      const isApproved = p.status === "approved" || !p.status;
      const isOwner = Boolean(
        user &&
        ((p.owner?.email &&
          user.email &&
          p.owner.email.toLowerCase() === user.email.toLowerCase()) ||
          (p.owner?.name &&
            user.fullName &&
            p.owner.name.toLowerCase() === user.fullName.toLowerCase())),
      );
      return isApproved || isOwner;
    });

    // Location Filter & Prioritization (Smart Metro Cluster Matching)
    if (effectiveCity) {
      const nearbyMatches = list.filter((p) =>
        isProductInLocation(p, effectiveCity),
      );
      if (nearbyMatches.length > 0) {
        list = nearbyMatches;
      } else {
        // If no products in this exact city, sort any partial matches first
        list = [...list].sort((a, b) => {
          const aIn = isProductInLocation(a, effectiveCity) ? 1 : 0;
          const bIn = isProductInLocation(b, effectiveCity) ? 1 : 0;
          return bIn - aIn;
        });
      }
    } else if (isLocationActive) {
      // In Nationwide mode, prioritize gear near the user's location at the top
      list = [...list].sort((a, b) => {
        const aIn = isProductInLocation(a, detectedCity) ? 1 : 0;
        const bIn = isProductInLocation(b, detectedCity) ? 1 : 0;
        return bIn - aIn;
      });
    }

    // Max Price Filter
    if (maxPriceFilter !== null) {
      list = list.filter((p) => (p.price || 0) <= maxPriceFilter);
    }

    // Rating Filter
    if (minRatingFilter > 0) {
      list = list.filter((p) => (p.rating || 5.0) >= minRatingFilter);
    }

    // Real Authoritative Inventory Availability Filter
    if (availableOnlyFilter) {
      list = list.filter((p) => {
        if (p.availability_status !== undefined) {
          return p.availability_status === "available";
        }
        return p.available !== false;
      });
    }

    // Sorting
    switch (sort) {
      case "price_asc":
        list = [...list].sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        list = [...list].sort((a, b) => b.price - a.price);
        break;
      case "rating":
        list = [...list].sort((a, b) => (b.rating || 5) - (a.rating || 5));
        break;
      case "newest":
        list = [...list].sort((a, b) => {
          const tA = (a as Product & { created_at?: string }).created_at
            ? new Date((a as Product & { created_at?: string }).created_at!).getTime()
            : 0;
          const tB = (b as Product & { created_at?: string }).created_at
            ? new Date((b as Product & { created_at?: string }).created_at!).getTime()
            : 0;
          return tB - tA;
        });
        break;
      case "featured":
      default:
        break;
    }

    return list;
  }, [
    activeCategory,
    q,
    sort,
    mlResults,
    allProductsList,
    effectiveCity,
    maxPriceFilter,
    minRatingFilter,
    availableOnlyFilter,
    user,
  ]);

  // Pagination calculation
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (activeCategory !== "all") count++;
    if (effectiveCity) count++;
    if (maxPriceFilter !== null && maxPriceFilter < highestPriceInCatalog)
      count++;
    if (minRatingFilter > 0) count++;
    if (availableOnlyFilter) count++;
    if (q) count++;
    return count;
  }, [
    activeCategory,
    effectiveCity,
    maxPriceFilter,
    highestPriceInCatalog,
    minRatingFilter,
    availableOnlyFilter,
    q,
  ]);

  // Categories list
  const displayCategories = useMemo(() => {
    const list: Array<{ id: string; name: string; count?: number }> = [
      { id: "all", name: "All Gear", count: allProductsList.length },
    ];

    if (liveCategories.length > 0) {
      liveCategories.forEach((cat) => {
        const matchingCount = allProductsList.filter((p) =>
          matchCategory(p.category, cat.id),
        ).length;
        list.push({
          id: cat.id,
          name: cat.name,
          count: matchingCount,
        });
      });
    } else {
      const standardKeys = [
        "cameras",
        "drones",
        "laptops",
        "audio",
        "lighting",
      ];
      standardKeys.forEach((key) => {
        const matchingCount = allProductsList.filter((p) =>
          matchCategory(p.category, key),
        ).length;
        list.push({
          id: key,
          name: key.charAt(0).toUpperCase() + key.slice(1),
          count: matchingCount,
        });
      });
    }
    return list;
  }, [liveCategories, allProductsList]);

  return (
    <MainLayout>
      {/* 1. BROWSE HERO */}
      <section className="relative overflow-hidden bg-neutral-50/70 dark:bg-[#05090D] border-b border-black/10 dark:border-white/10 pt-10 pb-8 sm:pt-14 sm:pb-12 transition-colors duration-300">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-gradient-to-b from-neutral-200/30 dark:from-[#0B1522] to-transparent rounded-full blur-[140px] pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            {/* Eyebrow */}
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-block w-2 h-2 rounded-full bg-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-[#AAB3BC]">
                Explore The Gear
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-neutral-950 dark:text-white leading-[1.1]">
              Find the gear <br />
              <span className="underline decoration-neutral-400 dark:decoration-neutral-600 underline-offset-8">
                behind your next story.
              </span>
            </h1>

            {/* Supporting Text */}
            <p className="mt-4 text-sm sm:text-base text-neutral-600 dark:text-[#AAB3BC] leading-relaxed max-w-2xl">
              Discover professional cameras, drones, laptops, audio gear,
              lighting and more with verified real-time gear availability.
            </p>
          </div>

          {/* 2. REBALANCED BROWSE SEARCH BAR (KEYWORD + AUTO-LOCATION ONLY) */}
          <div className="mt-8 max-w-4xl">
            <form
              onSubmit={handleSearchSubmit}
              className="p-1.5 sm:p-2 rounded-2xl sm:rounded-full bg-white dark:bg-[#0D151D] border border-black/10 dark:border-white/15 shadow-xl flex flex-col md:flex-row items-center gap-2 backdrop-blur-md"
            >
              {/* Keyword Input (flex-1 takes remaining space) */}
              <div className="flex-1 w-full flex items-center gap-2.5 px-3 py-1.5">
                <SearchIcon className="h-4 w-4 text-neutral-400 dark:text-[#AAB3BC] shrink-0" />
                <input
                  type="text"
                  value={q}
                  onChange={(e) => setLocalQ(e.target.value)}
                  placeholder="Search gear (Sony FX3, DJI Mavic, MacBook...)"
                  className="w-full bg-transparent text-xs sm:text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-[#697680] focus:outline-none"
                />
                {q && (
                  <button
                    type="button"
                    onClick={() => {
                      setLocalQ("");
                      navigate({
                        to: "/browse",
                        search: (prev: Record<string, unknown>) => ({
                          ...prev,
                          q: undefined,
                        }),
                      });
                    }}
                    className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Divider */}
              <div className="hidden md:block h-6 w-px bg-black/10 dark:bg-white/15 shrink-0" />

              {/* Auto Location Chip (No manual dropdown) */}
              <div className="w-full md:w-auto flex items-center justify-between md:justify-start gap-1.5 px-3 py-1.5 bg-black/[0.03] dark:bg-white/[0.04] rounded-xl md:rounded-full border border-black/5 dark:border-white/5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsNationwide(!isNationwide)}
                  title={
                    isDetecting
                      ? "Detecting location..."
                      : isLocationActive
                        ? isNationwide
                          ? `Showing nationwide gear. Click to filter by ${detectedCity}.`
                          : `Filtering by ${detectedCity}. Click to view all India.`
                        : "Location unavailable"
                  }
                  className="flex items-center gap-1.5 text-xs text-neutral-900 dark:text-white hover:opacity-80 transition-opacity cursor-pointer truncate"
                >
                  <MapPin
                    className={cn(
                      "h-3.5 w-3.5 shrink-0",
                      isLocationActive && !isNationwide
                        ? "text-primary"
                        : "text-neutral-500 dark:text-neutral-400",
                    )}
                  />
                  <span className="truncate max-w-[130px] font-medium text-xs">
                    {isDetecting
                      ? "Detecting..."
                      : isLocationActive
                        ? isNationwide
                          ? "All India"
                          : detectedCity
                        : "Location unavailable"}
                  </span>
                </button>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      detectLocation();
                    }}
                    disabled={isDetecting}
                    title="Re-detect GPS location"
                    className="p-1 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                    aria-label="Re-detect location"
                  >
                    <RotateCcw
                      className={cn("h-3 w-3", isDetecting && "animate-spin")}
                    />
                  </button>

                  {isLocationActive && (
                    <button
                      type="button"
                      onClick={() => setIsNationwide(!isNationwide)}
                      title={
                        isNationwide
                          ? `Filter by ${detectedCity}`
                          : "View all gear nationwide"
                      }
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors cursor-pointer",
                        !isNationwide
                          ? "bg-primary text-white dark:bg-primary dark:text-white shadow-xs"
                          : "bg-black/10 dark:bg-white/15 text-neutral-700 dark:text-neutral-200 hover:bg-black/20",
                      )}
                    >
                      {!isNationwide ? "Nearby" : "All India"}
                    </button>
                  )}
                </div>
              </div>

              {/* Submit Search Button (Compact at end) */}
              <button
                type="submit"
                className="w-full md:w-auto h-10 px-6 rounded-xl md:rounded-full bg-[#161616] text-[#FFFFFF] hover:bg-[#292929] active:bg-[#0B0B0B] dark:bg-[#F2F0EA] dark:text-[#0A0A0A] dark:hover:bg-[#FFFFFF] dark:active:bg-[#DCD9D1] text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <span>Search</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </form>

            {/* Quick Popular Searches */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[11px] font-semibold text-neutral-400 dark:text-[#697680] mr-1">
                Popular:
              </span>
              {popularQueries.slice(0, 5).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setLocalQ(tag);
                    navigate({
                      to: "/browse",
                      search: (prev: Record<string, unknown>) => ({
                        ...prev,
                        q: tag,
                      }),
                    });
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-0.5 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-neutral-700 dark:text-[#AAB3BC] text-[11px] transition-colors cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. CATEGORY DISCOVERY STRIP */}
      <section className="bg-white dark:bg-[#071017] border-b border-black/10 dark:border-white/10 sticky top-[72px] z-30 transition-colors backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {displayCategories.map((c) => {
              const IconComp = categoryIconMap[c.id.toLowerCase()] || Layers;
              const isActive =
                activeCategory === c.id ||
                (activeCategory === "all" && c.id === "all");
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleCategorySelect(c.id)}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer border",
                    isActive
                      ? "bg-[#161616] text-white border-[#161616] dark:bg-[#F2F0EA] dark:text-[#0A0A0A] dark:border-[#F2F0EA] shadow-sm"
                      : "bg-transparent text-neutral-700 dark:text-[#AAB3BC] border-black/10 dark:border-white/15 hover:border-black/30 dark:hover:border-white/30 hover:bg-black/5 dark:hover:bg-white/5",
                  )}
                >
                  <IconComp
                    className={cn(
                      "h-3.5 w-3.5",
                      isActive
                        ? "text-primary"
                        : "text-neutral-500 dark:text-[#697680]",
                    )}
                  />
                  <span>{c.name}</span>
                  {c.count !== undefined && (
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold",
                        isActive
                          ? "bg-white/20 text-white dark:bg-black/15 dark:text-black"
                          : "bg-black/5 dark:bg-white/10 text-neutral-500 dark:text-[#8D98A3]",
                      )}
                    >
                      {c.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. MAIN BROWSE LAYOUT */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/10 dark:border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black tracking-tight text-neutral-950 dark:text-white">
                {totalItems}{" "}
                {totalItems === 1 ? "piece of gear" : "pieces of gear"}
              </h2>
              {isLocationActive && !isNationwide && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-bold">
                  <MapPin className="h-3 w-3" />
                  Nearby {detectedCity}
                </span>
              )}
              {isLocationActive && isNationwide && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 text-[11px] font-semibold">
                  All India
                </span>
              )}
              {mlResults !== null && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-bold">
                  <Sparkles className="h-3 w-3" />
                  AI Ranked
                </span>
              )}
            </div>
            {didYouMean && (
              <p className="mt-1 text-xs text-neutral-500 dark:text-[#8D98A3]">
                Did you mean:{" "}
                <button
                  type="button"
                  onClick={() => {
                    setLocalQ(didYouMean);
                    navigate({
                      to: "/browse",
                      search: (prev: Record<string, unknown>) => ({
                        ...prev,
                        q: didYouMean,
                      }),
                    });
                  }}
                  className="font-bold text-primary underline underline-offset-2 hover:opacity-80"
                >
                  {didYouMean}
                </button>
                ?
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Filter Button */}
            <button
              type="button"
              onClick={() => setIsFilterDrawerOpen(true)}
              className="lg:hidden inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-black/15 dark:border-white/20 bg-white dark:bg-[#0D151D] text-xs font-bold text-neutral-900 dark:text-white hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="h-4 w-4 rounded-full bg-primary text-white text-[10px] font-mono flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Sort Dropdown */}
            <div className="relative" ref={sortRef}>
              <button
                type="button"
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-black/15 dark:border-white/20 bg-white dark:bg-[#0D151D] text-xs font-bold text-neutral-900 dark:text-white hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              >
                <ArrowUpDown className="h-3.5 w-3.5 text-neutral-500 dark:text-[#8D98A3]" />
                <span>
                  Sort:{" "}
                  {sort === "featured"
                    ? "Recommended"
                    : sort === "newest"
                      ? "Newest"
                      : sort === "price_asc"
                        ? "Price: Low to High"
                        : sort === "price_desc"
                          ? "Price: High to Low"
                          : "Highest Rated"}
                </span>
                <ChevronDown className="h-3 w-3 text-neutral-400" />
              </button>

              {isSortOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white dark:bg-[#111A22] border border-black/10 dark:border-white/15 shadow-2xl p-1.5 z-40">
                  {[
                    { id: "featured", label: "Recommended" },
                    { id: "newest", label: "Newest" },
                    { id: "price_asc", label: "Price: Low to High" },
                    { id: "price_desc", label: "Price: High to Low" },
                    { id: "rating", label: "Highest Rated" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setSort(opt.id as SortOption);
                        setIsSortOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-1.5 text-xs rounded-xl transition-colors flex items-center justify-between",
                        sort === opt.id
                          ? "bg-black/5 dark:bg-white/10 font-bold text-neutral-950 dark:text-white"
                          : "text-neutral-700 dark:text-[#AAB3BC] hover:bg-black/5 dark:hover:bg-white/5",
                      )}
                    >
                      <span>{opt.label}</span>
                      {sort === opt.id && (
                        <Check className="h-3 w-3 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active Filter Removal Chips */}
        {(activeCategory !== "all" ||
          effectiveCity ||
          (maxPriceFilter !== null && maxPriceFilter < highestPriceInCatalog) ||
          minRatingFilter > 0 ||
          availableOnlyFilter ||
          q) && (
          <div className="flex flex-wrap items-center gap-2 pt-4">
            <span className="text-[11px] font-semibold text-neutral-400 dark:text-[#697680]">
              Active Filters:
            </span>

            {q && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/10 text-xs text-neutral-800 dark:text-[#E0E5EA] border border-black/10 dark:border-white/15">
                Query: "{q}"
                <button
                  type="button"
                  onClick={() => {
                    setLocalQ("");
                    navigate({
                      to: "/browse",
                      search: (prev: Record<string, unknown>) => ({
                        ...prev,
                        q: undefined,
                      }),
                    });
                  }}
                  className="hover:text-primary cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {activeCategory !== "all" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/10 text-xs text-neutral-800 dark:text-[#E0E5EA] border border-black/10 dark:border-white/15">
                Category: {activeCategory}
                <button
                  type="button"
                  onClick={() => handleCategorySelect("all")}
                  className="hover:text-primary cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {effectiveCity && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/10 text-xs text-neutral-800 dark:text-[#E0E5EA] border border-black/10 dark:border-white/15">
                Location: {effectiveCity}
                <button
                  type="button"
                  onClick={() => {
                    setIsNationwide(true);
                    if (search.city) {
                      navigate({
                        to: "/browse",
                        search: (prev: Record<string, unknown>) => ({
                          ...prev,
                          city: undefined,
                        }),
                      });
                    }
                  }}
                  className="hover:text-primary cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {maxPriceFilter !== null &&
              maxPriceFilter < highestPriceInCatalog && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/10 text-xs text-neutral-800 dark:text-[#E0E5EA] border border-black/10 dark:border-white/15">
                  Max ₹{maxPriceFilter}/day
                  <button
                    type="button"
                    onClick={() => setMaxPriceFilter(highestPriceInCatalog)}
                    className="hover:text-primary cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

            {minRatingFilter > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/10 text-xs text-neutral-800 dark:text-[#E0E5EA] border border-black/10 dark:border-white/15">
                {minRatingFilter}+ Stars
                <button
                  type="button"
                  onClick={() => setMinRatingFilter(0)}
                  className="hover:text-primary cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {availableOnlyFilter && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/10 text-xs text-neutral-800 dark:text-[#E0E5EA] border border-black/10 dark:border-white/15">
                Available Gear Only
                <button
                  type="button"
                  onClick={() => setAvailableOnlyFilter(false)}
                  className="hover:text-primary cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-bold text-primary hover:underline underline-offset-2 ml-1 cursor-pointer"
            >
              Clear All
            </button>
          </div>
        )}

        {/* 2-Column Layout (Desktop Filter + Product Grid) */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* DESKTOP FILTER PANEL */}
          <aside className="hidden lg:block lg:col-span-1 sticky top-[136px] space-y-6 p-5 rounded-2xl bg-white dark:bg-[#0D151D] border border-black/10 dark:border-white/10 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
              <span className="text-xs font-extrabold uppercase tracking-wider text-neutral-900 dark:text-white">
                Filter Gear
              </span>
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-neutral-500 hover:text-primary dark:text-[#8D98A3] dark:hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Price Range Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-2">
                <span className="text-neutral-700 dark:text-[#AAB3BC]">
                  Max Daily Rate
                </span>
                <span className="font-mono font-bold text-neutral-950 dark:text-white">
                  ₹{maxPriceFilter ?? highestPriceInCatalog}
                </span>
              </div>
              <input
                type="range"
                min={200}
                max={highestPriceInCatalog}
                step={200}
                value={maxPriceFilter ?? highestPriceInCatalog}
                onChange={(e) => {
                  setMaxPriceFilter(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="w-full accent-neutral-950 dark:accent-white cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-neutral-400 font-mono mt-1">
                <span>₹200</span>
                <span>₹{highestPriceInCatalog}</span>
              </div>
            </div>

            {/* Minimum Rating */}
            <div className="pt-3 border-t border-black/10 dark:border-white/10">
              <span className="block text-xs font-semibold text-neutral-700 dark:text-[#AAB3BC] mb-2">
                Minimum Rating
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { label: "All", val: 0 },
                  { label: "4.0★+", val: 4.0 },
                  { label: "4.5★+", val: 4.5 },
                ].map((r) => (
                  <button
                    key={r.label}
                    type="button"
                    onClick={() => {
                      setMinRatingFilter(r.val);
                      setCurrentPage(1);
                    }}
                    className={cn(
                      "py-1.5 text-xs font-bold rounded-lg border transition-colors cursor-pointer",
                      minRatingFilter === r.val
                        ? "bg-[#161616] text-white border-[#161616] dark:bg-[#F2F0EA] dark:text-[#0A0A0A] dark:border-[#F2F0EA]"
                        : "bg-transparent text-neutral-600 dark:text-[#AAB3BC] border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5",
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Availability Toggle */}
            <div className="pt-3 border-t border-black/10 dark:border-white/10">
              <label className="flex items-center justify-between text-xs font-semibold text-neutral-700 dark:text-[#AAB3BC] cursor-pointer">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
                  Available Gear Only
                </span>
                <input
                  type="checkbox"
                  checked={availableOnlyFilter}
                  onChange={(e) => {
                    setAvailableOnlyFilter(e.target.checked);
                    setCurrentPage(1);
                  }}
                  className="h-4 w-4 rounded border-black/20 dark:border-white/20 accent-neutral-950 dark:accent-white cursor-pointer"
                />
              </label>
            </div>
          </aside>

          {/* RIGHT PRODUCT GRID (Col-Span 3) */}
          <main className="col-span-1 lg:col-span-3">
            {/* LOADING STATE */}
            {isLoadingProducts && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-[22px] bg-white dark:bg-[#0D151D] border border-black/10 dark:border-white/10 p-4 space-y-3 animate-pulse"
                  >
                    <div className="aspect-[16/11] rounded-xl bg-neutral-200 dark:bg-neutral-800" />
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4" />
                    <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2" />
                    <div className="h-5 bg-neutral-200 dark:bg-neutral-800 rounded w-1/3 pt-2" />
                  </div>
                ))}
              </div>
            )}

            {/* ERROR STATE */}
            {!isLoadingProducts && fetchError && (
              <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#0D151D] border border-black/10 dark:border-white/10">
                <p className="text-base font-bold text-neutral-900 dark:text-white">
                  Unable to load gear.
                </p>
                <p className="mt-1 text-xs text-neutral-500 dark:text-[#8D98A3]">
                  There was a network or server communication error.
                </p>
                <button
                  type="button"
                  onClick={fetchPublicProducts}
                  className="mt-4 inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#161616] text-white dark:bg-[#F2F0EA] dark:text-[#0A0A0A] text-xs font-bold transition-all cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Try Again</span>
                </button>
              </div>
            )}

            {/* EMPTY STATE */}
            {!isLoadingProducts &&
              !fetchError &&
              filteredProducts.length === 0 && (
                <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#0D151D] border border-black/10 dark:border-white/10">
                  <SearchIcon className="h-10 w-10 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                    No gear matches your filters.
                  </h3>
                  <p className="mt-1 text-xs text-neutral-500 dark:text-[#8D98A3] max-w-sm mx-auto">
                    Try adjusting dates, clearing your search query, or resetting filters.
                  </p>
                  <div className="mt-5 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="px-4 py-2 rounded-xl bg-[#161616] text-white dark:bg-[#F2F0EA] dark:text-[#0A0A0A] text-xs font-bold transition-all cursor-pointer"
                    >
                      Reset Filters
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleResetFilters();
                        handleCategorySelect("all");
                      }}
                      className="px-4 py-2 rounded-xl border border-black/15 dark:border-white/20 text-xs font-bold text-neutral-900 dark:text-white hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                    >
                      Browse All Gear
                    </button>
                  </div>
                </div>
              )}

            {/* REAL PRODUCTS GRID */}
            {!isLoadingProducts &&
              !fetchError &&
              paginatedProducts.length > 0 && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {paginatedProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        isDateAvailable={
                          product.availability_status !== undefined
                            ? product.availability_status === "available"
                            : product.available !== false
                        }
                        availabilityReason={product.availability_reason}
                        isNearby={
                          isLocationActive &&
                          isProductInLocation(product, detectedCity)
                        }
                      />
                    ))}
                  </div>

                  {/* 5. PAGINATION CONTROLS */}
                  {totalPages > 1 && (
                    <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-black/10 dark:border-white/10">
                      <span className="text-xs text-neutral-500 dark:text-[#8D98A3]">
                        Showing page {currentPage} of {totalPages} (
                        {totalItems} items)
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={currentPage === 1}
                          onClick={() =>
                            setCurrentPage((p) => Math.max(1, p - 1))
                          }
                          className="px-3 py-1.5 rounded-lg border border-black/10 dark:border-white/15 text-xs font-semibold text-neutral-700 dark:text-[#AAB3BC] hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                          Previous
                        </button>
                        {Array.from({ length: totalPages }).map((_, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setCurrentPage(idx + 1)}
                            className={cn(
                              "h-8 w-8 rounded-lg text-xs font-bold transition-colors cursor-pointer",
                              currentPage === idx + 1
                                ? "bg-[#161616] text-white dark:bg-[#F2F0EA] dark:text-[#0A0A0A]"
                                : "text-neutral-700 dark:text-[#AAB3BC] hover:bg-black/5 dark:hover:bg-white/5",
                            )}
                          >
                            {idx + 1}
                          </button>
                        ))}
                        <button
                          type="button"
                          disabled={currentPage === totalPages}
                          onClick={() =>
                            setCurrentPage((p) => Math.min(totalPages, p + 1))
                          }
                          className="px-3 py-1.5 rounded-lg border border-black/10 dark:border-white/15 text-xs font-semibold text-neutral-700 dark:text-[#AAB3BC] hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
          </main>
        </div>
      </section>

      {/* MOBILE FILTER DRAWER MODAL */}
      <AnimatePresence>
        {isFilterDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-[85%] max-w-sm bg-white dark:bg-[#0D151D] border-l border-black/10 dark:border-white/15 shadow-2xl p-6 z-50 overflow-y-auto lg:hidden flex flex-col justify-between"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-neutral-950 dark:text-white">
                    Filter Gear
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsFilterDrawerOpen(false)}
                    className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Categories */}
                <div>
                  <span className="block text-xs font-semibold text-neutral-700 dark:text-[#AAB3BC] mb-2">
                    Category
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {displayCategories.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleCategorySelect(c.id)}
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-semibold border",
                          activeCategory === c.id
                            ? "bg-[#161616] text-white border-[#161616] dark:bg-[#F2F0EA] dark:text-[#0A0A0A]"
                            : "border-black/10 dark:border-white/15 text-neutral-700 dark:text-[#AAB3BC]",
                        )}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Max Price */}
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold mb-2">
                    <span className="text-neutral-700 dark:text-[#AAB3BC]">
                      Max Daily Rate
                    </span>
                    <span className="font-mono font-bold text-neutral-950 dark:text-white">
                      ₹{maxPriceFilter ?? highestPriceInCatalog}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={200}
                    max={highestPriceInCatalog}
                    step={200}
                    value={maxPriceFilter ?? highestPriceInCatalog}
                    onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
                    className="w-full accent-neutral-950 dark:accent-white"
                  />
                </div>

                {/* Rating */}
                <div>
                  <span className="block text-xs font-semibold text-neutral-700 dark:text-[#AAB3BC] mb-2">
                    Minimum Rating
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { label: "All", val: 0 },
                      { label: "4.0★+", val: 4.0 },
                      { label: "4.5★+", val: 4.5 },
                    ].map((r) => (
                      <button
                        key={r.label}
                        type="button"
                        onClick={() => setMinRatingFilter(r.val)}
                        className={cn(
                          "py-1.5 text-xs font-bold rounded-lg border",
                          minRatingFilter === r.val
                            ? "bg-[#161616] text-white border-[#161616] dark:bg-[#F2F0EA] dark:text-[#0A0A0A]"
                            : "border-black/10 dark:border-white/15 text-neutral-600 dark:text-[#AAB3BC]",
                        )}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Availability */}
                <div>
                  <label className="flex items-center justify-between text-xs font-semibold text-neutral-700 dark:text-[#AAB3BC]">
                    <span>Available Gear Only</span>
                    <input
                      type="checkbox"
                      checked={availableOnlyFilter}
                      onChange={(e) => setAvailableOnlyFilter(e.target.checked)}
                      className="h-4 w-4 rounded accent-neutral-950 dark:accent-white"
                    />
                  </label>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-6 border-t border-black/10 dark:border-white/10 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    handleResetFilters();
                    setIsFilterDrawerOpen(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-black/15 dark:border-white/20 text-xs font-bold text-neutral-900 dark:text-white"
                >
                  Clear All
                </button>
                <button
                  type="button"
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#161616] text-white dark:bg-[#F2F0EA] dark:text-[#0A0A0A] text-xs font-bold"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </MainLayout>
  );
}
