import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  ShieldCheck,
  UserCheck,
  Tag,
  Zap,
  Headphones,
  Search,
} from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "Secure Payments",
    desc: "Every transaction is encrypted and protected. Pay with confidence using any major payment method.",
    gradient: "from-violet-500 to-purple-600",
    glow: "rgba(139,92,246,0.35)",
    bg: "rgba(139,92,246,0.08)",
  },
  {
    icon: UserCheck,
    title: "Verified Users",
    desc: "All lenders undergo identity verification and reviews, so you always know who you're dealing with.",
    gradient: "from-blue-500 to-cyan-500",
    glow: "rgba(59,130,246,0.35)",
    bg: "rgba(59,130,246,0.08)",
  },
  {
    icon: Tag,
    title: "Affordable Rentals",
    desc: "Access premium electronics at a fraction of the retail price. Save up to 90% versus buying.",
    gradient: "from-emerald-500 to-teal-500",
    glow: "rgba(16,185,129,0.35)",
    bg: "rgba(16,185,129,0.08)",
  },
  {
    icon: Zap,
    title: "Instant Booking",
    desc: "Browse, select, and confirm your rental in minutes. Real-time availability and instant confirmations.",
    gradient: "from-amber-500 to-orange-500",
    glow: "rgba(245,158,11,0.35)",
    bg: "rgba(245,158,11,0.08)",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    desc: "Our dedicated support team is always available to help with any issues before, during, or after your rental.",
    gradient: "from-pink-500 to-rose-500",
    glow: "rgba(236,72,153,0.35)",
    bg: "rgba(236,72,153,0.08)",
  },
  {
    icon: Search,
    title: "Smart Search",
    desc: "Powerful filters by category, price, availability, and location let you find exactly what you need fast.",
    gradient: "from-indigo-500 to-violet-500",
    glow: "rgba(99,102,241,0.35)",
    bg: "rgba(99,102,241,0.08)",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

export function Features() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="features"
      ref={ref}
      className="relative py-28 px-4 sm:px-6 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #0a0118 0%, #080114 100%)" }}
    >
      {/* Background gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(139,92,246,0.08), transparent)",
        }}
      />

      <div className="relative max-w-7xl mx-auto">
        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5"
            style={{
              background: "rgba(139,92,246,0.12)",
              border: "1px solid rgba(139,92,246,0.3)",
            }}
          >
            <span className="text-xs font-semibold text-violet-400 tracking-wider uppercase">
              Why Payent
            </span>
          </div>
          <h2
            className="text-4xl sm:text-5xl font-extrabold tracking-tight"
            style={{
              background: "linear-gradient(135deg, #ffffff 30%, #c4b5fd 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Everything you need to rent smarter
          </h2>
          <p className="mt-4 text-slate-400 text-base max-w-xl mx-auto">
            We've built every feature to make renting electronics effortless, safe, and
            surprisingly affordable.
          </p>
        </motion.div>

        {/* Cards grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={cardVariants}
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="group relative rounded-2xl p-7 cursor-default overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                backdropFilter: "blur(20px)",
              }}
            >
              {/* Hover glow border */}
              <motion.div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at 50% 0%, ${f.glow}, transparent 70%)`,
                  border: `1px solid ${f.glow}`,
                }}
              />

              {/* Card background glow on hover */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: `radial-gradient(ellipse 80% 60% at 50% -20%, ${f.bg}, transparent)`,
                }}
              />

              {/* Icon */}
              <div
                className="relative flex-shrink-0 h-12 w-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                style={{
                  background: `linear-gradient(135deg, ${f.bg}, rgba(255,255,255,0.03))`,
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <f.icon className="h-6 w-6" style={{ color: f.glow.replace("0.35", "0.9") }} />
              </div>

              <h3 className="text-base font-bold text-white mb-2 group-hover:text-violet-300 transition-colors duration-300">
                {f.title}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed group-hover:text-slate-400 transition-colors duration-300">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
