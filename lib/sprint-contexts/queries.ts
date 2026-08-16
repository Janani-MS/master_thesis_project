import { prisma } from "@/lib/prisma";
import type { CreateSprintContextInput } from "./validation";

/**
 * Data access functions for the SprintContext entity. Kept as thin
 * wrappers around Prisma, mirroring the lib/projects and lib/backlog
 * query conventions.
 */

export function listSprintContextsForProject(projectId: string) {
  return prisma.sprintContext.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });
}

export function getSprintContextById(id: string) {
  return prisma.sprintContext.findUnique({
    where: { id },
  });
}

export function createSprintContext(
  projectId: string,
  input: CreateSprintContextInput,
) {
  return prisma.sprintContext.create({
    data: {
      projectId,
      name: input.name,
      sprintGoal: input.sprintGoal || null,
      teamCapacityPoints: input.teamCapacityPoints,
      availableDays: input.availableDays ?? null,
      teamSize: input.teamSize ?? null,
      notes: input.notes || null,
    },
  });
}
