import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "destructive";
type Size = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-[#161616] text-[#FFFFFF] hover:bg-[#292929] active:bg-[#0B0B0B] dark:bg-[#F2F0EA] dark:text-[#0A0A0A] dark:hover:bg-[#FFFFFF] dark:active:bg-[#DCD9D1] border border-transparent shadow-sm",
  secondary:
    "bg-[#FFFFFF] text-[#171717] border border-[#D6D6D6] hover:bg-[#F3F3F3] active:bg-[#EAEAEA] dark:bg-transparent dark:text-[#F3F3F3] dark:border-white/25 dark:hover:bg-white/[0.08] dark:active:bg-white/[0.14]",
  ghost:
    "bg-transparent text-[#333333] hover:bg-[#F4F4F4] active:bg-[#EAEAEA] dark:text-[#BFC3C7] dark:hover:bg-white/[0.06] dark:hover:text-white",
  outline:
    "bg-transparent text-[#171717] border border-[#D6D6D6] hover:bg-[#F3F3F3] active:bg-[#EAEAEA] dark:text-[#F3F3F3] dark:border-white/25 dark:hover:bg-white/[0.08] dark:active:bg-white/[0.14]",
  destructive:
    "bg-[#FF1744] text-[#FFFFFF] hover:bg-[#D50000] active:bg-[#B71C1C] border border-transparent shadow-sm",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm rounded-lg",
  md: "h-11 px-5 text-sm rounded-xl",
  lg: "h-14 px-7 text-base rounded-2xl",
  icon: "h-10 w-10 rounded-full grid place-items-center",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className,
      variant = "primary",
      size = "md",
      loading,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...rest
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          variants[variant],
          sizes[size],
          className,
        )}
        {...rest}
      >
        {loading ? (
          <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {!loading && rightIcon}
      </button>
    );
  },
);
