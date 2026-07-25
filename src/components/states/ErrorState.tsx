import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  error?: unknown;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

/**
 * Normalizes and sanitizes error objects into human-readable error messages.
 * Prevents raw stack traces or internal backend exception strings from leaking into the UI.
 */
export function sanitizeErrorMessage(error: unknown, fallbackMessage = "Something went wrong while processing your request. Please try again."): string {
  if (!error) return fallbackMessage;

  let raw = "";
  if (typeof error === "string") {
    raw = error;
  } else if (error instanceof Error) {
    raw = error.message;
  } else if (typeof error === "object" && error !== null) {
    const errObj = error as Record<string, any>;
    raw = errObj.detail || errObj.message || errObj.error || "";
  }

  if (!raw) return fallbackMessage;

  // Mask stack traces, sql errors, code exceptions
  if (
    raw.includes("Traceback (most recent call last)") ||
    raw.includes("OperationalError") ||
    raw.includes("IntegrityError") ||
    raw.includes("SyntaxError") ||
    raw.includes("TypeError") ||
    raw.includes("pymysql") ||
    raw.includes("sqlalchemy") ||
    raw.includes("Internal Server Error") ||
    raw.includes("500")
  ) {
    return "The server encountered a temporary issue. Please try again in a few moments.";
  }

  // Network/Connection errors
  if (raw.toLowerCase().includes("failed to fetch") || raw.toLowerCase().includes("network error") || raw.includes("ERR_NETWORK")) {
    return "Unable to connect to Payent servers. Please check your internet connection and try again.";
  }

  // Return clean string truncated to safe length
  return raw.length > 200 ? raw.slice(0, 197) + "..." : raw;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  error,
  onRetry,
  retryLabel = "Try again",
  className,
}: ErrorStateProps) {
  const displayMessage = message || sanitizeErrorMessage(error);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-2xl border border-destructive/20 bg-destructive/5 backdrop-blur-sm transition-all",
        className
      )}
    >
      <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-destructive/10 text-destructive mb-4 shadow-sm">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h3 className="text-base md:text-lg font-bold text-foreground mb-1 tracking-tight">
        {title}
      </h3>
      <p className="text-xs md:text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
        {displayMessage}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 bg-destructive/90 hover:bg-destructive text-destructive-foreground text-xs md:text-sm px-5 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95"
        >
          <RefreshCw className="h-4 w-4" />
          <span>{retryLabel}</span>
        </button>
      )}
    </div>
  );
}
