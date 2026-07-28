import { motion } from "framer-motion";
import { ArrowRight, Play, Users, Package, CheckCircle2, Star, Camera, Headphones, Laptop } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#0B2545] text-white pt-10 pb-20 md:pt-16 md:pb-28">
      {/* Subtle Dot Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#FF5A5F_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Headline, Subtitle, Buttons, Stats */}
          <div className="lg:col-span-7 space-y-8 text-left z-10">
            
            {/* Tagline Badge */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 text-xs font-extrabold tracking-widest text-[#FF5A5F] uppercase"
            >
              <span>RENT</span>
              <span className="h-1 w-1 rounded-full bg-[#FF5A5F]" />
              <span>EARN</span>
              <span className="h-1 w-1 rounded-full bg-[#FF5A5F]" />
              <span>CONNECT</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] text-white font-display"
            >
              Rent <span className="text-[#FF5A5F]">Anything.</span>
              <br />
              Earn <span className="text-[#FF5A5F]">Everything.</span>
            </motion.h1>

            {/* Description Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-slate-300 text-base md:text-lg max-w-xl leading-relaxed font-normal"
            >
              Payent is a peer-to-peer rental marketplace where you can rent items you need or earn by listing what you own.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap items-center gap-4 pt-1"
            >
              <Link
                to="/categories"
                className="bg-[#FF5A5F] hover:bg-[#e0484d] text-white font-bold text-sm px-8 py-3.5 rounded-xl shadow-lg shadow-[#FF5A5F]/30 transition-all duration-200 active:scale-95 flex items-center gap-2"
              >
                <span>Explore Items</span>
              </Link>
              <Link
                to="/about"
                className="border border-white/25 hover:bg-white/10 text-white font-bold text-sm px-7 py-3.5 rounded-xl transition-all duration-200 active:scale-95 flex items-center gap-2"
              >
                <span>How It Works</span>
                <Play className="h-3.5 w-3.5 fill-current text-white" />
              </Link>
            </motion.div>

            {/* Stats Row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-3 gap-4 pt-6 max-w-lg border-t border-white/10"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#FF5A5F] shrink-0">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-lg md:text-xl font-extrabold text-white">10K+</h4>
                  <p className="text-[11px] text-slate-400 font-medium">Active Users</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#FF5A5F] shrink-0">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-lg md:text-xl font-extrabold text-white">5K+</h4>
                  <p className="text-[11px] text-slate-400 font-medium">Items Listed</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#FF5A5F] shrink-0">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-lg md:text-xl font-extrabold text-white">25K+</h4>
                  <p className="text-[11px] text-slate-400 font-medium">Successful Rentals</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Visual Stage with Coral Circle, Person Cutout & Floating Product Cards */}
          <div className="lg:col-span-5 relative flex items-center justify-center min-h-[420px] md:min-h-[500px]">
            
            {/* Giant Coral Circle Backdrop */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="absolute w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] rounded-full bg-[#FF5A5F] shadow-2xl shadow-[#FF5A5F]/40"
            />

            {/* Person Cutout Image (Holding smartphone) */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="relative z-10 w-[280px] sm:w-[350px] aspect-square flex items-center justify-center"
            >
              <img
                src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=700&q=80"
                alt="Happy Payent Renter"
                className="w-full h-full object-cover rounded-full border-4 border-white/20 shadow-2xl"
              />
            </motion.div>

            {/* Floating Card 1: Top Right Camera Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="absolute top-2 right-0 sm:-right-4 z-20 bg-white text-slate-900 p-3 rounded-2xl shadow-2xl border border-slate-100 flex items-center gap-3 w-36"
            >
              <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-[#FF5A5F] shrink-0">
                <Camera className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-800 leading-tight">4K DSLR</p>
                <p className="text-[10px] font-bold text-[#FF5A5F]">₹2,499/day</p>
              </div>
            </motion.div>

            {/* Floating Card 2: Left Headphones Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute top-24 -left-4 sm:-left-8 z-20 bg-white text-slate-900 p-3 rounded-2xl shadow-2xl border border-slate-100 flex items-center gap-3 w-36 rotate-[-4deg]"
            >
              <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-[#FF5A5F] shrink-0">
                <Headphones className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-800 leading-tight">Audio Gear</p>
                <p className="text-[10px] font-bold text-[#FF5A5F]">₹850/day</p>
              </div>
            </motion.div>

            {/* Floating Card 3: Right Laptop Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="absolute bottom-20 -right-4 sm:-right-8 z-20 bg-white text-slate-900 p-3 rounded-2xl shadow-2xl border border-slate-100 flex items-center gap-3 w-36 rotate-[4deg]"
            >
              <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-[#FF5A5F] shrink-0">
                <Laptop className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-800 leading-tight">MacBook Pro</p>
                <p className="text-[10px] font-bold text-[#FF5A5F]">₹1,850/day</p>
              </div>
            </motion.div>

            {/* Floating Badge 4: Bottom Overlay Badge "Top Renter John D. ⭐ 4.9" */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="absolute bottom-2 left-4 sm:left-8 z-30 bg-white text-slate-900 px-4 py-2.5 rounded-2xl shadow-2xl border border-slate-100 flex items-center gap-3"
            >
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"
                alt="John D."
                className="h-9 w-9 rounded-full object-cover border border-slate-200"
              />
              <div className="text-left">
                <p className="text-[10px] font-bold text-[#FF5A5F] uppercase tracking-wider">Top Renter</p>
                <p className="text-xs font-extrabold text-slate-900">John D.</p>
                <div className="flex items-center gap-1 text-[10px] font-bold text-amber-500">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span>4.9 (120+ rentals)</span>
                </div>
              </div>
            </motion.div>

          </div>

        </div>
      </div>
    </section>
  );
}
