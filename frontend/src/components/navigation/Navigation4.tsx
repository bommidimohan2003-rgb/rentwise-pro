import React, { useState, useRef, useEffect, useMemo, type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
  type MotionValue,
  type SpringOptions,
} from "framer-motion";
import { useNavigate, useRouterState, Link } from "@tanstack/react-router";
import {
  Home,
  Compass,
  PlusCircle,
  ShoppingBag,
  Heart,
  MessageSquare,
  LayoutDashboard,
  Sun,
  Moon,
  Zap,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useWishlist } from "@/hooks/useWishlist";
import { useTheme } from "@/hooks/useTheme";

export interface Navigation4Item {
  id: string;
  icon: ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  badge?: string | number;
  isActive?: boolean;
}

interface Navigation4ItemProps {
  item: Navigation4Item;
  mouseY: MotionValue<number>;
  spring: SpringOptions;
  distance: number;
  magnification: number;
  baseItemSize: number;
}

function Nav4DockItem({
  item,
  mouseY,
  spring,
  distance,
  magnification,
  baseItemSize,
}: Navigation4ItemProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const mouseDistance = useTransform(mouseY, (val: number) => {
    const rect = ref.current?.getBoundingClientRect() ?? {
      y: 0,
      height: baseItemSize,
    };
    return val - rect.y - baseItemSize / 2;
  });

  const targetSize = useTransform(
    mouseDistance,
    [-distance, 0, distance],
    [baseItemSize, magnification, baseItemSize]
  );
  const size = useSpring(targetSize, spring);

  return (
    <div className="relative flex items-center justify-center">
      <motion.button
        ref={ref}
        style={{
          width: size,
          height: size,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
        onClick={item.onClick}
        className={`relative flex items-center justify-center rounded-2xl transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          item.isActive
            ? "bg-primary/15 text-primary dark:bg-white/15 dark:text-white ring-1 ring-primary/40 dark:ring-white/30 shadow-md"
            : "bg-white/70 hover:bg-white dark:bg-[#0D151D]/70 dark:hover:bg-[#15222E] text-neutral-600 hover:text-neutral-950 dark:text-[#A8B1BA] dark:hover:text-white border border-black/5 dark:border-white/10 shadow-xs"
        }`}
        aria-label={item.label}
        aria-current={item.isActive ? "page" : undefined}
      >
        {/* Active Pill Indicator on Left Edge */}
        {item.isActive && (
          <motion.span
            layoutId="nav4-active-pill"
            className="absolute -left-1.5 w-1 h-5 rounded-r-full bg-primary dark:bg-emerald-400"
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
          />
        )}

        <div className="relative flex items-center justify-center">
          {item.icon}

          {item.badge !== undefined && item.badge !== 0 && (
            <span className="absolute -top-2 -right-2 px-1.5 min-w-[17px] h-[17px] rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md animate-pulse pointer-events-none z-20">
              {item.badge}
            </span>
          )}
        </div>
      </motion.button>

      {/* Tooltip on right side */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, x: 6, scale: 0.95 }}
            animate={{ opacity: 1, x: 12, scale: 1 }}
            exit={{ opacity: 0, x: 6, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-full top-1/2 -translate-y-1/2 pointer-events-none z-50 whitespace-nowrap px-3 py-1.5 rounded-xl bg-neutral-950/90 dark:bg-white/95 text-white dark:text-neutral-950 text-xs font-bold shadow-xl border border-white/15 dark:border-black/10 backdrop-blur-md flex items-center gap-1.5"
            role="tooltip"
          >
            <span>{item.label}</span>
            {item.badge !== undefined && item.badge !== 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[9px] font-extrabold">
                {item.badge}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export interface Navigation4Props {
  className?: string;
  baseItemSize?: number;
  magnification?: number;
  distance?: number;
  spring?: SpringOptions;
}

/**
 * Navigation 4 from React Bits Pro
 * Vertical side navigation with dock-style hover scaling, spring physics, and tooltips.
 * Designed for large desktop viewports.
 */
export function Navigation4({
  className = "",
  baseItemSize = 44,
  magnification = 58,
  distance = 140,
  spring = { mass: 0.1, stiffness: 180, damping: 14 },
}: Navigation4Props) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { cartCount } = useCart();
  const { unreadCount } = useUnreadMessages();
  const { wishlistCount } = useWishlist();
  const { theme, toggle } = useTheme();

  const mouseY = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);

  const isRouteActive = (to: string, exact = false) => {
    if (exact) return pathname === to;
    if (to === "/categories") {
      return (
        pathname.startsWith("/categories") ||
        pathname.startsWith("/browse") ||
        pathname.startsWith("/product")
      );
    }
    if (to === "/become-lender") {
      return (
        pathname.startsWith("/become-lender") ||
        pathname.startsWith("/lender-portal")
      );
    }
    if (to === "/cart") {
      return pathname.startsWith("/cart") || pathname.startsWith("/checkout");
    }
    if (to === "/dashboard") {
      return (
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/orders") ||
        pathname.startsWith("/notifications") ||
        pathname.startsWith("/settings")
      );
    }
    return pathname.startsWith(to);
  };

  const mainItems: Navigation4Item[] = [
    {
      id: "home",
      label: "Home",
      icon: <Home className="h-5 w-5 stroke-[2]" />,
      isActive: isRouteActive("/", true),
      onClick: () => navigate({ to: "/" }),
    },
    {
      id: "browse",
      label: "Browse Gear",
      icon: <Compass className="h-5 w-5 stroke-[2]" />,
      isActive: isRouteActive("/categories"),
      onClick: () => navigate({ to: "/categories" }),
    },
    {
      id: "lend",
      label: "List Equipment",
      icon: <PlusCircle className="h-5 w-5 stroke-[2]" />,
      isActive: isRouteActive("/become-lender"),
      onClick: () => navigate({ to: "/become-lender" }),
    },
    {
      id: "messages",
      label: "Messages",
      icon: <MessageSquare className="h-5 w-5 stroke-[2]" />,
      badge: unreadCount > 0 ? unreadCount : undefined,
      isActive: pathname.startsWith("/messages"),
      onClick: () => navigate({ to: "/messages" }),
    },
    {
      id: "wishlist",
      label: "Wishlist",
      icon: <Heart className="h-5 w-5 stroke-[2]" />,
      badge: wishlistCount > 0 ? wishlistCount : undefined,
      isActive: pathname.startsWith("/wishlist"),
      onClick: () => navigate({ to: "/wishlist" }),
    },
    {
      id: "cart",
      label: "Rental Cart",
      icon: <ShoppingBag className="h-5 w-5 stroke-[2]" />,
      badge: cartCount > 0 ? cartCount : undefined,
      isActive: isRouteActive("/cart"),
      onClick: () => navigate({ to: "/cart" }),
    },
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5 stroke-[2]" />,
      isActive: isRouteActive("/dashboard"),
      onClick: () => navigate({ to: "/dashboard" }),
    },
  ];

  return (
    <aside
      aria-label="Desktop Side Navigation"
      className={`hidden lg:flex fixed left-4 top-1/2 -translate-y-1/2 z-40 flex-col items-center select-none ${className}`}
    >
      <motion.div
        onMouseMove={({ pageY }) => {
          isHovered.set(1);
          mouseY.set(pageY);
        }}
        onMouseLeave={() => {
          isHovered.set(0);
          mouseY.set(Infinity);
        }}
        className="p-2 rounded-3xl bg-white/70 dark:bg-[#071018]/80 backdrop-blur-2xl border border-black/10 dark:border-white/15 shadow-2xl flex flex-col items-center gap-2"
      >
        {/* Top Brand Mark */}
        <Link
          to="/"
          className="h-11 w-11 rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 flex items-center justify-center shadow-md hover:scale-105 transition-all mb-1 group"
          aria-label="Payent Home"
        >
          <Zap className="h-5 w-5 fill-current group-hover:rotate-12 transition-transform duration-300" />
        </Link>

        <div className="w-6 h-[1px] bg-black/10 dark:bg-white/10 my-0.5" />

        {/* Middle Core Navigation Items */}
        <div className="flex flex-col items-center gap-2">
          {mainItems.map((item) => (
            <Nav4DockItem
              key={item.id}
              item={item}
              mouseY={mouseY}
              spring={spring}
              distance={distance}
              magnification={magnification}
              baseItemSize={baseItemSize}
            />
          ))}
        </div>

        <div className="w-6 h-[1px] bg-black/10 dark:bg-white/10 my-0.5" />

        {/* Bottom Utility: Theme Toggle */}
        <Nav4DockItem
          item={{
            id: "theme",
            label: theme === "dark" ? "Light Mode" : "Dark Mode",
            icon:
              theme === "dark" ? (
                <Sun className="h-5 w-5 text-amber-400 stroke-[2]" />
              ) : (
                <Moon className="h-5 w-5 text-neutral-700 stroke-[2]" />
              ),
            onClick: toggle,
          }}
          mouseY={mouseY}
          spring={spring}
          distance={distance}
          magnification={magnification}
          baseItemSize={baseItemSize}
        />
      </motion.div>
    </aside>
  );
}

export default Navigation4;
