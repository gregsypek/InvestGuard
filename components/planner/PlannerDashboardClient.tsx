"use client";

import {
	Calculator,
	CheckSquare,
	PiggyBank,
	Target,
	TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";

import { COLORS } from "@/lib/constants";
import { GoalProjectionChart } from "./GoalProjectionChart";
import { PlannerClientList } from "./PlannerClientList";
import { SectionLayout } from "../shared/SectionLayout";
import { cn } from "@/lib/utils";

// Dodaliśmy opcjonalny prop monthlyInvested (przekaż go ze strony serwerowej!)
interface PlannerDashboardClientProps {
	portfolios: any[];
	plans: any[];
	cashPortfolioIds: string[];
	monthlyInvested?: number;
	currentMonthTransactions?: any[]; // Nowy prop dla transakcji bieżącego miesiąca
}

export function PlannerDashboardClient({
	portfolios,
	plans,
	cashPortfolioIds,
	monthlyInvested = 0,
	currentMonthTransactions = [], // Domyślnie pusta tablica
}: PlannerDashboardClientProps) {
	const [listPortfolioId, setListPortfolioId] = useState("ALL");
	const [projPortfolioId, setProjPortfolioId] = useState("ALL");

	// 🚀 NOWY STAN: Wybrane transakcje do podsumowania
	const [selectedTxs, setSelectedTxs] = useState<string[]>([]);

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
	const currentMonth = new Date().toISOString().slice(0, 7);
	const currentMonthPlansTotal = listPlans
		.filter((p) => p.plannedDate <= currentMonth)
		.reduce((sum, p) => sum + Number(p.value), 0);

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

	// 🚀 NOWE: Funkcje do obsługi zaznaczania
	const toggleTx = (id: string) => {
		setSelectedTxs((prev) =>
			prev.includes(id) ? prev.filter((txId) => txId !== id) : [...prev, id],
		);
	};

	const selectedSum = useMemo(() => {
		return currentMonthTransactions
			.filter((tx) => selectedTxs.includes(tx.id))
			.reduce((sum, tx) => sum + tx.executedValue, 0);
	}, [selectedTxs, currentMonthTransactions]);

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
			{/* 🚀 NOWE: Opakowane w SectionLayout */}
			<SectionLayout
				title="Zestawienie Miesiąca"
				titleIcon={Target}
				subtitle="Monitor bieżących operacji"
				description="Śledź swój miesięczny postęp wpłat i weryfikuj najnowsze zaksięgowane transakcje."
			>
				<div className="w-full bg-t-bg-panel border border-t-border rounded-2xl p-5 mb-8 shadow-sm">
					{/* Wskaźnik Celu */}
					<div className="flex items-center justify-between mb-3">
						<div className="flex items-center gap-2">
							<h3 className="text-sm font-black tracking-tight text-t-text-primary">
								Cel inwestycyjny
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

					{/* Pasek Postępu */}
					<div className="h-4 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden border border-t-border-subtle relative">
						<div
							className="h-full bg-emerald-500 transition-all duration-1000 ease-out relative"
							style={{ width: `${progressPercentage}%` }}
						>
							<div className="absolute inset-0 bg-white/20 w-full h-full animate-pulse"></div>
						</div>
					</div>
					<p className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary mt-2">
						Zrealizowano {progressPercentage}% założeń ({listPlans.length} wpłat
						w kolejce)
					</p>

					{/* Lista Zaksięgowanych Transakcji */}
					{currentMonthTransactions && currentMonthTransactions.length > 0 && (
						<div className="mt-6 border-t border-t-border-subtle pt-5">
							<h4 className="text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary mb-3 flex items-center gap-2">
								<CheckSquare className="w-4 h-4 text-emerald-500" />
								Zaksięgowane w tym miesiącu
							</h4>
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
								{currentMonthTransactions.map((tx) => (
									<label
										key={tx.id}
										className={cn(
											"flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all cursor-pointer select-none",
											selectedTxs.includes(tx.id)
												? "bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/40 shadow-sm"
												: "bg-black/5 dark:bg-white/5 border-t-border-subtle hover:bg-black/10 dark:hover:bg-white/10",
										)}
									>
										<input
											type="checkbox"
											checked={selectedTxs.includes(tx.id)}
											onChange={() => toggleTx(tx.id)}
											className="w-4 h-4 rounded border-t-border-subtle text-blue-500 focus:ring-blue-500 cursor-pointer accent-blue-500 shrink-0"
										/>

										<div className="flex flex-col overflow-hidden flex-1">
											<span className="text-xs font-bold text-t-text-primary truncate pr-2">
												{tx.assetName}
											</span>
											{/* ZMIANA: Kolorowa kropka zamiast tekstu '•' */}
											<span className="text-[9px] font-mono text-t-text-tertiary flex items-center gap-1.5 mt-0.5">
												<span
													className="w-2 h-2 rounded-full shrink-0"
													style={{
														backgroundColor:
															COLORS[tx.category as keyof typeof COLORS] ||
															"#94a3b8",
													}}
												/>
												{tx.ticker} •{" "}
												{new Date(tx.executedAt).toLocaleDateString("pl-PL")}
											</span>
										</div>
										<div className="text-right flex flex-col shrink-0">
											<span
												className={cn(
													"text-xs font-black",
													selectedTxs.includes(tx.id)
														? "text-blue-600 dark:text-blue-400"
														: "text-emerald-600 dark:text-emerald-400",
												)}
											>
												+{tx.executedValue.toLocaleString("pl-PL")} PLN
											</span>
											{tx.originalPrice > 0 &&
												tx.originalCurrency !== "PLN" && (
													<span className="text-[9px] font-mono text-t-text-tertiary">
														{tx.quantity.toFixed(4)} szt @{" "}
														{tx.originalPrice.toFixed(2)} {tx.originalCurrency}
													</span>
												)}
										</div>
									</label>
								))}
							</div>

							{/* ZMIANA: Suma przeniesiona pod listę transakcji */}
							{selectedTxs.length > 0 && (
								<div className="mt-4 flex justify-end animate-in fade-in slide-in-from-top-2 duration-300">
									<div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-2.5 rounded-xl shadow-sm">
										<Calculator className="w-4 h-4 text-blue-600 dark:text-blue-400" />
										<span className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
											Suma: {selectedSum.toLocaleString("pl-PL")} PLN
										</span>
									</div>
								</div>
							)}
						</div>
					)}
				</div>
			</SectionLayout>

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
