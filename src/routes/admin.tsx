import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sidebar } from "@/admin/components/layout/Sidebar";
import { Topbar } from "@/admin/components/layout/Topbar";
import { Footer } from "@/admin/components/layout/Footer";
import { Breadcrumb } from "@/admin/components/layout/Breadcrumb";
import { authService } from "@/admin/services/auth";
import { getSeoMetadata } from "@/utils/seo";
import { PermissionDenied } from "@/components/states/PermissionDenied";
import { LoadingState } from "@/components/states/LoadingState";

export const Route = createFileRoute("/admin")({
  head: () =>
    getSeoMetadata({
      title: "Admin Portal | Payent",
      description:
        "Manage platform inventory, orders, payments, verification requests, and users.",
      path: "/admin",
    }),
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDenied, setIsDenied] = useState(false);

  useEffect(() => {
    const loggedIn = authService.isAuthenticated();
    const currentUser = authService.getCurrentUser();

    if (!loggedIn) {
      setIsAuthenticated(false);
      setLoading(false);
      navigate({ to: "/login" });
      return;
    }

    setIsAuthenticated(true);

    // If user is authenticated but not an admin role, show PermissionDenied
    if (currentUser && currentUser.role !== "admin") {
      setIsDenied(true);
    } else {
      setIsDenied(false);
    }

    setLoading(false);
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <LoadingState
          type="spinner"
          message="Validating admin authorization..."
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isDenied) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <PermissionDenied requiredRole="Administrator" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased">
      <div className="flex flex-1 relative items-stretch">
        {/* Collapsible Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="flex-grow p-4 md:p-6 lg:p-8 space-y-5 max-w-[1600px] mx-auto w-full">
            <Breadcrumb />
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
