# Evaluation scenarios

This document describes the predefined demo/evaluation scenarios seeded by
[`prisma/seed.ts`](../prisma/seed.ts). Each scenario is a normal `Project`
with its own backlog items, dependencies, and a sprint context - nothing
scenario-specific is hardcoded into the application logic. The only
scenario-specific concept is the `EvaluationScenario` row that labels a
project with a `key`, `name`, and `purpose`, so it can be identified and
reopened quickly during a demo or thesis evaluation session instead of
requiring manual data entry every time.

Scenarios are shown:

- on the dashboard (`/`), under **Demo scenarios**, each linking directly
  to its project
- on each scenario's project page, as a **Demo scenario** badge under the
  project name/description

## Why these scenarios

The three scenarios were chosen to exercise different parts of the
planning orchestration's deterministic scoring and risk-flag logic, so a
single demo pass can show more than one kind of recommendation behavior:

| Scenario                      | Demonstrates                                                                                                           |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| E-commerce Checkout Revamp    | mixed priorities, a blocked dependency chain, capacity that comfortably fits most items                                |
| Mobile App Onboarding Sprint  | a small, low-complexity backlog with no blocked items - the "happy path" baseline recommendation                       |
| Tech Debt & Bug Triage Sprint | missing story-point estimates and tight capacity - emphasizes risk-flag generation over typical feature prioritization |

## 1. E-commerce Checkout Revamp

**Key:** `ecommerce-checkout`

**Purpose:** A mid-size backlog with mixed priorities and a blocked
dependency chain - useful for demonstrating how the assistant balances
priority, readiness, and capacity, and how it explains excluding a
blocked item.

**Backlog items:**

| Title                           | Type      | Priority | Status  | Points |
| ------------------------------- | --------- | -------- | ------- | ------ |
| Redesign checkout page          | Feature   | High     | Ready   | 8      |
| Add Apple Pay support           | Feature   | Medium   | Backlog | 5      |
| Fix cart total rounding bug     | Bug       | Critical | Ready   | 3      |
| Refactor payment service client | Tech Debt | Low      | Backlog | 5      |
| Add saved addresses             | Feature   | Medium   | Backlog | 3      |
| Write checkout E2E tests        | Chore     | Low      | Backlog | —      |

**Dependency:** "Add saved addresses" is blocked until "Redesign checkout
page" is done.

**Sprint context:** Sprint 4, goal "Ship a faster, more reliable
checkout", capacity 15 points, 10 available days, team size 4.

## 2. Mobile App Onboarding Sprint

**Key:** `mobile-onboarding`

**Purpose:** A small, low-complexity backlog with no blocked
dependencies - useful for demonstrating the baseline happy-path
recommendation with minimal risk flags.

**Backlog items:**

| Title                                 | Type    | Priority | Status  | Points |
| ------------------------------------- | ------- | -------- | ------- | ------ |
| Design onboarding carousel            | Feature | High     | Ready   | 5      |
| Add social sign-in                    | Feature | Medium   | Backlog | 8      |
| Fix onboarding skip button bug        | Bug     | High     | Ready   | 2      |
| Track onboarding completion analytics | Chore   | Low      | Backlog | 3      |

**Dependencies:** none.

**Sprint context:** Sprint 1, goal "Deliver a smoother first-run
experience", capacity 12 points, 8 available days, team size 3.

## 3. Tech Debt & Bug Triage Sprint

**Key:** `tech-debt-triage`

**Purpose:** A capacity-constrained backlog dominated by bugs and tech
debt with missing story-point estimates - useful for demonstrating
risk-flag generation (missing estimates, capacity pressure) rather than
typical feature prioritization.

**Backlog items:**

| Title                                | Type      | Priority | Status  | Points |
| ------------------------------------ | --------- | -------- | ------- | ------ |
| Fix memory leak in background worker | Bug       | Critical | Ready   | 8      |
| Upgrade logging library              | Tech Debt | Medium   | Backlog | —      |
| Fix flaky integration tests          | Bug       | High     | Ready   | —      |
| Remove deprecated auth module        | Tech Debt | Low      | Backlog | 5      |
| Patch dependency vulnerability       | Bug       | Critical | Ready   | 3      |

**Dependency:** "Upgrade logging library" is blocked until "Fix memory
leak in background worker" is done.

**Sprint context:** Sprint 7, goal "Reduce critical bugs and stabilize
the platform", capacity 10 points, 6 available days, team size 3.

## Loading the scenarios

Run the seed script (see [`local-demo-guide.md`](./local-demo-guide.md)
for full setup steps):

```bash
npm run db:seed
```

The script is idempotent: it looks up each scenario by its unique `key`
first and skips it if already present, so re-running it (for example
after `prisma migrate reset`) never creates duplicates.
