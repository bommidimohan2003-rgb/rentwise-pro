import { Star } from "lucide-react";

export function Rating({
  value,
  count,
  size = 14,
}: {
  value: number;
  count?: number;
  size?: number;
}) {
  return (
    <div className="inline-flex items-center gap-1 text-sm">
      <Star className="fill-amber-400 text-amber-400" style={{ width: size, height: size }} />
      <span className="font-medium">{value.toFixed(1)}</span>
      {count !== undefined && <span className="text-muted-foreground">({count})</span>}
    </div>
  );
}
