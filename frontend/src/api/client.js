import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const TOKEN_KEY = "uxsense.access";
export const REFRESH_KEY = "uxsense.refresh";

export const tokens = {
  get access() {
    return localStorage.getItem(TOKEN_KEY);
  },
  get refresh() {
    return localStorage.getItem(REFRESH_KEY);
  },
  set({ access_token, refresh_token }) {
    if (access_token) localStorage.setItem(TOKEN_KEY, access_token);
    if (refresh_token) localStorage.setItem(REFRESH_KEY, refresh_token);
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const access = tokens.access;
  if (access) config.headers.Authorization = `Bearer ${access}`;
  return config;
});

let refreshing = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    if (status === 401 && !original._retry && tokens.refresh) {
      original._retry = true;
      try {
        refreshing =
          refreshing ||
          axios.post(`${BASE_URL}/api/v1/auth/refresh`, {
            refresh_token: tokens.refresh,
          });
        const { data } = await refreshing;
        refreshing = null;
        tokens.set(data);
        original.headers.Authorization = `Bearer ${data.access_token}`;
        return api(original);
      } catch (e) {
        refreshing = null;
        tokens.clear();
      }
    }
    return Promise.reject(error);
  }
);

export function apiErrorMessage(error) {
  const data = error?.response?.data;
  if (data?.error?.message) return data.error.message;
  if (data?.detail) {
    if (Array.isArray(data.detail)) return data.detail[0]?.msg || "Invalid input";
    return data.detail;
  }
  if (error?.message === "Network Error")
    return "Can't reach the API. Is the backend running on " + BASE_URL + "?";
  return "Something went wrong. Please try again.";
}
