// app/(root)/dashboard/page.tsx
import { db } from "@/lib/db";
import { calculateGapAnalysis } from "@/lib/calculations";
import AddAssetForm from "@/components/ui/assets/AddAssetForm";
import PortfolioTableBeauty from "@/app/portfel/components/PortfolioTableBeauty";
import PortfolioCharts from "@/components/PortfolioCharts";
// import ModelAllocationSummary from "@/components/ui/ModelAllocationSummary";
import { cookies } from "next/headers";

export default async function DashboardPage({
	searchParams,
}: {
	searchParams: Promise<{ portfolioId?: string }>;
}) {
	// 1. Czekamy na parametry z URL
	const { portfolioId: urlPortfolioId } = await searchParams;

	// 2. Pobieramy ciasteczka (jako zapas)
	const cookieStore = await cookies();
	const cookiePortfolioId = cookieStore.get("selectedPortfolioId")?.value;

	// 3. Ustalamy końcowe ID (URL ma pierwszeństwo)
	const portfolioId = urlPortfolioId || cookiePortfolioId;

	if (!portfolioId) {
		return (
			<div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
				<div className="text-6xl">🏜️</div>
				<h2 className="text-2xl font-bold">Wybierz portfel z menu powyżej</h2>
				<p className="text-muted-foreground">
					Musisz wybrać konkretny portfel, aby zobaczyć swoje inwestycje.
				</p>
			</div>
		);
	}

	// 2. Fetch assets filtered by the selected portfolio
	const assets = await db.asset.findMany({
		where: {
			portfolio: {
				// If portfolioId is missing, we could show all or a default one
				id: portfolioId,
				userId: "1",
			},
		},
		include: { portfolio: true },
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
			<AddAssetForm  />

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
