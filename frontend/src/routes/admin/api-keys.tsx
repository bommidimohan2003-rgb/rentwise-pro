import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/api-keys")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/dashboard" });
  },
  component: () => null,
});
export default Route;
