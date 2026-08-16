// prisma/seed.ts
//
// Seeds a small, fixed set of predefined demo/evaluation scenarios (see
// docs/evaluation-scenarios.md) so the app can be demonstrated and
// evaluated without manual data entry. Each scenario is a regular
// Project with its own backlog items, dependencies, and a sprint
// context - the only special part is the EvaluationScenario row that
// labels the project with a `key`, `name`, and `purpose` (see
// lib/evaluation-scenarios/).
//
// Idempotent: safe to run multiple times. Each scenario is looked up by
// its unique `key` first; if it already exists, seeding that scenario is
// skipped rather than creating duplicates.
//
// Run with `npm run db:seed` (or `npx prisma db seed`).

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "../lib/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type BacklogItemType = "FEATURE" | "BUG" | "TECH_DEBT" | "CHORE";
type BacklogItemPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type BacklogItemStatus = "BACKLOG" | "READY" | "IN_PROGRESS" | "DONE";

interface ScenarioBacklogItemDef {
  /** Local-only key used to reference this item from a dependency def below - not persisted. */
  key: string;
  title: string;
  type: BacklogItemType;
  priority: BacklogItemPriority;
  status: BacklogItemStatus;
  storyPoints: number | null;
}

interface ScenarioDependencyDef {
  /** The item that is blocked ... */
  fromKey: string;
  /** ... until this item is done. */
  toKey: string;
}

interface ScenarioDef {
  key: string;
  name: string;
  purpose: string;
  project: { name: string; description: string };
  backlogItems: ScenarioBacklogItemDef[];
  dependencies: ScenarioDependencyDef[];
  sprintContext: {
    name: string;
    sprintGoal: string;
    teamCapacityPoints: number;
    availableDays: number;
    teamSize: number;
  };
}

const scenarios: ScenarioDef[] = [
  {
    key: "ecommerce-checkout",
    name: "E-commerce Checkout Revamp",
    purpose:
      "A mid-size backlog with mixed priorities and a blocked dependency " +
      "chain, useful for demonstrating how the assistant balances " +
      "priority, readiness, and capacity, and how it explains excluding a " +
      "blocked item.",
    project: {
      name: "E-commerce Checkout Revamp",
      description:
        "Improve checkout conversion and reliability for the online store.",
    },
    backlogItems: [
      {
        key: "redesign-checkout",
        title: "Redesign checkout page",
        type: "FEATURE",
        priority: "HIGH",
        status: "READY",
        storyPoints: 8,
      },
      {
        key: "apple-pay",
        title: "Add Apple Pay support",
        type: "FEATURE",
        priority: "MEDIUM",
        status: "BACKLOG",
        storyPoints: 5,
      },
      {
        key: "rounding-bug",
        title: "Fix cart total rounding bug",
        type: "BUG",
        priority: "CRITICAL",
        status: "READY",
        storyPoints: 3,
      },
      {
        key: "payment-refactor",
        title: "Refactor payment service client",
        type: "TECH_DEBT",
        priority: "LOW",
        status: "BACKLOG",
        storyPoints: 5,
      },
      {
        key: "saved-addresses",
        title: "Add saved addresses",
        type: "FEATURE",
        priority: "MEDIUM",
        status: "BACKLOG",
        storyPoints: 3,
      },
      {
        key: "checkout-e2e-tests",
        title: "Write checkout E2E tests",
        type: "CHORE",
        priority: "LOW",
        status: "BACKLOG",
        storyPoints: null,
      },
    ],
    dependencies: [
      // "Add saved addresses" is blocked until "Redesign checkout page" is done.
      { fromKey: "saved-addresses", toKey: "redesign-checkout" },
    ],
    sprintContext: {
      name: "Sprint 4",
      sprintGoal: "Ship a faster, more reliable checkout",
      teamCapacityPoints: 15,
      availableDays: 10,
      teamSize: 4,
    },
  },
  {
    key: "mobile-onboarding",
    name: "Mobile App Onboarding Sprint",
    purpose:
      "A small, low-complexity backlog with no blocked dependencies, " +
      "useful for demonstrating the baseline happy-path recommendation " +
      "with minimal risk flags.",
    project: {
      name: "Mobile App Onboarding",
      description: "Improve the first-run experience for the mobile app.",
    },
    backlogItems: [
      {
        key: "onboarding-carousel",
        title: "Design onboarding carousel",
        type: "FEATURE",
        priority: "HIGH",
        status: "READY",
        storyPoints: 5,
      },
      {
        key: "social-sign-in",
        title: "Add social sign-in",
        type: "FEATURE",
        priority: "MEDIUM",
        status: "BACKLOG",
        storyPoints: 8,
      },
      {
        key: "skip-button-bug",
        title: "Fix onboarding skip button bug",
        type: "BUG",
        priority: "HIGH",
        status: "READY",
        storyPoints: 2,
      },
      {
        key: "onboarding-analytics",
        title: "Track onboarding completion analytics",
        type: "CHORE",
        priority: "LOW",
        status: "BACKLOG",
        storyPoints: 3,
      },
    ],
    dependencies: [],
    sprintContext: {
      name: "Sprint 1",
      sprintGoal: "Deliver a smoother first-run experience",
      teamCapacityPoints: 12,
      availableDays: 8,
      teamSize: 3,
    },
  },
  {
    key: "tech-debt-triage",
    name: "Tech Debt & Bug Triage Sprint",
    purpose:
      "A capacity-constrained backlog dominated by bugs and tech debt " +
      "with missing story-point estimates, useful for demonstrating " +
      "risk-flag generation (missing estimates, capacity pressure) " +
      "rather than typical feature prioritization.",
    project: {
      name: "Platform Stability Sprint",
      description: "Reduce critical bugs and pay down platform tech debt.",
    },
    backlogItems: [
      {
        key: "memory-leak",
        title: "Fix memory leak in background worker",
        type: "BUG",
        priority: "CRITICAL",
        status: "READY",
        storyPoints: 8,
      },
      {
        key: "logging-upgrade",
        title: "Upgrade logging library",
        type: "TECH_DEBT",
        priority: "MEDIUM",
        status: "BACKLOG",
        storyPoints: null,
      },
      {
        key: "flaky-tests",
        title: "Fix flaky integration tests",
        type: "BUG",
        priority: "HIGH",
        status: "READY",
        storyPoints: null,
      },
      {
        key: "remove-deprecated-auth",
        title: "Remove deprecated auth module",
        type: "TECH_DEBT",
        priority: "LOW",
        status: "BACKLOG",
        storyPoints: 5,
      },
      {
        key: "patch-vulnerability",
        title: "Patch dependency vulnerability",
        type: "BUG",
        priority: "CRITICAL",
        status: "READY",
        storyPoints: 3,
      },
    ],
    dependencies: [
      // "Upgrade logging library" is blocked until the memory leak is fixed.
      { fromKey: "logging-upgrade", toKey: "memory-leak" },
    ],
    sprintContext: {
      name: "Sprint 7",
      sprintGoal: "Reduce critical bugs and stabilize the platform",
      teamCapacityPoints: 10,
      availableDays: 6,
      teamSize: 3,
    },
  },
];

