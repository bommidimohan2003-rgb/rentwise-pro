import { cn } from "@/lib/utils";
import { BRAND_ASSETS, BRAND_CONFIG } from "@/config/branding";

interface LogoIconProps {
  className?: string;
  variant?: "light" | "dark";
  showDetails?: boolean;
  showTagline?: boolean;
  iconOnly?: boolean;
}

export function PayentLogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center shrink-0 overflow-hidden rounded-lg bg-black",
        className || "h-9 w-9"
      )}
    >
      <picture className="w-full h-full flex items-center justify-center">
        <source srcSet={BRAND_ASSETS.logoIcon} type="image/webp" />
        <img
          src={BRAND_ASSETS.logoIconPng}
          alt="PAYENT"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 select-none"
          loading="eager"
          decoding="async"
        />
      </picture>
    </div>
  );
}

export function LogoIcon({
  className,
  showDetails = true,
  showTagline = false,
  iconOnly = false,
}: LogoIconProps) {
  if (iconOnly) {
    return <PayentLogoMark className={className} />;
  }

  return (
    <div className={cn("flex items-center gap-2.5 select-none group", className)}>
      <PayentLogoMark className="h-8 w-8 sm:h-9 sm:w-9" />

      {showDetails && (
        <div className="flex flex-col text-left justify-center">
          <span className="font-sans font-black tracking-tight text-xl text-neutral-950 dark:text-white leading-none">
            {BRAND_CONFIG.name}
          </span>
          {showTagline && (
            <span className="text-[7.5px] font-sans font-bold tracking-[0.2em] text-neutral-400 dark:text-[#8E9CA8] uppercase mt-1 leading-none">
              {BRAND_CONFIG.shortTagline}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
