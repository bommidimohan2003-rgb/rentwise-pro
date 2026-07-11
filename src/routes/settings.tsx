import { createFileRoute } from "@tanstack/react-router";
import Settings from "@/pages/Settings";
import { getSeoMetadata } from "@/utils/seo";

export const Route = createFileRoute("/settings")({
  head: () =>
    getSeoMetadata({
      title: "Account Settings | Payent",
      description: "Manage your account credentials, notification options, and rental preferences.",
      path: "/settings",
    }),
  component: Settings,
});
