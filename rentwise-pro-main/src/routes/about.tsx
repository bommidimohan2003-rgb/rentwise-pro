import { createFileRoute } from "@tanstack/react-router";
import About from "@/pages/About";
import { getSeoMetadata } from "@/utils/seo";

export const Route = createFileRoute("/about")({
  head: () =>
    getSeoMetadata({
      title: "About Us | Payent",
      description:
        "Learn about the mission, values, and story behind Payent, the leading peer-to-peer tech rental platform.",
      path: "/about",
    }),
  component: About,
});
