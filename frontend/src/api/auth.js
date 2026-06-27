import { api, tokens } from "./client";

export async function registerRequest({ email, password, full_name }) {
  const { data } = await api.post("/api/v1/auth/register", {
    email,
    password,
    full_name: full_name || null,
  });
  return data;
}

export async function loginRequest({ email, password }) {
  // Backend login uses an OAuth2 form (username = email).
  const form = new URLSearchParams();
  form.append("username", email);
  form.append("password", password);
  const { data } = await api.post("/api/v1/auth/login", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  tokens.set(data);
  return data;
}

export async function meRequest() {
  const { data } = await api.get("/api/v1/auth/me");
  return data;
}

export async function logoutRequest() {
  const refresh = tokens.refresh;
  try {
    if (refresh) await api.post("/api/v1/auth/logout", { refresh_token: refresh });
  } finally {
    tokens.clear();
  }
}
