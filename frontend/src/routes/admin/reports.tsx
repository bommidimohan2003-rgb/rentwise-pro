import { createFileRoute } from "@tanstack/react-router";
import Reports from "@/admin/pages/Reports";

export const Route = createFileRoute("/admin/reports")({
  component: Reports,
});
export default Route;
