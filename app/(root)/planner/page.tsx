import { Card, CardContent } from "@/components/ui/card";
import { PiggyBank, PlusSquare, TrendingUp } from "lucide-react";

import { CustomCardHeader } from "@/components/shared/CustomCardHeader";
import { GoalProjectionChart } from "@/components/planner/GoalProjectionChart";
import PlannerForm from "./PlannerForm";
import { PlannerHeader } from "@/components/PlanerHeader";
import { PlannerList } from "@/components/planner/PlanenerList";
import PortfolioEmptyState from "@/components/PortfolioEmptyState";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { SubHeader } from "@/components/shared/SubHeader";
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
		<div className="space-y-10">
			{/* EN: Consistent vertical spacing with PortfoliosPage */}
			<PlannerHeader
				totalPlannedValue={totalPlannedValue}
				plannedCount={plannedCount}
				customBreadcrumbs={
					<nav className="text-sm text-muted-foreground italic">
						Narzędzia /{" "}
						<span className="text-primary font-medium lowercase">Planer</span>
					</nav>
				}
			/>
			<div className="grid gap-8 xl:grid-cols-7 items-start">
				{/* LEWA KOLUMNA: Formularz (4 z 7) */}
				<div className="lg:col-span-4 space-y-8 xl:border-r xl:border-border pe-4">
					{/* EN: Unified section header style */}
					<SectionHeader
						title="Nowy plan
						inwestycyjny"
						icon={PlusSquare}
					/>

					<Card className="bg-background border-none shadow-none  overflow-hidden col-span-2">
						<CustomCardHeader
							icon={PiggyBank}
							title="Parametry zakupu"
							description="Zdefiniuj aktywo, które zamierzasz dodać do portfela w
								najbliższym czasie."
						/>
						<CardContent className="pt-8">
							<PlannerForm
								portfolios={portfolios}
								defaultPortfolioId={portfolioId ?? undefined}
							/>
						</CardContent>
					</Card>
				</div>

				{/* PRAWA KOLUMNA: Lista (3 z 7) - STICKY */}
				{/* EN: Making the list sticky so it stays visible while filling long forms */}
				<div className="lg:col-span-3 space-y-8  lg:top-32">
					<div className="flex items-center justify-between gap-2 px-1">
						<div className="flex items-center gap-2">
							<h2 className="text-xl font-bold mb-2">Oczekujące Realizacje</h2>
						</div>
						<span className="bg-blue-500/10 text-blue-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
							{plannedCount}
						</span>
					</div>

					<div className="max-h-[70vh] overflow-y-auto no-scrollbar pr-1 -mr-1">
						<PlannerList />
					</div>

					{/* <Card className="bg-card/30 border-border p-6 rounded-3xl">
						<SectionHeader title="Projekcja Celu" icon={TrendingUp} />
						<div className="pt-6">
							<GoalProjectionChart
								currentValue={currentPortfolioValue}
								targetValue={goalValue}
								monthlyDeposit={monthlyPlanned}
							/>
						</div>
					</Card> */}
				</div>
			</div>
			<section className="  pt-8 border-t border-border pb-6">
				<SectionHeader title="Projekcja Celu" icon={TrendingUp} />
				<SubHeader
					title="Symulacja osiągnięcia celu inwestycyjnego"
					description="Wizualizacja pokazuje, jak Twoje obecne oszczędności i plany inwestycyjne mogą przyczynić się do osiągnięcia wyznaczonego celu finansowego. Symulacja zakłada średnioroczne zwroty na poziomie 7%, co jest historycznym średnim wynikiem dla zdywersyfikowanego portfela akcji. Pamiętaj, że rzeczywiste wyniki mogą się różnić w zależności od warunków rynkowych."
					icon={TrendingUp}
				/>
				<div className="pt-6 px-8 w-full">
					{/* Kontener wewnętrzny daje sztywną wysokość dla wykresu[cite: 1] */}
					<div className="h-110 w-full">
						<GoalProjectionChart
							currentValue={currentPortfolioValue}
							targetValue={goalValue}
							monthlyDeposit={monthlyPlanned}
						/>
					</div>
				</div>
			</section>
		</div>
	);
}
