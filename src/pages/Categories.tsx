import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Search as SearchIcon,
  Tag,
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
  Plus,
  ExternalLink,
  Sparkles,
  MapPin,
} from "lucide-react";
import { MainLayout } from "@/layouts/MainLayout";
import { ProductCard } from "@/components/common/ProductCard";
import { advancedSearch } from "@/utils/searchEngine";
import { searchWithML, getSearchStats } from "@/utils/smartSearch";
import type { Product, Category, User } from "@/types";
import { cn } from "@/lib/utils";
import { useSearch, useNavigate, Link } from "@tanstack/react-router";
import { NoSearchResults } from "@/components/states/NoSearchResults";
import { tracker } from "@/utils/eventTracker";
import { storage, STORAGE_KEYS } from "@/utils/storage";
import { api } from "@/utils/api";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import cameraImg from "@/assets/images/camera.png";
import laptopImg from "@/assets/images/laptop.png";
import droneImg from "@/assets/images/drone.png";
import bikeImg from "@/assets/images/bike.png";
import toolImg from "@/assets/images/tool.png";
import powerbankImg from "@/assets/images/powerbank.png";
import reClassic350Img from "@/assets/images/re_classic350.png";

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

const categoryIcons = categoryIconMap;

const matchCategory = (productCat: string, targetId: string) => {
  if (!productCat) return false;
  const pCat = productCat.toLowerCase().trim();
  const tId = targetId.toLowerCase().trim();
  if (pCat === tId) return true;
  if (
    tId === "bikes" &&
    (pCat.includes("bike") ||
      pCat.includes("ride") ||
      pCat.includes("motorcycle"))
  )
    return true;
  if (
    tId === "tools" &&
    (pCat.includes("tool") ||
      pCat.includes("drill") ||
      pCat.includes("electric"))
  )
    return true;
  if (
    tId === "powerbanks" &&
    (pCat.includes("power") ||
      pCat.includes("bank") ||
      pCat.includes("battery"))
  )
    return true;
  if (tId === "cameras" && pCat.includes("camera")) return true;
  if (
    tId === "laptops" &&
    (pCat.includes("laptop") || pCat.includes("macbook"))
  )
    return true;
  if (tId === "drones" && pCat.includes("drone")) return true;
  return false;
};

