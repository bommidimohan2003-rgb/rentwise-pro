import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
const APIKeys = lazy(() => import("@/admin/pages/APIKeys"));


export const Route = createFileRoute("/admin/api-keys")({
  component: () => (
    <Suspense fallback={<div className="h-64 flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}>
      <APIKeys />
    </Suspense>
  ),
});
export default Route;
