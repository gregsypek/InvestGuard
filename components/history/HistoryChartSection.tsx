"use client";

import { PortfolioWithAssets, Transaction } from "@/lib/types";

import { InlineChartFilters } from "@/components/ui/InlineChartFilters";
import { Loader2 } from "lucide-react";
import { PortfolioChart } from "../dashboard/PortfolioCharts";
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
	const { chartMode, dataMode, isPending, activeRange, selectedIds } =
		useChartContext();

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
	}, [realSnapshots, dataMode, chartMode, portfolios, selectedIds]); // 👈 Zależność od selectedIds wymusza natychmiastowe przeliczenie!
	return (
		<div className="flex flex-col h-full w-full">
			<InlineChartFilters
				portfolios={portfolios}
				oldestRealSnapshotDate={oldestRealSnapshotDate}
				showModeToggle={true}
				showPortfolioSelector={false}
			/>
			<div className="relative h-[400px] w-full mt-4">
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
				/>
			</div>
		</div>
	);
}
