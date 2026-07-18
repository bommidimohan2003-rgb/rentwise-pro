import { useState, useEffect } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Package,
  Grid,
  Calendar,
  CreditCard,
  Star,
  Flag,
  Bell,
  BarChart3,
  Shield,
  LifeBuoy,
  Settings,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { authService } from "../../services/auth";
import { notificationsService } from "../../services/notifications";

const menuItems = [
  {
    group: "Core",
    items: [
      { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/admin/analytics", icon: BarChart3, label: "Analytics" },
    ],
  },
  {
    group: "Management",
    items: [
      { to: "/admin/users", icon: Users, label: "Users" },
      { to: "/admin/agents", icon: UserCheck, label: "Agents" },
      { to: "/admin/products", icon: Package, label: "Products" },
      { to: "/admin/categories", icon: Grid, label: "Categories" },
    ],
  },
  {
    group: "Operations",
    items: [
      { to: "/admin/bookings", icon: Calendar, label: "Bookings" },
      { to: "/admin/payments", icon: CreditCard, label: "Payments" },
      { to: "/admin/reviews", icon: Star, label: "Reviews" },
      { to: "/admin/reports", icon: Flag, label: "Reports", badgeKey: "reports" },
    ],
  },
  {
    group: "Security & Support",
    items: [
      { to: "/admin/notifications", icon: Bell, label: "Notifications", badgeKey: "notifications" },
      { to: "/admin/support", icon: LifeBuoy, label: "Support", badgeKey: "support" },
      { to: "/admin/activity-logs", icon: Shield, label: "Activity Logs" },
    ],
  },
  {
    group: "Account",
    items: [
      { to: "/admin/profile", icon: User, label: "Profile" },
      { to: "/admin/settings", icon: Settings, label: "Settings" },
    ],
  },
] as const;

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [badges, setBadges] = useState({ reports: 0, notifications: 0, support: 0 });
  const navigate = useNavigate();

  const fetchBadges = async () => {
    try {
      const stats = await notificationsService.getDashboardStats();
      setBadges({
        reports: stats.pendingReports || 0,
        notifications: stats.unreadNotifications || 0,
        support: 1, // Default pending ticket count
      });
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchBadges();

    // Refresh badges periodically
    const interval = setInterval(fetchBadges, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    navigate({ to: "/login" });
  };

  const getBadgeValue = (key?: string) => {
    if (!key) return 0;
    return badges[key as keyof typeof badges] || 0;
  };

  // Nav Items Render Helper
  const renderNavItems = () => {
    return menuItems.map((group) => (
      <div key={group.group} className="space-y-1">
        {!collapsed && (
          <h4 className="px-3 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest py-2">
            {group.group}
          </h4>
        )}
        {group.items.map((it) => {
          const active = pathname === it.to;
          const badgeVal = "badgeKey" in it ? getBadgeValue(it.badgeKey) : 0;

          return (
            <Link
              key={it.to}
              to={it.to}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all relative",
                active
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
              )}
            >
              <it.icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  active ? "scale-105" : "group-hover:scale-105 transition-transform",
                )}
              />
              {!collapsed && <span className="truncate">{it.label}</span>}
              {!collapsed && badgeVal > 0 && (
                <span className="ml-auto shrink-0 flex items-center justify-center px-1.5 py-0.5 rounded-full bg-destructive text-[8px] font-extrabold text-white">
                  {badgeVal}
                </span>
              )}
              {collapsed && badgeVal > 0 && (
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
              )}
            </Link>
          );
        })}
      </div>
    ));
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="lg:hidden fixed top-3 left-4 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl bg-card border border-border/80 text-foreground shadow-md"
        >
          {mobileOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
        </button>
      </div>

      {/* Mobile Drawer Backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-background/50 backdrop-blur-xs lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Panel */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col bg-card/65 glass border-r border-border/80 transition-all duration-300 lg:sticky lg:top-0 lg:h-screen shrink-0",
          collapsed ? "w-20" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Brand Logo */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-border/40">
          <Link to="/admin/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center text-white font-bold shadow-md shadow-primary/20 shrink-0">
              PE
            </div>
            {!collapsed && (
              <span className="font-display font-extrabold text-sm tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Payent{" "}
                <span className="text-[10px] font-semibold text-primary px-1 bg-primary/10 rounded">
                  Admin
                </span>
              </span>
            )}
          </Link>

          {/* Collapse Button for Desktop */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-lg border border-border/60 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
          >
            {collapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">{renderNavItems()}</div>

        {/* Logout Area */}
        <div className="p-4 border-t border-border/40 bg-secondary/10">
          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-destructive hover:bg-destructive/10 transition-colors",
              collapsed && "justify-center",
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    </>
  );
}
