import { useMemo, useState, useEffect } from "react";
import { Filter, Search as SearchIcon, MapPin, SlidersHorizontal, Sparkles } from "lucide-react";
import { MainLayout } from "@/layouts/MainLayout";
import { ProductCard } from "@/components/common/ProductCard";
import { categories, products } from "@/utils/mockData";
import { Button } from "@/components/common/Button";
import { cn } from "@/lib/utils";
import { useSearch, useNavigate } from "@tanstack/react-router";
import { NoSearchResults } from "@/components/states/NoSearchResults";

type Sort = "featured" | "price_asc" | "price_desc" | "rating";

export default function Categories() {
  const search = useSearch({ from: "/categories" }) as { q?: string; cat?: string };
  const navigate = useNavigate();

  const cat = search.cat || "all";
  const [q, setLocalQ] = useState(search.q || "");
  const [sort, setSort] = useState<Sort>("featured");
  const [max, setMax] = useState(10000);
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  useEffect(() => {
    setLocalQ(search.q || "");
  }, [search.q]);

  const setQ = (val: string) => {
    setLocalQ(val);
    navigate({
      to: "/categories",
      search: (prev: Record<string, unknown>) => ({ ...prev, q: val || undefined }),
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
  };

  const handleResetFilters = () => {
    setCat("all");
    setQ("");
    setMax(10000);
  };

  const filtered = useMemo(() => {
    let list = products.filter((p) => (cat === "all" ? true : p.category === cat));

    if (q) {
      const searchLower = q.toLowerCase().trim();
      const matchedCategoryIds = categories
        .filter(
          (c) =>
            c.name.toLowerCase().includes(searchLower) || c.id.toLowerCase().includes(searchLower),
        )
        .map((c) => c.id);

      list = list.filter((p) => {
        const matchesTitle = p.title.toLowerCase().includes(searchLower);
        const matchesDesc = p.description.toLowerCase().includes(searchLower);
        const matchesCategoryDirect = p.category.toLowerCase().includes(searchLower);
        const matchesCategoryName = matchedCategoryIds.includes(p.category);
        return matchesTitle || matchesDesc || matchesCategoryDirect || matchesCategoryName;
      });
    }

    list = list.filter((p) => p.price <= max);
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
  }, [cat, q, sort, max]);

  return (
    <MainLayout>
      <section className="mx-auto max-w-7xl px-4 md:px-6 py-10 space-y-8">
        
        {/* Top Location & Header Row (Reference App Mockup Style) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
          <div className="space-y-1.5 text-left">
            <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 bg-[#FF5A5F]/10 border border-[#FF5A5F]/30 text-[#FF5A5F] text-xs font-extrabold">
              <MapPin className="h-3.5 w-3.5" />
              <span>Bangalore • Mumbai • Delhi NCR</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight font-display">
              Discover <span className="text-[#FF5A5F]">Your Next Gear</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-500 font-medium">
              Browse {products.length}+ insured cameras, drones, laptops, and audio gear nearby.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="rounded-2xl bg-card border border-border p-3.5 text-center shadow-sm">
              <p className="text-xs font-bold text-slate-400">Total Items</p>
              <p className="text-xl font-extrabold text-[#FF5A5F]">{products.length}+</p>
            </div>
            <div className="rounded-2xl bg-card border border-border p-3.5 text-center shadow-sm">
              <p className="text-xs font-bold text-slate-400">Protection</p>
              <p className="text-xl font-extrabold text-[#0B2545] dark:text-white">₹5 Lakhs</p>
            </div>
          </div>
        </div>

        {/* Search Bar & Category Pills Bar (Reference App Mockup Style) */}
        <div className="space-y-4">
          <div className="relative max-w-2xl">
            <div className="flex items-center gap-3 rounded-full bg-card border border-border/90 px-4 py-3 shadow-md focus-within:border-[#FF5A5F] focus-within:ring-2 focus-within:ring-[#FF5A5F]/20 transition-all">
              <SearchIcon className="h-5 w-5 text-slate-400 shrink-0" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder-slate-400 font-medium"
                placeholder="Search Place, Camera, Drone, Laptop, or Mic..."
              />
              <button
                onClick={() => setShowMobileFilter(!showMobileFilter)}
                className="lg:hidden h-8 w-8 rounded-full bg-[#FF5A5F]/10 text-[#FF5A5F] flex items-center justify-center cursor-pointer"
                aria-label="Filter"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Category Horizontal Filter Pills (Reference App Mockup Style) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setCat("all")}
              className={cn(
                "px-5 py-2 text-xs font-extrabold rounded-full transition-all duration-200 cursor-pointer shrink-0",
                cat === "all"
                  ? "bg-[#FF5A5F] text-white shadow-md shadow-[#FF5A5F]/30"
                  : "bg-card hover:bg-secondary text-foreground border border-border"
              )}
            >
              All Items
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                className={cn(
                  "px-5 py-2 text-xs font-extrabold rounded-full transition-all duration-200 cursor-pointer shrink-0",
                  cat === c.id
                    ? "bg-[#FF5A5F] text-white shadow-md shadow-[#FF5A5F]/30"
                    : "bg-card hover:bg-secondary text-foreground border border-border"
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Main Grid & Filters Layout */}
        <div className="flex flex-col lg:flex-row gap-6 pt-2">
          {/* Desktop Filter Sidebar */}
          <aside className="lg:w-64 shrink-0 space-y-6 hidden lg:block">
            <div className="rounded-3xl bg-card border border-border p-6 shadow-sm space-y-6 text-left">
              <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2 border-b border-border pb-3">
                <Filter className="h-4 w-4 text-[#FF5A5F]" /> Filter Options
              </h3>
              
              <div className="space-y-5">
                <div>
                  <label className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">
                    Max Price: <span className="text-[#FF5A5F]">₹{max}/day</span>
                  </label>
                  <input
                    type="range"
                    min={100}
                    max={10000}
                    step={100}
                    value={max}
                    onChange={(e) => setMax(Number(e.target.value))}
                    className="w-full mt-3 accent-[#FF5A5F] cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase font-extrabold text-slate-400 tracking-wider block mb-2">
                    Sort By
                  </label>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as Sort)}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs font-bold text-foreground outline-none focus:border-[#FF5A5F]"
                  >
                    <option value="featured">Featured Items</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="rating">Top Rated</option>
                  </select>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-border hover:border-[#FF5A5F]/50 text-xs font-bold rounded-xl"
                  onClick={handleResetFilters}
                >
                  Reset Filters
                </Button>
              </div>
            </div>
          </aside>

          {/* Product Grid Area */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-500">
                Showing <span className="text-foreground font-black">{filtered.length}</span> rental listings
              </p>
              <div className="hidden lg:block">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as Sort)}
                  className="h-9 px-3 rounded-xl border border-border bg-card text-xs font-bold text-foreground outline-none"
                >
                  <option value="featured">Sort: Featured</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>
            </div>

            {filtered.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                {filtered.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
            ) : (
              <NoSearchResults
                query={q}
                onClearFilters={handleResetFilters}
              />
            )}
          </div>
        </div>

      </section>
    </MainLayout>
  );
}
