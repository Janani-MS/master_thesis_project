"use client";

import { useState } from "react";
import {
  backlogItemPriorityValues,
  backlogItemStatusValues,
  backlogItemTypeValues,
} from "@/lib/backlog/validation";

export type BacklogItemDto = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  type: (typeof backlogItemTypeValues)[number];
  priority: (typeof backlogItemPriorityValues)[number];
  storyPoints: number | null;
  status: (typeof backlogItemStatusValues)[number];
  createdAt: string;
  updatedAt: string;
};

const typeLabels: Record<BacklogItemDto["type"], string> = {
  FEATURE: "Feature",
  BUG: "Bug",
  TECH_DEBT: "Tech Debt",
  CHORE: "Chore",
};

const priorityLabels: Record<BacklogItemDto["priority"], string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

const statusLabels: Record<BacklogItemDto["status"], string> = {
  BACKLOG: "Backlog",
  READY: "Ready",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

interface BacklogItemFormProps {
  projectId: string;
  initialItem?: BacklogItemDto;
  onSaved: (item: BacklogItemDto) => void;
  onCancel?: () => void;
}

/**
 * Create/edit form for a backlog item. In create mode it posts to the
 * project's backlog endpoint; in edit mode it patches the specific item.
 */
export function BacklogItemForm({
  projectId,
  initialItem,
  onSaved,
  onCancel,
}: BacklogItemFormProps) {
  const isEditMode = Boolean(initialItem);

  const [title, setTitle] = useState(initialItem?.title ?? "");
  const [description, setDescription] = useState(
    initialItem?.description ?? "",
  );
  const [type, setType] = useState<BacklogItemDto["type"]>(
    initialItem?.type ?? "FEATURE",
  );
  const [priority, setPriority] = useState<BacklogItemDto["priority"]>(
    initialItem?.priority ?? "MEDIUM",
  );
  const [storyPoints, setStoryPoints] = useState(
    initialItem?.storyPoints != null ? String(initialItem.storyPoints) : "",
  );
  const [status, setStatus] = useState<BacklogItemDto["status"]>(
    initialItem?.status ?? "BACKLOG",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload = {
      title,
      description,
      type,
      priority,
      status,
      storyPoints: storyPoints === "" ? undefined : Number(storyPoints),
    };

    try {
      const response = await fetch(
        isEditMode
          ? `/api/backlog-items/${initialItem!.id}`
          : `/api/projects/${projectId}/backlog`,
        {
          method: isEditMode ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Failed to save backlog item.");
        return;
      }

      onSaved(data.item);

      if (!isEditMode) {
        setTitle("");
        setDescription("");
        setType("FEATURE");
        setPriority("MEDIUM");
        setStoryPoints("");
        setStatus("BACKLOG");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-zinc-700"
        >
          Title
        </label>
        <input
          id="title"
          type="text"
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
          placeholder="e.g. Add password reset flow"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-zinc-700"
        >
          Description (optional)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={2}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
          placeholder="Short summary of this backlog item"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label
            htmlFor="type"
            className="block text-sm font-medium text-zinc-700"
          >
            Type
          </label>
          <select
            id="type"
            value={type}
            onChange={(event) =>
              setType(event.target.value as BacklogItemDto["type"])
            }
            className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-2 text-sm focus:border-zinc-500 focus:outline-none"
          >
            {backlogItemTypeValues.map((value) => (
              <option key={value} value={value}>
                {typeLabels[value]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="priority"
            className="block text-sm font-medium text-zinc-700"
          >
            Priority
          </label>
          <select
            id="priority"
            value={priority}
            onChange={(event) =>
              setPriority(event.target.value as BacklogItemDto["priority"])
            }
            className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-2 text-sm focus:border-zinc-500 focus:outline-none"
          >
            {backlogItemPriorityValues.map((value) => (
              <option key={value} value={value}>
                {priorityLabels[value]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="storyPoints"
            className="block text-sm font-medium text-zinc-700"
          >
            Story points
          </label>
          <input
            id="storyPoints"
            type="number"
            min={0}
            max={100}
            value={storyPoints}
            onChange={(event) => setStoryPoints(event.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-2 text-sm focus:border-zinc-500 focus:outline-none"
            placeholder="e.g. 5"
          />
        </div>

        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-zinc-700"
          >
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as BacklogItemDto["status"])
            }
            className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-2 text-sm focus:border-zinc-500 focus:outline-none"
          >
            {backlogItemStatusValues.map((value) => (
              <option key={value} value={value}>
                {statusLabels[value]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="self-start rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {isSubmitting
            ? "Saving..."
            : isEditMode
              ? "Save changes"
              : "Add backlog item"}
        </button>

        {isEditMode && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="self-start rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export { typeLabels, priorityLabels, statusLabels };
