import { createFileRoute } from "@tanstack/react-router";
import Categories from "@/pages/Categories";

export const Route = createFileRoute("/categories")({
  head: () => ({ meta: [{ title: "Marketplace · TechRent" }, { name: "description", content: "Browse thousands of tech items available for rent." }] }),
  component: Categories,
});
