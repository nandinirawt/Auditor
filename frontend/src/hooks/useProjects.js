import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listProjects, createProject, deleteProject } from "../api/projects";

export function useProjects({ enabled = true } = {}) {
  return useQuery({
    queryKey: ["projects"],
    queryFn: () => listProjects({ page: 1, size: 50 }),
    enabled,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}
