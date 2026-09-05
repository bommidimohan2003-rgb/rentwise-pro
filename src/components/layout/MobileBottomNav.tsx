import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Compass, PlusCircle, LayoutDashboard } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  {
    to: "/",
    label: "Home",
    icon: Home,
    exact: true,
  },
  {
    to: "/categories",
    label: "Browse",
    icon: Compass,
    exact: false,
  },
  {
    to: "/become-lender",
    label: "Become Lender",
    icon: PlusCircle,
    exact: false,
  },
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: false,
  },
] as const;

export function MobileBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();

  if (!user) return null;

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md lg:hidden">
      <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-black/10 dark:border-white/15 shadow-[0_12px_32px_rgba(0,0,0,0.18)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.6)] rounded-full p-1.5 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          let isActive = false;
          if (item.exact) {
            isActive = pathname === item.to;
          } else if (item.to === "/dashboard") {
            isActive =
              pathname.startsWith("/dashboard") ||
              pathname === "/profile" ||
              pathname === "/orders" ||
              pathname === "/lender-portal" ||
              pathname === "/settings";
          } else {
            isActive = pathname.startsWith(item.to);
          }

          const targetTo = item.to === "/dashboard" && !user ? "/login" : item.to;

          return (
            <Link
              key={item.label}
              to={targetTo}
              className="relative flex flex-1 flex-col items-center justify-center py-2 px-1 rounded-full transition-colors duration-200 select-none"
            >
              {isActive && (
                <motion.div
                  layoutId="mobileNavActivePill"
                  className="absolute inset-0 bg-neutral-200/80 dark:bg-neutral-800/90 rounded-full -z-10 shadow-xs"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <motion.div
                whileTap={{ scale: 0.92 }}
                className="flex flex-col items-center justify-center gap-0.5"
              >
                <Icon
                  className={`h-5 w-5 transition-colors ${
                    isActive
                      ? "text-[#FF5A5F] stroke-[2.5]"
                      : "text-neutral-500 dark:text-neutral-400 stroke-[2]"
                  }`}
                />
                <span
                  className={`text-[11px] leading-none transition-colors ${
                    isActive
                      ? "font-extrabold text-foreground"
                      : "font-medium text-neutral-600 dark:text-neutral-400"
                  }`}
                >
                  {item.label}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
