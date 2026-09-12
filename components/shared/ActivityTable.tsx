"use client";

import { CATEGORY_ASSETS, CATEGORY_LABELS, COLORS } from "@/lib/constants";
import { ChevronDown, Search } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { AssetHistoryChart } from "@/components/history/AssetHistoryChart";
import { cn } from "@/lib/utils";

export interface ActivityTransaction {
	id: string;
	assetName: string;
	ticker: string | null;
	category: string;
	type: string;
	executedAt: Date | string;
	executedValue: number;
	quantity: number;
	rationale: string | null;
	portfolio: {
		name: string;
	};
}

interface ActivityTableProps {
	transactions: ActivityTransaction[];
	portfolios: { id: string; name: string }[];
}

const ActivityTable = ({ transactions, portfolios }: ActivityTableProps) => {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const sortValue = searchParams.get("sort") || "date_desc";
	const filterCategory = searchParams.get("category") || "ALL";

	const [localSearch, setLocalSearch] = useState(
		searchParams.get("search") || "",
	);

	const filterPortfolio = searchParams.get("portfolio") || "ALL";
	const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

	const updateUrl = useCallback(
		(key: string, value: string) => {
			const params = new URLSearchParams(searchParams.toString());
			if (value && value !== "ALL") {
				params.set(key, value);
			} else {
				params.delete(key);
			}
			params.set("page", "1");
			router.push(`${pathname}?${params.toString()}`, { scroll: false });
			// router.push(`${pathname}?${params.toString()}`);
		},
		[searchParams, pathname, router],
	);

	useEffect(() => {
		const timeoutId = setTimeout(() => {
			const currentUrlSearch = searchParams.get("search") || "";
			if (localSearch !== currentUrlSearch) {
				updateUrl("search", localSearch);
			}
		}, 500);
		return () => clearTimeout(timeoutId);
	}, [localSearch, searchParams, updateUrl]);

	const toggleExpand = (
		txId: string,
		ticker: string | null,
		category: string,
	) => {
		if (!ticker || category === "BONDS" || category === "CASH") return;
		setExpandedTxId((prev) => (prev === txId ? null : txId));
	};

	const sortOptions = [
		{ label: "Najnowsze", value: "date_desc" },
		{ label: "Najstarsze", value: "date_asc" },
		{ label: "Najwyższa wartość", value: "value_desc" },
		{ label: "Najniższa wartość", value: "value_asc" },
	];

	const categoryOptions = CATEGORY_ASSETS.map((key) => ({
		value: key,
		label: CATEGORY_LABELS[key as keyof typeof CATEGORY_LABELS] || key,
	}));

	// Funkcja pomocnicza do ujednolicenia wyświetlania danych transakcji
	const getTxDetails = (t: ActivityTransaction) => {
		const isBuy = t.type === "BUY";
		const isDeposit = t.type === "DEPOSIT";
		const isInterest = t.type === "INTEREST";
		const isCorrection = t.type === "UPDATE";
		const isCashWithdrawal = t.type === "SELL" && t.category === "CASH";

		const isNegative =
			isBuy || (isInterest && t.executedValue < 0) || isCashWithdrawal;

		const colorClass = isNegative
			? isInterest
				? "text-orange-500"
				: "text-rose-500"
			: isInterest
				? "text-purple-500"
				: "text-emerald-500";

		const badgeColor = isCorrection
			? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
			: isBuy
				? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
				: isDeposit
					? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
					: isInterest
						? "bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/20"
						: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";

		const typeLabel = isCorrection
			? "Korekta"
			: isBuy
				? "Kupno"
				: isDeposit
					? "Wpłata"
					: isInterest
						? "Odsetki"
						: "Sprzedaż";
		const categoryColor =
			COLORS[t.category as keyof typeof COLORS] || "#64748b";
		const categoryLabel =
			CATEGORY_LABELS[t.category as keyof typeof CATEGORY_LABELS] || t.category;

		let subLabel = null;
		let subLabelColor = "";
		if (t.type === "SELL" && !isCashWithdrawal) {
			subLabel = "(Zasila gotówkę)";
			subLabelColor = "text-emerald-500/80";
		} else if (isCashWithdrawal) {
			subLabel = "(Wypłata / Transfer)";
			subLabelColor = "text-rose-500/80";
		} else if (isInterest && t.executedValue > 0) {
			subLabel = "(Dywidenda / Gotówka)";
			subLabelColor = "text-purple-500/80";
		} else if (isInterest && t.executedValue < 0) {
			subLabel = "(Podatek)";
			subLabelColor = "text-orange-500/80";
		}

		const canExpand =
			!!t.ticker && t.category !== "BONDS" && t.category !== "CASH";
		const isExpanded = expandedTxId === t.id;
		const sign = isNegative ? "-" : "+";
		const valueFormatted = Math.abs(t.executedValue).toLocaleString("pl-PL", {
			style: "currency",
			currency: "PLN",
		});

		return {
			isCashWithdrawal,
			isNegative,
			colorClass,
			badgeColor,
			typeLabel,
			categoryColor,
			categoryLabel,
			subLabel,
			subLabelColor,
			canExpand,
			isExpanded,
			sign,
			valueFormatted,
		};
	};

	return (
		<div className="flex flex-col gap-6">
			{/* NOWE FILTRY (Styl AssetFilterPanel) */}
			<div className="flex flex-col gap-3">
				<div className="flex flex-1 sm:flex-none sm:w-56 items-center gap-2 bg-black/5 dark:bg-white/5 border border-t-border-subtle rounded-lg px-2 py-1.5 focus-within:border-t-border transition-colors overflow-hidden">
					<span className="hidden sm:block text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0">
						Zakres:
					</span>
					<select
						value={filterPortfolio}
						onChange={(e) => updateUrl("portfolio", e.target.value)}
						className="w-full bg-transparent text-t-text-secondary text-[10px] font-bold uppercase tracking-widest outline-none cursor-pointer truncate"
					>
						<option value="ALL" className="bg-t-bg-panel">
							Wszystkie Portfele
						</option>
						{portfolios.map((p) => (
							<option key={p.id} value={p.id} className="bg-t-bg-panel">
								{p.name}
							</option>
						))}
					</select>
				</div>
				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
					<input
						type="text"
						placeholder="Szukaj aktywa po nazwie lub tickerze..."
						value={localSearch}
						onChange={(e) => setLocalSearch(e.target.value)}
						className="w-full bg-black/5 dark:bg-white/5 border border-t-border-subtle rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-t-text-primary outline-none focus:border-blue-500/50 transition-colors placeholder:text-slate-500"
					/>
				</div>
				<div className="flex flex-row items-center justify-between sm:justify-start gap-2 sm:gap-3">
					<div className="flex flex-1 sm:flex-none sm:w-56 items-center gap-2 bg-black/5 dark:bg-white/5 border border-t-border-subtle rounded-lg px-2 py-1.5 focus-within:border-t-border transition-colors overflow-hidden">
						<span className="hidden sm:block text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0">
							Kategoria:
						</span>
						<select
							value={filterCategory}
							onChange={(e) => updateUrl("category", e.target.value)}
							className="w-full bg-transparent text-t-text-secondary text-[10px] font-bold uppercase tracking-widest outline-none cursor-pointer truncate"
						>
							<option value="ALL" className="bg-t-bg-panel">
								Wszystkie
							</option>
							{categoryOptions.map((c) => (
								<option key={c.value} value={c.value} className="bg-t-bg-panel">
									{c.label}
								</option>
							))}
						</select>
					</div>
					<div className="flex flex-1 sm:flex-none sm:w-56 items-center gap-2 bg-black/5 dark:bg-white/5 border border-t-border-subtle rounded-lg px-2 py-1.5 focus-within:border-t-border transition-colors overflow-hidden">
						<span className="hidden sm:block text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0">
							Sortuj:
						</span>
						<select
							value={sortValue}
							onChange={(e) => updateUrl("sort", e.target.value)}
							className="w-full bg-transparent text-t-text-secondary text-[10px] font-bold uppercase tracking-widest outline-none cursor-pointer truncate"
						>
							{sortOptions.map((o) => (
								<option key={o.value} value={o.value} className="bg-t-bg-panel">
									{o.label}
								</option>
							))}
						</select>
					</div>
				</div>
			</div>

			{transactions.length === 0 ? (
				<div className="h-40 flex flex-col items-center justify-center space-y-2 text-t-text-tertiary border border-t-border rounded-2xl bg-t-bg-panel">
					<Search className="h-8 w-8 mb-2 opacity-50" />
					<span className="font-bold text-t-text-primary">
						Brak wyników wyszukiwania
					</span>
					<span className="text-xs text-center px-4">
						Nie znaleziono transakcji pasujących do podanych kryteriów.
					</span>
				</div>
			) : (
				<>
					{/* WIDOK MOBILNY (Karty, < md) */}
					<div className="md:hidden flex flex-col gap-3">
						{transactions.map((t) => {
							const details = getTxDetails(t);
							return (
								<div
									key={`mobile-${t.id}`}
									onClick={() => toggleExpand(t.id, t.ticker, t.category)}
									className={cn(
										"bg-t-bg-panel border border-t-border-subtle rounded-2xl p-4 flex flex-col gap-3 transition-colors",
										details.canExpand && "cursor-pointer active:bg-t-hover",
										details.isExpanded && "border-blue-500/30 bg-blue-500/5",
									)}
								>
									{/* Nagłówek Karty */}
									<div className="flex justify-between items-start gap-2">
										<div className="flex flex-col">
											<span className="font-bold text-sm text-t-text-primary line-clamp-2 leading-tight">
												{t.assetName}
											</span>
											{t.ticker && (
												<span className="text-[10px] w-fit text-t-text-secondary font-mono bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded border border-t-border mt-1.5 uppercase">
													{t.ticker}
												</span>
											)}
										</div>
										<div className="flex flex-col items-end shrink-0">
											<span className="font-semibold font-mono text-xs text-t-text-primary">
												{new Date(t.executedAt).toLocaleDateString("pl-PL")}
											</span>
											{details.canExpand && (
												<ChevronDown
													className={cn(
														"w-4 h-4 text-t-text-tertiary transition-transform duration-200 mt-1",
														details.isExpanded && "rotate-180",
													)}
												/>
											)}
										</div>
									</div>

									{/* Tagi / Kategorie */}
									<div className="flex flex-wrap items-center gap-2">
										<span
											className={cn(
												"px-2 py-0.5 rounded-md font-bold text-[9px] uppercase tracking-widest border",
												details.badgeColor,
											)}
										>
											{details.typeLabel}
										</span>
										<div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5 border border-t-border-subtle">
											<div
												className="w-1.5 h-1.5 rounded-full"
												style={{ backgroundColor: details.categoryColor }}
											/>
											<span className="text-[9px] uppercase tracking-widest font-bold text-t-text-secondary">
												{details.categoryLabel}
											</span>
										</div>
									</div>

									{/* Notatka */}
									{t.rationale && (
										<div className="text-xs text-t-text-tertiary italic bg-black/5 dark:bg-white/5 p-2 rounded-lg mt-1">
											"{t.rationale}"
										</div>
									)}

									{/* Footer Kwotowy */}
									<div className="flex justify-between items-end pt-3 mt-1 border-t border-t-border-subtle/50">
										<div className="flex flex-col">
											{t.quantity > 0 && t.category !== "CASH" && (
												<span className="text-[10px] font-bold text-t-text-tertiary uppercase tracking-widest">
													{t.quantity} szt.
												</span>
											)}
										</div>
										<div className="flex flex-col items-end">
											<span
												className={cn(
													"text-base font-black tracking-tight",
													details.colorClass,
												)}
											>
												{details.sign}
												{details.valueFormatted}
											</span>
											{details.subLabel && (
												<span
													className={cn(
														"text-[9px] font-bold uppercase tracking-widest mt-0.5",
														details.subLabelColor,
													)}
												>
													{details.subLabel}
												</span>
											)}
										</div>
									</div>

									{/* Rozwinięcie wykresu dla mobile */}
									{details.isExpanded && (
										<div className="pt-4 border-t border-t-border-subtle/50 mt-2">
											<h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">
												Historia Notowań:{" "}
												<span className="text-blue-400">{t.ticker}</span>
											</h4>
											<div className="-mx-2">
												<AssetHistoryChart
													ticker={t.ticker!}
													transactions={
														transactions
															.filter((tx) => tx.ticker === t.ticker)
															.map((tx) => ({
																date: new Date(tx.executedAt)
																	.toISOString()
																	.split("T")[0],
																type: tx.type === "BUY" ? "BUY" : "SELL",
																price:
																	tx.quantity !== 0
																		? Math.abs(tx.executedValue / tx.quantity)
																		: 0,
															})) as any
													}
												/>
											</div>
										</div>
									)}
								</div>
							);
						})}
					</div>

					{/* WIDOK DESKTOP (Tabela, >= md) */}
					<div className="hidden md:block w-full overflow-x-auto no-scrollbar rounded-2xl border border-t-border bg-t-bg-panel shadow-sm relative">
						<Table className="w-full min-w-[800px]">
							<TableHeader>
								<TableRow className="border-b border-t-border-subtle hover:bg-transparent">
									<TableHead className="sticky left-0 z-20 bg-t-bg-sticky text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary border-none py-4 pl-6 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] dark:shadow-[4px_0_12px_-4px_rgba(0,0,0,0.3)]">
										Aktywo
									</TableHead>
									<TableHead className=" text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary border-none py-4 pl-2 md:pl-0">
										Data
									</TableHead>
									<TableHead className=" text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary border-none py-4">
										Portfel
									</TableHead>
									<TableHead className=" text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary border-none py-4">
										Kategoria
									</TableHead>
									<TableHead className=" text-right text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary border-none py-4 md:pr-8">
										Wartość
									</TableHead>
									<TableHead className=" text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary border-none py-4 pr-6">
										Notatka
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{transactions.map((t, index) => {
									const details = getTxDetails(t);
									const isEven = index % 2 === 1;

									const assetTxsForChart = transactions
										.filter((tx) => tx.ticker === t.ticker)
										.map((tx) => ({
											date: new Date(tx.executedAt).toISOString().split("T")[0],
											type: tx.type === "BUY" ? "BUY" : "SELL",
											price:
												tx.quantity !== 0
													? Math.abs(tx.executedValue / tx.quantity)
													: 0,
										}));

									return (
										<React.Fragment key={`desktop-${t.id}`}>
											<TableRow
												onClick={() => toggleExpand(t.id, t.ticker, t.category)}
												className={cn(
													"border-b border-t-border-subtle transition-colors group",
													details.canExpand
														? "cursor-pointer hover:bg-t-hover"
														: "opacity-90",
													isEven && "bg-t-bg-base/50 dark:bg-t-bg-base/30",
													details.isExpanded &&
														"bg-t-bg-base/80 dark:bg-t-bg-base/50",
												)}
											>
												<TableCell className="sticky left-0 z-10 pl-6 py-4 border-none bg-t-bg-sticky group-hover:bg-t-bg-sticky-hover transition-colors shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] dark:shadow-[4px_0_12px_-4px_rgba(0,0,0,0.3)]">
													<div className="flex items-start gap-2">
														<div className="w-4 h-4 shrink-0 mt-0.5 flex items-center justify-center">
															{details.canExpand && (
																<ChevronDown
																	className={cn(
																		"w-4 h-4 text-t-text-tertiary transition-transform duration-200",
																		details.isExpanded && "rotate-180",
																	)}
																/>
															)}
														</div>
														<div className="flex flex-col">
															<div className="font-bold text-sm text-t-text-primary whitespace-nowrap">
																{t.assetName}
															</div>
															{t.ticker && (
																<div className="text-[10px] w-fit text-t-text-secondary font-mono bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded border border-t-border mt-1 uppercase">
																	{t.ticker}
																</div>
															)}
														</div>
													</div>
												</TableCell>
												<TableCell className="pl-2 md:pl-4 py-4 border-none">
													<div className="flex flex-col gap-1.5 items-start">
														<span className="font-semibold font-mono text-sm text-t-text-primary whitespace-nowrap">
															{new Date(t.executedAt).toLocaleDateString(
																"pl-PL",
															)}
														</span>
														<span
															className={cn(
																"w-fit px-2 py-0.5 rounded-md font-bold text-[9px] uppercase tracking-widest border",
																details.badgeColor,
															)}
														>
															{details.typeLabel}
														</span>
													</div>
												</TableCell>
												<TableCell className="py-4 border-none">
													<div className="text-[10px] uppercase tracking-widest text-t-text-secondary font-bold whitespace-nowrap">
														{t.portfolio.name}
													</div>
												</TableCell>
												<TableCell className="py-4 border-none">
													<div className="flex items-center gap-2">
														<div
															className="w-2 h-2 rounded-full border border-t-border-subtle shrink-0"
															style={{
																backgroundColor: details.categoryColor,
															}}
														/>
														<span className="text-[10px] uppercase tracking-widest text-t-text-secondary font-bold whitespace-nowrap">
															{details.categoryLabel}
														</span>
													</div>
												</TableCell>
												<TableCell className="text-right pr-6 py-4 border-none">
													<div className="flex flex-col items-end">
														<span
															className={cn(
																"text-sm font-black tracking-tight",
																details.colorClass,
															)}
														>
															{details.sign}
															{details.valueFormatted}
														</span>
														{details.subLabel && (
															<span
																className={cn(
																	"text-[9px] font-bold uppercase tracking-widest mt-0.5",
																	details.subLabelColor,
																)}
															>
																{details.subLabel}
															</span>
														)}
														{t.quantity > 0 && t.category !== "CASH" && (
															<span className="text-[10px] font-bold text-t-text-tertiary uppercase tracking-widest mt-1">
																{t.quantity} szt.
															</span>
														)}
													</div>
												</TableCell>
												<TableCell className="max-w-40 xl:max-w-64 truncate text-xs text-t-text-tertiary italic pr-6 py-4 border-none">
													{t.rationale ? `"${t.rationale}"` : "—"}
												</TableCell>
											</TableRow>

											{details.isExpanded && (
												<TableRow className="bg-t-bg-base/80 dark:bg-t-bg-base/50 border-b border-t-border-subtle">
													<TableCell colSpan={6} className="p-0 border-none">
														<div className="animate-in fade-in slide-in-from-top-2 duration-300 p-4 md:p-6 bg-gradient-to-b from-black/5 dark:from-black/20 to-transparent shadow-inner">
															<div className="flex items-center justify-between mb-4 pl-4 md:pl-10">
																<h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
																	Historia Notowań:{" "}
																	<span className="text-blue-400">
																		{t.ticker}
																	</span>
																</h4>
															</div>
															<div className="pl-2 pr-4 md:pl-8 md:pr-8">
																<AssetHistoryChart
																	ticker={t.ticker!}
																	transactions={assetTxsForChart as any}
																/>
															</div>
														</div>
													</TableCell>
												</TableRow>
											)}
										</React.Fragment>
									);
								})}
							</TableBody>
						</Table>
					</div>
				</>
			)}
		</div>
	);
};

export default ActivityTable;
