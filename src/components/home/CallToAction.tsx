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
      className="relative py-20 px-4 sm:px-6 overflow-hidden bg-background text-foreground border-t border-border"
    >
      <div className="relative max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="spatial-card relative rounded-3xl p-8 sm:p-14 text-center overflow-hidden bg-card border border-border space-y-6"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 bg-secondary border border-border text-foreground text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
            <span>START RENTING TODAY</span>
          </div>

          {/* Headline */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground font-display leading-tight max-w-3xl mx-auto">
            Ready to access professional gear <br className="hidden sm:inline" />
            <span className="text-muted-foreground font-normal">for your next production?</span>
          </h2>

          {/* Subtitle */}
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto font-normal leading-relaxed">
            Browse verified listings from creators near you or list your own camera gear and
            workstations to earn passive rental revenue.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
            <Link
              to="/categories"
              className="btn-gradient px-7 py-3.5 rounded-xl font-medium text-sm flex items-center gap-2 group cursor-pointer"
            >
              <span>Explore Gear Catalog</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/become-lender"
              className="px-7 py-3.5 rounded-xl font-medium text-sm border border-border bg-secondary hover:bg-secondary/80 text-foreground transition-all flex items-center gap-2 cursor-pointer"
            >
              List Gear &amp; Earn
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
