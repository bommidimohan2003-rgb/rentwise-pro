import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function CallToAction() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section
      id="cta"
      ref={ref}
      className="relative py-28 px-4 sm:px-6 overflow-hidden bg-[#000000] text-white border-t border-[#1a1a1a]"
    >
      {/* Background radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(255,90,95,0.12), transparent)",
        }}
      />

      <div className="relative max-w-5xl mx-auto">
        {/* Glass card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative rounded-3xl p-10 md:p-20 text-center overflow-hidden bg-[#0A0A0A] border border-[#222222] shadow-2xl space-y-8"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 bg-[#FF5A5F]/10 border border-[#FF5A5F]/30 text-[#FF5A5F] text-xs font-extrabold uppercase tracking-widest">
            <Sparkles className="h-3.5 w-3.5" />
            <span>START RENTING TODAY</span>
          </div>

          {/* Headline */}
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white font-display leading-tight max-w-3xl mx-auto">
            Ready to experience flagship gear <br className="hidden sm:inline" />
            <span className="text-[#FF5A5F]">without buying?</span>
          </h2>

          {/* Subtitle */}
          <p className="text-slate-400 text-sm sm:text-lg max-w-2xl mx-auto font-normal leading-relaxed">
            Join 50,000+ creators renting and earning on Payent. Insured up to ₹5 Lakhs. Doorstep express delivery.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              to="/categories"
              className="bg-[#FF5A5F] hover:bg-[#e0484d] text-white font-bold text-sm px-8 py-4 rounded-xl shadow-lg shadow-[#FF5A5F]/30 transition-all duration-200 active:scale-95 flex items-center gap-2"
            >
              <span>Browse Catalog</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/become-lender"
              className="border border-[#333333] hover:bg-[#181818] text-white font-bold text-sm px-8 py-4 rounded-xl transition-all duration-200 active:scale-95"
            >
              List Gear &amp; Earn
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
