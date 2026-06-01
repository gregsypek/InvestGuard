import { CalendarClock } from "lucide-react";
import { PlanCard } from "./PlanCard";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export async function PlannerList() {
	const session = await auth();
	if (!session?.user?.id) redirect("/sign-in");

	// 1. Pobieramy plany (ważne: filtrujemy po userId, żeby nie widzieć planów innych osób)
	const plans = await db.investmentPlan.findMany({
		where: {
			portfolio: { userId: session.user.id },
		},
		orderBy: [{ plannedDate: "asc" }, { createdAt: "desc" }],
		include: { portfolio: true },
	});

	// 2. Pobieramy ID portfeli, które fizycznie posiadają aktywo "CASH"
	// To jest kluczowe dla działania funkcji executePlan
	const portfoliosWithAssets = await db.asset.findMany({
		where: {
			ticker: "CASH",
			portfolio: { userId: session.user.id },
		},
		select: { portfolioId: true },
	});

	// Tworzymy zbiór (Set) ID portfeli z gotówką dla szybkiego wyszukiwania
	const cashPortfolioIds = new Set(
		portfoliosWithAssets.map((a) => a.portfolioId),
	);

	const allPortfoliosWithCash = await db.portfolio.findMany({
		where: {
			userId: session.user.id,
			// Szukamy portfeli, które mają zdefiniowany cel na gotówkę większy niż 0%
			// lub po prostu wszystkie portfele użytkownika, jeśli dopuszczasz wpłatę do każdego
			targetCash: {
				gt: 0,
			},
		},
		select: {
			id: true,
			name: true,
		},
	});
	// console.log(
	// 	"🚀 ~ PlannerList ~ allPortfoliosWithCash:",
	// 	allPortfoliosWithCash,
	// );

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

	// --- LOGIKA DATY DO BLOKADY ---
	const now = new Date();
	const currentYear = now.getFullYear();
	const currentMonth = now.getMonth() + 1;

	return (
		<div className="flex flex-col md:flex-row gap-4 flex-wrap">
			{plans.map((plan) => {
				// EN: Calculate lock status based on plannedDate vs current month
				// UI: Obliczanie statusu blokady na podstawie daty planu względem obecnego miesiąca
				const [pYear, pMonth] = plan.plannedDate.split("-").map(Number);
				const isLocked =
					pYear > currentYear ||
					(pYear === currentYear && pMonth > currentMonth);

				return (
					<PlanCard
						key={plan.id}
						plan={plan}
						isLocked={isLocked}
						hasCashInPortfolio={cashPortfolioIds.has(plan.portfolioId)}
						allPortfoliosWithCash={allPortfoliosWithCash}
					/>
				);
			})}
		</div>
	);
}
