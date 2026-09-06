import { createFileRoute } from "@tanstack/react-router";
import Profile from "@/admin/pages/Profile";

export const Route = createFileRoute("/admin/profile")({
  component: Profile,
});
export default Route;
