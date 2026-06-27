import { motion } from "framer-motion";
import { Sparkles, Zap, ArrowUpRight } from "lucide-react";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { Card } from "../../components/ui/Card";
import { recommendations } from "../../lib/mockData";

const priorityMeta = {
  high: { label: "High priority", color: "#FB7185" },
  medium: { label: "Medium priority", color: "#FBBF24" },
  low: { label: "Low priority", color: "#64748B" },
};

export default function Recommendations() {
  return (
    <>
      <PageHeader
        eyebrow="AI Studio"
        title="Recommendations"
        description="Prioritized fixes generated from this audit, ordered by impact against effort."
        action={
          <span className="chip">
            <Sparkles size={13} className="text-iris-bright" /> AI generated
          </span>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {recommendations.map((r, i) => {
          const pm = priorityMeta[r.priority];
          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <Card className="h-full transition-colors hover:border-line-strong">
                <div className="mb-3 flex items-center justify-between">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{ color: pm.color, background: `${pm.color}1a`, border: `1px solid ${pm.color}33` }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: pm.color }} />
                    {pm.label}
                  </span>
                  <span className="chip">{r.area}</span>
                </div>
                <h3 className="font-display text-base font-semibold leading-snug text-content">{r.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-content-muted">{r.body}</p>
                <div className="mt-4 flex items-center gap-4 border-t border-line pt-3 text-xs">
                  <span className="inline-flex items-center gap-1.5 text-content-muted">
                    <Zap size={13} className="text-content-dim" /> Effort: {r.effort}
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-medium text-pass">
                    <ArrowUpRight size={13} /> {r.impact}
                  </span>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <p className="mt-6 text-center text-xs text-content-dim">
        These suggestions are a frontend preview. Wiring them to a live model is reserved in the backend.
      </p>
    </>
  );
}
