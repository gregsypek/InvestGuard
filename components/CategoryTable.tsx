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
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/format-currency";

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
	const [sortBy, setSortBy] = useState<"VALUE" | "PROFIT" | "PROFIT_PCT">(
		"VALUE",
	);

	const sortedCategories = useMemo(() => {
		return [...data].sort((a, b) => {
			if (sortBy === "PROFIT") return b.profitPLN - a.profitPLN;
			if (sortBy === "PROFIT_PCT") return b.profitPct - a.profitPct;
			return b.value - a.value;
		});
	}, [data, sortBy]);

	if (sortedCategories.length === 0) {
		return (
			<div className="w-full rounded-2xl border border-t-border bg-t-bg-panel flex flex-col items-center justify-center py-16 text-center space-y-3 shadow-sm">
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
			{/* Filtr sortowania */}
			<div className="flex justify-end w-full">
				<div className="flex items-center justify-end gap-2 bg-black/5 dark:bg-white/5 border border-t-border-subtle rounded-lg px-2 py-1.5 focus-within:border-t-border transition-colors sm:w-auto">
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

			{/* Kontener z ukrytym scrollbarem */}
			<div className="w-full overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden rounded-2xl border border-t-border bg-t-bg-panel shadow-sm">
				<Table className="w-full min-w-[500px] sm:min-w-[700px]">
					<TableHeader>
						<TableRow className="border-b border-t-border-subtle   bg-black/5 dark:bg-white/5 ">
							{/* 🚀 ZMIANA 2: Węższa kolumna przyklejona na mobile (w-28) */}
							<TableHead className="sticky left-0 z-20 w-28 sm:w-40 md:w-56 bg-t-bg-sticky  backdrop-blur-sm text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary border-r border-t-border-subtle shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] dark:shadow-[4px_0_12px_-4px_rgba(0,0,0,0.2)] pl-3 sm:pl-6 py-3">
								Kategoria
							</TableHead>
							<TableHead className="text-right text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary border-none px-3 sm:px-4 py-3">
								Wartość (PLN)
							</TableHead>
							<TableHead className="text-right text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary border-none px-3 sm:px-4 py-3">
								Zysk
							</TableHead>
							<TableHead className="text-right text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary border-none pr-3 sm:pr-6 py-3 w-[25%] sm:w-[30%]">
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

							const isPositive = stat.profitPLN >= 0;
							const sign = isPositive ? "+" : "";
							const profitColorClass = isPositive
								? "text-emerald-500"
								: "text-rose-500";
							const isCash = stat.category === "CASH";

							return (
								<TableRow
									key={stat.category}
									className="border-b border-t-border-subtle hover:bg-t-hover transition-colors group "
								>
									<TableCell className="sticky left-0 z-10 pl-3 sm:pl-6 py-3 sm:py-4 bg-t-bg-sticky group-hover:bg-t-hover border-r border-t-border-subtle shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] dark:shadow-[4px_0_12px_-4px_rgba(0,0,0,0.2)] transition-colors">
										<div className="flex items-center gap-2 sm:gap-3">
											{/* <div
												className="h-2 w-2 rounded-full opacity-80 shrink-0"
												style={{ backgroundColor: colorValue }}
											/> */}
											<div
												className={cn("w-1.5 h-6 rounded-full", colorValue)}
												style={{ backgroundColor: colorValue }}
											/>
											<span className="font-bold text-[11px] sm:text-sm tracking-tight text-t-text-primary truncate">
												{CATEGORY_LABELS[
													stat.category as keyof typeof CATEGORY_LABELS
												] || stat.category}
											</span>
										</div>
									</TableCell>

									<TableCell className="text-right font-mono text-[11px] sm:text-sm font-semibold text-t-text-primary border-none px-3 sm:px-4 py-3 sm:py-4">
										{formatCurrency(stat.value, 0)}
									</TableCell>

									<TableCell
										className={`text-right font-mono text-[11px] sm:text-sm font-bold border-none  px-3 sm:px-4 py-3 sm:py-4 ${isCash ? "text-t-text-tertiary" : profitColorClass}`}
									>
										{isCash ? (
											"—"
										) : (
											<div className="flex flex-col items-end">
												<span>
													{sign}
													{formatCurrency(stat.profitPLN, 0)}
												</span>
												<span className="text-[9px] sm:text-[10px] opacity-80">
													({sign}
													{stat.profitPct.toFixed(2)}%)
												</span>
											</div>
										)}
									</TableCell>

									<TableCell className="pr-3 sm:pr-6 border-none py-3 sm:py-4">
										<div className="flex items-center justify-end gap-2 sm:gap-4">
											<Progress
												value={percentage}
												className="h-1.5 w-full max-w-[80px] sm:max-w-[120px] bg-slate-200 dark:bg-slate-800 hidden sm:block"
												indicatorColor={colorValue}
											/>
											<span className="text-[11px] sm:text-xs font-bold w-10 sm:w-12 text-right tabular-nums text-t-text-secondary font-mono shrink-0">
												{percentage.toFixed(1)}%
											</span>
										</div>
									</TableCell>
								</TableRow>
							);
						})}

						{/* Wiersz Podsumowania */}
						<TableRow className="bg-t-bg-panel/50 hover:bg-black/5 dark:hover:bg-white/5 border-t border-t-border-subtle font-black group">
							<TableCell className="sticky left-0 z-10 pl-3 sm:pl-6 py-3 sm:py-4 bg-t-bg-sticky group-hover:bg-t-hover shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] dark:shadow-[4px_0_12px_-4px_rgba(0,0,0,0.2)] border-r border-t-border-subtle transition-colors">
								<span className="font-black text-[11px] sm:text-sm tracking-widest text-t-text-primary uppercase">
									Razem
								</span>
							</TableCell>

							<TableCell className="text-right font-mono text-[11px] sm:text-sm font-black text-t-text-primary border-none px-3 sm:px-4 py-3 sm:py-4">
								{formatCurrency(totalValue, 0)}
							</TableCell>

							<TableCell
								className={`text-right font-mono text-[11px] sm:text-sm font-black border-none px-3 sm:px-4 py-3 sm:py-4 ${totalProfitColorClass}`}
							>
								<div className="flex flex-col items-end">
									<span>
										{totalSign}
										{formatCurrency(totalProfitPLN, 0)}
									</span>
									<span className="text-[9px] sm:text-[10px] opacity-80">
										({totalSign}
										{totalProfitPct.toFixed(2)}%)
									</span>
								</div>
							</TableCell>

							<TableCell className="pr-3 sm:pr-6 border-none py-3 sm:py-4 text-right font-mono text-[11px] sm:text-sm font-black text-t-text-primary">
								100.0%
							</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</div>
		</div>
	);
};
