import PortfolioForm from "@/components/PortfolioForm";
import { db } from "@/lib/db";
import { getGlobalStats } from "@/lib/calculations";
import { PortfoliosHeader } from "@/components/PortfoliosHeader";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function NewPortfolioPage() {
	// 1. Fetch all portfolios to provide global context in the header
	const allPortfolios = await db.portfolio.findMany({
		include: { assets: true },
	});

	// 2. Calculate global stats (Total Value, Counts)
	const { totalValue, portfoliosCount, assetsCount } =
		getGlobalStats(allPortfolios);

	return (
		<div className="space-y-8">
			{/* Header showing that even though this is a NEW portfolio, 
          you already manage a certain amount of capital.
      */}
			<PortfoliosHeader
				title="Create New Portfolio"
				totalValue={totalValue}
				portfoliosCount={portfoliosCount}
				assetsCount={assetsCount}
				customBreadcrumbs={
					<div className="flex items-center gap-2 mb-2">
						<Link
							href="/portfolios"
							className="text-muted-foreground hover:text-primary transition-colors"
						>
							<ChevronLeft className="h-4 w-4" />
						</Link>
						<nav className="text-sm text-muted-foreground">
							Portfolios / New
						</nav>
					</div>
				}
			/>

			<div>
				{/* The form is called without initialData for a fresh start.
            It will handle the creation via portfolio.actions.
        */}
				<PortfolioForm />
			</div>
		</div>
	);
}
