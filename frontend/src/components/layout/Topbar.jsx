import { useState, useRef, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu, Plus, Globe, ChevronDown, LogOut, User as UserIcon, X,
  ChevronLeft, ChevronRight, Search, History as HistoryIcon, Check,
} from "lucide-react";
import { Button } from "../ui/Button";
import { useAuth } from "../../context/AuthContext";
import { useCurrentAudit } from "../../context/AuditContext";
import { useAuditsList } from "../../hooks/useAudits";
import { sampleAudit } from "../../lib/mockData";
import { scoreBand, overallScore, cn } from "../../lib/utils";

function timeAgo(iso) {
  if (!iso) return "";
  const d = new Date(iso); const s = (Date.now() - d.getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function Topbar({ onOpenSidebar }) {
  const { user, isAuthed, logout } = useAuth();
  const { current, loadAuditByToken } = useCurrentAudit();
  const navigate = useNavigate();

  const { data: auditsData } = useAuditsList();
  const audits = auditsData?.audits || [];

  const siteDomain = current?.domain || sampleAudit.domain;
  const siteTitle = current?.title || sampleAudit.title;
  const currentToken = current?.token;

  const idx = useMemo(() => audits.findIndex((a) => a.token === currentToken), [audits, currentToken]);
  const older = idx >= 0 && idx < audits.length - 1 ? audits[idx + 1] : null;
  const newer = idx > 0 ? audits[idx - 1] : null;

  const [menuOpen, setMenuOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef(null);
  const auditRef = useRef(null);

  const acc = current?.accessibility;
  const realScore = current?.overall ?? (acc ? (acc.overall ?? overallScore(acc.score, acc.wcag?.compliance)) : null);
  const band = scoreBand(realScore != null ? realScore : sampleAudit.scores.overall);

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setMenuOpen(false);
      if (auditRef.current && !auditRef.current.contains(e.target)) setAuditOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const pick = async (token) => {
    setAuditOpen(false); setQ("");
    try { await loadAuditByToken(token); navigate("/dashboard"); } catch { /* ignore */ }
  };

  const filtered = audits.filter((a) =>
    !q || `${a.domain} ${a.title}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-ink/70 px-4 backdrop-blur-xl lg:px-6">
      <button onClick={onOpenSidebar}
        className="grid h-9 w-9 place-items-center rounded-lg border border-line text-content-muted hover:text-content lg:hidden"
        aria-label="Open menu">
        <Menu size={18} />
      </button>

      {/* Audit selector */}
      <div className="hidden min-w-0 items-center gap-1 sm:flex">
        <button onClick={() => newer && pick(newer.token)} disabled={!newer}
          className="grid h-8 w-7 place-items-center rounded-md border border-line text-content-muted enabled:hover:text-content disabled:opacity-30"
          title={newer ? `Newer: ${newer.domain}` : "No newer audit"}>
          <ChevronLeft size={16} />
        </button>

        <div ref={auditRef} className="relative">
          <button onClick={() => setAuditOpen((o) => !o)}
            className="flex min-w-0 items-center gap-2.5 rounded-lg border border-line bg-ink-800/60 py-1 pl-1 pr-2.5 hover:border-line-strong">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line bg-ink-800 text-content-muted">
              <Globe size={15} />
            </span>
            <div className="min-w-0 text-left">
              <div className="truncate font-display text-sm font-semibold text-content">{siteDomain}</div>
              <div className="truncate text-[11px] text-content-muted">{siteTitle}</div>
            </div>
            <ChevronDown size={14} className="shrink-0 text-content-dim" />
          </button>

          {auditOpen && (
            <div className="absolute left-0 z-30 mt-2 w-80 overflow-hidden rounded-xl border border-line bg-surface/95 shadow-card backdrop-blur-xl">
              <div className="flex items-center gap-2 border-b border-line px-3 py-2">
                <Search size={14} className="text-content-dim" />
                <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search audits…"
                  className="h-7 w-full bg-transparent text-sm text-content placeholder:text-content-dim focus:outline-none" />
              </div>
              <div className="max-h-80 overflow-y-auto p-1.5">
                {filtered.length === 0 ? (
                  <div className="px-3 py-6 text-center text-sm text-content-dim">
                    {audits.length === 0 ? "No audits yet. Run one to get started." : "No matches."}
                  </div>
                ) : filtered.map((a) => {
                  const sc = a.overall ?? a.accessibility_score; const b = scoreBand(sc ?? 0);
                  const active = a.token === currentToken;
                  return (
                    <button key={a.token} onClick={() => pick(a.token)}
                      className={cn("flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-white/[0.04]",
                        active && "bg-iris/10")}>
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full font-mono text-[11px] font-bold"
                        style={{ color: sc != null ? b.color : "#64748B", background: `${sc != null ? b.color : "#64748B"}1f` }}>
                        {sc ?? "—"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm text-content">{a.domain}</div>
                        <div className="truncate text-[11px] text-content-muted">{timeAgo(a.created_at)} · {a.issues} issues</div>
                      </div>
                      {active && <Check size={14} className="shrink-0 text-iris-bright" />}
                    </button>
                  );
                })}
              </div>
              <Link to="/dashboard/history" onClick={() => setAuditOpen(false)}
                className="flex items-center gap-2 border-t border-line px-3 py-2.5 text-sm text-content-muted hover:bg-white/[0.03] hover:text-content">
                <HistoryIcon size={14} /> View all audit history
              </Link>
            </div>
          )}
        </div>

        <button onClick={() => older && pick(older.token)} disabled={!older}
          className="grid h-8 w-7 place-items-center rounded-md border border-line text-content-muted enabled:hover:text-content disabled:opacity-30"
          title={older ? `Older: ${older.domain}` : "No older audit"}>
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="ml-auto flex items-center gap-2.5">
        <div className="hidden items-center gap-2 rounded-full border border-line bg-ink-800/80 py-1 pl-1 pr-3 md:flex">
          <span className="grid h-7 w-7 place-items-center rounded-full font-mono text-xs font-bold"
            style={{ color: band.color, background: `${band.color}1f` }}>
            {realScore != null ? realScore : sampleAudit.scores.overall}
          </span>
          <span className="text-xs text-content-muted">{realScore != null ? "Overall" : "Overall · sample"}</span>
        </div>

        <Button size="sm" onClick={() => navigate("/")} className="hidden sm:inline-flex">
          <Plus size={15} /> New audit
        </Button>

        {isAuthed ? (
          <div ref={ref} className="relative">
            <button onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-2 rounded-full border border-line bg-ink-800/80 py-1 pl-1 pr-2 hover:border-line-strong">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-iris-violet text-xs font-semibold text-white">
                {(user?.email?.[0] || "u").toUpperCase()}
              </span>
              <ChevronDown size={14} className="text-content-dim" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 z-30 mt-2 w-56 rounded-xl border border-line bg-surface/95 p-1.5 shadow-card backdrop-blur-xl">
                <div className="border-b border-line px-3 py-2">
                  <p className="truncate text-sm text-content">{user?.full_name || "Signed in"}</p>
                  <p className="truncate text-xs text-content-muted">{user?.email}</p>
                </div>
                <Link to="/dashboard/settings" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-content-muted hover:bg-white/[0.04] hover:text-content">
                  <UserIcon size={15} /> Account
                </Link>
                <button onClick={async () => { setMenuOpen(false); await logout(); navigate("/"); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-critical hover:bg-critical/10">
                  <LogOut size={15} /> Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login"><Button variant="secondary" size="sm">Sign in</Button></Link>
        )}
      </div>
    </header>
  );
}

export { X };
