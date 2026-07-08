"use client";

import { CATEGORY_ASSETS, CATEGORY_LABELS, COLORS } from "@/lib/constants";
import { ChevronDown, Search } from "lucide-react"; // ZMIANA: Dodano ChevronDown
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

// ZMIANA: Importujemy wykres (upewnij się, że ścieżka jest poprawna!)
import { AssetHistoryChart } from "@/components/history/AssetHistoryChart";
import { TableToolbar } from "../TableToolbar";
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

	const filterPortfolio = searchParams.get("portfolio") || "ALL";
	const sortValue = searchParams.get("sort") || "date_desc";
	const filterCategory = searchParams.get("category") || "ALL";

	const [localSearch, setLocalSearch] = useState(
		searchParams.get("search") || "",
	);

	// ZMIANA: Stan dla rozwijanego wiersza
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
			router.push(`${pathname}?${params.toString()}`);
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

	// ZMIANA: Funkcja przełączająca rozwinięcie wiersza (ignoruje Gotówkę i Obligacje)
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

	const portfolioOptions = portfolios.map((p) => ({
		value: p.id,
		label: p.name,
	}));

	return (
		<>
			<TableToolbar
				searchQuery={localSearch}
				onSearchChange={setLocalSearch}
				searchPlaceholder="Szukaj aktywa..."
				sortValue={sortValue}
				onSortChange={(val) => updateUrl("sort", val)}
				sortOptions={sortOptions}
				filterValue={filterCategory}
				onFilterChange={(val) => updateUrl("category", val)}
				filterOptions={categoryOptions}
				filterPortfolioValue={filterPortfolio}
				onFilterPortfolioChange={(val) => updateUrl("portfolio", val)}
				filterPortfolioOptions={portfolioOptions}
			/>

			<div className="w-full overflow-x-auto no-scrollbar rounded-2xl border border-t-border bg-t-bg-panel shadow-sm relative">
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
						{transactions.length === 0 ? (
							<TableRow className="hover:bg-transparent">
								<TableCell colSpan={6} className="h-40 text-center border-none">
									<div className="flex flex-col items-center justify-center space-y-2 text-t-text-tertiary">
										<Search className="h-8 w-8 mb-2 opacity-50" />
										<span className="font-bold text-t-text-primary">
											Brak wyników wyszukiwania
										</span>
										<span className="text-xs">
											Nie znaleziono transakcji pasujących do podanych
											kryteriów.
										</span>
									</div>
								</TableCell>
							</TableRow>
						) : (
							transactions.map((t, index) => {
								const isBuy = t.type === "BUY";
								const isDeposit = t.type === "DEPOSIT";
								const isInterest = t.type === "INTEREST";
								const isCorrection = t.type === "UPDATE";
								const isPositive = isBuy || isDeposit || isInterest;
								const categoryColor =
									COLORS[t.category as keyof typeof COLORS] || "#64748b";

								const isEven = index % 2 === 1;

								// ZMIANA: Flagi rozwijania i mapowanie transakcji do wykresu
								const canExpand =
									!!t.ticker && t.category !== "BONDS" && t.category !== "CASH";
								const isExpanded = expandedTxId === t.id;

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
									<React.Fragment key={t.id}>
										<TableRow
											onClick={() => toggleExpand(t.id, t.ticker, t.category)}
											className={cn(
												"border-b border-t-border-subtle transition-colors group",
												canExpand
													? "cursor-pointer hover:bg-t-hover"
													: "opacity-90",
												isEven && "bg-t-bg-base/50 dark:bg-t-bg-base/30",
												isExpanded && "bg-t-bg-base/80 dark:bg-t-bg-base/50", // Dodatkowe tło gdy rozwinięte
											)}
										>
											{/* 1. KOLUMNA: AKTYWO (Dodany Chevron) */}
											<TableCell className="sticky left-0 z-10 pl-6 py-4 border-none bg-t-bg-sticky group-hover:bg-t-bg-sticky-hover transition-colors shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] dark:shadow-[4px_0_12px_-4px_rgba(0,0,0,0.3)]">
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

											{/* 2. KOLUMNA: DATA I TYP TRANSAKCJI */}
											<TableCell className="pl-2 md:pl-4 py-4 border-none">
												<div className="flex flex-col gap-1.5 items-start">
													<span className="font-semibold font-mono text-sm text-t-text-primary whitespace-nowrap">
														{new Date(t.executedAt).toLocaleDateString("pl-PL")}
													</span>
													<span
														className={cn(
															"w-fit px-2 py-0.5 rounded-md font-bold text-[9px] uppercase tracking-widest border",
															isCorrection
																? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
																: isBuy
																	? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
																	: isDeposit
																		? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
																		: isInterest
																			? "bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/20"
																			: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
														)}
													>
														{isCorrection
															? "Korekta"
															: isBuy
																? "Kupno"
																: isDeposit
																	? "Wpłata"
																	: isInterest
																		? "Odsetki"
																		: "Sprzedaż"}
													</span>
												</div>
											</TableCell>

											{/* 3. KOLUMNA: PORTFEL */}
											<TableCell className="py-4 border-none">
												<div className="text-[10px] uppercase tracking-widest text-t-text-secondary font-bold whitespace-nowrap">
													{t.portfolio.name}
												</div>
											</TableCell>

											{/* 4. KOLUMNA: KATEGORIA */}
											<TableCell className="py-4 border-none">
												<div className="flex items-center gap-2">
													<div
														className="w-2 h-2 rounded-full border border-t-border-subtle shrink-0"
														style={{ backgroundColor: categoryColor }}
													/>
													<span className="text-[10px] uppercase tracking-widest text-t-text-secondary font-bold whitespace-nowrap">
														{CATEGORY_LABELS[
															t.category as keyof typeof CATEGORY_LABELS
														] || t.category}
													</span>
												</div>
											</TableCell>

											{/* 5. KOLUMNA: WARTOŚĆ I ILOŚĆ */}
											<TableCell className="text-right pr-6 py-4 border-none">
												<div className="flex flex-col items-end">
													<span
														className={cn(
															"text-sm font-black tracking-tight",
															t.type === "BUY"
																? "text-rose-500"
																: t.type === "INTEREST" && t.executedValue < 0
																	? "text-orange-500"
																	: t.type === "INTEREST" && t.executedValue > 0
																		? "text-purple-500"
																		: "text-emerald-500",
														)}
													>
														{t.type === "BUY" ||
														(t.type === "INTEREST" && t.executedValue < 0)
															? "-"
															: "+"}
														{Math.abs(t.executedValue).toLocaleString("pl-PL", {
															style: "currency",
															currency: "PLN",
														})}
													</span>

													{/* Wyjaśnienia pod kwotą dla różnych typów zasilających/pomniejszających gotówkę */}
													{t.type === "SELL" && (
														<span className="text-[9px] text-emerald-500/80 font-bold uppercase tracking-widest mt-0.5">
															(Zasila gotówkę)
														</span>
													)}

													{t.type === "INTEREST" && t.executedValue > 0 && (
														<span className="text-[9px] text-purple-500/80 font-bold uppercase tracking-widest mt-0.5">
															(Dywidenda / Gotówka)
														</span>
													)}

													{t.type === "INTEREST" && t.executedValue < 0 && (
														<span className="text-[9px] text-orange-500/80 font-bold uppercase tracking-widest mt-0.5">
															(Podatek)
														</span>
													)}

													{/* Ilość (pokazujemy tylko dla akcji, ukrywamy dla dywidend i podatków, które mają 0 szt.) */}
													{t.quantity > 0 && (
														<span className="text-[10px] font-bold text-t-text-tertiary uppercase tracking-widest mt-1">
															{t.quantity} szt.
														</span>
													)}
												</div>
											</TableCell>

											{/* 6. NOTATKA */}
											<TableCell className="max-w-40 xl:max-w-64 truncate text-xs text-t-text-tertiary italic pr-6 py-4 border-none">
												{t.rationale ? `"${t.rationale}"` : "—"}
											</TableCell>
										</TableRow>

										{/* ZMIANA: ROZWIJANY WYKRES */}
										{isExpanded && (
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
		</>
	);
};

export default ActivityTable;
