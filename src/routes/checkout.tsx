import { createFileRoute } from "@tanstack/react-router";
import Checkout from "@/pages/Checkout";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout · TechRent" }] }),
  validateSearch: (s: Record<string, unknown>) => ({ id: (s.id as string) ?? undefined }),
  component: Checkout,
});
