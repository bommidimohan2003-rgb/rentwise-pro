import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Camera,
  Laptop,
  Plane,
  Bike,
  Hammer,
  Zap,
  Mic,
  Package,
  Layers,
} from "lucide-react";
import { api } from "@/utils/api";
import type { Category } from "@/types";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  camera: Camera,
  cameras: Camera,
  laptop: Laptop,
  laptops: Laptop,
  plane: Plane,
  drone: Plane,
  drones: Plane,
  bike: Bike,
  bikes: Bike,
  cycles: Bike,
  hammer: Hammer,
  tool: Hammer,
  tools: Hammer,
  zap: Zap,
  powerbank: Zap,
  powerbanks: Zap,
  mic: Mic,
  audio: Mic,
  sound: Mic,
  all: Layers,
};

function getCategoryIcon(iconName?: string, id?: string): React.ComponentType<{ className?: string }> {
  const key = (iconName || id || "").toLowerCase().trim();
  return iconMap[key] || Package;
}

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    async function loadCategories() {
      try {
        const data = await api.getPublicCategories();
        if (isMounted) {
          if (Array.isArray(data) && data.length > 0) {
            setCategories(data);
          } else {
            // Default active category structure if API returns empty
            setCategories([
              { id: "cameras", name: "Cameras", icon: "Camera", count: 0, color: "bg-blue-100 text-blue-800" },
              { id: "laptops", name: "Laptops", icon: "Laptop", count: 0, color: "bg-purple-100 text-purple-800" },
              { id: "drones", name: "Drones", icon: "Plane", count: 0, color: "bg-emerald-100 text-emerald-800" },
              { id: "bikes", name: "Bikes & Rides", icon: "Bike", count: 0, color: "bg-amber-100 text-amber-800" },
              { id: "tools", name: "Tools", icon: "Hammer", count: 0, color: "bg-red-100 text-red-800" },
              { id: "powerbanks", name: "Power Banks", icon: "Zap", count: 0, color: "bg-slate-100 text-slate-800" },
            ]);
          }
        }
      } catch {
        if (isMounted) {
          setCategories([
            { id: "cameras", name: "Cameras", icon: "Camera", count: 0, color: "bg-blue-100 text-blue-800" },
            { id: "laptops", name: "Laptops", icon: "Laptop", count: 0, color: "bg-purple-100 text-purple-800" },
            { id: "drones", name: "Drones", icon: "Plane", count: 0, color: "bg-emerald-100 text-emerald-800" },
            { id: "bikes", name: "Bikes & Rides", icon: "Bike", count: 0, color: "bg-amber-100 text-amber-800" },
            { id: "tools", name: "Tools", icon: "Hammer", count: 0, color: "bg-red-100 text-red-800" },
            { id: "powerbanks", name: "Power Banks", icon: "Zap", count: 0, color: "bg-slate-100 text-slate-800" },
          ]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="relative overflow-hidden bg-white dark:bg-[#05090D] py-10 sm:py-14 text-neutral-900 dark:text-white border-b border-black/5 dark:border-white/10 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-neutral-950 dark:text-white">
                Explore Gear By Category
              </h2>
              <span className="inline-block w-8 h-[3px] bg-primary rounded-full" />
            </div>
            <p className="mt-1 text-xs sm:text-sm text-neutral-500 dark:text-[#A8B1BA]">
              Professional equipment for every creative vision and project.
            </p>
          </div>

          <Link
            to="/categories"
            className="text-xs sm:text-sm font-semibold text-neutral-600 dark:text-[#A8B1BA] hover:text-black dark:hover:text-white flex items-center gap-1.5 transition-colors group"
          >
            <span>View All Categories</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 text-neutral-700 dark:text-neutral-300" />
          </Link>
        </div>

        {/* Responsive Categories Showcase Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-3.5">
          {categories.map((cat) => {
            const IconComp = getCategoryIcon(cat.icon, cat.id);
            return (
              <Link
                key={cat.id}
                to="/categories"
                search={{ cat: cat.id }}
                className="group relative rounded-2xl p-4 flex flex-col justify-between overflow-hidden bg-neutral-50/90 dark:bg-[#0A1017] hover:bg-neutral-100/90 dark:hover:bg-[#0E1722] border border-black/8 dark:border-white/10 hover:border-black/25 dark:hover:border-white/25 shadow-xs hover:shadow-md dark:shadow-none transition-all duration-300 hover:-translate-y-1 cursor-pointer min-h-[140px]"
              >
                {/* Category Icon / Media Stage */}
                <div className="relative w-full h-20 rounded-xl overflow-hidden bg-gradient-to-b from-neutral-100/90 via-neutral-100/40 to-transparent dark:from-white/[0.05] dark:via-white/[0.02] dark:to-transparent flex items-center justify-center">
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-300 ease-out"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 dark:bg-white/10 text-primary dark:text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform duration-300">
                      <IconComp className="h-6 w-6" />
                    </div>
                  )}
                </div>

                {/* Card Footer: Category Name & Count */}
                <div className="pt-2 text-left">
                  <h3 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white group-hover:text-primary dark:group-hover:text-neutral-200 transition-colors leading-tight">
                    {cat.name}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-neutral-500 dark:text-[#7A8794] mt-0.5">
                    {cat.count > 0 ? `${cat.count} listings` : "Verified Gear"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
