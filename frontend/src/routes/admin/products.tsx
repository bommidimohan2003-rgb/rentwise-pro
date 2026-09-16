import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
const Products = lazy(() => import("@/admin/pages/Products"));

import { z } from "zod";

const productSearchSchema = z.object({
  search: z.string().optional().catch(""),
});

export const Route = createFileRoute("/admin/products")({
  validateSearch: (search) => productSearchSchema.parse(search),
  component: () => (
    <Suspense fallback={<div className="h-64 flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}>
      <Products />
    </Suspense>
  ),
});
export default Route;
