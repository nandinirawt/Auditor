import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip,
} from "recharts";
import {
  Globe, Clock, Layers, FileStack, ChevronLeft, ChevronRight, Info, Radio,
  RotateCw, FileDown, GitCompare, Share2, AlertTriangle, ArrowUpRight, ArrowDownRight,
  Sparkles, CheckCircle2, XCircle, Accessibility, ShieldCheck, GitBranch, Activity,
  Crown, Link2, MousePointerClick, FormInput, Image as ImageIcon, Boxes, Network,
  X, Monitor, Tablet, Smartphone, ChevronRight as ChevR, Volume2, Loader2, Pause,
} from "lucide-react";
import { Card, CardHeader } from "../../components/ui/Card";
import { getNarration } from "../../api/voice";
import { apiErrorMessage } from "../../api/client";
import { ScoreRing, AnimatedNumber } from "../../components/ui/ScoreRing";
import { SeverityPill, StatusDot } from "../../components/ui/Badge";
import { CardSkeleton } from "../../components/ui/Skeleton";
import { Button } from "../../components/ui/Button";
import { useAuditOverview, useFindings } from "../../hooks/useAudit";
import { useCurrentAudit } from "../../context/AuditContext";
import { useQuery } from "@tanstack/react-query";
import { getBenchmark } from "../../api/benchmark";
import { scoreBand, overallScore, severityMeta, cn } from "../../lib/utils";
import {
  scoreBreakdown, executiveSummary, statistics as statDefs, structureTree,
  auditTimeline, accessibilitySnapshot, wcagSnapshot, competitorSnapshot,
  auditMeta, history,
} from "../../lib/mockData";

const STAT_ICONS = {
  pages: FileStack, internal: Link2, external: ArrowUpRight, buttons: MousePointerClick,
  forms: FormInput, images: ImageIcon, dom: Boxes, network: Network,
  rules: ShieldCheck, screens: ImageIcon,
};
const DEVICE_ICONS = { desktop: Monitor, tablet: Tablet, mobile: Smartphone };

function SectionChip({ children }) {
  return <span className="rounded-full border border-line bg-ink-800 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-content-dim">{children}</span>;
}

function StatTile({ icon: Icon, label, value }) {
  return (
    <div className="panel flex items-center gap-3 p-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-ink-800 text-iris-bright">
        <Icon size={16} />
      </span>
      <div className="min-w-0">
        <div className="font-mono text-lg font-semibold leading-none text-content">
          <AnimatedNumber value={value} />
        </div>
        <div className="mt-1 truncate text-[11px] text-content-muted">{label}</div>
      </div>
    </div>
  );
}

function BreakdownBar({ label, score, weight, i, real }) {
  const b = scoreBand(score);
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-xs">
        <span className="text-content-muted">{label}{real === false && <span className="ml-1.5 text-[9px] uppercase tracking-wide text-content-dim">sample</span>}</span>
        <span className="flex items-baseline gap-2">
          <span className="font-mono text-[10px] text-content-dim">{weight}%</span>
          <span className="font-mono font-semibold" style={{ color: real === false ? "#66728A" : b.color }}>{score}</span>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div className="h-full rounded-full" style={{ background: real === false ? "#3A4255" : b.color, opacity: real === false ? 0.5 : 1 }}
          initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ delay: 0.15 + i * 0.05, ease: "easeOut" }} />
      </div>
    </div>
  );
}

