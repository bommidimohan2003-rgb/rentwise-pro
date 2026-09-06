import { createFileRoute } from "@tanstack/react-router";
import Messages from "@/pages/Messages";
import { getSeoMetadata } from "@/utils/seo";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";

export const Route = createFileRoute("/messages")({
  head: () =>
    getSeoMetadata({
      title: "Inbox Messages | Payent",
      description:
        "Chat with verified lenders and renters to coordinate gear handoffs and details.",
      path: "/messages",
    }),
  component: () => (
    <ProtectedRoute>
      <Messages />
    </ProtectedRoute>
  ),
});
