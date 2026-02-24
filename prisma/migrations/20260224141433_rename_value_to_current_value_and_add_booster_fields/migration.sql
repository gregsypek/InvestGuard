/*
  Warnings:

  - You are about to drop the column `value` on the `Asset` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Asset" DROP COLUMN "value",
ADD COLUMN     "conviction" INTEGER,
ADD COLUMN     "currentValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "expectedRoi" DOUBLE PRECISION,
ADD COLUMN     "interestRate" DOUBLE PRECISION,
ADD COLUMN     "investedCapital" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "maturityDate" TIMESTAMP(3),
ADD COLUMN     "purchaseDate" TIMESTAMP(3),
ADD COLUMN     "rateType" TEXT,
ADD COLUMN     "riskLevel" TEXT;
