import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string | number;
  trend?: "up" | "down" | "neutral";
  icon: LucideIcon;
  subtext?: string;
  className?: string;
}

export function StatsCard({
  title,
  value,
  change,
  trend = "neutral",
  icon: Icon,
  subtext,
  className,
}: StatsCardProps) {
  const isUp = trend === "up";
  const isDown = trend === "down";

  return (
    <div
      className={cn(
        "spatial-card p-5 flex flex-col justify-between group",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {title}
        </span>
        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-secondary/80 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors shadow-xs">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4">
        <span className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
          {value}
        </span>

        {(change || subtext) && (
          <div className="flex items-center gap-1.5 mt-2">
            {change && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 text-xs font-bold px-2.5 py-0.5 rounded-full border",
                  isUp &&
                    "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
                  isDown &&
                    "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
                  trend === "neutral" &&
                    "bg-muted text-muted-foreground border-border/50",
                )}
              >
                {isUp && <TrendingUp className="h-3 w-3" />}
                {isDown && <TrendingDown className="h-3 w-3" />}
                {change}
              </span>
            )}
            {subtext && (
              <span className="text-xs text-muted-foreground font-medium">
                {subtext}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
