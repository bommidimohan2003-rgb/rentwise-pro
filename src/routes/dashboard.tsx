import { createFileRoute } from "@tanstack/react-router";
import Dashboard from "@/pages/Dashboard";
import { getSeoMetadata } from "@/utils/seo";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";

export const Route = createFileRoute("/dashboard")({
  head: () =>
    getSeoMetadata({
      title: "Lender & Renter Dashboard | Payent",
      description: "Overview of your listings, performance stats, earnings, and active rentals.",
      path: "/dashboard",
    }),
  component: () => (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  ),
});
