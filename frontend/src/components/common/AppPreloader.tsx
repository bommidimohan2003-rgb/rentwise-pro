import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

interface AppPreloaderProps {
  onComplete?: () => void;
  forceShow?: boolean;
}

type PreloaderPhase =
  | "top-left-p-hold"   // 0.00s - 2.00s: Single white "P" shown in the top-left corner
  | "top-left-p-up"     // 2.00s - 2.70s: Top-left "P" smoothly moves upwards and exits
  | "center-typing"     // 2.30s - 3.70s: Word "PAYENT" typed in center of black background
  | "center-hold"       // 3.70s - 4.20s: Complete "PAYENT" holds in the middle
  | "move-left-landing" // 4.20s - 5.30s: "PAYENT" moves from middle to left side & home lands
  | "complete";         // 5.40s+: Preloader disappears, normal website interactivity

const LETTERS = ["P", "A", "Y", "E", "N", "T"];

export function AppPreloader({
  onComplete,
  forceShow = false,
}: AppPreloaderProps) {
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [phase, setPhase] = useState<PreloaderPhase>("top-left-p-hold");
  const [typedCount, setTypedCount] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  // Target coordinates for permanent navbar brand logo
  const [navTarget, setNavTarget] = useState({
    top: 34,
    left: 80,
    width: 100,
    height: 32,
  });

  // Check if session has already seen the preloader
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

  // Measure navbar logo coordinates from DOM
  useEffect(() => {
    if (!isVisible) return;

    const measureNavPos = () => {
      const navEl = document.getElementById("nav-logo");
      if (navEl) {
        const rect = navEl.getBoundingClientRect();
        setNavTarget({
          top: rect.top + rect.height / 2,
          left: rect.left + rect.width / 2,
          width: rect.width,
          height: rect.height,
        });
      } else {
        const isDesktop = window.innerWidth >= 1024;
        const isTablet = window.innerWidth >= 640;
        const maxW = 1280;
        const pad = isDesktop ? 32 : isTablet ? 24 : 16;
        const leftBase = Math.max(pad, (window.innerWidth - maxW) / 2 + pad);
        setNavTarget({
          top: isTablet ? 34 : 32,
          left: leftBase + 48,
          width: 90,
          height: 32,
        });
      }
    };

    measureNavPos();
    window.addEventListener("resize", measureNavPos);
    return () => window.removeEventListener("resize", measureNavPos);
  }, [isVisible]);

  // Sequence Timeline
  useEffect(() => {
    if (!isVisible) return;

    if (shouldReduceMotion) {
      const tReduce = setTimeout(() => {
        setIsVisible(false);
        try {
          sessionStorage.setItem("payent:preloaded", "true");
        } catch {}
        if (onComplete) onComplete();
      }, 700);
      return () => clearTimeout(tReduce);
    }

    // ----------------------------------------------------
    // TIMELINE:
    // 1. 0.00s - 2.00s: Black background, single white "P" in top-left corner (Holds 2s)
    //    2.00s - 2.70s: Top-left "P" moves upwards
    // 2. 2.30s - 3.70s: "PAYENT" typed letter-by-letter in the middle/center
    //    3.70s - 4.20s: Complete "PAYENT" holds in the middle
    // 3. 4.20s - 5.30s: "PAYENT" moves from middle to left side; Home page lands simultaneously
    //    5.40s+: Preloader disappears, normal site interaction
    // ----------------------------------------------------

    const timers: NodeJS.Timeout[] = [];

    // Step 1: After 2 seconds, top-left "P" moves upwards
    timers.push(
      setTimeout(() => {
        setPhase("top-left-p-up");
      }, 2000)
    );

    // Step 2: Begin typing "PAYENT" in the center at 2.30s
    timers.push(
      setTimeout(() => {
        setPhase("center-typing");
        setTypedCount(1); // 'P'
      }, 2300)
    );

    // Typing sequence for remaining letters
    timers.push(setTimeout(() => setTypedCount(2), 2500)); // 'PA'
    timers.push(setTimeout(() => setTypedCount(3), 2700)); // 'PAY'
    timers.push(setTimeout(() => setTypedCount(4), 2900)); // 'PAYE'
    timers.push(setTimeout(() => setTypedCount(5), 3100)); // 'PAYEN'
    timers.push(setTimeout(() => setTypedCount(6), 3300)); // 'PAYENT'

    // Center hold
    timers.push(
      setTimeout(() => {
        setPhase("center-hold");
      }, 3700)
    );

    // Step 3: Move from middle to left side + Home page lands simultaneously
    timers.push(
      setTimeout(() => {
        setPhase("move-left-landing");
      }, 4200)
    );

    // Preloader complete
    timers.push(
      setTimeout(() => {
        setPhase("complete");
        setIsVisible(false);
        try {
          sessionStorage.setItem("payent:preloaded", "true");
        } catch {}
        if (onComplete) onComplete();
      }, 5400)
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [isVisible, shouldReduceMotion, onComplete]);

  if (!mounted || !isVisible) return null;

  // Reduced motion fallback
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
            <span className="text-3xl font-sans font-black tracking-tight text-white">
              PAYENT
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  const showTopLeftP =
    phase === "top-left-p-hold" || phase === "top-left-p-up";
  const isTopLeftPMovingUp = phase === "top-left-p-up";

  const showCenterWord =
    phase === "center-typing" ||
    phase === "center-hold" ||
    phase === "move-left-landing";

  const isMovingToLeft = phase === "move-left-landing";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="payent-cinematic-preloader"
          initial={{ opacity: 1 }}
          animate={{
            // Black background dissolves as PAYENT moves to the left and home page lands
            opacity: isMovingToLeft ? 0 : 1,
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 1.0,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="fixed inset-0 z-[99999] bg-[#000000] text-white select-none overflow-hidden pointer-events-none"
          style={{ willChange: "opacity" }}
        >
          {/* ==================================================== */}
          {/* 1. TOP-LEFT CORNER "P" (HOLDS 2s, THEN MOVES UP)     */}
          {/* ==================================================== */}
          <AnimatePresence>
            {showTopLeftP && (
              <motion.div
                key="top-left-p-mark"
                initial={{
                  position: "absolute",
                  top: navTarget.top - 18,
                  left: navTarget.left - navTarget.width / 2,
                  y: 0,
                  opacity: 1,
                }}
                animate={{
                  position: "absolute",
                  top: navTarget.top - 18,
                  left: navTarget.left - navTarget.width / 2,
                  // After 2 seconds, moves smoothly upwards
                  y: isTopLeftPMovingUp ? -60 : 0,
                  opacity: isTopLeftPMovingUp ? 0 : 1,
                }}
                exit={{
                  y: -60,
                  opacity: 0,
                  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
                }}
                transition={{
                  duration: 0.7,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="z-40 pointer-events-none flex items-center select-none"
              >
                <span className="font-sans font-black tracking-tight text-3xl sm:text-4xl text-white leading-none drop-shadow-lg">
                  P
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ==================================================== */}
          {/* 2. "PAYENT" TYPED IN THE MIDDLE (CENTER)             */}
          {/*    THEN MOVES FROM MIDDLE -> LEFT SIDE AS HOME LANDS */}
          {/* ==================================================== */}
          {showCenterWord && (
            <motion.div
              initial={{
                position: "fixed",
                top: "50%",
                left: "50%",
                x: "-50%",
                y: "-50%",
                scale: 1,
                opacity: 1,
              }}
              animate={
                isMovingToLeft
                  ? {
                      position: "fixed",
                      top: navTarget.top,
                      left: navTarget.left,
                      x: "-50%",
                      y: "-50%",
                      // Scales proportionally to match navbar logo size
                      scale: typeof window !== "undefined" && window.innerWidth < 640 ? 0.42 : 0.48,
                      opacity: 1,
                    }
                  : {
                      position: "fixed",
                      top: "50%",
                      left: "50%",
                      x: "-50%",
                      y: "-50%",
                      scale: 1,
                      opacity: 1,
                    }
              }
              transition={
                isMovingToLeft
                  ? {
                      duration: 1.0,
                      ease: [0.22, 1, 0.36, 1],
                    }
                  : {
                      duration: 0.35,
                      ease: [0.22, 1, 0.36, 1],
                    }
              }
              className="z-50 pointer-events-none flex items-center justify-center select-none origin-center"
              style={{ willChange: "transform, top, left" }}
            >
              {/* Reserved fixed word width prevents horizontal shift as letters are typed */}
              <div className="inline-flex items-center justify-center font-sans font-black tracking-tight text-4xl sm:text-6xl md:text-7xl text-white leading-none drop-shadow-2xl">
                {LETTERS.map((char, index) => {
                  const isCharVisible = index < typedCount;
                  return (
                    <motion.span
                      key={index}
                      initial={{ opacity: 0, scale: 0.92, filter: "blur(4px)" }}
                      animate={{
                        opacity: isCharVisible ? 1 : 0,
                        scale: isCharVisible ? 1 : 0.92,
                        filter: isCharVisible ? "blur(0px)" : "blur(4px)",
                      }}
                      transition={{
                        duration: 0.22,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="inline-block"
                    >
                      {char}
                    </motion.span>
                  );
                })}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AppPreloader;
