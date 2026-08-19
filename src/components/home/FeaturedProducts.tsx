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
    <section className="relative overflow-hidden bg-white dark:bg-[#070A10] text-foreground dark:text-white py-14 border-b border-border dark:border-white/10">
      <div className="mx-auto max-w-7xl px-4 md:px-6 space-y-16">
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
        <div className="pt-2">
          <div className="flex items-end justify-between mb-10 border-b border-border dark:border-white/10 pb-4">
            <div>
              <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-foreground dark:text-white font-display">
                Featured Gear This Week
              </h2>
              <p className="mt-1 text-xs md:text-sm text-muted-foreground dark:text-neutral-400 font-medium">
                Hand-picked flagship cameras, laptops, and drones from top-rated
                verified lenders.
              </p>
            </div>
            <Link
              to="/categories"
              className="text-xs md:text-sm font-bold text-primary hover:underline flex items-center gap-1"
            >
              Explore Marketplace &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.slice(0, 8).map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
