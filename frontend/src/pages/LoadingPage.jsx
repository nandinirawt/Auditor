import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { Logo } from "../components/layout/Logo";
import { AUDIT_STAGES } from "../lib/mockData";
import { cn } from "../lib/utils";

const STEP_MS = 780;

export default function LoadingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const url = location.state?.url || "https://www.lumio.store";
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= AUDIT_STAGES.length) {
      const t = setTimeout(() => navigate("/dashboard", { replace: true }), 650);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep((s) => s + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [step, navigate]);

  const progress = Math.min(100, Math.round((step / AUDIT_STAGES.length) * 100));
  const done = step >= AUDIT_STAGES.length;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5">
      <div className="pointer-events-none absolute inset-0 bg-grid-faint [background-size:54px_54px] opacity-30" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 rounded-full bg-iris/15 blur-[120px]" />

      <div className="absolute left-6 top-6">
        <Logo />
      </div>

      <div className="relative grid w-full max-w-4xl gap-10 lg:grid-cols-2 lg:items-center">
        {/* Scan visual */}
        <div className="order-2 lg:order-1">
          <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-2xl border border-line-strong bg-ink-800 shadow-card">
            <div className="flex items-center gap-1.5 border-b border-line bg-ink-700/80 px-3 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-critical/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-moderate/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-pass/70" />
              <span className="ml-2 truncate font-mono text-[10px] text-content-dim">{url}</span>
            </div>
            <div className="relative aspect-[4/3] p-4">
              {/* wireframe */}
              <div className="space-y-3">
                <div className="h-12 rounded-lg bg-gradient-to-r from-iris/25 to-violet/15" />
                <div className="grid grid-cols-3 gap-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-16 rounded-lg bg-white/[0.05]" />
                  ))}
                </div>
                <div className="h-3 w-2/3 rounded-full bg-white/10" />
                <div className="h-3 w-1/2 rounded-full bg-white/[0.06]" />
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="h-10 rounded-lg bg-white/[0.05]" />
                  <div className="h-10 rounded-lg bg-white/[0.05]" />
                </div>
              </div>
              {/* scan line */}
              {!done && (
                <motion.div
                  initial={{ top: "0%" }}
                  animate={{ top: ["0%", "100%", "0%"] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-x-0 h-px"
                  style={{ boxShadow: "0 0 18px 3px rgba(99,102,241,0.7)", background: "rgba(129,140,248,0.9)" }}
                />
              )}
              <AnimatePresence>
                {done && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 grid place-items-center bg-ink/60 backdrop-blur-sm"
                  >
                    <span className="grid h-14 w-14 place-items-center rounded-full bg-pass/20 text-pass">
                      <Check size={26} />
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Stage list */}
        <div className="order-1 lg:order-2">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-iris-bright">
            Auditing
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-content">
            {done ? "Report ready" : "Running your audit"}
          </h1>
          <p className="mt-1 font-mono text-xs text-content-muted">{url}</p>

          <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div
              className="h-full rounded-full bg-iris-violet"
              initial={{ width: 0 }}
              animate={{ width: `${done ? 100 : progress}%` }}
              transition={{ ease: "easeOut" }}
            />
          </div>

          <ul className="mt-6 space-y-1">
            {AUDIT_STAGES.map((stage, i) => {
              const state = i < step ? "done" : i === step ? "active" : "pending";
              return (
                <li
                  key={stage.key}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors",
                    state === "active" && "bg-white/[0.04]"
                  )}
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center">
                    {state === "done" ? (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="grid h-5 w-5 place-items-center rounded-full bg-pass/20 text-pass"
                      >
                        <Check size={12} strokeWidth={3} />
                      </motion.span>
                    ) : state === "active" ? (
                      <Loader2 size={16} className="animate-spin text-iris-bright" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-content-dim/50" />
                    )}
                  </span>
                  <span
                    className={cn(
                      "text-sm transition-colors",
                      state === "pending" ? "text-content-dim" : "text-content"
                    )}
                  >
                    {stage.label}
                  </span>
                  <span className="ml-auto font-mono text-[10px] text-content-dim">{stage.detail}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