async function seedScenario(scenario: ScenarioDef): Promise<void> {
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const project = await tx.project.create({
      data: {
        name: scenario.project.name,
        description: scenario.project.description,
      },
    });

    const itemIdByKey = new Map<string, string>();
    for (const item of scenario.backlogItems) {
      const created = await tx.backlogItem.create({
        data: {
          projectId: project.id,
          title: item.title,
          type: item.type,
          priority: item.priority,
          status: item.status,
          storyPoints: item.storyPoints,
        },
      });
      itemIdByKey.set(item.key, created.id);
    }

    for (const dependency of scenario.dependencies) {
      const fromItemId = itemIdByKey.get(dependency.fromKey);
      const toItemId = itemIdByKey.get(dependency.toKey);
      if (!fromItemId || !toItemId) {
        throw new Error(
          `Scenario "${scenario.key}" has a dependency referencing an unknown item key.`,
        );
      }
      await tx.backlogDependency.create({
        data: { fromItemId, toItemId },
      });
    }

    await tx.sprintContext.create({
      data: {
        projectId: project.id,
        name: scenario.sprintContext.name,
        sprintGoal: scenario.sprintContext.sprintGoal,
        teamCapacityPoints: scenario.sprintContext.teamCapacityPoints,
        availableDays: scenario.sprintContext.availableDays,
        teamSize: scenario.sprintContext.teamSize,
      },
    });

    await tx.evaluationScenario.create({
      data: {
        key: scenario.key,
        name: scenario.name,
        purpose: scenario.purpose,
        projectId: project.id,
      },
    });
  });
}

async function main(): Promise<void> {
  for (const scenario of scenarios) {
    const existing = await prisma.evaluationScenario.findUnique({
      where: { key: scenario.key },
    });
    if (existing) {
      console.log(`Skipping "${scenario.name}" - already seeded.`);
      continue;
    }
    await seedScenario(scenario);
    console.log(`Seeded scenario "${scenario.name}".`);
  }
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
