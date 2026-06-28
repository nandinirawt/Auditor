import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend,
} from "recharts";
import {
  Crown, Plus, Trash2, Loader2, Lightbulb, AlertCircle, Info, GitCompare, X,
} from "lucide-react";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { Card, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { useCurrentAudit } from "../../context/AuditContext";
import { getSuggestions, getBenchmark, addCompetitor, removeCompetitor } from "../../api/benchmark";
import { apiErrorMessage } from "../../api/client";
import { scoreBand, cn } from "../../lib/utils";

const CATEGORIES = ["ecommerce", "news", "saas", "education", "government", "healthcare", "finance", "travel", "portfolio", "restaurant"];

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-surface/95 px-3 py-2 shadow-card backdrop-blur">
      <div className="mb-1 text-[11px] text-content-dim">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-xs text-content">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span>{p.name}</span><span className="ml-auto font-mono font-semibold">{p.value ?? "—"}</span>
        </div>
      ))}
    </div>
  );
}

export default function Competitor() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { current } = useCurrentAudit();
  const token = current?.token;

  const [category, setCategory] = useState("");
  const [url, setUrl] = useState("");
  const [adding, setAdding] = useState(null); // url currently scanning
  const [error, setError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["benchmark", token],
    queryFn: () => getBenchmark(token),
    enabled: !!token,
  });
  const { data: sugg } = useQuery({
    queryKey: ["benchmark-suggestions", category],
    queryFn: () => getSuggestions(category),
    enabled: !!category,
  });

  const competitors = data?.competitors || [];
  const base = data?.base;
  const average = data?.average;

  const existingDomains = useMemo(
    () => new Set(competitors.map((c) => c.domain)),
    [competitors]);

  const chartData = useMemo(() => {
    if (!base) return [];
    const rows = [{ name: "You", accessibility: base.accessibility, wcag: base.wcag }];
    competitors.forEach((c) => rows.push({ name: c.domain, accessibility: c.accessibility, wcag: c.wcag }));
    return rows;
  }, [base, competitors]);

  const ranked = useMemo(() => {
    if (!base) return [];
    return [{ ...base, you: true }, ...competitors]
      .filter((s) => s.accessibility != null)
      .sort((a, b) => b.accessibility - a.accessibility);
  }, [base, competitors]);
  const yourRank = ranked.findIndex((s) => s.you) + 1;

  async function runAdd(target) {
    if (!target || adding) return;
    setError(""); setAdding(target);
    try {
      await addCompetitor(token, target, category || undefined);
      await qc.invalidateQueries({ queryKey: ["benchmark", token] });
      setUrl("");
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setAdding(null);
    }
  }

  async function remove(t) {
    try { await removeCompetitor(token, t); await qc.invalidateQueries({ queryKey: ["benchmark", token] }); }
    catch (e) { setError(apiErrorMessage(e)); }
  }

  if (!token) {
    return (
      <>
        <PageHeader eyebrow="Benchmark" title="Competitor comparison" description="Benchmark your site against competitors on the metrics we measure." />
        <EmptyState icon={GitCompare} title="Run your own audit first"
          body="Audit your site, then add competitors here. Each competitor is scanned with the same real engine and compared against you."
          action={<Button onClick={() => navigate("/")}><Plus size={15} /> Run an audit</Button>} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Benchmark"
        title="Competitor comparison"
        description={`How ${base?.domain || "your site"} compares. Competitors are scanned live with the same axe-core engine.`}
      />

      <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-iris/30 bg-iris/[0.07] px-4 py-3">
        <Info size={16} className="mt-0.5 shrink-0 text-iris-bright" />
        <p className="text-sm text-content-muted">
          Comparisons for <span className="font-medium text-content">accessibility, WCAG and issue counts are real</span> — each competitor is fully scanned.
          Performance and SEO comparison needs Lighthouse (not wired yet). Large commercial sites often block automated scans and will show an error — smaller sites scan most reliably.
        </p>
      </div>

      {/* Add competitors */}
      <Card className="mb-5">
        <CardHeader title="Add competitors" subtitle="Pick a category for suggestions, or paste any URL" />
        <div className="flex flex-wrap items-center gap-2">
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="h-10 rounded-lg border border-line bg-ink-800/70 px-3 text-sm text-content focus:outline-none">
            <option value="">Category…</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>)}
          </select>
          <div className="flex h-10 flex-1 items-center gap-2 rounded-lg border border-line bg-ink-800/70 px-3">
            <input value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && runAdd(url)}
              placeholder="https://competitor.com" className="w-full min-w-0 bg-transparent text-sm text-content placeholder:text-content-dim focus:outline-none" />
          </div>
          <Button onClick={() => runAdd(url)} disabled={!url || !!adding}>
            {adding ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Add & scan
          </Button>
        </div>

        {sugg?.suggestions?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {sugg.suggestions.map((s) => {
              const dom = s.url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/.*$/, "");
              const added = existingDomains.has(dom);
              return (
                <button key={s.url} onClick={() => !added && runAdd(s.url)} disabled={added || !!adding}
                  className={cn("rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    added ? "border-pass/30 bg-pass/10 text-pass" : "border-line bg-ink-800/60 text-content-muted hover:text-content disabled:opacity-50")}>
                  {added ? "✓ " : "+ "}{s.name}
                </button>
              );
            })}
          </div>
        )}

        {adding && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-line bg-ink-800/50 px-3 py-2 text-sm text-content-muted">
            <Loader2 size={15} className="animate-spin text-iris-bright" />
            Scanning {adding.replace(/^https?:\/\/(www\.)?/, "").replace(/\/.*$/, "")} live — this takes a few seconds…
          </div>
        )}
        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-critical/30 bg-critical/10 px-3 py-2 text-sm text-critical">
            <AlertCircle size={15} /> {error}
            <button onClick={() => setError("")} className="ml-auto text-critical/70 hover:text-critical"><X size={14} /></button>
          </div>
        )}
      </Card>

      {isLoading ? null : competitors.length === 0 ? (
        <EmptyState icon={GitCompare} title="No competitors yet" body="Add a competitor above to see the comparison and insights." />
      ) : (
        <>
          {/* Score comparison chart */}
          <Card className="mb-5">
            <CardHeader title="Accessibility & WCAG" subtitle="You vs each competitor · measured live" />
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2433" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "#7A8194", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#7A8194", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="accessibility" name="Accessibility" fill="#C084FC" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="wcag" name="WCAG %" fill="#818CF8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Insights */}
          {data.insights?.length > 0 && (
            <Card className="mb-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-content"><Lightbulb size={16} className="text-amber-300" /> Benchmark insights</div>
              <ul className="space-y-2">
                {data.insights.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-content-muted">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-iris-bright" /> {t}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Issue-count table */}
          <Card className="!p-0">
            <div className="border-b border-line p-4"><CardHeader title="Issue breakdown" subtitle="Lower is better · real counts from each scan" /></div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-[11px] uppercase tracking-wide text-content-dim">
                    <th className="px-4 py-2.5 text-left font-semibold">Site</th>
                    <th className="px-3 py-2.5 text-center font-semibold">A11y</th>
                    <th className="px-3 py-2.5 text-center font-semibold">Issues</th>
                    <th className="px-3 py-2.5 text-center font-semibold">Critical</th>
                    <th className="px-3 py-2.5 text-center font-semibold">Contrast</th>
                    <th className="px-3 py-2.5 text-center font-semibold">Alt</th>
                    <th className="px-3 py-2.5 text-center font-semibold">Keyboard</th>
                    <th className="px-3 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {[{ ...base, you: true }, ...competitors].map((s) => {
                    const b = s.accessibility != null ? scoreBand(s.accessibility) : null;
                    return (
                      <tr key={s.token} className={cn("border-b border-line/60", s.you && "bg-iris/[0.06]")}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {s.you && <Crown size={14} className="text-amber-300" />}
                            <span className="truncate text-content">{s.you ? `${s.domain} (you)` : s.domain}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center font-mono font-semibold" style={{ color: b?.color || "#64748B" }}>{s.accessibility ?? "—"}</td>
                        <td className="px-3 py-3 text-center font-mono text-content-muted">{s.issues ?? "—"}</td>
                        <td className="px-3 py-3 text-center font-mono text-content-muted">{s.critical ?? "—"}</td>
                        <td className="px-3 py-3 text-center font-mono text-content-muted">{s.contrast ?? "—"}</td>
                        <td className="px-3 py-3 text-center font-mono text-content-muted">{s.altText ?? "—"}</td>
                        <td className="px-3 py-3 text-center font-mono text-content-muted">{s.keyboard ?? "—"}</td>
                        <td className="px-3 py-3 text-right">
                          {!s.you && <button onClick={() => remove(s.token)} title="Remove" className="text-content-dim hover:text-critical"><Trash2 size={14} /></button>}
                        </td>
                      </tr>
                    );
                  })}
                  {average && (
                    <tr className="bg-ink-800/40 text-content-muted">
                      <td className="px-4 py-3 font-medium">Competitor average</td>
                      <td className="px-3 py-3 text-center font-mono">{average.accessibility ?? "—"}</td>
                      <td className="px-3 py-3 text-center font-mono">{average.issues ?? "—"}</td>
                      <td className="px-3 py-3 text-center font-mono">{average.critical ?? "—"}</td>
                      <td className="px-3 py-3 text-center font-mono">{average.contrast ?? "—"}</td>
                      <td className="px-3 py-3 text-center font-mono">{average.altText ?? "—"}</td>
                      <td className="px-3 py-3 text-center font-mono">{average.keyboard ?? "—"}</td>
                      <td></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {yourRank > 0 && (
              <div className="border-t border-line px-4 py-3 text-xs text-content-dim">
                You rank <span className="font-semibold text-content">#{yourRank}</span> of {ranked.length} on accessibility.
              </div>
            )}
          </Card>
        </>
      )}
    </>
  );
}
