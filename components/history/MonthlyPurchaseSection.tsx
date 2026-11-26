"use client";

import {
	ArrowUpDown,
	Calendar,
	ChevronLeft,
	ChevronRight,
	History,
	ListOrdered,
	Plus,
} from "lucide-react";
import {
	Asset,
	AssetCategory as Category,
	PortfolioWithAssets,
} from "@/lib/types";
import React, { useMemo, useState } from "react";
import { formatCurrency, getCurrencySymbol } from "@/lib/utils/format-currency";

import AccordionInfo from "@/components/shared/AccordionInfo";
import { CATEGORY_LABELS } from "@/lib/constants";
import RecentActivityCard from "../ui/assets/RecentActivityCard";
import { SafeActionButton } from "../ui/SafeActionButton";
import { SectionLayout } from "@/components/shared/SectionLayout";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { useChartContext } from "@/components/providers/ChartProvider";

export interface MonthlyBuyTransaction {
	id: string;
	portfolioId: string;
	assetName: string | null;
	ticker: string | null;
	category: Category | null;
	quantity: number | null;
	executedValue: number;
	executedAt: Date | string;
}

type SortOption = "VALUE" | "PROFIT" | "PROFIT_PCT" | "DATE" | "ALPHA";

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
	{ id: "VALUE", label: "Wartość" },
	{ id: "PROFIT", label: "Zysk PLN" },
	{ id: "PROFIT_PCT", label: "Zysk %" },
	{ id: "DATE", label: "Data zakupu" },
	{ id: "ALPHA", label: "A-Z" },
];

interface Props {
	buyTransactions: MonthlyBuyTransaction[];
	portfolios: PortfolioWithAssets[];
}

interface AggregatedMonthlyAsset {
	asset: Asset;
	lastActivityDate: Date;
	purchaseCount: number;
	profitAmount: number;
	profitPercent: number;
	isSold: boolean;
}

function getMonthKey(dateInput: Date | string): string {
	const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
	const year = d.getFullYear();
	const month = String(d.getMonth() + 1).padStart(2, "0");
	return `${year}-${month}`;
}

function formatMonthLabel(monthKey: string, short = false): string {
	const [yearStr, monthStr] = monthKey.split("-");
	const date = new Date(Number(yearStr), Number(monthStr) - 1, 1);
	if (isNaN(date.getTime())) return monthKey;
	return format(date, short ? "LLL yyyy" : "LLLL yyyy", { locale: pl });
}

