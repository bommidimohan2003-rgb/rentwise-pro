import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Sparkles, ShieldCheck, Zap, Award } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { SearchBar } from "@/components/common/SearchBar";
import sonyA7Img from "@/assets/images/sony_a7.png";
import macbookProImg from "@/assets/images/macbook_pro.png";
import djiMavicImg from "@/assets/images/dji_mavic.png";

const pills = ["Verified lenders", "Same-day delivery", "100% Insured rentals"];
const rotating = ["Cameras & Lenses", "Drones", "MacBooks & Laptops", "Gaming Consoles", "Audio & Mics", "VR Headsets"];

export function Hero() {
  const [index, setIndex] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isTouchOrReducedMotion, setIsTouchOrReducedMotion] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % rotating.length);
    }, 2400);

    if (typeof window !== "undefined") {
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const isTouch = window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
      setIsTouchOrReducedMotion(reducedMotion || isTouch);
    }

    return () => clearInterval(timer);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isTouchOrReducedMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative overflow-hidden pt-12 pb-20 md:pt-16 md:pb-24"
    >
      {/* Background Spatial Parallax Blobs */}
      <div className="absolute inset-0 hero-gradient opacity-90 pointer-events-none" />
      <motion.div
        animate={
          isTouchOrReducedMotion
            ? {}
            : {
                x: mousePos.x * -35,
                y: mousePos.y * -35,
              }
        }
        transition={{ type: "spring", stiffness: 100, damping: 30 }}
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl pointer-events-none"
      />

      <div className="relative mx-auto max-w-7xl px-4 md:px-6 text-center z-10 space-y-10">
        {/* Top Badge & Header */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full spatial-float px-4 py-2 text-xs font-bold text-foreground border border-border/80 shadow-md"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
            <span>Next-Gen Tech Gear Rental Marketplace</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.08] max-w-5xl mx-auto text-foreground"
          >
            Rent Flagship{" "}
            <span className="relative inline-block min-w-[220px] sm:min-w-[420px] text-left h-[1.1em] align-bottom overflow-hidden text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-500 to-accent">
              <AnimatePresence mode="wait">
                <motion.span
                  key={index}
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -28 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute left-0 right-0"
                >
                  {rotating[index]},
                </motion.span>
              </AnimatePresence>
            </span>
            <br />
            Without the Ownership Cost.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto text-base md:text-lg text-muted-foreground leading-relaxed font-medium"
          >
            Rent professional cameras, drones, laptops, consoles, and audio gear directly from verified lenders in your city. Insured &amp; delivered fast.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center pt-2"
          >
            <div className="w-full max-w-2xl p-2 rounded-2xl spatial-float border border-border/80 shadow-xl">
              <SearchBar />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              to="/categories"
              className="btn-gradient rounded-xl h-12 px-7 inline-flex items-center gap-2 font-bold text-sm shadow-xl active:scale-95 transition-all"
            >
              <span>Explore Catalog</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/become-lender"
              className="spatial-surface hover:bg-secondary/80 rounded-xl h-12 px-7 inline-flex items-center gap-2 font-bold text-sm text-foreground border border-border/80 transition-all active:scale-95"
            >
              <span>List Gear &amp; Earn</span>
            </Link>
          </motion.div>
        </div>

        {/* Pure CSS 3D Layered Photography Parallax Stage */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.45, duration: 0.6 }}
          className="max-w-5xl mx-auto pt-4 relative h-[360px] md:h-[440px] rounded-3xl spatial-surface border border-border/60 overflow-hidden flex items-center justify-center p-6 bg-gradient-to-b from-card/60 to-card/90 shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-accent/10 pointer-events-none" />

          <div className="relative w-full max-w-4xl h-full flex items-center justify-center perspective-1000">
            {/* Left Cutout: MacBook Pro */}
            <motion.div
              style={
                isTouchOrReducedMotion
                  ? {}
                  : {
                      x: mousePos.x * -32,
                      y: mousePos.y * -20,
                      rotateY: mousePos.x * 12,
                    }
              }
              className="absolute left-4 md:left-12 w-44 md:w-64 aspect-video rounded-2xl overflow-hidden spatial-card shadow-2xl z-10 border border-white/20"
            >
              <img src={macbookProImg} alt="MacBook Pro" className="h-full w-full object-cover" />
              <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md text-[10px] font-bold text-white px-2 py-0.5 rounded-full border border-white/20">
                Pro Laptops
              </div>
            </motion.div>

            {/* Center Focal Cutout (Foreground): Sony Alpha A7 IV */}
            <motion.div
              style={
                isTouchOrReducedMotion
                  ? {}
                  : {
                      x: mousePos.x * 40,
                      y: mousePos.y * 25,
                      rotateY: mousePos.x * -16,
                      rotateX: mousePos.y * 12,
                    }
              }
              className="relative w-56 md:w-80 aspect-square rounded-3xl overflow-hidden spatial-overlay shadow-2xl z-20 border border-primary/40 p-2 bg-card/80"
            >
              <img src={sonyA7Img} alt="Sony Alpha A7 IV" className="h-full w-full object-cover rounded-2xl" />
              <div className="absolute bottom-3 left-3 right-3 bg-card/90 backdrop-blur-md p-2.5 rounded-xl border border-border/80 flex items-center justify-between text-left shadow-lg">
                <div>
                  <h5 className="text-xs font-bold text-foreground">Sony Alpha A7 IV</h5>
                  <p className="text-[10px] text-muted-foreground">Full-Frame Cinema Gear</p>
                </div>
                <span className="text-xs font-extrabold text-primary">₹2,499/day</span>
              </div>
            </motion.div>

            {/* Right Cutout: DJI Mavic 3 Pro */}
            <motion.div
              style={
                isTouchOrReducedMotion
                  ? {}
                  : {
                      x: mousePos.x * -36,
                      y: mousePos.y * 28,
                      rotateY: mousePos.x * 14,
                    }
              }
              className="absolute right-4 md:right-12 w-44 md:w-64 aspect-video rounded-2xl overflow-hidden spatial-card shadow-2xl z-10 border border-white/20"
            >
              <img src={djiMavicImg} alt="DJI Mavic 3 Pro" className="h-full w-full object-cover" />
              <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md text-[10px] font-bold text-white px-2 py-0.5 rounded-full border border-white/20">
                4K Drones
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Floating Trust Pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-3 pt-2"
        >
          {pills.map((label) => (
            <span
              key={label}
              className="rounded-full spatial-surface px-4 py-2 text-xs font-bold text-muted-foreground flex items-center gap-1.5 border border-border/60"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              <span>{label}</span>
            </span>
          ))}
        </motion.div>

        {/* Spatial Card Feature Grid */}
        <motion.div
          style={
            isTouchOrReducedMotion
              ? {}
              : {
                  rotateX: mousePos.y * -10,
                  rotateY: mousePos.x * 10,
                }
          }
          transition={{ type: "spring", stiffness: 120, damping: 25 }}
          className="hidden md:grid grid-cols-3 gap-6 max-w-4xl mx-auto perspective-1000 pt-6"
        >
          <div className="spatial-card p-5 text-left space-y-3 bg-card/80 backdrop-blur-md">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Zap className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-sm text-foreground">Instant Booking &amp; Pickup</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Reserve gear online and pick it up same-day or choose doorstep express delivery.
            </p>
          </div>

          <div className="spatial-card p-5 text-left space-y-3 bg-card/80 backdrop-blur-md -translate-y-2">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-sm text-foreground">Full Damage Protection</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Every rental is covered up to ₹500,000 for verified lenders and renters.
            </p>
          </div>

          <div className="spatial-card p-5 text-left space-y-3 bg-card/80 backdrop-blur-md">
            <div className="h-10 w-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center font-bold">
              <Award className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-sm text-foreground">Verified Pro Equipment</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tested, inspected flagship gear from Sony, RED, Apple, DJI, and Canon.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
