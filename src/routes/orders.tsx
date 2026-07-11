import { createFileRoute } from "@tanstack/react-router";
import Orders from "@/pages/Orders";
import { getSeoMetadata } from "@/utils/seo";

export const Route = createFileRoute("/orders")({
  head: () =>
    getSeoMetadata({
      title: "Your Rental Orders | Payent",
      description:
        "Track and manage your active rentals, order history, and gear returns on Payent.",
      path: "/orders",
    }),
  component: Orders,
});
