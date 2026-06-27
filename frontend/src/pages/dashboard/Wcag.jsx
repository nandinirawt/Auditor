import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Search } from "lucide-react";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { Card, CardHeader } from "../../components/ui/Card";
import { CardSkeleton } from "../../components/ui/Skeleton";
import { useWcag } from "../../hooks/useAudit";
import { cn } from "../../lib/utils";

const levels = ["All", "A", "AA"];

export default function Wcag() {
  const { data, isLoading } = useWcag();
  const [level, setLevel] = useState("All");
  const [q, setQ] = useState("");

  const criteria = useMemo(() => {
    if (!data) return [];
    return data.criteria.filter((c) => {
      if (level !== "All" && c.level !== level) return false;
      if (q && !(`${c.id} ${c.name}`.toLowerCase().includes(q.toLowerCase()))) return false;
      return true;
    });
  }, [data, level, q]);

  if (isLoading || !data) {
    return (
      <>
        <PageHeader eyebrow="Compliance" title="WCAG 2.2" description="Mapping findings to success criteria…" />
        <CardSkeleton lines={6} />
      </>
    );
  }

  const totalPass = data.principles.reduce((a, p) => a + p.passed, 0);
  const totalAll = data.principles.reduce((a, p) => a + p.total, 0);
  const pct = Math.round((totalPass / totalAll) * 100);

  return (
    <>
      <PageHeader
        eyebrow="Compliance"
        title="WCAG 2.2"
        description={`Conformance target: Level ${data.level}. ${totalPass} of ${totalAll} evaluated criteria pass (${pct}%).`}
      />

      {/* POUR cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.principles.map((p, i) => {
          const ratio = Math.round((p.passed / p.total) * 100);
          const color = ratio >= 85 ? "#34D399" : ratio >= 60 ? "#FBBF24" : "#FB7185";
          return (
            <motion.div
              key={p.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Card className="h-full">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-display text-sm font-semibold text-content">{p.label}</h3>
                  <span className="font-mono text-sm font-semibold" style={{ color }}>
                    {p.passed}/{p.total}
                  </span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${ratio}%` }}
                    transition={{ delay: 0.2 + i * 0.06, ease: "easeOut" }}
                  />
                </div>
                <p className="mt-3 text-xs leading-relaxed text-content-muted">{p.note}</p>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Criteria table */}
      <Card className="mt-5 !p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-3.5">
          <CardHeader title="Success criteria" subtitle="Evaluated against the audited pages" />
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-line bg-ink-800/70 px-3">
              <Search size={15} className="text-content-dim" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search criteria…"
                className="h-9 w-40 bg-transparent text-sm text-content placeholder:text-content-dim focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-line bg-ink-800/70 p-1">
              {levels.map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    level === l ? "bg-white/[0.08] text-content" : "text-content-muted hover:text-content"
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="divide-y divide-line">
          {criteria.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
              className="flex items-center gap-3 px-4 py-3"
            >
              <span
                className={cn(
                  "grid h-6 w-6 shrink-0 place-items-center rounded-full",
                  c.status === "pass" ? "bg-pass/15 text-pass" : "bg-critical/15 text-critical"
                )}
              >
                {c.status === "pass" ? <Check size={13} strokeWidth={3} /> : <X size={13} strokeWidth={3} />}
              </span>
              <span className="w-12 shrink-0 font-mono text-xs font-semibold text-content-muted">{c.id}</span>
              <span className="min-w-0 flex-1 truncate text-sm text-content">{c.name}</span>
              <span className="rounded-md border border-line bg-ink-800 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-content-muted">
                {c.level}
              </span>
              <span className="hidden w-20 shrink-0 text-right text-xs text-content-muted sm:block">
                {c.issues > 0 ? `${c.issues} issue${c.issues > 1 ? "s" : ""}` : "Pass"}
              </span>
            </motion.div>
          ))}
        </div>
      </Card>
    </>
  );
}
