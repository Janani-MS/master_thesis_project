import { NextResponse } from "next/server";
import { getPlanningRunById } from "@/lib/planning-runs/queries";
import { planningRunItemsSchema } from "@/lib/planning-runs/validation";

/**
 * Returns the full detail of a single saved planning run, including the
 * prioritized/recommended/excluded item snapshots. The stored JSON
 * columns are re-validated here before being returned, so a saved run can
 * never be served with a malformed shape.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ runId: string }> },
) {
  const { runId } = await params;

  const run = await getPlanningRunById(runId);
  if (!run) {
    return NextResponse.json(
      { error: "Planning run not found." },
      { status: 404 },
    );
  }

  try {
    const prioritizedItems = planningRunItemsSchema.parse(run.prioritizedItems);
    const recommendedItems = planningRunItemsSchema.parse(run.recommendedItems);
    const excludedItems = planningRunItemsSchema.parse(run.excludedItems);

    return NextResponse.json({
      run: {
        id: run.id,
        projectId: run.projectId,
        sprintContext: run.sprintContext,
        generatedBy: run.generatedBy,
        rationaleSummary: run.rationaleSummary,
        riskFlags: run.riskFlags,
        totalRecommendedStoryPoints: run.totalRecommendedStoryPoints,
        prioritizedItems,
        recommendedItems,
        excludedItems,
        createdAt: run.createdAt,
      },
    });
  } catch (error) {
    console.error("Stored planning run has an invalid shape", error);
    return NextResponse.json(
      { error: "Saved planning run data is invalid." },
      { status: 500 },
    );
  }
}
