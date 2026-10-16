// orchestrator.ts
//
// Coordinates the planning workflow: scoring, prompt-payload construction,
// the OpenAI call, response validation, and mapping into the
// persistence-ready result contract.
//
// The deterministic, rule-based recommendation remains the baseline and
// fallback: it always runs first, and its output is used whenever the
// OpenAI call is not configured, fails, or returns output that does not
// validate. This keeps the feature usable and testable with no API key,
// and keeps the AI layer a thin, replaceable addition on top of the
// existing deterministic pipeline rather than a hard dependency.

import OpenAI from "openai";
import {
  scoreBacklogItems,
  type BacklogItemInput,
  type DependencyInput,
  type ScoredBacklogItem,
} from "./scoring";
import {
  buildPlanningPromptPayload,
  type PlanningPromptPayload,
} from "./prompt-builder";
import {
  planningResultSchema,
  aiPlanningDecisionSchema,
  type PlanningResult,
  type AiPlanningDecision,
} from "./validators";

export interface RunPlanningInput {
  project: { id: string; name: string };
  sprintContext: {
    id: string;
    name: string;
    sprintGoal: string | null;
    teamCapacityPoints: number;
    availableDays: number | null;
    teamSize: number | null;
    notes: string | null;
  };
  backlogItems: BacklogItemInput[];
  dependencies: DependencyInput[];
}

/**
 * Runs the planning pipeline for a single sprint context:
 * 1. score and rank backlog items (scoring.ts)
 * 2. build the structured prompt payload (prompt-builder.ts)
 * 3. build the deterministic rule-based recommendation (baseline/fallback)
 * 4. attempt an OpenAI call for a model-based recommendation; validate its
 *    structured output before trusting it
 * 5. use the OpenAI recommendation if valid, otherwise fall back to the
 *    deterministic one
 * 6. validate the final result against the shared output schema
 *    (validators.ts) before returning it
 */
export async function runPlanningOrchestration(
  input: RunPlanningInput,
): Promise<PlanningResult> {
  const scoredItems = scoreBacklogItems(input.backlogItems, input.dependencies);

  const promptPayload = buildPlanningPromptPayload(
    input.project,
    {
      name: input.sprintContext.name,
      sprintGoal: input.sprintContext.sprintGoal,
      teamCapacityPoints: input.sprintContext.teamCapacityPoints,
      availableDays: input.sprintContext.availableDays,
      teamSize: input.sprintContext.teamSize,
      notes: input.sprintContext.notes,
    },
    scoredItems,
  );

  // Always compute the deterministic recommendation first: it is the
  // baseline, and it is also the fallback used below if the OpenAI call
  // is unavailable, fails, or returns output that does not validate.
  const fallback = buildRuleBasedRecommendation(
    scoredItems,
    input.sprintContext.teamCapacityPoints,
  );

  const providerResult = await callOpenAiForPlanningDecision(promptPayload);
  const aiDecision = providerResult?.decision;
  const validAiDecision =
    aiDecision && isAiDecisionConsistentWithCandidates(aiDecision, scoredItems)
      ? aiDecision
      : null;

  let recommendedItems: ScoredBacklogItem[];
  let excludedItems: ScoredBacklogItem[];
  let riskFlags: string[];
  let rationaleSummary: string;
  let generatedBy: PlanningResult["generatedBy"];

  if (validAiDecision) {
    const scoredItemsById = new Map(scoredItems.map((item) => [item.id, item]));
    recommendedItems = validAiDecision.recommendedItemIds.map(
      (id) => scoredItemsById.get(id) as ScoredBacklogItem,
    );
    excludedItems = validAiDecision.excludedItemIds.map(
      (id) => scoredItemsById.get(id) as ScoredBacklogItem,
    );
    riskFlags = validAiDecision.riskFlags;
    rationaleSummary = validAiDecision.rationaleSummary;
    generatedBy = providerResult!.generatedBy;
  } else {
    recommendedItems = fallback.recommendedItems;
    excludedItems = fallback.excludedItems;
    riskFlags = fallback.riskFlags;
    rationaleSummary = fallback.rationaleSummary;
    generatedBy = "rule-based-v1-fallback";
  }

  const result: PlanningResult = {
    sprintContext: {
      id: input.sprintContext.id,
      name: input.sprintContext.name,
      sprintGoal: input.sprintContext.sprintGoal,
      teamCapacityPoints: input.sprintContext.teamCapacityPoints,
      availableDays: input.sprintContext.availableDays,
      teamSize: input.sprintContext.teamSize,
    },
    prioritizedItems: scoredItems,
    recommendedItems,
    excludedItems,
    rationaleSummary,
    riskFlags,
    generatedBy,
  };

  return planningResultSchema.parse(result);
}

