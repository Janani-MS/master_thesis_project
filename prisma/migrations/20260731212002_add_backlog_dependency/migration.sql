-- CreateTable
CREATE TABLE "backlog_dependencies" (
    "id" TEXT NOT NULL,
    "fromItemId" TEXT NOT NULL,
    "toItemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "backlog_dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "backlog_dependencies_fromItemId_idx" ON "backlog_dependencies"("fromItemId");

-- CreateIndex
CREATE INDEX "backlog_dependencies_toItemId_idx" ON "backlog_dependencies"("toItemId");

-- CreateIndex
CREATE UNIQUE INDEX "backlog_dependencies_fromItemId_toItemId_key" ON "backlog_dependencies"("fromItemId", "toItemId");

-- AddForeignKey
ALTER TABLE "backlog_dependencies" ADD CONSTRAINT "backlog_dependencies_fromItemId_fkey" FOREIGN KEY ("fromItemId") REFERENCES "backlog_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backlog_dependencies" ADD CONSTRAINT "backlog_dependencies_toItemId_fkey" FOREIGN KEY ("toItemId") REFERENCES "backlog_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
