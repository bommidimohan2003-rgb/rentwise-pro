import { createFileRoute } from "@tanstack/react-router";
import Orders from "@/pages/Orders";
import { getSeoMetadata } from "@/utils/seo";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";

export const Route = createFileRoute("/orders")({
  head: () =>
    getSeoMetadata({
      title: "Your Rental Orders | Payent",
      description:
        "Track and manage your active rentals, order history, and gear returns on Payent.",
      path: "/orders",
    }),
  component: () => (
    <ProtectedRoute>
      <Orders />
    </ProtectedRoute>
  ),
});
