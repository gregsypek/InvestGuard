"use client";

import {
	AlertTriangle,
	ArrowDownRight,
	ArrowUpRight,
	Calculator,
	CheckCircle2,
	Trash2,
} from "lucide-react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { formatCurrency, getCurrencySymbol } from "@/lib/utils/format-currency";
import { useMemo, useState } from "react";

import { CategoryStatus } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useChartContext } from "@/components/providers/ChartProvider";

interface Props {
	data: CategoryStatus[];
}

export default function StrategyHealthTable({ data }: Props) {
	const { currency, convertPLN } = useChartContext();
	const currencySymbol = getCurrencySymbol(currency);

	// 🚀 STAN LOKALNY SYMULATORA
	// Pobieramy początkowe wagi z bazy (props data)
	const [weights, setWeights] = useState<Record<string, number>>(() => {
		const initial: Record<string, number> = {};
		data.forEach((d) => {
			initial[d.category] = d.weight;
		});
		return initial;
	});

	// Kwota planowanej wpłaty/wypłaty
	const [extraCash, setExtraCash] = useState<number>(0);

	// 🚀 MATEMATYKA NA ŻYWO (Rebalancing)
	const totalCurrentValue = useMemo(
		() => data.reduce((acc, item) => acc + item.actualAmount, 0),
		[data],
	);
	const targetTotalValue = totalCurrentValue + extraCash;
	const totalWeight = Object.values(weights).reduce(
		(acc, val) => acc + (val || 0),
		0,
	);

	// Pokaż tylko te kategorie, które mają wyznaczoną wagę > 0 LUB posiadamy w nich faktyczny kapitał
	const activeData = data.filter(
		(item) => (weights[item.category] || 0) > 0 || item.actualAmount > 0,
	);

	const handleWeightChange = (category: string, value: string) => {
		const numValue = value === "" ? 0 : Number(value);
		setWeights((prev) => ({ ...prev, [category]: numValue }));
	};

	const handleRemoveCategory = (category: string) => {
		setWeights((prev) => ({ ...prev, [category]: 0 }));
	};

	return (
		<div className="w-full flex flex-col overflow-hidden rounded-2xl border border-t-border bg-t-bg-panel shadow-sm">
			{/* 🚀 GÓRNY PANEL: KALKULATOR WPŁATY */}
			<div className="flex flex-col sm:flex-row items-center justify-between p-3 sm:p-4 bg-black/2 dark:bg-white/5 border-b border-t-border-subtle gap-3">
				<div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto text-theme-primary">
					<Calculator className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
					<span className="text-xs sm:text-sm font-bold tracking-tight">
						Symulator Rebalancingu
					</span>
				</div>
				<div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
					<span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-t-text-secondary">
						Planowana wpłata:
					</span>
					<div className="relative">
						<Input
							type="number"
							value={extraCash || ""}
							onChange={(e) => setExtraCash(Number(e.target.value))}
							className="w-28 sm:w-36 h-8 sm:h-9 text-right pr-8 sm:pr-9 font-mono font-bold text-xs sm:text-sm bg-t-bg-base border-t-border-subtle focus-visible:ring-theme-primary"
							placeholder="0"
						/>
						<span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] sm:text-xs text-t-text-tertiary font-bold">
							{currencySymbol}
						</span>
					</div>
				</div>
			</div>

			{/* <div
				className={cn(
					"grid transition-all duration-300 ease-in-out",
					totalWeight !== 100
						? "grid-rows-[1fr] opacity-100"
						: "grid-rows-[0fr] opacity-0",
				)}
			>
				<div className="overflow-hidden">
					<div className="px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex flex-wrap items-center justify-center gap-2 text-amber-600 dark:text-amber-500 text-[10px] sm:text-xs font-bold tracking-wide">
						<AlertTriangle className="w-4 h-4 shrink-0" />
						<span>
							Suma wag wynosi{" "}
							<span className="font-black text-sm">{totalWeight}%</span>.
							Dostosuj cele, aby uzyskać równe 100%.
						</span>
					</div>
				</div>
			</div> */}

			<div className="w-full overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
				<Table className="w-full min-w-[600px] md:min-w-[700px]">
					<TableHeader>
						<TableRow className="hover:bg-transparent border-t-border-subtle bg-black/2 dark:bg-white/5">
							<TableHead className="bg-t-bg-sticky sticky left-0 z-20 w-32 sm:w-40 md:w-48 backdrop-blur-sm px-3 py-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary border-r border-t-border-subtle shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] dark:shadow-[4px_0_12px_-4px_rgba(0,0,0,0.2)]">
								Kategoria
							</TableHead>
							<TableHead className="text-center px-2 py-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-theme-primary">
								Cel (%)
							</TableHead>
							<TableHead className="text-right px-3 py-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary">
								Aktualnie
							</TableHead>
							<TableHead className="text-right px-3 py-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary">
								Odchylenie
							</TableHead>
							{/* ROZDZIELONE KOLUMNY: AKCJA i KWOTA */}
							<TableHead className="text-center px-3 py-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary">
								Akcja
							</TableHead>
							<TableHead className="text-right px-3 py-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary">
								Kwota
							</TableHead>
							<TableHead className="w-10 text-center px-2 py-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary"></TableHead>
						</TableRow>
					</TableHeader>

					<TableBody>
						{activeData.map((item) => {
							const currentWeight = weights[item.category] || 0;

							// Wyliczenia względem NOWEJ sumy kapitału (w tym planowanej wpłaty)
							const targetAmount = (currentWeight / 100) * targetTotalValue;
							const diffPLN = targetAmount - item.actualAmount;

							// Odchylenie wagowe (pokazuje przepaść w obecnym, realnym portfelu względem celu)
							const currentRealPercentage =
								totalCurrentValue > 0
									? (item.actualAmount / totalCurrentValue) * 100
									: 0;
							const diffWeight = currentRealPercentage - currentWeight;
							const isSignificant = Math.abs(diffWeight) > 2;

							return (
								<TableRow
									key={item.category}
									className="border-t-border-subtle hover:bg-t-hover transition-colors group"
								>
									{/* KATEGORIA */}
									<TableCell className="sticky left-0 z-10 p-0 bg-t-bg-sticky group-hover:bg-t-hover border-r border-t-border-subtle shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] dark:shadow-[4px_0_12px_-4px_rgba(0,0,0,0.2)] transition-colors">
										<div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-3">
											<div
												className={cn("w-1.5 h-6 rounded-full", item.color)}
												style={{ backgroundColor: item.color }}
											/>
											<span className="font-bold text-[11px] sm:text-xs tracking-tight text-t-text-primary truncate">
												{item.name}
											</span>
										</div>
									</TableCell>

									{/* CEL (%) INPUT */}
									<TableCell className="text-center px-2 py-2">
										<div className="flex justify-center">
											<Input
												type="number"
												value={
													currentWeight === 0 && item.actualAmount > 0
														? 0
														: currentWeight || ""
												}
												onChange={(e) =>
													handleWeightChange(item.category, e.target.value)
												}
												className="w-16 h-7 sm:h-8 text-center px-1 font-mono text-xs sm:text-sm font-bold bg-t-bg-base border-t-border-subtle focus-visible:ring-theme-primary transition-all"
											/>
										</div>
									</TableCell>

									{/* AKTUALNIE */}
									<TableCell className="text-right px-3 py-2 font-mono text-[11px] sm:text-xs font-bold text-t-text-primary">
										{currentRealPercentage.toFixed(2)}%
									</TableCell>

									{/* ODCHYLENIE */}
									<TableCell
										className={cn(
											"text-right px-3 py-2 font-mono text-[11px] sm:text-xs font-black",
											isSignificant ? "text-rose-500" : "text-emerald-500",
										)}
									>
										{diffWeight > 0 ? "+" : ""}
										{diffWeight.toFixed(1)}{" "}
										<span className="text-[9px] text-t-text-tertiary">pp</span>
									</TableCell>

									{/* AKCJA */}
									<TableCell className="text-center px-3 py-2">
										{Math.abs(diffPLN) < 10 ? (
											<div className="flex items-center justify-center gap-1.5 text-t-text-tertiary">
												<CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
												<span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest hidden md:inline-block">
													Idealnie
												</span>
											</div>
										) : diffPLN > 0 ? (
											<div className="flex items-center justify-center gap-1 text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md w-max mx-auto border border-emerald-500/20">
												<ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
												<span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">
													Kup
												</span>
											</div>
										) : (
											<div className="flex items-center justify-center gap-1 text-rose-500 bg-rose-500/10 px-2 py-1 rounded-md w-max mx-auto border border-rose-500/20">
												<ArrowDownRight className="h-3.5 w-3.5 shrink-0" />
												<span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">
													Sprzedaj
												</span>
											</div>
										)}
									</TableCell>

									{/* KWOTA */}
									<TableCell className="text-right px-3 py-2">
										{Math.abs(diffPLN) < 10 ? (
											<span className="text-t-text-tertiary font-bold">—</span>
										) : (
											<span
												className={cn(
													"text-[11px] sm:text-sm font-black whitespace-nowrap",
													diffPLN > 0 ? "text-emerald-500" : "text-rose-500",
												)}
											>
												{formatCurrency(convertPLN(Math.abs(diffPLN)), 0)}{" "}
												<span className="text-[10px] sm:text-xs opacity-70">
													{currencySymbol}
												</span>
											</span>
										)}
									</TableCell>

									{/* USUŃ KATEGORIĘ (KOSZ) */}
									<TableCell className="text-center px-2 py-2">
										<button
											onClick={() => handleRemoveCategory(item.category)}
											className="p-1.5 text-t-text-tertiary hover:bg-rose-500/10 hover:text-rose-500 rounded-lg transition-colors group/trash"
											title="Usuń cel dla tej kategorii"
										>
											<Trash2 className="w-4 h-4" />
										</button>
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</div>
			{/* 🚀 OSTRZEŻENIE O SUMIE WAG (Przeniesione na dół) */}
			<div
				className={cn(
					"grid transition-all duration-300 ease-in-out",
					totalWeight !== 100
						? "grid-rows-[1fr] opacity-100"
						: "grid-rows-[0fr] opacity-0",
				)}
			>
				<div className="overflow-hidden">
					{/* Zmieniono border-b na border-t dla lepszego wyglądu na dole */}
					<div className="px-4 py-2.5 bg-amber-500/10 border-t border-amber-500/20 flex flex-wrap items-center justify-center gap-2 text-amber-600 dark:text-amber-500 text-[10px] sm:text-xs font-bold tracking-wide">
						<AlertTriangle className="w-4 h-4 shrink-0" />
						<span>
							Suma wag wynosi{" "}
							<span className="font-black text-sm">{totalWeight}%</span>.
							Dostosuj cele, aby uzyskać równe 100%.
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
