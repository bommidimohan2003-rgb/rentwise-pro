import { ReactNode, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { storage, STORAGE_KEYS } from "@/utils/storage";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const navigate = useNavigate();

  const token = typeof window !== "undefined" ? storage.get<string | null>(STORAGE_KEYS.token, null) : null;
  const cachedUser = typeof window !== "undefined" ? storage.get(STORAGE_KEYS.currentUser, null) : null;
  const isAuthPresent = Boolean(user || token || cachedUser);

  useEffect(() => {
    if (ready) {
      if (!user && !token) {
        const currentPath =
          typeof window !== "undefined" ? window.location.pathname : "";
        if (currentPath && currentPath !== "/login" && currentPath !== "/") {
          window.location.href = `/login?redirect=${encodeURIComponent(currentPath + (window.location.search || ""))}`;
        } else {
          navigate({ to: "/login" });
        }
      } else if (user && (user.status === "pending" || user.status === "rejected" || user.status === "suspended") && user.role !== "admin") {
        const currentPath =
          typeof window !== "undefined" ? window.location.pathname : "";
        if (currentPath !== "/account-pending" && !currentPath.startsWith("/profile")) {
          navigate({ to: "/account-pending" });
        }
      }
    }
  }, [ready, user, token, navigate]);

  // If token or cached user exists, render children immediately
  if (isAuthPresent) {
    return <>{children}</>;
  }

  if (!ready) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
