import { lazy, Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";

const Analytics = lazy(() => import("@/admin/pages/Analytics"));

export const Route = createFileRoute("/admin/analytics")({
  component: () => (
    <Suspense
      fallback={
        <div className="h-64 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <Analytics />
    </Suspense>
  ),
});
export default Route;
