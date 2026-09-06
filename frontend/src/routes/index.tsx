import { createFileRoute } from "@tanstack/react-router";
import Home from "@/pages/Home";
import { getSeoMetadata } from "@/utils/seo";

export const Route = createFileRoute("/")({
  head: () =>
    getSeoMetadata({
      title: "Payent — Rent premium tech gear",
      description:
        "Peer-to-peer marketplace to rent cameras, drones, laptops, and consoles. Insured. Delivered fast.",
      path: "/",
    }),
  component: Home,
});
