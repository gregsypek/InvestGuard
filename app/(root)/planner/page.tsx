import { PiggyBank, PlusSquare, TrendingUp } from "lucide-react";

import { GoalProjectionChart } from "@/components/planner/GoalProjectionChart";
import PlannerForm from "./PlannerForm";
import { PlannerHeader } from "@/components/PlanerHeader";
import { PlannerList } from "@/components/planner/PlanenerList";
import PortfolioEmptyState from "@/components/PortfolioEmptyState";
import { SectionLayout } from "@/components/shared/SectionLayout";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getActivePortfolioId } from "@/lib/session";
import { redirect } from "next/navigation";

interface Props {
	searchParams: Promise<{ portfolioId?: string }>;
}

export default async function PlannerPage({ searchParams }: Props) {
	const session = await auth();

	if (!session?.user?.id) {
		redirect("/sign-in");
	}
	// 1. Pobieramy tylko portfele zalogowanego użytkownika
	const portfolios = await db.portfolio.findMany({
		where: { userId: session.user.id },
		include: { assets: true }, // Kluczowe dla obliczeń currentPortfolioValue
	});

	// EN: Resolve portfolioId from URL or fallback to cookies for "Add Asset" context
	const portfolioId = await getActivePortfolioId(searchParams);

	// 2. Obsługa pustego stanu: Jeśli brak portfeli, nie ma gdzie planować
	if (portfolios.length === 0) {
		return <PortfolioEmptyState variant="PORTFOLIOS" />;
	}

	if (!portfolioId) {
		return <PortfolioEmptyState variant="NOT_SELECTED" />;
	}
	// 3. Pobieramy plany przypisane do portfeli użytkownika
	const investmentPlans = await db.investmentPlan.findMany({
		where: {
			isExecuted: false,
			portfolio: {
				userId: session.user.id, // Filtrowanie planów po właścicielu portfela
			},
		},
		include: { portfolio: true },
	});

	const totalPlannedValue = investmentPlans.reduce(
		(sum, plan) => sum + plan.value,
		0,
	);
	const plannedCount = investmentPlans.length;

	// 1. Znajdź wybrany portfel
	const selectedPortfolio =
		portfolios.find((p) => p.id === portfolioId) || portfolios[0];

	// 2. OBLICZENIA (Poprawione nazwy pól i typowanie)

	// Wartość aktualna
	const currentPortfolioValue = selectedPortfolio.assets.reduce(
		(sum: number, a) => sum + Number(a.currentValue),
		0,
	);

	// Cel - używamy 'goal' zgodnie z Twoim schematem Zod
	const goalValue = Number(selectedPortfolio.goal) || 100000;

	// Miesięczne wpłaty - używamy 'value' zamiast 'amount'
	const monthlyPlanned = investmentPlans.reduce(
		(sum: number, p) => sum + Number(p.value), // Zmieniono p.amount na p.value
		0,
	);

	return (
		<div>
			{/* NAGŁÓWEK */}
			<PlannerHeader
				totalPlannedValue={totalPlannedValue}
				plannedCount={plannedCount}
				customBreadcrumbs={
					<div className="flex items-center gap-2 mb-2">
						<nav className="text-sm text-slate-400 italic">
							Narzędzia /{" "}
							<span className="text-blue-400 font-medium lowercase">
								Planer
							</span>
						</nav>
					</div>
				}
			/>

			{/* SEKCJA 1: Formularz */}
			<SectionLayout
				title="Nowy plan inwestycyjny"
				titleIcon={PlusSquare}
				subtitle="Zdefiniuj aktywo, które zamierzasz dodać do portfela w najbliższym czasie."
				description="Zaplanowane zakupy pozwalają Ci kontrolować przepływ gotówki i lepiej zarządzać budżetem inwestycyjnym. Dodając plan, określasz, jakie aktywo chcesz kupić, w jakiej ilości i kiedy. To narzędzie jest idealne do organizowania przyszłych zakupów i utrzymania dyscypliny inwestycyjnej."
			>
				{/* bg-t-bg-panel */}
				{/* Delikatny kontener, aby formularz ładnie odcinał się od tła strony */}
				<div className="bg-white/2 dark:bg-t-bg-panel border border-t-border rounded-2xl p-4 md:p-6 lg:p-8 shadow-sm">
					<PlannerForm
						portfolios={portfolios}
						defaultPortfolioId={portfolioId ?? undefined}
					/>
				</div>
			</SectionLayout>

			{/* SEKCJA 2: Lista Oczekujących */}
			<SectionLayout
				title="Oczekujące Realizacje"
				titleIcon={PiggyBank}
				subtitle="Lista zaplanowanych zakupów, które jeszcze nie zostały zrealizowane."
				description="Na jej podstawie możesz monitorować nadchodzące inwestycje i zarządzać nimi w czasie."
				action={
					<div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg">
						<span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
							Zaplanowane: {plannedCount}
						</span>
					</div>
				}
			>
				{/* Wyświetlamy listę bezpośrednio – strona będzie się naturalnie scrollować w dół */}
				<PlannerList />
			</SectionLayout>

			{/* SEKCJA 3: Projekcja Celu */}
			<SectionLayout
				title="Projekcja Celu"
				titleIcon={TrendingUp}
				subtitle="Symulacja osiągnięcia celu inwestycyjnego"
				description="Wizualizacja pokazuje, jak Twoje obecne oszczędności i plany inwestycyjne mogą przyczynić się do osiągnięcia wyznaczonego celu finansowego. Symulacja zakłada średnioroczne zwroty na poziomie 7%, co jest historycznym średnim wynikiem dla zdywersyfikowanego portfela akcji. Pamiętaj, że rzeczywiste wyniki mogą się różnić w zależności od warunków rynkowych."
			>
				{/* Kontener na wykres analogiczny do tego z formularza */}
				<div className="w-full bg-t-bg-panel border border-t-border rounded-2xl p-4 md:p-6 shadow-sm">
					<div className="h-[400px] w-full relative">
						<GoalProjectionChart
							currentValue={currentPortfolioValue}
							targetValue={goalValue}
							monthlyDeposit={monthlyPlanned}
						/>
					</div>
				</div>
			</SectionLayout>
		</div>
	);
}
