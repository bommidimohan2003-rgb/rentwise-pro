import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Play,
  Users,
  Package,
  CheckCircle2,
  Star,
  Camera,
  Headphones,
  Laptop,
  Plane,
  Wrench,
  BatteryCharging,
  Video,
  Sparkles,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

const showcaseItems = [
  {
    id: "camera",
    title: "Sony Alpha A7 IV",
    category: "4K DSLR Camera",
    price: "₹2,499/day",
    icon: Camera,
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=700&q=80",
    rating: "4.9",
    renter: "John D.",
  },
  {
    id: "drone",
    title: "DJI Mavic 3 Pro",
    category: "4K Aerial Drone",
    price: "₹3,200/day",
    icon: Plane,
    image: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=700&q=80",
    rating: "5.0",
    renter: "Ananya R.",
  },
  {
    id: "laptop",
    title: "MacBook Pro M3 Max",
    category: "Pro Workstation",
    price: "₹1,850/day",
    icon: Laptop,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=700&q=80",
    rating: "4.8",
    renter: "Vikram P.",
  },
  {
    id: "audio",
    title: "Sennheiser Studio Kit",
    category: "Pro Audio & Mic",
    price: "₹850/day",
    icon: Headphones,
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=700&q=80",
    rating: "4.9",
    renter: "Siddharth M.",
  },
  {
    id: "tool",
    title: "DeWalt Power Tools Set",
    category: "Electric Heavy Tools",
    price: "₹750/day",
    icon: Wrench,
    image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=700&q=80",
    rating: "4.7",
    renter: "Rajesh K.",
  },
  {
    id: "power",
    title: "Jackery 200W Station",
    category: "Portable Power Bank",
    price: "₹500/day",
    icon: BatteryCharging,
    image: "https://images.unsplash.com/photo-1609592424109-dd9892f1b177?auto=format&fit=crop&w=700&q=80",
    rating: "4.9",
    renter: "Kavita S.",
  },
];

export function Hero() {
  const [itemIndex, setItemIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setItemIndex((prev) => (prev + 1) % showcaseItems.length);
    }, 2000); // Auto-change items every 2 seconds!

    return () => clearInterval(timer);
  }, []);

  const activeItem = showcaseItems[itemIndex];
  const ActiveIcon = activeItem.icon;

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
              Payent is a peer-to-peer rental marketplace where you can rent cameras, drones, laptops, power tools, and gear or earn by listing what you own.
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
                <ArrowRight className="h-4 w-4" />
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

          {/* Right Column: Visual Stage with Coral Circle & Auto-rotating Gear Showcase (2-sec cycle) */}
          <div className="lg:col-span-5 relative flex items-center justify-center min-h-[420px] md:min-h-[500px]">
            
            {/* Giant Coral Circle Backdrop */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="absolute w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] rounded-full bg-[#FF5A5F] shadow-2xl shadow-[#FF5A5F]/40"
            />

            {/* Central Animated Equipment Showcase (Rotates every 2 seconds) */}
            <div className="relative z-10 w-[280px] sm:w-[350px] aspect-square rounded-full border-4 border-white/20 shadow-2xl overflow-hidden bg-slate-900 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeItem.id}
                  src={activeItem.image}
                  alt={activeItem.title}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className="w-full h-full object-cover"
                />
              </AnimatePresence>

              {/* Overlay Auto-Cycling Gear Badge */}
              <div className="absolute top-4 bg-black/75 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 flex items-center gap-2 text-[11px] font-bold text-white shadow-lg">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF5A5F] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF5A5F]"></span>
                </span>
                <span>Auto-Cycling Gear (2s)</span>
              </div>

              {/* Item Info Overlay at bottom of circle */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeItem.id + "-info"}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="absolute bottom-4 left-4 right-4 bg-slate-950/85 backdrop-blur-md p-3 rounded-2xl border border-white/15 text-left flex items-center justify-between"
                >
                  <div>
                    <p className="text-[10px] font-bold text-[#FF5A5F] uppercase tracking-wider">
                      {activeItem.category}
                    </p>
                    <p className="text-xs font-extrabold text-white truncate max-w-[170px]">
                      {activeItem.title}
                    </p>
                  </div>
                  <span className="text-xs font-extrabold text-white bg-[#FF5A5F] px-2.5 py-1 rounded-lg shrink-0">
                    {activeItem.price}
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Floating Dynamic Badge 1: Top Right Active Item Card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeItem.id + "-badge1"}
                initial={{ opacity: 0, scale: 0.8, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: 20 }}
                transition={{ duration: 0.35 }}
                className="absolute top-2 right-0 sm:-right-4 z-20 bg-white text-slate-900 p-3 rounded-2xl shadow-2xl border border-slate-100 flex items-center gap-3 w-40"
              >
                <div className="h-10 w-10 rounded-xl bg-[#FF5A5F]/10 flex items-center justify-center text-[#FF5A5F] shrink-0">
                  <ActiveIcon className="h-5 w-5" />
                </div>
                <div className="text-left overflow-hidden">
                  <p className="text-[11px] font-bold text-slate-800 leading-tight truncate">
                    {activeItem.category}
                  </p>
                  <p className="text-[10px] font-extrabold text-[#FF5A5F]">
                    {activeItem.price}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Floating Dynamic Badge 2: Left Active Renter */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeItem.id + "-badge2"}
                initial={{ opacity: 0, scale: 0.8, x: -20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: -20 }}
                transition={{ duration: 0.35, delay: 0.05 }}
                className="absolute top-24 -left-4 sm:-left-8 z-20 bg-white text-slate-900 p-3 rounded-2xl shadow-2xl border border-slate-100 flex items-center gap-2.5 w-36 rotate-[-3deg]"
              >
                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-[#FF5A5F] shrink-0 text-xs font-bold border border-slate-200">
                  {activeItem.renter.charAt(0)}
                </div>
                <div className="text-left overflow-hidden">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Top Lender</p>
                  <p className="text-[11px] font-extrabold text-slate-800 truncate">
                    {activeItem.renter}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Floating Dynamic Badge 3: Bottom Right Rating */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeItem.id + "-badge3"}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                transition={{ duration: 0.35, delay: 0.1 }}
                className="absolute bottom-4 right-0 sm:right-2 z-30 bg-white text-slate-900 px-3.5 py-2.5 rounded-2xl shadow-2xl border border-slate-100 flex items-center gap-2"
              >
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <div className="text-left">
                  <p className="text-[10px] font-extrabold text-slate-800">
                    {activeItem.rating} Rating
                  </p>
                  <p className="text-[9px] font-bold text-slate-400">Verified Rental</p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Gear Selector Dots at bottom */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-30">
              {showcaseItems.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setItemIndex(idx)}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    itemIndex === idx ? "w-6 bg-[#FF5A5F]" : "w-2 bg-white/30 hover:bg-white/50"
                  }`}
                  aria-label={`Show item ${idx + 1}`}
                />
              ))}
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
