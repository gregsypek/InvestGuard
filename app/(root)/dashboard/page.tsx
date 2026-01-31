// app/(root)/dashboard/page.tsx
import { db } from "@/lib/db";
import { calculateGapAnalysis } from "@/lib/calculations";
import AddAssetForm from "@/components/ui/assets/AddAssetForm";
import PortfolioTableBeauty from "@/app/portfel/components/PortfolioTableBeauty";
import PortfolioCharts from "@/components/PortfolioCharts";

export default async function DashboardPage() {
	// Fetch real data from your Vercel Postgres
	const assets = await db.asset.findMany();
	console.log("🚀 ~ DashboardPage ~ assets:", assets);

	const portfolioStatus = calculateGapAnalysis(assets);
	console.log("🚀 ~ DashboardPage ~ portfolioStatus:", portfolioStatus);
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
			<AddAssetForm />

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
