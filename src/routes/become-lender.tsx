import { createFileRoute } from "@tanstack/react-router";
import BecomeLender from "@/pages/BecomeLender";
import { getSeoMetadata } from "@/utils/seo";

export const Route = createFileRoute("/become-lender")({
  head: () =>
    getSeoMetadata({
      title: "Become a Lender | Payent",
      description:
        "List your premium cameras, drones, laptops, and consoles on Payent and start earning passive income today.",
      path: "/become-lender",
    }),
  component: BecomeLender,
});
