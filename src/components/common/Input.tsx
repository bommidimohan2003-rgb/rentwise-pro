import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  rightAdornment?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, error, icon, rightAdornment, id, ...rest },
  ref,
) {
  const inputId = id ?? rest.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl border bg-card px-4 h-12 transition-colors",
          "border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/40",
          error && "border-destructive focus-within:ring-destructive/30",
        )}
      >
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground",
            className,
          )}
          {...rest}
        />
        {rightAdornment}
      </div>
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
});
