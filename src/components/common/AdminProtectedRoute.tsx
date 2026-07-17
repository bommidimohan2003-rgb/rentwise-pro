import { ReactNode, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function AdminProtectedRoute({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready) {
      if (!user) {
        toast.error("Please log in to access this page.");
        navigate({ to: "/login" });
      } else if (user.role !== "admin") {
        toast.error("Access denied. Admin privileges required.");
        navigate({ to: "/" });
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

  if (!user || user.role !== "admin") {
    return null;
  }

  return <>{children}</>;
}
