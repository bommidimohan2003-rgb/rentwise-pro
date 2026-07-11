import { createFileRoute } from "@tanstack/react-router";
import Contact from "@/pages/Contact";
import { getSeoMetadata } from "@/utils/seo";

export const Route = createFileRoute("/contact")({
  head: () =>
    getSeoMetadata({
      title: "Contact Us | Payent",
      description: "Get in touch with the Payent team for help, support, or partnership inquiries.",
      path: "/contact",
    }),
  component: Contact,
});
