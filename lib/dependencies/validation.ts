import { z } from "zod";

/**
 * Validation for creating a dependency between two backlog items.
 * Semantics: `fromItemId` depends on `toItemId` (fromItem is blocked
 * until toItem is done). Self-dependency, cross-project references, and
 * duplicates are rejected at the query/route level where the actual
 * backlog items can be looked up.
 */
export const createDependencySchema = z.object({
  fromItemId: z.string().trim().min(1, "fromItemId is required"),
  toItemId: z.string().trim().min(1, "toItemId is required"),
});

export type CreateDependencyInput = z.infer<typeof createDependencySchema>;
