import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Accessibility, ShieldCheck, GitCompareArrows,
  Sparkles, Code2, SplitSquareHorizontal, History, FolderKanban, Settings as SettingsIcon,
} from "lucide-react";
import { Logo } from "./Logo";
import { cn } from "../../lib/utils";

const groups = [
  {
    label: "Analysis",
    items: [
      { to: "/dashboard", label: "Overview", icon: LayoutDashboard, end: true },
      { to: "/dashboard/accessibility", label: "Accessibility", icon: Accessibility },
      { to: "/dashboard/wcag", label: "WCAG", icon: ShieldCheck },
      { to: "/dashboard/competitor", label: "Competitor", icon: GitCompareArrows },
    ],
  },
  {
    label: "AI Studio",
    badge: "Preview",
    items: [
      { to: "/dashboard/recommendations", label: "Recommendations", icon: Sparkles },
      { to: "/dashboard/code", label: "Generated Code", icon: Code2 },
      { to: "/dashboard/before-after", label: "Before vs After", icon: SplitSquareHorizontal },
    ],
  },
  {
    label: "Workspace",
    items: [
      { to: "/dashboard/history", label: "Audit History", icon: History },
      { to: "/dashboard/settings", label: "Settings", icon: SettingsIcon },
    ],
  },
];

export function SidebarContent({ onNavigate }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center px-5">
        <Logo />
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
        {groups.map((group) => (
          <div key={group.label}>
            <div className="mb-1.5 flex items-center gap-2 px-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-content-dim">
                {group.label}
              </span>
              {group.badge && (
                <span className="rounded-full border border-iris/30 bg-iris/10 px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide text-iris-bright">
                  {group.badge}
                </span>
              )}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-white/[0.05] text-content"
                        : "text-content-muted hover:bg-white/[0.03] hover:text-content"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={cn(
                          "transition-colors",
                          isActive ? "text-iris-bright" : "text-content-dim group-hover:text-content-muted"
                        )}
                      >
                        <item.icon size={17} />
                      </span>
                      {item.label}
                      {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-iris-bright" />}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-line p-3">
        <div className="rounded-xl border border-line bg-gradient-to-br from-iris/10 to-violet/10 p-3">
          <p className="text-xs font-medium text-content">Audit engine</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-content-muted">
            Live crawling & Lighthouse arrive in the next backend phase.
          </p>
        </div>
      </div>
    </div>
  );
}
