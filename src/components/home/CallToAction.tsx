import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function CallToAction() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [hoveredBtn, setHoveredBtn] = useState<null | "browse" | "lender">(null);

  return (
    <section
      id="cta"
      ref={ref}
      className="relative py-28 px-4 sm:px-6 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #06010f 0%, #0a0118 100%)" }}
    >
      {/* Animated orbs */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute pointer-events-none"
        style={{
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)",
          top: "-20%",
          left: "-10%",
          filter: "blur(60px)",
        }}
      />
      <motion.div
        animate={{ scale: [1.2, 0.9, 1.2], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 10, repeat: Infinity, delay: 3 }}
        className="absolute pointer-events-none"
        style={{
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)",
          bottom: "-20%",
          right: "-10%",
          filter: "blur(60px)",
        }}
      />

      <div className="relative max-w-5xl mx-auto">
        {/* Glass card */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative rounded-3xl p-12 md:p-20 text-center overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(40px)",
          }}
        >
          {/* Inner gradient glow */}
          <div
            className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{
              background:
                "linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(236,72,153,0.08) 50%, rgba(59,130,246,0.12) 100%)",
            }}
          />

          {/* Sparkle badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="relative z-10 inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8"
            style={{
              background: "rgba(139,92,246,0.15)",
              border: "1px solid rgba(139,92,246,0.4)",
            }}
          >
            <Sparkles className="h-3.5 w-3.5 text-violet-400" />
            <span className="text-xs font-semibold text-violet-300 tracking-wide">
              Join 5,000+ members today
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 }}
            className="relative z-10 text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.05]"
          >
            <span
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #e2d9f3 50%, #c4b5fd 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Start Renting
            </span>
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #a78bfa 0%, #ec4899 50%, #3b82f6 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Today
            </span>
          </motion.h2>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.4 }}
            className="relative z-10 mt-6 text-base sm:text-lg text-slate-400 max-w-lg mx-auto"
          >
            Access premium electronics and tools without ownership costs. Sign up free and start
            exploring thousands of verified listings.
          </motion.p>

          {/* Perks list */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.5 }}
            className="relative z-10 mt-6 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-slate-400"
          >
            {["No credit card required", "Free account setup", "Cancel anytime"].map((perk) => (
              <span key={perk} className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-400" />
                {perk}
              </span>
            ))}
          </motion.div>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.6 }}
            className="relative z-10 mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/categories"
              id="cta-browse-btn"
              onMouseEnter={() => setHoveredBtn("browse")}
              onMouseLeave={() => setHoveredBtn(null)}
              className="group relative inline-flex items-center gap-2 rounded-full px-9 py-4 text-sm font-bold text-white overflow-hidden transition-all duration-300"
              style={{
                background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #2563eb 100%)",
                boxShadow: hoveredBtn === "browse"
                  ? "0 0 60px rgba(124,58,237,0.7), 0 4px 30px rgba(0,0,0,0.3)"
                  : "0 0 30px rgba(124,58,237,0.4), 0 4px 20px rgba(0,0,0,0.2)",
                transform: hoveredBtn === "browse" ? "translateY(-2px)" : "none",
              }}
            >
              Browse Items
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              to="/become-lender"
              id="cta-lender-btn"
              onMouseEnter={() => setHoveredBtn("lender")}
              onMouseLeave={() => setHoveredBtn(null)}
              className="group inline-flex items-center gap-2 rounded-full px-9 py-4 text-sm font-bold text-white transition-all duration-300"
              style={{
                background: hoveredBtn === "lender"
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.2)",
                backdropFilter: "blur(12px)",
                transform: hoveredBtn === "lender" ? "translateY(-2px)" : "none",
                boxShadow: hoveredBtn === "lender" ? "0 8px 32px rgba(0,0,0,0.2)" : "none",
              }}
            >
              Join as Lender
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>

          {/* Bottom decoration */}
          <div className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
            style={{ background: "linear-gradient(to right, transparent, rgba(139,92,246,0.4), transparent)" }}
          />
        </motion.div>
      </div>
    </section>
  );
}
