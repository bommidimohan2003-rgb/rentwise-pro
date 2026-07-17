import { createFileRoute } from "@tanstack/react-router";
import Register from "@/pages/Register";
import { getSeoMetadata } from "@/utils/seo";

export const Route = createFileRoute("/register")({
  head: () =>
    getSeoMetadata({
      title: "Register Account | Payent",
      description:
        "Sign up for a Payent account to start renting premium tech gear or listing your own.",
      path: "/register",
    }),
  component: Register,
});
