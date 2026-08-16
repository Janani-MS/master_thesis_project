"use client";

import { useState } from "react";
import type { BacklogItemDto } from "@/components/backlog-item-form";

/**
 * A dependency row means `fromItem` depends on `toItem`: fromItem is
 * blocked until toItem is done. `fromItem`/`toItem` are a snapshot of
 * title/status at fetch time; callers should prefer looking up current
 * item data by id when it's available (e.g. after edits).
 */
export type BacklogDependencyDto = {
  id: string;
  fromItemId: string;
  toItemId: string;
  createdAt: string;
  fromItem: { id: string; title: string; status: BacklogItemDto["status"] };
  toItem: { id: string; title: string; status: BacklogItemDto["status"] };
};

interface DependencyManagerProps {
  projectId: string;
  items: BacklogItemDto[];
  dependencies: BacklogDependencyDto[];
  onCreated: (dependency: BacklogDependencyDto) => void;
  onDeleted: (id: string) => void;
}

/**
 * Simple form + list for defining and removing dependencies between
 * backlog items within a single project. Kept deliberately minimal: a
 * flat list, no graph visualization, no inference.
 */
export function DependencyManager({
  projectId,
  items,
  dependencies,
  onCreated,
  onDeleted,
}: DependencyManagerProps) {
  const [fromItemId, setFromItemId] = useState("");
  const [toItemId, setToItemId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const itemsById = new Map(items.map((item) => [item.id, item]));

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!fromItemId || !toItemId) {
      setError("Select both items.");
      return;
    }
    if (fromItemId === toItemId) {
      setError("An item cannot depend on itself.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/dependencies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromItemId, toItemId }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Failed to create dependency.");
        return;
      }

      onCreated(data.dependency);
      setFromItemId("");
      setToItemId("");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    setDeletingId(id);

    try {
      const response = await fetch(`/api/dependencies/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? "Failed to remove dependency.");
        return;
      }

      onDeleted(id);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  if (items.length < 2) {
    return (
      <p className="text-sm text-zinc-500">
        Add at least two backlog items to define dependencies between them.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div>
          <label
            htmlFor="fromItemId"
            className="block text-sm font-medium text-zinc-700"
          >
            This item
          </label>
          <select
            id="fromItemId"
            value={fromItemId}
            onChange={(event) => setFromItemId(event.target.value)}
            className="mt-1 rounded-md border border-zinc-300 px-2 py-2 text-sm focus:border-zinc-500 focus:outline-none"
          >
            <option value="">Select item...</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="toItemId"
            className="block text-sm font-medium text-zinc-700"
          >
            depends on
          </label>
          <select
            id="toItemId"
            value={toItemId}
            onChange={(event) => setToItemId(event.target.value)}
            className="mt-1 rounded-md border border-zinc-300 px-2 py-2 text-sm focus:border-zinc-500 focus:outline-none"
          >
            <option value="">Select item...</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {isSubmitting ? "Adding..." : "Add dependency"}
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {dependencies.length === 0 ? (
        <p className="text-sm text-zinc-500">No dependencies defined yet.</p>
      ) : (
        <ul className="flex flex-col gap-2 text-sm">
          {dependencies.map((dependency) => {
            const fromTitle =
              itemsById.get(dependency.fromItemId)?.title ??
              dependency.fromItem.title;
            const toTitle =
              itemsById.get(dependency.toItemId)?.title ??
              dependency.toItem.title;

            return (
              <li
                key={dependency.id}
                className="flex items-center justify-between gap-3 rounded-md border border-zinc-200 px-3 py-2"
              >
                <span>
                  <span className="font-medium text-zinc-900">{fromTitle}</span>{" "}
                  depends on{" "}
                  <span className="font-medium text-zinc-900">{toTitle}</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(dependency.id)}
                  disabled={deletingId === dependency.id}
                  className="shrink-0 text-red-600 hover:underline disabled:opacity-50"
                >
                  {deletingId === dependency.id ? "Removing..." : "Remove"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
