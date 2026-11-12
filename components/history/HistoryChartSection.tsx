"use client";

import { ChevronDown, Info, Loader2 } from "lucide-react";
import { PortfolioWithAssets, Transaction } from "@/lib/types";
import { useMemo, useState } from "react";

import { PortfolioChart } from "../dashboard/PortfolioChart";
import { SimulatedSnapshot } from "@/components/ui/useDashboardData";
import { cn } from "@/lib/utils";
import { getCurrencySymbol } from "@/lib/utils/format-currency";
import { prepareChartAnalytics } from "@/lib/chart-helpers";
import { useChartContext } from "@/components/providers/ChartProvider";

interface HistoryChartSectionProps {
	portfolios: PortfolioWithAssets[];
	transactions: Transaction[];
	simulatedSnapshots: SimulatedSnapshot[];
	realSnapshots: SimulatedSnapshot[];
	oldestRealSnapshotDate?: Date;
}

export function HistoryChartSection({
	portfolios,
	transactions,
	simulatedSnapshots,
	realSnapshots,
	oldestRealSnapshotDate,
}: HistoryChartSectionProps) {
	const [showInfo, setShowInfo] = useState(false);

	const {
		chartMode,
		setChartMode,
		dataMode,
		setDataMode,
		isPending,
		activeRange,
		handleRangeChange, // Naprawiony typ!
		selectedIds,
		togglePortfolio,
		currency,
	} = useChartContext();
	const currencySymbol = getCurrencySymbol(currency);

	const portfolioChartData = useMemo(() => {
		// Filtrowanie portfeli i zrzutów po wyborze użytkownika (stan selectedIds z kontekstu)
		const activePortfolios = selectedIds.includes("ALL")
			? portfolios
			: portfolios.filter((p) => selectedIds.includes(p.id));

		const activeRealSnapshots = selectedIds.includes("ALL")
			? realSnapshots
			: realSnapshots.filter((snap) => selectedIds.includes(snap.portfolioId));

		// Generowanie danych dla trybu rzeczywistego
		if (dataMode === "REAL" && activeRealSnapshots.length > 0) {
			const groupedByDate = activeRealSnapshots.reduce(
				(acc: any, snap: any) => {
					const dateStr = new Date(snap.date).toISOString().split("T")[0];
					if (!acc[dateStr])
						acc[dateStr] = { date: dateStr, totalValue: 0, investedValue: 0 };
					acc[dateStr].totalValue += Number(snap.totalValue);
					acc[dateStr].investedValue += Number(snap.investedValue);
					return acc;
				},
				{},
			);

			const sortedAggregated = Object.values(groupedByDate).sort(
				(a: any, b: any) =>
					new Date(a.date).getTime() - new Date(b.date).getTime(),
			);

			return sortedAggregated.map((snap: any) => {
				const totalVal = Number(snap.totalValue.toFixed(2));
				const investedVal = Number(snap.investedValue.toFixed(2));
				const percentageValue =
					investedVal > 0 ? ((totalVal - investedVal) / investedVal) * 100 : 0;
				return {
					date: snap.date,
					value:
						chartMode === "PERCENTAGE"
							? Number(percentageValue.toFixed(2))
							: totalVal,
					invested: investedVal,
				};
			});
		}

		// Generowanie danych dla trybu symulowanego
		const allAssets = activePortfolios.flatMap((p) => p.assets);
		const totalInvoiced = allAssets.reduce(
			(sum, a) => sum + Number(a.investedCapital),
			0,
		);
		const totalValue = allAssets.reduce(
			(sum, a) => sum + Number(a.currentValue),
			0,
		);
		const currentRoiFactor = totalInvoiced > 0 ? totalValue / totalInvoiced : 1;

		const activeTransactions = activePortfolios.flatMap(
			(p) => p.transactionHistories || [],
		) as any;

		const { areaPoints } = prepareChartAnalytics(
			activeTransactions,
			currentRoiFactor,
		);

		return areaPoints.map((point) => {
			let normalizedDate = new Date().toISOString().split("T")[0];
			const [monthStr, yearStr] = point.name.split(".");

			if (monthStr && yearStr) {
				const pointMonth = parseInt(monthStr, 10);
				const pointYear =
					parseInt(yearStr, 10) > 50
						? 1900 + parseInt(yearStr, 10)
						: 2000 + parseInt(yearStr, 10);

				const dzisiaj = new Date();
				const aktualnyMiesiac = dzisiaj.getMonth() + 1;
				const aktualnyRok = dzisiaj.getFullYear();

				// Zabezpieczenie obecnego miesiąca przed "wybieganiem" w przyszłość
				if (pointYear === aktualnyRok && pointMonth === aktualnyMiesiac) {
					normalizedDate = dzisiaj.toISOString().split("T")[0];
				} else {
					const padMonth = pointMonth.toString().padStart(2, "0");
					normalizedDate = `${pointYear}-${padMonth}-28`;
				}
			}

			const investedVal = point.wkład;
			const totalVal = point.wycena;
			const percentageValue =
				investedVal > 0 ? ((totalVal - investedVal) / investedVal) * 100 : 0;

			return {
				date: normalizedDate,
				value:
					chartMode === "PERCENTAGE"
						? Number(percentageValue.toFixed(2))
						: totalVal,
				invested: investedVal,
			};
		});
	}, [realSnapshots, dataMode, chartMode, portfolios, selectedIds]);

	return (
		<div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-300 w-full">
			<div className="relative h-[600px] w-full flex flex-col bg-t-bg-panel border border-t-border rounded-2xl md:p-4 shadow-sm gap-4">
				{isPending && (
					<div className="absolute inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] rounded-2xl flex items-center justify-center">
						<Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
					</div>
				)}
				<PortfolioChart
					key={`${chartMode}-${dataMode}-${activeRange}`}
					data={portfolioChartData}
					transactions={transactions}
					mode={chartMode}
					setMode={setChartMode}
					dataMode={dataMode}
					setDataMode={setDataMode}
					activeRange={activeRange}
					onRangeChange={handleRangeChange} // Użycie poprawnej funkcji
					showBrush={true}
					titleInside="Analiza Wartości Kapitału"
					subtitleInside="Historia wyceny portfela i wkładu własnego"
					portfolios={portfolios}
					onPortfolioToggle={togglePortfolio}
					activeIds={selectedIds}
				/>
			</div>

			{/* ROZWIJANY BANER INFORMACYJNY */}
			<div className="flex flex-col rounded-xl bg-blue-500/10 border border-blue-500/20 shadow-sm mt-2 overflow-hidden transition-all duration-300">
				<button
					onClick={() => setShowInfo(!showInfo)}
					className="flex items-center justify-between w-full p-4 text-left outline-none hover:bg-blue-500/5 transition-colors"
				>
					<div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
						<Info className="w-5 h-5 shrink-0" />
						<span className="text-sm font-bold tracking-tight">
							Jak czytać ten wykres?
						</span>
					</div>
					<ChevronDown
						className={cn(
							"w-4 h-4 text-blue-600/70 dark:text-blue-400/70 transition-transform duration-300",
							showInfo && "rotate-180",
						)}
					/>
				</button>

				<div
					className={cn(
						"grid transition-all duration-300 ease-in-out px-4 text-blue-600 dark:text-blue-400",
						showInfo
							? "grid-rows-[1fr] pb-4 opacity-100"
							: "grid-rows-[0fr] opacity-0",
					)}
				>
					<div className="overflow-hidden">
						<span className="text-xs leading-relaxed opacity-90 font-medium pl-8 block">
							Wykres prezentuje historyczną wartość kapitału dla wybranych
							portfeli. <strong>W trybie wyceny (PLN/EUR/USD)</strong> widoczne
							są dwie główne linie: zsumowana, całkowita wartość aktywów (gruba,
							falista) oraz wkład własny (przerywana), a odstęp między nimi to
							wygenerowany wynik. Zdarzenia inwestycyjne (np. wpłaty i wypłaty)
							nanoszone są punktowo, by pomóc Ci powiązać nagłe skoki portfela z
							Twoją faktyczną aktywnością na koncie.
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
