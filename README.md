# Generative AI Sprint Planning Assistant

A master's thesis MVP: a workflow-based sprint-planning assistant for
Scrum-style teams. The application helps users prioritize backlog items,
recommend sprint scope, explain recommendation logic, flag basic risks and
dependencies, and save/review planning runs.

See [docs/copilot-master-prompt.md](docs/copilot-master-prompt.md) and
[docs/architecture-spec.md](docs/architecture-spec.md) for the full product
and architecture specification. The confirmed stack and MVP boundaries in
those documents must be followed for all future changes.

## Tech stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS
- PostgreSQL + Prisma ORM (v7, driver adapters)
- OpenAI API, orchestrated through a custom module in `lib/planning/`

## Project structure

```
app/                  Next.js App Router routes and layout
components/           Shared UI components (e.g. nav bar)
lib/
  prisma.ts           Prisma client singleton (PostgreSQL driver adapter)
  planning/           Custom AI orchestration layer
    scoring.ts        Deterministic backlog pre-ranking
    prompt-builder.ts Structured prompt construction
    validators.ts     Request/response validation (Zod)
    orchestrator.ts   Coordinates scoring, prompting, validation, persistence
prisma/
  schema.prisma       Database schema (models added incrementally)
```

## Local setup

### Prerequisites

- Node.js 20.19+ and npm
- A local or hosted PostgreSQL database (e.g. Postgres.app, Docker, or
  Supabase)
- An OpenAI API key

### Steps

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment template and fill in real values:

   ```bash
   cp .env.example .env
   ```

   Set `DATABASE_URL` to your PostgreSQL connection string and
   `OPENAI_API_KEY` to a valid OpenAI API key.

3. Apply the database schema (once models exist in `prisma/schema.prisma`):

   ```bash
   npx prisma migrate dev
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000).

### Useful commands

- `npx prisma generate` — regenerate the Prisma client after schema changes
- `npx prisma studio` — browse the database visually
- `npm run lint` — run ESLint
- `npm run build` — production build

### Evaluation

This project addresses the research question of how AI-supported planning can help agile teams translate project requirements into a realistic, explainable delivery plan. The intended user workflow is to enter project requirements, constraints, team capacity, and task dependencies; generate an initial plan; review the system’s capacity and dependency checks; and use the explanations to support human decision-making.

The requirements were informed by a survey of 70 respondents. The survey findings identified recurring planning challenges, desired AI-supported capabilities, and the importance of transparency and control in automated scheduling decisions. These findings were used to prioritize the system’s core requirements, including capacity-aware planning, dependency-aware sequencing, and explainable recommendations.

The implementation was evaluated through 27 controlled planning runs. These runs exercised different combinations of requirements, team capacity, task dependencies, and planning scenarios to assess whether the system produced feasible and consistent plans.

The evaluation included checks for:

- **Capacity limits:** whether assigned work respected available team capacity and avoided overallocation.
- **Dependency handling:** whether predecessor–successor relationships were respected in the generated schedule.
- **Explanation accuracy:** whether the system’s explanations correctly reflected the constraints, capacity constraints, and dependency relationships that influenced the plan.

The evaluation demonstrates that the system can support structured, capacity-aware and dependency-aware planning while providing explanations for its recommendations. However, the results are based on a limited number of controlled runs and a survey-based requirements process rather than a longitudinal deployment in a production software team. Real-world projects may involve changing priorities, incomplete or ambiguous requirements, organizational constraints, and stakeholder preferences that are difficult to fully model automatically.

For these reasons, human review remains necessary. The system is intended as a decision-support tool: it can generate and explain candidate plans, but project managers and team members should validate assumptions, review trade-offs, and make the final planning decisions.
