import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { ProductCard } from "@/components/common/ProductCard";
import { RecommendationSection } from "@/components/recommendations/RecommendationSection";
import { api } from "@/utils/api";
import { useAuth } from "@/hooks/useAuth";
import { getSessionId } from "@/utils/eventTracker";
import type { Product } from "@/types";

export function FeaturedProducts() {
  const { user } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [recommendationData, setRecommendationData] = useState<{
    source: string;
    title: string;
    description: string;
    items: Product[];
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      const [recRes, prodRes] = await Promise.all([
        api.getPersonalizedRecommendations(user?.email, getSessionId()),
        api.getPublicProducts(),
      ]);
      if (isMounted) {
        if (recRes && recRes.items && recRes.items.length > 0) {
          setRecommendationData(recRes);
        }
        if (prodRes && prodRes.length > 0) {
          setFeaturedProducts(prodRes);
        }
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [user?.email]);

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-12 space-y-16">
      {/* Personalized / Trending Recommendation Surface */}
      {recommendationData && recommendationData.items.length > 0 && (
        <RecommendationSection
          title={recommendationData.title}
          subtitle={recommendationData.description}
          products={recommendationData.items}
          type={
            recommendationData.source === "personalized"
              ? "personalized"
              : "trending"
          }
          badge={
            recommendationData.source === "personalized"
              ? "Recommended For You"
              : "Trending Now"
          }
        />
      )}

      {/* Primary Featured Catalog Section */}
      <section className="pt-6">
        <div className="flex items-end justify-between mb-10 border-b border-border/60 pb-4">
          <div>
            <h2 className="text-2xl md:text-4xl font-black tracking-tight text-foreground font-display">
              Featured Gear This Week
            </h2>
            <p className="mt-1 text-xs md:text-sm text-muted-foreground font-medium">
              Hand-picked flagship cameras, laptops, and drones from top-rated
              verified lenders.
            </p>
          </div>
          <Link
            to="/categories"
            className="text-xs md:text-sm font-bold text-primary hover:underline flex items-center gap-1"
          >
            Explore Marketplace →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.slice(0, 8).map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
