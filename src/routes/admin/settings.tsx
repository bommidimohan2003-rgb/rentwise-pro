import { createFileRoute } from "@tanstack/react-router";
import Settings from "@/admin/pages/Settings";

export const Route = createFileRoute("/admin/settings")({
  component: Settings,
});
export default Route;
