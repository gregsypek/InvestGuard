"use client";

import { PiggyBank, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";

import { GoalProjectionChart } from "./GoalProjectionChart";
import { PlannerClientList } from "./PlannerClientList";
import { SectionLayout } from "../shared/SectionLayout";

// Typy dopasowane do danych z bazy
interface PlannerDashboardClientProps {
	portfolios: any[]; // Pełne portfele z aktywami
	plans: any[]; // Przetworzone plany inwestycyjne
	cashPortfolioIds: string[];
}

export function PlannerDashboardClient({
	portfolios,
	plans,
	cashPortfolioIds,
}: PlannerDashboardClientProps) {
	// --- STANY DLA POSZCZEGÓLNYCH SEKCJI ---
	const [listPortfolioId, setListPortfolioId] = useState("ALL");
	const [projPortfolioId, setProjPortfolioId] = useState("ALL");

	// Opcje dla selectów
	const portfolioOptions = [
		{ id: "ALL", label: "Wszystkie portfele" },
		...portfolios.map((p) => ({ id: p.id, label: p.name })),
	];

	// --- LOGIKA: LISTA PLANÓW ---
	const listPlans = useMemo(() => {
		return listPortfolioId === "ALL"
			? plans
			: plans.filter((p) => p.portfolioId === listPortfolioId);
	}, [plans, listPortfolioId]);

	const listTotalValue = listPlans.reduce((sum, p) => sum + Number(p.value), 0);

	// --- LOGIKA: PROJEKCJA CELU ---
	const projData = useMemo(() => {
		const activePorts =
			projPortfolioId === "ALL"
				? portfolios
				: portfolios.filter((p) => p.id === projPortfolioId);

		const activePlans =
			projPortfolioId === "ALL"
				? plans
				: plans.filter((p) => p.portfolioId === projPortfolioId);

		// Aktualna wartość (suma aktywów wybranych portfeli)
		const currentValue = activePorts.reduce(
			(sum, p) =>
				sum +
				p.assets.reduce(
					(aSum: number, a: any) => aSum + (a.currentValue || 0),
					0,
				),
			0,
		);

		// Docelowa wartość (suma celów z wybranych portfeli)
		const targetValue = activePorts.reduce(
			(sum, p) => sum + (Number(p.goal) || 100000),
			0,
		);

		// Miesięczne wpłaty (suma zaplanowanych kwot dla wybranych portfeli)
		const monthlyDeposit = activePlans.reduce(
			(sum, p) => sum + Number(p.value),
			0,
		);

		return { currentValue, targetValue, monthlyDeposit };
	}, [portfolios, plans, projPortfolioId]);

	// --- MIKRO-KOMPONENT: Selektor Portfela ---
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
			{/* SEKCJA 2: Lista Oczekujących */}
			<SectionLayout
				title="Oczekujące Realizacje"
				titleIcon={PiggyBank}
				subtitle="Lista zaplanowanych zakupów"
				description="Na jej podstawie możesz monitorować nadchodzące inwestycje i zarządzać nimi w czasie."
				action={
					<div className="flex flex-col-reverse sm:flex-row items-end sm:items-center gap-3">
						{/* Odznaka z podsumowaniem reagująca na filtry */}
						<div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg">
							<span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
								Suma: {listTotalValue.toLocaleString("pl-PL")} PLN (
								{listPlans.length})
							</span>
						</div>
						{renderInlinePortfolioSelector(listPortfolioId, setListPortfolioId)}
					</div>
				}
			>
				<PlannerClientList
					plans={listPlans}
					cashPortfolioIds={cashPortfolioIds}
					allPortfoliosWithCash={portfolios} // Przekazujemy wszystkie, by selektor źródła CASH działał
				/>
			</SectionLayout>

			{/* SEKCJA 3: Projekcja Celu */}
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
