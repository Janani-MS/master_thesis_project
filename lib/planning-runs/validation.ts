// validation.ts
//
// Validates the JSON snapshots stored on a PlanningRun row. The stored
// prioritizedItems/recommendedItems/excludedItems columns are written by
// lib/planning-runs/queries.ts directly from an already-validated
// PlanningResult (see lib/planning/validators.ts), but are re-validated
// here on the way out of the database so a saved run can never be
// displayed with a malformed shape.

import { z } from "zod";
import { scoredBacklogItemSchema } from "@/lib/planning/validators";

export const planningRunItemsSchema = z.array(scoredBacklogItemSchema);

export type PlanningRunItems = z.infer<typeof planningRunItemsSchema>;
