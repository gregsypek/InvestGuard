import { Card, CardContent } from "@/components/ui/card";
import { PiggyBank, PlusSquare } from "lucide-react";
import {
	allWeatherPortfolio,
	classicPortfolio,
	demoPlans,
	yalePortfolio,
} from "@/lib/demoData";

import { CustomCardHeader } from "@/components/shared/CustomCardHeader";
import HeaderDemo from "@/components/HeaderDemo";
import { PlanCard } from "@/components/planner/PlanCard";
import PlannerForm from "@/app/(root)/planner/PlannerForm";
import { SectionHeader } from "@/components/shared/SectionHeader";

const STRATEGIES = {
	classic: classicPortfolio,
	dalio: allWeatherPortfolio,
	yale: yalePortfolio,
};

export default async function DemoPlannerPage({
	searchParams,
}: {
	searchParams: Promise<{ s?: string }>;
}) {
	const { s } = await searchParams;
	const strategyKey = (
		s && s in STRATEGIES ? s : "classic"
	) as keyof typeof STRATEGIES;
	const strategy = STRATEGIES[strategyKey];

	const demoPortfolios = [classicPortfolio, allWeatherPortfolio, yalePortfolio];

	return (
		<div className="flex flex-col min-h-screen">
			<HeaderDemo
				selectedPortfolioId={strategy.id}
				portfolios={demoPortfolios.map((p) => ({ id: p.id, name: p.name }))}
			/>

			<main className="py-2 px-8 space-y-10 container mx-auto">
				<div className="grid gap-8 xl:grid-cols-7 items-start">
					{/* LEWA KOLUMNA: Formularz */}
					<div className="lg:col-span-4 space-y-8 xl:border-r xl:border-border pe-4">
						<SectionHeader title="Nowy plan inwestycyjny" icon={PlusSquare} />

						<Card className="bg-background border-none shadow-none overflow-hidden">
							<CustomCardHeader
								icon={PiggyBank}
								title="Parametry zakupu (Demo)"
								description="Zdefiniuj aktywo, które chcesz dodać. W wersji demo formularz służy do nauki."
							/>
							<CardContent className="pt-8 opacity-60 pointer-events-none">
								<PlannerForm
									portfolios={demoPortfolios}
									defaultPortfolioId={strategy.id}
								/>
								<div className="text-center text-xs text-emerald-600 font-bold mt-4">
									— Formularz zablokowany w trybie podglądu —
								</div>
							</CardContent>
						</Card>
					</div>

					{/* PRAWA KOLUMNA: Lista planów */}
					<div className="lg:col-span-3 space-y-8">
						<h2 className="text-xl font-bold px-1">Oczekujące Realizacje</h2>
						<div className="space-y-4">
							{demoPlans.map((plan) => (
								<PlanCard
									key={plan.id}
									plan={plan}
									isDemo={true}
									hasCashInPortfolio={true}
									allPortfoliosWithCash={demoPortfolios}
								/>
							))}
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
