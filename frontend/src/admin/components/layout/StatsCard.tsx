import { useState } from "react";
import {
  LucideIcon,
  TrendingUp,
  TrendingDown,
  RotateCw,
  RotateCcw,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricItem {
  label: string;
  value: string | number;
}

interface CardInfo {
  title: string;
  description: string;
  metrics: MetricItem[];
}

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string | number;
  trend?: "up" | "down" | "neutral";
  icon: LucideIcon;
  subtext?: string;
  className?: string;
  glass?: boolean;
  infoTitle?: string;
  infoDescription?: string;
  infoMetrics?: MetricItem[];
}

function getDefaultCardInfo(
  title: string,
  value: string | number,
  subtext?: string,
): CardInfo {
  const lower = title.toLowerCase();

  if (lower.includes("revenue") || lower.includes("take")) {
    return {
      title: "Revenue Intelligence",
      description:
        "Gross platform commission fees collected across gear rentals and camera leases.",
      metrics: [
        { label: "Commission Tier", value: "5% - 12%" },
        { label: "Payout Escrow", value: "Razorpay SDK" },
        { label: "Settlement", value: "T+2 Direct" },
      ],
    };
  }

  if (
    lower.includes("listing") ||
    lower.includes("gear") ||
    lower.includes("product")
  ) {
    return {
      title: "Gear Catalog Overview",
      description:
        "Approved peer-to-peer equipment and camera fleet items active for lease.",
      metrics: [
        { label: "Current Active", value: value },
        { label: "Verification", value: "AI Fraud Shield" },
        { label: "Top Category", value: "Cameras & Lenses" },
      ],
    };
  }

  if (
    lower.includes("lease") ||
    lower.includes("today") ||
    lower.includes("booking")
  ) {
    return {
      title: "Daily Lease Activity",
      description:
        "Real-time confirmed rental orders and equipment leases created today.",
      metrics: [
        { label: "Today's Volume", value: value },
        { label: "Avg Duration", value: "3.5 Days" },
        { label: "Dispute Rate", value: "< 0.1%" },
      ],
    };
  }

  if (
    lower.includes("user") ||
    lower.includes("saas") ||
    lower.includes("lender")
  ) {
    return {
      title: "User Base Intelligence",
      description:
        "Total registered renters, equipment owners, and verified camera shop lenders.",
      metrics: [
        { label: "Registered Users", value: value },
        { label: "Identity KYC", value: "Twilio 2FA" },
        { label: "Account Growth", value: "Active" },
      ],
    };
  }

  if (lower.includes("average") || lower.includes("value")) {
    return {
      title: "Unit Economics",
      description:
        "Average monetary order value per completed rental transaction.",
      metrics: [
        { label: "Avg Ticket", value: value },
        { label: "Order Split", value: "Lender + Fee" },
        { label: "Top Gear Tier", value: "Cinema Lenses" },
      ],
    };
  }

  if (lower.includes("conversion")) {
    return {
      title: "Conversion Funnel",
      description:
        "Conversion percentage from listing view to completed checkout.",
      metrics: [
        { label: "Current Rate", value: value },
        { label: "Funnel State", value: "Optimized" },
        { label: "Target Benchmark", value: "> 5.0%" },
      ],
    };
  }

  if (
    lower.includes("cac") ||
    lower.includes("acquisition") ||
    lower.includes("cost")
  ) {
    return {
      title: "Acquisition Economics",
      description:
        "Blended marketing and referral expense required to acquire a new active user.",
      metrics: [
        { label: "Current CAC", value: value },
        { label: "Payback Period", value: "< 1 Lease" },
        { label: "LTV / CAC", value: "4.8x" },
      ],
    };
  }

  if (
    lower.includes("visitor") ||
    lower.includes("traffic") ||
    lower.includes("pageview")
  ) {
    return {
      title: "Traffic Intelligence",
      description:
        "Total unique visitor sessions and pageview clicks recorded on the platform.",
      metrics: [
        { label: "Pageviews", value: value },
        { label: "Bounce Rate", value: "28.4%" },
        { label: "Mobile Share", value: "68%" },
      ],
    };
  }

  return {
    title: `${title} Details`,
    description: `Detailed operational metric report for ${title.toLowerCase()}.`,
    metrics: [
      { label: "Metric Value", value: value },
      { label: "Status", value: "Live Stream" },
      { label: "Subtext", value: subtext || "Active" },
    ],
  };
}