export default function Categories() {
  const { user } = useAuth();
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

  const [allProductsList, setAllProductsList] = useState<Product[]>([]);

  const fetchPublicProducts = useCallback(() => {
    api
      .getPublicProducts()
      .then((serverProducts) => {
        if (Array.isArray(serverProducts)) {
          setAllProductsList(serverProducts);
        }
      })
      .catch((err) =>
        console.warn("[Categories] Server products fetch notice:", err),
      );
  }, []);

  useEffect(() => {
    fetchPublicProducts();
    window.addEventListener("payent_products_updated", fetchPublicProducts);
    return () => {
      window.removeEventListener("payent_products_updated", fetchPublicProducts);
    };
  }, [fetchPublicProducts]);

  useEffect(() => {
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
            cat === "all" ? true : matchCategory(p.category, cat),
          );

    if (mlResults === null && q) {
      list = advancedSearch(list, q);
    }

    // Public retail security filter: Pending items are only shown to their uploader until approved by admin
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
  }, [cat, q, sort, mlResults, allProductsList, user]);

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
        name: "Electronic Drilling Tools",
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

  const referenceProducts: Product[] = useMemo(
    () => [
      {
        id: "ref-camera-1",
        title: "Sony FX3 Cinema Line Camera",
        description:
          "Full-frame cinema camera with 4K 120fps recording capability, XLR handle unit, and dual CFexpress slots.",
        price: 2500,
        image: cameraImg,
        category: "cameras",
        rating: 5.0,
        reviews: 24,
        available: true,
        isReference: true,
        owner: {
          name: "Payent Reference Catalog",
          avatar: "https://i.pravatar.cc/100?img=12",
          rating: 5.0,
        },
      },
      {
        id: "ref-laptop-1",
        title: 'MacBook Pro 16" M3 Max 64GB',
        description:
          "Monster video editing laptop with 16-core CPU, 40-core GPU, 2TB SSD, and Liquid Retina XDR display.",
        price: 1800,
        image: laptopImg,
        category: "laptops",
        rating: 5.0,
        reviews: 31,
        available: true,
        isReference: true,
        owner: {
          name: "Payent Reference Catalog",
          avatar: "https://i.pravatar.cc/100?img=32",
          rating: 5.0,
        },
      },
      {
        id: "ref-drone-1",
        title: "DJI Mavic 3 Pro Cine Premium Combo",
        description:
          "Tri-camera flagship drone with Apple ProRes support, 43-min flight time, and RC Pro remote controller.",
        price: 4200,
        image: droneImg,
        category: "drones",
        rating: 5.0,
        reviews: 18,
        available: true,
        isReference: true,
        owner: {
          name: "Payent Reference Catalog",
          avatar: "https://i.pravatar.cc/100?img=45",
          rating: 5.0,
        },
      },
      {
        id: "ref-bike-1",
        title: "Royal Enfield Classic 350 Motorcycle",
        description:
          "Classic cruiser bike with 349cc engine, dual-channel ABS, teardrop fuel tank, and comfortable riding posture.",
        price: 1200,
        image: reClassic350Img,
        category: "bikes",
        rating: 5.0,
        reviews: 15,
        available: true,
        isReference: true,
        owner: {
          name: "Payent Reference Catalog",
          avatar: "https://i.pravatar.cc/100?img=11",
          rating: 5.0,
        },
      },
      {
        id: "ref-tool-1",
        title: "DeWalt 880W Heavy-Duty Electronic Rotary Hammer Drill",
        description:
          "Professional 880W rotary hammer drill with 3.2 Joules impact energy, safety clutch, and variable speed control.",
        price: 350,
        image: toolImg,
        category: "tools",
        rating: 5.0,
        reviews: 12,
        available: true,
        isReference: true,
        owner: {
          name: "Payent Reference Catalog",
          avatar: "https://i.pravatar.cc/100?img=47",
          rating: 5.0,
        },
      },
      {
        id: "ref-powerbank-1",
        title: "Anker PowerCore 24,000mAh 140W Power Bank",
        description:
          "Ultra-high capacity 24,000mAh external battery pack with 140W fast charging and smart digital display.",
        price: 250,
        image: powerbankImg,
        category: "powerbanks",
        rating: 5.0,
        reviews: 20,
        available: true,
        isReference: true,
        owner: {
          name: "Payent Reference Catalog",
          avatar: "https://i.pravatar.cc/100?img=47",
          rating: 5.0,
        },
      },
    ],
    [],
  );

  const filteredReferenceProducts = useMemo(() => {
    if (cat === "all") return referenceProducts;
    return referenceProducts.filter((p) => matchCategory(p.category, cat));
  }, [referenceProducts, cat]);

  const [selectedCardForListing, setSelectedCardForListing] = useState<{
    id: string;
    name: string;
    image: string;
    badgeText: string;
    defaultTitle: string;
    defaultPrice: string;
    defaultDesc: string;
  } | null>(null);

  const handleOpenListingPermissionFromProduct = (product: Product) => {
    const catName =
      liveCategories.find((c) => matchCategory(c.id, product.category))?.name ||
      product.category;
    setSelectedCardForListing({
      id: product.category,
      name: catName,
      image: product.image,
      badgeText: "REFERENCE",
      defaultTitle: product.title,
      defaultPrice: product.price.toString(),
      defaultDesc: product.description,
    });
  };

  const handleConfirmListingPermission = (details: {
    title: string;
    price: number;
    description: string;
  }) => {
    if (!selectedCardForListing) return;

    const card = selectedCardForListing;
    const fallbackImg =
      card.image ||
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600";
    const newProduct: Product = {
      id: `p-custom-${Date.now()}`,
      title: (details.title || card.defaultTitle).trim(),
      description: (details.description || card.defaultDesc).trim(),
      price: details.price || Number(card.defaultPrice) || 1000,
      image: fallbackImg,
      category: card.name,
      rating: 5.0,
      reviews: 0,
      available: false,
      isReference: false,
      status: "pending",
      owner: {
        name: user ? user.fullName || user.email : "Verified Lender",
        email: user?.email || "",
        avatar: "https://i.pravatar.cc/100?img=33",
        rating: 5.0,
      },
    };

    // Submit listing directly to TiDB Cloud MySQL backend API
    const userToken =
      storage.get<string | null>(STORAGE_KEYS.token, null) ||
      (user as { token?: string })?.token;

    if (userToken) {
      api
        .createCustomProduct(userToken, newProduct)
        .then(() => {
          toast.success("Listing submitted for Admin Approval! Your product is pending review and will go live once approved by an Admin.");
          fetchPublicProducts();
          window.dispatchEvent(new CustomEvent("payent_products_updated"));
        })
        .catch((err) => {
          console.warn("Backend creation notice:", err);
          toast.error("Failed to submit listing to database.");
        });
    } else {
      toast.error("Please log in to submit a listing.");
    }

    toast.success(`Listing Confirmed!`, {
      description: `"${details.title}" has been published to ${card.name} listings.`,
    });

    setCat(card.id);
    setSelectedCardForListing(null);
  };

  const activeCategoriesList =
    liveCategories.length > 0 ? liveCategories : defaultCategories;

  // Compute category item counts dynamically using matchCategory
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allProductsList.length };
    activeCategoriesList.forEach((c) => {
      counts[c.id] = allProductsList.filter((p) =>
        matchCategory(p.category, c.id),
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
      icon: categoryIconMap[c.id] || Layers,
      count: categoryCounts[c.id] || 0,
    })),
  ];

  return (
    <MainLayout>
      <div className="space-y-6 py-4 px-4 md:px-8 max-w-7xl mx-auto">
        {/* Section Title Header */}
        <div className="text-center space-y-2 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-black text-primary tracking-wider uppercase">
            <Tag className="h-3 w-3" />
            <span>Explore Marketplace</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground font-display">
            Browse Premium Tech Gear
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground font-medium">
            Rent high-performance cameras, laptops, drones, bikes, power banks,
            and electronic tools from verified owners.
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
                    <SearchIcon className="h-3 w-3 text-primary" />
                    Trending & Popular Searches
                  </span>
                  <span className="text-[9px] text-primary font-bold">
                    Popular
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

        {/* Category Reference Items Section (Redesigned in-place) */}
        <div className="relative p-5 md:p-6 rounded-3xl border border-primary/25 bg-gradient-to-b from-card/95 via-card/80 to-card/95 backdrop-blur-2xl shadow-2xl space-y-5 transition-all overflow-hidden group/box my-4">
          {/* Ambient subtle glow background */}
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none group-hover/box:bg-primary/20 transition-all duration-700" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10 border-b border-border/60 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-primary/20 via-amber-500/20 to-primary/10 border border-primary/30 grid place-items-center text-primary shadow-inner">
                <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-black uppercase tracking-wider text-foreground font-display flex items-center gap-2">
                    Category Reference Items
                  </h2>
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30 uppercase tracking-widest">
                    Quick Guide Models
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Standard gear models for reference. Click{" "}
                  <span className="text-primary font-bold">+ Add Listing</span>{" "}
                  to publish your item instantly.
                </p>
              </div>
            </div>

            {cat !== "all" && (
              <button
                onClick={() => setCat("all")}
                className="text-xs font-extrabold text-primary hover:underline cursor-pointer flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 transition-all hover:bg-primary/20 self-start sm:self-center"
              >
                <span>Reset Category Filter</span>
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Grid of Reference Products */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 relative z-10">
            {filteredReferenceProducts.map((refProd, i) => {
              const CategoryIcon =
                categoryIcons[
                  refProd.category.toLowerCase() as keyof typeof categoryIcons
                ] ||
                categoryIcons[
                  refProd.category as keyof typeof categoryIcons
                ] ||
                Tag;

              return (
                <motion.div
                  key={refProd.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  onClick={() =>
                    handleOpenListingPermissionFromProduct(refProd)
                  }
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card/90 dark:bg-card/50 backdrop-blur-md p-3 transition-all duration-300 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/15 hover:-translate-y-1 cursor-pointer"
                >
                  {/* Top Enlarged Image Container */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-secondary/60 min-h-[165px]">
                    <img
                      src={refProd.image}
                      alt={refProd.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent opacity-90" />

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/90 text-black text-[9px] font-black uppercase tracking-wider shadow-md">
                      <CategoryIcon className="h-3 w-3" />
                      <span>Category Guide</span>
                    </div>

                    <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-amber-400 text-[10px] font-bold border border-amber-500/20">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span>{refProd.rating || 5.0}</span>
                    </div>

                    <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] font-semibold text-white/90">
                      <MapPin className="h-3 w-3 text-primary shrink-0" />
                      <span className="truncate max-w-[110px]">
                        Jubilee Hills, Hyd
                      </span>
                    </div>
                  </div>

                  {/* Body Content (Clean Card Face: Image, Title, Price, Add Listing Button) */}
                  <div className="mt-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-primary">
                        {refProd.category}
                      </div>
                      <h3 className="text-xs font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors mt-0.5">
                        {refProd.title}
                      </h3>
                    </div>

                    {/* Price & Action Button */}
                    <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between gap-1.5">
                      <div>
                        <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider block">
                          Day Rate
                        </span>
                        <span className="text-xs font-black text-foreground">
                          ₹{refProd.price.toLocaleString("en-IN")}
                          <span className="text-[10px] font-normal text-muted-foreground">
                            /day
                          </span>
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenListingPermissionFromProduct(refProd);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-black dark:bg-white text-white dark:text-black hover:bg-primary dark:hover:bg-primary hover:text-white dark:hover:text-black text-[10px] font-extrabold shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
                      >
                        <Plus className="h-3 w-3" />
                        <span>+ Add Listing</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Spelling Typo Correction Chip ("Did you mean?") */}
        {didYouMean && (
          <div className="flex items-center gap-2.5 p-3 px-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-medium">
            <Info className="h-4 w-4 shrink-0 text-amber-500" />
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
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <NoSearchResults query={q} onClearFilters={handleResetFilters} />
        )}
      </div>

      {/* Permission & Confirmation Modal */}
      {selectedCardForListing && (
        <ListingPermissionModal
          card={selectedCardForListing}
          user={user}
          onClose={() => setSelectedCardForListing(null)}
          onConfirm={handleConfirmListingPermission}
        />
      )}
    </MainLayout>
  );
}

function ListingPermissionModal({
  card,
  user,
  onClose,
  onConfirm,
}: {
  card: {
    id: string;
    name: string;
    image: string;
    badgeText: string;
    defaultTitle: string;
    defaultPrice: string;
    defaultDesc: string;
  };
  user: User | null;
  onClose: () => void;
  onConfirm: (details: {
    title: string;
    price: number;
    description: string;
  }) => void;
}) {
  const [title, setTitle] = useState(card.defaultTitle);
  const [price, setPrice] = useState(card.defaultPrice);
  const [description, setDescription] = useState(card.defaultDesc);
  const [permissionGranted, setPermissionGranted] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter an item title.");
      return;
    }
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      toast.error("Please enter a valid daily rental price.");
      return;
    }
    if (!permissionGranted) {
      toast.error("Please confirm that you authorize listing this item.");
      return;
    }
    onConfirm({
      title: title.trim(),
      price: numPrice,
      description: description.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl border border-primary/30 bg-card/95 p-6 shadow-2xl space-y-5 overflow-hidden max-h-[92vh] overflow-y-auto backdrop-blur-2xl">
        {/* Ambient subtle glow background */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between border-b border-border/60 pb-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-gradient-to-tr from-primary/20 to-amber-500/20 text-primary border border-primary/30 shadow-inner">
                <Check className="h-4 w-4 text-primary" />
              </span>
              <h2 className="text-lg font-black text-foreground tracking-tight font-display">
                Confirm Listing Permission
              </h2>
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              Review reference model details and authorize publishing under your lender account.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {/* Card Preview Banner */}
          <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-secondary/60 border border-primary/20 shadow-inner">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-card p-1 border border-border/60 flex items-center justify-center shadow-md">
              <img
                src={card.image}
                alt={card.name}
                className="h-full w-full object-cover rounded-xl"
              />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                  {card.name}
                </span>
                <span className="text-[10px] text-amber-500 font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                  {card.badgeText}
                </span>
              </div>
              <p className="text-sm font-black text-foreground truncate font-display">
                {title || card.defaultTitle}
              </p>
              <p className="text-xs font-black text-amber-500 font-mono">
                ₹{price || card.defaultPrice} / day
              </p>
            </div>
          </div>

          {/* Input Fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-extrabold text-foreground mb-1">
                Item Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border/80 bg-background text-xs font-semibold text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="e.g. Sony FX3 Cinema Camera"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-extrabold text-foreground mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={card.name}
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border/60 bg-secondary/50 text-xs font-semibold text-muted-foreground cursor-not-allowed uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-foreground mb-1">
                  Daily Price (₹)
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border/80 bg-background text-xs font-semibold text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="2500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-foreground mb-1">
                Description & Specifications
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border/80 bg-background text-xs font-semibold text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none leading-relaxed"
                placeholder="Item condition, included accessories, rental guidelines..."
              />
            </div>
          </div>

          {/* Authorization Checkbox */}
          <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
            <input
              type="checkbox"
              id="permission-check"
              checked={permissionGranted}
              onChange={(e) => setPermissionGranted(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-emerald-500 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
            />
            <label
              htmlFor="permission-check"
              className="text-[11px] font-medium text-foreground cursor-pointer leading-tight"
            >
              <span className="font-extrabold text-emerald-500">
                Listing Authorization:
              </span>{" "}
              I confirm I own or am authorized to rent this item, and I agree to
              list it on Payent under my account.
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-border/80 text-xs font-extrabold text-foreground hover:bg-secondary transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary via-amber-500 to-primary text-white dark:text-black text-xs font-black tracking-tight shadow-lg shadow-primary/20 hover:opacity-95 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
            >
              <Check className="h-4 w-4" />
              <span>Confirm & Publish Listing</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
