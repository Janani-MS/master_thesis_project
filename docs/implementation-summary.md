# Implementation summary

A module-by-module inventory of what is actually implemented in this
repository, intended as source material for a thesis implementation
chapter. For the high-level design rationale, see
[`system-architecture.md`](./system-architecture.md).

## Implemented features by module

### Project management (`lib/projects/`, `components/create-project-form.tsx`)

- Create and list projects (`name`, optional `description`).
- Dashboard (`app/page.tsx`) lists all projects and provides the create
  form.
- Project detail page (`app/projects/[id]/page.tsx`) is the hub for all
  other features on a single project.

### Backlog item management (`lib/backlog/`, `components/backlog-workspace.tsx`, `components/backlog-item-form.tsx`)

- Full CRUD for backlog items scoped to a project: `title`,
  `description`, `type` (`FEATURE` / `BUG` / `TECH_DEBT` / `CHORE`),
  `priority` (`LOW` / `MEDIUM` / `HIGH` / `CRITICAL`), `storyPoints`
  (optional integer), `status` (`BACKLOG` / `READY` / `IN_PROGRESS` /
  `DONE`).
- Update uses a separate Zod schema with `.optional()` fields (not
  `.partial()` on the create schema) so partial updates never silently
  reset omitted fields to defaults.

### Dependency management (`lib/dependencies/`, `components/dependency-manager.tsx`)

- Directed dependency between two backlog items in the same project:
  "item A depends on item B" (A is blocked until B is `DONE`).
- Enforced uniqueness per `(fromItemId, toItemId)` pair at the database
  level.

### Sprint context (`lib/sprint-contexts/`)

- Named sprint-planning input set per project: `sprintGoal`,
  `teamCapacityPoints`, `availableDays`, `teamSize`, `notes`. A project
  can have multiple sprint contexts (e.g. one per sprint).

### Planning orchestration (`lib/planning/`)

- `scoring.ts` - deterministic candidate ranking (priority weight +
  status readiness weight - blocked penalty), tie-broken toward smaller
  items.
- `prompt-builder.ts` - builds the structured JSON payload sent to the
  model.
- `validators.ts` - `planRequestSchema` (request input),
  `scoredBacklogItemSchema` / `planningResultSchema` (result contract),
  `aiPlanningDecisionSchema` (narrow AI output contract).
