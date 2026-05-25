/*
  Warnings:

  - The values [UNKNOWN] on the enum `Category` will be removed. If these variants are still used in the database, this will fail.
  - The values [DEPOSIT,INTEREST] on the enum `TransactionType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `exchangeRate` on the `TransactionHistory` table. All the data in the column will be lost.
  - You are about to drop the column `externalId` on the `TransactionHistory` table. All the data in the column will be lost.
  - You are about to drop the column `originalCurrency` on the `TransactionHistory` table. All the data in the column will be lost.
  - You are about to drop the column `originalPrice` on the `TransactionHistory` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Category_new" AS ENUM ('BONDS', 'DEVELOPED', 'EMERGING', 'GOLD', 'BOOSTER', 'CASH', 'CRYPTO', 'COMMODITIES');
ALTER TABLE "Asset" ALTER COLUMN "category" TYPE "Category_new" USING ("category"::text::"Category_new");
ALTER TABLE "InvestmentPlan" ALTER COLUMN "targetCategory" TYPE "Category_new" USING ("targetCategory"::text::"Category_new");
ALTER TABLE "TransactionHistory" ALTER COLUMN "category" TYPE "Category_new" USING ("category"::text::"Category_new");
ALTER TYPE "Category" RENAME TO "Category_old";
ALTER TYPE "Category_new" RENAME TO "Category";
DROP TYPE "public"."Category_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TransactionType_new" AS ENUM ('BUY', 'SELL', 'UPDATE');
ALTER TABLE "public"."TransactionHistory" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "TransactionHistory" ALTER COLUMN "type" TYPE "TransactionType_new" USING ("type"::text::"TransactionType_new");
ALTER TYPE "TransactionType" RENAME TO "TransactionType_old";
ALTER TYPE "TransactionType_new" RENAME TO "TransactionType";
DROP TYPE "public"."TransactionType_old";
ALTER TABLE "TransactionHistory" ALTER COLUMN "type" SET DEFAULT 'BUY';
COMMIT;

-- DropIndex
DROP INDEX "TransactionHistory_executedAt_executedValue_idx";

-- DropIndex
DROP INDEX "TransactionHistory_externalId_key";

-- AlterTable
ALTER TABLE "TransactionHistory" DROP COLUMN "exchangeRate",
DROP COLUMN "externalId",
DROP COLUMN "originalCurrency",
DROP COLUMN "originalPrice";
