import { cn } from "../../lib/utils";
import { severityMeta } from "../../lib/utils";

export function SeverityPill({ severity, className }) {
  const meta = severityMeta[severity] || { label: severity, color: "#64748B" };
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", className)}
      style={{ color: meta.color, background: `${meta.color}1a`, border: `1px solid ${meta.color}33` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
      {meta.label}
    </span>
  );
}

export function LevelTag({ level }) {
  if (!level) return null;
  return (
    <span className="rounded-md border border-line bg-ink-800 px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide text-content-muted">
      WCAG {level}
    </span>
  );
}

export function StatusDot({ status }) {
  const map = {
    completed: { c: "#34D399", t: "Completed" },
    running: { c: "#818CF8", t: "Running" },
    failed: { c: "#FB7185", t: "Failed" },
    queued: { c: "#FBBF24", t: "Queued" },
  };
  const s = map[status] || { c: "#64748B", t: status };
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-content-muted">
      <span className="h-2 w-2 rounded-full" style={{ background: s.c, boxShadow: `0 0 8px ${s.c}` }} />
      {s.t}
    </span>
  );
}
