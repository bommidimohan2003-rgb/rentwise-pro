import { Calendar, ShieldCheck, Truck, Wallet } from "lucide-react";

const trustItems = [
  {
    icon: ShieldCheck,
    title: "Verified Equipment",
    description: "Quality-checked gear",
  },
  {
    icon: Wallet,
    title: "Secure Payments",
    description: "Protected transactions",
  },
  {
    icon: Calendar,
    title: "Flexible Rentals",
    description: "Rent what you need",
  },
  {
    icon: Truck,
    title: "Pan India Delivery",
    description: "At your doorstep",
  },
];

export function TrustStrip() {
  return (
    <section className="bg-neutral-50/70 dark:bg-[#070D14] py-4 sm:py-5 border-b border-black/5 dark:border-white/5 text-neutral-900 dark:text-white transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-6">
          {trustItems.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="flex items-center gap-3 text-left p-1.5 sm:p-2 rounded-xl"
              >
                {/* Compact Icon Container */}
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-[#FF1744]/10 dark:bg-[#FF1744]/15 border border-[#FF1744]/25 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-[#FF1744]" />
                </div>

                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white leading-tight truncate">
                    {item.title}
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-neutral-500 dark:text-[#8B98A5] mt-0.5 truncate">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
