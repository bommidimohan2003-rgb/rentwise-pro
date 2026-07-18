import { useState } from "react";
import { Search, Command, X } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Navigate to respective page depending on command keywords, else products
    const q = query.toLowerCase().trim();
    if (q.includes("user") || q.includes("member")) {
      navigate({ to: "/admin/users" });
    } else if (q.includes("agent") || q.includes("lender")) {
      navigate({ to: "/admin/agents" });
    } else if (q.includes("book") || q.includes("rent")) {
      navigate({ to: "/admin/bookings" });
    } else if (q.includes("pay") || q.includes("tx")) {
      navigate({ to: "/admin/payments" });
    } else if (q.includes("setting")) {
      navigate({ to: "/admin/settings" });
    } else {
      navigate({ to: "/admin/products" });
    }
    setQuery("");
  };

  return (
    <form
      onSubmit={handleSearch}
      className="relative hidden md:flex items-center w-full max-w-xs group"
    >
      <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
      <input
        type="text"
        placeholder="Type to search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full bg-secondary/60 text-foreground text-xs rounded-xl pl-10 pr-9 py-2 border border-border/80 focus:outline-none focus:border-primary focus:bg-card focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground placeholder:font-medium"
      />
      {query ? (
        <button
          type="button"
          onClick={() => setQuery("")}
          className="absolute right-3 p-0.5 rounded hover:bg-secondary text-muted-foreground"
        >
          <X className="h-3 w-3" />
        </button>
      ) : (
        <div className="absolute right-3 flex items-center gap-0.5 pointer-events-none text-muted-foreground/60 border border-border/40 rounded px-1 py-0.5 bg-background text-[10px] font-bold">
          <Command className="h-2.5 w-2.5" />
          <span>K</span>
        </div>
      )}
    </form>
  );
}
