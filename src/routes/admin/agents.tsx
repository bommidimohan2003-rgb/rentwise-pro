import { createFileRoute } from "@tanstack/react-router";
import Agents from "@/admin/pages/Agents";

export const Route = createFileRoute("/admin/agents")({
  component: Agents,
});
export default Route;
