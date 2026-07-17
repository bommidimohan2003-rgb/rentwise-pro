import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import { categories, products } from "@/utils/mockData";
import type { Category } from "@/types";

interface CategoryCardProps {
  category: Category;
  index: number;
}

function CategoryCard({ category: c, index: i }: CategoryCardProps) {
  const Icon = (Icons[c.icon as keyof typeof Icons] ?? Icons.Package) as Icons.LucideIcon;

  // Filter products belonging to this category
  const catProducts = products.filter((p) => p.category === c.id);

  // Determine default background image (use category image or fall back to the first product image)
  const defaultBg = c.image || catProducts[0]?.image || "";
  const [bgImage, setBgImage] = useState(defaultBg);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: i * 0.05 }}
    >
      <Link
        to="/categories"
        search={{ cat: c.id } as never}
        onMouseLeave={() => setBgImage(defaultBg)}
        className="relative overflow-hidden h-[175px] rounded-2xl group flex flex-col justify-end p-5 border border-border/40 shadow-sm"
      >
        {/* Category background image */}
        {bgImage && (
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-out group-hover:scale-105"
            style={{ backgroundImage: `url(${bgImage})` }}
          />
        )}

        {/* Gradient dark overlay for readable text */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-300 group-hover:via-black/55" />

        {/* Floating icon badge */}
        <div className="absolute top-4 right-4 h-9 w-9 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 grid place-items-center transition-all duration-300 group-hover:rotate-6 group-hover:scale-105 z-10">
          <Icon className="h-4 w-4 text-white" />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full">
          <h3 className="font-bold text-white text-lg tracking-wide">{c.name}</h3>

          <div className="flex items-end justify-between mt-1 gap-2">
            <p className="text-xs text-white/70 font-medium pb-1">{c.count} listings</p>

            {/* Overlapping product model thumbnails */}
            {catProducts.length > 0 && (
              <div
                className="flex -space-x-2 overflow-hidden items-center pb-0.5"
                onClick={(e) => {
                  // Prevent link navigation when clicking product icons specifically
                  e.stopPropagation();
                }}
              >
                {catProducts.slice(0, 3).map((p) => (
                  <div
                    key={p.id}
                    onMouseEnter={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setBgImage(p.image);
                    }}
                    title={p.title}
                    className="relative h-6 w-6 rounded-full ring-2 ring-black/40 overflow-hidden cursor-pointer transition-transform hover:scale-125 hover:z-20"
                  >
                    <img src={p.image} alt={p.title} className="h-full w-full object-cover" />
                  </div>
                ))}
                {catProducts.length > 3 && (
                  <div
                    title={`${catProducts.length - 3} more models`}
                    className="flex items-center justify-center h-6 w-6 rounded-full ring-2 ring-black/40 bg-black/60 backdrop-blur-sm text-[9px] font-bold text-white/90 select-none"
                  >
                    +{catProducts.length - 3}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function Categories() {
  return (
    <section className="mx-auto max-w-7xl px-4 md:px-6 py-20">
      <div className="flex items-end justify-between mb-10">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold">Browse categories</h2>
          <p className="mt-2 text-muted-foreground">
            Explore trending gear across popular categories.
          </p>
        </div>
        <Link to="/categories" className="text-sm font-medium text-primary hover:underline">
          View all →
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((c, i) => (
          <CategoryCard key={c.id} category={c} index={i} />
        ))}
      </div>
    </section>
  );
}
