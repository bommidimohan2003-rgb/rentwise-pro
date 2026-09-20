import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Compass,
  PlusCircle,
  LayoutDashboard,
  User,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

export function MobileBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();
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
    {
      to: user ? "/profile" : "/login",
      label: "Profile",
      icon: User,
      exact: false,
      badge: undefined,
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] inset-x-0 mx-auto w-[calc(100%-1.5rem)] max-w-[420px] z-50 lg:hidden pointer-events-auto select-none"
    >
      <div className="relative bg-white/75 dark:bg-[#05090D]/80 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.12] shadow-[0_8px_30px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.7),0_0_24px_rgba(0,0,0,0.5)] rounded-2xl p-1 flex items-center justify-around">
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
          } else if (item.label === "Profile") {
            isActive =
              pathname.startsWith("/profile") ||
              pathname.startsWith("/login") ||
              pathname.startsWith("/register") ||
              pathname.startsWith("/forgot-password") ||
              pathname.startsWith("/reset-password") ||
              pathname.startsWith("/account-pending");
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
              className="group relative flex flex-1 flex-col items-center justify-center min-h-[48px] py-1.5 px-1 rounded-xl transition-colors duration-150 cursor-pointer"
            >
              {isActive && (
                <motion.div
                  layoutId="mobileNavActiveDockPill"
                  className="absolute inset-0 bg-neutral-900/[0.06] dark:bg-white/[0.09] border border-neutral-900/[0.08] dark:border-white/[0.14] rounded-xl -z-10 shadow-sm"
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 420, damping: 32, mass: 0.8 }
                  }
                />
              )}

              <motion.div
                whileTap={shouldReduceMotion ? undefined : { scale: 0.92 }}
                className="relative flex flex-col items-center justify-center"
              >
                <div className="relative flex items-center justify-center">
                  <Icon
                    className={`h-5 w-5 transition-colors duration-150 ${
                      isActive
                        ? "text-emerald-600 dark:text-emerald-400 stroke-[2.2]"
                        : "text-neutral-500 dark:text-neutral-400 stroke-[1.8] group-hover:text-neutral-800 dark:group-hover:text-neutral-200"
                    }`}
                  />
                  {item.badge && (
                    <span className="absolute -top-1 -right-2 px-1 min-w-[14px] h-[14px] rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center leading-none shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </div>

                <span
                  className={`text-[10px] tracking-tight mt-0.5 leading-none transition-colors duration-150 ${
                    isActive
                      ? "text-emerald-700 dark:text-emerald-400 font-semibold"
                      : "text-neutral-500 dark:text-neutral-400 font-medium group-hover:text-neutral-800 dark:group-hover:text-neutral-200"
                  }`}
                >
                  {item.label}
                </span>

                {isActive && (
                  <motion.span
                    layoutId="mobileNavActiveDot"
                    className="absolute -bottom-1 h-0.5 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400"
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
