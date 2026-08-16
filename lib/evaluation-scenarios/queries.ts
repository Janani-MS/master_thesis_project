import { prisma } from "@/lib/prisma";

/**
 * Data access functions for the EvaluationScenario entity. Scenarios are
 * seeded (see prisma/seed.ts), never created through the UI, so only read
 * queries are needed here.
 */

export function listEvaluationScenarios() {
  return prisma.evaluationScenario.findMany({
    include: {
      project: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export function getEvaluationScenarioByProjectId(projectId: string) {
  return prisma.evaluationScenario.findUnique({
    where: { projectId },
  });
}
