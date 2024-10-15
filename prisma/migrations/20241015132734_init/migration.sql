/*
  Warnings:

  - Added the required column `settings` to the `Company` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "settings" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "Token" ADD COLUMN     "topic" TEXT;

-- CreateTable
CREATE TABLE "AccessLevels" (
    "id" SERIAL NOT NULL,
    "access" JSONB NOT NULL,
    "userId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,

    CONSTRAINT "AccessLevels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccessLevels_userId_companyId_key" ON "AccessLevels"("userId", "companyId");

-- AddForeignKey
ALTER TABLE "AccessLevels" ADD CONSTRAINT "AccessLevels_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessLevels" ADD CONSTRAINT "AccessLevels_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
