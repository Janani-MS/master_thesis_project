"use client";

import { useState } from "react";
import Link from "next/link";
import {
  PlanningResultView,
  type ScoredItemDto,
} from "@/components/planning-result-view";

export type SprintContextDto = {
  id: string;
  projectId: string;
  name: string;
  sprintGoal: string | null;
  teamCapacityPoints: number;
  availableDays: number | null;
  teamSize: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PlanningRunSummaryDto = {
  id: string;
  sprintContext: { id: string; name: string };
  generatedBy: string;
  rationaleSummary: string;
  riskFlags: string[];
  totalRecommendedStoryPoints: number;
  recommendedCount: number;
  prioritizedCount: number;
  excludedCount: number;
  createdAt: string;
};

type PlanningRunDetailDto = {
  id: string;
  sprintContext: { id: string; name: string };
  generatedBy: string;
  rationaleSummary: string;
  riskFlags: string[];
  totalRecommendedStoryPoints: number;
  prioritizedItems: ScoredItemDto[];
  recommendedItems: ScoredItemDto[];
  excludedItems: ScoredItemDto[];
  createdAt: string;
};

interface SprintPlanningWorkspaceProps {
  projectId: string;
  initialSprintContexts: SprintContextDto[];
  initialPlanningRuns: PlanningRunSummaryDto[];
}

/**
 * Sprint-planning section for the project detail page: create sprint
 * contexts, list existing ones, select one, and trigger a planning run.
 * The planning run itself is a placeholder until the AI orchestration
 * feature is implemented (see lib/planning/).
 */
export function SprintPlanningWorkspace({
  projectId,
  initialSprintContexts,
  initialPlanningRuns,
}: SprintPlanningWorkspaceProps) {
  const [sprintContexts, setSprintContexts] = useState(initialSprintContexts);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialSprintContexts[0]?.id ?? null,
  );
  const [planningRuns, setPlanningRuns] = useState(initialPlanningRuns);
  const [lastRunDetail, setLastRunDetail] =
    useState<PlanningRunDetailDto | null>(null);

  const [name, setName] = useState("");
  const [sprintGoal, setSprintGoal] = useState("");
  const [teamCapacityPoints, setTeamCapacityPoints] = useState("");
  const [availableDays, setAvailableDays] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [isPlanning, setIsPlanning] = useState(false);
  const [planMessage, setPlanMessage] = useState<string | null>(null);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    const payload = {
      name,
      sprintGoal: sprintGoal || undefined,
      teamCapacityPoints:
        teamCapacityPoints === "" ? undefined : Number(teamCapacityPoints),
      availableDays: availableDays === "" ? undefined : Number(availableDays),
      teamSize: teamSize === "" ? undefined : Number(teamSize),
      notes: notes || undefined,
    };

    try {
      const response = await fetch(
        `/api/projects/${projectId}/sprint-contexts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        setFormError(data.error ?? "Failed to create sprint context.");
        return;
      }

      setSprintContexts((current) => [data.sprintContext, ...current]);
      setSelectedId(data.sprintContext.id);
      setName("");
      setSprintGoal("");
      setTeamCapacityPoints("");
      setAvailableDays("");
      setTeamSize("");
      setNotes("");
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRunPlanning() {
    if (!selectedId) return;

    setIsPlanning(true);
    setPlanMessage(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sprintContextId: selectedId }),
      });
      const data = await response.json();

      if (!response.ok) {
        setPlanMessage(data.error ?? "Failed to run planning.");
        return;
      }

      const run: PlanningRunDetailDto = data.run;
      setLastRunDetail(run);
      setPlanningRuns((current) => [
        {
          id: run.id,
          sprintContext: run.sprintContext,
          generatedBy: run.generatedBy,
          rationaleSummary: run.rationaleSummary,
          riskFlags: run.riskFlags,
          totalRecommendedStoryPoints: run.totalRecommendedStoryPoints,
          recommendedCount: run.recommendedItems.length,
          prioritizedCount: run.prioritizedItems.length,
          excludedCount: run.excludedItems.length,
          createdAt: run.createdAt,
        },
        ...current,
      ]);
    } catch {
      setPlanMessage("Something went wrong. Please try again.");
    } finally {
      setIsPlanning(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-sm font-medium text-zinc-900">
          Add sprint context
        </h3>
        <form onSubmit={handleCreate} className="mt-3 flex flex-col gap-3">
          <div>
            <label
              htmlFor="sc-name"
              className="block text-sm font-medium text-zinc-700"
            >
              Name
            </label>
            <input
              id="sc-name"
              type="text"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
              placeholder="e.g. Sprint 12"
            />
          </div>

          <div>
            <label
              htmlFor="sc-goal"
              className="block text-sm font-medium text-zinc-700"
            >
              Sprint goal (optional)
            </label>
            <textarea
              id="sc-goal"
              value={sprintGoal}
              onChange={(event) => setSprintGoal(event.target.value)}
              rows={2}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
              placeholder="What should this sprint achieve?"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div>
              <label
                htmlFor="sc-capacity"
                className="block text-sm font-medium text-zinc-700"
              >
                Team capacity (points)
              </label>
              <input
                id="sc-capacity"
                type="number"
                required
                min={0}
                max={1000}
                value={teamCapacityPoints}
                onChange={(event) => setTeamCapacityPoints(event.target.value)}
                className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-2 text-sm focus:border-zinc-500 focus:outline-none"
                placeholder="e.g. 30"
              />
            </div>

            <div>
              <label
                htmlFor="sc-days"
                className="block text-sm font-medium text-zinc-700"
              >
                Available days
              </label>
              <input
                id="sc-days"
                type="number"
                min={0}
                max={60}
                value={availableDays}
                onChange={(event) => setAvailableDays(event.target.value)}
                className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-2 text-sm focus:border-zinc-500 focus:outline-none"
                placeholder="e.g. 10"
              />
            </div>

            <div>
              <label
                htmlFor="sc-team-size"
                className="block text-sm font-medium text-zinc-700"
              >
                Team size
              </label>
              <input
                id="sc-team-size"
                type="number"
                min={0}
                max={100}
                value={teamSize}
                onChange={(event) => setTeamSize(event.target.value)}
                className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-2 text-sm focus:border-zinc-500 focus:outline-none"
                placeholder="e.g. 5"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="sc-notes"
              className="block text-sm font-medium text-zinc-700"
            >
              Notes (optional)
            </label>
            <textarea
              id="sc-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
              placeholder="Constraints, holidays, risks, etc."
            />
          </div>

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="self-start rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Add sprint context"}
          </button>
        </form>
      </div>

      <div>
        <h3 className="text-sm font-medium text-zinc-900">Sprint contexts</h3>
        {sprintContexts.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">
            No sprint contexts yet. Add one above.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {sprintContexts.map((context) => (
              <li key={context.id}>
                <label className="flex items-start gap-2 rounded-md border border-zinc-200 px-3 py-2 has-checked:border-zinc-500 has-checked:bg-zinc-50">
                  <input
                    type="radio"
                    name="selectedSprintContext"
                    checked={selectedId === context.id}
                    onChange={() => {
                      setSelectedId(context.id);
                      setPlanMessage(null);
                    }}
                    className="mt-1"
                  />
                  <span>
                    <span className="font-medium text-zinc-900">
                      {context.name}
                    </span>
                    <span className="text-zinc-500">
                      {" "}
                      — {context.teamCapacityPoints} pts capacity
                      {context.availableDays != null &&
                        `, ${context.availableDays} days`}
                      {context.teamSize != null &&
                        `, team of ${context.teamSize}`}
                    </span>
                    {context.sprintGoal && (
                      <div className="mt-0.5 text-zinc-500">
                        Goal: {context.sprintGoal}
                      </div>
                    )}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <button
          type="button"
          onClick={handleRunPlanning}
          disabled={!selectedId || isPlanning}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {isPlanning ? "Running..." : "Run planning"}
        </button>
        {!selectedId && (
          <p className="mt-2 text-sm text-zinc-500">
            Select a sprint context above to enable planning.
          </p>
        )}
        {planMessage && (
          <p className="mt-2 text-sm text-zinc-700">{planMessage}</p>
        )}
      </div>

      {lastRunDetail && (
        <div className="rounded-md border border-zinc-200 p-4">
          <PlanningResultView
            sprintContextName={lastRunDetail.sprintContext.name}
            generatedBy={lastRunDetail.generatedBy}
            rationaleSummary={lastRunDetail.rationaleSummary}
            riskFlags={lastRunDetail.riskFlags}
            prioritizedItems={lastRunDetail.prioritizedItems}
            recommendedItems={lastRunDetail.recommendedItems}
            excludedItems={lastRunDetail.excludedItems}
            totalRecommendedStoryPoints={
              lastRunDetail.totalRecommendedStoryPoints
            }
            createdAt={lastRunDetail.createdAt}
          />
        </div>
      )}

      <div>
        <h3 className="text-sm font-medium text-zinc-900">
          Saved planning runs
        </h3>
        {planningRuns.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">
            No planning runs yet. Run planning above to create one.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {planningRuns.map((run) => (
              <li key={run.id}>
                <Link
                  href={`/runs/${run.id}`}
                  className="block rounded-md border border-zinc-200 px-3 py-2 hover:border-zinc-400"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-zinc-900">
                      {run.sprintContext.name}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {new Date(run.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-0.5 text-zinc-500">
                    {run.recommendedCount} recommended ·{" "}
                    {run.totalRecommendedStoryPoints} pts · {run.generatedBy}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
