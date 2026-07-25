import React, { useEffect, useState } from "react";
import { WifiOff, RefreshCw, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NoInternetStateProps {
  mode?: "banner" | "full";
  onRetry?: () => void;
  title?: string;
  description?: string;
  className?: string;
}

export function NoInternetState({
  mode = "full",
  onRetry,
  title = "No Internet Connection",
  description = "It looks like you're offline or your connection was interrupted. Check your network.",
  className,
}: NoInternetStateProps) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [retrying, setRetrying] = useState(false);
  const [reconnected, setReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setReconnected(true);
      setTimeout(() => setReconnected(false), 4000);
      if (onRetry) {
        onRetry();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [onRetry]);

  const handleManualRetry = () => {
    setRetrying(true);
    if (typeof navigator !== "undefined" && navigator.onLine) {
      setIsOnline(true);
      if (onRetry) onRetry();
    }
    setTimeout(() => setRetrying(false), 800);
  };

  if (reconnected && mode === "banner") {
    return (
      <div className="w-full bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-600 dark:text-emerald-400 px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        <span>Connection restored! Syncing data...</span>
      </div>
    );
  }

  if (mode === "banner") {
    return (
      <div
        className={cn(
          "w-full bg-amber-500/15 border-b border-amber-500/30 text-amber-600 dark:text-amber-400 px-4 py-2.5 text-xs font-semibold flex items-center justify-between gap-3 animate-pulse",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <WifiOff className="h-4 w-4 shrink-0" />
          <span>You are currently offline. Pages will auto-update when reconnected.</span>
        </div>
        <button
          type="button"
          onClick={handleManualRetry}
          className="inline-flex items-center gap-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all"
        >
          <RefreshCw className={cn("h-3 w-3", retrying && "animate-spin")} />
          <span>Retry now</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-2xl border border-amber-500/30 bg-amber-500/5 backdrop-blur-sm transition-all",
        className
      )}
    >
      <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-amber-500/15 text-amber-500 mb-4 shadow-sm animate-bounce">
        <WifiOff className="h-8 w-8" />
      </div>
      <h3 className="text-base md:text-xl font-bold text-foreground mb-1 tracking-tight">
        {title}
      </h3>
      <p className="text-xs md:text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
        {description}
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          type="button"
          onClick={handleManualRetry}
          className="inline-flex items-center gap-2 bg-amber-500 text-black hover:bg-amber-400 text-xs md:text-sm px-5 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95"
        >
          <RefreshCw className={cn("h-4 w-4", retrying && "animate-spin")} />
          <span>Retry when back online</span>
        </button>
      </div>
      <p className="text-[11px] text-muted-foreground/70 mt-4">
        {isOnline ? "Network interface ready. Click retry." : "Waiting for network signal..."}
      </p>
    </div>
  );
}
