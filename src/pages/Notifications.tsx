import { Bell, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { Button } from "@/components/common/Button";
import { STORAGE_KEYS, storage } from "@/utils/storage";
import { api } from "@/utils/api";
import { toast } from "sonner";
import type { Notification } from "@/types";

const seed: Notification[] = [
  {
    id: "n1",
    title: "Booking confirmed",
    message: "Your Sony A7 IV rental starts tomorrow.",
    type: "success",
    read: false,
    createdAt: "2h ago",
  },
  {
    id: "n2",
    title: "New message from Alex",
    message: "Hey, are you around for pickup at 3pm?",
    type: "info",
    read: false,
    createdAt: "5h ago",
  },
  {
    id: "n3",
    title: "Return reminder",
    message: "DJI Mavic 3 due back in 2 days.",
    type: "warning",
    read: true,
    createdAt: "1d ago",
  },
];

export default function Notifications() {
  const [list, setList] = useState<Notification[]>([]);
  const token = storage.get<string | null>(STORAGE_KEYS.token, null);

  useEffect(() => {
    if (!token) return;
    api
      .getNotifications(token)
      .then(setList)
      .catch((err) => console.error("Failed to load notifications:", err));
  }, [token]);

  const markAll = () => {
    if (!token) return;
    api
      .markNotificationsRead(token)
      .then(() => {
        setList((prev) => prev.map((n) => ({ ...n, read: true })));
        toast.success("All notifications marked as read!");
      })
      .catch((err) => toast.error(err.message || "Failed to mark notifications as read."));
  };

  return (
    <MainLayout>
      <section className="mx-auto max-w-3xl px-4 md:px-6 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
            <Bell className="h-7 w-7" /> Notifications
          </h1>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Check className="h-4 w-4" />}
            onClick={markAll}
          >
            Mark all read
          </Button>
        </div>
        <div className="mt-8 space-y-3">
          {list.map((n) => (
            <div
              key={n.id}
              className={`card-premium p-5 flex gap-4 ${!n.read ? "border-primary/40" : ""}`}
            >
              <div
                className={`h-10 w-10 rounded-xl grid place-items-center shrink-0 ${n.type === "success" ? "bg-emerald-500/10 text-emerald-500" : n.type === "warning" ? "bg-amber-500/10 text-amber-500" : "bg-primary/10 text-primary"}`}
              >
                <Bell className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{n.title}</h3>
                  <span className="text-xs text-muted-foreground">{n.createdAt}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </MainLayout>
  );
}
