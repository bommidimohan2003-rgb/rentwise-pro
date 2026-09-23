import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { PayentLogoMark } from "@/components/common/LogoIcon";

interface AppPreloaderProps {
  onComplete?: () => void;
  forceShow?: boolean;
}

type PreloaderPhase =
  | "black"
  | "top-left-reveal"
  | "center-reveal"
  | "center-hold"
  | "center-move-left"
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
  const [navTarget, setNavTarget] = useState({
    top: 32,
    left: 45,
    width: 140,
    height: 36,
  });

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

  // Measure actual nav logo position from DOM
  useEffect(() => {
    if (!isVisible) return;
    const calculateNavPos = () => {
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
          left: leftBase + 60,
          width: 130,
          height: 36,
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
      // Reduced motion path
      const t1 = setTimeout(() => {
        setIsVisible(false);
        try {
          sessionStorage.setItem("payent:preloaded", "true");
        } catch {}
        if (onComplete) onComplete();
      }, 700);
      return () => clearTimeout(t1);
    }

    // 0.0s - 0.6s: Top-left small white PAYENT reveals
    const tTopLeft = setTimeout(() => {
      setPhase("top-left-reveal");
    }, 100);

    // 0.6s - 1.5s: Large white PAYENT appears in center
    const tCenterReveal = setTimeout(() => {
      setPhase("center-reveal");
    }, 600);

    // 1.5s - 2.3s: Center PAYENT holds
    const tCenterHold = setTimeout(() => {
      setPhase("center-hold");
    }, 1500);

    // 2.3s - 3.3s: Center PAYENT smoothly moves toward the left & home page reveals
    const tMoveLeft = setTimeout(() => {
      setPhase("center-move-left");
    }, 2300);

    // 3.5s - 3.8s: Settle and finish
    const tComplete = setTimeout(() => {
      setPhase("complete");
      setIsVisible(false);
      try {
        sessionStorage.setItem("payent:preloaded", "true");
      } catch {}
      if (onComplete) onComplete();
    }, 3600);

    return () => {
      clearTimeout(tTopLeft);
      clearTimeout(tCenterReveal);
      clearTimeout(tCenterHold);
      clearTimeout(tMoveLeft);
      clearTimeout(tComplete);
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

  const showTopLeft =
    phase === "top-left-reveal" ||
    phase === "center-reveal" ||
    phase === "center-hold";
  const showCenter =
    phase === "center-reveal" ||
    phase === "center-hold" ||
    phase === "center-move-left";
  const isMovingLeft = phase === "center-move-left";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="payent-final-preloader"
          initial={{ opacity: 1 }}
          animate={{
            opacity: isMovingLeft ? 0 : 1,
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 0.9,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="fixed inset-0 z-[99999] bg-[#000000] text-white select-none overflow-hidden pointer-events-none"
        >
          {/* ==================================================== */}
          {/* 1. TOP-LEFT SMALL WHITE PAYENT WORDMARK              */}
          {/* ==================================================== */}
          <AnimatePresence>
            {showTopLeft && (
              <motion.div
                key="top-left-payent"
                initial={{ opacity: 0, scale: 0.96, filter: "blur(4px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{
                  opacity: 0,
                  filter: "blur(3px)",
                  transition: { duration: 0.4, ease: "easeInOut" },
                }}
                transition={{
                  duration: 0.55,
                  ease: [0.16, 1, 0.3, 1],
                }}
                style={{
                  position: "absolute",
                  top: navTarget.top - 18,
                  left: navTarget.left - navTarget.width / 2,
                }}
                className="flex items-center gap-2.5 z-20"
              >
                <PayentLogoMark className="h-8 w-8 sm:h-9 sm:w-9 shadow-md" />
                <span className="font-sans font-black tracking-tight text-xl text-white">
                  PAYENT
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ==================================================== */}
          {/* 2. LARGE WHITE PAYENT IN CENTER & MOVES LEFT         */}
          {/* ==================================================== */}
          {showCenter && (
            <motion.div
              layoutId="payent-center-wordmark"
              initial={{
                position: "fixed",
                top: "50%",
                left: "50%",
                x: "-50%",
                y: "-50%",
                opacity: 0,
                scale: 0.94,
                filter: "blur(6px)",
              }}
              animate={
                isMovingLeft
                  ? {
                      top: navTarget.top,
                      left: navTarget.left,
                      x: "-50%",
                      y: "-50%",
                      opacity: 1,
                      scale: 0.55,
                      filter: "blur(0px)",
                    }
                  : {
                      top: "50%",
                      left: "50%",
                      x: "-50%",
                      y: "-50%",
                      opacity: 1,
                      scale: 1,
                      filter: "blur(0px)",
                    }
              }
              transition={
                isMovingLeft
                  ? {
                      duration: 0.9,
                      ease: [0.22, 1, 0.36, 1],
                    }
                  : {
                      duration: 0.75,
                      ease: [0.16, 1, 0.3, 1],
                    }
              }
              className="z-30 flex items-center justify-center select-none origin-center text-center"
            >
              <h1 className="font-sans font-black tracking-tight text-4xl sm:text-6xl md:text-7xl lg:text-8xl text-white tracking-wider drop-shadow-2xl">
                PAYENT
              </h1>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AppPreloader;
