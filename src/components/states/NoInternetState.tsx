import { useEffect, useState } from "react";
import { WifiOff, RefreshCw, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NoInternetStateProps {
  mode?: "banner" | "full";
  onRetry?: () => void;
  onDismiss?: () => void;
  title?: string;
  description?: string;
  className?: string;
}

export function NoInternetState({
  mode = "full",
  onRetry,
  onDismiss,
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
      if (onRetry) onRetry();
      setTimeout(() => {
        setReconnected(false);
        if (onDismiss) onDismiss();
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setReconnected(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [onRetry, onDismiss]);

  const handleManualRetry = async () => {
    setRetrying(true);
    if (onRetry) {
      onRetry();
    }
    
    // Quick delay to simulate/verify ping response
    setTimeout(() => {
      setRetrying(false);
      if (typeof navigator !== "undefined" && navigator.onLine) {
        setIsOnline(true);
        setReconnected(true);
        setTimeout(() => {
          setReconnected(false);
          if (onDismiss) onDismiss();
        }, 2500);
      }
    }, 600);
  };

  if (reconnected && mode === "banner") {
    return (
      <div className="w-full bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-600 dark:text-emerald-400 px-4 py-2.5 text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top z-50">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
          <span>Connection restored! Syncing real-time data...</span>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 p-1 rounded-md transition-colors"
            title="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  }

  if (mode === "banner") {
    return (
      <div
        className={cn(
          "w-full bg-amber-500/15 border-b border-amber-500/30 text-amber-800 dark:text-amber-300 px-4 py-2.5 text-xs font-medium flex items-center justify-between gap-3 z-50",
          className
        )}
      >
        <div className="flex items-center gap-2.5">
          <WifiOff className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span className="font-semibold text-amber-900 dark:text-amber-200">
            You are currently offline. Pages will auto-update when reconnected.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleManualRetry}
            className="inline-flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-100 px-3 py-1 rounded-lg text-xs font-bold transition-all active:scale-95 border border-amber-500/30 cursor-pointer"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", retrying && "animate-spin")} />
            <span>{retrying ? "Checking..." : "Retry now"}</span>
          </button>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="text-amber-700 hover:text-amber-950 dark:text-amber-400 dark:hover:text-white p-1 rounded-md transition-colors cursor-pointer"
              title="Dismiss banner"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
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
          className="inline-flex items-center gap-2 bg-[#FF5A5F] hover:bg-[#e0484d] text-white text-xs md:text-sm px-5 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <RefreshCw className={cn("h-4 w-4", retrying && "animate-spin")} />
          <span>{retrying ? "Verifying network..." : "Retry connection"}</span>
        </button>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground px-4 py-2"
          >
            Dismiss
          </button>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground/70 mt-4">
        {isOnline ? "Network interface active. Click retry." : "Waiting for network signal..."}
      </p>
    </div>
  );
}
