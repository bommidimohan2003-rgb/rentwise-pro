import { motion } from "framer-motion";
import { ShieldCheck, Truck, Wallet, Zap } from "lucide-react";

const items = [
  {
    icon: ShieldCheck,
    title: "Fully insured",
    body: "Every rental is protected up to ₹5 Lakhs. Rent with total peace of mind.",
    image: "1516321318423-f06f85e504b3", // Padlock/security
  },
  {
    icon: Truck,
    title: "Delivered fast",
    body: "Same-day delivery in 40+ cities. Contactless pickup available too.",
    image: "1586528116311-ad8dd3c8310d", // Delivery/courier
  },
  {
    icon: Wallet,
    title: "Save 90%+",
    body: "Skip the retail price tag. Access flagship gear when you actually need it.",
    image: "1579621970563-ebec7560ff3e", // Wallet/saving
  },
  {
    icon: Zap,
    title: "Verified lenders",
    body: "ID-checked owners with real reviews. No sketchy handoffs, ever.",
    image: "1556742044-3c52d6e88c62", // Verified shake/trust
  },
];

export function WhyChoose() {
  return (
    <section className="mx-auto max-w-7xl px-4 md:px-6 py-20">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <h2 className="text-3xl md:text-4xl font-bold">Why creators pick Payent</h2>
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
            className="card-premium overflow-hidden group flex flex-col h-full"
          >
            <div className="relative h-32 w-full overflow-hidden bg-secondary">
              <img
                src={`https://images.unsplash.com/photo-${it.image}?auto=format&fit=crop&w=600&q=80`}
                alt={it.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent" />
              <div className="absolute bottom-3 left-3 h-8 w-8 rounded-lg bg-white/10 backdrop-blur-md border border-white/10 grid place-items-center">
                <it.icon className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <h3 className="font-semibold text-lg">{it.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed flex-1">{it.body}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
