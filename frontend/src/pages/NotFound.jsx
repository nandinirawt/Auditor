import { Link } from "react-router-dom";
import { Logo } from "../components/layout/Logo";
import { Button } from "../components/ui/Button";

export default function NotFound() {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-5 text-center">
      <div className="pointer-events-none absolute inset-0 bg-grid-faint [background-size:54px_54px] opacity-30" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-80 w-80 -translate-x-1/2 rounded-full bg-iris/15 blur-[120px]" />
      <div className="absolute left-6 top-6"><Logo /></div>
      <div className="relative">
        <div className="font-display text-7xl font-semibold gradient-text">404</div>
        <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-content">Page not found</h1>
        <p className="mt-2 text-sm text-content-muted">That route doesn't exist in UXSense.</p>
        <div className="mt-6 flex justify-center gap-2">
          <Link to="/"><Button>Back to home</Button></Link>
          <Link to="/dashboard"><Button variant="secondary">Open dashboard</Button></Link>
        </div>
      </div>
    </div>
  );
}
