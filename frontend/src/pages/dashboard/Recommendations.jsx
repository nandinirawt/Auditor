import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles, Zap, ArrowUpRight, Search, Code2, Radio, Wand2, FolderSearch, AlertCircle,
} from "lucide-react";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { SeverityPill } from "../../components/ui/Badge";
import { CardSkeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { useCurrentAudit } from "../../context/AuditContext";
import { useRecommendations } from "../../hooks/useStudio";
import { apiErrorMessage } from "../../api/client";
import { cn } from "../../lib/utils";

const priorityMeta = {
  P1: { label: "P1 · Critical", color: "#FB7185" },
  P2: { label: "P2 · High", color: "#FB923C" },
  P3: { label: "P3 · Medium", color: "#FBBF24" },
  P4: { label: "P4 · Low", color: "#64748B" },
};

export default function Recommendations() {
  const navigate = useNavigate();
  const { current, selectedIssueId, setSelectedIssueId } = useCurrentAudit();
  const token = current?.token;
  const { data, isLoading, isError, error } = useRecommendations(token);

  const [group, setGroup] = useState("All");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("priority");

  const recs = data?.recommendations || [];

  // Default the synchronized selection to the first recommendation.
  useEffect(() => {
    if (recs.length && !selectedIssueId) setSelectedIssueId(recs[0].issue_id);
  }, [recs, selectedIssueId, setSelectedIssueId]);

  const filtered = useMemo(() => {
    let list = recs.filter((r) => {
      if (group !== "All" && r.category !== group) return false;
      if (q && !(`${r.problem} ${r.suggested_improvement} ${r.category} ${r.selector}`.toLowerCase().includes(q.toLowerCase()))) return false;
      return true;
    });
    if (sort === "impact") list = [...list].sort((a, b) => b.est_accessibility_improvement - a.est_accessibility_improvement);
    return list;
  }, [recs, group, q, sort]);

  function openCode(r) {
    setSelectedIssueId(r.issue_id);
    navigate("/dashboard/code");
  }

  if (!token) {
    return (
      <>
        <PageHeader eyebrow="AI Studio" title="Recommendations" description="Prioritized fixes generated from your audit's real issues." />
        <EmptyState icon={Wand2} title="Run an audit to generate recommendations"
          body="Paste a URL on the home page and analyze it. We'll turn the real issues we find into prioritized, actionable recommendations."
          action={<Button onClick={() => navigate("/")}>Start an audit</Button>} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="AI Studio"
        title="Recommendations"
        description={`Prioritized fixes generated from ${current?.domain || "your site"}'s real issues, ordered by impact.`}
        action={<span className="inline-flex items-center gap-1.5 rounded-full border border-pass/30 bg-pass/10 px-2.5 py-1 text-xs font-medium text-pass"><Radio size={12} /> Live · from audit</span>}
      />

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2"><CardSkeleton lines={4} /><CardSkeleton lines={4} /><CardSkeleton lines={4} /><CardSkeleton lines={4} /></div>
      ) : isError ? (
        <EmptyState icon={AlertCircle} title="Couldn't load recommendations" body={apiErrorMessage(error)} />
      ) : recs.length === 0 ? (
        <EmptyState icon={Sparkles} title="No issues to recommend" body="The homepage scan found no accessibility violations. Nice work!" />
      ) : (
        <>
          {/* Toolbar */}
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-line bg-ink-800/70 px-3">
              <Search size={15} className="text-content-dim" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search recommendations…"
                className="h-9 w-full min-w-0 bg-transparent text-sm text-content placeholder:text-content-dim focus:outline-none" />
            </div>
            <select value={sort} onChange={(e) => setSort(e.target.value)}
              className="h-9 rounded-lg border border-line bg-ink-800/70 px-2.5 text-xs text-content focus:outline-none">
              <option value="priority">Sort: Priority</option>
              <option value="impact">Sort: Est. impact</option>
            </select>
          </div>

          {/* Group chips */}
          <div className="mb-5 flex flex-wrap gap-1.5">
            {[{ name: "All", count: recs.length }, ...(data.groups || [])].map((g) => (
              <button key={g.name} onClick={() => setGroup(g.name)}
                className={cn("rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  group === g.name ? "border-iris/50 bg-iris/15 text-content" : "border-line bg-ink-800/60 text-content-muted hover:text-content")}>
                {g.name} <span className="text-content-dim">{g.count}</span>
              </button>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {filtered.map((r, i) => {
              const pm = priorityMeta[r.priority] || priorityMeta.P4;
              const selected = selectedIssueId === r.issue_id;
              return (
                <motion.div key={r.issue_id + i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.3) }}>
                  <Card className={cn("h-full transition-colors", selected ? "border-iris/50 ring-1 ring-iris/30" : "hover:border-line-strong")}>
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                        style={{ color: pm.color, background: `${pm.color}1a`, border: `1px solid ${pm.color}33` }}>
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: pm.color }} />{pm.label}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <SeverityPill severity={r.severity} />
                        <span className="chip">{r.category}</span>
                      </div>
                    </div>
                    <h3 className="font-display text-base font-semibold leading-snug text-content">{r.problem}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-content-muted">{r.suggested_improvement}</p>

                    <div className="mt-3 panel p-2.5">
                      <div className="text-[11px] text-content-dim">Affected element</div>
                      <code className="block break-all font-mono text-xs text-iris-bright">{r.selector}</code>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                      <span className="inline-flex items-center gap-1.5 text-pass"><ArrowUpRight size={13} /> +{r.est_accessibility_improvement} a11y</span>
                      <span className="inline-flex items-center gap-1.5 text-content-muted"><Zap size={13} className="text-content-dim" /> +{r.est_ux_improvement} UX</span>
                      {r.wcag && <span className="chip">WCAG {r.wcag}</span>}
                      <span className="text-content-dim">conf. {Math.round(r.confidence * 100)}%</span>
                    </div>

                    <div className="mt-4 flex items-center gap-2 border-t border-line pt-3">
                      <Button size="sm" onClick={() => openCode(r)}><Code2 size={14} /> View code</Button>
                      <Button size="sm" variant="secondary" onClick={() => { setSelectedIssueId(r.issue_id); navigate("/dashboard/before-after"); }}>Before / After</Button>
                      {selected && <span className="ml-auto text-[11px] font-medium text-iris-bright">Selected</span>}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="mt-4"><EmptyState icon={FolderSearch} title="Nothing matches" body="Try a different group or search." /></div>
          )}
        </>
      )}
    </>
  );
}
