import { useEffect, useRef, useState } from "react";
import { scoreBand } from "../../lib/utils";

export function AnimatedNumber({ value, duration = 900, className }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(0);
  useEffect(() => {
    if (value == null) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setDisplay(value);
      return;
    }
    let raf;
    const start = performance.now();
    const from = ref.current;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(from + (value - from) * eased);
      setDisplay(next);
      if (t < 1) raf = requestAnimationFrame(tick);
      else ref.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span className={className}>{value == null ? "—" : display}</span>;
}

export function ScoreRing({ score, size = 120, stroke = 9, label }) {
  const band = scoreBand(score);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = score == null ? 0 : Math.max(0, Math.min(100, score)) / 100;
  const id = `ring-${Math.round(Math.random() * 1e6)}`;

  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={band.color} />
            <stop offset="100%" stopColor="#A855F7" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - c * pct}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <AnimatedNumber
          value={score}
          className="font-mono text-2xl font-semibold tabular-nums text-content"
        />
        {label && <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-content-dim">{label}</span>}
      </div>
    </div>
  );
}

export function MiniGauge({ score, label }) {
  const band = scoreBand(score);
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-12 w-12">
        <ScoreRing score={score} size={48} stroke={5} />
      </div>
      <div>
        <div className="font-mono text-sm font-semibold text-content">{score ?? "—"}</div>
        <div className="text-[11px] text-content-muted">{label}</div>
        <div className="text-[10px]" style={{ color: band.color }}>{band.label}</div>
      </div>
    </div>
  );
}
