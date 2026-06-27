import { useQuery } from "@tanstack/react-query";
import { getRecommendations, getCode, getBeforeAfter } from "../api/studio";

export function useRecommendations(token) {
  return useQuery({
    queryKey: ["studio", "recommendations", token],
    queryFn: () => getRecommendations(token),
    enabled: !!token,
  });
}

export function useCode(token, issueId) {
  return useQuery({
    queryKey: ["studio", "code", token, issueId],
    queryFn: () => getCode(token, issueId),
    enabled: !!token && !!issueId,
  });
}

export function useBeforeAfter(token, issueId) {
  return useQuery({
    queryKey: ["studio", "before-after", token, issueId],
    queryFn: () => getBeforeAfter(token, issueId),
    enabled: !!token && !!issueId,
  });
}
