# Generative AI Sprint Planning Assistant - MVP Architecture Specification

## Overview

This project is a master's thesis prototype for a **Generative AI-based Sprint Planning Assistant** focused on Scrum-style sprint planning support.

The application is designed as a workflow-based decision-support system that helps users:

- prioritize backlog items
- recommend feasible sprint scope
- explain recommendation logic
- identify basic risks and dependency issues
- save and review planning runs

The system is intentionally scoped as an MVP to remain feasible within a two-month thesis timeline.

## Architecture principles

The architecture must follow these principles:

- simple over complex
- structured workflow over chatbot behavior
- custom orchestration over heavy AI frameworks
- relational persistence over unnecessary infrastructure
- explainability and traceability over automation hype
- buildable MVP over feature breadth

## Confirmed stack

### Frontend

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS

### Backend

- Next.js API routes or server-side application logic
- Custom planning orchestration module

### Data

- PostgreSQL
- Prisma ORM

### AI

- OpenAI API
- Structured JSON outputs
- Prompt templates
- Lightweight deterministic preprocessing

### Deployment

- Vercel for application hosting
- Supabase or managed PostgreSQL for database hosting

## Explicit non-goals for MVP

The MVP must **not** include:

- separate vector database
- RAG
- LangChain or similar orchestration framework
- multi-agent architecture
- Redis
- background worker system
- live Jira integration
- real-time collaboration
- open-ended chatbot UX

These can be mentioned later as future work, but they are not part of implementation.

## System layers

The system should consist of the following layers:

### 1. Frontend layer

Responsible for:

- project selection
- backlog management
- sprint context input
- planning run initiation
- results display
- run history display

### 2. Application/backend layer

Responsible for:

- request handling
- validation
- loading relevant data from PostgreSQL
- calling orchestration logic
- persisting outputs
- serving data to the frontend

### 3. Planning orchestration layer

Responsible for:

- lightweight pre-ranking/scoring
- prompt construction
- OpenAI API call
- structured output validation
- transforming model output into domain objects

### 4. Persistence layer

Responsible for storing:

- projects
- backlog items
- dependencies
- sprint contexts
- planning runs
- recommendations
- selected items
- evaluation scenarios

## Core domain entities

The application must model these entities:

- **Project**
- **BacklogItem**
- **BacklogDependency**
- **SprintContext**
- **PlanningRun**
- **Recommendation**
- **SelectedItem**
- **EvaluationScenario**

## Main workflow

The expected application workflow is:

1. User creates or opens a project
2. User adds, edits, or imports backlog items
3. User defines sprint context such as sprint goal, team capacity, and constraints
4. User starts a planning run
5. Backend loads relevant structured data from PostgreSQL
6. Backend applies lightweight deterministic scoring
7. Backend builds a structured prompt payload
8. OpenAI API returns structured recommendation JSON
9. Backend validates and persists the result
10. Frontend displays recommended sprint scope, prioritized items, explanations, and risk flags
11. User may review or adjust the recommendation

## Main product screens

The MVP should include these screens:

### Dashboard

Purpose:

- show projects
- show recent planning runs
- provide entry points to create projects and start work

### Project detail / backlog workspace

Purpose:

- display project metadata
- manage backlog items
- manage dependencies
- access sprint planning

### Sprint planning form

Purpose:

- collect sprint goal
- collect capacity and team context
- select relevant backlog items
- trigger planning

### Planning results page

Purpose:

- show recommended sprint scope
- show prioritized backlog list
- show explanations and risk flags
- support result review

### Planning history page

Purpose:

- show previous planning runs
- reopen saved runs
- support scenario comparison later

## Data persistence requirements

Use PostgreSQL as the primary database because the main application data is structured and relational.

Persist at least the following:

- projects
- backlog items
- dependency relationships
- sprint context definitions
- planning run input snapshots
- recommendation summaries
- item-level recommendation decisions
- evaluation scenarios for thesis demonstrations

Do not introduce a separate vector store in the MVP.

## Planning orchestration requirements

The orchestration layer must be custom and lightweight.

Recommended files:

- `lib/planning/scoring.ts`
- `lib/planning/prompt-builder.ts`
- `lib/planning/validators.ts`
- `lib/planning/orchestrator.ts`

### Responsibilities

#### `scoring.ts`

- compute a lightweight candidate ranking
- incorporate fields such as business value, priority, story points, readiness, and dependency penalties

#### `prompt-builder.ts`

- build a structured prompt from project, backlog, and sprint context data
- constrain output format

#### `validators.ts`

- validate request payloads
- validate LLM structured response

#### `orchestrator.ts`

- coordinate scoring, prompt construction, OpenAI call, response validation, and persistence-ready output mapping

## Suggested route structure

### App routes

- `/`
- `/projects/[id]`
- `/projects/[id]/plan`
- `/runs/[id]`

### API routes

- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:id`
- `GET /api/projects/:id/backlog`
- `POST /api/projects/:id/backlog`
- `PATCH /api/backlog-items/:id`
- `DELETE /api/backlog-items/:id`
- `GET /api/projects/:id/sprint-contexts`
- `POST /api/projects/:id/sprint-contexts`
- `POST /api/projects/:id/plan`
- `GET /api/runs/:id`
- `GET /api/projects/:id/runs`

## MVP feature list

### Must-have

- project creation and selection
- backlog CRUD
- dependency management
- sprint context input
- AI-assisted planning run
- prioritized backlog output
- sprint scope recommendation
- explanation per recommendation
- basic risk and dependency flags
- planning run persistence
- planning run history

### Should-have

- manual override of recommended selection
- comparison of prior planning runs
- demo data import for thesis evaluation

### Excluded from MVP

- RAG-based retrieval
- vector search
- live integrations with Jira or GitHub
- autonomous multi-agent planning
- advanced analytics dashboards
- collaboration and multi-user complexity

## Quality requirements

The implementation should satisfy the following:

- strong TypeScript typing
- modular code organization
- Prisma-managed persistence
- validation for all input and model output
- readable and maintainable architecture
- reproducible local development setup
- deployable MVP suitable for demo and thesis evaluation

## Thesis alignment

This architecture is intended to support a master's thesis artifact that is:

- focused
- explainable
- implementable within two months
- suitable for Design Science Research
- appropriate for scenario-based evaluation
- strong enough to demonstrate a working prototype without unnecessary technical scope
