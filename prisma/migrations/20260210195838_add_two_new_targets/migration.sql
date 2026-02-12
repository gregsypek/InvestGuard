-- AlterTable
ALTER TABLE "Portfolio" ADD COLUMN     "targetCommodities" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "targetCrypto" INTEGER NOT NULL DEFAULT 0;
