import { createFileRoute } from "@tanstack/react-router";
import Bookings from "@/admin/pages/Bookings";

export const Route = createFileRoute("/admin/bookings")({
  component: Bookings,
});
export default Route;
