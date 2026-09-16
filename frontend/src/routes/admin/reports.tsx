import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
const Reports = lazy(() => import("@/admin/pages/Reports"));


export const Route = createFileRoute("/admin/reports")({
  component: () => (
    <Suspense fallback={<div className="h-64 flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}>
      <Reports />
    </Suspense>
  ),
});
export default Route;
