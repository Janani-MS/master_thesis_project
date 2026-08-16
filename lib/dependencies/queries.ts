import { prisma } from "@/lib/prisma";

/**
 * Data access functions for the BacklogDependency entity. A dependency
 * row means `fromItem` depends on `toItem` (fromItem is blocked until
 * toItem is done). Kept as thin wrappers around Prisma, mirroring the
 * lib/backlog/queries.ts convention.
 */

const dependencyInclude = {
  fromItem: { select: { id: true, title: true, status: true } },
  toItem: { select: { id: true, title: true, status: true } },
} as const;

export function listDependenciesForProject(projectId: string) {
  return prisma.backlogDependency.findMany({
    where: { fromItem: { projectId } },
    include: dependencyInclude,
    orderBy: { createdAt: "desc" },
  });
}

export function getDependencyById(id: string) {
  return prisma.backlogDependency.findUnique({
    where: { id },
    include: dependencyInclude,
  });
}

export function findDependency(fromItemId: string, toItemId: string) {
  return prisma.backlogDependency.findUnique({
    where: { fromItemId_toItemId: { fromItemId, toItemId } },
  });
}

export function createDependency(fromItemId: string, toItemId: string) {
  return prisma.backlogDependency.create({
    data: { fromItemId, toItemId },
    include: dependencyInclude,
  });
}

export function deleteDependency(id: string) {
  return prisma.backlogDependency.delete({
    where: { id },
  });
}
