import React from "react";
import { Loader } from "./Loader";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  description?: string;
  loading?: boolean;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function ChartCard({
  title,
  description,
  loading = false,
  action,
  children,
  className,
}: ChartCardProps) {
  return (
    <div
      className={cn(
        "p-6 flex flex-col h-[380px] bg-card rounded-2xl border border-border/80 shadow-xs relative overflow-hidden",
        className
      )}
    >
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h3 className="text-sm font-bold text-foreground tracking-tight flex items-center gap-2">
            {title}
          </h3>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">
              {description}
            </p>
          )}
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>

      <div className="flex-1 min-h-0 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-card/60 backdrop-blur-xs rounded-xl">
            <Loader message="Loading chart data..." size="sm" />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
