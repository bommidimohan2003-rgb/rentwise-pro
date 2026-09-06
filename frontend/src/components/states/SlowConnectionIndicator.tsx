import React, { useEffect, useState } from "react";
import { Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SlowConnectionIndicatorProps {
  delayMs?: number;
  message?: string;
  className?: string;
  inline?: boolean;
}

export function SlowConnectionIndicator({
  delayMs = 3500,
  message = "Still loading... this is taking a bit longer than usual.",
  className,
  inline = false,
}: SlowConnectionIndicatorProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(true);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [delayMs]);

  if (!show) return null;

  if (inline) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full animate-in fade-in duration-300",
          className,
        )}
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
        <span>{message}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-300 my-3",
        className,
      )}
    >
      <Clock className="h-4 w-4 shrink-0 animate-pulse" />
      <span>{message}</span>
    </div>
  );
}

/**
 * Custom hook to manage slow connection state timing
 */
export function useSlowConnection(isLoading: boolean, delayMs = 3500) {
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setIsSlow(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsSlow(true);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [isLoading, delayMs]);

  return isSlow;
}
