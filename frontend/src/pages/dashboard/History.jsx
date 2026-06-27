import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import {
  History as HistoryIcon, Plus, Search, Trash2, RefreshCw, ExternalLink,
  AlertCircle, Loader2, ArrowUpRight,
} from "lucide-react";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Skeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { useCurrentAudit } from "../../context/AuditContext";
import { useAuditsList } from "../../hooks/useAudits";
import { deleteAudit, runScreenshots } from "../../api/audits";
import { apiErrorMessage } from "../../api/client";
import { scoreBand, cn } from "../../lib/utils";

function Score({ value, suffix = "" }) {
  if (value == null) return <span className="font-mono text-sm text-content-dim">—</span>;
  const b = scoreBand(value);
  return <span className="font-mono text-sm font-semibold" style={{ color: b.color }}>{value}{suffix}</span>;
}

export default function History() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { current, loadAuditByToken } = useCurrentAudit();
  const { data, isLoading, isError, error, refetch } = useAuditsList();

  const [q, setQ] = useState("");
  const [sort, setSort] = useState("newest");
  const [busy, setBusy] = useState(null); // token being acted on

  const audits = data?.audits || [];
  const rows = useMemo(() => {
    let list = audits.filter((a) => !q || `${a.domain} ${a.title} ${a.url}`.toLowerCase().includes(q.toLowerCase()));
    if (sort === "oldest") list = [...list].reverse();
    if (sort === "score") list = [...list].sort((a, b) => (b.accessibility_score ?? -1) - (a.accessibility_score ?? -1));
    return list;
  }, [audits, q, sort]);

  const open = async (token) => {
    setBusy(token);
    try { await loadAuditByToken(token); navigate("/dashboard"); }
    finally { setBusy(null); }
  };

  const rerun = async (url) => {
    setBusy("rerun:" + url);
    try {
      const res = await runScreenshots(url);
      await qc.invalidateQueries({ queryKey: ["audits"] });
      if (res?.token) { await loadAuditByToken(res.token); navigate("/dashboard"); }
    } catch (e) { alert(apiErrorMessage(e)); }
    finally { setBusy(null); }
  };

  const remove = async (token) => {
    if (!window.confirm("Delete this audit permanently?")) return;
    setBusy(token);
    try { await deleteAudit(token); await qc.invalidateQueries({ queryKey: ["audits"] }); }
    catch (e) { alert(apiErrorMessage(e)); }
    finally { setBusy(null); }
  };

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Audit history"
        description="Every audit you have run, newest first. Open one to load it across all pages."
        action={<Button size="sm" onClick={() => navigate("/")}><Plus size={15} /> New audit</Button>}
      />

      {isLoading ? (
        <Card className="!p-4"><div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div></Card>
      ) : isError ? (
        <EmptyState icon={AlertCircle} title="Couldn't load history" body={apiErrorMessage(error)} action={<Button size="sm" onClick={() => refetch()}>Retry</Button>} />
      ) : audits.length === 0 ? (
        <EmptyState icon={HistoryIcon} title="No audits yet"
          body="Run your first audit and it will be saved here. You'll be able to reopen it, re-run it, and compare it over time."
          action={<Button onClick={() => navigate("/")}><Plus size={15} /> Run an audit</Button>} />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-line bg-ink-800/70 px-3">
              <Search size={15} className="text-content-dim" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by site…"
                className="h-9 w-full min-w-0 bg-transparent text-sm text-content placeholder:text-content-dim focus:outline-none" />
            </div>
            <select value={sort} onChange={(e) => setSort(e.target.value)}
              className="h-9 rounded-lg border border-line bg-ink-800/70 px-2.5 text-xs text-content focus:outline-none">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="score">Best accessibility</option>
            </select>
            <Button size="sm" variant="secondary" onClick={() => refetch()}><RefreshCw size={14} /> Refresh</Button>
          </div>

          <Card className="!p-0">
            <div className="hidden grid-cols-12 gap-3 border-b border-line px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-content-dim sm:grid">
              <div className="col-span-4">Website</div>
              <div className="col-span-1 text-center">A11y</div>
              <div className="col-span-1 text-center">WCAG</div>
              <div className="col-span-1 text-center">Issues</div>
              <div className="col-span-2 text-right">Date</div>
              <div className="col-span-3 text-right">Actions</div>
            </div>

            <div className="divide-y divide-line">
              {rows.map((a, i) => {
                const date = a.created_at ? new Date(a.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
                const active = a.token === current?.token;
                const isBusy = busy === a.token || busy === "rerun:" + a.url;
                return (
                  <motion.div key={a.token} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.25) }}
                    className={cn("grid grid-cols-2 items-center gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.02] sm:grid-cols-12", active && "bg-iris/[0.06]")}>
                    <div className="col-span-2 flex min-w-0 items-center gap-2 sm:col-span-4">
                      {a.screenshot ? <img src={a.screenshot} alt="" className="hidden h-9 w-9 shrink-0 rounded-md border border-line object-cover object-top sm:block" /> : null}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-sm text-content">{a.domain}</span>
                          {active && <span className="rounded-full bg-iris/15 px-1.5 py-0.5 text-[10px] font-medium text-iris-bright">current</span>}
                        </div>
                        <div className="truncate text-[11px] text-content-muted">{a.title}</div>
                      </div>
                    </div>
                    <div className="hidden text-center sm:col-span-1 sm:block"><Score value={a.accessibility_score} /></div>
                    <div className="hidden text-center sm:col-span-1 sm:block"><Score value={a.wcag_compliance} suffix="%" /></div>
                    <div className="hidden text-center font-mono text-xs text-content-muted sm:col-span-1 sm:block">{a.issues ?? "—"}</div>
                    <div className="col-span-1 text-right text-xs text-content-muted sm:col-span-2">{date}</div>
                    <div className="col-span-1 flex items-center justify-end gap-1.5 sm:col-span-3">
                      {isBusy ? <Loader2 size={15} className="animate-spin text-content-muted" /> : (
                        <>
                          <button onClick={() => open(a.token)} title="Open" className="grid h-8 w-8 place-items-center rounded-md border border-line text-content-muted hover:text-content"><ExternalLink size={14} /></button>
                          <button onClick={() => rerun(a.url)} title="Re-run" className="grid h-8 w-8 place-items-center rounded-md border border-line text-content-muted hover:text-content"><RefreshCw size={14} /></button>
                          <button onClick={() => remove(a.token)} title="Delete" className="grid h-8 w-8 place-items-center rounded-md border border-line text-content-muted hover:border-critical/40 hover:text-critical"><Trash2 size={14} /></button>
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Card>

          <div className="mt-4 flex items-center gap-2 text-xs text-content-dim">
            <HistoryIcon size={13} />
            Scores shown are the real accessibility score and WCAG conformance from each audit. The combined "overall" score is still sample until the scoring engine ships.
          </div>
        </>
      )}
    </>
  );
}