function generateExecSummary(a11y) {
  const snap = a11y.snapshot || {};
  const counts = a11y.counts || {};
  const stats = a11y.stats || {};
  const wcag = a11y.wcag || {};
  const pl = (n) => (n === 1 ? "" : "s");
  const strengths = [];
  const weaknesses = [];

  if (a11y.score >= 90) strengths.push(`Strong accessibility — score ${a11y.score}/100.`);
  else if (a11y.score >= 75) strengths.push(`Solid accessibility baseline — score ${a11y.score}/100.`);
  if ((snap.altText || 0) === 0) strengths.push("All images have text alternatives.");
  if ((snap.contrast || 0) === 0) strengths.push("Text contrast meets WCAG AA.");
  if ((snap.keyboard || 0) === 0) strengths.push("Interactive elements appear keyboard reachable.");
  (wcag.principles || []).forEach((p) => {
    if (p.total && p.passed === p.total) strengths.push(`Full conformance on ${p.label} criteria.`);
  });
  if (stats.passes) strengths.push(`${stats.passes} automated accessibility checks passing.`);
  if (!strengths.length) strengths.push("Few accessibility strengths detected on this page.");

  if (counts.critical) weaknesses.push(`${counts.critical} critical issue${pl(counts.critical)} blocking some users.`);
  if (snap.contrast) weaknesses.push(`${snap.contrast} colour-contrast failure${pl(snap.contrast)}.`);
  if (snap.altText) weaknesses.push(`${snap.altText} image${pl(snap.altText)} missing alt text.`);
  if (snap.keyboard) weaknesses.push(`${snap.keyboard} keyboard or focus issue${pl(snap.keyboard)}.`);
  const covered = /contrast|alt|image|keyboard|focus/i;
  (a11y.findings || []).forEach((f) => {
    if (weaknesses.length >= 4) return;
    if (f.title && !covered.test(f.title) && !weaknesses.some((w) => w.includes(f.title))) {
      weaknesses.push(`${f.title}${f.nodeCount > 1 ? ` (${f.nodeCount}×)` : ""}.`);
    }
  });
  if (!weaknesses.length) weaknesses.push("No accessibility violations found on the homepage.");

  const top = (a11y.findings || []).find((f) => f.severity === "critical")
    || (a11y.findings || []).find((f) => f.severity === "serious")
    || (a11y.findings || [])[0];
  const critical = top
    ? `${top.title}${top.selector ? ` — ${top.selector.split("  (+")[0]}` : ""}`
    : "No critical issues — the homepage passes the automated checks.";

  return { strengths: strengths.slice(0, 4), weaknesses: weaknesses.slice(0, 4), critical };
}

function ListenButton({ token }) {
  const [state, setState] = useState("idle"); // idle | loading | playing | error
  const [msg, setMsg] = useState("");
  const audioRef = useRef(null);

  const handleClick = async () => {
    if (state === "playing") {
      audioRef.current?.pause();
      setState("idle");
      return;
    }
    setState("loading");
    setMsg("");
    try {
      const { audio_url } = await getNarration(token);
      const a = new Audio(audio_url);
      audioRef.current = a;
      a.onended = () => setState("idle");
      a.onerror = () => { setState("error"); setMsg("Couldn't play the audio file."); };
      await a.play();
      setState("playing");
    } catch (e) {
      const status = e?.response?.status;
      if (status === 503) setMsg("Add your smallest.ai API key to .env, then restart the backend.");
      else setMsg(apiErrorMessage(e) || "Couldn't generate audio.");
      setState("error");
    }
  };

  const Icon = state === "loading" ? Loader2 : state === "playing" ? Pause : Volume2;
  const label = state === "loading" ? "Preparing audio…" : state === "playing" ? "Stop" : "Listen to this audit";

  return (
    <div>
      <button onClick={handleClick} disabled={state === "loading" || !token}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-iris/40 bg-iris/10 px-3 py-2 text-sm font-medium text-iris-bright transition-colors hover:bg-iris/20 disabled:opacity-60">
        <Icon size={15} className={state === "loading" ? "animate-spin" : ""} />
        {label}
      </button>
      {state === "error" && msg && <p className="mt-1.5 text-[11px] text-content-dim">{msg}</p>}
      {state === "playing" && <p className="mt-1.5 text-[11px] text-pass">Playing — voice by smallest.ai</p>}
    </div>
  );
}

function SnapshotStat({ label, value, tone }) {
  const color = tone === "bad" ? "#FB7185" : tone === "warn" ? "#FBBF24" : tone === "good" ? "#34D399" : "#E8ECF4";
  return (
    <div className="rounded-lg border border-line bg-ink-800/50 p-2.5 text-center">
      <div className="font-mono text-lg font-semibold" style={{ color }}>{value}</div>
      <div className="mt-0.5 text-[10px] text-content-muted">{label}</div>
    </div>
  );
}

function TreeNode({ node, depth = 0, last = false }) {
  return (
    <div>
      <div className="flex items-center gap-2 py-1" style={{ paddingLeft: depth * 16 }}>
        {depth > 0 && <span className="font-mono text-content-dim">{last ? "└─" : "├─"}</span>}
        <span className={cn("rounded-md px-2 py-0.5 text-xs", depth === 0 ? "bg-iris/15 text-iris-bright" : "bg-ink-800 text-content-muted")}>
          {node.name}
        </span>
      </div>
      {node.children?.map((c, i) => (
        <TreeNode key={c.name} node={c} depth={depth + 1} last={i === node.children.length - 1} />
      ))}
    </div>
  );
}

