import { useQuery } from "@tanstack/react-query";
import { listAudits, getTrends, getWcag } from "../api/audits";

export function useAuditsList() {
  return useQuery({
    queryKey: ["audits", "list"],
    queryFn: listAudits,
    staleTime: 10_000,
  });
}

export function useAuditTrends() {
  return useQuery({
    queryKey: ["audits", "trends"],
    queryFn: getTrends,
    staleTime: 10_000,
  });
}

export function useWcagReport(token) {
  return useQuery({
    queryKey: ["audits", "wcag", token],
    queryFn: () => getWcag(token),
    enabled: !!token,
  });
}
