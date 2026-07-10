import { createFileRoute } from "@tanstack/react-router";
import BecomeLender from "@/pages/BecomeLender";

export const Route = createFileRoute("/become-lender")({
  head: () => ({ meta: [{ title: "Become a Lender · TechRent" }, { name: "description", content: "Earn passive income by renting out your tech gear." }] }),
  component: BecomeLender,
});
