import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip,
} from "recharts";
import { Clock, ArrowUpRight, AlertTriangle, Radio, Info } from "lucide-react";
import { PageHeader, DeviceFrame } from "../../components/dashboard/PageHeader";
import { FindingsTable } from "../../components/dashboard/FindingsTable";
import { Card, CardHeader } from "../../components/ui/Card";
import { ScoreRing } from "../../components/ui/ScoreRing";
import { StatusDot } from "../../components/ui/Badge";
import { CardSkeleton } from "../../components/ui/Skeleton";
import { Button } from "../../components/ui/Button";
import { useAuditOverview, useFindings } from "../../hooks/useAudit";
import { useCurrentAudit } from "../../context/AuditContext";
import { scoreBand, severityMeta } from "../../lib/utils";
import { Link } from "react-router-dom";

const subScores = [
  { key: "accessibility", label: "Accessibility" },
  { key: "performance", label: "Performance" },
  { key: "seo", label: "SEO" },
  { key: "bestPractices", label: "Best Practices" },
  { key: "wcag", label: "WCAG" },
];

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-surface/95 px-3 py-2 shadow-card backdrop-blur">
      <div className="mb-1 text-[11px] text-content-dim">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-xs text-content">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="capitalize">{p.dataKey}</span>
          <span className="ml-auto font-mono font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function Overview() {
  const { data, isLoading } = useAuditOverview();
  const { data: findings } = useFindings();
  const { current } = useCurrentAudit();

  const shotMap = {};
  (current?.screenshots || []).forEach((s) => {
    shotMap[s.device] = s.url;
  });
  const isLive = !!current?.screenshots?.length;
  const liveDomain = current?.domain;

  if (isLoading || !data) {
    return (
      <>
        <PageHeader eyebrow="Audit" title="Overview" description="Loading the latest audit…" />
        <div className="grid gap-5 lg:grid-cols-3">
          <CardSkeleton lines={4} />
          <CardSkeleton lines={4} />
          <CardSkeleton lines={4} />
        </div>
      </>
    );
  }

  const { audit } = data;
  const band = scoreBand(audit.scores.overall);
  const topFindings = (findings || []).filter((f) => f.severity === "critical" || f.severity === "serious").slice(0, 5);
  const finishedDate = new Date(audit.finishedAt).toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric",
  });

  return (
    <>
      <PageHeader
        eyebrow="Audit"
        title="Overview"
        description={isLive ? `${current.title || liveDomain} · live capture` : `${audit.title} · ${audit.category}`}
        action={
          <Link to="/">
            <Button variant="secondary" size="sm">
              Re-run audit <ArrowUpRight size={15} />
            </Button>
          </Link>
        }
      />

      {isLive && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-iris/30 bg-iris/[0.07] px-4 py-3">
          <Info size={16} className="mt-0.5 shrink-0 text-iris-bright" />
          <p className="text-sm text-content-muted">
            Showing live screenshots of <span className="font-medium text-content">{liveDomain}</span>. The scores and
            findings below are sample data — accessibility, WCAG, and performance analysis arrive in the next engine phase.
          </p>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="flex flex-col items-center justify-center text-center">
          <div className="mb-3 flex items-center gap-2 text-xs text-content-muted">
            <StatusDot status={audit.status} />
            <span className="text-content-dim">·</span>
            <Clock size={12} /> {finishedDate}
          </div>
          <ScoreRing score={audit.scores.overall} size={148} stroke={11} />
          <div className="mt-3 font-display text-sm font-semibold" style={{ color: band.color }}>
            {band.label}
          </div>
          <p className="mt-1 text-xs text-content-muted">Overall experience score</p>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Category scores" subtitle="Across the audited journey" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {subScores.map((s, i) => {
              const v = audit.scores[s.key];
              const b = scoreBand(v);
              return (
                <motion.div
                  key={s.key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="panel p-3.5"
                >
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-content-muted">{s.label}</span>
                    <span className="font-mono text-lg font-semibold" style={{ color: b.color }}>{v}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: b.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${v}%` }}
                      transition={{ delay: 0.2 + i * 0.05, ease: "easeOut" }}
                    />
                  </div>
                </motion.div>
              );
            })}
            <div className="panel flex flex-col justify-between p-3.5">
              <span className="text-xs text-content-muted">Open issues</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {Object.entries(audit.counts).map(([sev, n]) => (
                  <span
                    key={sev}
                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold"
                    style={{ color: severityMeta[sev].color, background: `${severityMeta[sev].color}1a` }}
                  >
                    {n} {sev[0].toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader
          title="Captured across devices"
          subtitle={isLive ? "Live full-page renders of your site — click to open" : "Full-page renders at desktop, tablet, and mobile widths"}
          action={
            isLive ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-pass/30 bg-pass/10 px-2.5 py-1 text-xs font-medium text-pass">
                <Radio size={12} /> Live
              </span>
            ) : null
          }
        />
        <div className="grid gap-5 sm:grid-cols-3">
          <DeviceFrame device="desktop" tone="a" src={shotMap.desktop} domain={liveDomain} />
          <DeviceFrame device="tablet" tone="b" src={shotMap.tablet} domain={liveDomain} />
          <DeviceFrame device="mobile" tone="c" src={shotMap.mobile} domain={liveDomain} />
        </div>
      </Card>

      <div className="mt-5 grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader title="Score trend" subtitle="Last 3 audits" />
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={audit.trend} margin={{ top: 5, right: 5, bottom: 0, left: -22 }}>
                <defs>
                  <linearGradient id="ov" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ac" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#A855F7" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#A855F7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "#66728A", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "#66728A", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="overall" stroke="#818CF8" strokeWidth={2} fill="url(#ov)" />
                <Area type="monotone" dataKey="accessibility" stroke="#C084FC" strokeWidth={2} fill="url(#ac)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-3 !p-0">
          <div className="flex items-center justify-between p-5 pb-3">
            <CardHeader title="Top priority issues" subtitle="Critical and serious findings first" icon={AlertTriangle} />
            <Link to="/dashboard/accessibility" className="text-xs font-medium text-iris-bright hover:underline">
              View all
            </Link>
          </div>
          <FindingsTable findings={topFindings} />
        </Card>
      </div>
    </>
  );
}
