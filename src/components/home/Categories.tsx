import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Laptop, Car, Armchair, Bike, Wrench } from "lucide-react";

const categories = [
  {
    id: "electronics",
    name: "Electronics",
    count: "1200+ items",
    icon: Laptop,
  },
  {
    id: "vehicles",
    name: "Vehicles",
    count: "850+ items",
    icon: Car,
  },
  {
    id: "home-living",
    name: "Home & Living",
    count: "1500+ items",
    icon: Armchair,
  },
  {
    id: "sports-outdoors",
    name: "Sports & Outdoors",
    count: "950+ items",
    icon: Bike,
  },
  {
    id: "tools-equipment",
    name: "Tools & Equipment",
    count: "750+ items",
    icon: Wrench,
  },
];

export function Categories() {
  return (
    <section className="bg-[#F7F9FB] py-20 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 md:px-6 text-center space-y-12">
        
        {/* Header */}
        <div className="space-y-3 max-w-2xl mx-auto">
          <p className="text-xs font-extrabold tracking-widest text-[#FF5A5F] uppercase">
            POPULAR CATEGORIES
          </p>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#0B2545] font-display">
            Find What <span className="text-[#FF5A5F]">You Need</span>
          </h2>
          <p className="text-sm md:text-base text-slate-500 font-medium">
            Explore top categories and discover great items around you.
          </p>
        </div>

        {/* 5 Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
          {categories.map((cat, idx) => {
            const IconComp = cat.icon;
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
              >
                <Link
                  to="/categories"
                  className="group bg-white hover:bg-[#0B2545] border border-slate-200/80 hover:border-[#0B2545] rounded-2xl p-6 text-center shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-center space-y-4 cursor-pointer"
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
        <div>
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
