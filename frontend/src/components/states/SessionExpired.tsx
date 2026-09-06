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

export function SessionExpired(_props: SessionExpiredProps) {
  return null;
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
