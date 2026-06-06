import { PiggyBank, PlusSquare, TrendingUp } from "lucide-react";

import { GoalProjectionChart } from "@/components/planner/GoalProjectionChart";
import PlannerForm from "@/components/planner/PlannerForm";
import { PlannerHeader } from "@/components/PlanerHeader";
import { PlannerList } from "@/components/planner/PlanenerList";
import { SectionLayout } from "@/components/shared/SectionLayout";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getGuardedPortfolio } from "@/components/shared/portfolio-guard";
import { redirect } from "next/navigation";

interface Props {
	searchParams: Promise<{ portfolioId?: string }>;
}

export default async function PlannerPage({ searchParams }: Props) {
	const session = await auth();

	if (!session?.user?.id) {
		redirect("/sign-in");
	}

	// =====================================================================
	// 1. STRAŻNIK: Pobiera konkretny portfel i obsługuje wszystkie błędy
	// =====================================================================
	const { portfolio, errorComponent } = await getGuardedPortfolio({
		searchParams,
		userId: session.user.id,
	});

	// Jeśli użytkownik nie ma portfeli, nie wybrał żadnego, lub wpisał złe ID -
	// Strażnik automatycznie zaserwuje odpowiedni wariant <PortfolioEmptyState />
	if (errorComponent || !portfolio) {
		return errorComponent;
	}

	const allUserPortfolios = await db.portfolio.findMany({
		where: { userId: session.user.id },
		select: { id: true, name: true }, // Pobieramy absolutne minimum do dropdownu
	});

	// =====================================================================
	// 2. POBIERANIE PLANÓW INWESTYCYJNYCH (Tylko dla tego portfela)
	// =====================================================================
	// ZMIANA: Filtrujemy plany stricte po id aktywnego portfela,
	// aby nie mieszać planów z innych portfeli tego samego użytkownika.
	const investmentPlans = await db.investmentPlan.findMany({
		where: {
			portfolioId: portfolio.id,
			isExecuted: false,
		},
	});

	// =====================================================================
	// 3. OBLICZENIA DLA WYBRANEGO PORTFELA
	// =====================================================================

	// Plany i miesięczne wpłaty
	const totalPlannedValue = investmentPlans.reduce(
		(sum, plan) => sum + Number(plan.value),
		0,
	);
	const plannedCount = investmentPlans.length;
	const monthlyPlanned = totalPlannedValue; // Uproszczenie  kodu

	// Wartość aktualna aktywów (Strażnik pobrał już assets w pamięci)
	const currentPortfolioValue = portfolio.assets.reduce(
		(sum, a) => sum + Number(a.currentValue),
		0,
	);

	// Cel portfela (zabezpieczenie na wypadek braku)
	const goalValue = Number(portfolio.goal) || 100000;

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
						portfolios={allUserPortfolios}
						defaultPortfolioId={portfolio.id}
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
