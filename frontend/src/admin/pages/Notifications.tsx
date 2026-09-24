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
  ShieldAlert,
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
        if (categoryFilter === "unread") {
          return !n.read;
        }
        if (categoryFilter === "system") {
          return titleLower.includes("system") || titleLower.includes("server") || titleLower.includes("database");
        }
        if (categoryFilter === "user") {
          return titleLower.includes("user") || titleLower.includes("account") || titleLower.includes("agent");
        }
        if (categoryFilter === "marketplace") {
          return titleLower.includes("product") || titleLower.includes("gear") || titleLower.includes("booking") || titleLower.includes("listing");
        }
        if (categoryFilter === "security") {
          return titleLower.includes("security") || titleLower.includes("auth") || n.type === "error";
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-border/50">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">
            System announcements, user events, and marketplace communication dispatch
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 border border-border/70 text-foreground text-xs font-medium transition-colors cursor-pointer"
            >
              <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Mark all read</span>
            </button>
          )}

          <button
            onClick={() => fetchNotifications()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/80 bg-secondary/50 hover:bg-secondary text-foreground text-xs font-medium transition-colors cursor-pointer"
            title="Refresh notifications"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 text-muted-foreground", loading && "animate-spin")} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* CATEGORY TABS */}
      <div className="flex items-center p-0.5 bg-secondary/60 rounded-lg border border-border/60 text-xs font-medium overflow-x-auto no-scrollbar w-fit">
        {[
          { id: "all", label: "All" },
          { id: "unread", label: `Unread (${unreadCount})` },
          { id: "system", label: "System" },
          { id: "user", label: "User" },
          { id: "marketplace", label: "Marketplace" },
          { id: "security", label: "Security" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCategoryFilter(tab.id)}
            className={cn(
              "px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer text-xs",
              categoryFilter === tab.id
                ? "bg-background text-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ERROR STATE */}
      {error && !loading ? (
        <div className="bg-card rounded-xl border border-red-500/20 p-8 text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-red-500/10 text-[#FF1744] flex items-center justify-center">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Database Sync Failed</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">{error}</p>
          </div>
          <button
            onClick={() => fetchNotifications()}
            className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium transition-colors border border-border/80 cursor-pointer"
          >
            Retry Database Fetch
          </button>
        </div>
      ) : (
        /* NOTIFICATIONS LIST */
        <div className="bg-card rounded-xl border border-border/70 divide-y divide-border/40 overflow-hidden">
          {filteredNotifications.length === 0 ? (
            <div className="py-16 text-center text-xs text-muted-foreground space-y-2">
              <Bell className="h-5 w-5 text-muted-foreground mx-auto opacity-40" />
              <p>No notifications found in this view.</p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className={cn(
                  "p-4 flex items-start justify-between gap-3 transition-colors",
                  !notif.read ? "bg-secondary/20" : "hover:bg-secondary/15"
                )}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={cn(
                      "h-7 w-7 rounded-md flex items-center justify-center border shrink-0 mt-0.5",
                      notif.type === "error"
                        ? "bg-red-500/10 text-[#FF1744] border-red-500/20"
                        : notif.type === "warning"
                        ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        : "bg-secondary text-foreground border-border/60"
                    )}
                  >
                    <Info className="h-3.5 w-3.5" />
                  </div>

                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-foreground text-xs">{notif.title}</h4>
                      {!notif.read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {notif.message}
                    </p>
                    <div className="text-[10px] text-muted-foreground font-mono pt-0.5">
                      {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString() : "—"}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(notif.id)}
                  className="p-1 rounded-md text-muted-foreground hover:text-[#FF1744] hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
                  title="Dismiss notification"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
