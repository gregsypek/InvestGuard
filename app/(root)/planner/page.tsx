import { PlannerDashboardClient } from "@/components/planner/PlannerDashboardClient"; // 👈 Nowy import
import { PlannerHeader } from "@/components/PlanerHeader";
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

	const currentMonthTransactions = await db.transactionHistory.findMany({
		where: {
			portfolio: { userId: session.user.id },
			type: "BUY",
			executedAt: { gte: firstDayOfMonth },
		},
		orderBy: { executedAt: "desc" },
	});
	return (
		<div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-24">
			{/* NAGŁÓWEK GŁÓWNY */}
			<PlannerHeader
				initialTotalPlannedValue={totalPlannedValue}
				initialPlannedCount={processedPlans.length}
				portfolios={allUserPortfolios}
				plans={processedPlans}
				customBreadcrumbs={
					<nav
						key="planner-nav"
						className="flex items-center gap-1.5 text-[10px] sm:text-xs md:text-sm text-slate-400 italic mb-2"
					>
						<span>Narzędzia</span>
						<span className="text-slate-500">/</span>
						<span className="text-theme-primary font-medium lowercase">
							Planer
						</span>
					</nav>
				}
			/>

			{/* SEKCJE 2 i 3: Lista i Projekcja (Zarządzane przez klienta) */}
			<PlannerDashboardClient
				portfolios={allUserPortfolios}
				plans={processedPlans}
				cashPortfolioIds={cashPortfolioIds}
				monthlyInvested={monthlyInvested}
				currentMonthTransactions={currentMonthTransactions}
				defaultPortfolioId={portfolio.id}
			/>
		</div>
	);
}
