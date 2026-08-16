"use client";

import { useState } from "react";
import {
  BacklogItemForm,
  priorityLabels,
  statusLabels,
  typeLabels,
  type BacklogItemDto,
} from "@/components/backlog-item-form";
import {
  DependencyManager,
  type BacklogDependencyDto,
} from "@/components/dependency-manager";

interface BacklogWorkspaceProps {
  projectId: string;
  initialItems: BacklogItemDto[];
  initialDependencies: BacklogDependencyDto[];
}

type Readiness = {
  label: string;
  tone: "neutral" | "ready" | "blocked";
};

const readinessToneClasses: Record<Readiness["tone"], string> = {
  neutral: "bg-zinc-100 text-zinc-600",
  ready: "bg-green-100 text-green-700",
  blocked: "bg-amber-100 text-amber-800",
};

/**
 * Computes a basic readiness signal for a backlog item from its
 * dependencies: no dependencies, blocked by unfinished dependencies, or
 * ready (all dependencies done). Looks up current item status by id so
 * the signal stays accurate after edits, rather than relying on the
 * dependency's embedded status snapshot.
 */
function getReadiness(
  itemId: string,
  dependencies: BacklogDependencyDto[],
  itemsById: Map<string, BacklogItemDto>,
): Readiness {
  const dependsOn = dependencies.filter((dep) => dep.fromItemId === itemId);

  if (dependsOn.length === 0) {
    return { label: "No dependencies", tone: "neutral" };
  }

  const blockers = dependsOn.filter((dep) => {
    const blocker = itemsById.get(dep.toItemId);
    return (blocker?.status ?? dep.toItem.status) !== "DONE";
  });

  if (blockers.length > 0) {
    const names = blockers.map(
      (dep) => itemsById.get(dep.toItemId)?.title ?? dep.toItem.title,
    );
    return { label: `Blocked by ${names.join(", ")}`, tone: "blocked" };
  }

  return { label: "Ready", tone: "ready" };
}

/**
 * Manages the backlog list for a project: create form, edit form (inline,
 * reusing the same form component), delete actions, and the dependency
 * manager between items.
 */
export function BacklogWorkspace({
  projectId,
  initialItems,
  initialDependencies,
}: BacklogWorkspaceProps) {
  const [items, setItems] = useState(initialItems);
  const [dependencies, setDependencies] = useState(initialDependencies);
  const [editingItem, setEditingItem] = useState<BacklogItemDto | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const itemsById = new Map(items.map((item) => [item.id, item]));

  function handleCreated(item: BacklogItemDto) {
    setItems((current) => [item, ...current]);
  }

  function handleUpdated(item: BacklogItemDto) {
    setItems((current) => current.map((i) => (i.id === item.id ? item : i)));
    setEditingItem(null);
  }

  function handleDependencyCreated(dependency: BacklogDependencyDto) {
    setDependencies((current) => [dependency, ...current]);
  }

  function handleDependencyDeleted(id: string) {
    setDependencies((current) => current.filter((dep) => dep.id !== id));
  }

  async function handleDelete(id: string) {
    setDeleteError(null);
    setDeletingId(id);

    try {
      const response = await fetch(`/api/backlog-items/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        setDeleteError(data.error ?? "Failed to delete backlog item.");
        return;
      }

      setItems((current) => current.filter((i) => i.id !== id));
      setDependencies((current) =>
        current.filter((dep) => dep.fromItemId !== id && dep.toItemId !== id),
      );
      if (editingItem?.id === id) {
        setEditingItem(null);
      }
    } catch {
      setDeleteError("Something went wrong. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-sm font-medium text-zinc-900">
          {editingItem ? "Edit backlog item" : "Add backlog item"}
        </h3>
        <div className="mt-3">
          <BacklogItemForm
            key={editingItem?.id ?? "create"}
            projectId={projectId}
            initialItem={editingItem ?? undefined}
            onSaved={editingItem ? handleUpdated : handleCreated}
            onCancel={editingItem ? () => setEditingItem(null) : undefined}
          />
        </div>
      </div>

      {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}

      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No backlog items yet. Add the first one above.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead>
              <tr className="text-left text-zinc-500">
                <th className="py-2 pr-4 font-medium">Title</th>
                <th className="py-2 pr-4 font-medium">Type</th>
                <th className="py-2 pr-4 font-medium">Priority</th>
                <th className="py-2 pr-4 font-medium">Points</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Dependencies</th>
                <th className="py-2 pr-4 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {items.map((item) => {
                const readiness = getReadiness(
                  item.id,
                  dependencies,
                  itemsById,
                );
                return (
                  <tr key={item.id}>
                    <td className="py-2 pr-4">
                      <div className="font-medium text-zinc-900">
                        {item.title}
                      </div>
                      {item.description && (
                        <div className="mt-0.5 text-zinc-500">
                          {item.description}
                        </div>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-zinc-700">
                      {typeLabels[item.type]}
                    </td>
                    <td className="py-2 pr-4 text-zinc-700">
                      {priorityLabels[item.priority]}
                    </td>
                    <td className="py-2 pr-4 text-zinc-700">
                      {item.storyPoints ?? "—"}
                    </td>
                    <td className="py-2 pr-4 text-zinc-700">
                      {statusLabels[item.status]}
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${readinessToneClasses[readiness.tone]}`}
                      >
                        {readiness.label}
                      </span>
                    </td>
                    <td className="py-2 pr-4">
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setEditingItem(item)}
                          className="text-zinc-600 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="text-red-600 hover:underline disabled:opacity-50"
                        >
                          {deletingId === item.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div>
        <h3 className="text-sm font-medium text-zinc-900">Dependencies</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Define which backlog items depend on other items being done first.
        </p>
        <div className="mt-3">
          <DependencyManager
            projectId={projectId}
            items={items}
            dependencies={dependencies}
            onCreated={handleDependencyCreated}
            onDeleted={handleDependencyDeleted}
          />
        </div>
      </div>
    </div>
  );
}
