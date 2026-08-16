// Presentational-only badge shown on a project's detail page when that
// project is one of the predefined demo/evaluation scenarios (see
// prisma/seed.ts and docs/evaluation-scenarios.md). Purely informational -
// no interactivity - so it stays a plain Server Component.

export interface EvaluationScenarioBadgeProps {
  name: string;
  purpose: string;
}

export function EvaluationScenarioBadge({
  name,
  purpose,
}: EvaluationScenarioBadgeProps) {
  return (
    <div className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm">
      <p className="font-medium text-indigo-900">Demo scenario: {name}</p>
      <p className="mt-1 text-indigo-700">{purpose}</p>
    </div>
  );
}
