import { createFileRoute } from "@tanstack/react-router";
import LenderPortal from "@/pages/LenderPortal";
import { getSeoMetadata } from "@/utils/seo";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";

export const Route = createFileRoute("/lender-portal")({
  head: () =>
    getSeoMetadata({
      title: "Lender Portal | Payent",
      description: "Manage your listed tech gear and view incoming renter bookings.",
      path: "/lender-portal",
    }),
  component: () => (
    <ProtectedRoute>
      <LenderPortal />
    </ProtectedRoute>
  ),
});
