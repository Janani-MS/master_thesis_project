import { z } from "zod";

/**
 * Validation schema for creating a project. Kept intentionally minimal for
 * the MVP: a required name and an optional description.
 */
export const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  description: z.string().trim().max(2000).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
