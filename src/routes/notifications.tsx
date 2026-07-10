import { createFileRoute } from "@tanstack/react-router";
import Notifications from "@/pages/Notifications";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications · TechRent" }] }),
  component: Notifications,
});
