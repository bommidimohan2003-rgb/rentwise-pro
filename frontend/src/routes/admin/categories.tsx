import { createFileRoute } from "@tanstack/react-router";
import Categories from "@/admin/pages/Categories";

export const Route = createFileRoute("/admin/categories")({
  component: Categories,
});
export default Route;
