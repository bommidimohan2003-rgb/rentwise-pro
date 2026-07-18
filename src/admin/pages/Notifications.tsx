import { useEffect, useState, useMemo } from "react";
import {
  Bell,
  Search,
  Check,
  Trash2,
  MailOpen,
  Mail,
  AlertTriangle,
  CheckCircle,
  Info,
} from "lucide-react";
import { notificationsService } from "../services/notifications";
import { AdminNotification } from "../services/api";
import { Loader } from "../components/layout/Loader";
import { EmptyState } from "../components/layout/EmptyState";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Notifications() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  const fetchNotifs = async () => {
    try {
      setLoading(true);
      const data = await notificationsService.getNotifications();
      setNotifications(data);
    } catch {
      toast.error("Failed to fetch notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationsService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      // Dispatch event to update Topbar dropdown dynamically
      window.dispatchEvent(new Event("payent:admin:refresh-notifications"));
      toast.success("All notifications marked as read.");
    } catch {
      toast.error("Failed to update status.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationsService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      window.dispatchEvent(new Event("payent:admin:refresh-notifications"));
      toast.success("Notification deleted.");
    } catch {
      toast.error("Failed to delete notification.");
    }
  };

  const filteredNotifs = useMemo(() => {
    let result = [...notifications];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (n) => n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q),
      );
    }

    if (filter === "unread") {
      result = result.filter((n) => !n.read);
    } else if (filter === "read") {
      result = result.filter((n) => n.read);
    }

    return result;
  }, [notifications, search, filter]);

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "error":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBg = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-500/10";
      case "warning":
        return "bg-amber-500/10";
      case "error":
        return "bg-red-500/10";
      default:
        return "bg-blue-500/10";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Notification Center</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor system alarms, user triggers, and administrative alerts.
          </p>
        </div>

        {notifications.some((n) => !n.read) && (
          <button
            onClick={handleMarkAllRead}
            className="btn-gradient text-xs px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 self-start sm:self-auto"
          >
            <Check className="h-4.5 w-4.5" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Query filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search alerts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card/60 text-foreground text-xs rounded-xl pl-10 pr-4 py-3 border border-border focus:outline-none focus:border-primary transition-all placeholder:text-muted-foreground/60"
          />
        </div>

        {/* Visibility Filter */}
        <div className="flex items-center gap-1.5 bg-secondary/30 p-1 rounded-xl border border-border/50 self-start sm:self-auto justify-start w-fit">
          {(["all", "unread", "read"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilter(mode)}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-lg uppercase tracking-wider text-muted-foreground transition-all",
                filter === mode && "bg-card text-foreground shadow-xs",
              )}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Notifs list items */}
      {loading ? (
        <Loader message="Gathering alerts ledger..." />
      ) : filteredNotifs.length === 0 ? (
        <EmptyState
          title="No notifications"
          description="You have no notifications in this category."
          icon={Bell}
        />
      ) : (
        <div className="space-y-4">
          {filteredNotifs.map((n) => (
            <div
              key={n.id}
              className={cn(
                "card-premium p-5 bg-card/60 flex items-start gap-4 relative overflow-hidden group/item border-l-4",
                n.read ? "border-l-transparent" : "border-l-primary bg-primary/5",
              )}
            >
              {/* Alert symbol */}
              <div className={cn("p-2.5 rounded-2xl shrink-0 mt-0.5", getBg(n.type))}>
                {getIcon(n.type)}
              </div>

              {/* Title & Msg */}
              <div className="flex-1 min-w-0 pr-12">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h4 className="text-xs font-bold text-foreground">{n.title}</h4>
                  <span className="text-[9px] font-semibold text-muted-foreground/60">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs font-semibold text-muted-foreground mt-1.5 leading-relaxed">
                  {n.message}
                </p>
              </div>

              {/* Individual actions (Delete) */}
              <div className="absolute right-4 top-5 opacity-0 group-hover/item:opacity-100 transition-all flex items-center gap-1.5">
                <button
                  onClick={() => handleDelete(n.id)}
                  className="p-2 rounded-xl bg-card border border-border/80 text-muted-foreground hover:text-destructive hover:bg-secondary shadow-xs transition-colors"
                  title="Delete Alert"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
