import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import {
  Search,
  ShieldCheck,
  CheckCircle2,
  Star,
  Sparkles,
  Zap,
  Lock,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function HowItWorks() {
  const { user } = useAuth();
  return (
    <section className="relative overflow-hidden bg-white dark:bg-[#070A10] py-16 lg:py-24 text-foreground dark:text-white border-b border-border dark:border-white/10">
      {/* Ambient Lighting */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: App Mockup */}
          <div className="lg:col-span-5 flex justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative w-[300px] sm:w-[340px] bg-card dark:bg-gradient-to-br dark:from-white/10 dark:via-white/5 dark:to-white/0 backdrop-blur-3xl text-foreground dark:text-white rounded-[44px] p-5 shadow-xl dark:shadow-2xl border border-border dark:border-white/20 dark:shadow-black"
            >
              {/* Phone Notch */}
              <div className="h-4 w-28 bg-foreground/20 dark:bg-white/20 rounded-b-xl mx-auto mb-4 border border-border dark:border-white/10" />

              {/* App Search Bar */}
              <div className="bg-secondary dark:bg-white/10 p-3 rounded-2xl flex items-center gap-2 mb-4 border border-border dark:border-white/15">
                <Search className="h-4 w-4 text-muted-foreground dark:text-neutral-400" />
                <span className="text-xs text-muted-foreground dark:text-neutral-400 font-medium">
                  Search Sony FX3, RED Komodo, Vision Pro...
                </span>
              </div>

              {/* App Section: Reserve Flagship Gear */}
              <div className="space-y-3 text-left">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-foreground dark:text-white">
                    Reserve Flagship Gear
                  </p>
                  <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    VIP Escrow
                  </span>
                </div>

                {/* Product 1 */}
                <div className="bg-secondary/50 dark:bg-white/5 p-3 rounded-2xl border border-border dark:border-white/10 flex items-center gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=150&q=80"
                    alt="Sony FX3 Cinema"
                    className="h-12 w-12 rounded-xl object-cover border border-border dark:border-white/15"
                  />
                  <div className="flex-1">
                    <p className="text-xs font-extrabold text-foreground dark:text-white">
                      Sony FX3 Cinema Line
                    </p>
                    <p className="text-[10px] font-extrabold text-primary">
                      ₹2,500 / day
                    </p>
                    <div className="flex items-center gap-1 text-[9px] text-amber-500 dark:text-amber-400 font-bold">
                      <Star className="h-2.5 w-2.5 fill-amber-400" />
                      <span>4.9 • Mumbai Hub</span>
                    </div>
                  </div>
                </div>

                {/* Product 2 */}
                <div className="bg-secondary/50 dark:bg-white/5 p-3 rounded-2xl border border-border dark:border-white/10 flex items-center gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=150&q=80"
                    alt="MacBook Pro 16 M3"
                    className="h-12 w-12 rounded-xl object-cover border border-border dark:border-white/15"
                  />
                  <div className="flex-1">
                    <p className="text-xs font-extrabold text-foreground dark:text-white">
                      MacBook Pro M3 Max
                    </p>
                    <p className="text-[10px] font-extrabold text-primary">
                      ₹1,800 / day
                    </p>
                    <div className="flex items-center gap-1 text-[9px] text-amber-500 dark:text-amber-400 font-bold">
                      <Star className="h-2.5 w-2.5 fill-amber-400" />
                      <span>4.8 • Bengaluru Hub</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Nav Simulation */}
              <div className="mt-6 pt-3 border-t border-border dark:border-white/10 flex justify-around text-muted-foreground dark:text-neutral-400 text-[10px] font-bold">
                <span className="text-primary font-bold">Reserve</span>
                <span>Catalog</span>
                <span>Escrow</span>
                <span>Account</span>
              </div>
            </motion.div>
          </div>

          {/* Right Column: 3 Steps & CTA Button */}
          <div className="lg:col-span-7 space-y-8 text-left">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-secondary/80 dark:bg-white/5 border border-border dark:border-white/15 text-xs font-bold text-amber-600 dark:text-amber-400 tracking-wider uppercase">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Concierge Flow</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground dark:text-white font-display">
                Three Steps to <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-600 dark:via-purple-400 to-cyan-600 dark:to-cyan-400">
                  Unrivaled Access.
                </span>
              </h2>
            </div>

            {/* 3 Steps List */}
            <div className="space-y-6 max-w-xl">
              {/* Step 1 */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex items-start gap-4 p-4 rounded-2xl bg-secondary/40 dark:bg-white/5 border border-border dark:border-white/10 backdrop-blur-xl"
              >
                <div className="h-12 w-12 rounded-2xl bg-primary/10 dark:bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shrink-0 font-bold">
                  <Search className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-foreground dark:text-white font-display">
                    1. Select Flagship Hardware
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground dark:text-neutral-400 font-medium mt-1 leading-relaxed">
                    Choose from verified cinema cameras, workstations, and
                    drones from certified lenders in your city.
                  </p>
                </div>
              </motion.div>

              {/* Step 2 */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="flex items-start gap-4 p-4 rounded-2xl bg-secondary/40 dark:bg-white/5 border border-border dark:border-white/10 backdrop-blur-xl"
              >
                <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 dark:bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0 font-bold">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-foreground dark:text-white font-display">
                    2. Razorpay Escrow Authorization
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground dark:text-neutral-400 font-medium mt-1 leading-relaxed">
                    Lock in your rental dates with encrypted deposit protection.
                    Funds remain safe in escrow until return.
                  </p>
                </div>
              </motion.div>

              {/* Step 3 */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="flex items-start gap-4 p-4 rounded-2xl bg-secondary/40 dark:bg-white/5 border border-border dark:border-white/10 backdrop-blur-xl"
              >
                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 font-bold">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-foreground dark:text-white font-display">
                    3. White-Glove Hand-Off & Execution
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground dark:text-neutral-400 font-medium mt-1 leading-relaxed">
                    Receive your gear via 2-hour doorstep delivery, create your
                    masterpiece, and return hassle-free.
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Button */}
            <div className="pt-2">
              <Link
                to={user ? "/categories" : "/register"}
                className="btn-gradient inline-flex items-center justify-center text-white font-extrabold text-sm px-8 py-4 rounded-2xl shadow-xl shadow-primary/20 hover:scale-102 transition-all cursor-pointer"
              >
                <Zap className="h-4 w-4 fill-current mr-2" />
                <span>Reserve Certified Gear Now</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
