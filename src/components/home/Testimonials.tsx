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
            className="card-premium p-6"
          >
            <Quote className="h-6 w-6 text-primary mb-4" />
            <p className="text-sm leading-relaxed">"{t.quote}"</p>
            <div className="mt-6 flex items-center gap-3">
              <img src={t.avatar} alt={t.name} className="h-10 w-10 rounded-full" />
              <div>
                <div className="font-medium text-sm">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
