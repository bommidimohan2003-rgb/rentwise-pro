import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ShieldCheck,
  Camera,
  Laptop,
  Plane,
  Plus,
  SlidersHorizontal,
  ChevronRight,
  Star,
  Zap,
  Sparkles,
  Award,
  Lock,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import reClassic350Img from "@/assets/images/re_classic350.png";

const featuredGear = [
  {
    id: "camera-1",
    title: "Sony FX3 Full-Frame Cinema Camera",
    category: "Cinema Camera",
    price: 2500,
    specs: ["4K 120fps HDR", "XLR Handle Unit", "CFexpress Type A"],
    icon: Camera,
    image:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=80",
    owner: "Arjun Mehta (Mumbai)",
    ownerRating: 4.9,
    badge: "Most Reserved",
  },
  {
    id: "drone-1",
    title: "DJI Mavic 3 Cine Premium Combo",
    category: "Aerial Cinema Drone",
    price: 4200,
    specs: ["Apple ProRes 422", "43 Min Flight", "RC Pro Controller"],
    icon: Plane,
    image:
      "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=1000&q=80",
    owner: "Ananya Roy (Bengaluru)",
    ownerRating: 5.0,
    badge: "Flagship Cine",
  },
  {
    id: "laptop-1",
    title: 'MacBook Pro 16" M3 Max Workstation',
    category: "Edit Workstation",
    price: 1800,
    specs: ["128GB Unified RAM", "4TB NVMe SSD", "Liquid Retina XDR"],
    icon: Laptop,
    image:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80",
    owner: "Vikram Patel (Hyderabad)",
    ownerRating: 4.8,
    badge: "Ultra-Performance",
  },
  {
    id: "bike-1",
    title: "Royal Enfield Classic 350 Stealth",
    category: "Luxury Rides",
    price: 1200,
    specs: ["349cc J-Series", "Dual-Channel ABS", "Helmet Included"],
    icon: Sparkles,
    image: reClassic350Img,
    owner: "Payent Reserve Catalog",
    ownerRating: 4.9,
    badge: "Exclusive Ride",
  },
];

