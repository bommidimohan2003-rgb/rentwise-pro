import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Camera, Laptop, Plane, Bike, Wrench, BatteryCharging } from "lucide-react";

const categoryList = [
  {
    id: "cameras",
    name: "Cameras",
    count: "1,200+ items",
    icon: Camera,
  },
  {
    id: "laptops",
    name: "Laptops",
    count: "950+ items",
    icon: Laptop,
  },
  {
    id: "drones",
    name: "Drones",
    count: "850+ items",
    icon: Plane,
  },
  {
    id: "bikes-rides",
    name: "Bikes & Rides",
    count: "650+ items",
    icon: Bike,
  },
  {
    id: "electric-tools",
    name: "Electric Tools",
    count: "750+ items",
    icon: Wrench,
  },
  {
    id: "power-banks",
    name: "Power Banks",
    count: "500+ items",
    icon: BatteryCharging,
  },
];

const pills = ["All", "Cameras", "Laptops", "Drones", "Bikes & Rides", "Electric Tools", "Power Banks"];

export function Categories() {
  const [activeTab, setActiveTab] = useState("All");

  const filteredCategories = activeTab === "All"
    ? categoryList
    : categoryList.filter((cat) => cat.name.toLowerCase() === activeTab.toLowerCase());

  return (
    <section className="bg-[#F7F9FB] py-20 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 md:px-6 text-center space-y-10">
        
        {/* Header */}
        <div className="space-y-3 max-w-2xl mx-auto">
          <p className="text-xs font-extrabold tracking-widest text-[#FF5A5F] uppercase">
            POPULAR CATEGORIES
          </p>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#0B2545] font-display">
            Find What <span className="text-[#FF5A5F]">You Need</span>
          </h2>
          <p className="text-sm md:text-base text-slate-500 font-medium">
            Explore top gear categories and discover great equipment around you.
          </p>
        </div>

        {/* Category Pills (Matching Image 2 design) */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-3xl mx-auto">
          {pills.map((pill) => {
            const isActive = activeTab === pill;
            return (
              <button
                key={pill}
                onClick={() => setActiveTab(pill)}
                className={`px-5 py-2.5 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-[#FF5A5F] text-white shadow-md shadow-[#FF5A5F]/30"
                    : "bg-[#0B2545]/90 hover:bg-[#0B2545] text-white border border-[#0B2545]"
                }`}
              >
                {pill}
              </button>
            );
          })}
        </div>

        {/* 6 Category Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {filteredCategories.map((cat, idx) => {
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
                  className="group bg-white hover:bg-[#0B2545] border border-slate-200/80 hover:border-[#0B2545] rounded-2xl p-6 text-center shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-center space-y-3 cursor-pointer h-full"
                >
                  <div className="h-14 w-14 rounded-2xl bg-[#FF5A5F]/10 group-hover:bg-[#FF5A5F] text-[#FF5A5F] group-hover:text-white flex items-center justify-center transition-all duration-300 shadow-sm">
                    <IconComp className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-[#0B2545] group-hover:text-white transition-colors duration-300">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-slate-400 group-hover:text-slate-300 font-medium mt-1 transition-colors duration-300">
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
            className="inline-flex items-center justify-center bg-[#FF5A5F] hover:bg-[#e0484d] text-white font-bold text-sm px-8 py-3.5 rounded-xl shadow-lg shadow-[#FF5A5F]/25 transition-all duration-200 active:scale-95"
          >
            View All Categories
          </Link>
        </div>

      </div>
    </section>
  );
}
