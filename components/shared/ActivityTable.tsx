"use client";

import { CATEGORY_ASSETS, CATEGORY_LABELS, COLORS } from "@/lib/constants";
import { ChevronDown, Layers, ListOrdered, Search } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
	portfolioId?: string;
	portfolio?: {
		name: string;
	};
}

interface ActivityTableProps {
	transactions: ActivityTransaction[];
	portfolios: any[]; // Zaciągamy pełne obiekty z page.tsx
	// portfolios: { id: string; name: string }[];
}

const ActivityTable = ({ transactions, portfolios }: ActivityTableProps) => {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const filterPortfolio = searchParams.get("portfolio") || "ALL";
	const sortValue = searchParams.get("sort") || "date_desc";
	const filterCategory = searchParams.get("category") || "ALL";

	const [localSearch, setLocalSearch] = useState(
		searchParams.get("search") || "",
	);
	const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

	// 🚀 NOWOŚĆ: Stan trybu widoku
	const [viewMode, setViewMode] = useState<"FLAT" | "GROUPED">("FLAT");
	const [hideClosed, setHideClosed] = useState(true);

	const updateUrl = useCallback(
		(key: string, value: string) => {
			const params = new URLSearchParams(searchParams.toString());
			if (value && value !== "ALL") params.set(key, value);
			else params.delete(key);

			params.set("page", "1");
			router.push(`${pathname}?${params.toString()}`, { scroll: false });
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
		id: string,
		ticker: string | null,
		category: string,
	) => {
		if (!ticker || category === "BONDS" || category === "CASH") return;
		setExpandedTxId((prev) => (prev === id ? null : id));
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

	// 🚀 NOWOŚĆ: Logika grupowania transakcji po Walorze (Pełna pamięć)
	const groupedAssets = useMemo(() => {
		if (viewMode !== "GROUPED") return [];

		const activePorts =
			filterPortfolio === "ALL"
				? portfolios
				: portfolios.filter((p) => p.id === filterPortfolio);

		const allTxs = activePorts.flatMap((p) =>
			(p.transactionHistories || []).map((t: any) => ({
				...t,
				portfolio: { name: p.name },
			})),
		);

		const groups: Record<string, any> = {};

		allTxs.forEach((tx: any) => {
			// 🚀 ZMIANA 1: Całkowicie i bezwzględnie ignorujemy gotówkę w trybie "Po Walorze"
			if (tx.category === "CASH") return;

			if (localSearch) {
				const searchLower = localSearch.toLowerCase();
				if (
					!tx.assetName.toLowerCase().includes(searchLower) &&
					!(tx.ticker && tx.ticker.toLowerCase().includes(searchLower))
				)
					return;
			}

			if (filterCategory !== "ALL" && tx.category !== filterCategory) return;

			let key = tx.ticker || tx.assetName;
			let groupAssetName = tx.assetName;
			let groupTicker = tx.ticker;

			// 🚀 ZMIANA 2: Zostawiamy tylko inteligentne grupowanie obligacji (usunięto blok CASH)
			if (tx.category === "BONDS") {
				const bondMatch = (tx.assetName + " " + (tx.ticker || "")).match(
					/(EDO|DOS|COI|TOS|ROR|DOR|OTS|ROD|ROS)/i,
				);
				if (bondMatch) {
					const bondType = bondMatch[0].toUpperCase();
					key = `BOND_${bondType}`;
					groupAssetName = `Obligacje Skarbowe ${bondType}`;
					groupTicker = bondType;
				}
			}

			if (!groups[key]) {
				groups[key] = {
					id: key,
					assetName: groupAssetName,
					ticker: groupTicker,
					category: tx.category,
					portfolioName: tx.portfolio.name,
					transactions: [],
					quantity: 0,
					totalInvested: 0,
					totalDividends: 0,
				};
			}

			groups[key].transactions.push(tx);

			// Usprawniona agregacja uwzględniająca depozyty
			if (tx.type === "BUY" || tx.type === "DEPOSIT") {
				groups[key].quantity += tx.quantity || 0;
				groups[key].totalInvested += Math.abs(tx.executedValue);
			} else if (tx.type === "SELL") {
				groups[key].quantity -= tx.quantity || 0;
			} else if (tx.type === "INTEREST") {
				if (tx.executedValue > 0)
					groups[key].totalDividends += tx.executedValue;
			}
		});

		let result = Object.values(groups).map((group: any) => ({
			...group,
			quantity: Number(group.quantity.toFixed(6)),
			totalInvested: Number(group.totalInvested.toFixed(2)),
			totalDividends: Number(group.totalDividends.toFixed(2)),
		}));

		// 🚀 NOWOŚĆ: Ukrywanie zamkniętych pozycji
		if (hideClosed) {
			result = result.filter((g: any) => g.quantity > 0.0001);
		}

		return result.sort((a: any, b: any) => b.totalInvested - a.totalInvested);
	}, [
		viewMode,
		portfolios,
		filterPortfolio,
		localSearch,
		filterCategory,
		hideClosed,
	]);

	// Funkcja pomocnicza do detali transakcji (Dla trybu FLAT)
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

		let typeLabel = "Sprzedaż";
		if (isCorrection) typeLabel = "Korekta";
		if (isBuy) typeLabel = "Kupno";
		if (isDeposit) typeLabel = "Wpłata";
		if (isInterest) typeLabel = "Odsetki";

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
			subLabel = "(Wypłata)";
			subLabelColor = "text-rose-500/80";
		} else if (isInterest && t.executedValue > 0) {
			subLabel = "(Dywidenda)";
			subLabelColor = "text-purple-500/80";
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
			{/* 🚀 Przełącznik Widoków i Ukrywanie Zamkniętych */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
				<div className="flex items-center bg-black/5 dark:bg-white/5 p-1 rounded-xl w-fit border border-t-border-subtle">
					<button
						onClick={() => setViewMode("FLAT")}
						className={cn(
							"flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
							viewMode === "FLAT"
								? "bg-white dark:bg-slate-800 shadow-sm text-blue-500"
								: "text-slate-500 hover:text-slate-300",
						)}
					>
						<ListOrdered className="w-4 h-4" />
						Chronologicznie
					</button>
					<button
						onClick={() => setViewMode("GROUPED")}
						className={cn(
							"flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
							viewMode === "GROUPED"
								? "bg-white dark:bg-slate-800 shadow-sm text-emerald-500"
								: "text-slate-500 hover:text-slate-300",
						)}
					>
						<Layers className="w-4 h-4" />
						Po Walorze
					</button>
				</div>

				{viewMode === "GROUPED" && (
					<label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300 cursor-pointer transition-colors bg-black/5 dark:bg-white/5 border border-t-border-subtle px-3 py-2 rounded-xl">
						<input
							type="checkbox"
							checked={hideClosed}
							onChange={(e) => setHideClosed(e.target.checked)}
							className="rounded border-slate-600 bg-transparent text-blue-500 focus:ring-blue-500 focus:ring-offset-0 w-4 h-4 cursor-pointer"
						/>
						Ukryj zamknięte pozycje
					</label>
				)}
			</div>

			{/* FILTRY TABELI */}
			<div className="flex flex-col xl:flex-row justify-between gap-3 mb-2">
				{/* LEWA STRONA: Wyszukiwarka + Zakres (Portfele) */}
				<div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full xl:w-auto flex-1">
					<div className="relative w-full sm:max-w-xs h-10">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
						<input
							type="text"
							placeholder="Szukaj aktywa..."
							value={localSearch}
							onChange={(e) => setLocalSearch(e.target.value)}
							className="w-full h-full bg-black/5 dark:bg-white/5 border border-t-border-subtle rounded-lg pl-10 pr-4 text-[11px] font-bold text-t-text-primary outline-none focus:border-blue-500/50 transition-colors placeholder:text-slate-500"
						/>
					</div>

					<div className="flex w-full sm:w-56 items-center gap-2 bg-black/5 dark:bg-white/5 border border-t-border-subtle rounded-lg px-3 h-10 focus-within:border-t-border transition-colors overflow-hidden">
						<span className="hidden sm:block text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0">
							Zakres:
						</span>
						<select
							value={filterPortfolio}
							onChange={(e) => updateUrl("portfolio", e.target.value)}
							className="w-full h-full bg-transparent text-t-text-secondary text-[10px] font-bold uppercase tracking-widest outline-none cursor-pointer truncate"
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
				</div>

				{/* PRAWA STRONA: Kategoria + Sortowanie (Aktywne tylko w trybie FLAT) */}
				<div
					className={cn(
						"flex flex-row items-center justify-end gap-2 sm:gap-3 w-full xl:w-auto",
						viewMode === "GROUPED" && "opacity-50 pointer-events-none",
					)}
				>
					<div className="flex flex-1 sm:flex-none sm:w-44 items-center gap-2 bg-black/5 dark:bg-white/5 border border-t-border-subtle rounded-lg px-3 h-10 focus-within:border-t-border transition-colors overflow-hidden">
						<span className="hidden sm:block text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0">
							Kategoria:
						</span>
						<select
							value={filterCategory}
							onChange={(e) => updateUrl("category", e.target.value)}
							className="w-full h-full bg-transparent text-t-text-secondary text-[10px] font-bold uppercase tracking-widest outline-none cursor-pointer truncate"
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

					<div className="flex flex-1 sm:flex-none sm:w-44 items-center gap-2 bg-black/5 dark:bg-white/5 border border-t-border-subtle rounded-lg px-3 h-10 focus-within:border-t-border transition-colors overflow-hidden">
						<span className="hidden sm:block text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0">
							Sortuj:
						</span>
						<select
							value={sortValue}
							onChange={(e) => updateUrl("sort", e.target.value)}
							className="w-full h-full bg-transparent text-t-text-secondary text-[10px] font-bold uppercase tracking-widest outline-none cursor-pointer truncate"
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

			{/* ========================================= */}
			{/* TRYB: CHRONOLOGICZNIE (Oryginalna Tabela) */}
			{/* ========================================= */}
			{viewMode === "FLAT" && (
				<>
					{/* WERSJA DESKTOP */}
					<div className="hidden md:block w-full overflow-x-auto no-scrollbar rounded-2xl border border-t-border bg-t-bg-panel shadow-sm relative">
						<Table className="w-full min-w-[800px]">
							<TableHeader>
								<TableRow className="border-b border-t-border-subtle hover:bg-transparent">
									<TableHead className="sticky left-0 z-20 bg-t-bg-sticky text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary border-none py-4 pl-6 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]">
										Aktywo
									</TableHead>
									<TableHead className=" text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary border-none py-4">
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
								{transactions.length === 0 ? (
									<TableRow className="hover:bg-transparent">
										<TableCell
											colSpan={6}
											className="h-40 text-center border-none"
										>
											<div className="flex flex-col items-center justify-center space-y-2 text-t-text-tertiary">
												<Search className="h-8 w-8 mb-2 opacity-50" />
												<span className="font-bold text-t-text-primary">
													Brak wyników wyszukiwania
												</span>
											</div>
										</TableCell>
									</TableRow>
								) : (
									transactions.map((t, index) => {
										const details = getTxDetails(t);
										const isEven = index % 2 === 1;

										const assetTxsForChart = transactions
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
											}));

										return (
											<React.Fragment key={`flat-${t.id}`}>
												<TableRow
													onClick={() =>
														toggleExpand(t.id, t.ticker, t.category)
													}
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
													<TableCell className="sticky left-0 z-10 pl-6 py-4 border-none bg-t-bg-sticky group-hover:bg-t-bg-sticky-hover shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]">
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
													<TableCell className="py-4 border-none">
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
															{t.portfolio?.name}
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
									})
								)}
							</TableBody>
						</Table>
					</div>
					{/* WERSJA MOBILE (KARTY) */}
					<div className="flex flex-col gap-3 md:hidden">
						{transactions.length === 0 ? (
							<div className="flex flex-col items-center justify-center p-8 bg-t-bg-panel border border-t-border rounded-2xl">
								<Search className="h-6 w-6 mb-2 opacity-50 text-t-text-tertiary" />
								<span className="font-bold text-sm text-t-text-primary">
									Brak wyników
								</span>
							</div>
						) : (
							transactions.map((t) => {
								const details = getTxDetails(t);
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
									<div
										key={`mobile-flat-${t.id}`}
										onClick={() => toggleExpand(t.id, t.ticker, t.category)}
										className={cn(
											"flex flex-col bg-t-bg-panel border border-t-border rounded-2xl p-4 shadow-sm transition-colors",
											details.canExpand && "active:bg-t-hover cursor-pointer",
										)}
									>
										<div className="flex justify-between items-start mb-3">
											<div className="flex flex-col">
												<div className="flex items-center gap-1.5">
													<span className="font-bold text-sm text-t-text-primary">
														{t.assetName}
													</span>
													{details.canExpand && (
														<ChevronDown
															className={cn(
																"w-4 h-4 text-t-text-tertiary transition-transform duration-200",
																details.isExpanded && "rotate-180",
															)}
														/>
													)}
												</div>
												<span className="text-[10px] text-t-text-secondary mt-0.5">
													{new Date(t.executedAt).toLocaleDateString("pl-PL")}
												</span>
											</div>
											<span
												className={cn(
													"px-2 py-0.5 rounded-md font-bold text-[9px] uppercase tracking-widest border",
													details.badgeColor,
												)}
											>
												{details.typeLabel}
											</span>
										</div>

										<div className="flex justify-between items-end">
											<div className="flex flex-col gap-1.5">
												<div className="flex items-center gap-1.5">
													<div
														className="w-2 h-2 rounded-full"
														style={{ backgroundColor: details.categoryColor }}
													/>
													<span className="text-[10px] uppercase font-bold tracking-widest text-t-text-secondary">
														{details.categoryLabel}
													</span>
												</div>
												{t.rationale && (
													<span className="text-[10px] italic text-t-text-tertiary truncate max-w-[150px]">
														"{t.rationale}"
													</span>
												)}
											</div>
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
												{t.quantity > 0 && t.category !== "CASH" && (
													<span className="text-[9px] font-bold text-t-text-tertiary uppercase tracking-widest mt-0.5">
														{t.quantity} szt.
													</span>
												)}
											</div>
										</div>

										{details.isExpanded && (
											<div className="mt-4 pt-4 border-t border-t-border-subtle">
												<h4 className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2">
													Historia:{" "}
													<span className="text-blue-400">{t.ticker}</span>
												</h4>
												<AssetHistoryChart
													ticker={t.ticker!}
													transactions={assetTxsForChart as any}
												/>
											</div>
										)}
									</div>
								);
							})
						)}
					</div>
				</>
			)}

			{/* ========================================= */}
			{/* TRYB: PO WALORZE (Nowy Widok Zgrupowany) */}
			{/* ========================================= */}
			{viewMode === "GROUPED" && (
				<>
					{/* WERSJA DESKTOP */}
					<div className="hidden md:block w-full overflow-x-auto no-scrollbar rounded-2xl border border-t-border bg-t-bg-panel shadow-sm relative">
						<Table className="w-full min-w-[800px]">
							<TableHeader>
								<TableRow className="border-b border-t-border-subtle hover:bg-transparent">
									<TableHead className="sticky left-0 z-20 bg-t-bg-sticky text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary border-none py-4 pl-6 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]">
										Aktywo
									</TableHead>
									<TableHead className=" text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary border-none py-4">
										Kategoria
									</TableHead>
									<TableHead className=" text-right text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary border-none py-4">
										Obecnie Posiadane
									</TableHead>
									<TableHead className=" text-right text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary border-none py-4">
										Zainwestowano (Suma)
									</TableHead>
									<TableHead className=" text-right text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary border-none py-4 pr-6">
										Wypłacone Dywidendy
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{groupedAssets.length === 0 ? (
									<TableRow className="hover:bg-transparent">
										<TableCell
											colSpan={5}
											className="h-40 text-center border-none"
										>
											<div className="flex flex-col items-center justify-center space-y-2 text-t-text-tertiary">
												<Search className="h-8 w-8 mb-2 opacity-50" />
												<span className="font-bold text-t-text-primary">
													Brak walorów pasujących do wyszukiwania
												</span>
											</div>
										</TableCell>
									</TableRow>
								) : (
									groupedAssets.map((group, index) => {
										const isEven = index % 2 === 1;
										const categoryColor =
											COLORS[group.category as keyof typeof COLORS] ||
											"#64748b";
										const categoryLabel =
											CATEGORY_LABELS[
												group.category as keyof typeof CATEGORY_LABELS
											] || group.category;
										const canExpand =
											!!group.ticker && group.category !== "BONDS";
										const isExpanded = expandedTxId === group.id;

										// Kropki transakcji dla wykresu
										const chartTransactions = group.transactions.map(
											(tx: any) => ({
												date: new Date(tx.executedAt)
													.toISOString()
													.split("T")[0],
												type: tx.type === "BUY" ? "BUY" : "SELL",
												price:
													tx.quantity !== 0
														? Math.abs(tx.executedValue / tx.quantity)
														: 0,
											}),
										);

										return (
											<React.Fragment key={`grouped-${group.id}`}>
												<TableRow
													onClick={() =>
														toggleExpand(group.id, group.ticker, group.category)
													}
													className={cn(
														"border-b border-t-border-subtle transition-colors group",
														canExpand
															? "cursor-pointer hover:bg-t-hover"
															: "opacity-90",
														isEven && "bg-t-bg-base/50 dark:bg-t-bg-base/30",
														isExpanded &&
															"bg-t-bg-base/80 dark:bg-t-bg-base/50",
													)}
												>
													<TableCell className="sticky left-0 z-10 pl-6 py-4 border-none bg-t-bg-sticky group-hover:bg-t-bg-sticky-hover shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]">
														<div className="flex items-start gap-2">
															<div className="w-4 h-4 shrink-0 mt-0.5 flex items-center justify-center">
																{canExpand && (
																	<ChevronDown
																		className={cn(
																			"w-4 h-4 text-t-text-tertiary transition-transform duration-200",
																			isExpanded && "rotate-180",
																		)}
																	/>
																)}
															</div>
															<div className="flex flex-col">
																<div className="font-bold text-sm text-t-text-primary whitespace-nowrap">
																	{group.assetName}
																</div>
																{group.ticker && (
																	<div className="text-[10px] w-fit text-t-text-secondary font-mono bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded border border-t-border mt-1 uppercase">
																		{group.ticker}
																	</div>
																)}
															</div>
														</div>
													</TableCell>
													<TableCell className="py-4 border-none">
														<div className="flex items-center gap-2">
															<div
																className="w-2 h-2 rounded-full border border-t-border-subtle shrink-0"
																style={{ backgroundColor: categoryColor }}
															/>
															<span className="text-[10px] uppercase tracking-widest text-t-text-secondary font-bold whitespace-nowrap">
																{categoryLabel}
															</span>
														</div>
													</TableCell>
													<TableCell className="text-right py-4 border-none">
														<span className="text-sm font-black tracking-tight text-t-text-primary">
															{group.quantity}{" "}
															<span className="text-[10px] text-t-text-tertiary ml-1">
																szt.
															</span>
														</span>
													</TableCell>
													<TableCell className="text-right py-4 border-none">
														<span className="text-sm font-black tracking-tight text-blue-500">
															{group.totalInvested.toLocaleString("pl-PL", {
																style: "currency",
																currency: "PLN",
															})}
														</span>
													</TableCell>
													<TableCell className="text-right pr-6 py-4 border-none">
														<span
															className={cn(
																"text-sm font-black tracking-tight",
																group.totalDividends > 0
																	? "text-purple-500"
																	: "text-slate-500/50",
															)}
														>
															{group.totalDividends > 0
																? group.totalDividends.toLocaleString("pl-PL", {
																		style: "currency",
																		currency: "PLN",
																	})
																: "Brak"}
														</span>
													</TableCell>
												</TableRow>

												{isExpanded && (
													<TableRow className="bg-t-bg-base/80 dark:bg-t-bg-base/50 border-b border-t-border-subtle">
														<TableCell colSpan={5} className="p-0 border-none">
															<div className="animate-in fade-in slide-in-from-top-2 duration-300 p-4 md:p-6 bg-gradient-to-b from-black/5 dark:from-black/20 to-transparent shadow-inner">
																<div className="flex items-center justify-between mb-4 pl-4 md:pl-10">
																	<h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
																		Historia Notowań:{" "}
																		<span className="text-blue-400">
																			{group.ticker}
																		</span>
																	</h4>
																</div>
																<div className="pl-2 pr-4 md:pl-8 md:pr-8">
																	<AssetHistoryChart
																		ticker={group.ticker!}
																		transactions={chartTransactions as any}
																	/>
																</div>
															</div>
														</TableCell>
													</TableRow>
												)}
											</React.Fragment>
										);
									})
								)}
							</TableBody>
						</Table>
					</div>
					{/* WERSJA MOBILE (KARTY) */}
					<div className="flex flex-col gap-3 md:hidden">
						{groupedAssets.length === 0 ? (
							<div className="flex flex-col items-center justify-center p-8 bg-t-bg-panel border border-t-border rounded-2xl">
								<Search className="h-6 w-6 mb-2 opacity-50 text-t-text-tertiary" />
								<span className="font-bold text-sm text-t-text-primary">
									Brak wyników
								</span>
							</div>
						) : (
							groupedAssets.map((group) => {
								const categoryColor =
									COLORS[group.category as keyof typeof COLORS] || "#64748b";
								const categoryLabel =
									CATEGORY_LABELS[
										group.category as keyof typeof CATEGORY_LABELS
									] || group.category;
								const canExpand = !!group.ticker && group.category !== "BONDS";
								const isExpanded = expandedTxId === group.id;

								const chartTransactions = group.transactions.map((tx: any) => ({
									date: new Date(tx.executedAt).toISOString().split("T")[0],
									type: tx.type === "BUY" ? "BUY" : "SELL",
									price:
										tx.quantity !== 0
											? Math.abs(tx.executedValue / tx.quantity)
											: 0,
								}));

								return (
									<div
										key={`mobile-grouped-${group.id}`}
										onClick={() =>
											toggleExpand(group.id, group.ticker, group.category)
										}
										className={cn(
											"flex flex-col bg-t-bg-panel border border-t-border rounded-2xl p-4 shadow-sm transition-colors",
											canExpand && "active:bg-t-hover cursor-pointer",
										)}
									>
										<div className="flex justify-between items-start mb-3">
											<div className="flex flex-col">
												<div className="flex items-center gap-1.5">
													<span className="font-bold text-sm text-t-text-primary">
														{group.assetName}
													</span>
													{canExpand && (
														<ChevronDown
															className={cn(
																"w-4 h-4 text-t-text-tertiary transition-transform duration-200",
																isExpanded && "rotate-180",
															)}
														/>
													)}
												</div>
												{group.ticker && (
													<span className="text-[9px] w-fit font-mono bg-black/5 dark:bg-white/5 text-t-text-secondary px-1.5 py-0.5 rounded border border-t-border mt-1">
														{group.ticker}
													</span>
												)}
											</div>
											<div className="flex flex-col items-end">
												<span className="text-sm font-black text-t-text-primary">
													{group.quantity}
												</span>
												<span className="text-[9px] font-bold text-t-text-tertiary uppercase tracking-widest">
													sztuk
												</span>
											</div>
										</div>

										<div className="flex justify-between items-end">
											<div className="flex items-center gap-1.5 mb-1">
												<div
													className="w-2 h-2 rounded-full"
													style={{ backgroundColor: categoryColor }}
												/>
												<span className="text-[10px] uppercase font-bold tracking-widest text-t-text-secondary">
													{categoryLabel}
												</span>
											</div>
											<div className="flex flex-col items-end gap-0.5">
												<span className="text-sm font-black text-blue-500">
													{group.totalInvested.toLocaleString("pl-PL", {
														style: "currency",
														currency: "PLN",
													})}
												</span>
												{group.totalDividends > 0 && (
													<span className="text-[10px] font-bold text-purple-500 uppercase tracking-widest">
														+{" "}
														{group.totalDividends.toLocaleString("pl-PL", {
															style: "currency",
															currency: "PLN",
														})}{" "}
														dywidend
													</span>
												)}
											</div>
										</div>

										{isExpanded && (
											<div className="mt-4 pt-4 border-t border-t-border-subtle">
												<h4 className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2">
													Historia:{" "}
													<span className="text-blue-400">{group.ticker}</span>
												</h4>
												<AssetHistoryChart
													ticker={group.ticker!}
													transactions={chartTransactions as any}
												/>
											</div>
										)}
									</div>
								);
							})
						)}
					</div>
				</>
			)}
		</div>
	);
};

export default ActivityTable;
