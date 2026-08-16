-- CreateEnum
CREATE TYPE "BacklogItemType" AS ENUM ('FEATURE', 'BUG', 'TECH_DEBT', 'CHORE');

-- CreateEnum
CREATE TYPE "BacklogItemPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "BacklogItemStatus" AS ENUM ('BACKLOG', 'READY', 'IN_PROGRESS', 'DONE');

-- CreateTable
CREATE TABLE "backlog_items" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "BacklogItemType" NOT NULL DEFAULT 'FEATURE',
    "priority" "BacklogItemPriority" NOT NULL DEFAULT 'MEDIUM',
    "storyPoints" INTEGER,
    "status" "BacklogItemStatus" NOT NULL DEFAULT 'BACKLOG',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "backlog_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "backlog_items_projectId_idx" ON "backlog_items"("projectId");

-- AddForeignKey
ALTER TABLE "backlog_items" ADD CONSTRAINT "backlog_items_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
