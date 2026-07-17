import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Rating({
  value,
  count,
  size = 14,
  className,
}: {
  value: number;
  count?: number;
  size?: number;
  className?: string;
}) {
  const isWhite = className?.includes("text-white");

  return (
    <div className={cn("inline-flex items-center gap-1 text-sm", className)}>
      <Star className="fill-amber-400 text-amber-400" style={{ width: size, height: size }} />
      <span className="font-medium">{value.toFixed(1)}</span>
      {count !== undefined && (
        <span className={isWhite ? "text-white/70" : "text-muted-foreground"}>
          ({count})
        </span>
      )}
    </div>
  );
}
