import { api } from "./client";

export async function getSuggestions(category) {
  const { data } = await api.get(`/api/v1/benchmark/suggestions`, { params: { category } });
  return data; // { category, suggestions: [{name, url}] }
}

export async function getBenchmark(baseToken) {
  const { data } = await api.get(`/api/v1/benchmark/${baseToken}`);
  return data; // { base, competitors, average, insights, category }
}

// Slow: runs a real browser scan of the competitor. No client timeout.
export async function addCompetitor(baseToken, url, category) {
  const { data } = await api.post(`/api/v1/benchmark/${baseToken}/competitor`, { url, category });
  return data;
}

export async function removeCompetitor(baseToken, token) {
  const { data } = await api.delete(`/api/v1/benchmark/${baseToken}/competitor/${token}`);
  return data;
}
