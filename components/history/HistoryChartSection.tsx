"use client";

import { Info, Loader2 } from "lucide-react";
import { PortfolioWithAssets, Transaction } from "@/lib/types";

import { InlineChartFilters } from "@/components/ui/InlineChartFilters";
import { PortfolioChart } from "../dashboard/PortfolioChart";
import { SimulatedSnapshot } from "@/components/ui/useDashboardData";
import { getCurrencySymbol } from "@/lib/utils/format-currency";
import { prepareChartAnalytics } from "@/lib/chart-helpers";
import { useChartContext } from "@/components/providers/ChartProvider";
import { useMemo } from "react";

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
	const fullTransactionHistory = useMemo(() => {
		return portfolios.flatMap(
			(p) => p.transactionHistories || [],
		) as unknown as Transaction[];
	}, [portfolios]);

	// 1. Zaciągamy selectedIds z kontekstu
	const {
		chartMode,
		setChartMode,
		dataMode,
		setDataMode,
		isPending,
		activeRange,
		setActiveRange,
		selectedIds,
		togglePortfolio,
		currency,
	} = useChartContext();
	const currencySymbol = getCurrencySymbol(currency);

	const portfolioChartData = useMemo(() => {
		// =========================================================
		// FILTROWANIE PO PIGUŁKACH Z KONTEKSTU (BŁYSKAWICZNE W PAMIĘCI)
		// =========================================================
		const activePortfolios = selectedIds.includes("ALL")
			? portfolios
			: portfolios.filter((p) => selectedIds.includes(p.id));

		const activeRealSnapshots = selectedIds.includes("ALL")
			? realSnapshots
			: realSnapshots.filter((snap) => selectedIds.includes(snap.portfolioId));

		// TRYB REALNY
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

		// TRYB SYMULOWANY
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
				const aktualnyMiesiac = dzisiaj.getMonth() + 1; // getMonth to 0-11
				const aktualnyRok = dzisiaj.getFullYear();

				// 🚀 FIX: Jeśli to obecny miesiąc w obecnym roku, ustaw "dzisiaj". W przeciwnym razie ustaw 28. dzień.
				if (pointYear === aktualnyRok && pointMonth === aktualnyMiesiac) {
					// Przypina dzisiejszą datę (np. 11 listopada)
					normalizedDate = dzisiaj.toISOString().split("T")[0];
				} else {
					// Dla historycznych miesięcy zostawia sztuczny koniec miesiąca
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
	}, [realSnapshots, dataMode, chartMode, portfolios, selectedIds]); // 👈 Zależność od selectedIds wymusza natychmiastowe przeliczenie!

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
					onRangeChange={setActiveRange}
					showBrush={true}
					titleInside="Analiza Wartości Kapitału"
					subtitleInside="Historia wyceny portfela i wkładu własnego"
					portfolios={portfolios}
					onPortfolioToggle={togglePortfolio}
					activeIds={selectedIds}
				/>
			</div>

			{/* 🚀 BANER INFORMACYJNY - PORTFOLIO */}
			<div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 shadow-sm mt-2">
				<Info className="w-5 h-5 shrink-0 mt-0.5" />
				<div className="flex flex-col">
					<span className="text-sm font-bold tracking-tight">
						Jak czytać ten wykres?
					</span>
					<span className="text-xs mt-1 leading-relaxed opacity-90 font-medium">
						Wykres prezentuje historyczną wartość kapitału dla wybranych
						portfeli. <strong>W trybie wyceny (PLN/EUR/USD)</strong> widoczne są
						dwie główne linie: zsumowana, całkowita wartość aktywów (gruba,
						falista) oraz wkład własny (przerywana), a odstęp między nimi to
						wygenerowany wynik. Zdarzenia inwestycyjne (np. wpłaty i wypłaty)
						nanoszone są punktowo, by pomóc Ci powiązać nagłe skoki portfela z
						Twoją faktyczną aktywnością na koncie.
					</span>
				</div>
			</div>
		</div>
	);
}
