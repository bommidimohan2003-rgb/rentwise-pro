import { useMemo, useState, useEffect, useRef } from "react";
import {
  Search as SearchIcon,
  Sparkles,
  Camera,
  Laptop,
  Plane,
  Bike,
  Hammer,
  Zap,
  Layers,
  X,
  ArrowUpDown,
  ChevronDown,
  Check,
  Star,
  ArrowRight,
  Info,
} from "lucide-react";
import { MainLayout } from "@/layouts/MainLayout";
import { ProductCard } from "@/components/common/ProductCard";
import { advancedSearch } from "@/utils/searchEngine";
import { searchWithML, getSearchStats } from "@/utils/smartSearch";
import type { Product, Category } from "@/types";
import { cn } from "@/lib/utils";
import { useSearch, useNavigate, Link } from "@tanstack/react-router";
import { NoSearchResults } from "@/components/states/NoSearchResults";
import { tracker } from "@/utils/eventTracker";
import { storage } from "@/utils/storage";
import { api } from "@/utils/api";

type Sort = "featured" | "price_asc" | "price_desc" | "rating";

const categoryIconMap: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  all: Layers,
  cameras: Camera,
  laptops: Laptop,
  drones: Plane,
  bikes: Bike,
  tools: Hammer,
  powerbanks: Zap,
};

