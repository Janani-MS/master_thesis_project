// scoring.ts
//
// Lightweight, deterministic pre-ranking of backlog items. Purely
// rule-based (no AI) so behavior is transparent, explainable, and
// reproducible. Runs before the (future) prompt is built - see
// prompt-builder.ts - and before any model call - see orchestrator.ts.
//
// Kept free of any Prisma/DB imports so it stays a pure, easily unit
// testable function: callers translate their own data into the plain
// BacklogItemInput/DependencyInput shapes below.

import type {
  backlogItemPriorityValues,
  backlogItemStatusValues,
} from "@/lib/backlog/validation";

export type BacklogPriority = (typeof backlogItemPriorityValues)[number];
export type BacklogStatus = (typeof backlogItemStatusValues)[number];

export interface BacklogItemInput {
  id: string;
  title: string;
  priority: BacklogPriority;
  status: BacklogStatus;
  storyPoints: number | null;
}

/** A dependency where `fromItemId` depends on an item titled `toItemTitle`. */
export interface DependencyInput {
  fromItemId: string;
  toItemId: string;
  toItemTitle: string;
  toItemStatus: BacklogStatus;
}

export interface ScoredBacklogItem {
  id: string;
  title: string;
  priority: BacklogPriority;
  status: BacklogStatus;
  storyPoints: number | null;
  score: number;
  isBlocked: boolean;
  blockedByTitles: string[];
}

const PRIORITY_WEIGHT: Record<BacklogPriority, number> = {
  CRITICAL: 40,
  HIGH: 30,
  MEDIUM: 20,
  LOW: 10,
};

const STATUS_WEIGHT: Record<BacklogStatus, number> = {
  READY: 8,
  IN_PROGRESS: 4,
  BACKLOG: 0,
  DONE: 0, // DONE items are filtered out before scoring; weight is unused.
};

const BLOCKED_PENALTY = 15;

/**
 * Scores and ranks the active (non-DONE) backlog items of a project.
 * Higher score means higher suitability for sprint inclusion. The score
 * is an explicit weighted sum of priority, current status, and a penalty
 * for items blocked by an unfinished dependency - no ML/AI involved, so
 * every score can be explained by its inputs alone.
 */
export function scoreBacklogItems(
  items: BacklogItemInput[],
  dependencies: DependencyInput[],
): ScoredBacklogItem[] {
  const dependenciesByFromItem = new Map<string, DependencyInput[]>();
  for (const dependency of dependencies) {
    const existing = dependenciesByFromItem.get(dependency.fromItemId) ?? [];
    existing.push(dependency);
    dependenciesByFromItem.set(dependency.fromItemId, existing);
  }

  const scored = items
    .filter((item) => item.status !== "DONE")
    .map((item): ScoredBacklogItem => {
      const blockers = (dependenciesByFromItem.get(item.id) ?? []).filter(
        (dependency) => dependency.toItemStatus !== "DONE",
      );
      const isBlocked = blockers.length > 0;

      const score =
        PRIORITY_WEIGHT[item.priority] +
        STATUS_WEIGHT[item.status] -
        (isBlocked ? BLOCKED_PENALTY : 0);

      return {
        id: item.id,
        title: item.title,
        priority: item.priority,
        status: item.status,
        storyPoints: item.storyPoints,
        score,
        isBlocked,
        blockedByTitles: blockers.map((blocker) => blocker.toItemTitle),
      };
    });

  return scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // Tie-break toward smaller/unestimated items so more of them can fit
    // within the sprint capacity.
    const aPoints = a.storyPoints ?? 0;
    const bPoints = b.storyPoints ?? 0;
    return aPoints - bPoints;
  });
}
