import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";
import payentLogoDark from "@/assets/images/payent-logo-dark.jpg";
import payentLogoLight from "@/assets/images/payent-logo-light.jpg";

export function LogoIcon({
  className,
  variant,
  showDetails = true,
}: {
  className?: string;
  variant?: "light" | "dark";
  showDetails?: boolean;
}) {
  const { theme } = useTheme();
  const isDark = variant ? variant === "dark" : theme === "dark";

  return (
    <div className="flex items-center gap-3 select-none group">
      {/* Luxury Glass Frame for PR Monogram Logo */}
      <div className="relative p-0.5 rounded-xl bg-gradient-to-br from-black/10 via-black/5 to-transparent dark:from-white/20 dark:via-white/10 dark:to-transparent backdrop-blur-md shadow-md group-hover:shadow-lg transition-all duration-300 shrink-0 border border-black/10 dark:border-white/15">
        <img
          src={isDark ? payentLogoDark : payentLogoLight}
          alt="Payent Logo"
          className={cn(
            "h-10 w-auto object-contain rounded-lg filter contrast-105 group-hover:scale-105 transition-transform duration-300",
            className,
          )}
        />
        {/* Glow accent */}
        <div className="absolute -inset-0.5 bg-primary/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>

      {/* Brand Text Details & Tagline */}
      {showDetails && (
        <div className="flex flex-col text-left justify-center">
          <div className="flex items-center gap-1.5">
            <span className="font-serif font-black tracking-[0.18em] text-base text-black dark:text-white leading-none font-display">
              PAYENT
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <span className="text-[9px] font-mono font-bold tracking-[0.22em] text-amber-600 dark:text-amber-400 uppercase mt-0.5 leading-none">
            RESERVE &bull; TECH
          </span>
        </div>
      )}
    </div>
  );
}
