import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Compass,
  PlusCircle,
  LayoutDashboard,
  LogIn,
  User,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

export function MobileBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();

  const navItems = [
    {
      to: "/",
      label: "Home",
      icon: Home,
      exact: true,
    },
    {
      to: "/browse",
      label: "Explore",
      icon: Compass,
      exact: false,
    },
    {
      to: "/become-lender",
      label: "Lend",
      icon: PlusCircle,
      exact: false,
    },
    {
      to: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      exact: false,
    },
    {
      to: user ? "/profile" : "/login",
      label: user ? "Account" : "Sign In",
      icon: user ? User : LogIn,
      exact: false,
    },
  ];

  return (
    <nav className="fixed bottom-3 inset-x-0 mx-auto w-[94%] max-w-[420px] z-50 lg:hidden pointer-events-auto">
      <div className="bg-white/95 dark:bg-[#0A1017]/95 backdrop-blur-2xl border border-black/8 dark:border-white/12 shadow-[0_12px_36px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-2xl p-1.5 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          let isActive = false;

          if (item.exact) {
            isActive = pathname === item.to;
          } else if (item.to === "/browse") {
            isActive =
              pathname.startsWith("/browse") ||
              pathname.startsWith("/categories");
          } else if (item.label === "Dashboard") {
            isActive =
              pathname.startsWith("/dashboard") ||
              pathname === "/orders" ||
              pathname === "/lender-portal" ||
              pathname === "/settings";
          } else if (item.label === "Sign In" || item.label === "Account") {
            isActive =
              pathname === "/login" ||
              pathname === "/register" ||
              pathname === "/profile";
          } else {
            isActive = pathname.startsWith(item.to);
          }

          return (
            <Link
              key={item.label}
              to={item.to}
              title={item.label}
              aria-label={item.label}
              className="relative flex flex-1 flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 select-none cursor-pointer"
            >
              {isActive && (
                <motion.div
                  layoutId="mobileNavActivePill"
                  className="absolute inset-0 bg-[#FF1744]/10 dark:bg-[#FF1744]/15 border border-[#FF1744]/25 rounded-xl -z-10"
                  transition={{ type: "spring", stiffness: 450, damping: 35 }}
                />
              )}

              <motion.div
                whileTap={{ scale: 0.88 }}
                className="relative flex flex-col items-center justify-center"
              >
                <div className="relative">
                  <Icon
                    className={`h-5 w-5 transition-colors ${
                      isActive
                        ? "text-[#FF1744] stroke-[2.4]"
                        : "text-neutral-500 dark:text-[#8B98A5] stroke-[1.8]"
                    }`}
                  />
                  {item.badge && (
                    <span className="absolute -top-1 -right-2 px-1 min-w-[14px] h-[14px] rounded-full bg-[#FF1744] text-white text-[9px] font-bold flex items-center justify-center leading-none">
                      {item.badge}
                    </span>
                  )}
                </div>

                <span
                  className={`text-[10px] font-semibold mt-0.5 leading-none transition-colors ${
                    isActive
                      ? "text-[#FF1744]"
                      : "text-neutral-500 dark:text-[#8B98A5]"
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
