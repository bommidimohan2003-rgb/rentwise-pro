import { createFileRoute } from "@tanstack/react-router";
import Login from "@/admin/pages/Login";

export const Route = createFileRoute("/admin/login")({
  component: Login,
});
export default Route;
