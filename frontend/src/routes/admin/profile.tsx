import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
const Profile = lazy(() => import("@/admin/pages/Profile"));


export const Route = createFileRoute("/admin/profile")({
  component: () => (
    <Suspense fallback={<div className="h-64 flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}>
      <Profile />
    </Suspense>
  ),
});
export default Route;
