import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Package } from "lucide-react";
import { api } from "@/utils/api";
import type { Category } from "@/types";

import cameraImg from "@/assets/images/camera.webp";
import laptopImg from "@/assets/images/laptop.webp";
import droneImg from "@/assets/images/drone.webp";
import bikeImg from "@/assets/images/re_classic350.webp";
import toolImg from "@/assets/images/tool.webp";
import powerbankImg from "@/assets/images/powerbank.webp";

const categoryImageMap: Record<string, string> = {
  camera: cameraImg,
  cameras: cameraImg,
  laptop: laptopImg,
  laptops: laptopImg,
  drone: droneImg,
  drones: droneImg,
  bike: bikeImg,
  bikes: bikeImg,
  cycles: bikeImg,
  rides: bikeImg,
  tool: toolImg,
  tools: toolImg,
  powerbank: powerbankImg,
  powerbanks: powerbankImg,
  power: powerbankImg,
};

const defaultCategories: (Category & { description?: string })[] = [
  {
    id: "cameras",
    name: "Cameras",
    icon: "Camera",
    image: cameraImg,
    count: 18,
    description: "Cinema & Mirrorless",
    color: "bg-blue-100 text-blue-800",
  },
  {
    id: "laptops",
    name: "Laptops",
    icon: "Laptop",
    image: laptopImg,
    count: 14,
    description: "MacBook & Workstations",
    color: "bg-purple-100 text-purple-800",
  },
  {
    id: "drones",
    name: "Drones",
    icon: "Plane",
    image: droneImg,
    count: 12,
    description: "4K Cinema & FPV Rigs",
    color: "bg-emerald-100 text-emerald-800",
  },
  {
    id: "bikes",
    name: "Bikes & Rides",
    icon: "Bike",
    image: bikeImg,
    count: 9,
    description: "Royal Enfield Cruisers",
    color: "bg-amber-100 text-amber-800",
  },
  {
    id: "tools",
    name: "Power Tools",
    icon: "Hammer",
    image: toolImg,
    count: 15,
    description: "Heavy Duty Cordless",
    color: "bg-red-100 text-red-800",
  },
  {
    id: "powerbanks",
    name: "Power Stations",
    icon: "Zap",
    image: powerbankImg,
    count: 11,
    description: "Fast-Charging Packs",
    color: "bg-slate-100 text-slate-800",
  },
];

export function Categories() {
  const [categories, setCategories] = useState<(Category & { description?: string })[]>(defaultCategories);

  useEffect(() => {
    let isMounted = true;
    async function loadCategories() {
      try {
        const data = await api.getPublicCategories();
        if (isMounted && Array.isArray(data) && data.length > 0) {
          // Merge API data with photo assets
          const enriched = data.map((cat: Category) => ({
            ...cat,
            image: cat.image || categoryImageMap[cat.id.toLowerCase()] || categoryImageMap[cat.name.toLowerCase()],
          }));
          setCategories(enriched);
        }
      } catch {
        // Fallback to default rich categories on error
      }
    }
    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="relative overflow-hidden bg-neutral-50/50 dark:bg-[#05090D] py-10 sm:py-16 text-neutral-900 dark:text-white border-b border-black/5 dark:border-white/10 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-neutral-950 dark:text-white">
                Explore Gear By Category
              </h2>
              <span className="inline-block w-8 h-[3px] bg-primary rounded-full" />
            </div>
            <p className="mt-1 text-xs sm:text-sm text-neutral-500 dark:text-[#A8B1BA]">
              Professional equipment and creator gear verified for peer-to-peer rental.
            </p>
          </div>

          <Link
            to="/categories"
            className="text-xs sm:text-sm font-semibold text-neutral-600 dark:text-[#A8B1BA] hover:text-black dark:hover:text-white flex items-center gap-1.5 transition-colors group self-start sm:self-auto"
          >
            <span>View All Categories</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 text-neutral-700 dark:text-neutral-300" />
          </Link>
        </div>

        {/* Photorealistic Category Showcase Grid: 3 cards per row */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 lg:gap-5">
          {categories.map((cat) => {
            const imgSrc = cat.image || categoryImageMap[cat.id.toLowerCase()] || categoryImageMap[cat.name.toLowerCase()];

            return (
              <Link
                key={cat.id}
                to="/categories"
                search={{ cat: cat.id }}
                className="group relative rounded-xl sm:rounded-2xl overflow-hidden bg-neutral-900 border border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30 shadow-sm hover:shadow-xl dark:shadow-none backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5 cursor-pointer h-32 sm:h-44 md:h-48 lg:h-52 flex flex-col justify-end"
              >
                {/* Full Card Background Photo */}
                <div className="absolute inset-0 w-full h-full bg-neutral-900 overflow-hidden">
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={cat.name}
                      loading="lazy"
                      decoding="async"
                      width={300}
                      height={240}
                      className="w-full h-full object-cover filter opacity-85 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-neutral-800 text-white">
                      <Package className="h-8 w-8 opacity-70" />
                    </div>
                  )}

                  {/* Dark gradient overlay on image for crisp text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none" />
                </div>

                {/* Clean Category Title overlaid on the bottom of the image */}
                <div className="relative z-10 p-3 sm:p-3.5 text-left w-full">
                  <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-primary transition-colors leading-tight truncate">
                    {cat.name}
                  </h3>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

