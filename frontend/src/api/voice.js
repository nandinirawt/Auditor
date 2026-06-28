import { api } from "./client";

// Generates (or reuses) an audio summary of the audit via smallest.ai TTS.
// Returns { audio_url, text, cached }. Throws on 503 when no API key is set.
export async function getNarration(token, force = false) {
  const { data } = await api.post(`/api/v1/audit/${token}/narration`, null, { params: { force } });
  return data;
}
