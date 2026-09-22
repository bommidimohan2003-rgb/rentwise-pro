import { useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Compass,
  PlusCircle,
  ShoppingBag,
  LayoutDashboard,
} from "lucide-react";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useCart } from "@/hooks/useCart";
import Dock, { type DockItemData } from "@/components/common/Dock";

export function MobileBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { unreadCount } = useUnreadMessages();
  const { cartCount } = useCart();
  const navigate = useNavigate();

  const isRouteActive = (to: string, exact = false, label = "") => {
    if (exact) return pathname === to;
    if (to === "/browse") {
      return (
        pathname.startsWith("/browse") ||
        pathname.startsWith("/categories") ||
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
    if (label === "Dashboard") {
      return (
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/orders") ||
        pathname.startsWith("/messages") ||
        pathname.startsWith("/notifications") ||
        pathname.startsWith("/settings")
      );
    }
    return pathname.startsWith(to);
  };

  const navItems: DockItemData[] = [
    {
      label: "Home",
      icon: (
        <Home
          className={`h-5 w-5 transition-colors ${
            isRouteActive("/", true)
              ? "text-emerald-500 dark:text-emerald-400 stroke-[2.4]"
              : "text-neutral-600 dark:text-neutral-300 stroke-[1.8]"
          }`}
        />
      ),
      isActive: isRouteActive("/", true),
      onClick: () => navigate({ to: "/" }),
    },
    {
      label: "Browse",
      icon: (
        <Compass
          className={`h-5 w-5 transition-colors ${
            isRouteActive("/browse")
              ? "text-emerald-500 dark:text-emerald-400 stroke-[2.4]"
              : "text-neutral-600 dark:text-neutral-300 stroke-[1.8]"
          }`}
        />
      ),
      isActive: isRouteActive("/browse"),
      onClick: () => navigate({ to: "/browse" }),
    },
    {
      label: "Lend",
      icon: (
        <PlusCircle
          className={`h-5 w-5 transition-colors ${
            isRouteActive("/become-lender")
              ? "text-emerald-500 dark:text-emerald-400 stroke-[2.4]"
              : "text-neutral-600 dark:text-neutral-300 stroke-[1.8]"
          }`}
        />
      ),
      isActive: isRouteActive("/become-lender"),
      onClick: () => navigate({ to: "/become-lender" }),
    },
    {
      label: "Cart",
      icon: (
        <ShoppingBag
          className={`h-5 w-5 transition-colors ${
            isRouteActive("/cart")
              ? "text-emerald-500 dark:text-emerald-400 stroke-[2.4]"
              : "text-neutral-600 dark:text-neutral-300 stroke-[1.8]"
          }`}
        />
      ),
      badge: cartCount > 0 ? (cartCount > 99 ? "99+" : `${cartCount}`) : undefined,
      isActive: isRouteActive("/cart"),
      onClick: () => navigate({ to: "/cart" }),
    },
    {
      label: "Dashboard",
      icon: (
        <LayoutDashboard
          className={`h-5 w-5 transition-colors ${
            isRouteActive("/dashboard", false, "Dashboard")
              ? "text-emerald-500 dark:text-emerald-400 stroke-[2.4]"
              : "text-neutral-600 dark:text-neutral-300 stroke-[1.8]"
          }`}
        />
      ),
      badge: unreadCount > 0 ? (unreadCount > 99 ? "99+" : `${unreadCount}`) : undefined,
      isActive: isRouteActive("/dashboard", false, "Dashboard"),
      onClick: () => navigate({ to: "/dashboard" }),
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation Dock"
      className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] inset-x-0 mx-auto z-50 lg:hidden flex justify-center pointer-events-none"
    >
      <div className="pointer-events-auto">
        <Dock
          items={navItems}
          panelHeight={56}
          baseItemSize={42}
          magnification={58}
          distance={120}
          spring={{ mass: 0.1, stiffness: 200, damping: 15 }}
        />
      </div>
    </nav>
  );
}
