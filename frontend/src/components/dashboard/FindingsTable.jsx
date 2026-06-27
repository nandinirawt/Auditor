import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ExternalLink, Code2 } from "lucide-react";
import { SeverityPill, LevelTag } from "../ui/Badge";
import { cn } from "../../lib/utils";

function FindingRow({ finding, index }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
      className="overflow-hidden border-b border-line last:border-0"
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/[0.02]"
      >
        <ChevronRight
          size={16}
          className={cn("shrink-0 text-content-dim transition-transform", open && "rotate-90")}
        />
        <SeverityPill severity={finding.severity} />
        <span className="min-w-0 flex-1 truncate text-sm text-content">{finding.title}</span>
        <span className="hidden shrink-0 items-center gap-2 sm:flex">
          <LevelTag level={finding.level} />
          <span className="chip">{finding.category}</span>
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="space-y-3 px-4 pb-4 pl-11">
              <p className="text-sm leading-relaxed text-content-muted">{finding.description}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="panel p-3">
                  <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-content-dim">
                    <Code2 size={12} /> Selector
                  </div>
                  <code className="block break-all font-mono text-xs text-iris-bright">{finding.selector}</code>
                </div>
                <div className="panel p-3">
                  <div className="mb-1 text-[11px] font-medium text-content-dim">Where</div>
                  <div className="font-mono text-xs text-content">{finding.page}</div>
                  <div className="mt-1 text-[11px] text-content-muted">
                    Source: <span className="capitalize">{finding.source}</span>
                    {finding.wcag && ` · WCAG ${finding.wcag}`}
                  </div>
                </div>
              </div>
              {finding.help && (
                <a
                  href={finding.help}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-iris-bright hover:underline"
                >
                  How to fix this <ExternalLink size={12} />
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function FindingsTable({ findings }) {
  if (!findings?.length) {
    return <div className="px-4 py-10 text-center text-sm text-content-muted">No issues match these filters.</div>;
  }
  return (
    <div className="divide-y divide-line">
      {findings.map((f, i) => (
        <FindingRow key={f.id} finding={f} index={i} />
      ))}
    </div>
  );
}
