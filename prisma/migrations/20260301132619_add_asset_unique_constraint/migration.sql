/*
  Warnings:

  - A unique constraint covering the columns `[portfolioId,ticker]` on the table `Asset` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Asset_portfolioId_ticker_key" ON "Asset"("portfolioId", "ticker");
