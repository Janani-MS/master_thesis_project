-- CreateTable
CREATE TABLE "planning_runs" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sprintContextId" TEXT NOT NULL,
    "generatedBy" TEXT NOT NULL,
    "rationaleSummary" TEXT NOT NULL,
    "riskFlags" TEXT[],
    "totalRecommendedStoryPoints" INTEGER NOT NULL,
    "prioritizedItems" JSONB NOT NULL,
    "recommendedItems" JSONB NOT NULL,
    "excludedItems" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "planning_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "planning_runs_projectId_idx" ON "planning_runs"("projectId");

-- CreateIndex
CREATE INDEX "planning_runs_sprintContextId_idx" ON "planning_runs"("sprintContextId");

-- AddForeignKey
ALTER TABLE "planning_runs" ADD CONSTRAINT "planning_runs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planning_runs" ADD CONSTRAINT "planning_runs_sprintContextId_fkey" FOREIGN KEY ("sprintContextId") REFERENCES "sprint_contexts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
