import { createFileRoute } from "@tanstack/react-router";
import Support from "@/admin/pages/Support";

export const Route = createFileRoute("/admin/support")({
  component: Support,
});
export default Route;