export function Hero() {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSelectedIndex((prev) => (prev + 1) % featuredGear.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const activeGear = featuredGear[selectedIndex];
  const ActiveIcon = activeGear.icon;

  return (
    <section className="relative overflow-hidden bg-white dark:bg-[#070A10] text-foreground dark:text-white pt-12 pb-16 lg:pt-20 lg:pb-28 border-b border-border dark:border-white/10">
      {/* Full-Bleed Dynamic Gear Background Photo */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-70 dark:opacity-65">
        <AnimatePresence mode="wait">
          <motion.img
            key={activeGear.id}
            src={activeGear.image}
            alt={activeGear.title}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
            className="w-full h-full object-cover object-center filter contrast-115 saturate-125 brightness-100"
          />
        </AnimatePresence>
        {/* Soft Radial & Linear Luxury Fog Vignette */}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent dark:from-[#070A10] dark:via-[#070A10]/85 dark:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-white/50 dark:from-[#070A10] dark:via-transparent dark:to-[#070A10]/60" />
      </div>

      {/* Vibrant Ambient Lighting Accents */}
      <div className="absolute top-0 left-1/4 -mt-20 w-[500px] h-[500px] bg-gradient-to-tr from-purple-500/20 via-primary/20 to-cyan-400/20 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute top-1/3 right-10 w-[450px] h-[450px] bg-gradient-to-bl from-amber-400/20 via-purple-500/15 to-blue-500/20 rounded-full blur-[110px] pointer-events-none z-0" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Column: Luxury Editorial Storytelling */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Top Editorial Category Tag */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2"
            >
              <div className="h-0.5 w-6 sm:w-8 bg-primary" />
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.16em] sm:tracking-[0.25em] text-foreground/80 dark:text-neutral-300 font-mono">
                PAYENT RESERVE &bull; FLAGSHIP TECH 2026
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="text-3xl xs:text-4xl sm:text-5xl xl:text-6xl font-extrabold tracking-tight leading-tight sm:leading-[1.08] font-display text-foreground dark:text-white"
            >
              Rent Professional Tech <br className="hidden sm:inline" />
              Gear On Demand. Earn <br className="hidden sm:inline" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-purple-400 to-cyan-400">
                When Your Kit Is Idle.
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="text-sm sm:text-lg text-muted-foreground dark:text-neutral-300 max-w-xl leading-relaxed font-medium"
            >
              Discover our curated collection of flagship cinema cameras, aerial
              drones, studio audio, and workstation laptops — crafted with
              uncompromising attention to detail and backed by Razorpay Escrow.
            </motion.p>

            {/* Editorial Dual CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="flex flex-col xs:flex-row items-stretch xs:items-center gap-3 sm:gap-4 pt-2"
            >
              <Link
                to="/categories"
                className="w-full xs:w-auto justify-center bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-bold text-sm flex items-center gap-2.5 group cursor-pointer shadow-xl transition-all"
              >
                <Zap className="h-4 w-4 fill-current text-white dark:text-black" />
                <span>Explore Flagship Collection</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                to="/become-lender"
                className="w-full xs:w-auto justify-center px-6 sm:px-7 py-3.5 sm:py-4 rounded-2xl font-bold text-sm border border-black/20 dark:border-white/20 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-foreground dark:text-white transition-all flex items-center gap-2 cursor-pointer backdrop-blur-2xl"
              >
                <Plus className="h-4 w-4 text-primary" />
                <span>List Gear & Earn Yield</span>
              </Link>
            </motion.div>
          </div>

          {/* Right Column: 3D Editorial Showcase Card */}
          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative p-3.5 sm:p-5 overflow-hidden rounded-2xl sm:rounded-3xl border border-border dark:border-white/15 bg-card dark:bg-[#0B0F17] backdrop-blur-2xl shadow-xl dark:shadow-2xl dark:shadow-black max-w-md lg:max-w-none mx-auto"
            >
              {/* Top Selector bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pb-3 border-b border-border dark:border-white/10 mb-3 sm:mb-4">
                <div className="flex items-center gap-1.5">
                  <SlidersHorizontal className="h-4 w-4 text-primary" />
                  <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-foreground dark:text-white font-mono">
                    Reserve Showcase
                  </span>
                </div>

                {/* Tabs */}
                <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-1 bg-secondary/80 dark:bg-black/60 p-1 rounded-xl border border-border dark:border-white/10 overflow-x-auto no-scrollbar">
                  {featuredGear.map((gear, idx) => (
                    <button
                      key={gear.id}
                      onClick={() => setSelectedIndex(idx)}
                      className={`px-2 sm:px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                        selectedIndex === idx
                          ? "bg-black dark:bg-white text-white dark:text-black shadow-md"
                          : "text-muted-foreground dark:text-neutral-300 hover:text-foreground dark:hover:text-white hover:bg-secondary dark:hover:bg-white/10"
                      }`}
                    >
                      {gear.category.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Display Image Card */}
              <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-secondary dark:bg-black/80 border border-border dark:border-white/10 mb-4 group shadow-inner">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeGear.id}
                    src={activeGear.image}
                    alt={activeGear.title}
                    initial={{ opacity: 0, scale: 1.08 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.35 }}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  />
                </AnimatePresence>

                {/* Floating Badge */}
                <div className="absolute top-3 left-3 bg-black/80 text-white backdrop-blur-md px-3 py-1 rounded-full border border-white/20 flex items-center gap-1.5 shadow-sm">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-[11px] font-extrabold uppercase tracking-wide">
                    {activeGear.badge}
                  </span>
                </div>

                {/* Price Pill */}
                <div className="absolute bottom-3 right-3 bg-black/90 dark:bg-white/95 text-white dark:text-black backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 font-display font-extrabold text-xs shadow-lg">
                  ₹{activeGear.price}{" "}
                  <span className="text-[10px] font-medium opacity-80">
                    / day
                  </span>
                </div>
              </div>

              {/* Specs & Owner Footer */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <ActiveIcon className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-extrabold text-foreground dark:text-white truncate font-display">
                        {activeGear.title}
                      </h3>
                    </div>
                    <p className="text-[11px] text-muted-foreground dark:text-neutral-400 mt-0.5">
                      Lender:{" "}
                      <span className="text-foreground dark:text-white font-bold">
                        {activeGear.owner}
                      </span>{" "}
                      &bull; ★ {activeGear.ownerRating}
                    </p>
                  </div>

                  <Link
                    to="/categories"
                    className="shrink-0 p-2.5 rounded-xl bg-secondary dark:bg-white/15 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black text-foreground dark:text-white border border-border dark:border-white/20 transition-all shadow-md cursor-pointer"
                    aria-label={`View ${activeGear.title}`}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>

                {/* Specs Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border dark:border-white/10">
                  {activeGear.specs.map((spec, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-secondary/80 dark:bg-white/10 text-[11px] font-extrabold text-foreground dark:text-white border border-border dark:border-white/15"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
