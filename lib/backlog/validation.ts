import { z } from "zod";

/**
 * Enum value lists kept in sync with the Prisma schema. Defined here (not
 * imported from the generated client) so this module has no dependency on
 * Prisma internals and can be reused directly by client components.
 */
export const backlogItemTypeValues = [
  "FEATURE",
  "BUG",
  "TECH_DEBT",
  "CHORE",
] as const;

export const backlogItemPriorityValues = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
] as const;

export const backlogItemStatusValues = [
  "BACKLOG",
  "READY",
  "IN_PROGRESS",
  "DONE",
] as const;

const typeSchema = z.enum(backlogItemTypeValues);
const prioritySchema = z.enum(backlogItemPriorityValues);
const statusSchema = z.enum(backlogItemStatusValues);

/**
 * Validation schema for creating a backlog item. Uses `.default()` so
 * omitted fields fall back to sensible values.
 */
export const createBacklogItemSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(2000).optional(),
  type: typeSchema.default("FEATURE"),
  priority: prioritySchema.default("MEDIUM"),
  storyPoints: z.number().int().min(0).max(100).optional(),
  status: statusSchema.default("BACKLOG"),
});

export type CreateBacklogItemInput = z.infer<typeof createBacklogItemSchema>;

/**
 * Validation schema for updating a backlog item. Every field is plainly
 * optional (no `.default()`), so an omitted field means "leave unchanged"
 * rather than being silently overwritten with a default value.
 */
export const updateBacklogItemSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  type: typeSchema.optional(),
  priority: prioritySchema.optional(),
  storyPoints: z.number().int().min(0).max(100).optional(),
  status: statusSchema.optional(),
});

export type UpdateBacklogItemInput = z.infer<typeof updateBacklogItemSchema>;
