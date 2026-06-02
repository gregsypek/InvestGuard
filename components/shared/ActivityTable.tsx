"use client";

import { CATEGORY_ASSETS, CATEGORY_LABELS, COLORS } from "@/lib/constants";
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

import { Search } from "lucide-react";
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
	portfolios: { id: string; name: string }[]; // <-- ZMIANA: Tabela przyjmuje portfele
}

const ActivityTable = ({ transactions, portfolios }: ActivityTableProps) => {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	// Odczytujemy nowy filtr z URL
	const filterPortfolio = searchParams.get("portfolio") || "ALL";

	// Odczytujemy filtry i sortowanie z URL
	const sortValue = searchParams.get("sort") || "date_desc";
	const filterCategory = searchParams.get("category") || "ALL";

	// 1. ZMIANA: LOKALNY STAN WYSZUKIWARKI
	// Pobieramy początkową wartość z URL, ale potem input działa na własnym, szybkim stanie
	const [localSearch, setLocalSearch] = useState(
		searchParams.get("search") || "",
	);

	// 1. OPAKOWUJEMY FUNKCJĘ W useCallback
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
	); // Zależności dla updateUrl

	// 2. ZMIANA: DEBOUNCING
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			const currentUrlSearch = searchParams.get("search") || "";
			// Aktualizujemy URL tylko wtedy, gdy wpisany tekst faktycznie różni się od tego w adresie
			if (localSearch !== currentUrlSearch) {
				updateUrl("search", localSearch);
			}
		}, 500);

		return () => clearTimeout(timeoutId);
	}, [localSearch, searchParams, updateUrl]); // Zależności dla useEffect

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

	// Tworzymy opcje dla nowego dropdowna
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
							{/* ZMIANA 1: AKTYWO TERAZ PIERWSZE - STICKY Z CIENIEM */}
							<TableHead className="sticky left-0 z-20 bg-t-bg-sticky text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary border-none py-4 pl-6 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] dark:shadow-[4px_0_12px_-4px_rgba(0,0,0,0.3)]">
								Aktywo
							</TableHead>
							{/* ZMIANA 2: DATA TERAZ DRUGA */}
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

								return (
									<TableRow
										key={t.id}
										className={cn(
											"border-b border-t-border-subtle hover:bg-t-hover transition-colors group",
											isEven && "bg-t-bg-base/50 dark:bg-t-bg-base/30",
										)}
									>
										{/* 1. KOLUMNA: AKTYWO (Sticky przy horyzontalnym scrollu) */}
										<TableCell className="sticky left-0 z-10 pl-6 py-4 border-none bg-t-bg-sticky group-hover:bg-t-bg-sticky-hover transition-colors shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] dark:shadow-[4px_0_12px_-4px_rgba(0,0,0,0.3)]">
											<div className="font-bold text-sm text-t-text-primary whitespace-nowrap">
												{t.assetName}
											</div>
											{t.ticker && (
												<div className="text-[10px] text-t-text-secondary font-mono bg-black/5 dark:bg-white/5 inline-block px-1.5 py-0.5 rounded border border-t-border mt-1 uppercase">
													{t.ticker}
												</div>
											)}
										</TableCell>

										{/* 2. KOLUMNA: DATA I TYP TRANSAKCJI (przesunięta z pierwszej pozycji) */}
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
										<TableCell className="text-right font-mono py-4 md:pr-8 border-none">
											<div
												className={cn(
													"font-bold text-sm whitespace-nowrap",
													isCorrection
														? t.executedValue >= 0
															? "text-blue-600 dark:text-blue-400"
															: "text-rose-600 dark:text-rose-500"
														: isPositive
															? "text-emerald-600 dark:text-emerald-400"
															: "text-rose-600 dark:text-rose-500",
												)}
											>
												{isCorrection
													? t.executedValue > 0
														? "+"
														: ""
													: isPositive
														? "+"
														: "-"}
												{Math.abs(t.executedValue).toLocaleString("pl-PL", {
													minimumFractionDigits: 2,
												})}{" "}
												PLN
											</div>
											<div className="text-[10px] text-t-text-tertiary font-bold tracking-widest uppercase mt-0.5 whitespace-nowrap">
												{isCorrection
													? "0.0000"
													: (isPositive ? "+" : "-") +
														t.quantity.toFixed(4)}{" "}
												szt.
											</div>
										</TableCell>

										{/* 6. NOTATKA */}
										<TableCell className="max-w-40 xl:max-w-64 truncate text-xs text-t-text-tertiary italic pr-6 py-4 border-none">
											{t.rationale ? `"${t.rationale}"` : "—"}
										</TableCell>
									</TableRow>
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
