import { useState, useEffect } from "react";
import { Calendar, ShieldCheck, Truck, Wallet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import verifiedGearImg from "@/assets/images/slide_verified_gear.jpg";
import secureEscrowImg from "@/assets/images/slide_secure_escrow.jpg";
import flexibleRentalsImg from "@/assets/images/slide_flexible_rentals.jpg";
import expressDeliveryImg from "@/assets/images/slide_express_delivery.jpg";

const trustItems = [
  {
    id: 0,
    icon: ShieldCheck,
    title: "Verified Equipment",
    description: "Quality-checked & tested gear from verified hosts",
    tag: "100% Inspected",
    bgImage: verifiedGearImg,
    badgeColor: "bg-white/10 text-white/90 border-white/20",
  },
  {
    id: 1,
    icon: Wallet,
    title: "Secure Payments",
    description: "Escrow protection & guaranteed fast host payouts",
    tag: "Instant Escrow",
    bgImage: secureEscrowImg,
    badgeColor: "bg-white/10 text-white/90 border-white/20",
  },
  {
    id: 2,
    icon: Calendar,
    title: "Flexible Rentals",
    description: "Custom daily, weekly & monthly flexible dates",
    tag: "Flexible Booking",
    bgImage: flexibleRentalsImg,
    badgeColor: "bg-white/10 text-white/90 border-white/20",
  },
  {
    id: 3,
    icon: Truck,
    title: "Pan India Delivery",
    description: "Fast doorstep pickup & hassle-free insured return",
    tag: "Doorstep Express",
    bgImage: expressDeliveryImg,
    badgeColor: "bg-white/10 text-white/90 border-white/20",
  },
];

export function TrustStrip() {
  const [activeIndex, setActiveIndex] = useState(0);

  // Auto-advance slides every 3 seconds without human interaction
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % trustItems.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative overflow-hidden bg-neutral-100/70 dark:bg-[#05090E] py-3 sm:py-5 border-b border-black/10 dark:border-white/10 text-neutral-900 dark:text-white transition-colors duration-300 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Main 3-Second Auto-Sliding Showcase Stage */}
        <div className="relative w-full h-[120px] sm:h-[145px] md:h-[160px] rounded-xl sm:rounded-2xl border border-black/10 dark:border-white/15 overflow-hidden shadow-md dark:shadow-xl bg-[#09111C] dark:bg-[#09111C] transition-colors duration-300">
          
          {/* Stacked Persistent Background Images with Seamless Cross-Fade (Zero White Flash) */}
          {trustItems.map((item, idx) => (
            <motion.img
              key={item.id}
              src={item.bgImage}
              alt={item.title}
              initial={false}
              animate={{
                opacity: idx === activeIndex ? 1 : 0,
                scale: idx === activeIndex ? 1.03 : 1,
              }}
              transition={{
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="absolute inset-0 w-full h-full object-cover object-center filter brightness-105 contrast-105 pointer-events-none"
            />
          ))}
          
          {/* Bottom Gradient Scrim strictly behind bottom text */}
          <div className="absolute inset-x-0 bottom-0 h-24 sm:h-28 bg-gradient-to-t from-white/95 via-white/70 to-transparent dark:from-[#05090E]/95 dark:via-[#05090E]/70 dark:to-transparent pointer-events-none transition-colors duration-300 z-10" />

          {/* Bottom Text & Icon Bar */}
          <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 md:p-5 z-20 flex items-center justify-between gap-4 w-full">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="flex items-center gap-2.5 sm:gap-3.5 max-w-xl"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-black/5 dark:bg-white/10 backdrop-blur-xl border border-black/10 dark:border-white/20 flex items-center justify-center shrink-0 shadow-sm text-neutral-900 dark:text-white transition-colors duration-300">
                  {(() => {
                    const Icon = trustItems[activeIndex].icon;
                    return <Icon className="w-4 h-4 sm:w-5 sm:h-5" />;
                  })()}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base md:text-lg font-extrabold text-neutral-950 dark:text-white tracking-tight leading-tight transition-colors duration-300">
                    {trustItems[activeIndex].title}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-neutral-600 dark:text-neutral-300 font-medium mt-0.5 transition-colors duration-300">
                    {trustItems[activeIndex].description}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Dots on Right Side */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {trustItems.map((_, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setActiveIndex(idx)}
                    className={`transition-all duration-300 rounded-full cursor-pointer ${
                      isActive
                        ? "w-6 sm:w-7 h-2 bg-primary shadow-xs shadow-primary/50"
                        : "w-2 h-2 bg-black/20 hover:bg-black/40 dark:bg-white/30 dark:hover:bg-white/60"
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}



