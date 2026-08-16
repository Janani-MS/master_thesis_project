// validators.ts
//
// Zod schemas for the planning feature: validates the API request payload
// and the structured planning result before it is returned to the client.
// The same output schema (`planningResultSchema`) is already shaped to
// match what a future OpenAI structured response must conform to, so
// swapping the rule-based placeholder for a real model call later does
// not require changing this contract.

import { z } from "zod";
import {
  backlogItemPriorityValues,
  backlogItemStatusValues,
} from "@/lib/backlog/validation";

export const planRequestSchema = z.object({
  sprintContextId: z.string().trim().min(1, "sprintContextId is required"),
});

export type PlanRequestInput = z.infer<typeof planRequestSchema>;

export const scoredBacklogItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  priority: z.enum(backlogItemPriorityValues),
  status: z.enum(backlogItemStatusValues),
  storyPoints: z.number().int().nullable(),
  score: z.number(),
  isBlocked: z.boolean(),
  blockedByTitles: z.array(z.string()),
});

export const planningResultSchema = z.object({
  sprintContext: z.object({
    id: z.string(),
    name: z.string(),
    sprintGoal: z.string().nullable(),
    teamCapacityPoints: z.number().int(),
    availableDays: z.number().int().nullable(),
    teamSize: z.number().int().nullable(),
  }),
  prioritizedItems: z.array(scoredBacklogItemSchema),
  recommendedItems: z.array(scoredBacklogItemSchema),
  excludedItems: z.array(scoredBacklogItemSchema),
  rationaleSummary: z.string(),
  riskFlags: z.array(z.string()),
  // Makes the result source explicit so the UI and thesis evaluation can
  // tell an OpenAI-generated recommendation apart from the deterministic
  // rule-based fallback that is used whenever the model call fails or its
  // output does not validate.
  generatedBy: z.enum(["openai-v1", "rule-based-v1-fallback"]),
});

export type PlanningResult = z.infer<typeof planningResultSchema>;

// Structured JSON shape requested from the OpenAI model. Deliberately
// narrower than `planningResultSchema`: the model only decides *which*
// candidate items to recommend/exclude and *why* - it is not asked to
// reproduce scores, statuses, or the sprint context, since those are
// already known deterministically and re-deriving them would only add
// room for the model to hallucinate or drift from the real data. The
// orchestrator maps this decision back onto the deterministic
// `ScoredBacklogItem` list before building the final `PlanningResult`.
export const aiPlanningDecisionSchema = z.object({
  recommendedItemIds: z.array(z.string()),
  excludedItemIds: z.array(z.string()),
  rationaleSummary: z.string(),
  riskFlags: z.array(z.string()),
});

export type AiPlanningDecision = z.infer<typeof aiPlanningDecisionSchema>;
