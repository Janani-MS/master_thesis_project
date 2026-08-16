import { z } from "zod";

/**
 * Validation for creating a sprint context. Kept intentionally minimal:
 * a name and a team capacity are required, everything else that helps
 * describe the sprint (goal, days, team size, notes) is optional. No
 * planning-specific fields (e.g. selected items) are modeled here yet.
 */
export const createSprintContextSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  sprintGoal: z.string().trim().max(500).optional(),
  teamCapacityPoints: z.number().int().min(0).max(1000),
  availableDays: z.number().int().min(0).max(60).optional(),
  teamSize: z.number().int().min(0).max(100).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export type CreateSprintContextInput = z.infer<
  typeof createSprintContextSchema
>;
