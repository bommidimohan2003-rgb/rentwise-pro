import { Search } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";

const placeholderOptions = [
  "Search cameras, drones, MacBooks...",
  "Search gaming consoles...",
  "Search furniture...",
];

export function SearchBar({
  initial = "",
  compact = false,
}: {
  initial?: string;
  compact?: boolean;
}) {
  const [q, setQ] = useState(initial);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [placeholderText, setPlaceholderText] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const phrase = placeholderOptions[placeholderIndex];
    let timeoutId: ReturnType<typeof setTimeout>;

    const type = () => {
      const nextChar = phrase[placeholderText.length];
      if (nextChar) {
        timeoutId = setTimeout(() => {
          setPlaceholderText((current) => current + nextChar);
        }, 55);
        return;
      }

      timeoutId = setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % placeholderOptions.length);
        setPlaceholderText("");
      }, 1100);
    };

    const erase = () => {
      if (placeholderText.length > 0) {
        timeoutId = setTimeout(() => {
          setPlaceholderText((current) => current.slice(0, -1));
        }, 30);
        return;
      }

      setPlaceholderIndex((prev) => (prev + 1) % placeholderOptions.length);
    };

    if (placeholderText.length < phrase.length) {
      type();
    } else {
      timeoutId = setTimeout(() => {
        erase();
      }, 800);
    }

    return () => clearTimeout(timeoutId);
  }, [placeholderText, placeholderIndex]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    navigate({ to: "/categories", search: { q } as never });
  };

  return (
    <form
      onSubmit={submit}
      className={`search-bar-shell glass flex items-center gap-2 rounded-full pl-5 pr-2 ${compact ? "h-11" : "h-14"} w-full max-w-2xl`}
    >
      <Search className="h-4 w-4 text-muted-foreground" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholderText}
        className="search-input flex-1 bg-transparent outline-none text-sm"
        aria-label="Search rentals"
      />
      <button type="submit" className="btn-gradient rounded-full px-5 h-9 text-sm font-medium">
        Search
      </button>
    </form>
  );
}
