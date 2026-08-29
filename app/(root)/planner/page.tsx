import { PlannerDashboardClient } from "@/components/planner/PlannerDashboardClient"; // 👈 Nowy import
import PlannerForm from "@/components/planner/PlannerForm";
import { PlannerHeader } from "@/components/PlanerHeader";
import { PlusSquare } from "lucide-react";
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

	// 1. STRAŻNIK: Pobiera konkretny portfel do domyślnego formularza
	const { portfolio, errorComponent } = await getGuardedPortfolio({
		searchParams,
		userId: session.user.id,
	});
	// Jeśli użytkownik nie ma portfeli, nie wybrał żadnego, lub wpisał złe ID -
	// Strażnik automatycznie zaserwuje odpowiedni wariant <PortfolioEmptyState />

	if (errorComponent || !portfolio) {
		return errorComponent;
	}

	// 2. Pobieramy wszystkie portfele usera z aktywami (do Projekcji i Selektorów)
	const allUserPortfolios = await db.portfolio.findMany({
		where: { userId: session.user.id },
		include: { assets: true }, // Niezbędne do wyliczania currentValue na żywo
	});

	// 3. Pobieramy WSZYSTKIE oczekujące plany użytkownika
	const allPlans = await db.investmentPlan.findMany({
		where: {
			portfolio: { userId: session.user.id },
			isExecuted: false,
		},
		orderBy: [{ plannedDate: "asc" }, { createdAt: "desc" }],
		include: { portfolio: true },
	});

	// 4. Pobieramy informację o tym, które portfele mają CASH
	const portfoliosWithAssets = await db.asset.findMany({
		where: {
			ticker: "CASH",
			portfolio: { userId: session.user.id },
		},
		select: { portfolioId: true },
	});
	const cashPortfolioIds = Array.from(
		new Set(portfoliosWithAssets.map((a) => a.portfolioId)),
	);

	// =====================================================================
	// 5. LOGIKA AUTOMATYCZNEGO ROLOWANIA PRZETERMINOWANYCH PLANÓW
	// =====================================================================
	const now = new Date();
	const currentYear = now.getFullYear();
	const currentMonth = now.getMonth() + 1;
	const currentMonthStr = `${currentYear}-${currentMonth.toString().padStart(2, "0")}`;

	const processedPlans = allPlans.map((plan) => {
		const [pYear, pMonth] = plan.plannedDate.split("-").map(Number);
		const isPast =
			pYear < currentYear || (pYear === currentYear && pMonth < currentMonth);

		return {
			...plan,
			// Podmieniamy w locie starą datę na aktualny miesiąc dla UI
			plannedDate: isPast ? currentMonthStr : plan.plannedDate,
		};
	});

	// Globalne statystyki do górnego nagłówka (PlannerHeader)
	const totalPlannedValue = processedPlans.reduce(
		(sum, plan) => sum + Number(plan.value),
		0,
	);

	// Obliczanie aktualnej wartości portfela
	// Ustawiamy datę na pierwszy dzień obecnego miesiąca (godzina 00:00:00)
	const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

	const monthlyInvestedResult = await db.transactionHistory.aggregate({
		where: {
			// 1. Zabezpieczenie: tylko portfele tego konkretnego użytkownika
			portfolio: {
				userId: session.user.id,
			},
			// 2. Interesują nas tylko faktyczne zakupy (możesz dodać też "DEPOSIT", jeśli tak wolisz liczyć)
			type: "BUY",
			// 3. Ograniczenie czasowe: tylko transakcje od 1-go dnia obecnego miesiąca
			executedAt: {
				gte: firstDayOfMonth,
			},
		},
		_sum: {
			executedValue: true, // Prisma sama zsumuje tę kolumnę
		},
	});

	// Wyciągamy zsumowaną wartość (lub 0, jeśli w tym miesiącu nie było transakcji)
	const monthlyInvested = monthlyInvestedResult._sum.executedValue || 0;

	return (
		<div>
			{/* NAGŁÓWEK GŁÓWNY */}
			<PlannerHeader
				totalPlannedValue={totalPlannedValue}
				plannedCount={processedPlans.length}
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

			{/* SEKCJA 1: Formularz (Pozostaje na górze, zapięty na domyślny portfel) */}
			<SectionLayout
				title="Nowy plan inwestycyjny"
				titleIcon={PlusSquare}
				subtitle="Zdefiniuj aktywo, które zamierzasz dodać do portfela w najbliższym czasie."
				description="Zaplanowane zakupy pozwalają Ci kontrolować przepływ gotówki i lepiej zarządzać budżetem inwestycyjnym."
			>
				<div className="bg-white/2 dark:bg-t-bg-panel border border-t-border rounded-2xl p-4 md:p-6 lg:p-8 shadow-sm">
					<PlannerForm
						portfolios={allUserPortfolios}
						defaultPortfolioId={portfolio.id}
					/>
				</div>
			</SectionLayout>

			{/* SEKCJE 2 i 3: Lista i Projekcja (Zarządzane przez nowego klienta) */}
			<PlannerDashboardClient
				portfolios={allUserPortfolios}
				plans={processedPlans}
				cashPortfolioIds={cashPortfolioIds}
				monthlyInvested={monthlyInvested}
			/>
		</div>
	);
}
