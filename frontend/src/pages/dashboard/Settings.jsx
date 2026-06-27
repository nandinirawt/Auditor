import { useState } from "react";
import { Check, Palette, ShieldCheck, Bell, User as UserIcon } from "lucide-react";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { Card, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../lib/utils";

function Toggle({ checked, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 rounded-full transition-colors",
        checked ? "bg-iris" : "bg-white/[0.1]"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

function SegmentedControl({ options, value, onChange }) {
  return (
    <div className="inline-flex rounded-lg border border-line bg-ink-800/70 p-1">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors",
            value === o ? "bg-white/[0.08] text-content" : "text-content-muted hover:text-content"
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function Row({ icon: Icon, title, desc, children }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-4 last:border-0">
      <div className="flex items-start gap-3">
        {Icon && <Icon size={16} className="mt-0.5 text-content-dim" />}
        <div>
          <div className="text-sm font-medium text-content">{title}</div>
          {desc && <div className="mt-0.5 text-xs text-content-muted">{desc}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

export default function Settings() {
  const { user, isAuthed } = useAuth();
  const [theme, setTheme] = useState("dark");
  const [wcag, setWcag] = useState("AA");
  const [device, setDevice] = useState("desktop");
  const [emailReports, setEmailReports] = useState(true);
  const [regressionAlerts, setRegressionAlerts] = useState(true);
  const [productUpdates, setProductUpdates] = useState(false);
  const [saved, setSaved] = useState(false);

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Preferences apply to new audits. These are stored locally for now."
        action={
          <Button onClick={save} size="sm">
            {saved ? (<><Check size={15} /> Saved</>) : "Save changes"}
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Appearance" subtitle="How UXSense looks" icon={Palette} />
          <Row title="Theme" desc="Dark is tuned for long auditing sessions.">
            <SegmentedControl options={["dark", "light", "system"]} value={theme} onChange={setTheme} />
          </Row>
          <Row title="Default device" desc="Which capture leads the report.">
            <SegmentedControl options={["desktop", "tablet", "mobile"]} value={device} onChange={setDevice} />
          </Row>
        </Card>

        <Card>
          <CardHeader title="Audit defaults" subtitle="Applied to every new run" icon={ShieldCheck} />
          <Row title="WCAG conformance target" desc="The level findings are graded against.">
            <SegmentedControl options={["A", "AA", "AAA"]} value={wcag} onChange={setWcag} />
          </Row>
          <Row title="Include best-practice checks" desc="Lighthouse best-practices audit.">
            <Toggle checked={regressionAlerts} onChange={setRegressionAlerts} />
          </Row>
        </Card>

        <Card>
          <CardHeader title="Notifications" subtitle="When we reach out" icon={Bell} />
          <Row title="Email me each report" desc="A summary when an audit finishes.">
            <Toggle checked={emailReports} onChange={setEmailReports} />
          </Row>
          <Row title="Score regression alerts" desc="If a re-audit drops a score.">
            <Toggle checked={regressionAlerts} onChange={setRegressionAlerts} />
          </Row>
          <Row title="Product updates" desc="Occasional news about UXSense.">
            <Toggle checked={productUpdates} onChange={setProductUpdates} />
          </Row>
        </Card>

        <Card>
          <CardHeader title="Account" subtitle="Your profile" icon={UserIcon} />
          {isAuthed ? (
            <>
              <Row title="Name">
                <span className="text-sm text-content-muted">{user?.full_name || "—"}</span>
              </Row>
              <Row title="Email">
                <span className="text-sm text-content-muted">{user?.email}</span>
              </Row>
            </>
          ) : (
            <p className="py-4 text-sm text-content-muted">
              You are exploring the demo. Sign in to manage a real account and projects.
            </p>
          )}
        </Card>
      </div>
    </>
  );
}
