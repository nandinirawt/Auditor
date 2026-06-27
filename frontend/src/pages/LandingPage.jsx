import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Search, Accessibility, Gauge, ShieldCheck, Sparkles } from "lucide-react";
import { Logo } from "../components/layout/Logo";
import { Button } from "../components/ui/Button";
import { CategorySelector } from "../components/landing/CategorySelector";

function normalizeUrl(value) {
  const v = value.trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  return `https://${v}`;
}

export default function LandingPage() {
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function analyze(e) {
    e.preventDefault();
    const clean = normalizeUrl(url);
    if (!clean || !/\.[a-z]{2,}/i.test(clean)) {
      setError("Enter a valid website URL, like lumio.store");
      return;
    }
    navigate("/loading", { state: { url: clean, category } });
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid-faint [background-size:54px_54px] opacity-[0.35]" />
      <div className="pointer-events-none absolute left-1/2 top-[-10%] h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-iris/15 blur-[120px]" />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <nav className="flex items-center gap-2">
          <Link to="/dashboard" className="hidden text-sm text-content-muted hover:text-content sm:block">
            <span className="px-3 py-2">View demo</span>
          </Link>
          <Link to="/login">
            <Button variant="secondary" size="sm">Sign in</Button>
          </Link>
        </nav>
      </header>

      <main className="relative mx-auto flex max-w-3xl flex-col items-center px-5 pb-24 pt-16 text-center sm:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="chip mb-6"
        >
          <Sparkles size={13} className="text-iris-bright" />
          AI conversational UX auditor
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-4xl font-semibold leading-[1.08] tracking-tight text-content sm:text-6xl"
        >
          Grade any website
          <br />
          the way <span className="gradient-text">every user</span> sees it.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.12 }}
          className="mt-5 max-w-xl text-base leading-relaxed text-content-muted sm:text-lg"
        >
          Paste a URL. UXSense crawls it, captures every device, and scores accessibility,
          performance, and WCAG compliance — with the exact fixes, ranked.
        </motion.p>

        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.18 }}
          onSubmit={analyze}
          className="card mt-10 w-full max-w-xl space-y-3 p-3 text-left sm:p-4"
        >
          <div className="flex items-center gap-2 rounded-xl border border-line bg-ink-800/70 px-3.5 focus-within:border-iris/60 focus-within:ring-2 focus-within:ring-iris/20">
            <Search size={18} className="shrink-0 text-content-dim" />
            <input
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError("");
              }}
              placeholder="lumio.store"
              className="h-12 w-full bg-transparent text-sm text-content placeholder:text-content-dim focus:outline-none"
              autoComplete="url"
              aria-label="Website URL"
            />
          </div>
          <CategorySelector value={category} onChange={setCategory} />
          {error && <p className="px-1 text-xs text-critical">{error}</p>}
          <Button type="submit" size="lg" className="w-full">
            Analyze website <ArrowRight size={17} />
          </Button>
        </motion.form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-14 grid w-full max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4"
        >
          {[
            { icon: Accessibility, label: "Accessibility", note: "axe-core" },
            { icon: ShieldCheck, label: "WCAG 2.2", note: "A · AA" },
            { icon: Gauge, label: "Performance", note: "Lighthouse" },
            { icon: Search, label: "SEO", note: "on-page" },
          ].map((f) => (
            <div key={f.label} className="panel flex flex-col items-center gap-1.5 px-3 py-4">
              <f.icon size={18} className="text-iris-bright" />
              <span className="text-xs font-medium text-content">{f.label}</span>
              <span className="font-mono text-[10px] text-content-dim">{f.note}</span>
            </div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
