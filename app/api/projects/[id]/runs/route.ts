import { NextResponse } from "next/server";
import { getProjectById } from "@/lib/projects/queries";
import { listPlanningRunsForProject } from "@/lib/planning-runs/queries";

/**
 * Lists saved planning runs for a project as lightweight summaries (the
 * full prioritized/recommended/excluded item snapshots are only returned
 * by GET /api/runs/[runId], to keep this list response small).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const project = await getProjectById(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const runs = await listPlanningRunsForProject(id);

  const summaries = runs.map((run) => ({
    id: run.id,
    sprintContext: run.sprintContext,
    generatedBy: run.generatedBy,
    rationaleSummary: run.rationaleSummary,
    riskFlags: run.riskFlags,
    totalRecommendedStoryPoints: run.totalRecommendedStoryPoints,
    recommendedCount: Array.isArray(run.recommendedItems)
      ? run.recommendedItems.length
      : 0,
    prioritizedCount: Array.isArray(run.prioritizedItems)
      ? run.prioritizedItems.length
      : 0,
    excludedCount: Array.isArray(run.excludedItems)
      ? run.excludedItems.length
      : 0,
    createdAt: run.createdAt,
  }));

  return NextResponse.json({ runs: summaries });
}
