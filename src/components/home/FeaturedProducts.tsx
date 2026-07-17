import { Link } from "@tanstack/react-router";
import { ProductCard } from "@/components/common/ProductCard";
import { products } from "@/utils/mockData";

export function FeaturedProducts() {
  return (
    <section className="mx-auto max-w-7xl px-4 md:px-6 py-20">
      <div className="flex items-end justify-between mb-10">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold">Featured this week</h2>
          <p className="mt-2 text-muted-foreground">Hand-picked gear from top-rated lenders.</p>
        </div>
        <Link to="/categories" className="text-sm font-medium text-primary hover:underline">
          Explore all →
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.slice(0, 8).map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>
    </section>
  );
}
