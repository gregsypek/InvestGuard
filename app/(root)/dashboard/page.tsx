// app/(root)/dashboard/page.tsx
import { db } from "@/lib/db";
import { calculateGapAnalysis } from "@/lib/calculations";
import AddAssetForm from "@/components/ui/assets/AddAssetForm";
import PortfolioTableBeauty from "@/app/portfel/components/PortfolioTableBeauty";
import PortfolioCharts from "@/components/PortfolioCharts";
// import ModelAllocationSummary from "@/components/ui/ModelAllocationSummary";

export default async function DashboardPage() {
	// Fetch portfolios to populate the selection dropdown in the form
	const portfolios = await db.portfolio.findMany({
		where: { userId: "1" },
		select: { id: true, name: true },
	});
	// Fetch only assets that belong to portfolios owned by user "1"
	const assets = await db.asset.findMany({
		where: {
			portfolio: {
				userId: "1", // Filtering via the relation with Portfolio
			},
		},
		include: {
			portfolio: true, // Including portfolio data to access its goals later
		},
	});

	const portfolioStatus = calculateGapAnalysis(assets);
	const totalValue = assets.reduce((sum, a) => sum + a.value, 0);

	return (
		<div className="space-y-8">
			<header>
				<h1 className="h1-bold text-foreground">Dashboard</h1>
				<p className="text-muted-foreground">
					Total Portfolio Value:{" "}
					<span className="font-bold text-foreground">
						{totalValue.toLocaleString()} PLN
					</span>
				</p>
			</header>

			{/* Form to add new EDO, ETF or Gold */}
			<AddAssetForm portfolios={portfolios} />

			<section className="grid gap-6">
				<h2 className="h2-bold">Rebalancing Guide</h2>
				{/* Detailed rebalancing table */}
				<PortfolioTableBeauty data={portfolioStatus} />
			</section>

			<section className="grid gap-6">
				<h2 className="h2-bold">Investment Strategy</h2>

				{/* Visual comparison of charts */}
				<PortfolioCharts data={portfolioStatus} />
			</section>
		</div>
	);
}
