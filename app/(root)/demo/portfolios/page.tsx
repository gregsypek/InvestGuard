import {
	allWeatherPortfolio,
	classicPortfolio,
	yalePortfolio,
} from "@/lib/demoData";

import HeaderDemo from "@/components/HeaderDemo";
import PortfoliosClientView from "@/components/ui/PortfolioClientView";
import { PortfoliosHeader } from "@/components/PortfoliosHeader";
import { getGlobalStats } from "@/lib/calculations";

// Tip: Move this object to a shared lib file to avoid duplication
const STRATEGIES = {
	classic: { data: classicPortfolio, title: "Klasyczny 60/40" },
	dalio: { data: allWeatherPortfolio, title: "Ray Dalio" },
	yale: { data: yalePortfolio, title: "Model Yale" },
};

export default async function DemoPortfoliosPage({
	searchParams,
}: {
	searchParams: Promise<{ s?: string }>;
}) {
	const { s } = await searchParams;
	const strategyKey = (
		s && s in STRATEGIES ? s : "classic"
	) as keyof typeof STRATEGIES;
	const strategy = STRATEGIES[strategyKey];

	// const portfolioId = await getActivePortfolioId(searchParams);

	// In demo "Portfolios" view, we probably want to show all demo strategies
	const demoPortfolios = [classicPortfolio, allWeatherPortfolio, yalePortfolio];

	const { totalValue, assetsCount, portfoliosCount, categoryTotals } =
		getGlobalStats(demoPortfolios);

	return (
		<div className="flex flex-col min-h-screen">
			<HeaderDemo
				selectedPortfolioId={strategy.data.id}
				portfolios={demoPortfolios.map((p) => ({ id: p.id, name: p.name }))}
			/>
			<div className="container mx-auto space-y-10 pb-20 py-2 px-8">
				<PortfoliosHeader
					title="Portfele Demo"
					totalValue={totalValue}
					portfoliosCount={portfoliosCount}
					assetsCount={assetsCount}
					customBreadcrumbs={
						<nav className="text-sm text-muted-foreground mb-2">
							Portfele /{" "}
							<span className="text-primary font-medium ">Wszystkie</span>
						</nav>
					}
				/>

				<PortfoliosClientView
					portfolios={demoPortfolios}
					portfolioId={strategy.data.id}
					categoryTotals={categoryTotals}
					isDemo={true}
				/>
			</div>
		</div>
	);
}
