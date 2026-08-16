-- CreateTable
CREATE TABLE "evaluation_scenarios" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evaluation_scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "evaluation_scenarios_key_key" ON "evaluation_scenarios"("key");

-- CreateIndex
CREATE UNIQUE INDEX "evaluation_scenarios_projectId_key" ON "evaluation_scenarios"("projectId");

-- AddForeignKey
ALTER TABLE "evaluation_scenarios" ADD CONSTRAINT "evaluation_scenarios_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
