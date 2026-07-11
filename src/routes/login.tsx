import { createFileRoute } from "@tanstack/react-router";
import Login from "@/pages/Login";
import { getSeoMetadata } from "@/utils/seo";

export const Route = createFileRoute("/login")({
  head: () =>
    getSeoMetadata({
      title: "Sign In | Payent",
      description: "Log in to your Payent account to manage listings, orders, and messages.",
      path: "/login",
    }),
  component: Login,
});
