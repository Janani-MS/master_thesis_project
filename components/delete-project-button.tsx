"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DeleteProjectButtonProps {
  projectId: string;
  projectName: string;
  onDeleted?: (projectId: string, projectName: string) => void;
  redirectOnDelete?: boolean;
}

export function DeleteProjectButton({
  projectId,
  projectName,
  onDeleted,
  redirectOnDelete = false,
}: DeleteProjectButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete "${projectName}" permanently? Its backlog items, dependencies, sprint contexts, planning runs, and evaluation scenario will also be deleted.`,
    );

    if (!confirmed) return;

    setError(null);
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Failed to delete project.");
        return;
      }

      if (redirectOnDelete) {
        router.replace(
          `/?deleted=1&deletedProjectName=${encodeURIComponent(projectName)}`,
        );
      } else {
        onDeleted?.(projectId, projectName);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        aria-label={`Delete ${projectName}`}
        className="rounded-md bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
      >
        {isDeleting ? "Deleting..." : "Delete"}
      </button>
      {error && (
        <p className="max-w-64 text-right text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
