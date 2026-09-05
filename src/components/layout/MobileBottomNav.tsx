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
    <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[340px] lg:hidden">
      <div className="bg-white/40 dark:bg-black/40 backdrop-blur-3xl saturate-180 border border-white/50 dark:border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.8)] ring-1 ring-black/5 dark:ring-white/10 rounded-full p-2 flex items-center justify-around">
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
              title={item.label}
              aria-label={item.label}
              className="relative flex flex-1 items-center justify-center py-2.5 px-2 rounded-full transition-all duration-200 select-none cursor-pointer"
            >
              {isActive && (
                <motion.div
                  layoutId="mobileNavActiveGlassPill"
                  className="absolute inset-0 bg-black/10 dark:bg-white/15 border border-black/5 dark:border-white/20 rounded-full -z-10 shadow-xs backdrop-blur-xl"
                  transition={{ type: "spring", stiffness: 450, damping: 35 }}
                />
              )}
              <motion.div
                whileTap={{ scale: 0.88 }}
                className="flex items-center justify-center"
              >
                <Icon
                  className={`h-6 w-6 transition-all duration-200 ${
                    isActive
                      ? "text-[#FF5A5F] stroke-[2.5] scale-105"
                      : "text-neutral-500 dark:text-neutral-400 hover:text-foreground stroke-[1.75]"
                  }`}
                />
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
