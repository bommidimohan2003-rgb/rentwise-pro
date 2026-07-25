import React from "react";
import { SearchX, FilterX } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NoSearchResultsProps {
  query?: string;
  onClearFilters?: () => void;
  suggestion?: string;
  className?: string;
}

export function NoSearchResults({
  query,
  onClearFilters,
  suggestion = "Try checking for spelling errors, adjusting filters, or searching for a broader term like 'Camera', 'Drone', or 'MacBook'.",
  className,
}: NoSearchResultsProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-2xl border border-dashed border-border/70 bg-card/30 backdrop-blur-sm transition-all",
        className
      )}
    >
      <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-secondary/80 text-muted-foreground mb-4 shadow-sm">
        <SearchX className="h-8 w-8 text-primary/80" />
      </div>
      <h3 className="text-base md:text-xl font-bold text-foreground mb-2 tracking-tight">
        {query ? (
          <>
            No results for <span className="text-primary">"{query}"</span>
          </>
        ) : (
          "No matching results"
        )}
      </h3>
      <p className="text-xs md:text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
        {suggestion}
      </p>
      {onClearFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="inline-flex items-center gap-2 bg-secondary hover:bg-secondary/80 text-foreground text-xs md:text-sm px-5 py-2.5 rounded-xl font-bold transition-all border border-border/50 active:scale-95 shadow-sm"
        >
          <FilterX className="h-4 w-4 text-primary" />
          <span>Clear all filters</span>
        </button>
      )}
    </div>
  );
}
