import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ShieldCheck, Truck, Wallet, BadgeCheck, Clock, Headphones } from "lucide-react";

const items = [
  {
    icon: ShieldCheck,
    title: "Fully Insured",
    body: "Every rental is protected up to ₹5 Lakhs. Rent with total peace of mind.",
    gradient: "from-violet-500 to-purple-600",
    glow: "rgba(139,92,246,0.3)",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    body: "Same-day delivery in 40+ cities. Contactless pickup available too.",
    gradient: "from-blue-500 to-cyan-500",
    glow: "rgba(59,130,246,0.3)",
  },
  {
    icon: Wallet,
    title: "Save 90%+",
    body: "Skip the retail price tag. Access flagship gear when you actually need it.",
    gradient: "from-emerald-500 to-teal-500",
    glow: "rgba(16,185,129,0.3)",
  },
  {
    icon: BadgeCheck,
    title: "Verified Lenders",
    body: "ID-checked owners with real reviews. No sketchy handoffs, ever.",
    gradient: "from-amber-500 to-orange-500",
    glow: "rgba(245,158,11,0.3)",
  },
  {
    icon: Clock,
    title: "Flexible Duration",
    body: "Rent by the day, week, or month. Scale rental duration to your exact needs.",
    gradient: "from-pink-500 to-rose-500",
    glow: "rgba(236,72,153,0.3)",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    body: "Round-the-clock help from our expert support team whenever you need it.",
    gradient: "from-indigo-500 to-violet-500",
    glow: "rgba(99,102,241,0.3)",
  },
];

export function WhyChoose() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section
      id="why-choose"
      ref={ref}
      className="relative py-28 px-4 sm:px-6 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #080114 0%, #0a0118 100%)" }}
    >
      {/* Ambient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 40% at 30% 50%, rgba(139,92,246,0.05), transparent)",
        }}
      />

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5"
            style={{
              background: "rgba(245,158,11,0.1)",
              border: "1px solid rgba(245,158,11,0.3)",
            }}
          >
            <span className="text-xs font-semibold text-amber-400 tracking-wider uppercase">
              Our Advantage
            </span>
          </div>
          <h2
            className="text-4xl sm:text-5xl font-extrabold tracking-tight"
            style={{
              background: "linear-gradient(135deg, #ffffff 30%, #fcd34d 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Why creators choose Payent
          </h2>
          <p className="mt-4 text-slate-400 text-base max-w-lg mx-auto">
            Built for professionals. Priced for everyone. Here's what sets us apart.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              whileHover={{ y: -6 }}
              className="group relative rounded-2xl p-7 flex items-start gap-5 overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                backdropFilter: "blur(20px)",
              }}
            >
              {/* Hover glow */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at 0% 50%, ${item.glow.replace("0.3", "0.08")}, transparent 70%)`,
                  border: `1px solid ${item.glow}`,
                }}
              />

              {/* Icon */}
              <motion.div
                whileHover={{ rotate: [0, -8, 8, 0], scale: 1.1 }}
                transition={{ duration: 0.4 }}
                className="relative flex-shrink-0 h-12 w-12 rounded-xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${item.glow.replace("0.3", "0.15")}, rgba(255,255,255,0.02))`,
                  border: `1px solid ${item.glow}`,
                }}
              >
                <item.icon
                  className="h-6 w-6"
                  style={{ color: item.glow.replace("0.3", "0.9") }}
                />
              </motion.div>

              <div className="relative">
                <h3 className="font-bold text-base text-white mb-1.5 group-hover:text-transparent group-hover:bg-clip-text transition-all duration-300"
                  style={{
                    backgroundImage: `linear-gradient(135deg, white, ${item.glow.replace("0.3", "1")})`,
                    WebkitBackgroundClip: "text",
                  }}
                >
                  {item.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed group-hover:text-slate-400 transition-colors">
                  {item.body}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
