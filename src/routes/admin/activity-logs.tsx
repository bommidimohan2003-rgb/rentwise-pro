import { createFileRoute } from "@tanstack/react-router";
import ActivityLogs from "@/admin/pages/ActivityLogs";

export const Route = createFileRoute("/admin/activity-logs")({
  component: ActivityLogs,
});
export default Route;
