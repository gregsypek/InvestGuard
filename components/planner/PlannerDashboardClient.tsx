"use client";

import { PiggyBank, Target, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";

import { GoalProjectionChart } from "./GoalProjectionChart";
import { PlannerClientList } from "./PlannerClientList";
import { SectionLayout } from "../shared/SectionLayout";

// Dodaliśmy opcjonalny prop monthlyInvested (przekaż go ze strony serwerowej!)
interface PlannerDashboardClientProps {
	portfolios: any[];
	plans: any[];
	cashPortfolioIds: string[];
	monthlyInvested?: number;
}

export function PlannerDashboardClient({
	portfolios,
	plans,
	cashPortfolioIds,
	monthlyInvested = 0, // Domyślnie 0, dopóki nie podepniesz z serwera
}: PlannerDashboardClientProps) {
	const [listPortfolioId, setListPortfolioId] = useState("ALL");
	const [projPortfolioId, setProjPortfolioId] = useState("ALL");

	const portfolioOptions = [
		{ id: "ALL", label: "Wszystkie portfele" },
		...portfolios.map((p) => ({ id: p.id, label: p.name })),
	];

	const listPlans = useMemo(() => {
		return listPortfolioId === "ALL"
			? plans
			: plans.filter((p) => p.portfolioId === listPortfolioId);
	}, [plans, listPortfolioId]);

	const listTotalValue = listPlans.reduce((sum, p) => sum + Number(p.value), 0);

	// Wyliczamy obecny miesiąc w formacie "YYYY-MM" (np. "2026-08")
	const currentMonth = new Date().toISOString().slice(0, 7);

	// Sumujemy tylko plany z tego miesiąca oraz zaległe z poprzednich
	const currentMonthPlansTotal = listPlans
		.filter((p) => p.plannedDate <= currentMonth)
		.reduce((sum, p) => sum + Number(p.value), 0);

	// Cel na ten miesiąc = to co już wpłacono + to co ZAPLANOWANO na ten miesiąc
	const totalMonthlyGoal = currentMonthPlansTotal + monthlyInvested;
	const progressPercentage =
		totalMonthlyGoal > 0
			? Math.min(Math.round((monthlyInvested / totalMonthlyGoal) * 100), 100)
			: 0;
	const projData = useMemo(() => {
		const activePorts =
			projPortfolioId === "ALL"
				? portfolios
				: portfolios.filter((p) => p.id === projPortfolioId);
		const activePlans =
			projPortfolioId === "ALL"
				? plans
				: plans.filter((p) => p.portfolioId === projPortfolioId);

		const currentValue = activePorts.reduce(
			(sum, p) =>
				sum +
				p.assets.reduce(
					(aSum: number, a: any) => aSum + (a.currentValue || 0),
					0,
				),
			0,
		);
		const targetValue = activePorts.reduce(
			(sum, p) => sum + (Number(p.goal) || 100000),
			0,
		);
		const monthlyDeposit = activePlans.reduce(
			(sum, p) => sum + Number(p.value),
			0,
		);

		return { currentValue, targetValue, monthlyDeposit };
	}, [portfolios, plans, projPortfolioId]);

	const renderInlinePortfolioSelector = (
		value: string,
		onChange: (val: string) => void,
	) => (
		<div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 border border-t-border-subtle rounded-lg px-2 py-1.5 focus-within:border-t-border transition-colors w-full sm:w-auto shrink-0">
			<span className="hidden sm:inline-block text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0">
				Zakres:
			</span>
			<select
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="bg-transparent text-t-text-primary text-[10px] font-bold uppercase tracking-widest outline-none cursor-pointer truncate max-w-[160px]"
			>
				{portfolioOptions.map((opt) => (
					<option key={opt.id} value={opt.id} className="bg-t-bg-panel">
						{opt.label}
					</option>
				))}
			</select>
		</div>
	);

	return (
		<>
			{/* NOWA SEKCJA: PASEK POSTĘPU MIESIĄCA */}
			<div className="w-full bg-t-bg-panel border border-t-border rounded-2xl p-5 mb-8 shadow-sm">
				<div className="flex items-center justify-between mb-3">
					<div className="flex items-center gap-2">
						<div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
							<Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
						</div>
						<h3 className="text-sm font-black tracking-tight text-t-text-primary">
							Cel na ten miesiąc
						</h3>
					</div>
					<div className="text-right">
						<span className="text-sm font-black text-t-text-primary">
							{monthlyInvested.toLocaleString("pl-PL")} PLN
						</span>
						<span className="text-[10px] font-bold text-t-text-tertiary ml-1">
							/ {totalMonthlyGoal.toLocaleString("pl-PL")} PLN
						</span>
					</div>
				</div>

				<div className="h-4 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden border border-t-border-subtle relative">
					<div
						className="h-full bg-emerald-500 transition-all duration-1000 ease-out relative"
						style={{ width: `${progressPercentage}%` }}
					>
						<div className="absolute inset-0 bg-white/20 w-full h-full animate-pulse"></div>
					</div>
				</div>
				<p className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary mt-2">
					Zrealizowano {progressPercentage}% założeń ({listPlans.length} wpłat w
					kolejce)
				</p>
			</div>

			<SectionLayout
				title="Oczekujące Realizacje"
				titleIcon={PiggyBank}
				subtitle="Lista zaplanowanych zakupów"
				description="Na jej podstawie możesz monitorować nadchodzące inwestycje i zarządzać nimi w czasie."
				action={
					<div className="flex flex-col-reverse sm:flex-row items-end sm:items-center gap-3">
						<div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg">
							<span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
								Zostało: {listTotalValue.toLocaleString("pl-PL")} PLN
							</span>
						</div>
						{renderInlinePortfolioSelector(listPortfolioId, setListPortfolioId)}
					</div>
				}
			>
				<PlannerClientList
					plans={listPlans}
					cashPortfolioIds={cashPortfolioIds}
					allPortfoliosWithCash={portfolios}
				/>
			</SectionLayout>

			<SectionLayout
				title="Projekcja Celu"
				titleIcon={TrendingUp}
				subtitle="Symulacja osiągnięcia celu"
				description="Wizualizacja pokazuje, jak Twoje obecne oszczędności i plany mogą przyczynić się do osiągnięcia celu finansowego (zakładany zwrot 7% rocznie)."
				action={renderInlinePortfolioSelector(
					projPortfolioId,
					setProjPortfolioId,
				)}
			>
				<div className="w-full bg-t-bg-panel border border-t-border rounded-2xl p-4 md:p-6 shadow-sm">
					<div className="h-[400px] w-full relative">
						<GoalProjectionChart
							currentValue={projData.currentValue}
							targetValue={projData.targetValue}
							monthlyDeposit={projData.monthlyDeposit}
						/>
					</div>
				</div>
			</SectionLayout>
		</>
	);
}
