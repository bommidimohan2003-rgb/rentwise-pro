import { createFileRoute } from "@tanstack/react-router";
import Home from "@/pages/Home";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TechRent — Rent premium tech gear" },
      { name: "description", content: "Peer-to-peer marketplace to rent cameras, drones, laptops, and consoles. Insured. Delivered fast." },
      { property: "og:title", content: "TechRent — Rent premium tech gear" },
      { property: "og:description", content: "Rent flagship tech gear from verified lenders. Insured and delivered fast." },
    ],
  }),
  component: Home,
});
