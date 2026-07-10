/**
 * TanStack Start owns the true bootstrap via src/router.tsx + src/start.ts.
 * This file is provided for spec parity and re-exports the router factory so
 * downstream tooling (Storybook, tests) can mount a router-backed tree.
 */
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";

export default function App() {
  const router = getRouter();
  return <RouterProvider router={router} />;
}
