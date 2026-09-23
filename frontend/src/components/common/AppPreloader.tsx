import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { PayentLogoMark } from "@/components/common/LogoIcon";

interface AppPreloaderProps {
  onComplete?: () => void;
  forceShow?: boolean;
}

type PreloaderPhase =
  | "black"
  | "p-intro"
  | "p-hold"
  | "wordmark-reveal"
  | "brand-hold"
  | "move-left-reveal"
  | "complete";

export function AppPreloader({
  onComplete,
  forceShow = false,
}: AppPreloaderProps) {
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [phase, setPhase] = useState<PreloaderPhase>("black");
  const shouldReduceMotion = useReducedMotion();

  // Target coordinates for navbar logo
  const [navTarget, setNavTarget] = useState({ top: 16, left: 24, scale: 0.8 });

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

  // Measure actual nav logo position if present in DOM
  useEffect(() => {
    if (!isVisible) return;
    const calculateNavPos = () => {
      const navEl = document.getElementById("nav-logo");
      if (navEl) {
        const rect = navEl.getBoundingClientRect();
        setNavTarget({
          top: rect.top + rect.height / 2,
          left: rect.left + rect.width / 2,
          scale: 0.82,
        });
      } else {
        const isDesktop = window.innerWidth >= 1024;
        const isTablet = window.innerWidth >= 640;
        const maxW = 1280;
        const pad = isDesktop ? 32 : isTablet ? 24 : 16;
        const leftBase = Math.max(pad, (window.innerWidth - maxW) / 2 + pad);
        setNavTarget({
          top: isTablet ? 34 : 32,
          left: leftBase + 45,
          scale: 0.82,
        });
      }
    };

    calculateNavPos();
    window.addEventListener("resize", calculateNavPos);
    return () => window.removeEventListener("resize", calculateNavPos);
  }, [isVisible]);

  // Master timeline orchestration
  useEffect(() => {
    if (!isVisible) return;

    if (shouldReduceMotion) {
      // Accessible reduced motion path
      const t1 = setTimeout(() => {
        setIsVisible(false);
        try {
          sessionStorage.setItem("payent:preloaded", "true");
        } catch {}
        if (onComplete) onComplete();
      }, 700);
      return () => clearTimeout(t1);
    }

    // PHASE 1 — BLACK SCREEN START (0.0s) -> P INTRO (0.15s - 0.75s)
    const tIntro = setTimeout(() => {
      setPhase("p-intro");
    }, 150);

    // PHASE 2 — P HOLD IN TOP-LEFT (0.75s - 1.60s)
    const tHold = setTimeout(() => {
      setPhase("p-hold");
    }, 750);

    // PHASE 3 — WORDMARK REVEAL IN CENTER (1.60s - 2.45s)
    const tWordmark = setTimeout(() => {
      setPhase("wordmark-reveal");
    }, 1600);

    // PHASE 4 — BRAND HOLD IN CENTER (2.45s - 3.05s)
    const tBrandHold = setTimeout(() => {
      setPhase("brand-hold");
    }, 2450);

    // PHASE 5 & 6 — PAYENT MOVES LEFT & HOME EMERGES (3.05s - 3.95s)
    const tMoveLeft = setTimeout(() => {
      setPhase("move-left-reveal");
    }, 3050);

    // PHASE 7 — SETTLE & COMPLETE (3.95s - 4.25s)
    const tComplete = setTimeout(() => {
      setPhase("complete");
      setIsVisible(false);
      try {
        sessionStorage.setItem("payent:preloaded", "true");
      } catch {}
      if (onComplete) onComplete();
    }, 4000);

    return () => {
      clearTimeout(tIntro);
      clearTimeout(tHold);
      clearTimeout(tWordmark);
      clearTimeout(tBrandHold);
      clearTimeout(tMoveLeft);
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
            key="preloader-reduced"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-[#000000] text-white select-none pointer-events-none"
          >
            <div className="flex items-center gap-3">
              <PayentLogoMark className="h-10 w-10" />
              <span className="text-2xl font-black tracking-tight text-white">
                PAYENT
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  const isPIntroOrHold = phase === "p-intro" || phase === "p-hold";
  const isCentered = phase === "wordmark-reveal" || phase === "brand-hold";
  const isMovingLeft = phase === "move-left-reveal";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="payent-master-preloader"
          initial={{ opacity: 1 }}
          animate={{
            opacity: isMovingLeft ? 0 : 1,
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 0.85,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="fixed inset-0 z-[99999] bg-[#000000] text-white select-none overflow-hidden pointer-events-none"
        >
          {/* Subtle Ambient Radial Glow */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: isCentered ? 0.25 : isPIntroOrHold ? 0.15 : 0,
            }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="w-[600px] h-[600px] bg-emerald-500/15 rounded-full blur-[140px]" />
          </motion.div>

          {/* ==================================================== */}
          {/* 1. TOP-LEFT "P" LOGO (PHASE 1 & 2)                  */}
          {/* ==================================================== */}
          <AnimatePresence>
            {isPIntroOrHold && (
              <motion.div
                key="top-left-p"
                initial={{ opacity: 0, scale: 0.92, filter: "blur(6px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{
                  opacity: 0,
                  scale: 0.95,
                  filter: "blur(4px)",
                  transition: { duration: 0.35, ease: "easeIn" },
                }}
                transition={{
                  duration: 0.65,
                  ease: [0.16, 1, 0.3, 1],
                }}
                style={{
                  position: "absolute",
                  top: navTarget.top - 18,
                  left: navTarget.left - 45,
                }}
                className="flex items-center gap-2.5 z-20"
              >
                <PayentLogoMark className="h-9 w-9 sm:h-10 sm:w-10 shadow-2xl" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ==================================================== */}
          {/* 2. CENTERED "PAYENT" WORDMARK & MOVE LEFT (PHASE 3-6) */}
          {/* ==================================================== */}
          {(isCentered || isMovingLeft) && (
            <motion.div
              layoutId="payent-wordmark-transform"
              initial={{
                position: "fixed",
                top: "50%",
                left: "50%",
                x: "-50%",
                y: "-50%",
                scale: 1,
              }}
              animate={
                isMovingLeft
                  ? {
                      top: navTarget.top,
                      left: navTarget.left,
                      x: "-50%",
                      y: "-50%",
                      scale: navTarget.scale,
                    }
                  : {
                      top: "50%",
                      left: "50%",
                      x: "-50%",
                      y: "-50%",
                      scale: 1,
                    }
              }
              transition={{
                duration: 0.85,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="z-30 flex items-center gap-3.5 sm:gap-4 shrink-0 select-none origin-center"
            >
              {/* P Logo Mark */}
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              >
                <PayentLogoMark className="h-11 w-11 sm:h-14 sm:w-14 shadow-2xl" />
              </motion.div>

              {/* Progressively revealed "AYENT" letters from the P direction */}
              <div className="flex items-center overflow-hidden">
                <motion.span
                  initial={{
                    opacity: 0,
                    x: -18,
                    filter: "blur(6px)",
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    filter: "blur(0px)",
                  }}
                  transition={{
                    duration: 0.7,
                    delay: 0.1,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="font-sans font-black tracking-tight text-3xl sm:text-4xl md:text-5xl text-white tracking-wider drop-shadow-md"
                >
                  AYENT
                </motion.span>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AppPreloader;
