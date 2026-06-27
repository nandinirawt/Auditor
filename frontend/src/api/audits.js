import { api } from "./client";

// Captures real screenshots of a URL via the backend (Playwright).
// Returns { url, final_url, title, screenshots: [{ device, url, width, file_size }] }
export async function runScreenshots(url) {
  const { data } = await api.post("/api/v1/screenshots", { url });
  return data;
}
