import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

interface AppPreloaderProps {
  onComplete?: () => void;
  forceShow?: boolean;
}

type PreloaderPhase =
  | "p-center-hold"     // 0.00s - 2.00s: Single white "P" holds in exact viewport center
  | "p-move-up"         // 2.00s - 2.80s: "P" smoothly moves upward
  | "payent-typing"     // 2.80s - 3.90s: "PAYENT" typed letter-by-letter in the center
  | "payent-hold"       // 3.90s - 4.40s: Complete "PAYENT" holds in center
  | "payent-move-left"  // 4.40s - 5.40s: "PAYENT" moves horizontally center -> left; home reveals
  | "complete";         // 5.90s+: Preloader unmounts, normal website interactivity

const LETTERS = ["P", "A", "Y", "E", "N", "T"];

export function AppPreloader({
  onComplete,
  forceShow = false,
}: AppPreloaderProps) {
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [phase, setPhase] = useState<PreloaderPhase>("p-center-hold");
  const [typedCount, setTypedCount] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  // Target coordinates for navbar brand logo
  const [navTarget, setNavTarget] = useState({
    top: 34,
    left: 80,
    width: 100,
    height: 32,
  });

  // Track whether user has already seen preloader in this session
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

  // Dynamically measure navbar logo position from the DOM
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

  // Master Timeline Orchestration
  useEffect(() => {
    if (!isVisible) return;

    // Accessibility fallback for reduced motion preference
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
    // 0.00s - 2.00s: Pure black screen, single white "P" in center (Hold)
    // 2.00s - 2.80s: "P" smoothly moves upward
    // 2.80s - 3.90s: "PAYENT" typed letter-by-letter
    // 3.90s - 4.40s: "PAYENT" holds in center
    // 4.40s - 5.40s: "PAYENT" moves center -> left (home reveals)
    // 5.40s - 5.90s: Home content settles
    // 5.90s+: Preloader unmounts
    // ----------------------------------------------------

    const timers: NodeJS.Timeout[] = [];

    // Phase 3: P moves up at 2.00s
    timers.push(
      setTimeout(() => {
        setPhase("p-move-up");
      }, 2000)
    );

    // Phase 4: Begin typing PAYENT at 2.80s
    timers.push(
      setTimeout(() => {
        setPhase("payent-typing");
        setTypedCount(1); // 'P'
      }, 2800)
    );

    // Stagger letters 'A', 'Y', 'E', 'N', 'T' (every ~180ms)
    timers.push(setTimeout(() => setTypedCount(2), 3000)); // 'PA'
    timers.push(setTimeout(() => setTypedCount(3), 3200)); // 'PAY'
    timers.push(setTimeout(() => setTypedCount(4), 3400)); // 'PAYE'
    timers.push(setTimeout(() => setTypedCount(5), 3600)); // 'PAYEN'
    timers.push(setTimeout(() => setTypedCount(6), 3800)); // 'PAYENT'

    // Phase 5: PAYENT center hold at 3.90s
    timers.push(
      setTimeout(() => {
        setPhase("payent-hold");
      }, 3900)
    );

    // Phase 6 & 8: Move from Center -> Left & Reveal Home page simultaneously at 4.40s
    timers.push(
      setTimeout(() => {
        setPhase("payent-move-left");
      }, 4400)
    );

    // Phase 12: Complete preloader at 5.90s
    timers.push(
      setTimeout(() => {
        setPhase("complete");
        setIsVisible(false);
        try {
          sessionStorage.setItem("payent:preloaded", "true");
        } catch {}
        if (onComplete) onComplete();
      }, 5900)
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [isVisible, shouldReduceMotion, onComplete]);

  if (!mounted || !isVisible) return null;

  // Reduced motion render
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

  // Animation phase flags
  const isPMovedUp =
    phase === "p-move-up" ||
    phase === "payent-typing" ||
    phase === "payent-hold" ||
    phase === "payent-move-left";

  const showTypingWord =
    phase === "payent-typing" ||
    phase === "payent-hold" ||
    phase === "payent-move-left";

  const isMovingLeft = phase === "payent-move-left";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="payent-cinematic-preloader"
          initial={{ opacity: 1 }}
          animate={{
            // Black background seamlessly fades out starting at 4.40s when PAYENT travels to the left
            opacity: isMovingLeft ? 0 : 1,
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 1.1,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="fixed inset-0 z-[99999] bg-[#000000] text-white select-none overflow-hidden pointer-events-none"
          style={{ willChange: "opacity" }}
        >
          {/* ==================================================== */}
          {/* 1. CENTER "P" (HOLDS, MOVES UP, FADES ON LEFT MOVE)   */}
          {/* ==================================================== */}
          <motion.div
            initial={{
              position: "fixed",
              top: "50%",
              left: "50%",
              x: "-50%",
              y: "-50%",
              opacity: 1,
              scale: 1,
            }}
            animate={{
              position: "fixed",
              top: "50%",
              left: "50%",
              x: "-50%",
              // Moves up smoothly by ~48px-56px at 2.00s
              y: isPMovedUp ? "calc(-50% - 48px)" : "-50%",
              // Gently dissolves when the full wordmark travels to header
              opacity: isMovingLeft ? 0 : 1,
              scale: isPMovedUp ? 0.95 : 1,
            }}
            transition={{
              duration: 0.8,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="z-40 pointer-events-none flex items-center justify-center select-none"
          >
            <span className="font-sans font-black tracking-tight text-6xl sm:text-7xl md:text-8xl text-white leading-none drop-shadow-2xl">
              P
            </span>
          </motion.div>

          {/* ==================================================== */}
          {/* 2. "PAYENT" WORDMARK (TYPED LETTER-BY-LETTER)         */}
          {/*    THEN MOVES FROM VIEWPORT CENTER -> NAVBAR LEFT    */}
          {/* ==================================================== */}
          {showTypingWord && (
            <motion.div
              initial={{
                position: "fixed",
                top: "50%",
                left: "50%",
                x: "-50%",
                y: "calc(-50% + 24px)",
                scale: 1,
                opacity: 1,
              }}
              animate={
                isMovingLeft
                  ? {
                      position: "fixed",
                      top: navTarget.top,
                      left: navTarget.left,
                      x: "-50%",
                      y: "-50%",
                      // Scales proportionally to match the exact navbar logo size (~20px text)
                      scale: typeof window !== "undefined" && window.innerWidth < 640 ? 0.42 : 0.48,
                      opacity: 1,
                    }
                  : {
                      position: "fixed",
                      top: "50%",
                      left: "50%",
                      x: "-50%",
                      y: "calc(-50% + 24px)",
                      scale: 1,
                      opacity: 1,
                    }
              }
              transition={
                isMovingLeft
                  ? {
                      duration: 1.0,
                      ease: [0.22, 1, 0.36, 1],
                    }
                  : {
                      duration: 0.4,
                      ease: [0.22, 1, 0.36, 1],
                    }
              }
              className="z-50 pointer-events-none flex items-center justify-center select-none origin-center"
              style={{ willChange: "transform, top, left" }}
            >
              {/* Reserved fixed wordmark container ensures zero layout shift while letters appear */}
              <div className="inline-flex items-center justify-center font-sans font-black tracking-tight text-4xl sm:text-5xl md:text-6xl text-white leading-none">
                {LETTERS.map((char, index) => {
                  const isCharVisible = index < typedCount;
                  return (
                    <motion.span
                      key={index}
                      initial={{ opacity: 0, scale: 0.94, filter: "blur(4px)" }}
                      animate={{
                        opacity: isCharVisible ? 1 : 0,
                        scale: isCharVisible ? 1 : 0.94,
                        filter: isCharVisible ? "blur(0px)" : "blur(4px)",
                      }}
                      transition={{
                        duration: 0.24,
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
