import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ShieldCheck, Zap, RotateCcw, Sparkles, Search, Headphones } from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "100% Insured Equipment",
    desc: "Every rental is protected up to ₹5 Lakhs against damage or loss. Rent and list with total peace of mind.",
    glow: "rgba(255, 90, 95, 0.35)",
    bg: "rgba(255, 90, 95, 0.1)",
  },
  {
    icon: Zap,
    title: "Instant Same-Day Booking",
    desc: "No waiting period. Connect directly with local lenders and pick up your gear or get express delivery.",
    glow: "rgba(255, 90, 95, 0.35)",
    bg: "rgba(255, 90, 95, 0.1)",
  },
  {
    icon: RotateCcw,
    title: "Flexible Rental Durations",
    desc: "Need a camera for a 3-hour shoot or a drone for a 2-week trip? Customize your exact rental period effortlessly.",
    glow: "rgba(255, 90, 95, 0.35)",
    bg: "rgba(255, 90, 95, 0.1)",
  },
  {
    icon: Sparkles,
    title: "Verified Users & Gear",
    desc: "Aadhaar & DigiLocker KYC verification for all members ensures a secure, trusted peer-to-peer community.",
    glow: "rgba(255, 90, 95, 0.35)",
    bg: "rgba(255, 90, 95, 0.1)",
  },
  {
    icon: Search,
    title: "Transparent & Zero Hidden Fees",
    desc: "What you see is what you pay. Clear daily rates, refundable security deposits, and instant online receipts.",
    glow: "rgba(255, 90, 95, 0.35)",
    bg: "rgba(255, 90, 95, 0.1)",
  },
  {
    icon: Headphones,
    title: "24/7 Dedicated Support",
    desc: "Our active support team is available round-the-clock via chat or phone to assist with any rental queries.",
    glow: "rgba(255, 90, 95, 0.35)",
    bg: "rgba(255, 90, 95, 0.1)",
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
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: "easeOut" as const },
  },
};

export function Features() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section
      id="features"
      ref={ref}
      className="relative py-12 px-4 sm:px-6 overflow-hidden bg-background text-foreground border-t border-border"
    >
      {/* Subtle Dot Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#FF5A5F_1px,transparent_1px)] [background-size:32px_32px] opacity-5 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto">
        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-8 space-y-2"
        >
          <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 bg-[#FF5A5F]/10 border border-[#FF5A5F]/30 text-[#FF5A5F] text-[11px] font-extrabold tracking-widest uppercase">
            WHY PAYENT
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-display">
            Everything you need to <span className="text-[#FF5A5F]">rent smarter</span>
          </h2>
          <p className="mt-2 text-muted-foreground text-xs md:text-sm max-w-xl mx-auto font-normal">
            We've built every feature to make renting tech gear effortless, safe, and surprisingly
            affordable.
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
              className="group relative rounded-2xl p-7 cursor-default overflow-hidden bg-card border border-border hover:border-[#FF5A5F]/40 transition-all duration-300 shadow-xl"
            >
              {/* Hover glow border */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at 50% 0%, ${f.glow}, transparent 70%)`,
                }}
              />

              {/* Icon */}
              <div className="relative flex-shrink-0 h-12 w-12 rounded-xl flex items-center justify-center mb-5 bg-[#FF5A5F]/10 border border-[#FF5A5F]/20 text-[#FF5A5F] transition-transform duration-300 group-hover:scale-110">
                <f.icon className="h-6 w-6" />
              </div>

              <h3 className="text-base font-bold text-foreground mb-2 group-hover:text-[#FF5A5F] transition-colors duration-300">
                {f.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed transition-colors duration-300 font-normal">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
