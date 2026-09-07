import { createFileRoute } from "@tanstack/react-router";
import Reviews from "@/pages/Reviews";
import { getSeoMetadata } from "@/utils/seo";

export const Route = createFileRoute("/reviews")({
  head: () =>
    getSeoMetadata({
      title: "Community Reviews & Ratings | Payent",
      description:
        "Read verified reviews and experiences from filmmakers, creators, and photographers renting premium tech equipment on Payent.",
      path: "/reviews",
    }),
  component: Reviews,
});
