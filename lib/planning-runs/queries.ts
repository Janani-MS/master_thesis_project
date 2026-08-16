import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { PlanningResult } from "@/lib/planning/validators";

/**
 * Data access functions for the PlanningRun entity. Kept as thin wrappers
 * around Prisma, mirroring the other lib/<feature>/queries.ts modules.
 */

const planningRunInclude = {
  sprintContext: { select: { id: true, name: true } },
} as const;

/**
 * Persists a validated planning result as a new PlanningRun row. The
 * scored-item snapshots are stored as-is (already validated against
 * planningResultSchema by the orchestrator) so the run can be fully
 * reconstructed later without re-running any scoring logic.
 */
export function createPlanningRun(projectId: string, result: PlanningResult) {
  const totalRecommendedStoryPoints = result.recommendedItems.reduce(
    (sum, item) => sum + (item.storyPoints ?? 0),
    0,
  );

  return prisma.planningRun.create({
    data: {
      projectId,
      sprintContextId: result.sprintContext.id,
      generatedBy: result.generatedBy,
      rationaleSummary: result.rationaleSummary,
      riskFlags: result.riskFlags,
      totalRecommendedStoryPoints,
      prioritizedItems: result.prioritizedItems as Prisma.InputJsonValue,
      recommendedItems: result.recommendedItems as Prisma.InputJsonValue,
      excludedItems: result.excludedItems as Prisma.InputJsonValue,
    },
    include: planningRunInclude,
  });
}

export function listPlanningRunsForProject(projectId: string) {
  return prisma.planningRun.findMany({
    where: { projectId },
    include: planningRunInclude,
    orderBy: { createdAt: "desc" },
  });
}

export function getPlanningRunById(id: string) {
  return prisma.planningRun.findUnique({
    where: { id },
    include: planningRunInclude,
  });
}
