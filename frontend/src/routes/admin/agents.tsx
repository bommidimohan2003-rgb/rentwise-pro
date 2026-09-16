import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
const Agents = lazy(() => import("@/admin/pages/Agents"));


export const Route = createFileRoute("/admin/agents")({
  component: () => (
    <Suspense fallback={<div className="h-64 flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}>
      <Agents />
    </Suspense>
  ),
});
export default Route;
