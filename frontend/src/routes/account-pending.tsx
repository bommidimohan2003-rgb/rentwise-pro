import { createFileRoute } from "@tanstack/react-router";
import AccountPending from "@/pages/AccountPending";
import { getSeoMetadata } from "@/utils/seo";

export const Route = createFileRoute("/account-pending")({
  head: () =>
    getSeoMetadata({
      title: "PAYENT — Account Verification Pending",
      description: "Your PAYENT account is currently being reviewed by our verification team.",
      path: "/account-pending",
    }),
  component: AccountPending,
});
