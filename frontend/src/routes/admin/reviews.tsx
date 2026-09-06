import { createFileRoute } from "@tanstack/react-router";
import Reviews from "@/admin/pages/Reviews";

export const Route = createFileRoute("/admin/reviews")({
  component: Reviews,
});
export default Route;
