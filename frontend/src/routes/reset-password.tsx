import { createFileRoute } from "@tanstack/react-router";
import ForgotPassword from "@/pages/ForgotPassword";
import { getSeoMetadata } from "@/utils/seo";

export const Route = createFileRoute("/reset-password")({
  head: () =>
    getSeoMetadata({
      title: "Set New Password | Payent",
      description:
        "Choose a new secure password for your Payent account.",
      path: "/reset-password",
    }),
  validateSearch: (s: Record<string, unknown>) => ({
    token: (s.token as string) || undefined,
  }),
  component: ForgotPassword,
});
