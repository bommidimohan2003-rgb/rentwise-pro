import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ShieldCheck,
  Camera,
  Laptop,
  Plane,
  Bike,
  Sparkles,
  SlidersHorizontal,
  ChevronRight,
  Star,
  Check,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import reClassic350Img from "@/assets/images/re_classic350.png";

const featuredGear = [
  {
    id: "camera-1",
    title: "Hybrid Cinema Camera",
    category: "4K Cinema Camera",
    specs: ["33MP Full-Frame", "4K 60p HDR", "Dual SD Slots"],
    icon: Camera,
    image:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=700&q=80",
    owner: "Arjun Mehta",
    ownerRating: 4.9,
    verified: true,
  },
  {
    id: "drone-1",
    title: "Professional Aerial Drone",
    category: "Aerial Cine Drone",
    specs: ["Tri-Camera System", "43 Min Flight", "Cine Sensor"],
    icon: Plane,
    image:
      "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=700&q=80",
    owner: "Ananya Roy",
    ownerRating: 5.0,
    verified: true,
  },
  {
    id: "laptop-1",
    title: "High-End Editing Workstation",
    category: "Edit Workstation",
    specs: ["128GB Unified RAM", "4TB NVMe", "Liquid Retina XDR"],
    icon: Laptop,
    image:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=700&q=80",
    owner: "Vikram Patel",
    ownerRating: 4.8,
    verified: true,
  },
  {
    id: "bike-1",
    title: "Royal Enfield Classic 350",
    category: "Bikes & Rides",
    specs: ["349cc Engine", "Dual-Channel ABS", "Helmet Included"],
    icon: Bike,
    image: reClassic350Img,
    owner: "Payent Reference Catalog",
    ownerRating: 4.9,
    verified: true,
  },
];

export function Hero() {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSelectedIndex((prev) => (prev + 1) % featuredGear.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const activeGear = featuredGear[selectedIndex];
  const ActiveIcon = activeGear.icon;

  return (
    <section className="relative overflow-hidden bg-background text-foreground pt-10 pb-14 lg:pt-16 lg:pb-20 border-b border-border">
      {/* Ambient Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">
          {/* Left Column: Value Proposition & CTAs */}
          <div className="lg:col-span-7 space-y-5 text-left">
            {/* Category Tag */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border text-xs font-semibold text-muted-foreground"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-foreground" />
              <span>Peer-to-Peer Gear Rental Platform</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="text-4xl sm:text-5xl xl:text-6xl font-extrabold tracking-tight leading-[1.08] font-display"
            >
              Professional gear on demand.{" "}
              <span className="text-muted-foreground font-normal">
                Earn when your kit is idle.
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed font-normal"
            >
              Rent cinema cameras, aerial drones, studio audio, and workstation
              laptops directly from verified creators in your city — fully
              insured and ready for your next project.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="flex flex-wrap items-center gap-3 pt-1"
            >
              <Link
                to="/categories"
                className="btn-gradient px-6 py-3 rounded-xl font-medium text-sm flex items-center gap-2 group cursor-pointer"
              >
                <span>Browse Rental Gear</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/become-lender"
                className="px-6 py-3 rounded-xl font-medium text-sm border border-border bg-secondary hover:bg-secondary/80 text-foreground transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>List Your Gear</span>
                <Sparkles className="h-4 w-4 text-muted-foreground" />
              </Link>
            </motion.div>

            {/* Feature Highlights Row */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="pt-5 border-t border-border/60 grid grid-cols-3 gap-3"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Check className="h-3.5 w-3.5" />
                  <span>ID-Verified Lenders</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Verified profiles and identity check.
                </p>
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Check className="h-3.5 w-3.5" />
                  <span>Rental Protection</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Deposit-backed security flow.
                </p>
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Check className="h-3.5 w-3.5" />
                  <span>Flexible Terms</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Daily, weekly, or monthly rates.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Compact Featured Inventory Card */}
          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="spatial-card relative p-3.5 sm:p-4.5 overflow-hidden rounded-2xl max-w-sm sm:max-w-md lg:max-w-none mx-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-border mb-3">
                <div className="flex items-center gap-1.5">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Featured Inventory
                  </span>
                </div>

                {/* Gear Selector Tabs */}
                <div className="flex items-center gap-1">
                  {featuredGear.map((gear, idx) => (
                    <button
                      key={gear.id}
                      onClick={() => setSelectedIndex(idx)}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                        selectedIndex === idx
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`}
                    >
                      {gear.category.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Compact Display Image Card */}
              <div className="relative aspect-[16/10] rounded-lg overflow-hidden bg-secondary border border-border mb-3 group">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeGear.id}
                    src={activeGear.image}
                    alt={activeGear.title}
                    initial={{ opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full object-cover object-center"
                  />
                </AnimatePresence>

                {/* Floating Verified Item Badge */}
                <div className="absolute top-2.5 left-2.5 spatial-surface px-2.5 py-1 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-foreground" />
                  <span className="text-[10px] font-bold text-foreground">
                    Verified Gear Item
                  </span>
                </div>
              </div>

              {/* Compact Specs Footer */}
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <ActiveIcon className="h-3.5 w-3.5 text-foreground" />
                      <span className="text-[11px] font-bold text-foreground">
                        {activeGear.category}
                      </span>
                    </div>
                  </div>

                  <Link
                    to="/categories"
                    className="shrink-0 p-1.5 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-colors"
                    aria-label={`View ${activeGear.title}`}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {/* Specs Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/50">
                  {activeGear.specs.map((spec, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-secondary text-[10px] font-medium text-muted-foreground border border-border/40"
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
