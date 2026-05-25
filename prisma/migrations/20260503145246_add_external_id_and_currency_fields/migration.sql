/*
  Warnings:

  - A unique constraint covering the columns `[externalId]` on the table `TransactionHistory` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "Category" ADD VALUE 'UNKNOWN';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TransactionType" ADD VALUE 'DEPOSIT';
ALTER TYPE "TransactionType" ADD VALUE 'INTEREST';

-- AlterTable
ALTER TABLE "TransactionHistory" ADD COLUMN     "exchangeRate" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "originalCurrency" TEXT,
ADD COLUMN     "originalPrice" DOUBLE PRECISION;

-- CreateIndex
CREATE UNIQUE INDEX "TransactionHistory_externalId_key" ON "TransactionHistory"("externalId");

-- CreateIndex
CREATE INDEX "TransactionHistory_executedAt_executedValue_idx" ON "TransactionHistory"("executedAt", "executedValue");
