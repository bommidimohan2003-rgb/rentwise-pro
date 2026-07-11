import { createFileRoute } from "@tanstack/react-router";
import Notifications from "@/pages/Notifications";
import { getSeoMetadata } from "@/utils/seo";

export const Route = createFileRoute("/notifications")({
  head: () =>
    getSeoMetadata({
      title: "Notifications | Payent",
      description: "Stay updated with booking requests, order updates, and messages.",
      path: "/notifications",
    }),
  component: Notifications,
});