function ShotTile({ device, src, domain, onOpen }) {
  const Icon = DEVICE_ICONS[device];
  const ratio = device === "desktop" ? "aspect-[16/10]" : device === "tablet" ? "aspect-[3/4]" : "aspect-[9/19]";
  return (
    <div className="flex flex-col items-center">
      <button
        onClick={() => src && onOpen()}
        disabled={!src}
        className={cn("group w-full overflow-hidden rounded-lg border border-line-strong bg-ink-800 text-left shadow-card", src && "cursor-zoom-in")}
      >
        <div className="flex items-center gap-1.5 border-b border-line bg-ink-700/80 px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-critical/70" />
          <span className="h-2 w-2 rounded-full bg-moderate/70" />
          <span className="h-2 w-2 rounded-full bg-pass/70" />
          <span className="ml-1.5 truncate font-mono text-[10px] text-content-dim">{domain || "lumio.store"}</span>
        </div>
        <div className={cn(ratio, "bg-ink")}>
          {src ? (
            <img src={src} alt={`${device} screenshot`} loading="lazy" className="h-full w-full object-cover object-top transition-transform group-hover:scale-[1.02]" />
          ) : (
            <div className="grid h-full place-items-center text-content-dim"><Icon size={26} /></div>
          )}
        </div>
      </button>
      <div className="mt-2 flex items-center gap-1.5 text-content-muted">
        <Icon size={13} /><span className="text-[11px] font-medium capitalize">{device}</span>
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-surface/95 px-3 py-2 shadow-card backdrop-blur">
      <div className="mb-1 text-[11px] text-content-dim">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-xs text-content">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="capitalize">{p.dataKey}</span>
          <span className="ml-auto font-mono font-semibold">{p.value ?? "—"}</span>
        </div>
      ))}
    </div>
  );
}

