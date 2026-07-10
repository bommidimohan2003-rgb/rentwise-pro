import { useMemo, useState } from "react";
import { Filter, Search as SearchIcon } from "lucide-react";
import { MainLayout } from "@/layouts/MainLayout";
import { ProductCard } from "@/components/common/ProductCard";
import { categories, products } from "@/utils/mockData";
import { Button } from "@/components/common/Button";
import { cn } from "@/utils/cn";

type Sort = "featured" | "price_asc" | "price_desc" | "rating";

export default function Categories() {
  const [cat, setCat] = useState<string>("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("featured");
  const [max, setMax] = useState(100);

  const filtered = useMemo(() => {
    let list = products.filter((p) => (cat === "all" ? true : p.category === cat));
    if (q) list = list.filter((p) => p.title.toLowerCase().includes(q.toLowerCase()));
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
      <section className="mx-auto max-w-7xl px-4 md:px-6 py-10">
        <h1 className="text-3xl md:text-4xl font-bold">Marketplace</h1>
        <p className="mt-2 text-muted-foreground">Browse {products.length}+ items from verified lenders.</p>

        <div className="mt-8 flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-64 shrink-0 space-y-6">
            <div className="card-premium p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Filter className="h-4 w-4" /> Filters</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs uppercase text-muted-foreground">Search</label>
                  <div className="mt-1 flex items-center gap-2 rounded-xl border border-border px-3 h-10">
                    <SearchIcon className="h-4 w-4 text-muted-foreground" />
                    <input value={q} onChange={(e) => setQ(e.target.value)} className="flex-1 bg-transparent outline-none text-sm" placeholder="Search..." />
                  </div>
                </div>
                <div>
                  <label className="text-xs uppercase text-muted-foreground">Max price / day: ${max}</label>
                  <input type="range" min={5} max={100} value={max} onChange={(e) => setMax(Number(e.target.value))} className="w-full mt-2 accent-primary" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setCat("all")} className={cn("px-3 py-1.5 rounded-full text-xs font-medium border", cat === "all" ? "btn-gradient border-transparent" : "border-border hover:bg-secondary")}>All</button>
                  {categories.map((c) => (
                    <button key={c.id} onClick={() => setCat(c.id)} className={cn("px-3 py-1.5 rounded-full text-xs font-medium border", cat === c.id ? "btn-gradient border-transparent" : "border-border hover:bg-secondary")}>
                      {c.name}
                    </button>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={() => { setCat("all"); setQ(""); setMax(100); }}>
                  Reset
                </Button>
              </div>
            </div>
          </aside>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">{filtered.length} results</p>
              <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="h-10 px-3 rounded-xl border border-border bg-card text-sm">
                <option value="featured">Featured</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
            {filtered.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filtered.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
              </div>
            ) : (
              <div className="card-premium p-12 text-center text-muted-foreground">No products match your filters.</div>
            )}
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
