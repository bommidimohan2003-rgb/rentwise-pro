import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
const Categories = lazy(() => import("@/admin/pages/Categories"));


export const Route = createFileRoute("/admin/categories")({
  component: () => (
    <Suspense fallback={<div className="h-64 flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}>
      <Categories />
    </Suspense>
  ),
});
export default Route;
