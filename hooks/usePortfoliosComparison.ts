import { PortfolioWithAssets } from "@/lib/types";
import { SimulatedSnapshot } from "@/components/ui/useDashboardData";
import { useChartContext } from "@/components/providers/ChartProvider";
import { useMemo } from "react";

export function usePortfoliosComparison(
	portfolios: PortfolioWithAssets[],
	snapshots: SimulatedSnapshot[] = [],
	realSnapshots: SimulatedSnapshot[] = [],
) {
	// 🚀 Pobieramy funkcję przeliczającą
	const { chartMode, dataMode, convertPLN } = useChartContext();
	const portfoliosComparisonData = useMemo(() => {
		// Jeśli użytkownik wybrał "REAL", ale baza snapshotów jest pusta,
		// fallbackujemy do symulacji (lub transakcji), żeby wykres nie był pusty.
		const activeData =
			dataMode === "SIMULATED" || realSnapshots.length === 0
				? snapshots
				: realSnapshots;

		if (!activeData || activeData.length === 0) return [];

		type CompareDataPoint = { date: string | Date; [key: string]: any };
		const dataByDate: Record<string, any> = {};

		activeData.forEach((snapshot) => {
			const dateStr = new Date(snapshot.date).toISOString().split("T")[0];

			if (!dataByDate[dateStr]) {
				dataByDate[dateStr] = { date: snapshot.date };
			}
			// 🚀 Przeliczamy zainwestowany kapitał i wartość na nową walutę
			const convertedTotal = convertPLN(snapshot.totalValue);
			const convertedInvested = convertPLN(snapshot.investedValue);

			const pnlValue = convertedTotal - convertedInvested;

			// 🚀 Procent zysku jest matematycznie identyczny niezależnie od waluty, więc liczymy go z przeliczonych danych (dla konsekwencji)
			const pnlPercentage =
				convertedInvested > 0 ? (pnlValue / convertedInvested) * 100 : 0;

			dataByDate[dateStr][snapshot.portfolioId] =
				chartMode === "PERCENTAGE"
					? Number(pnlPercentage.toFixed(2))
					: Number(pnlValue.toFixed(2));
		});

		return (Object.values(dataByDate) as CompareDataPoint[]).sort(
			(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
		);
	}, [snapshots, realSnapshots, chartMode, dataMode, convertPLN]);

	return { portfoliosComparisonData };
}

