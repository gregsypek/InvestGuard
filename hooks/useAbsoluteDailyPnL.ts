// Dopasuj import interfejsu SimulatedSnapshot z odpowiedniego pliku
import { SimulatedSnapshot } from "@/components/ui/useDashboardData";
import { useChartContext } from "@/components/providers/ChartProvider";
import { useMemo } from "react";

export function useAbsoluteDailyPnL(
	snapshots: SimulatedSnapshot[] = [],
	realSnapshots: SimulatedSnapshot[] = [],
) {
	const { dataMode } = useChartContext();

	const absoluteChartData = useMemo(() => {
		// Wybór źródła danych na podstawie filtra
		const activeData =
			dataMode === "SIMULATED" || realSnapshots.length === 0
				? snapshots
				: realSnapshots;

		if (!activeData || activeData.length === 0) return [];

		// Sortowanie chronologiczne
		const sortedSnapshots = [...activeData].sort(
			(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
		);

		const finalAbsoluteData: any[] = [];
		let lastInvested = 0;
		let lastValue = 0;

		sortedSnapshots.forEach((snap, index) => {
			const dateStr = new Date(snap.date).toISOString().split("T")[0];
			let dayNetCashFlow = 0;
			let dayExactChangePLN = 0;

			if (index === 0) {
				dayExactChangePLN = snap.dailyChange || 0;
			} else {
				dayNetCashFlow = snap.investedValue - lastInvested;
				dayExactChangePLN = snap.totalValue - lastValue - dayNetCashFlow;
			}

			lastInvested = snap.investedValue;
			lastValue = snap.totalValue;

			finalAbsoluteData.push({
				date: dateStr,
				exactChangePLN: Number(dayExactChangePLN.toFixed(2)),
				totalPortfolioValue: Number(snap.totalValue.toFixed(2)),
				netCashFlow: Number(dayNetCashFlow.toFixed(2)),
			});
		});

		return finalAbsoluteData;
	}, [snapshots, realSnapshots, dataMode]);

	return { absoluteChartData };
}
