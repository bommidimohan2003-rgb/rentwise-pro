import { createFileRoute } from "@tanstack/react-router";
import Profile from "@/pages/Profile";
import { getSeoMetadata } from "@/utils/seo";

export const Route = createFileRoute("/profile")({
  head: () =>
    getSeoMetadata({
      title: "User Profile | Payent",
      description: "View and edit your Payent user details, ratings, and profile information.",
      path: "/profile",
    }),
  component: Profile,
});
