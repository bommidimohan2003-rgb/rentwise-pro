import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import cameraImg from "@/assets/images/camera.png";
import droneImg from "@/assets/images/drone.png";
import laptopImg from "@/assets/images/laptop.png";
import bikeImg from "@/assets/images/bike.png";
import reClassic350Img from "@/assets/images/re_classic350.png";
import powerbankImg from "@/assets/images/powerbank.png";
import toolImg from "@/assets/images/tool.png";

interface CategoryItem {
  id: string;
  name: string;
  desc: string;
  image: string;
}

const categoriesList: CategoryItem[] = [
  {
    id: "cameras",
    name: "Cameras",
    desc: "DSLRs & Cinema",
    image: cameraImg,
  },
  {
    id: "laptops",
    name: "Laptops",
    desc: "MacBooks & PCs",
    image: laptopImg,
  },
  {
    id: "drones",
    name: "Drones",
    desc: "Aerial 4K Rigs",
    image: droneImg,
  },
  {
    id: "cycles",
    name: "Cycles",
    desc: "E-Bikes & Mountain",
    image: bikeImg,
  },
  {
    id: "bikes",
    name: "Bikes",
    desc: "Classic 350 & Tourers",
    image: reClassic350Img,
  },
  {
    id: "powerbanks",
    name: "Powerbanks",
    desc: "Power Stations",
    image: powerbankImg,
  },
  {
    id: "tools",
    name: "Drilling Machines",
    desc: "Cordless Drills",
    image: toolImg,
  },
];

export function Categories() {
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
              <span className="inline-block w-8 h-[3px] bg-[#FF1744] rounded-full" />
            </div>
            <p className="mt-1 text-xs sm:text-sm text-neutral-500 dark:text-[#A8B1BA]">
              Professional equipment for every creative vision and project.
            </p>
          </div>

          <Link
            to="/categories"
            className="text-xs sm:text-sm font-semibold text-neutral-600 dark:text-[#A8B1BA] hover:text-[#FF1744] dark:hover:text-white flex items-center gap-1.5 transition-colors group"
          >
            <span>View All Categories</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 text-[#FF1744]" />
          </Link>
        </div>

        {/* Responsive Categories Showcase Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7 gap-2.5 sm:gap-3 lg:gap-3.5">
          {categoriesList.map((cat) => (
            <Link
              key={cat.id}
              to="/categories"
              search={{ cat: cat.id }}
              className="group relative rounded-2xl p-2.5 flex flex-col justify-between overflow-hidden bg-neutral-50/90 dark:bg-[#0A1017] hover:bg-neutral-100/90 dark:hover:bg-[#0E1722] border border-black/8 dark:border-white/10 hover:border-[#FF1744]/40 dark:hover:border-[#FF1744]/50 shadow-xs hover:shadow-md dark:shadow-none transition-all duration-300 hover:-translate-y-1 cursor-pointer"
            >
              {/* Product Media Showcase Box — Enlarged & Prominently Fitted */}
              <div className="relative w-full h-34 sm:h-36 md:h-40 rounded-xl overflow-hidden bg-gradient-to-b from-neutral-100/90 via-neutral-100/40 to-transparent dark:from-white/[0.05] dark:via-white/[0.02] dark:to-transparent p-1 sm:p-1.5 flex items-center justify-center">
                {/* Subtle radial glow on hover */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,23,68,0.14)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                {/* Soft floor shadow under gear */}
                <div className="absolute bottom-1 w-24 sm:w-28 h-2.5 bg-black/10 dark:bg-black/50 rounded-[100%] blur-xs group-hover:w-32 transition-all duration-300" />

                {/* Main Product Image — Prominently Enlarged and Fitted */}
                <img
                  src={cat.image}
                  alt={cat.name}
                  loading="lazy"
                  className="relative z-5 w-full h-full object-contain filter drop-shadow-md scale-105 group-hover:scale-112 transition-transform duration-300 ease-out"
                />
              </div>

              {/* Card Footer: Category Name & Subtitle */}
              <div className="pt-2.5 pb-0.5 px-0.5 text-left">
                <h3 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white group-hover:text-[#FF1744] transition-colors leading-tight">
                  {cat.name}
                </h3>
                <p className="text-[10px] sm:text-[11px] text-neutral-500 dark:text-[#7A8794] mt-0.5 line-clamp-1">
                  {cat.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
