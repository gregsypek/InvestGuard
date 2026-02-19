// app/(root)/planner/page.tsx
import { db } from "@/lib/db";
import PlannerForm from "./PlannerForm";
import { PlannerList } from "@/components/planner/PlanenerList";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { getActivePortfolioId } from "@/lib/session"; // EN: Using our helper!
import { PlannerHeader } from "@/components/PlanerHeader";

interface Props {
	searchParams: Promise<{ portfolioId?: string }>;
}

export default async function PlannerPage({ searchParams }: Props) {
	// EN: Fetch data for the planner
	const portfolios = await db.portfolio.findMany();
	const investmentPlans = await db.investmentPlan.findMany({
		where: { isExecuted: false }, // EN: Only show pending plans in stats
	});

	// EN: Resolve active portfolio context
	const portfolioId = await getActivePortfolioId(searchParams);

	// EN: Calculate stats for the header
	const totalPlannedValue = investmentPlans.reduce(
		(sum, plan) => sum + plan.value,
		0,
	);
	const plannedCount = investmentPlans.length;

	return (
		<div className="space-y-10 pb-20">
			<PlannerHeader
				totalPlannedValue={totalPlannedValue}
				plannedCount={plannedCount}
				customBreadcrumbs={
					<nav className="text-sm text-muted-foreground mb-2 italic">
						Narzędzia / <span className="text-primary font-medium">Planer</span>
					</nav>
				}
			/>

			{/* EN: Main layout grid: Form (4 cols) and List (3 cols) */}
			<div className="grid gap-8 lg:grid-cols-7 items-start">
				{/* LEWA KOLUMNA: Formularz */}
				<div className="lg:col-span-4">
					<Card className="bg-card border-border2 shadow-lg rounded-2xl overflow-hidden">
						<CardHeader className="bg-muted/30 pb-8">
							<CardTitle className="text-2xl font-black tracking-tight">
								Nowy Plan
							</CardTitle>
							<CardDescription className="text-sm font-medium">
								Zdefiniuj aktywo, które zamierzasz dodać do portfela.
							</CardDescription>
						</CardHeader>
						<CardContent className="pt-8">
							<PlannerForm
								portfolios={portfolios}
								defaultPortfolioId={portfolioId}
							/>
						</CardContent>
					</Card>
				</div>

				{/* PRAWA KOLUMNA: Lista */}
				<div className="lg:col-span-3 space-y-6">
					<div className="flex items-center justify-between px-1">
						<h2 className="text-xl font-bold">Oczekujące Realizacje</h2>
					</div>

					<PlannerList />
				</div>
			</div>
		</div>
	);
}
