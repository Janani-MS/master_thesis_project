import Link from "next/link";
import { CreateProjectForm } from "@/components/create-project-form";
import { listProjects } from "@/lib/projects/queries";
import { listEvaluationScenarios } from "@/lib/evaluation-scenarios/queries";

// Always render with fresh data: the project list changes at runtime and
// must not be cached as static output.
export const dynamic = "force-dynamic";

export default async function Home() {
  const [projects, scenarios] = await Promise.all([
    listProjects(),
    listEvaluationScenarios(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Home</h1>
        <p className="mt-1 text-sm text-zinc-500">
          View, Manage, and create projects.
        </p>
      </div>

      <div className="dashboard-panels grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(18rem,1fr)]">
        <section className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="text-base font-medium text-zinc-900">Projects</h2>

          {projects.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">
              No projects yet. Use the form to create your first project.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-zinc-200">
              {projects.map((project) => (
                <li key={project.id} className="py-3">
                  <Link
                    href={`/projects/${project.id}`}
                    className="text-sm font-medium text-zinc-900 hover:underline"
                  >
                    {project.name}
                  </Link>
                  {project.description && (
                    <p className="mt-1 text-sm text-zinc-500">
                      {project.description}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="text-base font-medium text-zinc-900">
            Create a project
          </h2>
          <div className="mt-3">
            <CreateProjectForm />
          </div>
        </section>
      </div>

      {scenarios.length > 0 && (
        <section className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="text-base font-medium text-zinc-900">
            Demo scenarios
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Predefined, reproducible projects for demos and thesis evaluation.
            See <code className="text-xs">docs/evaluation-scenarios.md</code>{" "}
            for details.
          </p>
          <ul className="mt-4 divide-y divide-zinc-200">
            {scenarios.map((scenario) => (
              <li key={scenario.id} className="py-3">
                <Link
                  href={`/projects/${scenario.project.id}`}
                  className="text-sm font-medium text-zinc-900 hover:underline"
                >
                  {scenario.name}
                </Link>
                <p className="mt-1 text-sm text-zinc-500">{scenario.purpose}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
