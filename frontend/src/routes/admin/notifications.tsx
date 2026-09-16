import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
const Notifications = lazy(() => import("@/admin/pages/Notifications"));


export const Route = createFileRoute("/admin/notifications")({
  component: () => (
    <Suspense fallback={<div className="h-64 flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}>
      <Notifications />
    </Suspense>
  ),
});
export default Route;
