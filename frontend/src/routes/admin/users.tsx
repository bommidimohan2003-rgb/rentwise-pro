import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
const Users = lazy(() => import("@/admin/pages/Users"));


export const Route = createFileRoute("/admin/users")({
  component: () => (
    <Suspense fallback={<div className="h-64 flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}>
      <Users />
    </Suspense>
  ),
});
export default Route;
