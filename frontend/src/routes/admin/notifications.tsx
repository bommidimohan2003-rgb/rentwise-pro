import { createFileRoute } from "@tanstack/react-router";
import Notifications from "@/admin/pages/Notifications";

export const Route = createFileRoute("/admin/notifications")({
  component: Notifications,
});
export default Route;
