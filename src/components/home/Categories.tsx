import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Camera, Laptop, Plane, Bike, Hammer, Zap, ArrowRight, Sparkles } from "lucide-react";

const categoryList = [
  {
    id: "cameras",
    name: "Cameras",
    count: "10 Products",
    icon: Camera,
    gradient: "from-rose-500/10 to-pink-500/10 border-rose-500/20 text-rose-500",
  },
  {
    id: "laptops",
    name: "Laptops",
    count: "10 Products",
    icon: Laptop,
    gradient: "from-blue-500/10 to-indigo-500/10 border-blue-500/20 text-blue-500",
  },
  {
    id: "drones",
    name: "Drones",
    count: "8 Products",
    icon: Plane,
    gradient: "from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-500",
  },
  {
    id: "bikes",
    name: "Bikes & Rides",
    count: "11 Products",
    icon: Bike,
    gradient: "from-teal-500/10 to-cyan-500/10 border-cyan-500/20 text-cyan-500",
  },
  {
    id: "tools",
    name: "Electric Tools",
    icon: Hammer,
    count: "10 Products",
    gradient: "from-purple-500/10 to-indigo-500/10 border-indigo-500/20 text-indigo-500",
  },
  {
    id: "powerbanks",
    name: "Power Banks",
    count: "10 Products",
    icon: Zap,
    gradient: "from-amber-500/10 to-yellow-500/10 border-amber-500/20 text-amber-500",
  },
];

export function Categories() {
  return (
    <section className="bg-background py-10 text-foreground border-y border-border/50">
      <div className="mx-auto max-w-7xl px-4 md:px-6 text-center space-y-6">
        
        {/* Header */}
        <div className="space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-black text-primary tracking-wider uppercase">
            <Sparkles className="h-3 w-3" />
            <span>Popular Categories</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground font-display">
            Find What <span className="text-primary">You Need</span>
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground font-medium">
            Explore 59+ insured cameras, laptops, drones, bikes, power banks, and electric tools nearby.
          </p>
        </div>

        {/* 6 Category Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {categoryList.map((cat, idx) => {
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
                  className="group bg-card hover:bg-secondary border border-border hover:border-primary/50 rounded-2xl p-3.5 text-center shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-between space-y-2.5 cursor-pointer h-full"
                >
                  <div className="h-10 w-10 rounded-xl bg-secondary group-hover:bg-primary text-foreground group-hover:text-primary-foreground flex items-center justify-center transition-all duration-300 shadow-sm group-hover:scale-110">
                    <IconComp className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs text-foreground transition-colors duration-300">
                      {cat.name}
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-medium mt-0.5 transition-colors duration-300">
                      {cat.count}
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* View All Categories Button */}
        <div className="pt-2">
          <Link
            to="/categories"
            className="inline-flex items-center gap-2 bg-black dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-black font-extrabold text-sm px-8 py-3.5 rounded-full shadow-lg transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <span>View All 59 Listings</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

      </div>
    </section>
  );
}
