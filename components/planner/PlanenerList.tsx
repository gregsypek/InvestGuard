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
		orderBy: { createdAt: "desc" },
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
			<div className="flex h-50 flex-col items-center justify-center rounded-md border border-dashed bg-card text-center">
				<p className="text-muted-foreground text-sm">
					Brak zaplanowanych inwestycji.
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			{plans.map((plan) => (
				<PlanCard
					key={plan.id}
					plan={plan}
					// 3. Sprawdzamy czy portfolioId tego konkretnego planu jest na liście portfeli z gotówką
					hasCashInPortfolio={cashPortfolioIds.has(plan.portfolioId)}
					allPortfoliosWithCash={allPortfoliosWithCash}
				/>
			))}
		</div>
	);
}
