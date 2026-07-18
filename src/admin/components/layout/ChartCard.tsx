import { Loader } from "./Loader";

interface ChartCardProps {
  title: string;
  description?: string;
  loading?: boolean;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export function ChartCard({
  title,
  description,
  loading = false,
  action,
  children,
}: ChartCardProps) {
  return (
    <div className="card-premium bg-card/60 p-5 flex flex-col h-[350px]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-foreground">{title}</h3>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
        {action && <div className="flex items-center gap-1.5">{action}</div>}
      </div>

      <div className="flex-1 min-h-0 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-card/30 backdrop-blur-xs rounded-xl">
            <Loader message="" size="sm" />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
