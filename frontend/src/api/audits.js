import { api } from "./client";

// Captures real screenshots + accessibility of a URL via the backend (Playwright).
export async function runScreenshots(url) {
  const { data } = await api.post("/api/v1/screenshots", { url });
  return data;
}

// Audit History + selector
export async function listAudits() {
  const { data } = await api.get("/api/v1/audits");
  return data; // { count, audits: [...] }
}

export async function getAudit(token) {
  const { data } = await api.get(`/api/v1/audits/${token}`);
  return data; // full stored audit
}

export async function deleteAudit(token) {
  const { data } = await api.delete(`/api/v1/audits/${token}`);
  return data;
}

export async function getTrends() {
  const { data } = await api.get("/api/v1/audits/trends");
  return data; // { count, series: [...] }
}

export async function getWcag(token) {
  const { data } = await api.get(`/api/v1/audits/${token}/wcag`);
  return data; // { wcag, trend, score, domain }
}
