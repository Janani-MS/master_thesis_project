import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getProjectById } from "@/lib/projects/queries";
import { getSprintContextById } from "@/lib/sprint-contexts/queries";
import { listBacklogItemsForProject } from "@/lib/backlog/queries";
import { listDependenciesForProject } from "@/lib/dependencies/queries";
import { runPlanningOrchestration } from "@/lib/planning/orchestrator";
import { planRequestSchema } from "@/lib/planning/validators";
import { createPlanningRun } from "@/lib/planning-runs/queries";

/**
 * Runs the planning pipeline for a project's sprint context: loads the
 * project's backlog items, dependencies, and the selected sprint context,
 * then delegates to the planning orchestrator (see lib/planning/) for
 * scoring, an OpenAI-based recommendation, and validation. If the OpenAI
 * call is unavailable or its output does not validate, the orchestrator
 * falls back to a deterministic, rule-based recommendation. On success,
 * the result is persisted as a PlanningRun so it can be reopened later
 * (see lib/planning-runs/).
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const project = await getProjectById(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  let input;
  try {
    input = planRequestSchema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid input.", issues: error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    throw error;
  }

  const sprintContext = await getSprintContextById(input.sprintContextId);
  if (!sprintContext || sprintContext.projectId !== id) {
    return NextResponse.json(
      { error: "Sprint context not found for this project." },
      { status: 404 },
    );
  }

  const [backlogItems, dependencies] = await Promise.all([
    listBacklogItemsForProject(id),
    listDependenciesForProject(id),
  ]);

  try {
    const result = await runPlanningOrchestration({
      project: { id: project.id, name: project.name },
      sprintContext: {
        id: sprintContext.id,
        name: sprintContext.name,
        sprintGoal: sprintContext.sprintGoal,
        teamCapacityPoints: sprintContext.teamCapacityPoints,
        availableDays: sprintContext.availableDays,
        teamSize: sprintContext.teamSize,
        notes: sprintContext.notes,
      },
      backlogItems: backlogItems.map((item) => ({
        id: item.id,
        title: item.title,
        priority: item.priority,
        status: item.status,
        storyPoints: item.storyPoints,
      })),
      dependencies: dependencies.map((dependency) => ({
        fromItemId: dependency.fromItemId,
        toItemId: dependency.toItemId,
        toItemTitle: dependency.toItem.title,
        toItemStatus: dependency.toItem.status,
      })),
    });

    const run = await createPlanningRun(id, result);

    return NextResponse.json({ result, run });
  } catch (error) {
    console.error("Planning orchestration failed", error);
    return NextResponse.json(
      { error: "Failed to generate a planning result." },
      { status: 500 },
    );
  }
}
