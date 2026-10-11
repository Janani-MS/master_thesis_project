"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DeleteProjectButton } from "@/components/delete-project-button";

interface ProjectListItem {
  id: string;
  name: string;
  description: string | null;
}

interface ProjectListProps {
  projects: ProjectListItem[];
  wasDeleted: boolean;
  deletedProjectName?: string;
}

export function ProjectList({
  projects,
  wasDeleted,
  deletedProjectName,
}: ProjectListProps) {
  const router = useRouter();
  const [deletedProjectIds, setDeletedProjectIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [toastMessage, setToastMessage] = useState(
    wasDeleted
      ? deletedProjectName
        ? `Project ${deletedProjectName} was deleted successfully.`
        : "Project deleted successfully."
      : null,
  );
  const visibleProjects = projects.filter(
    (project) => !deletedProjectIds.has(project.id),
  );

  useEffect(() => {
    if (!toastMessage) return;

    const timeoutId = window.setTimeout(() => setToastMessage(null), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  function handleDeleted(projectId: string, projectName: string) {
    setDeletedProjectIds((current) => new Set(current).add(projectId));
    setToastMessage(`Project ${projectName} was deleted successfully.`);
    router.refresh();
  }

  return (
    <>
      {toastMessage && (
        <div
          className="project-delete-toast fixed right-4 top-4 z-50 flex max-w-[calc(100vw-2rem)] items-center gap-4 rounded-lg border border-green-200 bg-white px-4 py-3 text-sm text-green-800 shadow-lg"
          role="status"
          aria-live="polite"
        >
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="rounded-md px-2 py-1 font-medium text-green-800 hover:bg-green-50"
          >
            OK
          </button>
        </div>
      )}

      {visibleProjects.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-500">
          No projects yet. Use the form to create your first project.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-zinc-200">
          {visibleProjects.map((project) => (
            <li key={project.id} className="py-3">
              <div className="flex items-start justify-between gap-3">
                <Link
                  href={`/projects/${project.id}`}
                  className="min-w-0 wrap-break-word text-sm font-medium text-zinc-900 hover:underline"
                >
                  {project.name}
                </Link>
                <DeleteProjectButton
                  projectId={project.id}
                  projectName={project.name}
                  onDeleted={handleDeleted}
                />
              </div>
              {project.description && (
                <p className="mt-1 text-sm text-zinc-500">
                  {project.description}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
