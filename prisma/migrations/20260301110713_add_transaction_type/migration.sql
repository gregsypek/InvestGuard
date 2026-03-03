-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('BUY', 'SELL');

-- AlterTable
ALTER TABLE "TransactionHistory" ADD COLUMN     "type" "TransactionType" NOT NULL DEFAULT 'BUY';
