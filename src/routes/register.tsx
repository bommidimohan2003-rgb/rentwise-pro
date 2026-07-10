import { createFileRoute } from "@tanstack/react-router";
import Register from "@/pages/Register";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Sign up · TechRent" }, { name: "description", content: "Create a TechRent account." }] }),
  component: Register,
});
