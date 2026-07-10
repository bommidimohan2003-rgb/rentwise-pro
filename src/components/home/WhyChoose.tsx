import { motion } from "framer-motion";
import { ShieldCheck, Truck, Wallet, Zap } from "lucide-react";

const items = [
  { icon: ShieldCheck, title: "Fully insured", body: "Every rental is protected up to $50k. Rent with total peace of mind." },
  { icon: Truck, title: "Delivered fast", body: "Same-day delivery in 40+ cities. Contactless pickup available too." },
  { icon: Wallet, title: "Save 90%+", body: "Skip the retail price tag. Access flagship gear when you actually need it." },
  { icon: Zap, title: "Verified lenders", body: "ID-checked owners with real reviews. No sketchy handoffs, ever." },
];

export function WhyChoose() {
  return (
    <section className="mx-auto max-w-7xl px-4 md:px-6 py-20">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <h2 className="text-3xl md:text-4xl font-bold">Why creators pick TechRent</h2>
        <p className="mt-3 text-muted-foreground">Built for pros. Priced for everyone.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((it, i) => (
          <motion.div
            key={it.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="card-premium p-6"
          >
            <div className="h-11 w-11 rounded-xl btn-gradient grid place-items-center mb-4">
              <it.icon className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-semibold text-lg">{it.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{it.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
