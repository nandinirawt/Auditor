import { useMemo, useState } from "react";
import { Search, ListFilter, Radio } from "lucide-react";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { FindingsTable } from "../../components/dashboard/FindingsTable";
import { Card } from "../../components/ui/Card";
import { CardSkeleton } from "../../components/ui/Skeleton";
import { useFindings } from "../../hooks/useAudit";
import { useCurrentAudit } from "../../context/AuditContext";
import { severityMeta, cn } from "../../lib/utils";

const severities = ["critical", "serious", "moderate", "minor"];
const sources = ["all", "axe", "lighthouse"];

export default function Accessibility() {
  const { data: mockFindings, isLoading: mockLoading } = useFindings();
  const { current } = useCurrentAudit();
  const realFindings = current?.accessibility?.findings || null;
  const isLive = !!realFindings;
  const findings = realFindings || mockFindings;
  const isLoading = isLive ? false : mockLoading;
  const [active, setActive] = useState(new Set());
  const [source, setSource] = useState("all");
  const [q, setQ] = useState("");

  const toggle = (s) =>
    setActive((prev) => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });

  const filtered = useMemo(() => {
    if (!findings) return [];
    return findings.filter((f) => {
      if (active.size && !active.has(f.severity)) return false;
      if (source !== "all" && f.source !== source) return false;
      if (q && !(`${f.title} ${f.description} ${f.category}`.toLowerCase().includes(q.toLowerCase()))) return false;
      return true;
    });
  }, [findings, active, source, q]);

  const counts = useMemo(() => {
    const c = { critical: 0, serious: 0, moderate: 0, minor: 0 };
    (findings || []).forEach((f) => (c[f.severity] += 1));
    return c;
  }, [findings]);

  return (
    <>
      <PageHeader
        eyebrow="Audit"
        title="Accessibility"
        description={isLive
          ? `Real axe-core scan of ${current?.domain || "your site"} — every violation with its selector and fix.`
          : "Sample data — run an audit to scan your site with axe-core."}
        action={isLive ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-pass/30 bg-pass/10 px-2.5 py-1 text-xs font-medium text-pass">
            <Radio size={12} /> Live · axe-core
          </span>
        ) : null}
      />

      {isLoading ? (
        <CardSkeleton lines={6} />
      ) : (
        <>
          {/* Severity summary tiles */}
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {severities.map((s) => (
              <button
                key={s}
                onClick={() => toggle(s)}
                className={cn(
                  "panel p-4 text-left transition-all",
                  active.has(s) ? "ring-2 ring-offset-2 ring-offset-ink" : "hover:border-line-strong"
                )}
                style={active.has(s) ? { boxShadow: `0 0 0 2px ${severityMeta[s].color}` } : undefined}
              >
                <div className="font-mono text-2xl font-semibold" style={{ color: severityMeta[s].color }}>
                  {counts[s]}
                </div>
                <div className="mt-0.5 text-xs text-content-muted">{severityMeta[s].label}</div>
              </button>
            ))}
          </div>

          {/* Toolbar */}
          <Card className="!p-0">
            <div className="flex flex-wrap items-center gap-3 border-b border-line p-3.5">
              <div className="flex flex-1 items-center gap-2 rounded-lg border border-line bg-ink-800/70 px-3">
                <Search size={15} className="text-content-dim" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search issues…"
                  className="h-9 w-full min-w-0 bg-transparent text-sm text-content placeholder:text-content-dim focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-1 rounded-lg border border-line bg-ink-800/70 p-1">
                <ListFilter size={14} className="ml-1.5 text-content-dim" />
                {sources.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSource(s)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                      source === s ? "bg-white/[0.08] text-content" : "text-content-muted hover:text-content"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {(active.size || source !== "all" || q) && (
                <button
                  onClick={() => {
                    setActive(new Set());
                    setSource("all");
                    setQ("");
                  }}
                  className="text-xs text-content-muted hover:text-content"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="px-1 py-1 text-[11px] text-content-dim">
              <span className="px-3 py-2">
                Showing {filtered.length} of {findings.length} issues
              </span>
            </div>
            <FindingsTable findings={filtered} />
          </Card>
        </>
      )}
    </>
  );
}