export default function Categories() {
  const search = useSearch({ from: "/categories" }) as {
    q?: string;
    cat?: string;
  };
  const navigate = useNavigate();

  const cat = search.cat || "all";
  const [q, setLocalQ] = useState(search.q || "");
  const [sort, setSort] = useState<Sort>("featured");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const [mlResults, setMlResults] = useState<Product[] | null>(null);
  const [didYouMean, setDidYouMean] = useState<string | null>(null);
  const [isMLActive, setIsMLActive] = useState(false);
  const [popularQueries, setPopularQueries] = useState<string[]>([]);
  const [liveCategories, setLiveCategories] = useState<Category[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalQ(search.q || "");
  }, [search.q]);

  useEffect(() => {
    if (cat && cat !== "all") {
      tracker.browseCategory(cat);
    }
  }, [cat]);

  useEffect(() => {
    if (search.q && search.q.trim()) {
      const timer = setTimeout(() => {
        tracker.search(search.q!);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [search.q]);

  const [allProductsList, setAllProductsList] = useState<Product[]>(() => {
    return storage.get<Product[]>("payent_custom_products", []);
  });

  useEffect(() => {
    api
      .getPublicProducts()
      .then((serverProducts) => {
        if (Array.isArray(serverProducts) && serverProducts.length > 0) {
          setAllProductsList((prev) => {
            const localCustom = storage.get<Product[]>(
              "payent_custom_products",
              [],
            );
            const map = new Map<string, Product>();
            [...localCustom, ...serverProducts].forEach((p) =>
              map.set(p.id, p),
            );
            return Array.from(map.values());
          });
        }
      })
      .catch((err) =>
        console.warn("[Categories] Server products fetch notice:", err),
      );

    api
      .getPublicCategories()
      .then((cats) => {
        if (Array.isArray(cats) && cats.length > 0) {
          setLiveCategories(cats);
        }
      })
      .catch((err) =>
        console.warn("[Categories] Public categories fetch notice:", err),
      );
  }, []);

  // Fetch ML Search results asynchronously when query or category changes
  useEffect(() => {
    let isMounted = true;
    if (q && q.trim()) {
      searchWithML(allProductsList, q, cat).then((res) => {
        if (isMounted) {
          setMlResults(res.results);
          setDidYouMean(res.didYouMean);
          setIsMLActive(res.isMLPowered);
        }
      });
    } else {
      setMlResults(null);
      setDidYouMean(null);
      setIsMLActive(false);
    }
    return () => {
      isMounted = false;
    };
  }, [q, cat, allProductsList]);

  // Fetch Search Index stats & popular queries once
  useEffect(() => {
    getSearchStats().then((stats) => {
      if (stats.popularQueries && stats.popularQueries.length > 0) {
        setPopularQueries(stats.popularQueries);
      }
    });
  }, []);

  // Click outside listener for category dropdown and search suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
      if (
        searchBoxRef.current &&
        !searchBoxRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    setIsSearchFocused(false);
    navigate({
      to: "/categories",
      search: (prev: Record<string, unknown>) => ({
        ...prev,
        q: q.trim(),
      }),
    });
  };

  const setQ = (val: string) => {
    setLocalQ(val);
    navigate({
      to: "/categories",
      search: (prev: Record<string, unknown>) => ({
        ...prev,
        q: val || undefined,
      }),
      replace: true,
    });
  };

  const setCat = (newCat: string) => {
    navigate({
      to: "/categories",
      search: (prev: Record<string, unknown>) => ({
        ...prev,
        cat: newCat === "all" ? undefined : newCat,
      }),
    });
    setIsDropdownOpen(false);
  };

  const handleResetFilters = () => {
    setCat("all");
    setQ("");
    setSort("featured");
  };

  // Perform Intelligent Advanced & ML-Powered Search
  const filtered = useMemo(() => {
    let list =
      mlResults !== null
        ? mlResults
        : allProductsList.filter((p) =>
            cat === "all"
              ? true
              : p.category.toLowerCase() === cat.toLowerCase(),
          );

    if (mlResults === null && q) {
      list = advancedSearch(list, q);
    }

    switch (sort) {
      case "price_asc":
        list = [...list].sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        list = [...list].sort((a, b) => b.price - a.price);
        break;
      case "rating":
        list = [...list].sort((a, b) => b.rating - a.rating);
        break;
    }
    return list;
  }, [cat, q, sort, mlResults, allProductsList]);

  // Instant Suggestions for Search Autocomplete
  const liveSuggestions = useMemo(() => {
    if (!q || q.trim().length < 2) return [];
    if (mlResults && mlResults.length > 0) {
      return mlResults.slice(0, 5);
    }
    return advancedSearch(allProductsList, q).slice(0, 5);
  }, [q, mlResults, allProductsList]);

  const defaultCategories: Category[] = useMemo(
    () => [
      {
        id: "cameras",
        name: "Cameras",
        icon: "Camera",
        count: 0,
        color: "bg-blue-500/10 text-blue-500",
        enabled: true,
      },
      {
        id: "laptops",
        name: "Laptops",
        icon: "Laptop",
        count: 0,
        color: "bg-purple-500/10 text-purple-500",
        enabled: true,
      },
      {
        id: "drones",
        name: "Drones",
        icon: "Plane",
        count: 0,
        color: "bg-emerald-500/10 text-emerald-500",
        enabled: true,
      },
      {
        id: "bikes",
        name: "Bikes & Rides",
        icon: "Bike",
        count: 0,
        color: "bg-amber-500/10 text-amber-500",
        enabled: true,
      },
      {
        id: "tools",
        name: "Power Tools",
        icon: "Hammer",
        count: 0,
        color: "bg-red-500/10 text-red-500",
        enabled: true,
      },
      {
        id: "powerbanks",
        name: "Power Banks",
        icon: "Zap",
        count: 0,
        color: "bg-cyan-500/10 text-cyan-500",
        enabled: true,
      },
    ],
    [],
  );

  const activeCategoriesList =
    liveCategories.length > 0 ? liveCategories : defaultCategories;

  // Compute category item counts dynamically
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allProductsList.length };
    activeCategoriesList.forEach((c) => {
      counts[c.id] = allProductsList.filter(
        (p) => p.category.toLowerCase() === c.id.toLowerCase(),
      ).length;
    });
    return counts;
  }, [allProductsList, activeCategoriesList]);

  // Selected Category Info
  const selectedCatObj = activeCategoriesList.find((c) => c.id === cat);
  const selectedCatName =
    cat === "all" ? "All Categories" : selectedCatObj?.name || cat;
  const SelectedIcon = categoryIconMap[cat] || Layers;
  const selectedCount = categoryCounts[cat] || 0;

  // List of all options for the vertical dropdown
  const allCategoryOptions = [
    {
      id: "all",
      name: "All Categories",
      icon: Layers,
      count: categoryCounts.all,
    },
    ...activeCategoriesList.map((c) => ({
      id: c.id,
      name: c.name,
      icon: categoryIconMap[c.id] || Sparkles,
      count: categoryCounts[c.id] || 0,
    })),
  ];

  return (
    <MainLayout>
      <div className="space-y-6 py-4 px-4 md:px-8 max-w-7xl mx-auto">
        {/* Section Title Header */}
        <div className="text-center space-y-2 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-black text-primary tracking-wider uppercase">
            <Sparkles className="h-3 w-3" />
            <span>Explore Marketplace</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground font-display">
            Browse Premium Tech Gear
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground font-medium">
            Rent high-performance cameras, laptops, drones, bikes, power banks,
            and electric tools from verified owners.
          </p>
        </div>

        {/* Top Control Bar: Category Dropdown at TOP LEFT CORNER + Intelligent Search Bar + Sort */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* TOP LEFT CORNER: Category Dropdown Menu Button */}
          <div className="relative md:w-64 shrink-0" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between h-11 px-3.5 rounded-2xl bg-black dark:bg-white text-white dark:text-black border border-primary/50 shadow-md hover:shadow-lg transition-all cursor-pointer group"
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-lg bg-primary text-primary-foreground shrink-0">
                  <SelectedIcon className="h-4 w-4" />
                </div>
                <span className="text-xs font-black tracking-tight truncate">
                  {selectedCatName}
                </span>
                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-white/20 dark:bg-black/20 text-white dark:text-black shrink-0">
                  {selectedCount}
                </span>
              </div>

              <ChevronDown
                className={cn(
                  "h-4 w-4 text-white/80 dark:text-black/80 shrink-0 transition-transform duration-300 ml-1",
                  isDropdownOpen && "rotate-180",
                )}
              />
            </button>

            {/* Vertical Dropdown Menu List */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 w-72 mt-2 z-50 rounded-2xl bg-card border border-border shadow-2xl p-1.5 space-y-1 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
                <div className="px-3 py-1.5 text-[10px] uppercase font-black tracking-wider text-muted-foreground border-b border-border/50">
                  Select Category
                </div>

                <div className="max-h-[320px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                  {allCategoryOptions.map((opt) => {
                    const IconComp = opt.icon;
                    const isSelected = cat === opt.id;

                    return (
                      <button
                        key={opt.id}
                        onClick={() => setCat(opt.id)}
                        className={cn(
                          "w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer",
                          isSelected
                            ? "bg-primary text-primary-foreground shadow-md font-bold"
                            : "hover:bg-secondary text-foreground hover:text-primary font-medium",
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={cn(
                              "p-1.5 rounded-lg transition-all",
                              isSelected
                                ? "bg-white/20 text-white"
                                : "bg-secondary text-muted-foreground group-hover:text-primary",
                            )}
                          >
                            <IconComp className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-xs font-extrabold">
                            {opt.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "text-[9px] font-extrabold px-2 py-0.5 rounded-full",
                              isSelected
                                ? "bg-white/25 text-white"
                                : "bg-secondary/80 text-muted-foreground",
                            )}
                          >
                            {opt.count} Items
                          </span>
                          {isSelected && (
                            <Check className="h-3.5 w-3.5 text-white shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Intelligent Search Input Bar with Instant Live Suggestions Dropdown */}
          <div className="relative flex-1 w-full" ref={searchBoxRef}>
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => {
                setQ(e.target.value);
                setIsSearchFocused(true);
              }}
              placeholder="Search Sony, MacBook, Mavic, Royal Enfield, DeWalt, Anker..."
              className="w-full h-11 pl-10 pr-9 rounded-2xl bg-card border border-border/80 text-xs font-medium text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm transition-all"
            />
            {q && (
              <button
                onClick={() => setQ("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Instant Live Autocomplete Suggestions Popup */}
            {isSearchFocused && !q && popularQueries.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl bg-card border border-border shadow-2xl p-3 space-y-2 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-wider text-muted-foreground border-b border-border/50 pb-1.5">
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-primary" />
                    Trending & Popular Searches
                  </span>
                  <span className="text-[9px] text-primary font-bold">
                    ML Powered
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {popularQueries.map((pq) => (
                    <button
                      key={pq}
                      onClick={() => {
                        setQ(pq);
                        setIsSearchFocused(false);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-secondary hover:bg-primary hover:text-primary-foreground text-xs font-bold text-foreground transition-all cursor-pointer shadow-sm"
                    >
                      {pq}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isSearchFocused && q && liveSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl bg-card border border-border shadow-2xl p-2 space-y-1 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
                <div className="px-3 py-1.5 flex items-center justify-between text-[10px] uppercase font-black tracking-wider text-muted-foreground border-b border-border/50">
                  <span>Live Search Matches ({liveSuggestions.length})</span>
                  <span className="text-[9px] text-primary font-bold">
                    {isMLActive
                      ? "TF-IDF ML Engine Active"
                      : "Fuzzy & Synonym Engine Active"}
                  </span>
                </div>

                <div className="space-y-1">
                  {liveSuggestions.map((item) => (
                    <Link
                      key={item.id}
                      to="/product/$id"
                      params={{ id: item.id }}
                      onClick={() => setIsSearchFocused(false)}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-secondary transition-all group text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="h-10 w-10 rounded-lg object-cover border border-border/60 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-foreground group-hover:text-primary transition-colors truncate">
                            {item.title}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span className="capitalize font-bold text-primary">
                              {item.category}
                            </span>
                            <span>•</span>
                            <div className="flex items-center gap-0.5 text-amber-500 font-bold">
                              <Star className="h-3 w-3 fill-amber-400" />
                              <span>{item.rating.toFixed(1)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-black text-primary">
                          ₹{item.price}/day
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 shrink-0">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="h-11 px-3 rounded-2xl border border-border bg-card text-xs font-bold text-foreground outline-none cursor-pointer focus:border-primary"
            >
              <option value="featured">Sort: Featured</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>

        {/* Spelling Typo Correction Chip ("Did you mean?") */}
        {didYouMean && (
          <div className="flex items-center gap-2.5 p-3 px-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-medium">
            <Sparkles className="h-4 w-4 shrink-0 text-amber-500" />
            <span>
              Did you mean{" "}
              <button
                onClick={() => setQ(didYouMean)}
                className="font-black underline cursor-pointer text-amber-600 dark:text-amber-300 hover:text-primary transition-colors"
              >
                "{didYouMean}"
              </button>
              ?
            </span>
          </div>
        )}

        {/* Results Info Subheader */}
        <div className="flex items-center justify-between px-1 pt-1">
          <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">
            Showing{" "}
            <span className="text-foreground font-black">
              {filtered.length}
            </span>{" "}
            rental listings
            {cat !== "all" &&
              ` in ${activeCategoriesList.find((c) => c.id === cat)?.name || cat}`}
            {q && ` for "${q}"`}
          </p>

          <span className="text-xs font-bold text-muted-foreground">
            {allProductsList.length} Items Total
          </span>
        </div>

        {/* Product Cards Grid */}
        {filtered.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        ) : (
          <NoSearchResults query={q} onClearFilters={handleResetFilters} />
        )}
      </div>
    </MainLayout>
  );
}
