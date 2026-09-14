import { createFileRoute } from "@tanstack/react-router";
import DeliveryTracking from "@/pages/DeliveryTracking";
import { getSeoMetadata } from "@/utils/seo";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";

export const Route = createFileRoute("/delivery/$id")({
  head: ({ params }) =>
    getSeoMetadata({
      title: "Live Delivery Tracking | Payent",
      description:
        "Real-time GPS tracking, status milestones, and verified delivery receipt for your Payent tech gear rental.",
      path: `/delivery/${params.id}`,
    }),
  component: () => (
    <ProtectedRoute>
      <DeliveryTracking />
    </ProtectedRoute>
  ),
});
