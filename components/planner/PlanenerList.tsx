import { db } from "@/lib/db";
import { PlanCard } from "./PlanCard";

export async function PlannerList() {
	const plans = await db.investmentPlan.findMany({
		orderBy: { createdAt: "desc" },
		include: { portfolio: true },
	});

	if (plans.length === 0) {
		return (
			<div className="flex h-50 flex-col items-center justify-center rounded-md border border-dashed bg-card text-center animate-in fade-in-50">
				<p className="text-muted-foreground text-sm">
					Brak zaplanowanych inwestycji.
				</p>
				<p className="text-xs text-muted-foreground mt-1">
					Wypełnij formularz po lewej, aby dodać nowy cel.
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			{plans.map((plan) => (
				<PlanCard key={plan.id} plan={plan} />
			))}
		</div>
	);
}
