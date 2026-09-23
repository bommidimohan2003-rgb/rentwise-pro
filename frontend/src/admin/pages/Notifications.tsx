import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Bell,
  CheckCheck,
  Trash2,
  Shield,
  CreditCard,
  User,
  Package,
  LifeBuoy,
  RefreshCw,
  Clock,
  Info,
} from "lucide-react";
import { notificationsService } from "../services/notifications";
import { AdminNotification } from "../services/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { adminWS } from "../services/websocket";

export default function Notifications() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");

  const fetchNotifications = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const data = await notificationsService.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error(err);
      if (!silent) setError("Failed to load notifications from server.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    const unsubWS = adminWS.onEvent(() => {
      fetchNotifications(true);
    });

    return () => {
      unsubWS();
    };
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await notificationsService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("All notifications marked as read.");
    } catch {
      toast.error("Failed to update notification states.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationsService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.info("Notification removed.");
    } catch {
      toast.error("Failed to delete notification.");
    }
  };

  const filteredNotifications = useMemo(() => {
    let result = [...notifications];

    if (categoryFilter !== "all") {
      result = result.filter((n) => {
        const titleLower = (n.title || "").toLowerCase();
        const msgLower = (n.message || "").toLowerCase();
        if (categoryFilter === "security") {
          return titleLower.includes("security") || titleLower.includes("auth") || n.type === "error";
        }
        if (categoryFilter === "payments") {
          return titleLower.includes("payment") || titleLower.includes("refund") || msgLower.includes("₹");
        }
        if (categoryFilter === "users") {
          return titleLower.includes("user") || titleLower.includes("account") || titleLower.includes("agent");
        }
        if (categoryFilter === "products") {
          return titleLower.includes("product") || titleLower.includes("gear") || titleLower.includes("listing");
        }
        if (categoryFilter === "support") {
          return titleLower.includes("ticket") || titleLower.includes("support");
        }
        return true;
      });
    }

    return result;
  }, [notifications, categoryFilter]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-foreground font-display">
              Notifications Center
            </h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary text-primary-foreground">
                {unreadCount} UNREAD
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time security events, operational alerts, and transactional messages.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Mark all read</span>
            </button>
          )}

          <button
            onClick={() => fetchNotifications()}
            disabled={loading}
            className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-all cursor-pointer"
            title="Refresh notifications"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* CATEGORY TABS */}
      <div className="flex items-center gap-2 border-b border-border/40 pb-2 overflow-x-auto no-scrollbar text-xs font-semibold">
        {[
          { id: "all", label: "All Alerts" },
          { id: "security", label: "Security" },
          { id: "payments", label: "Payments" },
          { id: "users", label: "Users" },
          { id: "products", label: "Products" },
          { id: "support", label: "Support" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCategoryFilter(tab.id)}
            className={cn(
              "px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer",
              categoryFilter === tab.id
                ? "bg-primary text-primary-foreground font-bold shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => fetchNotifications()} className="underline font-bold cursor-pointer">Retry</button>
        </div>
      )}

      {/* NOTIFICATIONS LIST */}
      <div className="bg-card rounded-2xl border border-border/80 shadow-xs divide-y divide-border/30 overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="py-16 text-center text-xs text-muted-foreground space-y-2">
            <Bell className="h-6 w-6 text-muted-foreground mx-auto opacity-40" />
            <p>No notifications found in this category.</p>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={cn(
                "p-4.5 flex items-start justify-between gap-4 transition-colors",
                !notif.read ? "bg-secondary/25" : "hover:bg-secondary/20"
              )}
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div
                  className={cn(
                    "h-8 w-8 rounded-xl flex items-center justify-center border shrink-0 mt-0.5",
                    notif.type === "error"
                      ? "bg-destructive/10 text-destructive border-destructive/20"
                      : notif.type === "warning"
                      ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      : "bg-secondary text-foreground border-border/60"
                  )}
                >
                  <Info className="h-4 w-4" />
                </div>

                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-foreground text-xs">{notif.title}</h4>
                    {!notif.read && (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {notif.message}
                  </p>
                  <div className="text-[10px] text-muted-foreground font-mono pt-1">
                    {notif.createdAt ? new Date(notif.createdAt).toLocaleString() : "—"}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDelete(notif.id)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer shrink-0"
                title="Delete notification"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
