/*
  Warnings:

  - Added the required column `companyId` to the `EphemeralUser` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EphemeralUser" ADD COLUMN     "companyId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "EphemeralUser" ADD CONSTRAINT "EphemeralUser_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
