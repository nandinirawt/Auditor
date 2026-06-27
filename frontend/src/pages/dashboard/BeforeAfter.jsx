import { useRef, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  SplitSquareHorizontal, Radio, Wand2, MoveHorizontal, ChevronDown, AlertCircle,
  ArrowUpRight, ArrowDownRight, ShieldCheck, Gauge, RefreshCw, Info, Loader2, CheckCircle2,
} from "lucide-react";
import { Highlight, themes } from "prism-react-renderer";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { useCurrentAudit } from "../../context/AuditContext";
import { useRecommendations } from "../../hooks/useStudio";
import { renderPreview } from "../../api/studio";
import { apiErrorMessage } from "../../api/client";
import { scoreBand } from "../../lib/utils";

const STAGES = ["Generating improved preview…", "Rendering modified page…", "Capturing comparison…"];
const PRISM_LANG = { html: "markup", css: "css", tailwind: "markup", react: "jsx" };

function Delta({ before, after, suffix = "", invert = false }) {
  if (before == null || after == null) return <span className="text-content-dim">—</span>;
  const diff = after - before;
  const good = invert ? diff < 0 : diff > 0;
  const flat = diff === 0;
  const Icon = good ? ArrowUpRight : ArrowDownRight;
  const color = flat ? "#94A3B8" : good ? "#34D399" : "#FB7185";
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="font-mono text-content-dim line-through">{before}{suffix}</span>
      <span className="font-mono text-lg font-semibold" style={{ color }}>{after}{suffix}</span>
      {!flat && <Icon size={13} style={{ color }} />}
    </span>
  );
}

function MiniCode({ code, language }) {
  return (
    <Highlight theme={themes.vsDark} code={(code || "").trim()} language={PRISM_LANG[language] || "markup"}>
      {({ style, tokens, getLineProps, getTokenProps }) => (
        <pre className="overflow-x-auto rounded-lg border border-line bg-[#0B0F1A] p-3 font-mono text-[12px] leading-relaxed" style={{ ...style, background: "transparent" }}>
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })}>{line.map((t, k) => <span key={k} {...getTokenProps({ token: t })} />)}</div>
          ))}
        </pre>
      )}
    </Highlight>
  );
}

