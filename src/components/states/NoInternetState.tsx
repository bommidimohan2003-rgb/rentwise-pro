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
    typeof navigator !== "undefined" ? navigator.onLine : true,
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

  if (mode === "banner") {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-2xl border border-amber-500/30 bg-amber-500/5 backdrop-blur-sm transition-all",
        className,
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
          className="inline-flex items-center gap-2 bg-black dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-black text-xs md:text-sm px-5 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95 cursor-pointer"
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
        {isOnline
          ? "Network interface active. Click retry."
          : "Waiting for network signal..."}
      </p>
    </div>
  );
}
