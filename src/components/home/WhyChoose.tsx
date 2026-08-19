import { motion } from "framer-motion";
import { ShieldCheck, Lock, Headphones, Award, Sparkles, RefreshCw } from "lucide-react";

const brandValues = [
  {
    icon: ShieldCheck,
    title: "Escrow Deposit Security",
    subtitle: "Razorpay-backed escrow protection keeps funds 100% safe until return.",
    badge: "Escrow Shield",
  },
  {
    icon: Award,
    title: "Biometric Identity Pass",
    subtitle: "Every lender & renter undergoes instant government KYC verification.",
    badge: "ID Verified",
  },
  {
    icon: RefreshCw,
    title: "Zero Capital Depreciation",
    subtitle: "Never waste ₹4L+ on tech gear that depreciates before your next shoot.",
    badge: "Asset Smart",
  },
  {
    icon: Headphones,
    title: "24/7 Production Concierge",
    subtitle: "Dedicated live tech assistance and replacement gear dispatch in 2 hours.",
    badge: "Concierge 24/7",
  },
];

export function WhyChoose() {
  return (
    <section className="relative overflow-hidden bg-white dark:bg-[#0A0E17] py-16 md:py-24 border-t border-b border-border dark:border-white/10 text-foreground dark:text-white">
      {/* Ambient Radial Spotlights */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-80 h-80 bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-80 h-80 bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary/80 dark:bg-white/5 border border-border dark:border-white/15 text-xs font-bold text-amber-600 dark:text-amber-400 tracking-wider uppercase">
            <Sparkles className="h-3.5 w-3.5" />
            <span>The Payent Standard</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight font-display text-foreground dark:text-white">
            Built for High-End Creators &{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-600 dark:via-purple-400 to-cyan-600 dark:to-cyan-400">
              Luxury Film Productions.
            </span>
          </h2>
          <p className="text-sm md:text-base text-muted-foreground dark:text-neutral-400 font-medium">
            Standard rental houses charge exorbitant deposits and rigid 24-hour penalties. Payent gives you liquid access to certified, insured tech hardware at your terms.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {brandValues.map((item, idx) => {
            const IconComp = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group relative p-6 rounded-3xl border border-border dark:border-white/15 bg-card dark:bg-gradient-to-b dark:from-white/10 dark:via-white/5 dark:to-white/0 backdrop-blur-2xl shadow-md hover:shadow-xl hover:border-primary/50 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-12 w-12 rounded-2xl bg-secondary dark:bg-white/10 text-primary flex items-center justify-center border border-border dark:border-white/15 group-hover:scale-110 transition-transform">
                      <IconComp className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground dark:text-neutral-400 px-2.5 py-1 rounded-full bg-secondary dark:bg-white/5 border border-border dark:border-white/10">
                      {item.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-base text-foreground dark:text-white group-hover:text-primary transition-colors font-display">
                      {item.title}
                    </h3>
                    <p className="text-xs text-muted-foreground dark:text-neutral-400 font-medium mt-1.5 leading-relaxed">
                      {item.subtitle}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
