import { createFileRoute } from "@tanstack/react-router";
import Contact from "@/pages/Contact";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Contact · TechRent" }, { name: "description", content: "Get in touch with the TechRent team." }] }),
  component: Contact,
});
