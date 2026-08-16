import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectById } from "@/lib/projects/queries";
import { listBacklogItemsForProject } from "@/lib/backlog/queries";
import { listDependenciesForProject } from "@/lib/dependencies/queries";
import { listSprintContextsForProject } from "@/lib/sprint-contexts/queries";
import { listPlanningRunsForProject } from "@/lib/planning-runs/queries";
import { getEvaluationScenarioByProjectId } from "@/lib/evaluation-scenarios/queries";
import { BacklogWorkspace } from "@/components/backlog-workspace";
import { SprintPlanningWorkspace } from "@/components/sprint-planning-workspace";
import { EvaluationScenarioBadge } from "@/components/evaluation-scenario-badge";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProjectById(id);

  if (!project) {
    notFound();
  }

  const [backlogItems, dependencies, sprintContexts, planningRuns, scenario] =
    await Promise.all([
      listBacklogItemsForProject(project.id),
      listDependenciesForProject(project.id),
      listSprintContextsForProject(project.id),
      listPlanningRunsForProject(project.id),
      getEvaluationScenarioByProjectId(project.id),
    ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/" className="text-sm text-zinc-500 hover:underline">
          &larr; Back to dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900">
          {project.name}
        </h1>
        {project.description && (
          <p className="mt-1 text-sm text-zinc-500">{project.description}</p>
        )}
        {scenario && (
          <div className="mt-3">
            <EvaluationScenarioBadge
              name={scenario.name}
              purpose={scenario.purpose}
            />
          </div>
        )}
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="text-base font-medium text-zinc-900">Backlog</h2>
        <div className="mt-4">
          <BacklogWorkspace
            projectId={project.id}
            initialItems={backlogItems.map((item) => ({
              ...item,
              createdAt: item.createdAt.toISOString(),
              updatedAt: item.updatedAt.toISOString(),
            }))}
            initialDependencies={dependencies.map((dependency) => ({
              ...dependency,
              createdAt: dependency.createdAt.toISOString(),
            }))}
          />
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="text-base font-medium text-zinc-900">Sprint planning</h2>
        <div className="mt-4">
          <SprintPlanningWorkspace
            projectId={project.id}
            initialSprintContexts={sprintContexts.map((context) => ({
              ...context,
              createdAt: context.createdAt.toISOString(),
              updatedAt: context.updatedAt.toISOString(),
            }))}
            initialPlanningRuns={planningRuns.map((run) => ({
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
              createdAt: run.createdAt.toISOString(),
            }))}
          />
        </div>
      </section>
    </div>
  );
}
