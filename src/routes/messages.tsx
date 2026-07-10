import { createFileRoute } from "@tanstack/react-router";
import Messages from "@/pages/Messages";

export const Route = createFileRoute("/messages")({
  head: () => ({ meta: [{ title: "Messages · TechRent" }] }),
  component: Messages,
});
