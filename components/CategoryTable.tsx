"use client";

import { CATEGORY_LABELS, COLORS } from "@/lib/constants";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useMemo, useState } from "react";

import { LayoutGrid } from "lucide-react";
import { Progress } from "@/components/ui/progress";

// 🚀 ZMIANA: Nowy, bogatszy interfejs danych
export interface CategoryStat {
	category: string;
	value: number;
	profitPLN: number;
	profitPct: number;
}

interface CategoryTableProps {
	data: CategoryStat[];
	totalValue: number;
}

export const CategoryTable = ({ data, totalValue }: CategoryTableProps) => {
	// 🚀 ZMIANA: Lokalny stan sortowania wewnątrz tabeli
	const [sortBy, setSortBy] = useState<"VALUE" | "PROFIT" | "PROFIT_PCT">(
		"VALUE",
	);

	// 🚀 ZMIANA: Logika sortowania
	const sortedCategories = useMemo(() => {
		return [...data].sort((a, b) => {
			if (sortBy === "PROFIT") return b.profitPLN - a.profitPLN;
			if (sortBy === "PROFIT_PCT") return b.profitPct - a.profitPct;
			return b.value - a.value;
		});
	}, [data, sortBy]);

	if (sortedCategories.length === 0) {
		return (
			<div className="w-full rounded-2xl border border-t-border bg-t-bg-panel flex flex-col items-center justify-center py-16 text-center space-y-3">
				<div className="p-4 rounded-full bg-black/5 dark:bg-white/5 border border-t-border-subtle mb-2">
					<LayoutGrid className="h-8 w-8 text-t-text-tertiary" />
				</div>
				<div className="space-y-1">
					<p className="text-sm font-bold text-t-text-primary tracking-tight">
						Brak danych alokacji
					</p>
					<p className="text-xs font-medium text-t-text-secondary">
						Dodaj pierwsze aktywa do swoich portfeli, aby zobaczyć podsumowanie.
					</p>
				</div>
			</div>
		);
	}

	// Obliczenia dla wiersza podsumowania
	const totalProfitPLN = data.reduce((sum, stat) => sum + stat.profitPLN, 0);
	const totalInvested = data.reduce(
		(sum, stat) => sum + (stat.value - stat.profitPLN),
		0,
	);
	const totalProfitPct =
		totalInvested > 0 ? (totalProfitPLN / totalInvested) * 100 : 0;

	const isTotalPositive = totalProfitPLN >= 0;
	const totalSign = isTotalPositive ? "+" : "";
	const totalProfitColorClass = isTotalPositive
		? "text-emerald-500"
		: "text-rose-500";

	return (
		<div className="w-full flex flex-col gap-4">
			{/* 🚀 ZMIANA: Filtr sortowania osadzony nad tabelą */}
			<div className="flex justify-end w-full">
				<div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 border border-t-border-subtle rounded-lg px-2 py-1.5 focus-within:border-t-border transition-colors w-full sm:w-auto">
					<span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0">
						Sortuj:
					</span>
					<select
						value={sortBy}
						onChange={(e) => setSortBy(e.target.value as any)}
						className="bg-transparent text-t-text-secondary text-[10px] font-bold uppercase tracking-widest outline-none cursor-pointer"
					>
						<option value="VALUE" className="bg-t-bg-panel">
							Wartość
						</option>
						<option value="PROFIT" className="bg-t-bg-panel">
							Zysk PLN
						</option>
						<option value="PROFIT_PCT" className="bg-t-bg-panel">
							Zysk %
						</option>
					</select>
				</div>
			</div>

			<div className="w-full overflow-x-auto no-scrollbar rounded-2xl border border-t-border bg-t-bg-panel">
				<Table className="w-full min-w-[700px]">
					<TableHeader>
						<TableRow className="border-b border-t-border-subtle hover:bg-transparent">
							<TableHead className="sticky left-0 z-10 w-40 md:w-56 bg-t-bg-sticky text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary border-r border-t-border md:border-none shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] dark:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)] md:shadow-none pl-6 py-4">
								Kategoria
							</TableHead>
							<TableHead className="text-right text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary border-none py-4">
								Wartość (PLN)
							</TableHead>
							{/* 🚀 ZMIANA: Nowy nagłówek kolumny zysku */}
							<TableHead className="text-right text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary border-none py-4">
								Zysk
							</TableHead>
							<TableHead className="text-right text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary border-none py-4 pr-6 w-[30%]">
								Udział
							</TableHead>
						</TableRow>
					</TableHeader>

					<TableBody>
						{sortedCategories.map((stat) => {
							const percentage =
								totalValue > 0 ? (stat.value / totalValue) * 100 : 0;
							const colorValue =
								COLORS[stat.category as keyof typeof COLORS] || "#64748b";

							// Formatowanie zysku
							const isPositive = stat.profitPLN >= 0;
							const sign = isPositive ? "+" : "";
							const profitColorClass = isPositive
								? "text-emerald-500"
								: "text-rose-500";
							// Dla gotówki (CASH) ukrywamy zysk, jeśli jest zerowy i nielogiczny
							const isCash = stat.category === "CASH";

							return (
								<TableRow
									key={stat.category}
									className="border-b border-t-border-subtle hover:bg-t-hover transition-colors group"
								>
									<TableCell className="sticky left-0 z-10 pl-6 py-4 sm:py-5 bg-t-bg-sticky group-hover:bg-t-bg-sticky-hover border-r border-t-border md:border-none shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] dark:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)] md:shadow-none transition-colors">
										<div className="flex items-center gap-3">
											<div
												className="h-2 w-2 rounded-full opacity-80 shrink-0"
												style={{ backgroundColor: colorValue }}
											/>
											<span className="font-bold text-sm tracking-tight text-t-text-primary whitespace-nowrap">
												{CATEGORY_LABELS[
													stat.category as keyof typeof CATEGORY_LABELS
												] || stat.category}
											</span>
										</div>
									</TableCell>

									<TableCell className="text-right font-mono text-sm font-semibold text-t-text-primary border-none py-4 sm:py-5">
										{stat.value.toLocaleString("pl-PL", {
											maximumFractionDigits: 0,
										})}
									</TableCell>

									{/* 🚀 ZMIANA: Komórka wyświetlająca Zysk PLN i % */}
									<TableCell
										className={`text-right font-mono text-xs sm:text-sm font-bold border-none py-4 sm:py-5 ${isCash ? "text-t-text-tertiary" : profitColorClass}`}
									>
										{isCash ? (
											"—"
										) : (
											<div className="flex flex-col items-end">
												<span>
													{sign}
													{stat.profitPLN.toLocaleString("pl-PL", {
														maximumFractionDigits: 0,
													})}
												</span>
												<span className="text-[10px] opacity-80">
													({sign}
													{stat.profitPct.toFixed(2)}%)
												</span>
											</div>
										)}
									</TableCell>

									<TableCell className="pr-6 border-none py-4 sm:py-5">
										<div className="flex items-center justify-end gap-4">
											<Progress
												value={percentage}
												className="h-1.5 w-full max-w-[120px] bg-slate-200 dark:bg-slate-800"
												indicatorColor={colorValue}
											/>
											<span className="text-xs font-bold w-12 text-right tabular-nums text-t-text-secondary font-mono">
												{percentage.toFixed(1)}%
											</span>
										</div>
									</TableCell>
								</TableRow>
							);
						})}

						{/* Wiersz Podsumowania */}
						<TableRow className="bg-t-bg-sticky p-1 hover:bg-black/5 dark:hover:bg-white/5 border-t border-t-border-subtle font-black">
							<TableCell className="sticky left-0 z-10 pl-6 py-4 sm:py-5 bg-t-bg-stickyshadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] dark:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)] md:shadow-none border-r border-t-border md:border-none">
								<span className="font-black text-sm tracking-widest text-t-text-primary uppercase">
									Razem
								</span>
							</TableCell>

							<TableCell className="text-right font-mono text-sm font-black text-t-text-primary border-none py-4 sm:py-5">
								{totalValue.toLocaleString("pl-PL", {
									maximumFractionDigits: 0,
								})}
							</TableCell>

							<TableCell
								className={`text-right font-mono text-xs sm:text-sm font-black border-none py-4 sm:py-5 ${totalProfitColorClass}`}
							>
								<div className="flex flex-col items-end">
									<span>
										{totalSign}
										{totalProfitPLN.toLocaleString("pl-PL", {
											maximumFractionDigits: 0,
										})}
									</span>
									<span className="text-[10px] opacity-80">
										({totalSign}
										{totalProfitPct.toFixed(2)}%)
									</span>
								</div>
							</TableCell>

							<TableCell className="pr-6 border-none py-4 sm:py-5 text-right font-mono text-sm font-black text-t-text-primary">
								100.0%
							</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</div>
		</div>
	);
};
