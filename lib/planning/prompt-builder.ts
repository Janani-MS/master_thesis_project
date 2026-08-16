// prompt-builder.ts
//
// Builds the structured payload that will be sent to the OpenAI API in a
// future iteration. For this v1, no request is actually sent - assembling
// the payload now keeps the shape of that future model input stable and
// lets it be inspected/tested independently of any model integration.

import type { ScoredBacklogItem } from "./scoring";

export interface PlanningPromptPayload {
  project: { id: string; name: string };
  sprintContext: {
    name: string;
    sprintGoal: string | null;
    teamCapacityPoints: number;
    availableDays: number | null;
    teamSize: number | null;
    notes: string | null;
  };
  candidateItems: Array<{
    id: string;
    title: string;
    priority: ScoredBacklogItem["priority"];
    status: ScoredBacklogItem["status"];
    storyPoints: number | null;
    score: number;
    isBlocked: boolean;
    blockedByTitles: string[];
  }>;
  instructions: string;
}

/**
 * Assembles the structured input payload for the planning prompt. This is
 * the single place that a future OpenAI call in orchestrator.ts will read
 * from - only the structured data is built here, no prompt string is
 * constructed yet, so the payload shape can be validated and tested on
 * its own before any model call is wired up.
 */
export function buildPlanningPromptPayload(
  project: { id: string; name: string },
  sprintContext: PlanningPromptPayload["sprintContext"],
  scoredItems: ScoredBacklogItem[],
): PlanningPromptPayload {
  return {
    project,
    sprintContext,
    candidateItems: scoredItems.map((item) => ({
      id: item.id,
      title: item.title,
      priority: item.priority,
      status: item.status,
      storyPoints: item.storyPoints,
      score: item.score,
      isBlocked: item.isBlocked,
      blockedByTitles: item.blockedByTitles,
    })),
    instructions:
      "Recommend a feasible sprint scope from candidateItems, respecting " +
      "teamCapacityPoints, excluding blocked items where possible, and " +
      "explaining the reasoning.",
  };
}
