import { prisma } from "@/lib/prisma";
import type {
  CreateBacklogItemInput,
  UpdateBacklogItemInput,
} from "./validation";

/**
 * Data access functions for the BacklogItem entity. Kept as thin wrappers
 * around Prisma so API routes and server components share the same query
 * logic.
 */

export function listBacklogItemsForProject(projectId: string) {
  return prisma.backlogItem.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });
}

export function getBacklogItemById(id: string) {
  return prisma.backlogItem.findUnique({
    where: { id },
  });
}

export function createBacklogItem(
  projectId: string,
  input: CreateBacklogItemInput,
) {
  return prisma.backlogItem.create({
    data: {
      projectId,
      title: input.title,
      description: input.description || null,
      type: input.type,
      priority: input.priority,
      storyPoints: input.storyPoints ?? null,
      status: input.status,
    },
  });
}

export function updateBacklogItem(id: string, input: UpdateBacklogItemInput) {
  return prisma.backlogItem.update({
    where: { id },
    data: {
      title: input.title,
      description:
        input.description === undefined ? undefined : input.description || null,
      type: input.type,
      priority: input.priority,
      storyPoints: input.storyPoints,
      status: input.status,
    },
  });
}

export function deleteBacklogItem(id: string) {
  return prisma.backlogItem.delete({
    where: { id },
  });
}
