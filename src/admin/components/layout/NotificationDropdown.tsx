import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, Check, Inbox, Trash } from "lucide-react";
import { notificationsService } from "../../services/notifications";
import { AdminNotification } from "../../services/api";
import { cn } from "@/lib/utils";

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const data = await notificationsService.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Set up auto-polling or listen to custom event if needed
    const handleRefresh = () => fetchNotifications();
    window.addEventListener("payent:admin:refresh-notifications", handleRefresh);
    return () => window.removeEventListener("payent:admin:refresh-notifications", handleRefresh);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    try {
      await notificationsService.markAllRead();
      // Instantly update state
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await notificationsService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white ring-2 ring-background">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2.5 w-80 glass bg-card/95 rounded-2xl shadow-xl border border-border/80 z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/50">
              <span className="text-xs font-bold text-foreground">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-[10px] font-bold text-primary hover:underline"
                >
                  <Check className="h-3 w-3" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-64 overflow-y-auto no-scrollbar divide-y divide-border/40">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                  <Inbox className="h-8 w-8 opacity-40 mb-2" />
                  <span className="text-xs font-semibold">All caught up!</span>
                </div>
              ) : (
                notifications.slice(0, 5).map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      "px-4 py-3 flex gap-3 hover:bg-secondary/40 transition-colors relative group/item",
                      !n.read && "bg-primary/5",
                    )}
                  >
                    <div
                      className={cn(
                        "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                        n.type === "success" && "bg-green-500",
                        n.type === "warning" && "bg-amber-500",
                        n.type === "error" && "bg-red-500",
                        n.type === "info" && "bg-blue-500",
                      )}
                    />
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="text-xs font-bold text-foreground truncate">{n.title}</p>
                      <p className="text-[11px] font-medium text-muted-foreground leading-normal mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-[9px] font-semibold text-muted-foreground/60 mt-1">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <button
                      onClick={(e) => handleDelete(e, n.id)}
                      className="absolute right-3 top-3 opacity-0 group-hover/item:opacity-100 p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-destructive transition-all"
                    >
                      <Trash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <Link
              to="/admin/notifications"
              onClick={() => setIsOpen(false)}
              className="block text-center py-2.5 bg-secondary/35 text-[10px] font-bold text-muted-foreground hover:text-foreground border-t border-border/50 transition-colors"
            >
              View all notifications
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
