import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { History as HistoryIcon, ArrowUpRight } from "lucide-react";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { Card } from "../../components/ui/Card";
import { StatusDot } from "../../components/ui/Badge";
import { Skeleton } from "../../components/ui/Skeleton";
import { Button } from "../../components/ui/Button";
import { useHistory } from "../../hooks/useAudit";
import { scoreBand } from "../../lib/utils";

function ScoreCell({ value }) {
  if (value == null) return <span className="font-mono text-sm text-content-dim">—</span>;
  const b = scoreBand(value);
  return (
    <span className="font-mono text-sm font-semibold" style={{ color: b.color }}>
      {value}
    </span>
  );
}

export default function History() {
  const { data, isLoading } = useHistory();

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Audit history"
        description="Every audit you have run, newest first."
        action={
          <Link to="/">
            <Button size="sm">
              New audit <ArrowUpRight size={15} />
            </Button>
          </Link>
        }
      />

      <Card className="!p-0">
        <div className="hidden grid-cols-12 gap-3 border-b border-line px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-content-dim sm:grid">
          <div className="col-span-4">Website</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1 text-center">Overall</div>
          <div className="col-span-1 text-center">A11y</div>
          <div className="col-span-1 text-center">Perf</div>
          <div className="col-span-2 text-right">Date</div>
          <div className="col-span-1 text-right">Issues</div>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-line">
            {data.map((row, i) => {
              const date = new Date(row.date).toLocaleDateString(undefined, {
                month: "short", day: "numeric", year: "numeric",
              });
              return (
                <motion.div
                  key={row.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.3) }}
                  className="grid grid-cols-2 items-center gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.02] sm:grid-cols-12"
                >
                  <div className="col-span-2 min-w-0 sm:col-span-4">
                    <div className="truncate text-sm text-content">{row.domain}</div>
                    <div className="truncate font-mono text-[11px] text-content-dim">{row.category}</div>
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <StatusDot status={row.status} />
                  </div>
                  <div className="hidden text-center sm:col-span-1 sm:block">
                    <ScoreCell value={row.overall} />
                  </div>
                  <div className="hidden text-center sm:col-span-1 sm:block">
                    <ScoreCell value={row.accessibility} />
                  </div>
                  <div className="hidden text-center sm:col-span-1 sm:block">
                    <ScoreCell value={row.performance} />
                  </div>
                  <div className="col-span-1 text-right text-xs text-content-muted sm:col-span-2">{date}</div>
                  <div className="hidden text-right font-mono text-xs text-content-muted sm:col-span-1 sm:block">
                    {row.issues ?? "—"}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </Card>

      <div className="mt-4 flex items-center gap-2 text-xs text-content-dim">
        <HistoryIcon size={13} />
        Showing mock history. Live records appear once the audit engine is connected.
      </div>
    </>
  );
}