export default function BeforeAfter() {
  const navigate = useNavigate();
  const { current, selectedIssueId, setSelectedIssueId } = useCurrentAudit();
  const token = current?.token;
  const { data: recsData } = useRecommendations(token);
  const recs = recsData?.recommendations || [];
  const issueId = selectedIssueId || recs[0]?.issue_id || null;
  useEffect(() => { if (!selectedIssueId && recs[0]) setSelectedIssueId(recs[0].issue_id); }, [recs, selectedIssueId, setSelectedIssueId]);

  const [status, setStatus] = useState("idle"); // idle | rendering | done | error
  const [stage, setStage] = useState(0);
  const [preview, setPreview] = useState(null);
  const [errMsg, setErrMsg] = useState("");
  const inFlight = useRef(null);

  const [pos, setPos] = useState(50);
  const dragging = useRef(false);
  const containerRef = useRef(null);
  const update = useCallback((clientX) => {
    const el = containerRef.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    setPos(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)));
  }, []);

  const doRender = useCallback(async (id) => {
    if (!token || !id) return;
    inFlight.current = id;
    setStatus("rendering"); setStage(0); setErrMsg(""); setPreview(null);
    try {
      const data = await renderPreview(token, id);
      if (inFlight.current !== id) return; // a newer selection superseded this
      setPreview(data); setStatus("done"); setPos(50);
    } catch (e) {
      if (inFlight.current !== id) return;
      setErrMsg(apiErrorMessage(e)); setStatus("error");
    }
  }, [token]);

  // Live re-render whenever the selected issue changes.
  useEffect(() => { if (token && issueId) doRender(issueId); /* eslint-disable-next-line */ }, [token, issueId]);

  // Cycle the staged progress messages while rendering.
  useEffect(() => {
    if (status !== "rendering") return;
    const t = setInterval(() => setStage((s) => (s + 1) % STAGES.length), 1600);
    return () => clearInterval(t);
  }, [status]);

  if (!token) {
    return (
      <>
        <PageHeader eyebrow="AI Studio" title="Before vs after" description="A real render of the fix, captured live." />
        <EmptyState icon={Wand2} title="Run an audit to compare"
          body="After an audit, each fix is applied to the real page and re-rendered so you can see the genuine before and after."
          action={<Button onClick={() => navigate("/")}>Start an audit</Button>} />
      </>
    );
  }

  const m = preview?.metrics;
  const afterBand = m?.ux_after != null ? scoreBand(m.ux_after) : null;

  return (
    <>
      <PageHeader
        eyebrow="AI Studio"
        title="Before vs after"
        description="The fix applied to the real page, re-rendered and re-scanned live. Drag to compare."
        action={<span className="inline-flex items-center gap-1.5 rounded-full border border-pass/30 bg-pass/10 px-2.5 py-1 text-xs font-medium text-pass"><Radio size={12} /> Live render</span>}
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative">
          <select value={issueId || ""} onChange={(e) => setSelectedIssueId(e.target.value)}
            className="h-10 max-w-md appearance-none rounded-lg border border-line bg-ink-800/70 pl-3 pr-9 text-sm text-content focus:outline-none">
            {recs.map((r) => <option key={r.issue_id} value={r.issue_id}>{r.problem}</option>)}
          </select>
          <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-content-dim" />
        </div>
        <Button size="sm" variant="secondary" onClick={() => navigate("/dashboard/code")}>← See the code</Button>
        <Button size="sm" onClick={() => doRender(issueId)} disabled={status === "rendering"}>
          <RefreshCw size={14} className={status === "rendering" ? "animate-spin" : ""} /> Re-render
        </Button>
      </div>

      {status === "error" ? (
        <EmptyState icon={AlertCircle} title="Couldn't render this preview" body={errMsg} />
      ) : (
        <>
          <Card>
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm">
                <SplitSquareHorizontal size={16} className="text-iris-bright" />
                <span className="font-medium text-content">{preview?.title || "Rendering…"}</span>
              </div>
              {status === "done" && preview?.applied && (
                <span className="inline-flex items-center gap-1.5 text-xs text-pass"><CheckCircle2 size={13} /> Fix applied & re-scanned</span>
              )}
            </div>

            <div ref={containerRef}
              onPointerDown={(e) => { if (status !== "done") return; dragging.current = true; e.currentTarget.setPointerCapture?.(e.pointerId); update(e.clientX); }}
              onPointerMove={(e) => dragging.current && update(e.clientX)}
              onPointerUp={() => (dragging.current = false)}
              onPointerLeave={() => (dragging.current = false)}
              className="relative aspect-[16/10] w-full select-none overflow-hidden rounded-xl border border-line-strong bg-ink-800"
              style={{ cursor: status === "done" ? "ew-resize" : "default" }}>

              {status === "rendering" || status === "idle" ? (
                <div className="absolute inset-0 grid place-items-center">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <Loader2 size={28} className="animate-spin text-iris-bright" />
                    <div className="text-sm font-medium text-content">{STAGES[stage]}</div>
                    <div className="text-xs text-content-dim">Re-opening the page in a real browser — this takes a few seconds.</div>
                  </div>
                </div>
              ) : preview ? (
                <>
                  <div className="absolute inset-0">
                    <img src={preview.before_image} alt="Before" className="h-full w-full object-cover object-top" />
                  </div>
                  <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
                    <img src={preview.after_image} alt="After" className="h-full w-full object-cover object-top" />
                  </div>
                  <span className="absolute left-3 top-3 rounded-md bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">BEFORE</span>
                  <span className="absolute right-3 top-3 rounded-md bg-pass/80 px-2 py-0.5 text-[10px] font-semibold text-ink backdrop-blur">AFTER</span>
                  <div className="absolute inset-y-0 z-10" style={{ left: `${pos}%`, transform: "translateX(-50%)" }}>
                    <div className="h-full w-0.5 bg-iris-bright shadow-[0_0_12px_rgba(129,140,248,0.8)]" />
                    <div className="absolute top-1/2 left-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-iris-bright bg-ink shadow-glow">
                      <MoveHorizontal size={16} className="text-iris-bright" />
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {status === "done" && (
              <div className="mt-3 flex items-start gap-2 text-xs text-content-dim">
                <Info size={13} className="mt-0.5 shrink-0" />
                The fix was injected into the live DOM and re-scanned. Visual fixes (contrast, focus, size) show in the image; non-visual ones
                (alt text, labels, language) look identical but the measured drop in violations below is the proof. The patched element is outlined in green.
              </div>
            )}
          </Card>

          {/* Measured metrics */}
          {status === "done" && m && (
            <>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="card p-4">
                  <div className="flex items-center gap-1.5 text-[11px] text-content-muted"><ShieldCheck size={12} /> Accessibility score</div>
                  <div className="mt-1.5"><Delta before={m.accessibility_before} after={m.accessibility_after} /></div>
                  <div className="mt-1 text-[11px] text-content-dim">measured by re-scan</div>
                </div>
                <div className="card p-4">
                  <div className="flex items-center gap-1.5 text-[11px] text-content-muted"><AlertCircle size={12} /> Violations</div>
                  <div className="mt-1.5"><Delta before={m.violations_before} after={m.violations_after} invert /></div>
                  <div className="mt-1 text-[11px] text-content-dim">fewer is better</div>
                </div>
                <div className="card p-4">
                  <div className="flex items-center gap-1.5 text-[11px] text-content-muted"><ShieldCheck size={12} /> WCAG conformance</div>
                  <div className="mt-1.5"><Delta before={m.wcag_before} after={m.wcag_after} suffix="%" /></div>
                  <div className="mt-1 text-[11px] text-content-dim">measured by re-scan</div>
                </div>
                <div className="card p-4">
                  <div className="flex items-center gap-1.5 text-[11px] text-content-muted"><Gauge size={12} /> UX score (est.)</div>
                  <div className="mt-1.5"><Delta before={m.ux_before} after={m.ux_after} /></div>
                  <div className="mt-1 text-[11px] text-content-dim">estimate</div>
                </div>
              </div>

              {/* DOM diff: what changed + the code */}
              <Card className="mt-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-content"><Wand2 size={15} className="text-iris-bright" /> What changed</div>
                <ul className="mb-4 space-y-1.5">
                  {(preview.notes || []).map((n, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-content-muted"><CheckCircle2 size={14} className="text-pass" /> {n}</li>
                  ))}
                  {(!preview.notes || preview.notes.length === 0) && <li className="text-sm text-content-dim">Fix applied to the affected element.</li>}
                </ul>
                {preview.code?.variants && (() => {
                  const lang = preview.code.languages?.[0];
                  if (!lang) return null;
                  return (
                    <div className="grid gap-3 lg:grid-cols-2">
                      <div>
                        <div className="mb-1.5 text-[11px] font-medium text-danger">Before</div>
                        <MiniCode code={preview.code.variants[lang].before} language={lang} />
                      </div>
                      <div>
                        <div className="mb-1.5 text-[11px] font-medium text-pass">After</div>
                        <MiniCode code={preview.code.variants[lang].after} language={lang} />
                      </div>
                    </div>
                  );
                })()}
                <p className="mt-4 text-sm leading-relaxed text-content-muted">{preview.improvement_summary}</p>
              </Card>
            </>
          )}
        </>
      )}
    </>
  );
}
