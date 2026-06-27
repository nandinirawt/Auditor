import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend,
} from "recharts";
import { Crown, Minus } from "lucide-react";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { Card, CardHeader } from "../../components/ui/Card";
import { competitors } from "../../lib/mockData";
import { scoreBand } from "../../lib/utils";

const metrics = [
  { key: "overall", label: "Overall", color: "#818CF8" },
  { key: "accessibility", label: "Accessibility", color: "#C084FC" },
  { key: "performance", label: "Performance", color: "#34D399" },
  { key: "seo", label: "SEO", color: "#FBBF24" },
];

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-surface/95 px-3 py-2 shadow-card backdrop-blur">
      <div className="mb-1 text-[11px] text-content-dim">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-xs text-content">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span>{p.name}</span>
          <span className="ml-auto font-mono font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function Competitor() {
  const all = [competitors.subject, ...competitors.rivals];
  const data = all.map((s) => ({ name: s.name, ...s.scores }));
  const ranked = [...all].sort((a, b) => b.scores.overall - a.scores.overall);
  const leader = ranked[0];
  const subjectRank = ranked.findIndex((s) => s.name === competitors.subject.name) + 1;

  return (
    <>
      <PageHeader
        eyebrow="Benchmark"
        title="Competitor comparison"
        description={`How ${competitors.subject.name} stacks up against ${competitors.rivals.length} peers. Mock benchmark data for now.`}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader title="Your position" />
          <div className="flex items-end gap-2">
            <span className="font-mono text-5xl font-semibold text-content">#{subjectRank}</span>
            <span className="mb-1.5 text-sm text-content-muted">of {all.length}</span>
          </div>
          <p className="mt-2 text-xs text-content-muted">
            {subjectRank === 1
              ? "Leading the set on overall score."
              : `${leader.name} leads with ${leader.scores.overall}. Closing the accessibility gap is the fastest way up.`}
          </p>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Ranked by overall score" />
          <div className="space-y-2.5">
            {ranked.map((s, i) => {
              const b = scoreBand(s.scores.overall);
              const isYou = s.name === competitors.subject.name;
              return (
                <motion.div
                  key={s.name}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
                    isYou ? "border-iris/40 bg-iris/[0.07]" : "border-line bg-ink-800/40"
                  }`}
                >
                  <span className="w-5 text-center font-mono text-sm text-content-dim">{i + 1}</span>
                  {i === 0 ? <Crown size={15} className="text-moderate" /> : <Minus size={15} className="text-content-dim" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm text-content">
                      {s.name}
                      {isYou && (
                        <span className="rounded-full bg-iris/20 px-1.5 py-px text-[10px] font-semibold text-iris-bright">
                          You
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-[11px] text-content-dim">{s.domain}</div>
                  </div>
                  <div className="w-28">
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: b.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${s.scores.overall}%` }}
                        transition={{ delay: 0.2 + i * 0.06 }}
                      />
                    </div>
                  </div>
                  <span className="w-8 text-right font-mono text-sm font-semibold" style={{ color: b.color }}>
                    {s.scores.overall}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader title="Score breakdown by category" subtitle="Higher is better across all four metrics" />
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -22 }} barGap={2} barCategoryGap="22%">
              <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#9AA6B8", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: "#66728A", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "rgba(148,163,184,0.05)" }} content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: "#9AA6B8" }} iconType="circle" />
              {metrics.map((m) => (
                <Bar key={m.key} dataKey={m.key} name={m.label} fill={m.color} radius={[3, 3, 0, 0]} maxBarSize={26} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </>
  );
}