- `orchestrator.ts` - `runPlanningOrchestration` (async): scoring →
  prompt payload → OpenAI call → validation → fallback selection →
  final result assembly and validation. See
  [`system-architecture.md`](./system-architecture.md#planning-orchestration-flow)
  for the full flow and fallback matrix.

### Planning result persistence (`lib/planning-runs/`)

- `createPlanningRun`, `listPlanningRunsForProject`,
  `getPlanningRunById` - thin Prisma wrappers.
- `validation.ts` - re-validates the JSON snapshot columns read back
  from a stored run (`planningRunItemsSchema`).
- Every planning run (AI-generated or fallback) is persisted
  immediately after generation.

### Planning results UI (`components/planning-result-view.tsx`, `components/sprint-planning-workspace.tsx`)

- `PlanningResultView` - shared, presentation-only renderer (no
  `"use client"`) used both for a live result right after clicking "Run
  planning" and for a reopened saved run - guarantees the two views are
  always visually identical.
- `SprintPlanningWorkspace` - sprint context CRUD, the "Run planning"
  action, the live inline result, and the "Saved planning runs" list
  (linking to `/runs/[id]`).

### Evaluation scenario support (`lib/evaluation-scenarios/`, `prisma/seed.ts`, `components/evaluation-scenario-badge.tsx`)

- `EvaluationScenario` labels a normal `Project` as one of a small set of
  predefined demo cases (see
  [`evaluation-support.md`](./evaluation-support.md)).
- Seed script creates 3 fixed scenarios end-to-end (project, backlog
  items, dependencies, sprint context) idempotently.
- Dashboard "Demo scenarios" list + a badge on a scenario's project
  page.

## Key routes/pages

### Pages (`app/`)

| Route            | Purpose                                                                         |
| ---------------- | ------------------------------------------------------------------------------- |
| `/`              | Dashboard: projects list, create-project form, demo scenarios list              |
| `/projects/[id]` | Project detail: backlog, dependencies, sprint planning, live result, saved runs |
| `/runs/[id]`     | Standalone detail page for a single saved planning run                          |

### API routes (`app/api/`)

| Route                                | Methods           | Purpose                                               |
| ------------------------------------ | ----------------- | ----------------------------------------------------- |
| `/api/projects`                      | `GET`, `POST`     | List / create projects                                |
| `/api/projects/[id]`                 | `GET`             | Fetch a single project                                |
| `/api/projects/[id]/backlog`         | `GET`, `POST`     | List / create backlog items for a project             |
| `/api/backlog-items/[itemId]`        | `PATCH`, `DELETE` | Update / delete a backlog item                        |
| `/api/projects/[id]/dependencies`    | `GET`, `POST`     | List / create dependencies for a project              |
| `/api/dependencies/[dependencyId]`   | `DELETE`          | Remove a dependency                                   |
| `/api/projects/[id]/sprint-contexts` | `GET`, `POST`     | List / create sprint contexts for a project           |
| `/api/sprint-contexts/[contextId]`   | `PATCH`, `DELETE` | Update / delete a sprint context                      |
| `/api/projects/[id]/plan`            | `POST`            | Run the planning orchestration and persist the result |
| `/api/projects/[id]/runs`            | `GET`             | List planning run summaries for a project             |
| `/api/runs/[runId]`                  | `GET`             | Full detail of a single saved planning run            |

All routes: Zod-validate input, return `400` with `error.flatten().fieldErrors`
on validation failure, `404` for missing parent resources, `500` with a
generic message plus a `console.error` on unexpected failures.

## Database models (`prisma/schema.prisma`)

| Model                | Purpose                                                                                                                                                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Project`            | Top-level container; has backlog items, sprint contexts, planning runs, and optionally one `EvaluationScenario`                                                                                                                      |
| `BacklogItem`        | A unit of work with type/priority/points/status                                                                                                                                                                                      |
| `BacklogDependency`  | Directed "depends on" edge between two backlog items                                                                                                                                                                                 |
| `SprintContext`      | Named sprint-planning input set (goal, capacity, days, team size)                                                                                                                                                                    |
| `PlanningRun`        | Persisted result of one planning orchestration run: `generatedBy`, `rationaleSummary`, `riskFlags` (`String[]`), `totalRecommendedStoryPoints`, and `prioritizedItems`/`recommendedItems`/`excludedItems` stored as `Json` snapshots |
| `EvaluationScenario` | Labels a `Project` (1:1) with a `key`, `name`, and `purpose` for demo/evaluation identification                                                                                                                                      |

`prioritizedItems`/`recommendedItems`/`excludedItems` are stored as JSON
rather than normalized child tables/rows: they are always read and
written as a whole per run and never queried item-by-item, so JSON
snapshots keep the schema simpler while still fully reconstructing a
run. There is no separate `Recommendation`/`SelectedItem` table.

## Planning flow (end-to-end)

1. User selects a sprint context and clicks "Run planning" on the
   project page.
2. `POST /api/projects/[id]/plan` loads the project, sprint context,
   backlog items, and dependencies.
3. `runPlanningOrchestration` produces a validated `PlanningResult`
   (AI-assisted or fallback, see above).
4. The route persists it via `createPlanningRun` and returns
   `{ result, run }`.
5. The client renders the result immediately and prepends a summary to
   the saved-runs list.

## Result persistence

- Persisted unconditionally on every successful orchestration call,
  regardless of `generatedBy` source.
- Reopening a saved run (`/runs/[id]` or `GET /api/runs/[runId]`)
  re-validates the stored JSON snapshots with `planningRunItemsSchema`
  before rendering, so a corrupted/legacy row would surface as an
  explicit `500` error rather than silently rendering incorrect data.

## Scenario support

See [`evaluation-support.md`](./evaluation-support.md) for the full
demo/evaluation-oriented description. In implementation terms: a
scenario is a normal `Project` plus one `EvaluationScenario` row; no
scenario-specific application logic exists elsewhere in the codebase.

## Limitations and deferred features

- No authentication or multi-user support.
- No manual editing/override of a generated recommendation.
- No run comparison view, analytics dashboard, or charts.
- No pagination on the saved-runs list.
- No run deletion.
- No streaming AI responses, chat UI, or prompt/conversation history.
- No automated test suite yet (verification so far has been via
  `npm run build`, manual `curl` checks, and browser-based manual
  verification).
- `generatedBy` is a small closed set (`"openai-v1"`,
  `"rule-based-v1-fallback"`) rather than a fully general model registry.
