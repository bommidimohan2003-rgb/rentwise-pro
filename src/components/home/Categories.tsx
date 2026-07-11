import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import { categories } from "@/utils/mockData";

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
        {categories.map((c, i) => {
          const Icon = (Icons[c.icon as keyof typeof Icons] ?? Icons.Package) as Icons.LucideIcon;
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to="/categories"
                search={{ cat: c.id } as never}
                className="relative overflow-hidden h-[160px] rounded-2xl group flex flex-col justify-end p-5 border border-border/40 shadow-sm"
              >
                {/* Category background image */}
                {c.image && (
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `url(${c.image})` }}
                  />
                )}

                {/* Gradient dark overlay for readable text */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent transition-opacity duration-300 group-hover:via-black/50" />

                {/* Floating icon badge */}
                <div className="absolute top-4 right-4 h-9 w-9 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 grid place-items-center transition-transform duration-300 group-hover:rotate-6">
                  <Icon className="h-4 w-4 text-white" />
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <h3 className="font-bold text-white text-lg tracking-wide">{c.name}</h3>
                  <p className="text-xs text-white/70 font-medium mt-0.5">{c.count} listings</p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
