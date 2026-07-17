import { createFileRoute } from "@tanstack/react-router";
import AdminDashboard from "@/pages/AdminDashboard";
import { getSeoMetadata } from "@/utils/seo";
import { AdminProtectedRoute } from "@/components/common/AdminProtectedRoute";
import { DashboardLayout } from "@/layouts/DashboardLayout";

export const Route = createFileRoute("/admin")({
  head: () =>
    getSeoMetadata({
      title: "Admin Panel | Payent",
      description: "Payent administrative moderator control center.",
      path: "/admin",
    }),
  component: () => (
    <AdminProtectedRoute>
      <DashboardLayout>
        <AdminDashboard />
      </DashboardLayout>
    </AdminProtectedRoute>
  ),
});
