import { cn } from "@/lib/utils";

export function LogoIcon({
  className,
  showDetails = true,
}: {
  className?: string;
  variant?: "light" | "dark";
  showDetails?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5 select-none group", className)}>
      {/* Monogram Box matching reference: thin border, dark interior, red corner ticks, R letter */}
      <div className="relative h-9 w-9 rounded-lg border border-black/20 dark:border-white/20 bg-neutral-900 dark:bg-[#070D13] flex items-center justify-center shrink-0 shadow-sm group-hover:border-[#FF1744]/60 transition-colors">
        {/* Red corner ticks */}
        <span className="absolute top-1 left-1 w-1.5 h-1.5 border-t-2 border-l-2 border-[#FF1744]" />
        <span className="absolute top-1 right-1 w-1.5 h-1.5 border-t-2 border-r-2 border-[#FF1744]" />
        <span className="absolute bottom-1 left-1 w-1.5 h-1.5 border-b-2 border-l-2 border-[#FF1744]" />
        <span className="absolute bottom-1 right-1 w-1.5 h-1.5 border-b-2 border-r-2 border-[#FF1744]" />
        <span className="font-sans font-black text-sm text-white tracking-wider flex items-center justify-center">
          R
        </span>
      </div>

      {/* Brand Text Details & Tagline */}
      {showDetails && (
        <div className="flex flex-col text-left justify-center">
          <span className="font-sans font-extrabold tracking-wider text-base text-neutral-950 dark:text-white leading-none">
            PAYENT
          </span>
          <span className="text-[8.5px] font-sans font-semibold tracking-[0.16em] text-neutral-500 dark:text-[#AAB3BC] uppercase mt-1 leading-none">
            GEAR RENTAL FOR CREATORS
          </span>
        </div>
      )}
    </div>
  );
}
