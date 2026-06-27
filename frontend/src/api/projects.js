import { api } from "./client";

export async function listProjects({ page = 1, size = 20 } = {}) {
  const { data } = await api.get("/api/v1/projects", { params: { page, size } });
  return data;
}

export async function createProject(payload) {
  const { data } = await api.post("/api/v1/projects", payload);
  return data;
}

export async function deleteProject(id) {
  const { data } = await api.delete(`/api/v1/projects/${id}`);
  return data;
}
