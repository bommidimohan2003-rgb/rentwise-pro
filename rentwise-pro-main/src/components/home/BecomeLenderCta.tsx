import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function BecomeLenderCta() {
  return (
    <section className="mx-auto max-w-7xl px-4 md:px-6 py-20">
      <div className="relative overflow-hidden rounded-[28px] border border-pink-200/70 bg-gradient-to-r from-[#FF4F9A] via-[#FF669F] to-[#FF89B6] px-6 py-10 text-white shadow-[0_20px_60px_-25px_rgba(255,79,154,0.6)] md:px-10 md:py-14">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute -bottom-10 left-12 h-32 w-32 rounded-full bg-white/15 blur-3xl" />

        <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/90">
              Grow with Payent
            </span>
            <h2 className="mt-4 text-3xl font-bold md:text-4xl">
              Turn Your Unused Items Into Income
            </h2>
            <p className="mt-3 max-w-xl text-sm text-white/90 md:text-base">
              List cameras, laptops, tools, bikes, or furniture in minutes and start earning from your unused inventory.
            </p>
          </div>

          <Link
            to="/become-lender"
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#FF4F9A] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
          >
            Become a Lender <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
