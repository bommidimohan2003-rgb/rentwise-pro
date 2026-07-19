import { motion } from "framer-motion";
import { stats } from "@/utils/mockData";

export function Stats() {
  return (
    <section className="mx-auto max-w-7xl px-4 md:px-6 py-10">
      <div className="card-premium py-8 px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            data-reveal
            style={{ transitionDelay: `${i * 80}ms` }}
            className="text-center"
          >
            <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {s.value}
            </div>
            <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
