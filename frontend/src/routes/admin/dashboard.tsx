import { lazy, Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";

const Dashboard = lazy(() => import("@/admin/pages/Dashboard"));

export const Route = createFileRoute("/admin/dashboard")({
  component: () => (
    <Suspense
      fallback={
        <div className="h-64 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <Dashboard />
    </Suspense>
  ),
});
export default Route;