const OPENAI_SYSTEM_PROMPT =
  "You are a sprint planning assistant. You will receive a JSON payload " +
  "describing a project, its sprint context, and a list of candidateItems " +
  "that have already been scored and ranked deterministically. Decide " +
  "which candidate items should be recommended for this sprint.\n\n" +
  "Respond with a single JSON object (no markdown, no commentary) with " +
  "exactly these fields:\n" +
  "{\n" +
  '  "recommendedItemIds": string[],\n' +
  '  "excludedItemIds": string[],\n' +
  '  "rationaleSummary": string,\n' +
  '  "riskFlags": string[]\n' +
  "}\n\n" +
  "Rules:\n" +
  "- Every id in recommendedItemIds and excludedItemIds must be an id " +
  "from candidateItems. Do not invent new ids.\n" +
  "- Every candidateItems id must appear in exactly one of " +
  "recommendedItemIds or excludedItemIds.\n" +
  "- Prefer higher-score, non-blocked items for recommendedItemIds, and " +
  "keep the total storyPoints of recommendedItemIds at or below " +
  "teamCapacityPoints where possible.\n" +
  "- Prefer excluding isBlocked items.\n" +
  "- rationaleSummary must be a short, human-readable explanation of the " +
  "recommendation.\n" +
  "- riskFlags must be a list of short, human-readable risk notes (for " +
  "example blocked items, missing estimates, or capacity concerns). Use " +
  "an empty array if there are none.";

/**
 * Calls the OpenAI API for a structured planning decision. Returns `null`
 * (never throws) whenever the model cannot be used, so the caller can
 * always fall back to the deterministic recommendation:
 * - the OPENAI_API_KEY environment variable is not set
 * - the request to OpenAI fails (network error, auth error, rate limit,
 *   etc.)
 * - the response is missing, not valid JSON, or does not match
 *   `aiPlanningDecisionSchema`
 */
async function callOpenAiForPlanningDecision(
  payload: PlanningPromptPayload,
): Promise<{
  decision: AiPlanningDecision;
  generatedBy: "openai-v1" | "gemini-3.5-flash-lite-v1";
} | null> {
  const provider = process.env.PLANNING_PROVIDER;
  if (provider !== "gemini" && provider !== "openai") {
    console.warn(
      "[planning] Missing or invalid provider; using the deterministic fallback.",
    );
    return null;
  }

  const apiKey =
    provider === "gemini"
      ? process.env.OPENAI_API_KEY
      : process.env.OPENAI_PROVIDER_API_KEY;
  const model =
    provider === "gemini"
      ? process.env.GEMINI_MODEL
      : process.env.OPENAI_MODEL || "gpt-4o-mini";
  if (
    !apiKey?.trim() ||
    !model?.trim() ||
    (provider === "gemini" && model !== "gemini-3.5-flash-lite")
  ) {
    console.warn(
      "[planning] Missing credential or invalid model configuration; using the deterministic fallback.",
    );
    return null;
  }

  const client = new OpenAI({
    apiKey,
    baseURL:
      provider === "gemini"
        ? "https://generativelanguage.googleapis.com/v1beta/openai/"
        : "https://api.openai.com/v1",
    ...(provider === "gemini" ? { maxRetries: 0 } : {}),
    logLevel: "off",
  });

  let content: string | null | undefined;
  try {
    const response = await client.chat.completions.create({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: OPENAI_SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(payload) },
      ],
    });
    content = response.choices[0]?.message?.content;
  } catch {
    console.error(
      "[planning] Provider request failed; using the deterministic fallback.",
    );
    return null;
  }

  if (!content) {
    console.error(
      "[planning] OpenAI response had no content; using the deterministic fallback.",
    );
    return null;
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(content);
  } catch (error) {
    console.error(
      "[planning] OpenAI response was not valid JSON; using the deterministic fallback.",
      error,
    );
    return null;
  }

  const parsed = aiPlanningDecisionSchema.safeParse(parsedJson);
  if (!parsed.success) {
    console.error(
      "[planning] OpenAI response failed schema validation; using the deterministic fallback.",
      parsed.error.flatten(),
    );
    return null;
  }

  return {
    decision: parsed.data,
    generatedBy:
      provider === "gemini" ? "gemini-3.5-flash-lite-v1" : "openai-v1",
  };
}

