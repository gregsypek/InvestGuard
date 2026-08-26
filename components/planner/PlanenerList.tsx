import { CalendarClock } from "lucide-react";
import { PlannerClientList } from "./PlannerClientList";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export async function PlannerList() {
	const session = await auth();
	if (!session?.user?.id) redirect("/sign-in");

	const plans = await db.investmentPlan.findMany({
		where: {
			portfolio: { userId: session.user.id },
		},
		orderBy: [{ plannedDate: "asc" }, { createdAt: "desc" }],
		include: { portfolio: true },
	});

	const portfoliosWithAssets = await db.asset.findMany({
		where: {
			ticker: "CASH",
			portfolio: { userId: session.user.id },
		},
		select: { portfolioId: true },
	});

	// Konwersja na standardową tablicę do przesłania jako props
	const cashPortfolioIds = Array.from(
		new Set(portfoliosWithAssets.map((a) => a.portfolioId)),
	);

	const allPortfoliosWithCash = await db.portfolio.findMany({
		where: {
			userId: session.user.id,
			targetCash: { gt: 0 },
		},
		select: { id: true, name: true },
	});

	if (plans.length === 0) {
		return (
			<div className="w-full rounded-2xl border border-dashed border-t-border bg-t-bg-panel flex flex-col items-center justify-center py-16 px-4 text-center space-y-3">
				<div className="p-4 rounded-full bg-black/5 dark:bg-white/5 border border-t-border-subtle mb-2">
					<CalendarClock className="h-8 w-8 text-t-text-tertiary" />
				</div>
				<div className="space-y-1">
					<p className="text-sm font-bold text-t-text-primary tracking-tight">
						Brak zaplanowanych inwestycji
					</p>
					<p className="text-xs font-medium text-t-text-secondary">
						Użyj formularza obok, aby zdefiniować i zaplanować swoje pierwsze
						zakupy.
					</p>
				</div>
			</div>
		);
	}

	// =====================================================================
	// 🚀 LOGIKA AUTOMATYCZNEGO ROLOWANIA PRZETERMINOWANYCH PLANÓW
	// =====================================================================
	const now = new Date();
	const currentYear = now.getFullYear();
	const currentMonth = now.getMonth() + 1;
	const currentMonthStr = `${currentYear}-${currentMonth.toString().padStart(2, "0")}`;

	const processedPlans = plans.map((plan) => {
		const [pYear, pMonth] = plan.plannedDate.split("-").map(Number);

		// Sprawdzamy czy miesiąc lub rok planu jest w przeszłości
		const isPast =
			pYear < currentYear || (pYear === currentYear && pMonth < currentMonth);

		return {
			...plan,
			// Przebijamy wirtualnie datę na obecny miesiąc w UI dla zaległych planów
			plannedDate: isPast ? currentMonthStr : plan.plannedDate,
		};
	});

	return (
		<PlannerClientList
			plans={processedPlans}
			cashPortfolioIds={cashPortfolioIds}
			allPortfoliosWithCash={allPortfoliosWithCash}
		/>
	);
}
