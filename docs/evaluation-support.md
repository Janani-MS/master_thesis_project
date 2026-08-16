# Evaluation support

Practical guidance for running a scenario-based usability/demo
evaluation of the prototype, and for capturing evidence for a thesis
evaluation chapter. This complements
[`evaluation-scenarios.md`](./evaluation-scenarios.md) (what the
scenarios contain) and [`local-demo-guide.md`](./local-demo-guide.md)
(step-by-step setup).

## Available demo scenarios

Three predefined, reproducible scenarios are seeded via
`npm run db:seed` (see [`evaluation-scenarios.md`](./evaluation-scenarios.md)
for full detail on each):

1. **E-commerce Checkout Revamp** - mixed priorities + a blocked
   dependency chain.
2. **Mobile App Onboarding Sprint** - small, low-complexity, no blocked
   items (baseline/happy-path case).
3. **Tech Debt & Bug Triage Sprint** - missing story-point estimates +
   tight capacity (risk-flag-heavy case).

Each appears on the dashboard under **Demo scenarios** and is marked
with a **Demo scenario** badge (name + purpose) on its project page, so
an evaluator can identify and reopen a known case without needing to
re-enter data.

## How to run demos

1. Follow [`local-demo-guide.md`](./local-demo-guide.md) to install,
   migrate, and seed the database, then start the app (`npm run dev`).
2. From the dashboard, open a scenario from the **Demo scenarios**
   section.
3. Review the pre-populated backlog and dependencies, then open
   **Sprint planning**, select the pre-seeded sprint context, and click
   **Run planning**.
4. Observe the inline result (recommended scope, rationale, risk flags)
   and the entry added to **Saved planning runs**.
5. Optionally reopen the run later via its link (`/runs/[id]`) to
   confirm it reproduces the same result.
6. Repeat for the other scenarios, and/or re-run the same scenario with
   and without a valid `OPENAI_API_KEY` set to compare
   `generatedBy: "openai-v1"` vs. `generatedBy: "rule-based-v1-fallback"`
   results for the same input.

## Suggested scenario-based evaluation flow

A structured session an evaluator (or the thesis author, for
self-evaluation) can follow:

1. **Orientation** - open the dashboard, explain the workflow: project →
   backlog → dependencies → sprint context → run → result → saved runs.
2. **Scenario 1 walkthrough** (E-commerce Checkout Revamp) - run
   planning, check that the blocked item ("Add saved addresses") is
   excluded and the rationale/risk flags explain why.
3. **Scenario 2 walkthrough** (Mobile App Onboarding) - run planning,
   confirm a straightforward recommendation with few or no risk flags.
4. **Scenario 3 walkthrough** (Tech Debt & Bug Triage) - run planning,
   confirm risk flags mention missing story-point estimates and/or
   capacity pressure.
5. **AI vs. fallback comparison** - run the same scenario once with a
   valid `OPENAI_API_KEY` and once without, and compare the two
   `PlanningResult`s (recommended items, rationale wording, risk flags)
   side by side.
6. **Reopening a saved run** - navigate away and back via the saved-runs
   list / `/runs/[id]` to confirm the result is faithfully reproduced.
7. **Free exploration** - let the evaluator create their own project and
   backlog from scratch to test the workflow without a pre-seeded
   scenario.

## What evaluators can test

- **Correctness/explainability of scoring:** does the deterministic
  ranking (priority, readiness, blocked penalty) match what a human
  planner would expect, and is the rationale/risk-flag text
  understandable without further explanation?
- **Usability of the workflow:** can a new user complete the full
  project → backlog → sprint context → run → result flow without
  guidance?
- **AI vs. deterministic comparison:** does the OpenAI-generated
  recommendation differ meaningfully from the rule-based one, and is
  either clearly "better" for a given scenario?
- **Fallback robustness:** does the system still produce a usable result
  when `OPENAI_API_KEY` is missing/invalid or the model output is
  malformed (this can be forced by temporarily unsetting/breaking the
  key)?
- **Result persistence/reopening:** does a saved run faithfully
  reproduce the original result?

## What evidence/screenshots to capture

- Dashboard showing the **Demo scenarios** section (for a "getting
  started" figure).
- A scenario's project page showing the **Demo scenario** badge and its
  pre-populated backlog/dependencies.
- The inline planning result view (recommended items, rationale, risk
  flags) immediately after a run - once for `generatedBy:
"openai-v1"` and once for `generatedBy: "rule-based-v1-fallback"`, for
  a direct side-by-side figure.
- The **Saved planning runs** list showing multiple runs.
- A reopened run at `/runs/[id]` to demonstrate persistence.
- Server logs showing a fallback trigger (e.g. `"[planning] OPENAI_API_KEY
is not set; using the deterministic fallback."`) as evidence the
  fallback path is real and exercised, not just theoretical.
- Terminal output of `npm run build` and `npm run db:seed` as evidence
  of a reproducible, working setup.

## Known prototype limitations relevant to evaluation

- **Single user, no auth:** evaluation sessions should assume one
  operator at a time; there is no concept of separate evaluator accounts
  or permissions.
- **No manual override:** an evaluator cannot edit a recommendation
  after generation - only rerun planning (e.g. with a different sprint
  context/capacity) to see a different result.
- **No side-by-side comparison UI:** AI-vs-fallback or run-vs-run
  comparison must be done manually (e.g. opening two `/runs/[id]` pages
  or reading two JSON responses), since no comparison dashboard exists.
- **No automated test suite:** verification has been via manual
  `curl`/browser checks and `npm run build`; formal correctness
  guarantees beyond Zod validation are limited.
- **OpenAI cost/availability:** the AI path depends on external API
  availability and incurs API cost per run; the deterministic fallback
  is what makes repeated evaluation sessions free and reliable.
- **Fixed scenario set:** only 3 predefined scenarios exist; testing
  additional business contexts requires manually creating a project.
