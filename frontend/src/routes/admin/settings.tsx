import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
const Settings = lazy(() => import("@/admin/pages/Settings"));


export const Route = createFileRoute("/admin/settings")({
  component: () => (
    <Suspense fallback={<div className="h-64 flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}>
      <Settings />
    </Suspense>
  ),
});
export default Route;
