import { createFileRoute } from "@tanstack/react-router";
import ForgotPassword from "@/pages/ForgotPassword";
import { getSeoMetadata } from "@/utils/seo";

export const Route = createFileRoute("/forgot-password")({
  head: () =>
    getSeoMetadata({
      title: "Reset Password | Payent",
      description: "Request a password reset link to recover access to your Payent account.",
      path: "/forgot-password",
    }),
  component: ForgotPassword,
});
