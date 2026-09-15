import { lazy, Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { getSeoMetadata } from "@/utils/seo";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";

const DeliveryTracking = lazy(() => import("@/pages/DeliveryTracking"));

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
      <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}>
        <DeliveryTracking />
      </Suspense>
    </ProtectedRoute>
  ),
});
