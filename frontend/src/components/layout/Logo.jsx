import { Link } from "react-router-dom";

export function LogoMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6366F1" />
          <stop offset="1" stopColor="#A855F7" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="#0D1220" stroke="rgba(148,163,184,0.18)" />
      <circle cx="16" cy="16" r="9" fill="none" stroke="rgba(148,163,184,0.22)" strokeWidth="3" />
      <circle
        cx="16"
        cy="16"
        r="9"
        fill="none"
        stroke="url(#logo-grad)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="42 57"
        transform="rotate(-90 16 16)"
      />
      <circle cx="16" cy="16" r="2" fill="#A855F7" />
    </svg>
  );
}

export function Logo({ to = "/", className = "" }) {
  return (
    <Link to={to} className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark />
      <span className="font-display text-lg font-semibold tracking-tight text-content">
        <span className="gradient-text">UX</span>Sense
      </span>
    </Link>
  );
}
