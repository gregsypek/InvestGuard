import { SimulatedSnapshot } from "@/components/ui/useDashboardData"; // Zaaktualizuj ścieżkę do interfejsu
import { useChartContext } from "@/components/providers/ChartProvider";
import { useMemo } from "react";

export function usePortfoliosComparison(
	realSnapshots: SimulatedSnapshot[] = [],
) {
	// 1. Get the global chart mode (VALUE or PERCENTAGE) directly from context
	const { chartMode } = useChartContext();

	const portfoliosComparisonData = useMemo(() => {
		if (!realSnapshots || realSnapshots.length === 0) return [];

		type CompareDataPoint = { date: string | Date; [key: string]: any };
		const dataByDate: Record<string, any> = {};

		realSnapshots.forEach((snapshot) => {
			// 2. Extract date portion only to group snapshots
			const dateStr = new Date(snapshot.date).toISOString().split("T")[0];

			if (!dataByDate[dateStr]) {
				dataByDate[dateStr] = { date: snapshot.date };
			}

			// 3. Calculate PnL based on the global chart mode
			const pnlValue = snapshot.totalValue - snapshot.investedValue;
			const pnlPercentage =
				snapshot.investedValue > 0
					? (pnlValue / snapshot.investedValue) * 100
					: 0;

			dataByDate[dateStr][snapshot.portfolioId] =
				chartMode === "PERCENTAGE"
					? Number(pnlPercentage.toFixed(2))
					: Number(pnlValue.toFixed(2));
		});

		// 4. Sort the final dataset chronologically
		return (Object.values(dataByDate) as CompareDataPoint[]).sort(
			(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
		);
	}, [realSnapshots, chartMode]);

	return { portfoliosComparisonData };
}
