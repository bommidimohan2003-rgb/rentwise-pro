import { createFileRoute } from "@tanstack/react-router";
import Users from "@/admin/pages/Users";

export const Route = createFileRoute("/admin/users")({
  component: Users,
});
export default Route;
