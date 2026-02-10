-- CreateTable
CREATE TABLE "InvestmentPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ticker" TEXT,
    "value" DOUBLE PRECISION NOT NULL,
    "plannedDate" TEXT NOT NULL,
    "targetCategory" "Category" NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "rationale" TEXT,
    "isExecuted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestmentPlan_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "InvestmentPlan" ADD CONSTRAINT "InvestmentPlan_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
