import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { testimonials } from "@/utils/mockData";

export function Testimonials() {
  return (
    <section className="mx-auto max-w-7xl px-4 md:px-6 py-20">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <h2 className="text-3xl md:text-4xl font-bold">Loved by 50k+ creators</h2>
        <p className="mt-3 text-muted-foreground">Real stories from renters worldwide.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="card-premium overflow-hidden group flex flex-col h-full"
          >
            {/* Portfolio cover photo */}
            {t.cover && (
              <div className="relative h-28 w-full overflow-hidden bg-secondary">
                <img
                  src={t.cover}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
              </div>
            )}

            <div className="p-6 pt-0 flex-1 flex flex-col relative">
              {/* User Avatar - Floating over cover */}
              <div className="relative -mt-8 mb-4 h-16 w-16 rounded-full border-4 border-background overflow-hidden bg-secondary z-10 shadow-md">
                <img src={t.avatar} alt={t.name} className="h-full w-full object-cover" />
              </div>

              <Quote className="h-5 w-5 text-primary/40 mb-3" />
              <p className="text-sm leading-relaxed italic flex-1 text-foreground/90">
                "{t.quote}"
              </p>

              <div className="mt-5 pt-3 border-t border-border/60">
                <div className="font-bold text-sm">{t.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{t.role}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
