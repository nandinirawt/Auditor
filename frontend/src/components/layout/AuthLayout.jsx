import { Link } from "react-router-dom";
import { Logo } from "./Logo";

export function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      {/* Left — brand panel */}
      <div className="relative hidden overflow-hidden border-r border-line lg:block">
        <div className="absolute inset-0 bg-grid-faint [background-size:48px_48px] opacity-40" />
        <div className="absolute -left-20 top-1/4 h-80 w-80 rounded-full bg-iris/20 blur-[100px]" />
        <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-violet/20 blur-[100px]" />
        <div className="relative flex h-full flex-col justify-between p-10">
          <Logo />
          <div>
            <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight text-content">
              See your interface the way
              <br />
              <span className="gradient-text">every user does.</span>
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-content-muted">
              UXSense crawls your site, captures it across devices, and grades accessibility,
              performance, and WCAG compliance — then tells you exactly what to fix first.
            </p>
            <div className="mt-8 flex gap-6">
              {[
                ["WCAG 2.2", "A · AA mapped"],
                ["3 devices", "desktop · tablet · mobile"],
                ["axe + Lighthouse", "real engines"],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="font-display text-sm font-semibold text-content">{k}</div>
                  <div className="text-[11px] text-content-muted">{v}</div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-content-dim">© 2026 UXSense</p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-content">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-content-muted">{subtitle}</p>}
          <div className="mt-7">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-content-muted">{footer}</div>}
          <p className="mt-8 text-center text-xs text-content-dim">
            <Link to="/" className="hover:text-content-muted">← Back to home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
