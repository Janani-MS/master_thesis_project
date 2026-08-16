import { prisma } from "@/lib/prisma";
import type { CreateProjectInput } from "./validation";

/**
 * Data access functions for the Project entity. Kept as thin wrappers
 * around Prisma so API routes and server components share the same
 * query logic.
 */

export function listProjects() {
  return prisma.project.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export function getProjectById(id: string) {
  return prisma.project.findUnique({
    where: { id },
  });
}

export function createProject(input: CreateProjectInput) {
  return prisma.project.create({
    data: {
      name: input.name,
      description: input.description || null,
    },
  });
}
