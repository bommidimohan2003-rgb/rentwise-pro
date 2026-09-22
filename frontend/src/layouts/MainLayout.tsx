import type { ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Navigation4 } from "@/components/navigation/Navigation4";

export function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col pb-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:pb-0 bg-white dark:bg-[#05090D] text-neutral-900 dark:text-white transition-colors duration-200">
      <Navbar />
      <Navigation4 />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
