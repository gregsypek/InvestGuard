// app/(root)/portfolios/page.tsx
import { db } from "@/lib/db";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import PortfolioCard from "@/components/PortfolioCard";
import { PortfoliosHeader } from "@/components/PortfoliosHeader";
import { getGlobalStats } from "@/lib/calculations";
import { CategoryTable } from "@/components/CategoryTable";

export default async function PortfoliosPage() {
	// 1. Fetch all data with assets included
	const portfolios = await db.portfolio.findMany({
		include: { assets: true },
		orderBy: { createdAt: "desc" },
	});

	// 2. Calculate global statistics for the header and table
	const { totalValue, portfoliosCount, assetsCount, categoryTotals } =
		getGlobalStats(portfolios);

	if (portfolios.length === 0) {
		// ... empty state remains the same
	}

	return (
		<div className="space-y-10 pb-20">
			<PortfoliosHeader
				title="My Portfolios"
				totalValue={totalValue}
				portfoliosCount={portfoliosCount}
				assetsCount={assetsCount}
				customBreadcrumbs={
					<nav className="text-sm text-muted-foreground mb-2">
						Portfolios / <span className="text-primary font-medium">All</span>
					</nav>
				}
			/>

			{/* HORIZONTAL SCROLL CONTAINER FOR CARDS
          - overflow-x-auto: enables horizontal scroll
          - snap-x snap-mandatory: cards "stick" to position when scrolling
          - md:grid: reverts to standard grid layout on larger screens
      */}
			<div className="flex overflow-x-auto pb-6 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 snap-x snap-mandatory no-scrollbar">
				{portfolios.map((p) => (
					<div key={p.id} className="min-w-65 md:min-w-0 snap-center">
						<PortfolioCard portfolio={p} />
					</div>
				))}
			</div>

			{/* Global Asset Allocation Table */}
			<div className="pt-10 border-t border-border2">
				<div className="flex justify-between items-end mb-6">
					<div>
						<h2 className="text-2xl font-bold">Asset Allocation</h2>
						<p className="text-muted-foreground text-sm">
							Global distribution by category (Combined from all portfolios)
						</p>
					</div>
					<Button asChild variant="outline" size="sm">
						<Link href="/portfolios/new" className="gap-2">
							<Plus className="h-4 w-4" /> Add New
						</Link>
					</Button>
				</div>

				<CategoryTable data={categoryTotals} totalValue={totalValue} />
			</div>
		</div>
	);
}
