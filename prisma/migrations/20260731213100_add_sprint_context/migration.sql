-- CreateTable
CREATE TABLE "sprint_contexts" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sprintGoal" TEXT,
    "teamCapacityPoints" INTEGER NOT NULL,
    "availableDays" INTEGER,
    "teamSize" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sprint_contexts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sprint_contexts_projectId_idx" ON "sprint_contexts"("projectId");

-- AddForeignKey
ALTER TABLE "sprint_contexts" ADD CONSTRAINT "sprint_contexts_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
