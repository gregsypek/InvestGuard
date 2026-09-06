"use client";

import type { InvestmentPlan, Portfolio } from "@prisma/client";
import { useMemo, useState } from "react";

import { CATEGORY_LABELS } from "@/lib/constants";
import { PlanCard } from "./PlanCard";

// Rozszerzony typ, aby TypeScript poprawnie mapował relacje
type PlanWithPortfolio = InvestmentPlan & {
	portfolio?: Portfolio | null;
};

interface PlannerClientListProps {
	plans: PlanWithPortfolio[];
	cashPortfolioIds: string[];
	allPortfoliosWithCash: { id: string; name: string }[];
	currentMonthTransactions?: any[];
}

export function PlannerClientList({
	plans,
	cashPortfolioIds,
	allPortfoliosWithCash,
	currentMonthTransactions = [],
}: PlannerClientListProps) {
	// --- STANY FILTRÓW ---
	const [filterCategory, setFilterCategory] = useState("ALL");
	const [sortBy, setSortBy] = useState("DATE_ASC");

	// --- DYNAMICZNE KATEGORIE ---
	const availableCategories = useMemo(() => {
		const cats = Array.from(
			new Set(plans.map((p) => p.targetCategory).filter(Boolean)),
		) as string[];
		return cats.map((cat) => ({
			id: cat,
			label: CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] || cat,
		}));
	}, [plans]);

	// --- LOGIKA SORTOWANIA I FILTROWANIA ---
	const filteredAndSorted = useMemo(() => {
		let result = plans;

		if (filterCategory !== "ALL") {
			result = result.filter((p) => p.targetCategory === filterCategory);
		}

		return result.sort((a, b) => {
			if (sortBy === "DATE_ASC")
				return a.plannedDate.localeCompare(b.plannedDate);
			if (sortBy === "DATE_DESC")
				return b.plannedDate.localeCompare(a.plannedDate);
			if (sortBy === "VALUE_DESC") return Number(b.value) - Number(a.value);
			if (sortBy === "VALUE_ASC") return Number(a.value) - Number(b.value);
			return 0;
		});
	}, [plans, filterCategory, sortBy]);

	// --- LOGIKA BLOKADY (Obecny czas) ---
	const now = new Date();
	const currentYear = now.getFullYear();
	const currentMonth = now.getMonth() + 1;

	return (
		<div className="flex flex-col gap-6">
			{/* PŁASKIE FILTRY (W JEDNEJ LINII) */}
			<div className="flex flex-row justify-end items-center gap-2 sm:gap-3 w-full sm:w-auto">
				{/* Kategoria */}
				{availableCategories.length > 0 && (
					<div className="flex flex-1 sm:flex-none sm:w-56 items-center gap-2 bg-black/5 dark:bg-white/5 border border-t-border-subtle rounded-lg px-2 py-1.5 focus-within:border-t-border transition-colors overflow-hidden">
						<span className="hidden sm:block text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0">
							Kategoria:
						</span>
						<select
							value={filterCategory}
							onChange={(e) => setFilterCategory(e.target.value)}
							className="w-full bg-transparent text-t-text-secondary text-[10px] font-bold uppercase tracking-widest outline-none cursor-pointer truncate"
						>
							<option value="ALL">Wszystkie</option>
							{availableCategories.map((cat) => (
								<option key={cat.id} value={cat.id} className="bg-t-bg-panel">
									{cat.label}
								</option>
							))}
						</select>
					</div>
				)}

				{/* Sortowanie */}
				<div className="flex flex-1 sm:flex-none sm:w-56 items-center gap-2 bg-black/5 dark:bg-white/5 border border-t-border-subtle rounded-lg px-2 py-1.5 focus-within:border-t-border transition-colors overflow-hidden">
					<span className="hidden sm:block text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0">
						Sortuj:
					</span>
					<select
						value={sortBy}
						onChange={(e) => setSortBy(e.target.value)}
						className="w-full bg-transparent text-t-text-secondary text-[10px] font-bold uppercase tracking-widest outline-none cursor-pointer truncate"
					>
						<option value="DATE_ASC" className="bg-t-bg-panel">
							Data (Najbliższe)
						</option>
						<option value="DATE_DESC" className="bg-t-bg-panel">
							Data (Najdalsze)
						</option>
						<option value="VALUE_DESC" className="bg-t-bg-panel">
							Wartość (Malejąco)
						</option>
						<option value="VALUE_ASC" className="bg-t-bg-panel">
							Wartość (Rosnąco)
						</option>
					</select>
				</div>
			</div>

			{/* LISTA KART PLANÓW */}
			<div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4 justify-between flex-wrap">
				{filteredAndSorted.map((plan) => {
					// Weryfikacja blokady w locie
					const [pYear, pMonth] = plan.plannedDate.split("-").map(Number);
					const isLocked =
						pYear > currentYear ||
						(pYear === currentYear && pMonth > currentMonth);

					return (
						<PlanCard
							key={plan.id}
							plan={plan as any}
							isLocked={isLocked}
							hasCashInPortfolio={cashPortfolioIds.includes(plan.portfolioId)}
							allPortfoliosWithCash={allPortfoliosWithCash}
							currentMonthTransactions={currentMonthTransactions}
						/>
					);
				})}
			</div>
		</div>
	);
}
