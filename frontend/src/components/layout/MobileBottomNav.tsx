import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Compass,
  PlusCircle,
  LayoutDashboard,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

export function MobileBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { unreadCount } = useUnreadMessages();
  const shouldReduceMotion = useReducedMotion();
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const navItems = [
    {
      to: "/",
      label: "Home",
      icon: Home,
      exact: true,
      badge: undefined,
    },
    {
      to: "/browse",
      label: "Explore",
      icon: Compass,
      exact: false,
      badge: undefined,
    },
    {
      to: "/become-lender",
      label: "Lend",
      icon: PlusCircle,
      exact: false,
      badge: undefined,
    },
    {
      to: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      exact: false,
      badge: unreadCount > 0 ? (unreadCount > 99 ? "99+" : `${unreadCount}`) : undefined,
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-[calc(0.9rem+env(safe-area-inset-bottom,0px))] inset-x-0 mx-auto w-[calc(100%-2.5rem)] max-w-[360px] z-50 lg:hidden pointer-events-auto select-none"
    >
      {/* Crystalline Translucent Floating Glass Dock */}
      <div className="relative bg-white/55 dark:bg-[#070C12]/60 backdrop-blur-2xl saturate-[1.9] border border-black/[0.09] dark:border-white/[0.14] shadow-[0_16px_40px_-6px_rgba(0,0,0,0.14),0_2px_10px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_20px_48px_-8px_rgba(0,0,0,0.85),0_0_24px_rgba(16,185,129,0.08),inset_0_1px_1px_rgba(255,255,255,0.15)] rounded-full p-1.5 flex items-center justify-between gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          let isActive = false;

          if (item.exact) {
            isActive = pathname === item.to;
          } else if (item.to === "/browse") {
            isActive =
              pathname.startsWith("/browse") ||
              pathname.startsWith("/categories") ||
              pathname.startsWith("/product");
          } else if (item.to === "/become-lender") {
            isActive =
              pathname.startsWith("/become-lender") ||
              pathname.startsWith("/lender-portal");
          } else if (item.label === "Dashboard") {
            isActive =
              pathname.startsWith("/dashboard") ||
              pathname.startsWith("/orders") ||
              pathname.startsWith("/messages") ||
              pathname.startsWith("/notifications") ||
              pathname.startsWith("/settings");
          } else {
            isActive = pathname.startsWith(item.to);
          }

          const isHovered = hoveredTab === item.label;

          return (
            <Link
              key={item.label}
              to={item.to}
              title={item.label}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              onMouseEnter={() => setHoveredTab(item.label)}
              onMouseLeave={() => setHoveredTab(null)}
              className="group relative flex flex-1 flex-col items-center justify-center min-h-[48px] py-1.5 px-2 rounded-full cursor-pointer transition-all duration-200"
            >
              {/* Active Elevated Capsule Pill */}
              {isActive && (
                <motion.div
                  layoutId="mobileNavActiveDockPill"
                  className="absolute inset-0 bg-emerald-500/[0.12] dark:bg-emerald-400/[0.16] border border-emerald-500/30 dark:border-emerald-400/35 rounded-full -z-10 shadow-[0_4px_16px_rgba(16,185,129,0.15),inset_0_1px_1px_rgba(255,255,255,0.7)] dark:shadow-[0_4px_16px_rgba(16,185,129,0.25),inset_0_1px_1px_rgba(255,255,255,0.15)]"
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 440, damping: 32, mass: 0.8 }
                  }
                />
              )}

              {/* Hover Floating Pill (shown on hover when not active) */}
              {!isActive && isHovered && (
                <motion.div
                  layoutId="mobileNavHoverPill"
                  className="absolute inset-0 bg-black/[0.05] dark:bg-white/[0.08] border border-black/[0.06] dark:border-white/[0.10] rounded-full -z-10 shadow-sm"
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 450, damping: 30 }
                  }
                />
              )}

              {/* Floating Button Content (elevates on hover and active) */}
              <motion.div
                whileHover={shouldReduceMotion ? undefined : { y: -3, scale: 1.08 }}
                whileTap={shouldReduceMotion ? undefined : { y: 0, scale: 0.92 }}
                animate={isActive ? { y: -1 } : { y: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="relative flex flex-col items-center justify-center transition-transform duration-200"
              >
                <div className="relative flex items-center justify-center">
                  <Icon
                    className={`h-5 w-5 transition-all duration-200 ${
                      isActive
                        ? "text-emerald-600 dark:text-emerald-400 stroke-[2.4] drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                        : "text-neutral-600 dark:text-neutral-400 stroke-[1.85] group-hover:text-neutral-950 dark:group-hover:text-white group-hover:stroke-[2.1] group-hover:drop-shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
                    }`}
                  />
                  {item.badge && (
                    <span className="absolute -top-1 -right-2.5 px-1 min-w-[14px] h-[14px] rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center leading-none shadow-sm animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </div>

                <span
                  className={`text-[9.5px] tracking-tight mt-0.5 leading-none transition-colors duration-200 ${
                    isActive
                      ? "text-emerald-700 dark:text-emerald-400 font-bold"
                      : "text-neutral-600 dark:text-neutral-400 font-medium group-hover:text-neutral-950 dark:group-hover:text-white"
                  }`}
                >
                  {item.label}
                </span>

                {/* Glowing emerald active dot */}
                {isActive && (
                  <motion.span
                    layoutId="mobileNavActiveDot"
                    className="absolute -bottom-1 h-0.5 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.9)]"
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 440, damping: 32, mass: 0.8 }
                    }
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
