import { createFileRoute } from "@tanstack/react-router";
import Payments from "@/admin/pages/Payments";

export const Route = createFileRoute("/admin/payments")({
  component: Payments,
});
export default Route;
