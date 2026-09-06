"use client";

import type {
	Asset,
	InvestmentPlan,
	Portfolio,
	TransactionHistory,
} from "@prisma/client";
import { CATEGORY_LABELS, COLORS } from "@/lib/constants";
import {
	Calculator,
	CheckSquare,
	ChevronDown,
	ChevronUp,
	Clock,
	PiggyBank,
	Target,
	TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { GoalProjectionChart } from "./GoalProjectionChart";
import { PlannerClientList } from "./PlannerClientList";
import { SectionLayout } from "../shared/SectionLayout";
import { cn } from "@/lib/utils";

type PlanWithPortfolio = InvestmentPlan & {
	portfolio?: Portfolio | null;
};
interface TransactionData {
	id: string;
	portfolioId: string;
	category: string;
	executedValue: number;
	assetName: string;
	ticker: string | null;
	executedAt: Date;
	originalPrice: number | null;
	originalCurrency: string | null;
	quantity: number;
}
type PortfolioWithAssets = Portfolio & {
	assets: Asset[];
	transactionHistories?: TransactionHistory[];
};

interface PlannerDashboardClientProps {
	portfolios: PortfolioWithAssets[];
	plans: PlanWithPortfolio[];
	cashPortfolioIds: string[];
	monthlyInvested?: number;
	currentMonthTransactions?: TransactionData[];
	defaultPortfolioId?: string;
}

export function PlannerDashboardClient({
	portfolios,
	plans,
	cashPortfolioIds,
	monthlyInvested = 0,
	currentMonthTransactions = [],
	defaultPortfolioId = "ALL",
}: PlannerDashboardClientProps) {
	const [listPortfolioId, setListPortfolioId] = useState(defaultPortfolioId);
	const [projPortfolioId, setProjPortfolioId] = useState(defaultPortfolioId);
	const [monthPortfolioId, setMonthPortfolioId] = useState(defaultPortfolioId);

	const [monthCategoryId, setMonthCategoryId] = useState("ALL");

	// Wybrane transakcje do podsumowania
	const [selectedTxs, setSelectedTxs] = useState<string[]>([]);

	// Rozwijanie paneli
	const [isCurrentMonthOpen, setIsCurrentMonthOpen] = useState(true);
	const [isNextMonthOpen, setIsNextMonthOpen] = useState(true);

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

	// const totalMonthlyGoal = currentMonthPlansTotal + monthlyInvested;

	const projPortfolios = useMemo(() => {
		const activePorts =
			projPortfolioId === "ALL"
				? portfolios
				: portfolios.filter((p) => p.id === projPortfolioId);

		return activePorts.map((p) => {
			const pPlans = plans.filter((plan) => plan.portfolioId === p.id);
			const currentValue = p.assets.reduce(
				(aSum: number, a: { currentValue: number }) =>
					aSum + (a.currentValue || 0),
				0,
			);
			const targetValue = Number(p.goal) || 100000;
			const monthlyDeposit = pPlans.reduce(
				(sum, plan) => sum + Number(plan.value),
				0,
			);
			return {
				id: p.id,
				name: p.name,
				currentValue,
				targetValue,
				monthlyDeposit,
			};
		});
	}, [portfolios, plans, projPortfolioId]);
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
		<div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 border border-t-border-subtle rounded-lg px-2 py-1.5 focus-within:border-t-border transition-colors sm:w-auto shrink-0">
			<span className="hidden sm:inline-block text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0">
				Zakres:
			</span>
			<select
				value={value}
				onChange={(e) => {
					onChange(e.target.value);
					setSelectedTxs([]);
				}}
				className="bg-transparent text-t-text-primary text-[10px] font-bold uppercase tracking-widest outline-none cursor-pointer truncate w-full "
			>
				{portfolioOptions.map((opt) => (
					<option key={opt.id} value={opt.id} className="bg-t-bg-panel">
						{opt.label}
					</option>
				))}
			</select>
		</div>
	);

	const renderInlineCategorySelector = (
		value: string,
		onChange: (val: string) => void,
	) => (
		<div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 border border-t-border-subtle rounded-lg px-2 py-1.5 focus-within:border-t-border transition-colors w-full sm:w-auto shrink-0">
			<span className="hidden sm:inline-block text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0">
				Kategoria:
			</span>
			<select
				value={value}
				onChange={(e) => {
					onChange(e.target.value);
					setSelectedTxs([]); // 👈 Resetuje zaznaczenia przy zmianie kategorii
				}}
				className="bg-transparent text-t-text-primary text-[10px] font-bold uppercase tracking-widest outline-none cursor-pointer truncate w-full"
			>
				<option value="ALL" className="bg-t-bg-panel">
					Wszystkie
				</option>
				{Object.entries(CATEGORY_LABELS)
					.filter(([id]) => id !== "CASH")
					.map(([id, label]) => (
						<option key={id} value={id} className="bg-t-bg-panel">
							{label}
						</option>
					))}
			</select>
		</div>
	);

	const displayMonthlyInvested =
		monthPortfolioId === "ALL"
			? monthlyInvested
			: currentMonthTransactions
					.filter((tx) => tx.portfolioId === monthPortfolioId)
					.reduce((sum, tx) => sum + tx.executedValue, 0);

	// 🚀 ZMIANA: Total Monthly Goal musi reagować na filtr portfela
	// 🚀 ZMIANA: Total Monthly Goal reaguje na portfel ORAZ na bieżący miesiąc
	const totalMonthlyGoal = useMemo(() => {
		// Definiujemy format bieżącego miesiąca (np. "2026-09")
		const currentMonthStr = new Date().toISOString().substring(0, 7);

		const activePlans = plans.filter((p) => {
			const matchesPortfolio =
				monthPortfolioId === "ALL" ? true : p.portfolioId === monthPortfolioId;
			const matchesMonth = p.plannedDate === currentMonthStr; // 👈 Ignoruje przyszłe miesiące

			return matchesPortfolio && matchesMonth;
		});

		const plansTotal = activePlans.reduce((sum, p) => sum + Number(p.value), 0);

		return plansTotal + displayMonthlyInvested;
	}, [plans, monthPortfolioId, displayMonthlyInvested]);

	const progressPercentage =
		totalMonthlyGoal > 0
			? Math.min(Math.round((monthlyInvested / totalMonthlyGoal) * 100), 100)
			: 0;

	const categoryBreakdown = useMemo(() => {
		const txsForBreakdown = currentMonthTransactions.filter(
			(tx) => monthPortfolioId === "ALL" || tx.portfolioId === monthPortfolioId,
		);

		if (!txsForBreakdown || txsForBreakdown.length === 0) return [];

		const breakdown: Record<string, number> = {};
		let total = 0;
		txsForBreakdown.forEach((tx) => {
			breakdown[tx.category] = (breakdown[tx.category] || 0) + tx.executedValue;
			total += tx.executedValue;
		});

		return Object.entries(breakdown)
			.map(([category, value]) => ({
				category,
				value,
				percentage: (value / total) * 100,
			}))
			.sort((a, b) => b.value - a.value);
	}, [currentMonthTransactions, monthPortfolioId]);

	const filteredMonthTransactions = useMemo(() => {
		return (currentMonthTransactions || []).filter((tx) => {
			const matchPortfolio =
				monthPortfolioId === "ALL" || tx.portfolioId === monthPortfolioId;
			const matchCategory =
				monthCategoryId === "ALL" || tx.category === monthCategoryId;
			return matchPortfolio && matchCategory;
		});
	}, [currentMonthTransactions, monthPortfolioId, monthCategoryId]);

	// 🚀 ZMIANA: FIX DATY (Zapobiega przewijaniu z 31 sierpnia na 1 października)
	const nextMonthDate = new Date();
	nextMonthDate.setDate(1); // <- Ustawiamy 1 dzień przed zmianą miesiąca!
	nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);

	const nextMonthStr = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, "0")}`;

	const filteredNextMonthPlans = plans.filter((p) => {
		const isNextMonth = p.plannedDate === nextMonthStr;
		const matchPortfolio =
			monthPortfolioId === "ALL" || p.portfolioId === monthPortfolioId;
		const matchCategory =
			monthCategoryId === "ALL" || p.targetCategory === monthCategoryId;
		return isNextMonth && matchPortfolio && matchCategory;
	});

	const nextMonthTotal = filteredNextMonthPlans.reduce(
		(sum, p) => sum + Number(p.value),
		0,
	);

	// 🚀 NOWE: Synchronizacja wszystkich filtrów po zmianie portfela w globalnym Headerze
	useEffect(() => {
		setListPortfolioId(defaultPortfolioId);
		setProjPortfolioId(defaultPortfolioId);
		setMonthPortfolioId(defaultPortfolioId);
	}, [defaultPortfolioId]);

	return (
		<>
			<SectionLayout
				title="Zestawienie Miesiąca"
				titleIcon={Target}
				subtitle="Monitor bieżących operacji"
				description="Śledź swój miesięczny postęp wpłat i weryfikuj najnowsze zaksięgowane transakcje."
				action={
					<div className="flex flex-col-reverse sm:flex-row items-end sm:items-center gap-3">
						{renderInlinePortfolioSelector(
							monthPortfolioId,
							setMonthPortfolioId,
						)}
						{renderInlineCategorySelector(monthCategoryId, setMonthCategoryId)}
					</div>
				}
			>
				<div className="w-full  border border-t-border rounded-2xl p-5 mb-8 shadow-sm">
					<div className="flex items-center justify-between mb-3">
						<div className="flex items-center gap-2">
							<h3 className="text-sm font-black tracking-tight text-t-text-primary">
								Cel inwestycyjny
							</h3>
						</div>
						<div className="text-right">
							<span className="text-sm font-black text-t-text-primary">
								{displayMonthlyInvested.toLocaleString("pl-PL")} PLN
							</span>
							<span
								className="text-[10px] font-bold text-t-text-tertiary ml-1 cursor-help underline decoration-dotted decoration-t-text-tertiary"
								title="Całkowity cel na ten miesiąc: Suma zaksięgowanych inwestycji + oczekujące plany (bez filtrów)."
							>
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
						Zrealizowano {progressPercentage}% założeń ({listPlans.length} wpłat
						w kolejce)
					</p>

					{filteredMonthTransactions &&
						filteredMonthTransactions.length > 0 && (
							<div className="mt-6 border-t border-t-border-subtle pt-5">
								<div className="flex items-center justify-between mb-4">
									<div className="flex items-center gap-2">
										<CheckSquare className="w-4 h-4 text-emerald-500" />
										<h4 className="text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary">
											Zaksięgowane w tym miesiącu
										</h4>
									</div>

									<div className="flex items-center gap-4">
										{/* 🚀 ZMIANA: Dynamiczna suma widoczna nawet po zwinięciu */}
										<span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-500">
											Suma:{" "}
											{filteredMonthTransactions
												.reduce((sum, tx) => sum + tx.executedValue, 0)
												.toLocaleString("pl-PL")}{" "}
											PLN
										</span>
										<button
											onClick={() => setIsCurrentMonthOpen(!isCurrentMonthOpen)}
											className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary hover:text-t-text-primary transition-colors flex items-center gap-1"
										>
											{isCurrentMonthOpen ? "Zwiń" : "Rozwiń"}
											{isCurrentMonthOpen ? (
												<ChevronUp className="w-3 h-3" />
											) : (
												<ChevronDown className="w-3 h-3" />
											)}
										</button>
									</div>
								</div>

								{isCurrentMonthOpen && (
									<div className="animate-in fade-in slide-in-from-top-2 duration-300">
										<div className="mb-6 space-y-3 p-4 bg-black/5 dark:bg-white/5 rounded-xl border border-t-border-subtle">
											<div className="flex justify-between items-center mb-1">
												<span className="text-[9px] font-black uppercase tracking-widest text-t-text-secondary">
													Struktura kapitału
												</span>
												<span className="text-[9px] font-bold text-t-text-tertiary">
													100% ={" "}
													{displayMonthlyInvested.toLocaleString("pl-PL")} PLN
												</span>
											</div>

											<div className="h-3 w-full flex rounded-full overflow-hidden border border-t-border shadow-sm">
												{categoryBreakdown.map((item) => (
													<div
														key={item.category}
														style={{
															width: `${item.percentage}%`,
															backgroundColor:
																COLORS[item.category as keyof typeof COLORS] ||
																"#94a3b8",
														}}
														className="h-full transition-all duration-1000 ease-out hover:opacity-80"
														title={`${CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS] || item.category}: ${item.percentage.toFixed(1)}%`}
													/>
												))}
											</div>

											<div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
												{categoryBreakdown.map((item) => (
													<div
														key={item.category}
														className="flex items-center gap-1.5"
													>
														<span
															className="w-2 h-2 rounded-full shadow-sm"
															style={{
																backgroundColor:
																	COLORS[
																		item.category as keyof typeof COLORS
																	] || "#94a3b8",
															}}
														/>
														<span className="text-[10px] font-bold text-t-text-primary">
															{CATEGORY_LABELS[
																item.category as keyof typeof CATEGORY_LABELS
															] || item.category}
														</span>
														<span className="text-[9px] font-mono text-t-text-tertiary">
															({item.percentage.toFixed(1)}%)
														</span>
													</div>
												))}
											</div>
										</div>

										<div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
											{filteredMonthTransactions.map((tx) => (
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
														<span className="text-[9px] font-mono text-t-text-tertiary flex items-center gap-1.5 mt-0.5">
															<span
																className="w-2 h-2 rounded-full shrink-0"
																style={{
																	backgroundColor:
																		COLORS[
																			tx.category as keyof typeof COLORS
																		] || "#94a3b8",
																}}
															/>
															{tx.ticker} •{" "}
															{new Date(tx.executedAt).toLocaleDateString(
																"pl-PL",
															)}
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
														{tx.originalPrice !== null &&
															tx.originalPrice > 0 &&
															tx.originalCurrency !== "PLN" && (
																<span className="text-[9px] font-mono text-t-text-tertiary">
																	{tx.quantity.toFixed(4)} szt @{" "}
																	{tx.originalPrice.toFixed(2)}{" "}
																	{tx.originalCurrency}
																</span>
															)}
													</div>
												</label>
											))}
										</div>

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
						)}

					{/* 🚀 NOWE: Sekcja przyszłego miesiąca - wyprowadzona całkowicie poza poprzednią */}
					{filteredNextMonthPlans.length > 0 && (
						<div className="mt-6 border-t border-t-border-subtle pt-5">
							<div className="flex items-center justify-between mb-3">
								<h4 className="text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary flex items-center gap-2">
									<Clock className="w-4 h-4 text-amber-500" />
									Na celowniku: Przyszły miesiąc
								</h4>

								<div className="flex items-center gap-4">
									<span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500">
										Suma: {nextMonthTotal.toLocaleString("pl-PL")} PLN
									</span>
									<button
										onClick={() => setIsNextMonthOpen(!isNextMonthOpen)}
										className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary hover:text-t-text-primary transition-colors flex items-center gap-1"
									>
										{isNextMonthOpen ? "Zwiń" : "Rozwiń"}
										{isNextMonthOpen ? (
											<ChevronUp className="w-3 h-3" />
										) : (
											<ChevronDown className="w-3 h-3" />
										)}
									</button>
								</div>
							</div>

							{isNextMonthOpen && (
								<div className="grid grid-cols-1 lg:grid-cols-2 gap-3 opacity-80 animate-in fade-in slide-in-from-top-2 duration-300">
									{filteredNextMonthPlans.map((plan) => (
										<div
											key={plan.id}
											className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-dashed border-t-border bg-black/5 dark:bg-white/5"
										>
											<div
												className="w-1.5 self-stretch rounded-full shrink-0 opacity-50"
												style={{
													backgroundColor:
														COLORS[
															plan.targetCategory as keyof typeof COLORS
														] || "#94a3b8",
												}}
											/>
											<div className="flex flex-col overflow-hidden flex-1">
												<span className="text-xs font-bold text-t-text-secondary truncate pr-2">
													{plan.name || plan.targetCategory}
												</span>
												<span className="text-[9px] font-mono text-t-text-tertiary">
													{plan.ticker || "Brak tickera"} • {plan.plannedDate}
												</span>
											</div>
											<div className="text-right shrink-0">
												<span className="text-xs font-black text-t-text-secondary">
													{plan.value.toLocaleString("pl-PL")} PLN
												</span>
											</div>
										</div>
									))}
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
					<div className="flex flex-row justify-end items-center gap-3">
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
					currentMonthTransactions={currentMonthTransactions}
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
						<GoalProjectionChart portfolios={projPortfolios} />
					</div>
				</div>
			</SectionLayout>
		</>
	);
}
