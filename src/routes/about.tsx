import { createFileRoute } from "@tanstack/react-router";
import About from "@/pages/About";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About · TechRent" }, { name: "description", content: "The story behind TechRent." }] }),
  component: About,
});
