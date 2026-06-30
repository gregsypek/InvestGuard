import { PiggyBank, PlusSquare, TrendingUp } from "lucide-react";
import {
	allWeatherPortfolio,
	classicPortfolio,
	demoPlans,
	yalePortfolio,
} from "@/lib/demoData";

import { GoalProjectionChart } from "@/components/planner/GoalProjectionChart";
import HeaderDemo from "@/components/HeaderDemo";
import { PlanCard } from "@/components/planner/PlanCard";
import PlannerForm from "@/components/planner/PlannerForm";
import { PlannerHeader } from "@/components/PlanerHeader";
import { SectionLayout } from "@/components/shared/SectionLayout";

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

	// 1. Ustalenie wybranej strategii (portfela Demo)
	const strategyKey = (
		s && s in STRATEGIES ? s : "classic"
	) as keyof typeof STRATEGIES;
	const portfolio = STRATEGIES[strategyKey];
	const demoPortfolios = [classicPortfolio, allWeatherPortfolio, yalePortfolio];

	// 2. Logika dla dat i statystyk
	const now = new Date();
	const currentYear = now.getFullYear();
	const currentMonth = now.getMonth() + 1;

	const plannedCount = demoPlans.length;

	// 🚀 ZMIANA: Bezpieczne obliczanie sumy - chroni przed błędem NaN,
	// konwertując ewentualne stringi/undefined na liczby
	const totalPlannedValue = demoPlans.reduce((sum, plan) => {
		const amount = Number(plan.value) || 0;
		// const price = Number(plan.estimatedPrice) || 0;
		// return amount * price;
		return amount;
	}, 0);

	return (
		<div className="flex flex-col min-h-screen bg-t-bg-base text-t-text-primary">
			{/* NAGŁÓWEK DEMO */}
			<HeaderDemo
				selectedPortfolioId={portfolio.id}
				portfolios={demoPortfolios.map((p) => ({ id: p.id, name: p.name }))}
			/>

			<main className="py-2 px-4 md:px-8 pb-16">
				<div className="max-w-7xl mx-auto w-full space-y-12">
					{/* ========================================= */}
					{/* HEADER PLANNERA (Wartości i Breadcrumbs)  */}
					{/* ========================================= */}
					<PlannerHeader
						totalPlannedValue={totalPlannedValue}
						plannedCount={plannedCount}
						customBreadcrumbs={
							<div className="flex items-center gap-2 mb-2">
								<nav className="text-sm text-t-text-tertiary italic">
									Narzędzia /{" "}
									<span className="text-emerald-500 font-bold uppercase tracking-widest text-[10px]">
										Planer (Demo)
									</span>
								</nav>
							</div>
						}
					/>

					{/* ========================================= */}
					{/* SEKCJA 1: Formularz Planowania (ZABLOKOWANY)*/}
					{/* ========================================= */}
					<SectionLayout
						title="Nowy plan inwestycyjny"
						titleIcon={PlusSquare}
						subtitle="Zdefiniuj aktywo, które zamierzasz dodać do portfela w najbliższym czasie."
						description="W wersji Demo formularz służy jedynie do celów poglądowych i edukacyjnych. Funkcja dodawania jest wyłączona."
					>
						<div className="w-full bg-t-bg-panel border border-t-border rounded-2xl shadow-sm overflow-hidden relative group">
							<div className="p-4 md:p-6 opacity-50 pointer-events-none transition-opacity duration-300">
								<PlannerForm
									portfolios={demoPortfolios}
									defaultPortfolioId={portfolio.id}
								/>
							</div>

							<div className="absolute inset-0 flex items-center justify-center bg-t-bg-base/30 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-2xl">
								<span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-4 py-2 rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-lg">
									Formularz zablokowany w trybie podglądu
								</span>
							</div>
						</div>
					</SectionLayout>

					{/* ========================================= */}
					{/* SEKCJA 2: Oczekujące Realizacje (LISTA)     */}
					{/* ========================================= */}
					<SectionLayout
						title="Oczekujące Realizacje"
						titleIcon={PiggyBank}
						subtitle="Lista zaplanowanych zakupów, które jeszcze nie zostały zrealizowane."
						description="Na jej podstawie możesz monitorować nadchodzące inwestycje i zarządzać nimi w czasie."
						action={
							<div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
								<span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
									Zaplanowane: {plannedCount}
								</span>
							</div>
						}
					>
						{/* 🚀 ZMIANA: gap-6 i items-start zapobiega nachodzeniu się kart w pionie. 
                Rozluźniamy siatkę do max 3 kolumn na ogromnych ekranach. */}
						<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
							{demoPlans.map((plan) => {
								const [pYear, pMonth] = plan.plannedDate.split("-").map(Number);
								const isLocked =
									pYear > currentYear ||
									(pYear === currentYear && pMonth > currentMonth);

								return (
									<PlanCard
										key={plan.id}
										isLocked={isLocked}
										plan={plan}
										isDemo={true}
										hasCashInPortfolio={true}
										allPortfoliosWithCash={demoPortfolios}
									/>
								);
							})}
						</div>
					</SectionLayout>

					{/* ========================================= */}
					{/* SEKCJA 3: Projekcja Celu (WYKRES)           */}
					{/* ========================================= */}
					<SectionLayout
						title="Projekcja Celu"
						titleIcon={TrendingUp}
						subtitle="Symulacja osiągnięcia celu inwestycyjnego"
						description="Wizualizacja pokazuje, jak Twoje obecne oszczędności i plany inwestycyjne mogą przyczynić się do osiągnięcia wyznaczonego celu finansowego przy założeniu 7% wzrostu."
					>
						<div className="w-full bg-t-bg-panel border border-t-border rounded-2xl p-4 md:p-6 shadow-sm overflow-hidden">
							{/* @ts-expect-error - Wykres może oczekiwać typów prosto z bazy, ignorujemy to w demo */}
							<GoalProjectionChart portfolio={portfolio} allPlans={demoPlans} />
						</div>
					</SectionLayout>
				</div>
			</main>
		</div>
	);
}
