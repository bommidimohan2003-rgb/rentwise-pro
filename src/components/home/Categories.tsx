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
          <p className="mt-2 text-muted-foreground">Explore trending gear across popular categories.</p>
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
                className="card-premium p-5 block group"
              >
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${c.color} grid place-items-center mb-4`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold">{c.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{c.count} listings</p>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
