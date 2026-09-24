import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

interface AppPreloaderProps {
  onComplete?: () => void;
  onLanding?: () => void;
  forceShow?: boolean;
}

type PreloaderPhase =
  | "top-left-p-hold"   // 0.0s - 2.0s: Single white "P" in top-left on black screen (holds 2s)
  | "top-left-p-up"     // 2.0s - 2.8s: Top-left "P" moves smoothly upward (800ms)
  | "pause-after-p"     // 2.8s - 4.8s: Intentional cinematic pause on black screen (2s)
  | "center-typing"     // 4.8s - 5.8s: Word "PAYENT" typed in exact center of black screen
  | "center-hold"       // 5.8s - 6.3s: Complete "PAYENT" holds in center (500ms)
  | "move-left-landing" // 6.3s - 7.3s: "PAYENT" moves center -> left & Home page lands simultaneously
  | "settling"          // 7.3s - 7.8s: Home page & brand settle into final position
  | "complete";         // 7.8s+: Preloader removed, website fully interactive

const LETTERS = ["P", "A", "Y", "E", "N", "T"];
const PREMIUM_EASING = [0.22, 1, 0.36, 1];

export function AppPreloader({
  onComplete,
  onLanding,
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

  // Translation delta from viewport center to navbar target
  const [delta, setDelta] = useState({ x: -200, y: -300 });

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
      if (onLanding) onLanding();
      if (onComplete) onComplete();
      return;
    }

    setIsVisible(true);
  }, [forceShow, onComplete, onLanding]);

  // Measure navbar logo coordinates and compute center-to-left translation delta
  useEffect(() => {
    if (!isVisible) return;

    const measureNavPos = () => {
      const navEl = document.getElementById("nav-logo");
      let targetTop = 34;
      let targetLeft = 80;
      let targetW = 100;
      let targetH = 32;

      if (navEl) {
        const rect = navEl.getBoundingClientRect();
        targetTop = rect.top + rect.height / 2;
        targetLeft = rect.left + rect.width / 2;
        targetW = rect.width;
        targetH = rect.height;
      } else {
        const isDesktop = window.innerWidth >= 1024;
        const isTablet = window.innerWidth >= 640;
        const maxW = 1280;
        const pad = isDesktop ? 32 : isTablet ? 24 : 16;
        const leftBase = Math.max(pad, (window.innerWidth - maxW) / 2 + pad);
        targetTop = isTablet ? 34 : 32;
        targetLeft = leftBase + 48;
        targetW = 90;
        targetH = 32;
      }

      setNavTarget({
        top: targetTop,
        left: targetLeft,
        width: targetW,
        height: targetH,
      });

      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      setDelta({
        x: targetLeft - centerX,
        y: targetTop - centerY,
      });
    };

    measureNavPos();
    window.addEventListener("resize", measureNavPos);
    return () => window.removeEventListener("resize", measureNavPos);
  }, [isVisible]);

  // Exact Sequence Timeline
  useEffect(() => {
    if (!isVisible) return;

    if (shouldReduceMotion) {
      const tReduce = setTimeout(() => {
        setIsVisible(false);
        try {
          sessionStorage.setItem("payent:preloaded", "true");
        } catch {}
        if (onLanding) onLanding();
        if (onComplete) onComplete();
      }, 500);
      return () => clearTimeout(tReduce);
    }

    // ----------------------------------------------------
    // EXACT TIMELINE SPECIFICATION:
    // 0.0s – 2.0s: P holds in Top-Left (2.0s)
    // 2.0s – 2.8s: P moves Upward (800ms)
    // 2.8s – 4.8s: Black screen pause (2.0s)
    // 4.8s – 5.8s: PAYENT types in center (1.0s total: 200ms per letter)
    // 5.8s – 6.3s: PAYENT center hold (500ms)
    // 6.3s – 7.3s: PAYENT moves Center -> Left + Home page lands simultaneously (1000ms)
    // 7.3s – 7.8s: Settling (500ms)
    // 7.8s+: Complete
    // ----------------------------------------------------

    const timers: NodeJS.Timeout[] = [];

    // Phase 3: At 2.0s (2000ms), P moves smoothly upward
    timers.push(
      setTimeout(() => {
        setPhase("top-left-p-up");
      }, 2000)
    );

    // Phase 4: At 2.8s (2800ms), P has exited upward. Black background holds for 2 seconds.
    timers.push(
      setTimeout(() => {
        setPhase("pause-after-p");
      }, 2800)
    );

    // Phase 5: At 4.8s (4800ms), begin typing "PAYENT" in exact center
    timers.push(
      setTimeout(() => {
        setPhase("center-typing");
        setTypedCount(1); // 'P'
      }, 4800)
    );

    // Letter-by-letter typing reveals at 200ms intervals
    timers.push(setTimeout(() => setTypedCount(2), 5000)); // 'PA'
    timers.push(setTimeout(() => setTypedCount(3), 5200)); // 'PAY'
    timers.push(setTimeout(() => setTypedCount(4), 5400)); // 'PAYE'
    timers.push(setTimeout(() => setTypedCount(5), 5600)); // 'PAYEN'
    timers.push(setTimeout(() => setTypedCount(6), 5800)); // 'PAYENT'

    // Phase 6: At 5.8s (5800ms), entire word holds in center
    timers.push(
      setTimeout(() => {
        setPhase("center-hold");
      }, 5800)
    );

    // Phase 7 & 8: At 6.3s (6300ms), PAYENT moves Center -> Left & Home page lands simultaneously
    timers.push(
      setTimeout(() => {
        setPhase("move-left-landing");
        window.dispatchEvent(new CustomEvent("payent:preloader-landing"));
        if (onLanding) onLanding();
      }, 6300)
    );

    // Phase 9 & 10: At 7.3s (7300ms), Settling into place
    timers.push(
      setTimeout(() => {
        setPhase("settling");
      }, 7300)
    );

    // Phase 11: At 7.8s (7800ms), Complete preloader removal
    timers.push(
      setTimeout(() => {
        setPhase("complete");
        setIsVisible(false);
        try {
          sessionStorage.setItem("payent:preloaded", "true");
        } catch {}
        window.dispatchEvent(new CustomEvent("payent:preloader-complete"));
        if (onComplete) onComplete();
      }, 7800)
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [isVisible, shouldReduceMotion, onComplete, onLanding]);

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

  const showTopLeftP = phase === "top-left-p-hold" || phase === "top-left-p-up";
  const isTopLeftPMovingUp = phase === "top-left-p-up";

  const showCenterWord =
    phase === "center-typing" ||
    phase === "center-hold" ||
    phase === "move-left-landing" ||
    phase === "settling";

  const isMovingToLeft = phase === "move-left-landing" || phase === "settling";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="payent-cinematic-preloader"
          initial={{ opacity: 1 }}
          animate={{
            // Black background dissolves as PAYENT moves to the left and Home page lands simultaneously
            opacity: isMovingToLeft ? 0 : 1,
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 1.0,
            ease: PREMIUM_EASING,
          }}
          className="fixed inset-0 z-[99999] bg-[#000000] text-white select-none overflow-hidden pointer-events-none"
          style={{ willChange: "opacity" }}
        >
          {/* ==================================================== */}
          {/* PHASE 1 - 3: TOP-LEFT "P" (HOLDS 2s, MOVES UPWARD)   */}
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
                  // At 2.0s, moves smoothly UPWARD
                  y: isTopLeftPMovingUp ? -75 : 0,
                  opacity: isTopLeftPMovingUp ? 0 : 1,
                }}
                exit={{
                  y: -75,
                  opacity: 0,
                  transition: { duration: 0.8, ease: PREMIUM_EASING },
                }}
                transition={{
                  duration: 0.8,
                  ease: PREMIUM_EASING,
                }}
                className="z-40 pointer-events-none flex items-center select-none"
                style={{ willChange: "transform, opacity" }}
              >
                <span className="font-sans font-black tracking-tight text-3xl sm:text-4xl text-white leading-none">
                  P
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ==================================================== */}
          {/* PHASE 5 - 10: "PAYENT" TYPED IN CENTER               */}
          {/*               HOLDS, THEN MOVES CENTER -> LEFT       */}
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
                      top: "50%",
                      left: "50%",
                      // Horizontal translation from center to left navbar branding
                      x: `calc(-50% + ${delta.x}px)`,
                      y: `calc(-50% + ${delta.y}px)`,
                      // Scale down to match navbar logo scale
                      scale: typeof window !== "undefined" && window.innerWidth < 640 ? 0.38 : 0.44,
                      opacity: phase === "settling" ? 0 : 1,
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
                      ease: PREMIUM_EASING,
                    }
                  : {
                      duration: 0.3,
                      ease: PREMIUM_EASING,
                    }
              }
              className="z-50 pointer-events-none flex items-center justify-center select-none origin-center"
              style={{ willChange: "transform, opacity" }}
            >
              {/* Fixed reserved width prevents horizontal shifting as characters are typed */}
              <div className="inline-flex items-center justify-center font-sans font-black tracking-tight text-4xl sm:text-6xl md:text-7xl text-white leading-none">
                {LETTERS.map((char, index) => {
                  const isCharVisible = index < typedCount;
                  return (
                    <motion.span
                      key={index}
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{
                        opacity: isCharVisible ? 1 : 0,
                        scale: isCharVisible ? 1 : 0.94,
                      }}
                      transition={{
                        duration: 0.2,
                        ease: PREMIUM_EASING,
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

