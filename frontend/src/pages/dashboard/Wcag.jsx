import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Search, Radio, TrendingUp, TrendingDown, Minus, ExternalLink, BookOpen } from "lucide-react";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { Card, CardHeader } from "../../components/ui/Card";
import { CardSkeleton } from "../../components/ui/Skeleton";
import { useWcag } from "../../hooks/useAudit";
import { useWcagReport } from "../../hooks/useAudits";
import { useCurrentAudit } from "../../context/AuditContext";
import { cn } from "../../lib/utils";

const levels = ["All", "A", "AA"];
const statuses = ["All", "Failed", "Passed"];

function TrendBadge({ delta, suffix = "%" }) {
  if (delta == null) return null;
  if (delta === 0) return <span className="inline-flex items-center gap-0.5 text-[11px] text-content-dim"><Minus size={11} /> 0{suffix}</span>;
  const up = delta > 0;
  const color = up ? "#34D399" : "#FB7185";
  const Icon = up ? TrendingUp : TrendingDown;
  return <span className="inline-flex items-center gap-0.5 text-[11px] font-medium" style={{ color }}><Icon size={11} /> {up ? "+" : ""}{delta}{suffix}</span>;
}

export default function Wcag() {
  const { current } = useCurrentAudit();
  const token = current?.token;
  const { data: report } = useWcagReport(token);
  const { data: mockData, isLoading: mockLoading } = useWcag();

  const reportWcag = report?.wcag || null;
  const ctxWcag = current?.accessibility?.wcag || null;
  const data = reportWcag || ctxWcag || mockData;
  const trend = report?.trend || null;
  const isLive = !!(reportWcag || ctxWcag);

  const [level, setLevel] = useState("All");
  const [status, setStatus] = useState("All");
  const [q, setQ] = useState("");

  const trendByPrinciple = useMemo(() => {
    const m = {};
    (trend?.principles || []).forEach((p) => { m[p.label] = p.delta; });
    return m;
  }, [trend]);

  const criteria = useMemo(() => {
    if (!data) return [];
    return data.criteria.filter((c) => {
      if (level !== "All" && c.level !== level) return false;
      if (status === "Passed" && c.status !== "pass") return false;
      if (status === "Failed" && c.status !== "fail") return false;
      if (q && !(`${c.id} ${c.name}`.toLowerCase().includes(q.toLowerCase()))) return false;
      return true;
    });
  }, [data, level, status, q]);

  if (!data && mockLoading) {
    return (
      <>
        <PageHeader eyebrow="Compliance" title="WCAG 2.2" description="Mapping findings to success criteria…" />
        <CardSkeleton lines={6} />
      </>
    );
  }
  if (!data) return null;

  const totalPass = data.principles.reduce((a, p) => a + p.passed, 0);
  const totalAll = data.principles.reduce((a, p) => a + p.total, 0);
  const pct = Math.round((totalPass / totalAll) * 100);
  const prevDate = trend?.prev_date ? new Date(trend.prev_date).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : null;

  return (
    <>
      <PageHeader
        eyebrow="Compliance"
        title="WCAG 2.2"
        description={`Conformance target: Level ${data.level}. ${totalPass} of ${totalAll} evaluated criteria pass (${pct}%).`}
        action={isLive ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-pass/30 bg-pass/10 px-2.5 py-1 text-xs font-medium text-pass">
            <Radio size={12} /> Live · from axe-core
          </span>
        ) : null}
      />

      {/* Compliance trend vs previous audit */}
      {trend && (
        <div className="mb-5 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-ink-800/40 px-4 py-3 text-sm">
          <span className="text-content-muted">Versus the previous audit{prevDate ? ` (${prevDate})` : ""}:</span>
          <span className="font-medium text-content">conformance</span>
          <TrendBadge delta={trend.compliance_delta} />
          {trend.compliance_delta === 0 && <span className="text-content-dim">no change</span>}
        </div>
      )}

      {/* POUR cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.principles.map((p, i) => {
          const ratio = p.total ? Math.round((p.passed / p.total) * 100) : 0;
          const color = ratio >= 85 ? "#34D399" : ratio >= 60 ? "#FBBF24" : "#FB7185";
          return (
            <motion.div key={p.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card className="h-full">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-display text-sm font-semibold text-content">{p.label}</h3>
                  <span className="font-mono text-sm font-semibold" style={{ color }}>{p.passed}/{p.total}</span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <motion.div className="h-full rounded-full" style={{ background: color }}
                    initial={{ width: 0 }} animate={{ width: `${ratio}%` }} transition={{ delay: 0.2 + i * 0.06, ease: "easeOut" }} />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs leading-relaxed text-content-muted">{p.note}</p>
                  <TrendBadge delta={trendByPrinciple[p.label]} />
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Criteria table */}
      <Card className="mt-5 !p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-3.5">
          <CardHeader title="Success criteria" subtitle="Evaluated against the audited page" />
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-line bg-ink-800/70 px-3">
              <Search size={15} className="text-content-dim" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search criteria…"
                className="h-9 w-40 bg-transparent text-sm text-content placeholder:text-content-dim focus:outline-none" />
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-line bg-ink-800/70 p-1">
              {statuses.map((s) => (
                <button key={s} onClick={() => setStatus(s)}
                  className={cn("rounded-md px-2.5 py-1 text-xs font-medium transition-colors", status === s ? "bg-white/[0.08] text-content" : "text-content-muted hover:text-content")}>{s}</button>
              ))}
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-line bg-ink-800/70 p-1">
              {levels.map((l) => (
                <button key={l} onClick={() => setLevel(l)}
                  className={cn("rounded-md px-2.5 py-1 text-xs font-medium transition-colors", level === l ? "bg-white/[0.08] text-content" : "text-content-muted hover:text-content")}>{l}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="divide-y divide-line">
          {criteria.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.03, 0.3) }}
              className="flex items-center gap-3 px-4 py-3">
              <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-full", c.status === "pass" ? "bg-pass/15 text-pass" : "bg-critical/15 text-critical")}>
                {c.status === "pass" ? <Check size={13} strokeWidth={3} /> : <X size={13} strokeWidth={3} />}
              </span>
              <span className="w-12 shrink-0 font-mono text-xs font-semibold text-content-muted">{c.id}</span>
              <span className="min-w-0 flex-1 truncate text-sm text-content">{c.name}</span>
              <div className="hidden items-center gap-2 sm:flex">
                {c.w3c_url && <a href={c.w3c_url} target="_blank" rel="noreferrer" title="W3C Understanding" className="text-content-dim hover:text-iris-bright"><BookOpen size={14} /></a>}
                {c.deque_url && <a href={c.deque_url} target="_blank" rel="noreferrer" title="Deque rule" className="text-content-dim hover:text-iris-bright"><ExternalLink size={14} /></a>}
              </div>
              <span className="rounded-md border border-line bg-ink-800 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-content-muted">{c.level}</span>
              <span className="hidden w-20 shrink-0 text-right text-xs text-content-muted sm:block">
                {c.issues > 0 ? `${c.issues} issue${c.issues > 1 ? "s" : ""}` : "Pass"}
              </span>
            </motion.div>
          ))}
          {criteria.length === 0 && <div className="px-4 py-8 text-center text-sm text-content-dim">No criteria match these filters.</div>}
        </div>
      </Card>
    </>
  );
}
