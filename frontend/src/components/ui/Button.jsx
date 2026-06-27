import { forwardRef } from "react";
import { cn } from "../../lib/utils";

const variants = {
  primary:
    "bg-iris-violet text-white shadow-[0_8px_24px_-10px_rgba(99,102,241,0.7)] hover:brightness-110",
  secondary:
    "bg-surface text-content border border-line hover:bg-surface-hover hover:border-line-strong",
  ghost: "text-content-muted hover:text-content hover:bg-white/[0.04]",
  danger: "bg-critical/15 text-critical border border-critical/30 hover:bg-critical/25",
  outline: "border border-line-strong text-content hover:bg-white/[0.04]",
};

const sizes = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
  icon: "h-10 w-10",
};

export const Button = forwardRef(function Button(
  { className, variant = "primary", size = "md", loading, children, disabled, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-medium font-display tracking-tight transition-all duration-150 focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      )}
      {children}
    </button>
  );
});
