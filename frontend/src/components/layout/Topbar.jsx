import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, Plus, Globe, ChevronDown, LogOut, User as UserIcon, X } from "lucide-react";
import { Button } from "../ui/Button";
import { useAuth } from "../../context/AuthContext";
import { sampleAudit } from "../../lib/mockData";
import { scoreBand } from "../../lib/utils";

export function Topbar({ onOpenSidebar }) {
  const { user, isAuthed, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef(null);
  const band = scoreBand(sampleAudit.scores.overall);

  useEffect(() => {
    const onDoc = (e) => ref.current && !ref.current.contains(e.target) && setMenuOpen(false);
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-ink/70 px-4 backdrop-blur-xl lg:px-6">
      <button
        onClick={onOpenSidebar}
        className="grid h-9 w-9 place-items-center rounded-lg border border-line text-content-muted hover:text-content lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>

      <div className="hidden min-w-0 items-center gap-2.5 sm:flex">
        <span className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-ink-800 text-content-muted">
          <Globe size={15} />
        </span>
        <div className="min-w-0">
          <div className="truncate font-display text-sm font-semibold text-content">{sampleAudit.domain}</div>
          <div className="truncate text-[11px] text-content-muted">{sampleAudit.title}</div>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2.5">
        <div className="hidden items-center gap-2 rounded-full border border-line bg-ink-800/80 py-1 pl-1 pr-3 md:flex">
          <span
            className="grid h-7 w-7 place-items-center rounded-full font-mono text-xs font-bold"
            style={{ color: band.color, background: `${band.color}1f` }}
          >
            {sampleAudit.scores.overall}
          </span>
          <span className="text-xs text-content-muted">Overall score</span>
        </div>

        <Button size="sm" onClick={() => navigate("/")} className="hidden sm:inline-flex">
          <Plus size={15} /> New audit
        </Button>

        {isAuthed ? (
          <div ref={ref} className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-2 rounded-full border border-line bg-ink-800/80 py-1 pl-1 pr-2 hover:border-line-strong"
            >
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
                <Link
                  to="/dashboard/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-content-muted hover:bg-white/[0.04] hover:text-content"
                >
                  <UserIcon size={15} /> Account
                </Link>
                <button
                  onClick={async () => {
                    setMenuOpen(false);
                    await logout();
                    navigate("/");
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-critical hover:bg-critical/10"
                >
                  <LogOut size={15} /> Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login">
            <Button variant="secondary" size="sm">Sign in</Button>
          </Link>
        )}
      </div>
    </header>
  );
}

export { X };
