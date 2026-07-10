import { createFileRoute } from "@tanstack/react-router";
import Login from "@/pages/Login";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login · TechRent" }, { name: "description", content: "Login to your TechRent account." }] }),
  component: Login,
});
