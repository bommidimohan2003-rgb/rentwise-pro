import { cn } from "@/lib/utils";

export function LogoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("fill-none stroke-current", className)}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Clean, highly legible connected ribbon P and R logo */}
      {/* Left side 'P' */}
      <path d="M5 19V5h5a3.5 3.5 0 0 1 0 7H5" />
      {/* Connected bridge and right side 'R' */}
      <path d="M5 12h7V5h5a3.5 3.5 0 0 1 0 7H12" />
      {/* Leg of the R */}
      <path d="M15.5 12l3.5 7" />
    </svg>
  );
}
