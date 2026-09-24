import { useState, useEffect } from "react";
import { Search, Command } from "lucide-react";
import { CommandSearchModal } from "./CommandSearchModal";

export function SearchBar() {
  const [modalOpen, setModalOpen] = useState(false);

  // Global Ctrl + K or "/" listener (when not already typing in an input)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isInput = activeTag === "input" || activeTag === "textarea" || (document.activeElement as HTMLElement)?.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setModalOpen((prev) => !prev);
      } else if (e.key === "/" && !isInput && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setModalOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="relative flex items-center w-48 sm:w-64 md:w-72 px-3 py-1.5 rounded-lg bg-secondary/40 hover:bg-secondary/80 border border-border/70 text-muted-foreground hover:text-foreground text-xs font-medium transition-all group cursor-pointer"
        aria-label="Search PAYENT..."
      >
        <Search className="h-3.5 w-3.5 mr-2 text-muted-foreground/80 group-hover:text-emerald-500 transition-colors shrink-0" />
        <span className="truncate text-xs">Search PAYENT...</span>
        <div className="ml-auto flex items-center gap-0.5 border border-border/60 rounded px-1 py-0.5 bg-background text-[10px] font-mono font-medium text-muted-foreground shrink-0">
          <Command className="h-2.5 w-2.5" />
          <span>K</span>
        </div>
      </button>

      <CommandSearchModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}

