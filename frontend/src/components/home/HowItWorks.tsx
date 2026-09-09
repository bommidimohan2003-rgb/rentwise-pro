import { Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, ChevronRight, Package, Search } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Search,
    title: "Find Your Gear",
    description: "Search and compare gear near you.",
  },
  {
    number: "02",
    icon: Calendar,
    title: "Reserve Securely",
    description: "Pick dates and complete payment.",
  },
  {
    number: "03",
    icon: Package,
    title: "Receive & Create",
    description: "Get doorstep delivery or pick up.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-white dark:bg-[#05090D] py-8 sm:py-10 border-b border-black/5 dark:border-white/10 text-neutral-900 dark:text-white transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Compact Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
          <div className="text-left">
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-neutral-950 dark:text-white">
                How It Works
              </h2>
              <span className="inline-block w-6 h-[3px] bg-primary rounded-full" />
            </div>
            <p className="mt-1 text-xs text-neutral-500 dark:text-[#A8B1BA]">
              Get the gear you need in just 3 simple steps.
            </p>
          </div>

          <Link
            to="/about"
            className="text-xs font-semibold text-neutral-600 dark:text-[#A8B1BA] hover:text-black dark:hover:text-white flex items-center gap-1.5 transition-colors group shrink-0"
          >
            <span>Learn More</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 text-neutral-700 dark:text-neutral-300" />
          </Link>
        </div>

        {/* 3 Compact Connected Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 lg:gap-5 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;

            return (
              <div
                key={step.number}
                className="group relative rounded-xl bg-neutral-50/90 dark:bg-[#0A1017] hover:bg-neutral-100/90 dark:hover:bg-[#0E1722] border border-black/8 dark:border-white/10 hover:border-black/25 dark:hover:border-white/25 p-3.5 sm:p-4 flex items-center gap-3.5 text-left transition-all duration-300 hover:-translate-y-0.5 shadow-xs"
              >
                {/* Number Badge + Icon */}
                <div className="relative shrink-0 flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-white dark:bg-[#121C26] border border-black/8 dark:border-white/10 group-hover:border-black/20 dark:group-hover:border-white/20 shadow-xs">
                  <Icon className="h-5 w-5 text-primary dark:text-white" />
                  <span className="absolute -top-1.5 -left-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold bg-[#161616] text-[#F2F0EA] dark:bg-[#F2F0EA] dark:text-[#161616] leading-none shadow-xs">
                    {step.number}
                  </span>
                </div>

                {/* Step Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white group-hover:text-primary dark:group-hover:text-neutral-200 transition-colors leading-tight truncate">
                    {step.title}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-[#8B98A5] mt-1 leading-snug">
                    {step.description}
                  </p>
                </div>

                {/* Micro Arrow between steps (desktop only) */}
                {idx < steps.length - 1 && (
                  <div className="hidden lg:flex items-center justify-center absolute -right-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                    <ChevronRight className="h-4 w-4 text-neutral-300 dark:text-neutral-700" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
