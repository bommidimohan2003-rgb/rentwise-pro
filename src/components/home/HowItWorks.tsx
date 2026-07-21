import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Search, MousePointerClick, CreditCard, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

const steps = [
  {
    number: "01",
    icon: Search,
    title: "Browse & Search",
    body: "Explore thousands of listings across categories. Use smart filters for location, price, and availability to find the perfect gear.",
    cta: "Explore Now",
    link: "/categories",
    gradient: "from-violet-500 to-purple-600",
    glow: "rgba(139,92,246,0.35)",
    bg: "rgba(139,92,246,0.08)",
  },
  {
    number: "02",
    icon: MousePointerClick,
    title: "Select & Configure",
    body: "Click any item to see full specs, lender reviews, and availability. Pick your rental dates and configure the options you need.",
    cta: "View Listings",
    link: "/categories",
    gradient: "from-blue-500 to-indigo-600",
    glow: "rgba(59,130,246,0.35)",
    bg: "rgba(59,130,246,0.08)",
  },
  {
    number: "03",
    icon: CreditCard,
    title: "Reserve & Pay",
    body: "Checkout securely, confirm your booking instantly, and track your rental from the dashboard. Return when done — it's that simple.",
    cta: "Get Started",
    link: "/register",
    gradient: "from-emerald-500 to-teal-600",
    glow: "rgba(16,185,129,0.35)",
    bg: "rgba(16,185,129,0.08)",
  },
];

export function HowItWorks() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section
      id="how-it-works"
      ref={ref}
      className="relative py-28 px-4 sm:px-6 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #06010f 0%, #080114 100%)" }}
    >
      {/* Divider line */}
      <div
        className="absolute top-0 inset-x-0 h-px pointer-events-none"
        style={{
          background: "linear-gradient(to right, transparent, rgba(139,92,246,0.3), transparent)",
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
              background: "rgba(16,185,129,0.1)",
              border: "1px solid rgba(16,185,129,0.3)",
            }}
          >
            <span className="text-xs font-semibold text-emerald-400 tracking-wider uppercase">
              Simple Process
            </span>
          </div>
          <h2
            className="text-4xl sm:text-5xl font-extrabold tracking-tight"
            style={{
              background: "linear-gradient(135deg, #ffffff 30%, #6ee7b7 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Rent in 3 simple steps
          </h2>
          <p className="mt-4 text-slate-400 text-base max-w-md mx-auto">
            From browsing to booking in minutes. No paperwork, no hassle.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
          {/* Connector line */}
          <div
            className="hidden lg:block absolute top-12 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px pointer-events-none"
            style={{
              background: "linear-gradient(to right, rgba(139,92,246,0.4), rgba(59,130,246,0.4), rgba(16,185,129,0.4))",
            }}
          />

          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.65, delay: i * 0.15 }}
              whileHover={{ y: -6 }}
              className="group relative rounded-2xl p-8 flex flex-col overflow-hidden"
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
                  background: `radial-gradient(circle at 50% 0%, ${step.bg}, transparent 70%)`,
                  border: `1px solid ${step.glow}`,
                }}
              />

              {/* Step number */}
              <div
                className="relative z-10 flex items-start justify-between mb-6"
              >
                <motion.div
                  whileHover={{ rotate: 8, scale: 1.1 }}
                  className="h-12 w-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${step.bg}, rgba(255,255,255,0.02))`,
                    border: `1px solid ${step.glow}`,
                  }}
                >
                  <step.icon className="h-6 w-6" style={{ color: step.glow.replace("0.35", "0.9") }} />
                </motion.div>
                <span
                  className="text-5xl font-black font-mono"
                  style={{ color: "rgba(255,255,255,0.04)" }}
                >
                  {step.number}
                </span>
              </div>

              <h3
                className="relative z-10 text-xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text transition-all duration-300"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${step.glow.replace("0.35", "1")}, white)`,
                  WebkitBackgroundClip: "text",
                }}
              >
                {step.title}
              </h3>
              <p className="relative z-10 text-sm text-slate-500 leading-relaxed flex-1 group-hover:text-slate-400 transition-colors">
                {step.body}
              </p>

              <div className="relative z-10 mt-6 pt-5 border-t border-white/5">
                <Link
                  to={step.link}
                  className="group/link inline-flex items-center gap-1.5 text-xs font-semibold transition-colors"
                  style={{ color: step.glow.replace("0.35", "0.8") }}
                >
                  {step.cta}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-1" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
