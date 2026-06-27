import { useQuery } from "@tanstack/react-query";
import * as mock from "../lib/mockData";

// Mock-backed for now. When the Phase 3 audit endpoints exist, replace each
// queryFn with the matching GET /api/v1/audits/... call — the component API
// stays identical.
const wait = (data, ms = 500) =>
  new Promise((resolve) => setTimeout(() => resolve(data), ms));

export const useAuditOverview = () =>
  useQuery({ queryKey: ["audit", "overview"], queryFn: () => wait({ audit: mock.sampleAudit, performance: mock.performance }) });

export const useFindings = () =>
  useQuery({ queryKey: ["audit", "findings"], queryFn: () => wait(mock.findings) });

export const useWcag = () =>
  useQuery({ queryKey: ["audit", "wcag"], queryFn: () => wait(mock.wcag) });

export const useJourney = () =>
  useQuery({ queryKey: ["audit", "journey"], queryFn: () => wait(mock.journey) });

export const useHistory = () =>
  useQuery({ queryKey: ["audit", "history"], queryFn: () => wait(mock.history) });
