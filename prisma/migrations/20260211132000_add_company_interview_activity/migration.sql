-- AlterTable
ALTER TABLE "Job" ADD COLUMN "companyId" INTEGER;
ALTER TABLE "Job" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "Company" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "website" TEXT,
  "industry" TEXT,
  "location" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" INTEGER NOT NULL,
  CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interview" (
  "id" SERIAL NOT NULL,
  "scheduledAt" TIMESTAMP(3) NOT NULL,
  "mode" TEXT,
  "round" TEXT,
  "status" TEXT NOT NULL DEFAULT 'scheduled',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "jobId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
  "id" SERIAL NOT NULL,
  "type" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "fromValue" TEXT,
  "toValue" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "jobId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_userId_name_key" ON "Company"("userId", "name");
CREATE INDEX "Company_userId_name_idx" ON "Company"("userId", "name");
CREATE INDEX "Interview_userId_scheduledAt_idx" ON "Interview"("userId", "scheduledAt");
CREATE INDEX "Activity_jobId_createdAt_idx" ON "Activity"("jobId", "createdAt");
CREATE INDEX "Job_userId_position_company_idx" ON "Job"("userId", "position", "company");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Company" ADD CONSTRAINT "Company_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Interview" ADD CONSTRAINT "Interview_jobId_fkey"
  FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Activity" ADD CONSTRAINT "Activity_jobId_fkey"
  FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
