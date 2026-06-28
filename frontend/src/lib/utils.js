import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function scoreBand(score) {
  if (score == null) return { label: "—", color: "#66728A", key: "none", grade: "—" };
  if (score >= 90) return { label: "Excellent", color: "#34D399", key: "good", grade: "A" };
  if (score >= 75) return { label: "Good", color: "#A3E635", key: "ok", grade: "B" };
  if (score >= 50) return { label: "Needs work", color: "#FBBF24", key: "warn", grade: "C" };
  return { label: "Poor", color: "#FB7185", key: "bad", grade: "D" };
}

export const severityMeta = {
  critical: { label: "Critical", color: "#FB7185", weight: 4 },
  serious: { label: "Serious", color: "#FB923C", weight: 3 },
  moderate: { label: "Moderate", color: "#FBBF24", weight: 2 },
  minor: { label: "Minor", color: "#64748B", weight: 1 },
};

export function formatMs(ms) {
  if (ms == null) return "—";
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)} s`;
  return `${Math.round(ms)} ms`;
}

// Real overall score: weighted blend of the signals we actually measure today
// (accessibility 60%, WCAG 40%). Mirrors the backend formula; used as a fallback
// for audits saved before the backend stored `overall`.
export function overallScore(accessibility, wcag) {
  if (accessibility == null) return null;
  const w = wcag == null ? accessibility : wcag;
  return Math.round(0.6 * accessibility + 0.4 * w);
}
