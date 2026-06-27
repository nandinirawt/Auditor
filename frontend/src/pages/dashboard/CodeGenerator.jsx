import { useState } from "react";
import { motion } from "framer-motion";
import { Highlight, themes } from "prism-react-renderer";
import { Code2, Copy, Check, Sparkles } from "lucide-react";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { Card } from "../../components/ui/Card";
import { LevelTag } from "../../components/ui/Badge";
import { codeFixes } from "../../lib/mockData";

function CodeBlock({ code, language, label, tone }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };
  const accent = tone === "after" ? "#34D399" : "#FB7185";

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-[#0B0F1A]">
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <span className="inline-flex items-center gap-2 text-xs font-medium" style={{ color: accent }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
          {label}
        </span>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-content-muted transition-colors hover:bg-white/[0.05] hover:text-content"
        >
          {copied ? <Check size={12} className="text-pass" /> : <Copy size={12} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <Highlight theme={themes.vsDark} code={code.trim()} language={language}>
        {({ style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className="overflow-x-auto p-3.5 font-mono text-[12.5px] leading-relaxed"
            style={{ ...style, background: "transparent" }}
          >
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                <span className="mr-3 inline-block w-4 select-none text-right text-content-dim/50">{i + 1}</span>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  );
}

export default function CodeGenerator() {
  return (
    <>
      <PageHeader
        eyebrow="AI Studio"
        title="Generated code"
        description="Copy-ready fixes for the highest-impact issues, with the before and the corrected after."
        action={
          <span className="chip">
            <Sparkles size={13} className="text-iris-bright" /> AI generated
          </span>
        }
      />

      <div className="space-y-5">
        {codeFixes.map((fix, i) => (
          <motion.div
            key={fix.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-ink-800 text-iris-bright">
                    <Code2 size={15} />
                  </span>
                  <div>
                    <h3 className="font-display text-sm font-semibold text-content">{fix.title}</h3>
                    <p className="text-xs text-content-muted">{fix.summary}</p>
                  </div>
                </div>
                <LevelTag level={fix.wcag} />
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                <CodeBlock code={fix.before} language={fix.language} label="Before" tone="before" />
                <CodeBlock code={fix.after} language={fix.language} label="After" tone="after" />
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </>
  );
}
