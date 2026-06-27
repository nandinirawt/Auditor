import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FolderKanban, Plus, Trash2, Globe, Lock } from "lucide-react";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { Skeleton } from "../../components/ui/Skeleton";
import { useAuth } from "../../context/AuthContext";
import { useProjects, useCreateProject, useDeleteProject } from "../../hooks/useProjects";
import { apiErrorMessage } from "../../api/client";

function CreateForm() {
  const [form, setForm] = useState({ name: "", url: "", description: "" });
  const [error, setError] = useState("");
  const create = useCreateProject();
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await create.mutateAsync({
        name: form.name,
        url: form.url,
        description: form.description || null,
      });
      setForm({ name: "", url: "", description: "" });
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  return (
    <Card>
      <h3 className="mb-4 font-display text-sm font-semibold text-content">New project</h3>
      <form onSubmit={onSubmit} className="space-y-3">
        <Input id="p-name" label="Name" placeholder="Lumio storefront" value={form.name} onChange={set("name")} required />
        <Input id="p-url" label="Website URL" placeholder="https://lumio.store" value={form.url} onChange={set("url")} required />
        <Input id="p-desc" label="Description" placeholder="Optional" value={form.description} onChange={set("description")} />
        {error && (
          <div className="rounded-lg border border-critical/30 bg-critical/10 px-3 py-2 text-xs text-critical">{error}</div>
        )}
        <Button type="submit" className="w-full" loading={create.isPending}>
          <Plus size={15} /> Create project
        </Button>
      </form>
    </Card>
  );
}

function ProjectCard({ project }) {
  const del = useDeleteProject();
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="card flex items-start justify-between gap-3 p-4"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line bg-ink-800 text-iris-bright">
            <Globe size={15} />
          </span>
          <div className="min-w-0">
            <h4 className="truncate font-display text-sm font-semibold text-content">{project.name}</h4>
            <a
              href={project.url}
              target="_blank"
              rel="noreferrer"
              className="truncate font-mono text-[11px] text-content-muted hover:text-iris-bright"
            >
              {project.domain || project.url}
            </a>
          </div>
        </div>
        {project.description && <p className="mt-2 text-xs text-content-muted">{project.description}</p>}
      </div>
      <button
        onClick={() => del.mutate(project.id)}
        disabled={del.isPending}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-content-dim transition-colors hover:bg-critical/10 hover:text-critical disabled:opacity-50"
        aria-label="Delete project"
      >
        <Trash2 size={15} />
      </button>
    </motion.div>
  );
}

export default function Projects() {
  const { isAuthed } = useAuth();
  const { data, isLoading, isError, error } = useProjects({ enabled: isAuthed });

  if (!isAuthed) {
    return (
      <>
        <PageHeader eyebrow="Workspace" title="Projects" description="Save the sites you audit and revisit them anytime." />
        <EmptyState
          icon={Lock}
          title="Sign in to manage projects"
          body="Projects sync with your UXSense account through the live backend. Sign in or create an account to continue."
          action={
            <div className="flex gap-2">
              <Link to="/login"><Button>Sign in</Button></Link>
              <Link to="/register"><Button variant="secondary">Create account</Button></Link>
            </div>
          }
        />
      </>
    );
  }

  const projects = data?.items || data?.results || [];

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Projects"
        description="Connected to your backend — create, list, and delete are live."
      />
      <div className="grid gap-5 lg:grid-cols-[20rem_1fr] lg:items-start">
        <CreateForm />
        <div>
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
            </div>
          ) : isError ? (
            <EmptyState
              icon={FolderKanban}
              title="Couldn't load projects"
              body={apiErrorMessage(error)}
            />
          ) : projects.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="No projects yet"
              body="Create your first project with the form on the left."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <AnimatePresence>
                {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
