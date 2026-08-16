import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlanningRunById } from "@/lib/planning-runs/queries";
import { planningRunItemsSchema } from "@/lib/planning-runs/validation";
import { PlanningResultView } from "@/components/planning-result-view";

export const dynamic = "force-dynamic";

export default async function PlanningRunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const run = await getPlanningRunById(id);

  if (!run) {
    notFound();
  }

  const prioritizedItems = planningRunItemsSchema.parse(run.prioritizedItems);
  const recommendedItems = planningRunItemsSchema.parse(run.recommendedItems);
  const excludedItems = planningRunItemsSchema.parse(run.excludedItems);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/projects/${run.projectId}`}
          className="text-sm text-zinc-500 hover:underline"
        >
          &larr; Back to project
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900">
          Planning run
        </h1>
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-6">
        <PlanningResultView
          sprintContextName={run.sprintContext.name}
          generatedBy={run.generatedBy}
          rationaleSummary={run.rationaleSummary}
          riskFlags={run.riskFlags}
          prioritizedItems={prioritizedItems}
          recommendedItems={recommendedItems}
          excludedItems={excludedItems}
          totalRecommendedStoryPoints={run.totalRecommendedStoryPoints}
          createdAt={run.createdAt.toISOString()}
        />
      </section>
    </div>
  );
}