export function StatsCard({
  title,
  value,
  change,
  trend = "neutral",
  icon: Icon,
  subtext,
  className,
  glass = true,
  infoTitle,
  infoDescription,
  infoMetrics,
}: StatsCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const isUp = trend === "up";
  const isDown = trend === "down";

  const defaultInfo = getDefaultCardInfo(title, value, subtext);
  const activeTitle = infoTitle || defaultInfo.title;
  const activeDescription = infoDescription || defaultInfo.description;
  const activeMetrics = infoMetrics || defaultInfo.metrics;

  return (
    <div
      className={cn(
        "w-full cursor-pointer select-none group min-h-[170px]",
        className,
      )}
      style={{ perspective: "1000px" }}
      onClick={() => setIsFlipped((prev) => !prev)}
      title="Click card to flip and view details"
    >
      <div
        className="relative w-full h-full rounded-2xl transition-transform duration-500"
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
            "p-5 flex flex-col justify-between rounded-2xl border border-border/60 transition-all duration-300 relative overflow-hidden h-full min-h-[170px] shadow-sm hover:shadow-md hover:border-primary/40",
            isFlipped ? "pointer-events-none opacity-0" : "opacity-100",
          )}
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          {/* Background glow orb */}
          <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all pointer-events-none" />

          <div>
            <div className="flex items-center justify-between relative z-10">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                {title}
              </span>
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10 text-primary border border-primary/20 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-xs">
                <Icon className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-3 relative z-10">
              <span className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground font-display">
                {value}
              </span>

              {(change || subtext) && (
                <div className="flex items-center flex-wrap gap-1.5 mt-2">
                  {change && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full border backdrop-blur-md",
                        isUp &&
                          "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
                        isDown &&
                          "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
                        trend === "neutral" &&
                          "bg-muted/80 text-muted-foreground border-border/50",
                      )}
                    >
                      {isUp && <TrendingUp className="h-3 w-3" />}
                      {isDown && <TrendingDown className="h-3 w-3" />}
                      {change}
                    </span>
                  )}
                  {subtext && (
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {subtext}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Flip Hint Indicator */}
          <div className="mt-3 pt-2 border-t border-border/30 flex items-center justify-between text-[10px] text-muted-foreground/70 group-hover:text-primary transition-colors">
            <span className="flex items-center gap-1 font-semibold">
              <Info className="h-3 w-3" /> Metric Details
            </span>
            <span className="flex items-center gap-1 font-bold">
              <RotateCw className="h-3 w-3 group-hover:rotate-180 transition-transform duration-500" />
              Click to flip
            </span>
          </div>
        </div>

        {/* BACK FACE */}
        <div
          className={cn(
            glass ? "glass-card" : "spatial-card",
            "absolute inset-0 p-4 md:p-5 flex flex-col justify-between rounded-2xl border border-primary/40 bg-card/95 backdrop-blur-xl shadow-xl overflow-hidden h-full min-h-[170px]",
            !isFlipped ? "pointer-events-none opacity-0" : "opacity-100",
          )}
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          {/* Header */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider">
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{activeTitle}</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                <RotateCcw className="h-2.5 w-2.5" /> Flip back
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2 font-medium">
              {activeDescription}
            </p>
          </div>

          {/* Key Metrics Breakdown Chips */}
          <div className="grid grid-cols-3 gap-1.5 my-2">
            {activeMetrics.map((m, idx) => (
              <div
                key={idx}
                className="p-1.5 rounded-lg bg-secondary/80 border border-border/50 text-center flex flex-col justify-center"
              >
                <span className="text-[9px] font-bold text-muted-foreground truncate uppercase block">
                  {m.label}
                </span>
                <span className="text-[11px] font-extrabold text-foreground truncate block font-display">
                  {m.value}
                </span>
              </div>
            ))}
          </div>

          {/* Footer instruction */}
          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/30">
            <span className="font-semibold text-emerald-500 flex items-center gap-1">
              &bull; Live Analytics
            </span>
            <span className="font-medium text-primary">
              Click anywhere to flip back &rarr;
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
