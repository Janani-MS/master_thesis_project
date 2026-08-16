# Local demo guide

Practical, step-by-step instructions for running the prototype locally,
loading sample data, and executing a planning run - useful for a
supervisor, evaluator, or anyone reproducing a thesis demo session.

## 1. Prerequisites

- Node.js (see `package.json` engines / your local Node version)
- PostgreSQL running locally, with a database created (this project was
  developed against a local Homebrew Postgres instance)
- An `.env` file at the project root with:

  ```
  DATABASE_URL="postgresql://<user>@localhost:5432/<database>?schema=public"

  # Optional - only needed for real OpenAI-generated recommendations.
  # If unset or invalid, planning runs automatically fall back to the
  # deterministic rule-based recommendation.
  OPENAI_API_KEY="sk-..."

  # Optional - defaults to "gpt-4o-mini" if unset.
  OPENAI_MODEL="gpt-4o-mini"
  ```

## 2. Install dependencies and set up the database

```bash
npm install
npx prisma migrate dev
npx prisma generate
```

## 3. Load the demo/evaluation scenarios

```bash
npm run db:seed
```

This creates three predefined projects (each with backlog items,
dependencies, and a sprint context) described in
[`evaluation-scenarios.md`](./evaluation-scenarios.md). The script is
safe to re-run - already-seeded scenarios are skipped, not duplicated.

## 4. Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 5. Explore a demo scenario

1. On the dashboard, find the **Demo scenarios** section and click one
   (for example "E-commerce Checkout Revamp").
2. The project page shows a **Demo scenario** badge with its purpose,
   the backlog (with a pre-populated blocked dependency in that
   scenario), and the sprint context ("Sprint 4").
3. Scroll to **Sprint planning**, select the sprint context, and click
   **Run planning**.
4. The planning result appears inline: recommended items, excluded
   items (e.g. the blocked one), the rationale, and risk flags. The run
   is also saved and appears under **Saved planning runs** - click it
   any time afterward to reopen the same result at `/runs/[id]`.

Repeat with the other two scenarios to see different recommendation
behavior (a low-risk baseline case, and a capacity-constrained,
missing-estimates case) - see
[`evaluation-scenarios.md`](./evaluation-scenarios.md) for what each is
meant to demonstrate.

## 6. Using your own data instead

The scenarios are optional. You can always create a new project from the
dashboard form, add backlog items/dependencies/sprint context manually,
and run planning the same way - the demo scenarios exist purely as a
shortcut to a known, reproducible starting point.

## 7. Resetting the database

To start over with a clean database (drops all data, re-applies
migrations, and re-runs the seed script automatically):

```bash
npx prisma migrate reset
```

## 8. Verifying the AI vs. fallback path

- With no `OPENAI_API_KEY` set (or an invalid one), every planning run
  uses the deterministic rule-based recommendation
  (`generatedBy: "rule-based-v1-fallback"`).
- With a valid `OPENAI_API_KEY`, a successful, schema-valid model
  response is used instead (`generatedBy: "openai-v1"`). The
  `generatedBy` field is shown as part of each saved run's summary, so
  you can confirm which path produced a given result.
