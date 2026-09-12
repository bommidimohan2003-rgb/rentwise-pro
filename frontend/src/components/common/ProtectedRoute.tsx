import { ReactNode, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready) {
      if (!user) {
        const currentPath =
          typeof window !== "undefined" ? window.location.pathname : "";
        if (currentPath && currentPath !== "/login" && currentPath !== "/") {
          window.location.href = `/login?redirect=${encodeURIComponent(currentPath + (window.location.search || ""))}`;
        } else {
          navigate({ to: "/login" });
        }
      } else if (user.status === "pending" && user.role !== "admin") {
        const currentPath =
          typeof window !== "undefined" ? window.location.pathname : "";
        if (currentPath !== "/account-pending" && !currentPath.startsWith("/profile")) {
          navigate({ to: "/account-pending" });
        }
      }
    }
  }, [ready, user, navigate]);

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
