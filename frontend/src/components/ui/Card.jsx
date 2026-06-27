import { cn } from "../../lib/utils";

export function Card({ className, children, ...props }) {
  return (
    <div className={cn("card p-5", className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, icon: Icon, action }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        {Icon && (
          <span className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-ink-800 text-iris-bright">
            <Icon size={17} />
          </span>
        )}
        <div>
          <h3 className="font-display text-[15px] font-semibold tracking-tight text-content">
            {title}
          </h3>
          {subtitle && <p className="mt-0.5 text-xs text-content-muted">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
