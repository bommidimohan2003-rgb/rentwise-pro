import { Link } from "@tanstack/react-router";
import { ArrowRight, Lock, ShieldCheck, Wallet } from "lucide-react";

export function CreatorCommunity() {
  return (
    <section className="relative overflow-hidden bg-white dark:bg-[#05090D] py-12 sm:py-16 border-b border-black/10 dark:border-white/10 text-neutral-900 dark:text-white transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden border border-black/10 dark:border-white/10 bg-[#071017] shadow-2xl">
          {/* Background Cinematic Photo & Overlays */}
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1600&q=85"
              alt="Creators community filming"
              className="w-full h-full object-cover object-right sm:object-center filter brightness-60 contrast-110"
            />
            {/* Dark gradient from left to allow readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#05090D] via-[#05090D]/90 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#05090D] via-transparent to-transparent opacity-80" />
          </div>

          {/* Content Layout */}
          <div className="relative z-10 p-6 sm:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Info & CTAs */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight text-white leading-tight">
                More Than Rentals. <br />
                <span className="text-white">A Community For Creators.</span>
              </h2>

              <p className="text-sm sm:text-base text-[#A8B1BA] leading-relaxed max-w-lg">
                PAYENT is built for creators, by creators. Access high-quality gear,
                share resources, and be part of a growing creative community.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/become-lender"
                  className="btn-payent-red px-6 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-[#FF1744]/25 cursor-pointer"
                >
                  <span>Become a Lender</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  to="/about"
                  className="px-5 py-3 rounded-xl border border-white/20 hover:border-white/40 bg-[#0D151D]/80 hover:bg-[#111B24] text-white text-sm font-medium transition-colors cursor-pointer"
                >
                  Learn More
                </Link>
              </div>
            </div>

            {/* Middle Stats Badges */}
            <div className="lg:col-span-3 space-y-4 text-left border-l border-white/10 lg:pl-8">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-[#FF1744]/15 border border-[#FF1744]/30 flex items-center justify-center shrink-0">
                  <Wallet className="h-4 w-4 text-[#FF1744]" />
                </div>
                <div>
                  <div className="text-xl font-extrabold text-white">₹50K+</div>
                  <div className="text-xs text-[#A8B1BA]">Earnings for top lenders</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-[#FF1744]/15 border border-[#FF1744]/30 flex items-center justify-center shrink-0">
                  <Lock className="h-4 w-4 text-[#FF1744]" />
                </div>
                <div>
                  <div className="text-xl font-extrabold text-white">2K+</div>
                  <div className="text-xs text-[#A8B1BA]">Active gear owners</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-[#FF1744]/15 border border-[#FF1744]/30 flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-4 w-4 text-[#FF1744]" />
                </div>
                <div>
                  <div className="text-xl font-extrabold text-white">100%</div>
                  <div className="text-xs text-[#A8B1BA]">Secure payments</div>
                </div>
              </div>
            </div>

            {/* Right Side Script Typography Accent */}
            <div className="hidden lg:flex lg:col-span-2 items-center justify-end select-none pointer-events-none">
              <div className="font-serif italic text-2xl text-white/80 transform rotate-6 tracking-wide leading-tight text-right">
                Good <br />
                Gear <br />
                <span className="text-[#FF1744]">Brighter</span> <br />
                Futures
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
