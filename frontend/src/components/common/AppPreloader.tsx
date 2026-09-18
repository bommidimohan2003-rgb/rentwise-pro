import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Camera,
  Film,
  Laptop,
  Monitor,
  Plane,
  Navigation,
  Headphones,
  Mic2,
  Sun,
  Projector,
  Gamepad2,
  Glasses,
} from "lucide-react";
import { PayentLogoMark } from "@/components/common/LogoIcon";

interface AppPreloaderProps {
  onComplete?: () => void;
  forceShow?: boolean;
}

type PreloaderStage =
  | "black"
  | "entry"
  | "converge"
  | "transform"
  | "wordmark"
  | "exit";

export function AppPreloader({
  onComplete,
  forceShow = false,
}: AppPreloaderProps) {
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const [stage, setStage] = useState<PreloaderStage>("black");

  useEffect(() => {
    setMounted(true);
    let hasSeen = false;
    try {
      hasSeen =
        !forceShow && Boolean(sessionStorage.getItem("payent:preloaded"));
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
    if (!isVisible) return;

    if (shouldReduceMotion) {
      // Clean, minimal fade for reduced motion
      const t1 = setTimeout(() => setStage("wordmark"), 150);
      const t2 = setTimeout(() => {
        setIsVisible(false);
        try {
          sessionStorage.setItem("payent:preloaded", "true");
        } catch {}
        if (onComplete) onComplete();
      }, 750);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }

    // STEP 1 — BLACK START (0.0s - 0.35s)
    setStage("black");

    // STEP 2 — SYMBOL ENTRY FROM 6 DIRECTIONS (0.35s - 1.25s)
    const tEntry = setTimeout(() => {
      setStage("entry");
    }, 350);

    // STEP 3 — SMOOTH CONVERGENCE (1.25s - 1.75s)
    const tConverge = setTimeout(() => {
      setStage("converge");
    }, 1250);

    // STEP 4 — TRANSFORMATION INTO GREEN PAYENT LOGO (1.75s - 2.20s)
    const tTransform = setTimeout(() => {
      setStage("transform");
    }, 1750);

    // STEP 5 — FINAL PAYENT GREEN WORDMARK (2.20s - 2.65s)
    const tWordmark = setTimeout(() => {
      setStage("wordmark");
    }, 2200);

    // STEP 6 — SMOOTH APPLICATION REVEAL EXIT (2.65s - 2.95s)
    const tExit = setTimeout(() => {
      setStage("exit");
    }, 2650);

    const tComplete = setTimeout(() => {
      setIsVisible(false);
      try {
        sessionStorage.setItem("payent:preloaded", "true");
      } catch {}
      if (onComplete) onComplete();
    }, 2950);

    return () => {
      clearTimeout(tEntry);
      clearTimeout(tConverge);
      clearTimeout(tTransform);
      clearTimeout(tWordmark);
      clearTimeout(tExit);
      clearTimeout(tComplete);
    };
  }, [isVisible, shouldReduceMotion, onComplete]);

  if (!mounted || !isVisible) return null;

  // Reduced motion view
  if (shouldReduceMotion) {
    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            key="payent-preloader-reduced"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#000000] text-white select-none"
          >
            <div className="flex flex-col items-center justify-center gap-3">
              <PayentLogoMark className="h-16 w-16" />
              <span className="text-3xl font-sans font-black tracking-tight text-emerald-400">
                PAYENT
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  const isEntry = stage !== "black";
  const isConverged =
    stage === "converge" ||
    stage === "transform" ||
    stage === "wordmark" ||
    stage === "exit";
  const isLogoVisible =
    stage === "transform" || stage === "wordmark" || stage === "exit";
  const isWordmarkVisible = stage === "wordmark" || stage === "exit";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="payent-preloader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#000000] text-white select-none overflow-hidden"
          style={{ willChange: "opacity" }}
        >
          {/* Subtle Ambient Emerald Illumination on Brand Reveal */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isLogoVisible ? 0.35 : 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] sm:w-[500px] sm:h-[500px] bg-emerald-500/15 rounded-full blur-[110px] pointer-events-none"
          />

          {/* Central 6-Direction Stage */}
          <div className="relative w-72 h-72 sm:w-96 sm:h-96 md:w-[420px] md:h-[420px] flex items-center justify-center">
            {/* --- 1. TOP-LEFT: Cameras & Cinema --- */}
            <motion.div
              initial={{ x: -160, y: -140, opacity: 0, scale: 0.7 }}
              animate={{
                x: isConverged ? 0 : isEntry ? -95 : -160,
                y: isConverged ? 0 : isEntry ? -85 : -140,
                opacity: isLogoVisible ? 0 : isEntry ? 0.95 : 0,
                scale: isLogoVisible ? 0.2 : isConverged ? 0.6 : 1,
              }}
              transition={{
                duration: isConverged ? 0.5 : 0.75,
                ease: [0.16, 1, 0.3, 1],
                delay: isConverged ? 0 : 0.04,
              }}
              className="absolute flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/20 backdrop-blur-md text-white shadow-[0_4px_16px_rgba(0,0,0,0.6)]"
            >
              <Camera className="w-4 h-4 text-white" />
              <Film className="w-3.5 h-3.5 text-white/80" />
              <span className="text-[10px] font-mono font-medium tracking-wider text-white">
                CAMERAS
              </span>
            </motion.div>

            {/* --- 2. TOP-CENTER: Workstations & Laptops --- */}
            <motion.div
              initial={{ x: 0, y: -160, opacity: 0, scale: 0.7 }}
              animate={{
                x: 0,
                y: isConverged ? 0 : isEntry ? -115 : -160,
                opacity: isLogoVisible ? 0 : isEntry ? 0.95 : 0,
                scale: isLogoVisible ? 0.2 : isConverged ? 0.6 : 1,
              }}
              transition={{
                duration: isConverged ? 0.5 : 0.75,
                ease: [0.16, 1, 0.3, 1],
                delay: isConverged ? 0 : 0.08,
              }}
              className="absolute flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/20 backdrop-blur-md text-white shadow-[0_4px_16px_rgba(0,0,0,0.6)]"
            >
              <Laptop className="w-4 h-4 text-white" />
              <Monitor className="w-3.5 h-3.5 text-white/80" />
              <span className="text-[10px] font-mono font-medium tracking-wider text-white">
                STUDIO
              </span>
            </motion.div>

            {/* --- 3. TOP-RIGHT: Drones & Aerial Capture --- */}
            <motion.div
              initial={{ x: 160, y: -140, opacity: 0, scale: 0.7 }}
              animate={{
                x: isConverged ? 0 : isEntry ? 95 : 160,
                y: isConverged ? 0 : isEntry ? -85 : -140,
                opacity: isLogoVisible ? 0 : isEntry ? 0.95 : 0,
                scale: isLogoVisible ? 0.2 : isConverged ? 0.6 : 1,
              }}
              transition={{
                duration: isConverged ? 0.5 : 0.75,
                ease: [0.16, 1, 0.3, 1],
                delay: isConverged ? 0 : 0.12,
              }}
              className="absolute flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/20 backdrop-blur-md text-white shadow-[0_4px_16px_rgba(0,0,0,0.6)]"
            >
              <Plane className="w-4 h-4 text-white" />
              <Navigation className="w-3.5 h-3.5 text-white/80" />
              <span className="text-[10px] font-mono font-medium tracking-wider text-white">
                DRONES
              </span>
            </motion.div>

            {/* --- 4. BOTTOM-LEFT: Audio & Microphones --- */}
            <motion.div
              initial={{ x: -160, y: 140, opacity: 0, scale: 0.7 }}
              animate={{
                x: isConverged ? 0 : isEntry ? -95 : -160,
                y: isConverged ? 0 : isEntry ? 85 : 140,
                opacity: isLogoVisible ? 0 : isEntry ? 0.95 : 0,
                scale: isLogoVisible ? 0.2 : isConverged ? 0.6 : 1,
              }}
              transition={{
                duration: isConverged ? 0.5 : 0.75,
                ease: [0.16, 1, 0.3, 1],
                delay: isConverged ? 0 : 0.16,
              }}
              className="absolute flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/20 backdrop-blur-md text-white shadow-[0_4px_16px_rgba(0,0,0,0.6)]"
            >
              <Headphones className="w-4 h-4 text-white" />
              <Mic2 className="w-3.5 h-3.5 text-white/80" />
              <span className="text-[10px] font-mono font-medium tracking-wider text-white">
                AUDIO
              </span>
            </motion.div>

            {/* --- 5. BOTTOM-CENTER: Lighting & Projection --- */}
            <motion.div
              initial={{ x: 0, y: 160, opacity: 0, scale: 0.7 }}
              animate={{
                x: 0,
                y: isConverged ? 0 : isEntry ? 115 : 160,
                opacity: isLogoVisible ? 0 : isEntry ? 0.95 : 0,
                scale: isLogoVisible ? 0.2 : isConverged ? 0.6 : 1,
              }}
              transition={{
                duration: isConverged ? 0.5 : 0.75,
                ease: [0.16, 1, 0.3, 1],
                delay: isConverged ? 0 : 0.2,
              }}
              className="absolute flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/20 backdrop-blur-md text-white shadow-[0_4px_16px_rgba(0,0,0,0.6)]"
            >
              <Sun className="w-4 h-4 text-white" />
              <Projector className="w-3.5 h-3.5 text-white/80" />
              <span className="text-[10px] font-mono font-medium tracking-wider text-white">
                LIGHTING
              </span>
            </motion.div>

            {/* --- 6. BOTTOM-RIGHT: VR & Entertainment --- */}
            <motion.div
              initial={{ x: 160, y: 140, opacity: 0, scale: 0.7 }}
              animate={{
                x: isConverged ? 0 : isEntry ? 95 : 160,
                y: isConverged ? 0 : isEntry ? 85 : 140,
                opacity: isLogoVisible ? 0 : isEntry ? 0.95 : 0,
                scale: isLogoVisible ? 0.2 : isConverged ? 0.6 : 1,
              }}
              transition={{
                duration: isConverged ? 0.5 : 0.75,
                ease: [0.16, 1, 0.3, 1],
                delay: isConverged ? 0 : 0.24,
              }}
              className="absolute flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/20 backdrop-blur-md text-white shadow-[0_4px_16px_rgba(0,0,0,0.6)]"
            >
              <Gamepad2 className="w-4 h-4 text-white" />
              <Glasses className="w-3.5 h-3.5 text-white/80" />
              <span className="text-[10px] font-mono font-medium tracking-wider text-white">
                VR GEAR
              </span>
            </motion.div>

            {/* --- CENTER TRANSFORMATION: Canonical Green PAYENT Logo --- */}
            <motion.div
              initial={{ scale: 0, opacity: 0, rotate: -20 }}
              animate={{
                scale: isLogoVisible ? 1 : 0,
                opacity: isLogoVisible ? 1 : 0,
                rotate: isLogoVisible ? 0 : -20,
              }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-20 flex items-center justify-center drop-shadow-[0_0_30px_rgba(16,185,129,0.7)]"
            >
              <PayentLogoMark className="h-16 w-16 sm:h-20 sm:w-20" />
            </motion.div>
          </div>

          {/* --- FINAL BRAND WORDMARK: Centered Green PAYENT Wordmark --- */}
          <div className="h-12 flex items-center justify-center -mt-2">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{
                opacity: isWordmarkVisible ? 1 : 0,
                y: isWordmarkVisible ? 0 : 8,
              }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex items-center justify-center"
            >
              <span className="text-3xl sm:text-4xl font-sans font-black tracking-tight text-emerald-400 drop-shadow-[0_2px_16px_rgba(16,185,129,0.5)]">
                PAYENT
              </span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
