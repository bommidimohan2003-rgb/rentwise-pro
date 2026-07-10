import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Heart, LayoutDashboard, MessageSquare, Package, Settings, ShoppingBag, User } from "lucide-react";
import { cn } from "@/utils/cn";

const items = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { to: "/orders", icon: Package, label: "Orders" },
  { to: "/wishlist", icon: Heart, label: "Wishlist" },
  { to: "/notifications", icon: Bell, label: "Notifications" },
  { to: "/messages", icon: MessageSquare, label: "Messages" },
  { to: "/checkout", icon: ShoppingBag, label: "Checkout" },
  { to: "/profile", icon: User, label: "Profile" },
  { to: "/settings", icon: Settings, label: "Settings" },
] as const;

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="hidden lg:block w-64 shrink-0 sticky top-20 h-fit">
      <nav className="card-premium p-3 space-y-1">
        {items.map((it) => {
          const active = pathname === it.to;
          return (
            <Link
              key={it.to}
              to={it.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                active ? "btn-gradient text-white" : "text-muted-foreground hover:text-foreground hover:bg-secondary",
              )}
            >
              <it.icon className="h-4 w-4" />
              {it.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
