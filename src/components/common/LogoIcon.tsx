import { cn } from "@/lib/utils";

export function LogoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("fill-current", className)} aria-hidden="true">
      {/* Payent Infinity Exchange Loop Logo Mark */}
      <rect x="5" y="4" width="4" height="24" rx="2" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9 4H18.5C23.1944 4 27 7.80558 27 12.5C27 17.1944 23.1944 21 18.5 21H9V17H18.5C20.9853 17 23 14.9853 23 12.5C23 10.0147 20.9853 8 18.5 8H9V4Z"
      />
      <circle cx="18.5" cy="12.5" r="2.25" />
    </svg>
  );
}
