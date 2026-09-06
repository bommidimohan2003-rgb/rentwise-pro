import { useState } from "react";
import { Loader } from "./Loader";
import { cn } from "@/lib/utils";
import { RotateCw, RotateCcw, BarChart2 } from "lucide-react";

interface ChartCardProps {
  title: string;
  description?: string;
  loading?: boolean;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
  infoDescription?: string;
}

export function ChartCard({
  title,
  description,
  loading = false,
  action,
  children,
  className,
  glass = true,
  infoDescription,
}: ChartCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className={cn(
        "w-full h-[360px] cursor-pointer select-none group",
        className,
      )}
      style={{ perspective: "1000px" }}
    >
      <div
        className="relative w-full h-full rounded-2xl transition-transform duration-600"
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* FRONT FACE */}
        <div
          className={cn(
            glass ? "glass-card" : "spatial-card",
            "p-5 flex flex-col h-[360px] relative overflow-hidden transition-all duration-300 w-full rounded-2xl border border-border/60 shadow-sm hover:border-primary/40",
            isFlipped ? "pointer-events-none opacity-0" : "opacity-100",
          )}
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div>
              <h3 className="text-sm font-bold text-foreground tracking-tight font-display flex items-center gap-2">
                {title}
              </h3>
              {description && (
                <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                  {description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5 z-20">
              {action}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(true);
                }}
                className="p-1.5 rounded-lg bg-secondary/80 hover:bg-primary hover:text-white text-muted-foreground border border-border/60 transition-all cursor-pointer shadow-xs"
                title="Flip chart for data breakdown"
              >
                <RotateCw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 relative z-10">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-card/40 backdrop-blur-sm rounded-xl border border-border/40">
                <Loader message="" size="sm" />
              </div>
            ) : (
              children
            )}
          </div>
        </div>

        {/* BACK FACE */}
        <div
          className={cn(
            glass ? "glass-card" : "spatial-card",
            "absolute inset-0 p-6 flex flex-col justify-between h-[360px] w-full rounded-2xl border border-primary/40 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden",
            !isFlipped ? "pointer-events-none opacity-0" : "opacity-100",
          )}
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
          onClick={() => setIsFlipped(false)}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-extrabold text-foreground font-display">
                  {title} Analytics Summary
                </h3>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(false);
                }}
                className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" /> Flip back
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
              {infoDescription ||
                `Real-time data visualization stream backing "${title}". Evaluated over active rental orders, marketplace search volume, and escrow payouts.`}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-secondary/80 border border-border/50 space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                  Data Stream Engine
                </span>
                <span className="text-xs font-extrabold text-emerald-500 font-display flex items-center gap-1">
                  &bull; Live WebSocket Synced
                </span>
              </div>

              <div className="p-3 rounded-xl bg-secondary/80 border border-border/50 space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                  Sampling Interval
                </span>
                <span className="text-xs font-extrabold text-foreground font-display">
                  15 Seconds / Auto Refresh
                </span>
              </div>

              <div className="p-3 rounded-xl bg-secondary/80 border border-border/50 space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                  Datastore Mode
                </span>
                <span className="text-xs font-extrabold text-primary font-display">
                  MySQL Direct Raw SQL
                </span>
              </div>

              <div className="p-3 rounded-xl bg-secondary/80 border border-border/50 space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                  Audit State
                </span>
                <span className="text-xs font-extrabold text-foreground font-display">
                  Cryptographically Traceable
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/40">
            <span className="text-[11px] font-semibold text-primary">
              Click anywhere to flip chart back
            </span>
            <span className="text-[10px] font-bold text-muted-foreground">
              Payent Analytics Engine
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
