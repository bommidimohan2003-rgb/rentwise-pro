import { useState, useEffect } from "react";
import { Search, Command } from "lucide-react";
import { CommandSearchModal } from "./CommandSearchModal";

export function SearchBar() {
  const [modalOpen, setModalOpen] = useState(false);

  // Global Ctrl + K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setModalOpen((prev) => !prev);
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
        className="relative flex items-center w-full max-w-xs md:max-w-sm px-3.5 py-2 rounded-xl bg-secondary/60 hover:bg-secondary/90 border border-border/80 text-muted-foreground hover:text-foreground text-xs font-medium transition-all group cursor-pointer shadow-2xs"
        aria-label="Search or type a command"
      >
        <Search className="h-4 w-4 mr-2.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
        <span className="truncate">Search users, products, orders...</span>
        <div className="ml-auto flex items-center gap-1 border border-border/60 rounded px-1.5 py-0.5 bg-background text-[10px] font-mono font-bold text-muted-foreground/80 shrink-0">
          <Command className="h-2.5 w-2.5" />
          <span>K</span>
        </div>
      </button>

      <CommandSearchModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}

