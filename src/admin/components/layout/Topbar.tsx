import { Sun, Moon, Radio } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { SearchBar } from "./SearchBar";
import { NotificationDropdown } from "./NotificationDropdown";
import { ProfileDropdown } from "./ProfileDropdown";
import { useState, useEffect } from "react";
import { isOfflineMode } from "@/admin/services/api";
import { adminWS, ConnectionStatus } from "@/admin/services/websocket";

export function Topbar() {
  const { theme, toggle } = useTheme();
  const [offline, setOffline] = useState(false);
  const [wsStatus, setWsStatus] = useState<ConnectionStatus>("DISCONNECTED");

  useEffect(() => {
    setOffline(isOfflineMode());

    const offlineHandler = (e: CustomEvent) => {
      setOffline(e.detail);
    };

    window.addEventListener("payent-admin-offline-change", offlineHandler as EventListener);

    // Subscribe to WebSocket connection status
    const unsubscribe = adminWS.onStatusChange((status) => {
      setWsStatus(status);
    });

    return () => {
      window.removeEventListener("payent-admin-offline-change", offlineHandler as EventListener);
      unsubscribe();
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 md:px-8 h-16 spatial-float border-b border-border/60 rounded-none shadow-sm backdrop-blur-md">
      {/* Left side: Space on desktop for spacing, padding on mobile */}
      <div className="flex items-center gap-4 pl-8 lg:pl-0">
        <SearchBar />

        {offline ? (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse flex items-center gap-1.5 shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
            Offline Demo Mode
          </span>
        ) : wsStatus === "LIVE" ? (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Radio className="h-3 w-3" />
            Live Updates Active
          </span>
        ) : wsStatus === "CONNECTING" ? (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse flex items-center gap-1.5 shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
            Connecting Live Stream...
          </span>
        ) : (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-secondary text-muted-foreground border border-border flex items-center gap-1.5 shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground"></span>
            Disconnected
          </span>
        )}
      </div>

      {/* Right side: Actions & Utilities */}
      <div className="flex items-center gap-3.5">
        {/* Theme Toggle Button */}
        <button
          onClick={toggle}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all active:scale-95 cursor-pointer"
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
        </button>

        {/* Notification dropdown */}
        <NotificationDropdown />

        {/* Divider */}
        <div className="h-6 w-[1px] bg-border/60 shrink-0" />

        {/* Profile dropdown */}
        <ProfileDropdown />
      </div>
    </header>
  );
}
