/*
  Warnings:

  - A unique constraint covering the columns `[externalId]` on the table `TransactionHistory` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "TransactionHistory" ADD COLUMN     "exchangeRate" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "originalCurrency" TEXT,
ADD COLUMN     "originalPrice" DOUBLE PRECISION;

-- CreateIndex
CREATE UNIQUE INDEX "TransactionHistory_externalId_key" ON "TransactionHistory"("externalId");

-- CreateIndex
CREATE INDEX "TransactionHistory_executedAt_executedValue_idx" ON "TransactionHistory"("executedAt", "executedValue");
