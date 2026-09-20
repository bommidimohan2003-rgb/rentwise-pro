import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Compass,
  PlusCircle,
  LayoutDashboard,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

export function MobileBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { unreadCount } = useUnreadMessages();
  const shouldReduceMotion = useReducedMotion();

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
      className="fixed bottom-[calc(0.85rem+env(safe-area-inset-bottom,0px))] inset-x-0 mx-auto w-[calc(100%-2rem)] max-w-[360px] z-50 lg:hidden pointer-events-auto select-none"
    >
      <div className="relative bg-white/80 dark:bg-[#070C12]/85 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.12] shadow-[0_16px_36px_-8px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.6)] dark:shadow-[0_20px_48px_-10px_rgba(0,0,0,0.85),0_0_24px_rgba(16,185,129,0.06),inset_0_1px_0_rgba(255,255,255,0.12)] rounded-full p-1.5 flex items-center justify-between gap-1">
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

          return (
            <Link
              key={item.label}
              to={item.to}
              title={item.label}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className="group relative flex flex-1 flex-col items-center justify-center min-h-[46px] py-1 px-2 rounded-full transition-all duration-200 cursor-pointer"
            >
              {isActive && (
                <motion.div
                  layoutId="mobileNavActiveDockPill"
                  className="absolute inset-0 bg-neutral-900/[0.08] dark:bg-white/[0.10] border border-neutral-900/[0.08] dark:border-white/[0.14] rounded-full -z-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 420, damping: 32, mass: 0.8 }
                  }
                />
              )}

              <motion.div
                whileTap={shouldReduceMotion ? undefined : { scale: 0.90 }}
                animate={isActive ? { scale: 1.02 } : { scale: 1 }}
                transition={{ duration: 0.15 }}
                className="relative flex flex-col items-center justify-center"
              >
                <div className="relative flex items-center justify-center">
                  <Icon
                    className={`h-[19px] w-[19px] transition-all duration-200 ${
                      isActive
                        ? "text-emerald-600 dark:text-emerald-400 stroke-[2.3] drop-shadow-[0_0_8px_rgba(16,185,129,0.35)]"
                        : "text-neutral-500 dark:text-neutral-400 stroke-[1.8] group-hover:text-neutral-800 dark:group-hover:text-neutral-200"
                    }`}
                  />
                  {item.badge && (
                    <span className="absolute -top-1 -right-2.5 px-1 min-w-[14px] h-[14px] rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center leading-none shadow-sm animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </div>

                <span
                  className={`text-[9.5px] tracking-tight mt-0.5 leading-none transition-colors duration-150 ${
                    isActive
                      ? "text-emerald-700 dark:text-emerald-400 font-bold"
                      : "text-neutral-500 dark:text-neutral-400 font-medium group-hover:text-neutral-800 dark:group-hover:text-neutral-200"
                  }`}
                >
                  {item.label}
                </span>

                {isActive && (
                  <motion.span
                    layoutId="mobileNavActiveDot"
                    className="absolute -bottom-1 h-0.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_4px_rgba(16,185,129,0.8)]"
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 420, damping: 32, mass: 0.8 }
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
