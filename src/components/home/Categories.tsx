import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import {
  Camera,
  Laptop,
  Plane,
  Bike,
  Hammer,
  Zap,
  ArrowRight,
  Layers,
  Sparkles,
} from "lucide-react";

const baseCategories = [
  {
    id: "cameras",
    name: "Cinema Cameras",
    desc: "4K & 8K Cinema Rigs",
    icon: Camera,
  },
  {
    id: "laptops",
    name: "Workstations",
    desc: "Apple M3 & RTX Laptops",
    icon: Laptop,
  },
  {
    id: "drones",
    name: "Aerial Drones",
    desc: "ProRes 5.1K Drones",
    icon: Plane,
  },
  {
    id: "bikes",
    name: "Luxury Rides",
    desc: "Royal Enfield & EV Bikes",
    icon: Bike,
  },
  {
    id: "tools",
    name: "Drilling Tools",
    desc: "Heavy Duty Power Tools",
    icon: Hammer,
  },
  {
    id: "powerbanks",
    name: "Power Banks",
    desc: "Solar & Portable Stations",
    icon: Zap,
  },
];

export function Categories() {
  return (
    <section className="relative overflow-hidden bg-white dark:bg-[#070A10] py-16 text-foreground dark:text-white border-y border-border dark:border-white/10">
      <div className="relative mx-auto max-w-7xl px-4 md:px-6 text-center space-y-10">
        {/* Header */}
        <div className="space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-secondary/80 dark:bg-white/5 border border-border dark:border-white/15 text-xs font-bold text-cyan-600 dark:text-cyan-400 tracking-wider uppercase">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Reserve Catalog</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground dark:text-white font-display">
            Curated Gear <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-600 dark:via-purple-400 to-cyan-600 dark:to-cyan-400">Collections</span>
          </h2>
          <p className="text-sm text-muted-foreground dark:text-neutral-400 font-medium">
            Certified flagship equipment available for immediate concierge dispatch across major metro cities.
          </p>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {baseCategories.map((cat, idx) => {
            const IconComp = cat.icon;

            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
              >
                <Link
                  to="/categories"
                  search={{ cat: cat.id }}
                  className="group relative bg-card dark:bg-gradient-to-b dark:from-white/10 dark:via-white/5 dark:to-white/0 hover:bg-secondary dark:hover:from-primary/20 border border-border dark:border-white/15 hover:border-primary/50 rounded-3xl p-5 text-center shadow-md hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-between space-y-3 cursor-pointer h-full backdrop-blur-2xl"
                >
                  <div className="h-12 w-12 rounded-2xl bg-secondary dark:bg-white/10 group-hover:bg-primary group-hover:text-primary-foreground text-foreground dark:text-white flex items-center justify-center transition-all duration-300 shadow-md group-hover:scale-110 border border-border dark:border-white/15">
                    <IconComp className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-foreground dark:text-white group-hover:text-primary transition-colors duration-300 font-display">
                      {cat.name}
                    </h3>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* View All Categories Button */}
        <div className="pt-4">
          <Link
            to="/categories"
            className="inline-flex items-center gap-2 btn-gradient text-white font-extrabold text-sm px-8 py-4 rounded-2xl shadow-xl shadow-primary/20 hover:scale-102 transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <span>Browse All Reserve Listings</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
