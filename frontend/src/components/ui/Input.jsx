import { forwardRef } from "react";
import { cn } from "../../lib/utils";

export const Input = forwardRef(function Input({ className, label, hint, error, id, ...props }, ref) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-content-muted">
          {label}
        </label>
      )}
      <input
        id={id}
        ref={ref}
        className={cn(
          "h-11 w-full rounded-xl border bg-ink-800/70 px-3.5 text-sm text-content placeholder:text-content-dim transition-colors",
          "focus:border-iris/60 focus:outline-none focus:ring-2 focus:ring-iris/20",
          error ? "border-critical/50" : "border-line",
          className
        )}
        {...props}
      />
      {error ? (
        <p className="text-xs text-critical">{error}</p>
      ) : hint ? (
        <p className="text-xs text-content-dim">{hint}</p>
      ) : null}
    </div>
  );
});
