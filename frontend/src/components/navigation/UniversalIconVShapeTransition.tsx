import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouterState } from "@tanstack/react-router";

export interface IconOrigin {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  cx: number;
  cy: number;
  vw: number;
  vh: number;
  timestamp: number;
}

interface IconVShapeContextType {
  origin: IconOrigin;
  triggerIconVTransition: (id: string, element: HTMLElement) => void;
  registerIconRef: (id: string, element: HTMLElement | null) => void;
  activeId: string;
}

const getDefaultOrigin = (id = "home"): IconOrigin => {
  const w = typeof window !== "undefined" ? window.innerWidth : 1000;
  const h = typeof window !== "undefined" ? window.innerHeight : 800;
  return {
    id,
    x: w / 2 - 28,
    y: h - 60,
    width: 56,
    height: 56,
    cx: w / 2,
    cy: h - 32,
    vw: w,
    vh: h,
    timestamp: Date.now(),
  };
};

const IconVShapeContext = createContext<IconVShapeContextType>({
  origin: getDefaultOrigin(),
  triggerIconVTransition: () => {},
  registerIconRef: () => {},
  activeId: "home",
});

export function UniversalIconVShapeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [origin, setOrigin] = useState<IconOrigin>(() => getDefaultOrigin());
  const [activeId, setActiveId] = useState<string>("home");
  const iconsRef = useRef<Map<string, HTMLElement>>(new Map());

  const registerIconRef = useCallback(
    (id: string, element: HTMLElement | null) => {
      if (element) {
        iconsRef.current.set(id, element);
      } else {
        iconsRef.current.delete(id);
      }
    },
    []
  );

  const triggerIconVTransition = useCallback(
    (id: string, element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const vw = typeof window !== "undefined" ? window.innerWidth : 1000;
      const vh = typeof window !== "undefined" ? window.innerHeight : 800;

      setActiveId(id);
      setOrigin({
        id,
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
        cx,
        cy,
        vw,
        vh,
        timestamp: Date.now(),
      });
    },
    []
  );

  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // If navigation happens via browser back/forward or programmatic router navigation
  useEffect(() => {
    let targetId = "home";
    if (pathname.startsWith("/browse") || pathname.startsWith("/categories"))
      targetId = "browse";
    else if (
      pathname.startsWith("/become-lender") ||
      pathname.startsWith("/lender-portal")
    )
      targetId = "lend";
    else if (pathname.startsWith("/wishlist")) targetId = "wishlist";
    else if (pathname.startsWith("/messages")) targetId = "messages";
    else if (pathname.startsWith("/cart") || pathname.startsWith("/checkout"))
      targetId = "cart";
    else if (
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/orders") ||
      pathname.startsWith("/settings")
    )
      targetId = "dashboard";

    const el = iconsRef.current.get(targetId);
    if (el) {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const vw = typeof window !== "undefined" ? window.innerWidth : 1000;
      const vh = typeof window !== "undefined" ? window.innerHeight : 800;

      setActiveId(targetId);
      setOrigin({
        id: targetId,
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
        cx,
        cy,
        vw,
        vh,
        timestamp: Date.now(),
      });
    }
  }, [pathname]);

  return (
    <IconVShapeContext.Provider
      value={{
        origin,
        triggerIconVTransition,
        registerIconRef,
        activeId,
      }}
    >
      {children}
    </IconVShapeContext.Provider>
  );
}

export function useIconVShape() {
  return useContext(IconVShapeContext);
}

/**
 * Clean Non-Blocking Overlay (Zero Delay)
 */
export function IconVShapeOverlay() {
  return null;
}

/**
 * Universal Fluid Curved V-Shape Page Opening Transition
 * Features:
 * - Dynamic origin anchored to the clicked icon's getBoundingClientRect()
 * - Organic Bézier curve mask (flowing S-curve trumpet flare, never a rigid polygon)
 * - Multi-layered depth with subtle glowing glass leading edge
 * - Progressive page reveal with subtle micro-scale and opacity settle
 * - Exact cubic-bezier(0.16, 1, 0.3, 1) motion curve with 880ms duration
 * - Full unclipped scrolling on transition complete
 */
