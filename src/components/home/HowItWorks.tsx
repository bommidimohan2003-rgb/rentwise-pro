import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Search, ClipboardList, Sparkles, Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function HowItWorks() {
  const { user } = useAuth();
  return (
    <section className="bg-background py-10 text-foreground overflow-hidden border-b border-border">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Mobile App Frame Preview */}
          <div className="lg:col-span-5 flex justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative w-[280px] sm:w-[320px] bg-card text-foreground rounded-[40px] p-4 shadow-2xl border-4 border-border"
            >
              {/* Phone Notch */}
              <div className="h-4 w-28 bg-foreground rounded-b-xl mx-auto mb-3" />
              
              {/* App Search Bar */}
              <div className="bg-secondary p-2.5 rounded-xl flex items-center gap-2 mb-4">
                <Search className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">Search items...</span>
              </div>

              {/* App Section: Popular Nearby */}
              <div className="space-y-3 text-left">
                <p className="text-xs font-bold text-foreground">Popular Nearby</p>
                
                {/* Product 1 */}
                <div className="bg-secondary/50 p-2.5 rounded-xl border border-border flex items-center gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=150&q=80"
                    alt="Canon EOS 2000"
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-xs font-extrabold text-foreground">Canon EOS 2000</p>
                    <p className="text-[10px] font-bold text-[#FF5A5F]">₹900 / day</p>
                    <div className="flex items-center gap-1 text-[9px] text-amber-500 font-bold">
                      <Star className="h-2.5 w-2.5 fill-amber-400" />
                      <span>4.9 • 2.1 km away</span>
                    </div>
                  </div>
                </div>

                {/* Product 2 */}
                <div className="bg-secondary/50 p-2.5 rounded-xl border border-border flex items-center gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=150&q=80"
                    alt="MacBook Air M1"
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-xs font-extrabold text-foreground">MacBook Air M1</p>
                    <p className="text-[10px] font-bold text-[#FF5A5F]">₹1,200 / day</p>
                    <div className="flex items-center gap-1 text-[9px] text-amber-500 font-bold">
                      <Star className="h-2.5 w-2.5 fill-amber-400" />
                      <span>4.8 • 3.5 km away</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Nav Simulation */}
              <div className="mt-6 pt-3 border-t border-border flex justify-around text-muted-foreground text-[10px] font-bold">
                <span className="text-[#FF5A5F]">Home</span>
                <span>Browse</span>
                <span>Bookings</span>
                <span>Profile</span>
              </div>
            </motion.div>
          </div>

          {/* Right Column: 3 Steps & CTA Button */}
          <div className="lg:col-span-7 space-y-8 text-left">
            <div className="space-y-3">
              <p className="text-xs font-extrabold tracking-widest text-[#FF5A5F] uppercase">
                HOW IT WORKS
              </p>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground font-display">
                Simple Steps to <br />
                Start <span className="text-[#FF5A5F]">Renting</span>
              </h2>
            </div>

            {/* 3 Steps List */}
            <div className="space-y-6 max-w-xl">
              
              {/* Step 1 */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex items-start gap-4"
              >
                <div className="h-12 w-12 rounded-2xl bg-[#FF5A5F]/15 border border-[#FF5A5F]/30 flex items-center justify-center text-[#FF5A5F] shrink-0 font-bold">
                  <Search className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-foreground">1. Discover</h3>
                  <p className="text-xs md:text-sm text-muted-foreground font-normal mt-1 leading-relaxed">
                    Find items you need from trusted local owners in your city.
                  </p>
                </div>
              </motion.div>

              {/* Step 2 */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="flex items-start gap-4"
              >
                <div className="h-12 w-12 rounded-2xl bg-[#FF5A5F]/15 border border-[#FF5A5F]/30 flex items-center justify-center text-[#FF5A5F] shrink-0 font-bold">
                  <ClipboardList className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-foreground">2. Book</h3>
                  <p className="text-xs md:text-sm text-muted-foreground font-normal mt-1 leading-relaxed">
                    Send a request and get instant confirmation from verified lenders.
                  </p>
                </div>
              </motion.div>

              {/* Step 3 */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="flex items-start gap-4"
              >
                <div className="h-12 w-12 rounded-2xl bg-[#FF5A5F]/15 border border-[#FF5A5F]/30 flex items-center justify-center text-[#FF5A5F] shrink-0 font-bold">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-foreground">3. Enjoy</h3>
                  <p className="text-xs md:text-sm text-muted-foreground font-normal mt-1 leading-relaxed">
                    Use the item, create amazing work, and return it safely when done.
                  </p>
                </div>
              </motion.div>

            </div>

            {/* Button */}
            <div className="pt-2">
              <Link
                to={user ? "/categories" : "/register"}
                className="inline-flex items-center justify-center bg-black dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-black font-bold text-sm px-8 py-3.5 rounded-xl shadow-lg transition-all duration-200 active:scale-95 cursor-pointer"
              >
                Start Renting Now
              </Link>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
