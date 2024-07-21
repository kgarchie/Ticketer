/*
  Warnings:

  - You are about to drop the column `a_info` on the `Ticket` table. All the data in the column will be lost.
  - You are about to drop the column `airtel_no` on the `Ticket` table. All the data in the column will be lost.
  - You are about to drop the column `amount` on the `Ticket` table. All the data in the column will be lost.
  - You are about to drop the column `company` on the `Ticket` table. All the data in the column will be lost.
  - You are about to drop the column `issue` on the `Ticket` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Ticket` table. All the data in the column will be lost.
  - You are about to drop the column `paybill_no` on the `Ticket` table. All the data in the column will be lost.
  - You are about to drop the column `safaricom_no` on the `Ticket` table. All the data in the column will be lost.
  - You are about to drop the column `transaction_date` on the `Ticket` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Ticket" DROP COLUMN "a_info",
DROP COLUMN "airtel_no",
DROP COLUMN "amount",
DROP COLUMN "company",
DROP COLUMN "issue",
DROP COLUMN "name",
DROP COLUMN "paybill_no",
DROP COLUMN "safaricom_no",
DROP COLUMN "transaction_date",
ADD COLUMN     "info" TEXT NOT NULL DEFAULT 'Default';
