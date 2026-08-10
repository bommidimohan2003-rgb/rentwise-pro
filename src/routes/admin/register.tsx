import { createFileRoute } from "@tanstack/react-router";
import Register from "@/pages/Register";
import { getSeoMetadata } from "@/utils/seo";

export const Route = createFileRoute("/admin/register")({
  head: () =>
    getSeoMetadata({
      title: "Admin Registration | Payent Admin",
      description:
        "Register a new administrator account for Payent Admin Control Panel.",
      path: "/admin/register",
    }),
  component: Register,
});

export default Route;
