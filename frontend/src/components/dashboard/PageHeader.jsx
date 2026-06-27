import { Monitor, Tablet, Smartphone } from "lucide-react";
import { cn } from "../../lib/utils";

export function PageHeader({ title, description, eyebrow, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-iris-bright">
            {eyebrow}
          </div>
        )}
        <h1 className="font-display text-2xl font-semibold tracking-tight text-content">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-content-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

// A stylized capture frame. Real screenshots replace the inner content once the
// engine phase lands; the chrome + device sizing stay.
function FauxPage({ tone = "a" }) {
  const accent = tone === "a" ? "#6366F1" : tone === "b" ? "#A855F7" : "#22D3EE";
  return (
    <div className="h-full w-full overflow-hidden bg-gradient-to-b from-ink-700 to-ink">
      <div
        className="flex h-14 items-center justify-between px-3"
        style={{ background: `linear-gradient(120deg, ${accent}22, transparent)` }}
      >
        <div className="h-2 w-16 rounded-full bg-white/15" />
        <div className="flex gap-1.5">
          <div className="h-1.5 w-8 rounded-full bg-white/10" />
          <div className="h-1.5 w-8 rounded-full bg-white/10" />
          <div className="h-1.5 w-10 rounded-full" style={{ background: `${accent}66` }} />
        </div>
      </div>
      <div className="space-y-2 p-3">
        <div className="h-10 rounded-md" style={{ background: `linear-gradient(120deg, ${accent}33, ${accent}10)` }} />
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 rounded-md bg-white/[0.04]" />
          ))}
        </div>
        <div className="h-2 w-3/4 rounded-full bg-white/10" />
        <div className="h-2 w-1/2 rounded-full bg-white/[0.07]" />
      </div>
    </div>
  );
}

export function DeviceFrame({ device = "desktop", tone = "a" }) {
  const cfg = {
    desktop: { icon: Monitor, label: "Desktop", w: "1440 × 900", ratio: "aspect-[16/10]", rounded: "rounded-lg" },
    tablet: { icon: Tablet, label: "Tablet", w: "834 × 1112", ratio: "aspect-[3/4]", rounded: "rounded-xl" },
    mobile: { icon: Smartphone, label: "Mobile", w: "390 × 844", ratio: "aspect-[9/19]", rounded: "rounded-2xl" },
  }[device];
  const Icon = cfg.icon;

  return (
    <div className="flex flex-col items-center">
      <div className={cn("w-full overflow-hidden border border-line-strong bg-ink-800 shadow-card", cfg.rounded)}>
        <div className="flex items-center gap-1.5 border-b border-line bg-ink-700/80 px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-critical/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-moderate/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-pass/70" />
          <span className="ml-2 truncate font-mono text-[10px] text-content-dim">lumio.store</span>
        </div>
        <div className={cfg.ratio}>
          <FauxPage tone={tone} />
        </div>
      </div>
      <div className="mt-2.5 flex items-center gap-2 text-content-muted">
        <Icon size={14} />
        <span className="text-xs font-medium">{cfg.label}</span>
        <span className="font-mono text-[10px] text-content-dim">{cfg.w}</span>
      </div>
    </div>
  );
}
