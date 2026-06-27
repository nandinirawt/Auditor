import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Highlight, themes } from "prism-react-renderer";
import {
  Code2, Copy, Check, Radio, Wand2, Download, AlertCircle, ChevronDown,
} from "lucide-react";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { LevelTag } from "../../components/ui/Badge";
import { CardSkeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { useCurrentAudit } from "../../context/AuditContext";
import { useRecommendations, useCode } from "../../hooks/useStudio";
import { apiErrorMessage } from "../../api/client";
import { cn } from "../../lib/utils";

const PRISM_LANG = { html: "markup", css: "css", tailwind: "markup", react: "jsx" };
const LANG_LABEL = { html: "HTML", css: "CSS", tailwind: "Tailwind", react: "React" };

function CodeBlock({ code, language, label, tone }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* */ }
  };
  const accent = tone === "after" ? "#34D399" : "#FB7185";
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-[#0B0F1A]">
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <span className="inline-flex items-center gap-2 text-xs font-medium" style={{ color: accent }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />{label}
        </span>
        <button onClick={copy} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-content-muted transition-colors hover:bg-white/[0.05] hover:text-content">
          {copied ? <Check size={12} className="text-pass" /> : <Copy size={12} />}{copied ? "Copied" : "Copy"}
        </button>
      </div>
      <Highlight theme={themes.vsDark} code={(code || "").trim()} language={PRISM_LANG[language] || "markup"}>
        {({ style, tokens, getLineProps, getTokenProps }) => (
          <pre className="overflow-x-auto p-3.5 font-mono text-[12.5px] leading-relaxed" style={{ ...style, background: "transparent" }}>
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                <span className="mr-3 inline-block w-4 select-none text-right text-content-dim/50">{i + 1}</span>
                {line.map((token, key) => <span key={key} {...getTokenProps({ token })} />)}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  );
}

export default function CodeGenerator() {
  const navigate = useNavigate();
  const { current, selectedIssueId, setSelectedIssueId } = useCurrentAudit();
  const token = current?.token;
  const { data: recsData } = useRecommendations(token);
  const recs = recsData?.recommendations || [];

  const issueId = selectedIssueId || recs[0]?.issue_id || null;
  useEffect(() => { if (!selectedIssueId && recs[0]) setSelectedIssueId(recs[0].issue_id); }, [recs, selectedIssueId, setSelectedIssueId]);

  const { data: code, isLoading, isError, error } = useCode(token, issueId);
  const [lang, setLang] = useState(null);
  const langs = code?.languages || [];
  const activeLang = lang && langs.includes(lang) ? lang : langs[0];

  function download() {
    if (!code || !activeLang) return;
    const ext = activeLang === "react" ? "jsx" : activeLang === "css" ? "css" : "html";
    const body = `/* ${code.title} */\n\n/* BEFORE */\n${code.variants[activeLang].before}\n\n/* AFTER */\n${code.variants[activeLang].after}\n`;
    const blob = new Blob([body], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${code.issue_id}.${ext}`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  if (!token) {
    return (
      <>
        <PageHeader eyebrow="AI Studio" title="Generated code" description="Copy-ready fixes generated from your audit." />
        <EmptyState icon={Wand2} title="Run an audit to generate code"
          body="Once an audit finds issues, we generate the real fix for each one — in HTML, CSS, Tailwind and React."
          action={<Button onClick={() => navigate("/")}>Start an audit</Button>} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="AI Studio"
        title="Generated code"
        description="The fix for the selected issue, before and after. Pick a language."
        action={<span className="inline-flex items-center gap-1.5 rounded-full border border-pass/30 bg-pass/10 px-2.5 py-1 text-xs font-medium text-pass"><Radio size={12} /> Live · from audit</span>}
      />

      {/* Issue selector — keeps all three pages in sync */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative">
          <select value={issueId || ""} onChange={(e) => setSelectedIssueId(e.target.value)}
            className="h-10 max-w-md appearance-none rounded-lg border border-line bg-ink-800/70 pl-3 pr-9 text-sm text-content focus:outline-none">
            {recs.map((r) => <option key={r.issue_id} value={r.issue_id}>{r.problem}</option>)}
          </select>
          <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-content-dim" />
        </div>
        <Button size="sm" variant="secondary" onClick={() => { navigate("/dashboard/before-after"); }}>See before / after →</Button>
      </div>

      {isLoading ? (
        <CardSkeleton lines={8} />
      ) : isError ? (
        <EmptyState icon={AlertCircle} title="Couldn't generate code" body={apiErrorMessage(error)} />
      ) : !code ? (
        <EmptyState icon={Code2} title="Select an issue" body="Choose an issue above to generate its fix." />
      ) : (
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-ink-800 text-iris-bright"><Code2 size={15} /></span>
              <div>
                <h3 className="font-display text-sm font-semibold text-content">{code.title}</h3>
                <p className="text-xs text-content-muted">{code.summary}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LevelTag level={code.level} />
              <Button size="sm" variant="secondary" onClick={download}><Download size={14} /> Download</Button>
            </div>
          </div>

          {/* Language tabs */}
          <div className="mb-3 flex items-center gap-1 rounded-lg border border-line bg-ink-800/70 p-1">
            {langs.map((l) => (
              <button key={l} onClick={() => setLang(l)}
                className={cn("rounded-md px-3 py-1.5 text-xs font-medium transition-colors", activeLang === l ? "bg-white/[0.08] text-content" : "text-content-muted hover:text-content")}>
                {LANG_LABEL[l] || l}
              </button>
            ))}
          </div>

          {activeLang && (
            <div className="grid gap-3 lg:grid-cols-2">
              <CodeBlock code={code.variants[activeLang].before} language={activeLang} label="Before" tone="before" />
              <CodeBlock code={code.variants[activeLang].after} language={activeLang} label="After" tone="after" />
            </div>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="panel p-3">
              <div className="text-[11px] font-medium text-content-dim">What changed</div>
              <p className="mt-1 text-sm text-content-muted">{code.what_changed}</p>
            </div>
            <div className="panel p-3">
              <div className="text-[11px] font-medium text-content-dim">Why</div>
              <p className="mt-1 text-sm text-content-muted">{code.why || "Resolves the detected violation."}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
            {code.wcag && <span className="chip">WCAG {code.wcag}</span>}
            <span className="inline-flex items-center gap-1.5 text-pass">{code.expected_improvement}</span>
            {code.help_url && <a href={code.help_url} target="_blank" rel="noreferrer" className="text-iris-bright hover:underline">Reference ↗</a>}
          </div>
        </Card>
      )}
    </>
  );
}
