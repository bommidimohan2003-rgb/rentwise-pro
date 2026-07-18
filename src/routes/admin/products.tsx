import { createFileRoute } from "@tanstack/react-router";
import Products from "@/admin/pages/Products";
import { z } from "zod";

const productSearchSchema = z.object({
  search: z.string().optional().catch(""),
});

export const Route = createFileRoute("/admin/products")({
  validateSearch: (search) => productSearchSchema.parse(search),
  component: Products,
});
export default Route;