export function IconVShapePageReveal({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { origin } = useIconVShape();

  const vw = typeof window !== "undefined" ? window.innerWidth : (origin.vw || 1000);
  const vh = typeof window !== "undefined" ? window.innerHeight : (origin.vh || 800);

  // Normalized origin coordinates (0..1)
  const ux = origin.cx && vw ? Math.max(0.05, Math.min(0.95, origin.cx / vw)) : 0.5;
  const uy = origin.cy && vh ? Math.max(0.2, Math.min(0.98, origin.cy / vh)) : 0.92;

  // Fluid S-Curve Bézier morph keyframes in normalized object coordinates
  const pathStart = `M ${ux} ${uy} C ${ux - 0.01} ${uy - 0.02}, ${ux - 0.015} ${uy - 0.04}, ${ux} ${uy - 0.05} C ${ux + 0.015} ${uy - 0.04}, ${ux + 0.01} ${uy - 0.02}, ${ux} ${uy} Z`;
  const pathFlare = `M ${ux} ${uy} C ${ux - 0.08} ${uy * 0.72}, ${ux - 0.2} ${uy * 0.32}, ${ux - 0.36} 0 L ${ux + 0.36} 0 C ${ux + 0.2} ${uy * 0.32}, ${ux + 0.08} ${uy * 0.72}, ${ux} ${uy} Z`;
  const pathWide = `M ${ux} 1.05 C ${ux - 0.42} 0.65, -0.2 0.3, -0.38 0 L 1.38 0 C 1.2 0.3, ${ux + 0.42} 0.65, ${ux} 1.05 Z`;
  const pathEnclose = `M ${ux} 1.15 C -0.7 0.75, -0.7 0, -0.7 0 L 1.7 0 C 1.7 0, 1.7 0.75, ${ux} 1.15 Z`;
  const pathFull = "M 0 1 L 0 0 L 1 0 L 1 1 Z";

  // Leading edge curve paths for Layer 1 glass flare aura
  const strokeFlare = `M ${ux - 0.36} 0 C ${ux - 0.2} ${uy * 0.32}, ${ux - 0.08} ${uy * 0.72}, ${ux} ${uy} C ${ux + 0.08} ${uy * 0.72}, ${ux + 0.2} ${uy * 0.32}, ${ux + 0.36} 0`;
  const strokeWide = `M -0.38 0 C -0.2 0.3, ${ux - 0.42} 0.65, ${ux} 1.05 C ${ux + 0.42} 0.65, 1.2 0.3, 1.38 0`;
  const strokeEnclose = `M -0.7 0 C -0.7 0.75, ${ux} 1.15, ${ux} 1.15 C ${ux} 1.15, 1.7 0.75, 1.7 0`;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={`${pathname}-${origin.timestamp}`}
        className="relative w-full flex-1 flex flex-col min-h-screen"
      >
        {/* SVG Definition for Dynamic Fluid Bézier Curved Clip */}
        <svg
          className="absolute inset-0 w-0 h-0 pointer-events-none select-none opacity-0"
          aria-hidden="true"
        >
          <defs>
            <clipPath id="curved-v-clip" clipPathUnits="objectBoundingBox">
              <motion.path
                initial={{ d: pathStart }}
                animate={{
                  d: [pathStart, pathFlare, pathWide, pathEnclose, pathFull],
                }}
                transition={{
                  duration: 0.88,
                  ease: [0.16, 1, 0.3, 1],
                  times: [0, 0.25, 0.6, 0.85, 1],
                }}
              />
            </clipPath>
          </defs>
        </svg>

        {/* LAYER 1: Subtle Luminous Curved Leading Edge Aura */}
        <motion.svg
          viewBox="0 0 1 1"
          preserveAspectRatio="none"
          className="fixed inset-0 w-full h-full pointer-events-none z-40 select-none"
          initial={{ opacity: 0.9 }}
          animate={{
            opacity: [0.9, 0.8, 0.5, 0.1, 0],
          }}
          transition={{
            duration: 0.88,
            ease: [0.16, 1, 0.3, 1],
            times: [0, 0.25, 0.6, 0.85, 1],
          }}
        >
          <defs>
            <linearGradient id="v-edge-glow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(16, 185, 129, 0.65)" />
              <stop offset="60%" stopColor="rgba(56, 189, 248, 0.45)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
            </linearGradient>
            <filter id="v-blur-glow">
              <feGaussianBlur stdDeviation="0.015" />
            </filter>
          </defs>
          <motion.path
            fill="none"
            stroke="url(#v-edge-glow)"
            strokeWidth="0.006"
            strokeLinecap="round"
            filter="url(#v-blur-glow)"
            initial={{ d: strokeFlare }}
            animate={{
              d: [strokeFlare, strokeFlare, strokeWide, strokeEnclose, strokeEnclose],
            }}
            transition={{
              duration: 0.88,
              ease: [0.16, 1, 0.3, 1],
              times: [0, 0.25, 0.6, 0.85, 1],
            }}
          />
        </motion.svg>

        {/* LAYER 2 & 3: Unfolding Destination Page with Soft Physical Settle */}
        <motion.div
          initial={{
            clipPath: "url(#curved-v-clip)",
            opacity: 0.94,
            scale: 0.992,
            filter: "blur(1px)",
          }}
          animate={{
            clipPath: "url(#curved-v-clip)",
            opacity: 1,
            scale: 1,
            filter: "blur(0px)",
            transitionEnd: {
              clipPath: "none",
              filter: "none",
            },
          }}
          exit={{
            opacity: 0,
            transition: { duration: 0.2 },
          }}
          transition={{
            duration: 0.88,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="w-full flex-1 flex flex-col"
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}



