import { Card, CardContent } from "@/components/ui/card";
import { PiggyBank, PlusSquare } from "lucide-react";

import { CustomCardHeader } from "@/components/shared/CustomCardHeader";
import PlannerForm from "./PlannerForm";
import { PlannerHeader } from "@/components/PlanerHeader";
import { PlannerList } from "@/components/planner/PlanenerList";
import PortfolioEmptyState from "@/components/PortfolioEmptyState";
import { SectionHeader } from "@/components/shared/SectionHeader";
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
	});

	// 2. Obsługa pustego stanu: Jeśli brak portfeli, nie ma gdzie planować
	if (portfolios.length === 0) {
		return <PortfolioEmptyState variant="PLANNER" />;
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

	const portfolioId = await getActivePortfolioId(searchParams);

	const totalPlannedValue = investmentPlans.reduce(
		(sum, plan) => sum + plan.value,
		0,
	);
	const plannedCount = investmentPlans.length;

	return (
		<div className="p-4 md:p-8 space-y-10 pb-20">
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
				</div>
			</div>
		</div>
	);
}
