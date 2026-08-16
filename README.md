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
