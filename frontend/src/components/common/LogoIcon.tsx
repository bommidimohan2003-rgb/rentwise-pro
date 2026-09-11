import { cn } from "@/lib/utils";

interface LogoIconProps {
  className?: string;
  variant?: "light" | "dark";
  showDetails?: boolean;
  showTagline?: boolean;
  iconOnly?: boolean;
}

export function PayentLogoMark({ className }: { className?: string }) {
  return (
    <div className={cn("relative flex items-center justify-center shrink-0", className || "h-9 w-9")}>
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_2px_12px_rgba(16,185,129,0.45)] transition-transform duration-300 group-hover:scale-105"
      >
        <defs>
          <linearGradient id="payent-grad-main" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="50%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="payent-grad-accent" x1="10" y1="4" x2="26" y2="20" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6EE7B7" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
        </defs>

        {/* Outer Ribbon Letter P with negative space cutout */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M7 10C7 6.68629 9.68629 4 13 4H19C24.5228 4 29 8.47715 29 14C29 19.5228 24.5228 24 19 24H13V27.5C13 29.433 11.433 31 9.5 31C7.567 31 7 29.433 7 27.5V10ZM13 10H19C21.2091 10 23 11.7909 23 14C23 16.2091 21.2091 18 19 18H13V10Z"
          fill="url(#payent-grad-main)"
        />

        {/* Ambient Fold Accent Highlight */}
        <path
          d="M7 14C7 8.47715 11.4772 4 17 4H19C24.5228 4 29 8.47715 29 14C29 16.5 28.1 18.8 26.5 20.6C27.5 18.8 28 16.5 28 14C28 9.02944 23.9706 5 19 5H13C9.68629 5 7 7.68629 7 11V14Z"
          fill="url(#payent-grad-accent)"
          opacity="0.8"
        />
      </svg>
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
            Payent
          </span>
          {showTagline && (
            <span className="text-[7.5px] font-sans font-bold tracking-[0.2em] text-neutral-400 dark:text-[#8E9CA8] uppercase mt-1 leading-none">
              Gear Rental
            </span>
          )}
        </div>
      )}
    </div>
  );
}

