import { LucideIcon, Inbox } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title = "No data found",
  description = "There are no records matching your query.",
  icon: Icon = Inbox,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center card-premium bg-card/40 border-dashed border-2">
      <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-secondary/50 text-muted-foreground mb-4">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-5">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="btn-gradient text-xs px-4 py-2 rounded-xl font-semibold"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
