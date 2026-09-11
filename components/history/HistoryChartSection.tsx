"use client";

import { PortfolioWithAssets, Transaction } from "@/lib/types";

import { InlineChartFilters } from "@/components/ui/InlineChartFilters";
import { Loader2 } from "lucide-react";
import { PortfolioChart } from "../dashboard/PortfolioCharts"; // lub odpowiednia ścieżka do wykresu
import { SimulatedSnapshot } from "@/components/ui/useDashboardData";
import { prepareChartAnalytics } from "@/lib/chart-helpers";
import { useChartContext } from "@/components/providers/ChartProvider";
import { useMemo } from "react";

interface HistoryChartSectionProps {
	portfolios: PortfolioWithAssets[];
	transactions: Transaction[];
	simulatedSnapshots: SimulatedSnapshot[];
	realSnapshots: SimulatedSnapshot[];
	oldestRealSnapshotDate?: Date;
	defaultPortfolioId?: string;
}

export function HistoryChartSection({
	portfolios,
	transactions,
	simulatedSnapshots, // Opcjonalny w tym układzie, ale zostawiamy dla spójności propsów
	realSnapshots,
	oldestRealSnapshotDate,
	defaultPortfolioId,
}: HistoryChartSectionProps) {
	console.log(
		"🚀 ~ HistoryChartSection ~ defaultPortfolioId:",
		defaultPortfolioId,
	);
	// 1. Zaciągamy ustawienia z Contextu (PRZYWRACAMY selectedIds do filtrowania!)
	const { chartMode, dataMode, isPending, activeRange, selectedIds } =
		useChartContext();

	// 2. Mapujemy dane wyjściowe pod PortfolioChart
	const portfolioChartData = useMemo(() => {
		// =========================================================
		// USUWAMY LOKALNE FILTROWANIE - PAGE.TSX ZROBIŁ TO ZA NAS!
		// =========================================================

		// TRYB REALNY
		if (dataMode === "REAL" && realSnapshots.length > 0) {
			const groupedByDate = realSnapshots.reduce(
				// <- Używamy realSnapshots bezpośrednio
				(acc: any, snap: any) => {
					const dateStr = new Date(snap.date).toISOString().split("T")[0];

					if (!acc[dateStr]) {
						acc[dateStr] = {
							date: dateStr,
							totalValue: 0,
							investedValue: 0,
						};
					}

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

		// =========================================================
		// TRYB SYMULOWANY: Stary, gładki silnik oparty na transakcjach
		// =========================================================
		const allAssets = portfolios.flatMap((p) => p.assets);
		const totalInvoiced = allAssets.reduce(
			(sum, a) => sum + Number(a.investedCapital),
			0,
		);
		const totalValue = allAssets.reduce(
			(sum, a) => sum + Number(a.currentValue),
			0,
		);

		const currentRoiFactor = totalInvoiced > 0 ? totalValue / totalInvoiced : 1;

		// Używamy przefiltrowanych transakcji!
		const { areaPoints } = prepareChartAnalytics(
			transactions, // <- Używamy transactions z props
			currentRoiFactor,
		);

		return areaPoints.map((point) => {
			let normalizedDate = new Date().toISOString().split("T")[0];

			const [month, year] = point.name.split(".");
			if (month && year) {
				const fullYear = parseInt(year) > 50 ? `19${year}` : `20${year}`;
				normalizedDate = `${fullYear}-${month}-28`;
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
	}, [realSnapshots, dataMode, chartMode, portfolios, transactions]);

	return (
		<div className="flex flex-col h-full w-full">
			{/* FILTRY - Przywracamy pigułki portfeli! */}
			<InlineChartFilters
				portfolios={portfolios}
				oldestRealSnapshotDate={oldestRealSnapshotDate}
				showModeToggle={true}
				showPortfolioSelector={false} // 👈 USTAWIAMY NA FALSE
			/>

			<div className="relative h-[400px] w-full mt-4">
				{isPending && (
					<div className="absolute inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] rounded-2xl transition-all duration-300 flex items-center justify-center">
						<div className="flex flex-col items-center gap-3 bg-slate-900/90 border border-slate-700/50 p-4 rounded-2xl shadow-2xl">
							<Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
							<span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
								Przeliczanie...
							</span>
						</div>
					</div>
				)}

				<PortfolioChart
					key={`${chartMode}-${dataMode}-${activeRange}`}
					data={portfolioChartData}
					// Przekazujemy prosto transactions, bez lokalnego .filter()
					transactions={transactions}
					mode={chartMode}
				/>
			</div>
		</div>
	);
}
