import { createFileRoute } from "@tanstack/react-router";
import Wishlist from "@/pages/Wishlist";
import { getSeoMetadata } from "@/utils/seo";

export const Route = createFileRoute("/wishlist")({
  head: () =>
    getSeoMetadata({
      title: "Your Wishlist | Payent",
      description: "View and manage the premium tech gear you have saved to rent later.",
      path: "/wishlist",
    }),
  component: Wishlist,
});