export default function Overview() {
  const { data, isLoading } = useAuditOverview();
  const { data: findings } = useFindings();
  const { current } = useCurrentAudit();
  const [lightbox, setLightbox] = useState(null);
  const [histRange, setHistRange] = useState(5);

  // Real competitor benchmark (only if the user has added competitors).
  // Must run before any early return — hooks must be called on every render.
  const { data: bench } = useQuery({
    queryKey: ["benchmark", current?.token],
    queryFn: () => getBenchmark(current.token),
    enabled: !!current?.token,
  });

  const shotMap = {};
  (current?.screenshots || []).forEach((s) => { shotMap[s.device] = s.url; });
  const isLive = !!current?.screenshots?.length;
  const domain = current?.domain || (data?.audit?.domain) || "lumio.store";
  const title = current?.title || (data?.audit?.title) || "Lumio — Modern Lighting Store";

  if (isLoading || !data) {
    return (
      <div className="grid gap-5 lg:grid-cols-3">
        <CardSkeleton lines={4} /><CardSkeleton lines={4} /><CardSkeleton lines={4} />
      </div>
    );
  }

  const { audit } = data;

  // Real accessibility/WCAG from the live audit (homepage axe-core scan).
  const a11y = current?.accessibility || null;
  const a11yLive = !!a11y;

  // Real overall score: full weighted blend of every measured component
  // (accessibility, performance, SEO, UX, WCAG). Falls back to acc+WCAG only.
  const realOverall = current?.overall
    ?? (a11yLive ? (a11y.overall ?? overallScore(a11y.score, a11y.wcag?.compliance)) : null);
  const shownOverall = realOverall != null ? realOverall : audit.scores.overall;
  const band = scoreBand(shownOverall);
  const prevDiff = shownOverall - auditMeta.prevOverall;

  const realCritical = a11y?.findings?.filter((f) => f.severity === "critical" || f.severity === "serious").slice(0, 5);
  const topFindings = realCritical && realCritical.length
    ? realCritical
    : (findings || []).filter((f) => f.severity === "critical" || f.severity === "serious").slice(0, 5);

  // Competitor percentile: % of added competitors this site beats on accessibility.
  let competitorScore = null;
  if (bench?.competitors?.length && bench.base?.accessibility != null) {
    const valid = bench.competitors.filter((c) => c.accessibility != null);
    if (valid.length) {
      const beat = valid.filter((c) => bench.base.accessibility >= c.accessibility).length;
      competitorScore = Math.round((100 * beat) / valid.length);
    }
  }

  // Real component scores measured during this audit.
  const perfScore = current?.performance?.score;
  const seoScore = current?.seo?.score;
  const uxScore = current?.ux?.score;

  // Weighted breakdown: every component is real when measured.
  const breakdown = scoreBreakdown.map((s) => {
    if (a11yLive && s.key === "accessibility") return { ...s, score: a11y.score, real: true };
    if (a11yLive && s.key === "wcag") return { ...s, score: a11y.wcag.compliance, real: true };
    if (s.key === "performance" && perfScore != null) return { ...s, score: perfScore, real: true };
    if (s.key === "seo" && seoScore != null) return { ...s, score: seoScore, real: true };
    if (s.key === "ux" && uxScore != null) return { ...s, score: uxScore, real: true };
    if (s.key === "competitor" && competitorScore != null) return { ...s, score: competitorScore, real: true };
    return { ...s, real: false };
  });
  const accSnap = a11y?.snapshot;
  const wcagSnap = a11y?.wcag;
  const crawledPages = current?.pages || [];
  const execSummary = a11yLive ? generateExecSummary(a11y) : executiveSummary;

  const finishedDate = new Date(audit.finishedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const struct = current?.structure;
  const stats = statDefs.map((s) => {
    if (s.key === "pages" && isLive) return { ...s, value: 1 + crawledPages.length };
    if (s.key === "screens" && isLive) return { ...s, value: (current.screenshots?.length || 0) + crawledPages.length };
    if (s.key === "rules" && a11yLive) return { ...s, value: a11y.stats.rulesRun };
    if (struct) {
      if (s.key === "internal") return { ...s, value: struct.internalLinks };
      if (s.key === "external") return { ...s, value: struct.externalLinks };
      if (s.key === "buttons") return { ...s, value: struct.buttons };
      if (s.key === "forms") return { ...s, value: struct.forms };
      if (s.key === "images") return { ...s, value: struct.images };
      if (s.key === "dom") return { ...s, value: struct.domElements };
    }
    if (s.key === "network" && current?.performance?.requests != null) return { ...s, value: current.performance.requests };
    return s;
  });
  const statsLive = isLive && !!struct;
  const histData = [...history].reverse()
    .filter((h) => h.overall != null)
    .slice(-histRange)
    .map((h) => ({ date: new Date(h.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }), overall: h.overall, accessibility: h.accessibility, performance: h.performance }));

  return (
    <>
      {/* ---- Website / audit header ---- */}
      <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-line bg-surface/60 p-4 backdrop-blur-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-line bg-ink-800 text-iris-bright">
            <Globe size={22} />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate font-display text-xl font-semibold tracking-tight text-content">{domain}</h1>
              {isLive && (
                <span className="inline-flex items-center gap-1 rounded-full border border-pass/30 bg-pass/10 px-2 py-0.5 text-[10px] font-medium text-pass">
                  <Radio size={10} /> Live
                </span>
              )}
            </div>
            <p className="truncate text-xs text-content-muted">{title}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className="chip">{audit.category}</span>
              <span className="chip"><Clock size={11} /> {finishedDate}</span>
              <span className="chip">{auditMeta.durationLabel} run</span>
              <span className="chip"><Layers size={11} /> {auditMeta.pagesCrawled} pages</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-stretch gap-2 lg:items-end">
          <div className="flex items-center gap-1.5 self-end">
            <button disabled className="grid h-8 w-8 place-items-center rounded-lg border border-line text-content-dim opacity-40" title="Previous audits appear here once saved">
              <ChevronLeft size={15} />
            </button>
            <span className="rounded-lg border border-line bg-ink-800 px-3 py-1.5 text-xs font-medium text-content">
              Audit #{auditMeta.auditNumber}
            </span>
            <button disabled className="grid h-8 w-8 place-items-center rounded-lg border border-line text-content-dim opacity-40" title="No newer audit">
              <ChevronRight size={15} />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Link to="/"><Button size="sm"><RotateCw size={14} /> Re-run</Button></Link>
            <Button size="sm" variant="secondary" disabled title="Coming soon"><FileDown size={14} /> PDF</Button>
            <Button size="sm" variant="secondary" disabled title="Coming soon"><GitCompare size={14} /> Compare</Button>
            <Button size="sm" variant="ghost" disabled title="Coming soon"><Share2 size={14} /> Share</Button>
          </div>
        </div>
      </div>

      {isLive && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-iris/30 bg-iris/[0.07] px-4 py-3">
          <Info size={16} className="mt-0.5 shrink-0 text-iris-bright" />
          <p className="text-sm text-content-muted">
            <span className="font-medium text-content">Live</span> for {domain}: screenshots, <span className="font-medium text-content">accessibility, WCAG, performance, SEO and UX</span> are all measured on the page, and the overall score is a weighted blend of them.
            Performance reflects this machine's network in a single run, so it's real but rougher than a lab tool like Lighthouse. Competitor turns real once you add competitors.
          </p>
        </div>
      )}

      {/* ---- Score · Breakdown · Executive summary ---- */}
      <div className="grid gap-5 lg:grid-cols-12">
        <Card className="flex flex-col items-center justify-center text-center lg:col-span-4">
          <div className="mb-2 flex items-center gap-2 text-xs text-content-muted">
            <StatusDot status={audit.status} />
            {realOverall != null && <span className="inline-flex items-center gap-1 rounded-full border border-pass/30 bg-pass/10 px-2 py-0.5 text-[10px] font-medium text-pass">Live score</span>}
          </div>
          <ScoreRing score={shownOverall} size={150} stroke={11} />
          <div className="mt-3 flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-md font-display text-sm font-bold" style={{ color: band.color, background: `${band.color}1f` }}>
              {band.grade || auditMeta.grade}
            </span>
            <span className="font-display text-sm font-semibold" style={{ color: band.color }}>{band.label}</span>
          </div>
          {realOverall != null && (
            <p className="mt-2 text-[11px] text-content-dim">{current?.overall != null ? "Accessibility · Performance · SEO · UX · WCAG" : "Accessibility + WCAG · measured"}</p>
          )}
          <div className="mt-4 grid w-full grid-cols-3 gap-2">
            <div className="panel p-2">
              <div className="text-[10px] text-content-muted">Industry</div>
              <div className="font-mono text-sm font-semibold text-content">{auditMeta.industryAverage}</div>
            </div>
            <div className="panel p-2">
              <div className="text-[10px] text-content-muted">vs Prev</div>
              <div className={cn("flex items-center justify-center gap-0.5 font-mono text-sm font-semibold", prevDiff >= 0 ? "text-pass" : "text-critical")}>
                {prevDiff >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{Math.abs(prevDiff)}
              </div>
            </div>
            <div className="panel p-2">
              <div className="text-[10px] text-content-muted">Confidence</div>
              <div className="font-mono text-sm font-semibold text-content">{auditMeta.confidence}%</div>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader title="Weighted breakdown" subtitle="How the overall score is composed" />
          <div className="space-y-3">
            {breakdown.map((s, i) => <BreakdownBar key={s.key} {...s} i={i} />)}
          </div>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader title="Executive summary" subtitle={a11yLive ? "Generated from this audit" : "AI overview · sample"} icon={Sparkles}
            action={a11yLive ? <span className="inline-flex items-center gap-1.5 rounded-full border border-pass/30 bg-pass/10 px-2 py-0.5 text-[11px] font-medium text-pass"><Radio size={11} /> Live</span> : null} />
          <div className="space-y-3 text-sm">
            <div>
              <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-pass"><CheckCircle2 size={13} /> Strengths</div>
              <ul className="space-y-1 text-content-muted">
                {execSummary.strengths.map((s) => <li key={s} className="text-[13px] leading-snug">• {s}</li>)}
              </ul>
            </div>
            <div>
              <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-critical"><XCircle size={13} /> Weaknesses</div>
              <ul className="space-y-1 text-content-muted">
                {execSummary.weaknesses.map((s) => <li key={s} className="text-[13px] leading-snug">• {s}</li>)}
              </ul>
            </div>
            <div className="rounded-lg border border-critical/25 bg-critical/[0.07] p-2.5">
              <div className="text-[11px] font-semibold text-critical">Most critical</div>
              <p className="mt-0.5 text-[13px] leading-snug text-content-muted">{execSummary.critical}</p>
            </div>
            {isLive && current?.token && (
              <div className="border-t border-line pt-3">
                <ListenButton token={current.token} />
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ---- Statistics strip ---- */}
      <Card className="mt-5">
        <CardHeader title="Audit statistics" subtitle={statsLive ? "What this audit measured" : "What the crawl examined"} action={<SectionChip>{statsLive ? "live" : "sample"}</SectionChip>} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {stats.map((s) => <StatTile key={s.key} icon={STAT_ICONS[s.key] || Boxes} label={s.label} value={s.value} />)}
        </div>
      </Card>

      {/* ---- Grouped screenshots + gallery ---- */}
      <Card className="mt-5">
        <CardHeader
          title="Device screenshots — Homepage"
          subtitle={isLive ? "Live full-page renders · click to enlarge" : "Sample placeholder — run an audit to capture"}
          icon={ImageIcon}
          action={isLive ? <span className="inline-flex items-center gap-1.5 rounded-full border border-pass/30 bg-pass/10 px-2.5 py-1 text-xs font-medium text-pass"><Radio size={12} /> Live</span> : null}
        />
        <div className="grid gap-5 sm:grid-cols-3">
          {["desktop", "tablet", "mobile"].map((d) => (
            <ShotTile key={d} device={d} src={shotMap[d]} domain={domain} onOpen={() => setLightbox({ src: shotMap[d], device: d })} />
          ))}
        </div>

        {crawledPages.length > 0 ? (
          <div className="mt-6 border-t border-line pt-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="font-display text-sm font-semibold text-content">Other pages crawled</div>
                <div className="text-xs text-content-muted">Public pages found and scanned · click to enlarge</div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-pass/30 bg-pass/10 px-2.5 py-1 text-xs font-medium text-pass"><Radio size={12} /> Live</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {crawledPages.map((pg) => {
                const b = scoreBand(pg.accessibility_score);
                return (
                  <button key={pg.url} onClick={() => setLightbox({ src: pg.screenshot, device: pg.path })}
                    className="group overflow-hidden rounded-xl border border-line bg-ink-800 text-left transition-colors hover:border-line-strong">
                    <div className="aspect-[16/10] w-full overflow-hidden border-b border-line bg-ink">
                      <img src={pg.screenshot} alt={pg.title || pg.path} className="h-full w-full object-cover object-top transition-transform group-hover:scale-[1.02]" />
                    </div>
                    <div className="flex items-center justify-between gap-2 p-2.5">
                      <span className="min-w-0 truncate font-mono text-[11px] text-content-muted" title={pg.path}>{pg.path}</span>
                      {pg.accessibility_score != null && (
                        <span className="shrink-0 font-mono text-xs font-semibold" style={{ color: b.color }}>{pg.accessibility_score}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-content-dim">
              The crawler captures public pages a site links to. Login and cart pages that require signing in or items in a basket can't be reached by an automated crawler, so they may not appear.
            </p>
          </div>
        ) : (
          <p className="mt-4 text-xs text-content-dim">
            {isLive ? "No additional public pages were found to crawl from the homepage." : "More pages (product, about, pricing…) are captured live once you run an audit."}
          </p>
        )}
      </Card>

      {/* ---- Critical issues ---- */}
      <Card className="mt-5 !p-0">
        <div className="flex items-center justify-between p-5 pb-3">
          <CardHeader title="Critical issues" subtitle={a11yLive ? "Top accessibility issues · live" : "Top 5 by priority · sample"} icon={AlertTriangle}
            action={a11yLive
              ? <span className="inline-flex items-center gap-1.5 rounded-full border border-pass/30 bg-pass/10 px-2 py-0.5 text-[11px] font-medium text-pass"><Radio size={11} /> Live</span>
              : <SectionChip>sample</SectionChip>} />
        </div>
        <div className="divide-y divide-line">
          {topFindings.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-content-muted">No critical or serious issues found on the homepage. 🎉</div>
          ) : topFindings.map((f) => (
            <div key={f.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <SeverityPill severity={f.severity} />
              <span className="min-w-0 flex-1 truncate text-sm text-content">{f.title}</span>
              <span className="chip">{f.page}</span>
              <Link to="/dashboard/accessibility" className="inline-flex items-center gap-1 text-xs font-medium text-iris-bright hover:underline">
                Details <ChevR size={13} />
              </Link>
            </div>
          ))}
        </div>
      </Card>

      {/* ---- Accessibility + WCAG snapshots ---- */}
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Accessibility snapshot" subtitle={a11yLive ? "axe-core · homepage · live" : "axe-core overview · sample"} icon={Accessibility}
            action={a11yLive
              ? <span className="inline-flex items-center gap-1.5 rounded-full border border-pass/30 bg-pass/10 px-2 py-0.5 text-[11px] font-medium text-pass"><Radio size={11} /> Live</span>
              : <Link to="/dashboard/accessibility" className="text-xs font-medium text-iris-bright hover:underline">Open</Link>} />
          {(() => { const a = accSnap || accessibilitySnapshot; return (
            <>
              <div className="mb-3 flex items-center gap-4">
                <ScoreRing score={a.score} size={84} stroke={7} />
                <p className="text-sm text-content-muted">{a.topRecommendation}</p>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <SnapshotStat label="Critical" value={a.critical} tone="bad" />
                <SnapshotStat label="Contrast" value={a.contrast} tone="warn" />
                <SnapshotStat label="Alt text" value={a.altText} tone="warn" />
                <SnapshotStat label="Keyboard" value={a.keyboard} tone="bad" />
              </div>
              <div className="mt-3 text-right">
                <Link to="/dashboard/accessibility" className="text-xs font-medium text-iris-bright hover:underline">View all issues →</Link>
              </div>
            </>
          ); })()}
        </Card>

        <Card>
          <CardHeader title="WCAG snapshot" subtitle={a11yLive ? "from axe-core · live" : "2.2 AA mapping · sample"} icon={ShieldCheck}
            action={a11yLive
              ? <span className="inline-flex items-center gap-1.5 rounded-full border border-pass/30 bg-pass/10 px-2 py-0.5 text-[11px] font-medium text-pass"><Radio size={11} /> Live</span>
              : <Link to="/dashboard/wcag" className="text-xs font-medium text-iris-bright hover:underline">Open</Link>} />
          {(() => { const w = wcagSnap || wcagSnapshot; return (
            <>
              <div className="mb-3 flex items-center gap-4">
                <ScoreRing score={w.compliance} size={84} stroke={7} label="conf." />
                <p className="text-sm text-content-muted">Most violated principle: <span className="font-medium text-content">{w.mostViolated}</span></p>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <SnapshotStat label="Passed" value={w.passed} tone="good" />
                <SnapshotStat label="Failed" value={w.failed} tone="bad" />
                <SnapshotStat label="Warnings" value={w.warnings} tone="warn" />
                <SnapshotStat label="Critical" value={w.criticalViolations} tone="bad" />
              </div>
              <div className="mt-3 text-right">
                <Link to="/dashboard/wcag" className="text-xs font-medium text-iris-bright hover:underline">Open WCAG report →</Link>
              </div>
            </>
          ); })()}
        </Card>
      </div>

      {/* ---- Journey health + Website structure ---- */}
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Journey health" subtitle="Where users hit friction · sample" icon={GitBranch} />
          <div className="space-y-2">
            {[
              { step: "Homepage", risk: "ok" }, { step: "Category", risk: "ok" },
              { step: "Product", risk: "warn" }, { step: "Cart", risk: "ok" },
              { step: "Checkout", risk: "bad" }, { step: "Confirmation", risk: "ok" },
            ].map((s, i, arr) => {
              const c = s.risk === "bad" ? "#FB7185" : s.risk === "warn" ? "#FBBF24" : "#34D399";
              return (
                <div key={s.step}>
                  <div className="flex items-center gap-3 rounded-lg border border-line bg-ink-800/40 px-3 py-2">
                    <span className="grid h-6 w-6 place-items-center rounded-full font-mono text-[11px] font-semibold" style={{ color: c, background: `${c}1f` }}>{i + 1}</span>
                    <span className="flex-1 text-sm text-content">{s.step}</span>
                    <span className="text-[11px] font-medium capitalize" style={{ color: c }}>
                      {s.risk === "ok" ? "Healthy" : s.risk === "warn" ? "Minor friction" : "High friction"}
                    </span>
                  </div>
                  {i < arr.length - 1 && <div className="ml-6 h-2 w-px bg-line" />}
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHeader title="Website structure" subtitle="Discovered hierarchy · sample" icon={GitBranch} />
          <div className="rounded-lg border border-line bg-ink-800/40 p-3 font-mono">
            <TreeNode node={structureTree} />
          </div>
        </Card>
      </div>

      {/* ---- Timeline + Score history ---- */}
      <div className="mt-5 grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader title="Audit timeline" subtitle="Recorded actions · sample" icon={Activity} />
          <ol className="relative space-y-3 pl-5">
            <span className="absolute left-1.5 top-1.5 h-[calc(100%-12px)] w-px bg-line" />
            {auditTimeline.map((t, i) => (
              <li key={t.key} className="relative">
                <span className={cn("absolute -left-[15px] top-1 h-2.5 w-2.5 rounded-full border-2 border-ink", i === auditTimeline.length - 1 ? "bg-pass" : "bg-iris-bright")} />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-content">{t.label}</span>
                  <span className="font-mono text-[11px] text-content-dim">{t.time}</span>
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader title="Score history" subtitle="Across past audits · sample"
            action={
              <div className="flex items-center gap-1 rounded-lg border border-line bg-ink-800/70 p-1">
                {[5, 10, 99].map((n) => (
                  <button key={n} onClick={() => setHistRange(n)} className={cn("rounded-md px-2 py-1 text-[11px] font-medium transition-colors", histRange === n ? "bg-white/[0.08] text-content" : "text-content-muted hover:text-content")}>
                    {n === 99 ? "All" : `Last ${n}`}
                  </button>
                ))}
              </div>
            } />
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={histData} margin={{ top: 5, right: 5, bottom: 0, left: -22 }}>
                <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "#66728A", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "#66728A", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="overall" stroke="#818CF8" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="accessibility" stroke="#C084FC" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="performance" stroke="#34D399" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* ---- Competitor snapshot ---- */}
      <Card className="mt-5">
        <CardHeader title="Competitor snapshot" subtitle="Category benchmark · sample" icon={Crown}
          action={<Link to="/dashboard/competitor" className="text-xs font-medium text-iris-bright hover:underline">Open</Link>} />
        <div className="grid gap-4 lg:grid-cols-4">
          <div className="panel p-3 text-center">
            <div className="text-[11px] text-content-muted">Industry avg</div>
            <div className="font-mono text-2xl font-semibold text-content">{competitorSnapshot.industryAverage}</div>
          </div>
          <div className="panel p-3 text-center" style={{ borderColor: "rgba(99,102,241,0.4)" }}>
            <div className="text-[11px] text-content-muted">Your site</div>
            <div className="font-mono text-2xl font-semibold text-iris-bright">{competitorSnapshot.you}</div>
          </div>
          <div className="panel p-3 text-center">
            <div className="text-[11px] text-content-muted">Top competitor</div>
            <div className="font-mono text-2xl font-semibold text-content">{competitorSnapshot.topCompetitor.score}</div>
            <div className="text-[10px] text-content-dim">{competitorSnapshot.topCompetitor.name}</div>
          </div>
          <div className="panel p-3 text-center">
            <div className="text-[11px] text-content-muted">Ranking</div>
            <div className="font-mono text-2xl font-semibold text-content">#{competitorSnapshot.ranking}<span className="text-sm text-content-dim">/{competitorSnapshot.totalRanked}</span></div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {competitorSnapshot.improvements.map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-ink-800/50 px-2.5 py-1 text-xs text-content-muted">
              <ArrowUpRight size={12} className="text-pass" /> {t}
            </span>
          ))}
        </div>
      </Card>

      {/* ---- Lightbox gallery ---- */}
      <AnimatePresence>
        {lightbox?.src && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
            className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-6 backdrop-blur-sm"
          >
            <button className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-lg border border-line bg-ink-800 text-content hover:bg-surface" aria-label="Close">
              <X size={18} />
            </button>
            <motion.div
              initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[85vh] w-auto max-w-3xl overflow-hidden rounded-xl border border-line-strong bg-ink-800 shadow-card"
            >
              <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
                <span className="text-xs font-medium capitalize text-content">{lightbox.device} · {domain}</span>
                <a href={lightbox.src} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 text-xs text-iris-bright hover:underline">
                  Open original <ArrowUpRight size={12} />
                </a>
              </div>
              <div className="max-h-[78vh] overflow-y-auto">
                <img src={lightbox.src} alt={`${lightbox.device} screenshot of ${domain}`} className="w-full" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
