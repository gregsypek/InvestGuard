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
import { getActivePortfolioId } from "@/lib/session";
import { PlannerHeader } from "@/components/PlanerHeader";
import { PlusSquare } from "lucide-react";

interface Props {
	searchParams: Promise<{ portfolioId?: string }>;
}

export default async function PlannerPage({ searchParams }: Props) {
	const portfolios = await db.portfolio.findMany();
	const investmentPlans = await db.investmentPlan.findMany({
		where: { isExecuted: false },
		include: { portfolio: true }, // EN: Crucial for the PlanCard to show names
	});

	const portfolioId = await getActivePortfolioId(searchParams);

	const totalPlannedValue = investmentPlans.reduce(
		(sum, plan) => sum + plan.value,
		0,
	);
	const plannedCount = investmentPlans.length;

	return (
		<div className="space-y-10 pb-20">
			{" "}
			{/* EN: Consistent vertical spacing with PortfoliosPage */}
			<PlannerHeader
				totalPlannedValue={totalPlannedValue}
				plannedCount={plannedCount}
				customBreadcrumbs={
					<nav className="text-sm text-muted-foreground mb-2 italic">
						Narzędzia / <span className="text-primary font-medium">Planer</span>
					</nav>
				}
			/>
			<div className="grid gap-8 xl:grid-cols-7 items-start">
				{/* LEWA KOLUMNA: Formularz (4 z 7) */}
				<div className="lg:col-span-4 space-y-8">
					{/* EN: Unified section header style */}

					<h2 className="h2-bold flex items-center gap-2">
						<PlusSquare className="h-5 w-5 text-primary" /> Nowy plan
						inwestycyjny
					</h2>

					<Card className="bg-card border-border2 shadow-lg rounded-2xl overflow-hidden col-span-2">
						<CardHeader className="bg-muted/30 pb-6">
							<CardTitle className="text-xl font-black tracking-tight">
								Parametry zakupu
							</CardTitle>
							<CardDescription className="text-sm font-medium">
								Zdefiniuj aktywo, które zamierzasz dodać do portfela w
								najbliższym czasie.
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
				</div>
			</div>
		</div>
	);
}
