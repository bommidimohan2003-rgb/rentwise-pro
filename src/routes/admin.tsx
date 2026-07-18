import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sidebar } from "@/admin/components/layout/Sidebar";
import { Topbar } from "@/admin/components/layout/Topbar";
import { Footer } from "@/admin/components/layout/Footer";
import { Breadcrumb } from "@/admin/components/layout/Breadcrumb";
import { authService } from "@/admin/services/auth";
import { getSeoMetadata } from "@/utils/seo";

export const Route = createFileRoute("/admin")({
  head: () =>
    getSeoMetadata({
      title: "Admin Portal | Payent",
      description: "Manage platform inventory, orders, payments, verification requests, and users.",
      path: "/admin",
    }),
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loggedIn = authService.isAuthenticated();
    setIsAuthenticated(loggedIn);
    setLoading(false);

    if (!loggedIn) {
      navigate({ to: "/login" });
    }
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
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
export default AdminLayout;
