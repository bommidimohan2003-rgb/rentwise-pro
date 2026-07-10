import type { ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="mx-auto max-w-7xl w-full px-4 md:px-6 py-8 flex gap-8 flex-1">
        <Sidebar />
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