/**
 * Sanity-checks an AI decision against the known candidate items: every
 * candidate id must be assigned to exactly one of recommendedItemIds or
 * excludedItemIds, with no unknown ids and no duplicates. This catches
 * model output that is valid JSON but not usable (missing items,
 * hallucinated ids, or an item listed twice) so it can be treated the
 * same as any other invalid response and fall back to the deterministic
 * result.
 */
function isAiDecisionConsistentWithCandidates(
  decision: AiPlanningDecision,
  scoredItems: ScoredBacklogItem[],
): boolean {
  const candidateIds = new Set(scoredItems.map((item) => item.id));
  const assignedIds = [
    ...decision.recommendedItemIds,
    ...decision.excludedItemIds,
  ];

  if (assignedIds.length !== candidateIds.size) {
    return false;
  }

  const seen = new Set<string>();
  for (const id of assignedIds) {
    if (!candidateIds.has(id) || seen.has(id)) {
      return false;
    }
    seen.add(id);
  }

  return true;
}

/**
 * Rule-based stand-in for the future model recommendation: greedily
 * includes the highest-scored, non-blocked items until the sprint
 * capacity is used up, and produces a short human-readable rationale and
 * a list of basic risk flags.
 */
function buildRuleBasedRecommendation(
  scoredItems: ScoredBacklogItem[],
  teamCapacityPoints: number,
): {
  recommendedItems: ScoredBacklogItem[];
  excludedItems: ScoredBacklogItem[];
  riskFlags: string[];
  rationaleSummary: string;
} {
  const recommendedItems: ScoredBacklogItem[] = [];
  const excludedItems: ScoredBacklogItem[] = [];
  let usedPoints = 0;
  let highPriorityExcludedForCapacity = false;

  for (const item of scoredItems) {
    const points = item.storyPoints ?? 0;

    if (item.isBlocked) {
      excludedItems.push(item);
      continue;
    }

    if (usedPoints + points <= teamCapacityPoints) {
      recommendedItems.push(item);
      usedPoints += points;
    } else {
      excludedItems.push(item);
      if (item.priority === "HIGH" || item.priority === "CRITICAL") {
        highPriorityExcludedForCapacity = true;
      }
    }
  }

  const blockedCount = scoredItems.filter((item) => item.isBlocked).length;
  const missingPointsCount = scoredItems.filter(
    (item) => item.storyPoints == null,
  ).length;

  const riskFlags: string[] = [];
  if (blockedCount > 0) {
    riskFlags.push(
      `${blockedCount} item(s) are blocked by unfinished dependencies and were excluded.`,
    );
  }
  if (missingPointsCount > 0) {
    riskFlags.push(
      `${missingPointsCount} item(s) are missing story point estimates (treated as 0 for capacity planning).`,
    );
  }
  if (highPriorityExcludedForCapacity) {
    riskFlags.push(
      "One or more high-priority items could not be included due to capacity limits.",
    );
  }
  if (teamCapacityPoints === 0) {
    riskFlags.push(
      "Team capacity is 0 points, so no items can be recommended.",
    );
  }

  const rationaleSummary =
    scoredItems.length === 0
      ? "No active (non-done) backlog items are available for this project."
      : `Recommended ${recommendedItems.length} of ${scoredItems.length} active item(s), using ${usedPoints} of ${teamCapacityPoints} capacity points. Items were ranked by priority and readiness, with blocked items excluded.`;

  return { recommendedItems, excludedItems, riskFlags, rationaleSummary };
}