export function MonthlyPurchasesSection({
	buyTransactions,
	portfolios,
}: Props) {
	const { currency, convertPLN, selectedIds } = useChartContext();
	const currencySymbol = getCurrencySymbol(currency);

	// Use the currently selected portfolio ID, or fall back to the primary portfolio when "ALL" is active
	const activePortfolioId = selectedIds.find((id) => id !== "ALL");
	const targetPortfolioId = activePortfolioId || portfolios[0]?.id;

	const currentMonthKey = useMemo(() => getMonthKey(new Date()), []);

	const availableMonths = useMemo(() => {
		const monthSet = new Set<string>([currentMonthKey]);
		buyTransactions.forEach((tx) => {
			if (tx.executedAt) {
				monthSet.add(getMonthKey(tx.executedAt));
			}
		});
		return Array.from(monthSet).sort((a, b) => b.localeCompare(a));
	}, [buyTransactions, currentMonthKey]);

	const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey);
	const [sortBy, setSortBy] = useState<SortOption>("VALUE");
	const [filterCategory, setFilterCategory] = useState<string>("ALL");
	const [visibleCount, setVisibleCount] = useState<number>(6);

	// Lookup active holdings by ticker and normalized name
	const assetValuationLookup = useMemo(() => {
		const byTicker = new Map<
			string,
			{ totalQty: number; totalCurrent: number; totalInvested: number }
		>();
		const byName = new Map<
			string,
			{ totalQty: number; totalCurrent: number; totalInvested: number }
		>();

		portfolios.forEach((p) => {
			p.assets.forEach((asset) => {
				const cleanTicker = asset.ticker
					? asset.ticker.split("_")[0].toUpperCase()
					: null;
				if (cleanTicker) {
					const existing = byTicker.get(cleanTicker) || {
						totalQty: 0,
						totalCurrent: 0,
						totalInvested: 0,
					};
					existing.totalQty += asset.quantity || 0;
					existing.totalCurrent += asset.currentValue || 0;
					existing.totalInvested += asset.investedCapital || 0;
					byTicker.set(cleanTicker, existing);
				}

				const normalizedName = asset.name.trim().toLowerCase();
				const existingName = byName.get(normalizedName) || {
					totalQty: 0,
					totalCurrent: 0,
					totalInvested: 0,
				};
				existingName.totalQty += asset.quantity || 0;
				existingName.totalCurrent += asset.currentValue || 0;
				existingName.totalInvested += asset.investedCapital || 0;
				byName.set(normalizedName, existingName);
			});
		});

		return { byTicker, byName };
	}, [portfolios]);

	const monthlyAggregated = useMemo<AggregatedMonthlyAsset[]>(() => {
		const monthTxs = buyTransactions.filter(
			(tx) => getMonthKey(tx.executedAt) === selectedMonth,
		);

		const grouped = new Map<
			string,
			{
				key: string;
				portfolioId: string;
				name: string;
				ticker: string | null;
				category: Category;
				totalInvested: number;
				totalQuantity: number;
				purchaseCount: number;
				latestDate: Date;
			}
		>();

		monthTxs.forEach((tx) => {
			const cleanTicker = tx.ticker
				? tx.ticker.split("_")[0].toUpperCase()
				: null;
			const displayName = (
				tx.assetName ||
				tx.ticker ||
				"Nieznany walor"
			).trim();
			const groupKey = cleanTicker || displayName.toLowerCase();
			const txDate = new Date(tx.executedAt);
			const investedVal = Math.abs(Number(tx.executedValue || 0));
			const qtyVal = Math.abs(Number(tx.quantity || 0));

			const existing = grouped.get(groupKey);
			if (existing) {
				existing.totalInvested += investedVal;
				existing.totalQuantity += qtyVal;
				existing.purchaseCount += 1;
				if (txDate > existing.latestDate) {
					existing.latestDate = txDate;
				}
			} else {
				grouped.set(groupKey, {
					key: groupKey,
					portfolioId: tx.portfolioId,
					name: displayName,
					ticker: cleanTicker,
					category: (tx.category || "CORE") as Category,
					totalInvested: investedVal,
					totalQuantity: qtyVal,
					purchaseCount: 1,
					latestDate: txDate,
				});
			}
		});

		const results: AggregatedMonthlyAsset[] = [];

		grouped.forEach((item) => {
			const tickerStats = item.ticker
				? assetValuationLookup.byTicker.get(item.ticker)
				: undefined;
			const nameStats = assetValuationLookup.byName.get(
				item.name.toLowerCase(),
			);
			const stats = tickerStats || nameStats;

			// Mark position as completely sold when no active units/valuation remain in portfolio
			const isSold = !stats || stats.totalCurrent <= 0 || stats.totalQty <= 0;

			let estimatedCurrentValue = 0;

			if (!isSold && stats) {
				if (stats.totalQty > 0 && item.totalQuantity > 0) {
					const currentUnitPricePLN = stats.totalCurrent / stats.totalQty;
					estimatedCurrentValue = item.totalQuantity * currentUnitPricePLN;
				} else if (stats.totalInvested > 0) {
					const growthMultiplier = stats.totalCurrent / stats.totalInvested;
					estimatedCurrentValue = item.totalInvested * growthMultiplier;
				} else {
					estimatedCurrentValue = item.totalInvested;
				}
			}

			const profitAmount = isSold
				? 0
				: estimatedCurrentValue - item.totalInvested;
			const profitPercent =
				!isSold && item.totalInvested > 0
					? (profitAmount / item.totalInvested) * 100
					: 0;
			// Match all required properties of Prisma Asset model
			const syntheticAsset: Asset = {
				id: `monthly-${selectedMonth}-${item.key}`,
				portfolioId: item.portfolioId,
				name: item.name,
				ticker: item.ticker,
				category: item.category,
				quantity: item.totalQuantity,
				nominalValue: null,
				investedCapital: item.totalInvested,
				currentValue: estimatedCurrentValue,
				targetPercentage: 0,
				rationale: null,
				timeHorizon: null,
				expectedRoi: null,
				conviction: null,
				riskLevel: null,
				purchaseDate: item.latestDate,
				maturityDate: null,
				interestRate: null,
				rateType: null,
				createdAt: item.latestDate,
				updatedAt: item.latestDate,
				isObserved: false,
				dailyChange: 0,
			};

			results.push({
				asset: syntheticAsset,
				lastActivityDate: item.latestDate,
				purchaseCount: item.purchaseCount,
				profitAmount,
				profitPercent,
				isSold,
			});
		});

		return results;
	}, [buyTransactions, selectedMonth, assetValuationLookup]);

	const activeCategories = useMemo(() => {
		const cats = new Set<string>();
		monthlyAggregated.forEach((item) => {
			if (item.asset.category) cats.add(item.asset.category);
		});
		return Array.from(cats);
	}, [monthlyAggregated]);

	const filteredAndSorted = useMemo(() => {
		const filtered =
			filterCategory === "ALL"
				? monthlyAggregated
				: monthlyAggregated.filter(
						(item) => item.asset.category === filterCategory,
					);

		return [...filtered].sort((a, b) => {
			switch (sortBy) {
				case "PROFIT":
					if (a.isSold !== b.isSold) return a.isSold ? 1 : -1;
					return b.profitAmount - a.profitAmount;
				case "PROFIT_PCT":
					if (a.isSold !== b.isSold) return a.isSold ? 1 : -1;
					return b.profitPercent - a.profitPercent;
				case "DATE":
					return b.lastActivityDate.getTime() - a.lastActivityDate.getTime();
				case "ALPHA":
					return a.asset.name.localeCompare(b.asset.name, "pl");
				case "VALUE":
				default:
					return (
						(b.asset.investedCapital || 0) - (a.asset.investedCapital || 0)
					);
			}
		});
	}, [monthlyAggregated, filterCategory, sortBy]);

	// Compute summary separately for still-held positions vs completely sold ones
	const monthTotals = useMemo(() => {
		let totalInvested = 0;
		let activeInvested = 0;
		let activeCurrent = 0;
		let soldInvested = 0;

		filteredAndSorted.forEach((item) => {
			const inv = item.asset.investedCapital || 0;
			totalInvested += inv;

			if (item.isSold) {
				soldInvested += inv;
			} else {
				activeInvested += inv;
				activeCurrent += item.asset.currentValue || 0;
			}
		});

		const profit = activeCurrent - activeInvested;
		const profitPct = activeInvested > 0 ? (profit / activeInvested) * 100 : 0;

		return {
			totalInvested,
			activeInvested,
			activeCurrent,
			soldInvested,
			profit,
			profitPct,
		};
	}, [filteredAndSorted]);

	const selectedMonthIndex = availableMonths.indexOf(selectedMonth);
	const canGoPrevMonth =
		selectedMonthIndex >= 0 && selectedMonthIndex < availableMonths.length - 1;
	const canGoNextMonth = selectedMonthIndex > 0;

	const handleSelectMonth = (monthKey: string) => {
		setSelectedMonth(monthKey);
		setFilterCategory("ALL");
		setVisibleCount(6);
	};

	const visibleItems = filteredAndSorted.slice(0, visibleCount);
	const hasMore = visibleCount < filteredAndSorted.length;
	const canCollapse = visibleCount > 6 && filteredAndSorted.length > 6;

	return (
		<div id="section-monthly-cards" className="scroll-mt-20">
			<SectionLayout
				title="Zakupy w Miesiącu"
				titleIcon={History}
				subtitle="Podsumowanie miesięcznych inwestycji"
				description="Zbiorcze zestawienie walorów kupionych w wybranym miesiącu. Wielokrotne zakupy tej samej pozycji są sumowane, wraz z wyceną ich bieżącego zysku lub straty."
				subtitleIcon={ListOrdered}
				action={
					targetPortfolioId && (
						<SafeActionButton
							label="Dodaj Aktywo"
							icon={Plus}
							variant="outline"
							href={`/dashboard/${targetPortfolioId}/add-asset?source=activity`}
							className="border-slate-800 bg-slate-800 hover:text-slate-300 text-theme-primary"
						/>
					)
				}
			>
				<div className="flex flex-col gap-4 md:gap-6">
					{/* Month Selector & Monthly PnL Summary Bar */}
					<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-3.5 sm:p-4 rounded-2xl border border-t-border bg-t-bg-panel">
						<div className="flex items-center flex-wrap gap-2">
							<span className="text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary flex items-center gap-1.5 mr-1">
								<Calendar className="w-3.5 h-3.5 text-blue-500" />
								Miesiąc:
							</span>

							<div className="flex items-center gap-1">
								<button
									type="button"
									disabled={!canGoPrevMonth}
									onClick={() =>
										canGoPrevMonth &&
										handleSelectMonth(availableMonths[selectedMonthIndex + 1])
									}
									title="Poprzedni miesiąc"
									className="p-1.5 rounded-lg border border-t-border bg-t-bg-base text-t-text-secondary hover:text-t-text-primary disabled:opacity-35 disabled:pointer-events-none transition-colors cursor-pointer"
								>
									<ChevronLeft className="w-4 h-4" />
								</button>

								<select
									value={selectedMonth}
									onChange={(e) => handleSelectMonth(e.target.value)}
									className="h-8 px-3 rounded-lg border border-t-border bg-t-bg-base text-xs font-bold text-t-text-primary capitalize focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
								>
									{availableMonths.map((monthKey) => (
										<option key={monthKey} value={monthKey}>
											{formatMonthLabel(monthKey)}
											{monthKey === currentMonthKey ? " (obecny)" : ""}
										</option>
									))}
								</select>

								<button
									type="button"
									disabled={!canGoNextMonth}
									onClick={() =>
										canGoNextMonth &&
										handleSelectMonth(availableMonths[selectedMonthIndex - 1])
									}
									title="Następny miesiąc"
									className="p-1.5 rounded-lg border border-t-border bg-t-bg-base text-t-text-secondary hover:text-t-text-primary disabled:opacity-35 disabled:pointer-events-none transition-colors cursor-pointer"
								>
									<ChevronRight className="w-4 h-4" />
								</button>
							</div>

							<div className="hidden sm:flex items-center gap-1.5 ml-2">
								{availableMonths.slice(0, 3).map((mKey) => {
									const isActive = mKey === selectedMonth;
									return (
										<button
											key={mKey}
											type="button"
											onClick={() => handleSelectMonth(mKey)}
											className={cn(
												"px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer",
												isActive
													? "bg-blue-500/15 text-blue-400 border-blue-500/40"
													: "bg-black/5 dark:bg-white/5 text-t-text-tertiary border-t-border-subtle hover:text-t-text-primary",
											)}
										>
											{mKey === currentMonthKey
												? "Ten miesiąc"
												: formatMonthLabel(mKey, true)}
										</button>
									);
								})}
							</div>
						</div>

						{filteredAndSorted.length > 0 && (
							<div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-3 lg:pt-0 border-t lg:border-t-0 border-t-border-subtle">
								<div className="flex flex-col">
									<span className="text-[9px] font-bold uppercase tracking-widest text-t-text-tertiary">
										Zainwestowano
									</span>
									<span className="font-mono text-sm font-bold text-t-text-primary">
										{formatCurrency(convertPLN(monthTotals.totalInvested))}{" "}
										<span className="text-[10px] text-t-text-tertiary">
											{currencySymbol}
										</span>
									</span>
									{monthTotals.soldInvested > 0 && (
										<span className="text-[9px] text-t-text-tertiary">
											w tym sprzedane:{" "}
											{formatCurrency(convertPLN(monthTotals.soldInvested))}{" "}
											{currencySymbol}
										</span>
									)}
								</div>

								<div className="flex flex-col">
									<span className="text-[9px] font-bold uppercase tracking-widest text-t-text-tertiary">
										Wartość otwartych
									</span>
									<span className="font-mono text-sm font-bold text-t-text-primary">
										{formatCurrency(convertPLN(monthTotals.activeCurrent))}{" "}
										<span className="text-[10px] text-t-text-tertiary">
											{currencySymbol}
										</span>
									</span>
								</div>

								<div className="flex flex-col pl-4 border-l border-t-border-subtle">
									<span className="text-[9px] font-bold uppercase tracking-widest text-t-text-tertiary">
										Wynik otwartych
									</span>
									<span
										className={cn(
											"font-mono text-sm font-black",
											monthTotals.profit >= 0
												? "text-emerald-500"
												: "text-rose-500",
										)}
									>
										{monthTotals.profit >= 0 ? "+" : ""}
										{formatCurrency(convertPLN(monthTotals.profit))}{" "}
										{currencySymbol} ({monthTotals.profit >= 0 ? "+" : ""}
										{monthTotals.profitPct.toFixed(2)}%)
									</span>
								</div>
							</div>
						)}
					</div>

					{/* Sort & Category Filter Bar */}
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
						<div className="flex items-center flex-wrap gap-1.5">
							<span className="text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary flex items-center gap-1 mr-1">
								<ArrowUpDown className="w-3 h-3" /> Sortuj:
							</span>
							{SORT_OPTIONS.map((opt) => (
								<button
									key={opt.id}
									type="button"
									onClick={() => setSortBy(opt.id)}
									className={cn(
										"px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer",
										sortBy === opt.id
											? "bg-theme-soft text-theme-primary border-theme-border"
											: "bg-t-bg-panel text-t-text-tertiary border-t-border-subtle hover:text-t-text-primary",
									)}
								>
									{opt.label}
								</button>
							))}
						</div>

						{activeCategories.length > 1 && (
							<div className="flex items-center flex-wrap gap-1.5">
								<button
									type="button"
									onClick={() => setFilterCategory("ALL")}
									className={cn(
										"px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer",
										filterCategory === "ALL"
											? "bg-blue-500/15 text-blue-400 border-blue-500/40"
											: "bg-t-bg-panel text-t-text-tertiary border-t-border-subtle hover:text-t-text-primary",
									)}
								>
									Wszystkie
								</button>
								{activeCategories.map((cat) => (
									<button
										key={cat}
										type="button"
										onClick={() => setFilterCategory(cat)}
										className={cn(
											"px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer",
											filterCategory === cat
												? "bg-blue-500/15 text-blue-400 border-blue-500/40"
												: "bg-t-bg-panel text-t-text-tertiary border-t-border-subtle hover:text-t-text-primary",
										)}
									>
										{CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] ||
											cat}
									</button>
								))}
							</div>
						)}
					</div>

					{/* Cards Grid */}
					<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
						{visibleItems.length === 0 ? (
							<div className="col-span-full flex flex-col items-center justify-center p-8 border border-t-border-subtle rounded-xl bg-t-bg-panel/50 text-center w-full">
								<p className="text-sm font-medium text-t-text-primary">
									Brak zakupów w tym miesiącu
								</p>
								<p className="text-xs text-t-text-tertiary mt-1">
									W okresie{" "}
									<span className="capitalize font-semibold">
										{formatMonthLabel(selectedMonth)}
									</span>{" "}
									nie zarejestrowano żadnych transakcji kupna.
								</p>
							</div>
						) : (
							visibleItems.map((item) => (
								<RecentActivityCard
									key={item.asset.id}
									asset={item.asset}
									isHighlighted={false}
									activityDate={item.lastActivityDate}
									purchaseCount={item.purchaseCount}
									isSold={item.isSold}
								/>
							))
						)}
					</div>

					{/* Expand / Collapse Controls */}
					{(hasMore || canCollapse) && (
						<div className="flex gap-2 w-full mt-1">
							{hasMore && (
								<button
									type="button"
									onClick={() => setVisibleCount((prev) => prev + 6)}
									className="flex-1 h-11 rounded-xl bg-theme-soft border border-blue-500/20 hover:bg-blue-500/20 text-[10px] font-bold uppercase tracking-widest text-theme-primary transition-all flex items-center justify-center cursor-pointer"
								>
									Pokaż więcej ({filteredAndSorted.length - visibleCount})
								</button>
							)}
							{canCollapse && (
								<button
									type="button"
									onClick={() => setVisibleCount(6)}
									className="px-6 h-11 rounded-xl bg-black/5 dark:bg-white/5 border border-t-border-subtle hover:border-t-border hover:bg-t-hover text-[10px] font-bold uppercase tracking-widest text-t-text-secondary transition-all flex items-center justify-center cursor-pointer"
								>
									Zwiń widok
								</button>
							)}
						</div>
					)}

					{/* User-facing methodology & edge-case guide */}
					<AccordionInfo
						des={
							"Moduł grupuje wyłącznie transakcje kupna (<strong>BUY</strong>) z wybranego miesiąca i wycenia zakupione wtedy jednostki po dzisiejszym kursie rynkowym oraz walutowym (PLN). <strong>Warto wiedzieć:</strong> 1) Pozycje oznaczone stemplem <strong>SPRZEDANE</strong> zostały w całości zamknięte w portfelu — na karcie widnieje włożony wtedy kapitał, ale nie są one wliczane do wyniku otwartych pozycji. 2) Przy częściowej sprzedaży części pakietu wycena nadal opiera się na bieżącej cenie jednostkowej waloru (bez kolejkowania FIFO). 3) Dla obligacji skarbowych (EDO, ROD, COI) dokupywanych w wielu miesiącach narosłe odsetki są uśredniane proporcjonalnie do całej pozycji."
						}
					/>
				</div>
			</SectionLayout>
		</div>
	);
}
