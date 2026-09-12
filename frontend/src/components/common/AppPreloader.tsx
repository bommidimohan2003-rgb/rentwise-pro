import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Camera,
  Plane,
  Laptop,
  Mic2,
  Sun,
} from "lucide-react";
import { PayentLogoMark } from "@/components/common/LogoIcon";

interface AppPreloaderProps {
  onComplete?: () => void;
  forceShow?: boolean;
}

export function AppPreloader({ onComplete, forceShow = false }: AppPreloaderProps) {
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const [stage, setStage] = useState<
    "enter" | "converge" | "compress" | "logo" | "wordmark" | "exit"
  >("enter");

  useEffect(() => {
    setMounted(true);
    let hasSeen = false;
    try {
      hasSeen = !forceShow && Boolean(sessionStorage.getItem("payent:preloaded"));
    } catch {
      hasSeen = false;
    }

    if (hasSeen) {
      if (onComplete) onComplete();
      return;
    }

    setIsVisible(true);
  }, [forceShow, onComplete]);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    if (shouldReduceMotion) {
      const t = setTimeout(() => {
        setIsVisible(false);
        try {
          sessionStorage.setItem("payent:preloaded", "true");
        } catch {}
        if (onComplete) onComplete();
      }, 400);
      return () => clearTimeout(t);
    }

    // Step 1: Converge toward center (0.4s)
    const t1 = setTimeout(() => {
      setStage("converge");
    }, 400);

    // Step 2: Compress into Green P logo (0.8s)
    const t2 = setTimeout(() => {
      setStage("logo");
    }, 850);

    // Step 3: Reveal PAYENT wordmark & tagline (1.2s)
    const t3 = setTimeout(() => {
      setStage("wordmark");
    }, 1200);

    // Step 4: Smooth exit fade (1.6s)
    const t4 = setTimeout(() => {
      setStage("exit");
    }, 1550);

    const t5 = setTimeout(() => {
      setIsVisible(false);
      try {
        sessionStorage.setItem("payent:preloaded", "true");
      } catch {
        /* ignore */
      }
      if (onComplete) onComplete();
    }, 1850);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [isVisible, shouldReduceMotion, onComplete]);

  if (!mounted || !isVisible) return null;

  const isConverged =
    stage === "converge" ||
    stage === "compress" ||
    stage === "logo" ||
    stage === "wordmark" ||
    stage === "exit";

  const isLogoVisible =
    stage === "logo" || stage === "wordmark" || stage === "exit";
  const isWordmarkVisible = stage === "wordmark" || stage === "exit";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="payent-preloader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#05090D] text-white select-none overflow-hidden"
          style={{ willChange: "opacity" }}
        >
          {/* Subtle Ambient Radial Glows */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-emerald-400/15 rounded-full blur-[90px] pointer-events-none" />

          {/* Quadrant Gear Symbols Stage */}
          <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
            {/* Ambient Convergence Ring */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{
                scale: isConverged ? 1.05 : 0.8,
                opacity: isLogoVisible ? 0 : 0.6,
                rotate: 360,
              }}
              transition={{
                rotate: { duration: 12, repeat: Infinity, ease: "linear" },
                scale: { duration: 0.8, ease: "easeOut" },
                opacity: { duration: 0.4 },
              }}
              className="absolute inset-0 rounded-full border border-emerald-500/20 border-dashed pointer-events-none"
            />

            {/* --- QUADRANT 1: TOP-LEFT (Camera / Cinema / REC) --- */}
            <motion.div
              initial={{ x: -140, y: -140, opacity: 0, scale: 0.5 }}
              animate={{
                x: isConverged ? 0 : -90,
                y: isConverged ? 0 : -90,
                opacity: isLogoVisible ? 0 : 1,
                scale: isLogoVisible ? 0.2 : 1,
              }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="absolute flex items-center gap-1.5 p-2.5 rounded-2xl bg-white/[0.04] border border-emerald-500/20 backdrop-blur-md text-emerald-400 shadow-[0_8px_24px_rgba(16,185,129,0.15)]"
            >
              <Camera className="w-5 h-5 text-emerald-400" />
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-mono font-bold tracking-widest text-white/90">
                  4K REC
                </span>
              </div>
            </motion.div>

            {/* --- QUADRANT 2: TOP-RIGHT (Drone / Aerial Flight) --- */}
            <motion.div
              initial={{ x: 140, y: -140, opacity: 0, scale: 0.5 }}
              animate={{
                x: isConverged ? 0 : 90,
                y: isConverged ? 0 : -90,
                opacity: isLogoVisible ? 0 : 1,
                scale: isLogoVisible ? 0.2 : 1,
              }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
              className="absolute flex items-center gap-1.5 p-2.5 rounded-2xl bg-white/[0.04] border border-emerald-500/20 backdrop-blur-md text-emerald-300 shadow-[0_8px_24px_rgba(16,185,129,0.15)]"
            >
              <Plane className="w-5 h-5 text-emerald-300" />
              <span className="text-[10px] font-mono font-bold tracking-wider text-white/90">
                AERIAL
              </span>
            </motion.div>

            {/* --- QUADRANT 3: BOTTOM-LEFT (Laptop / Creator Workstation) --- */}
            <motion.div
              initial={{ x: -140, y: 140, opacity: 0, scale: 0.5 }}
              animate={{
                x: isConverged ? 0 : -90,
                y: isConverged ? 0 : 90,
                opacity: isLogoVisible ? 0 : 1,
                scale: isLogoVisible ? 0.2 : 1,
              }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.16 }}
              className="absolute flex items-center gap-1.5 p-2.5 rounded-2xl bg-white/[0.04] border border-emerald-500/20 backdrop-blur-md text-emerald-400 shadow-[0_8px_24px_rgba(16,185,129,0.15)]"
            >
              <Laptop className="w-5 h-5 text-emerald-400" />
              <span className="text-[10px] font-mono font-bold tracking-wider text-white/90">
                STUDIO
              </span>
            </motion.div>

            {/* --- QUADRANT 4: BOTTOM-RIGHT (Audio / Studio Lighting) --- */}
            <motion.div
              initial={{ x: 140, y: 140, opacity: 0, scale: 0.5 }}
              animate={{
                x: isConverged ? 0 : 90,
                y: isConverged ? 0 : 90,
                opacity: isLogoVisible ? 0 : 1,
                scale: isLogoVisible ? 0.2 : 1,
              }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.24 }}
              className="absolute flex items-center gap-1.5 p-2.5 rounded-2xl bg-white/[0.04] border border-emerald-500/20 backdrop-blur-md text-emerald-300 shadow-[0_8px_24px_rgba(16,185,129,0.15)]"
            >
              <Mic2 className="w-4 h-4 text-emerald-300" />
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] font-mono font-bold tracking-wider text-white/90">
                SOUND
              </span>
            </motion.div>

            {/* --- CENTER: Green "P" Canonical Logo Mark --- */}
            <motion.div
              initial={{ scale: 0, opacity: 0, rotate: -30 }}
              animate={{
                scale: isLogoVisible ? 1 : 0,
                opacity: isLogoVisible ? 1 : 0,
                rotate: isLogoVisible ? 0 : -30,
              }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-20 flex items-center justify-center drop-shadow-[0_0_35px_rgba(16,185,129,0.7)]"
            >
              <PayentLogoMark className="h-16 w-16 sm:h-20 sm:w-20" />
            </motion.div>
          </div>

          {/* Wordmark & Tagline Reveal */}
          <div className="h-16 flex flex-col items-center justify-center mt-2 text-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: isWordmarkVisible ? 1 : 0,
                y: isWordmarkVisible ? 0 : 10,
              }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="flex flex-col items-center"
            >
              <span className="text-2xl sm:text-3xl font-sans font-black tracking-tight text-white leading-none">
                Payent
              </span>
              <span className="text-[9px] sm:text-[10px] font-mono font-bold tracking-[0.25em] text-emerald-400 uppercase mt-2 leading-none">
                Gear Rental for Creators
              </span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
