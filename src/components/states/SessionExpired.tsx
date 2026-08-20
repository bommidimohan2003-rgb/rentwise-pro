import React, { useEffect, useState } from "react";
import { LogOut, ArrowRight, ShieldAlert } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

import { STORAGE_KEYS, storage } from "@/utils/storage";

export interface SessionExpiredProps {
  loginUrl?: "/login" | "/admin/login";
  onClose?: () => void;
  savedFormKey?: string;
  className?: string;
}

export function SessionExpired({
  loginUrl = "/login",
  onClose,
  savedFormKey,
  className,
}: SessionExpiredProps) {
  const navigate = useNavigate();
  const [redirecting, setRedirecting] = useState(false);

  const handleSignInAgain = () => {
    setRedirecting(true);

    storage.remove(STORAGE_KEYS.token);
    storage.remove(STORAGE_KEYS.currentUser);

    // Save flag for login page to pick up notice
    if (typeof window !== "undefined") {
      localStorage.removeItem("payent:admin:token");
      localStorage.removeItem("payent:admin:current_user");
      sessionStorage.setItem(
        "payent_session_expired_notice",
        "Your session has expired. Please sign in again to continue.",
      );
    }

    // Redirect to login view
    navigate({
      to: loginUrl,
      search: { expired: "true" } as Record<string, string>,
    });

    if (onClose) onClose();
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200",
        className,
      )}
    >
      <div className="w-full max-w-md p-6 md:p-8 rounded-3xl bg-card border border-border shadow-2xl space-y-5 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-primary to-purple-600" />

        <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto shadow-inner">
          <LogOut className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-foreground tracking-tight">
            Session Expired
          </h3>
          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
            Your login session has timed out or authorization token is no longer
            valid.
          </p>
        </div>

        {savedFormKey && (
          <div className="p-3 rounded-xl bg-secondary/60 border border-border/50 text-xs text-muted-foreground flex items-center gap-2 text-left">
            <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" />
            <span>
              Your unsaved form progress has been temporarily preserved.
            </span>
          </div>
        )}

        <div className="pt-2 flex flex-col gap-2">
          <button
            type="button"
            disabled={redirecting}
            onClick={handleSignInAgain}
            className="w-full btn-gradient text-xs md:text-sm py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all"
          >
            <span>Sign in again</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Custom Event Helper to trigger global session expired modal
 */
export function triggerSessionExpiredEvent(
  loginPath: "/login" | "/admin/login" = "/login",
) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("payent-session-expired", { detail: { loginPath } }),
    );
  }
}
