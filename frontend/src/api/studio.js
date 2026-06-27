import { api } from "./client";

// All three AI Studio pages consume the same stored audit (by token) and the
// same issue objects, so selecting an issue drives code + live before/after.
export async function getRecommendations(token) {
  const { data } = await api.get(`/api/v1/audits/${token}/recommendations`);
  return data;
}

export async function getCode(token, issueId) {
  const { data } = await api.get(`/api/v1/audits/${token}/code/${encodeURIComponent(issueId)}`);
  return data;
}

export async function getBeforeAfter(token, issueId) {
  const { data } = await api.get(`/api/v1/audits/${token}/before-after/${encodeURIComponent(issueId)}`);
  return data;
}

// Live render: reopens the page, injects the fix, re-screenshots and re-scans.
export async function renderPreview(token, issueId) {
  const { data } = await api.post(`/api/v1/audits/${token}/preview/${encodeURIComponent(issueId)}`);
  return data;
}

export async function getCachedPreview(token, issueId) {
  const { data } = await api.get(`/api/v1/audits/${token}/preview/${encodeURIComponent(issueId)}`);
  return data;
}
