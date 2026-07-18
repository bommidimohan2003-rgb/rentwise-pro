import { createFileRoute } from "@tanstack/react-router";
import Analytics from "@/admin/pages/Analytics";

export const Route = createFileRoute("/admin/analytics")({
  component: Analytics,
});
export default Route;
