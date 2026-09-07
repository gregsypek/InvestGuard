import { PortfolioWithAssets } from "@/lib/types";
import { useChartContext } from "@/components/providers/ChartProvider";
import { useMemo } from "react";

export function usePortfolioSummary(portfolios: PortfolioWithAssets[]) {
	const { selectedIds } = useChartContext();

	const summary = useMemo(() => {
		// 1. Filtrujemy portfele na podstawie globalnego stanu
		const selectedPortfolios = selectedIds.includes("ALL")
			? portfolios
			: portfolios.filter((p) => selectedIds.includes(p.id));

		// 2. Wyliczamy statystyki
		const totalInvested = selectedPortfolios.reduce(
			(sum, p) =>
				sum +
				p.assets.reduce(
					(assetSum, a) => assetSum + (a.investedCapital || 0),
					0,
				),
			0,
		);

		const totalCurrent = selectedPortfolios.reduce(
			(sum, p) =>
				sum +
				p.assets.reduce((assetSum, a) => assetSum + (a.currentValue || 0), 0),
			0,
		);

		const totalPnL = totalCurrent - totalInvested;
		const totalPnLPct =
			totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

		return {
			activePortfolios: selectedPortfolios,
			totalInvested,
			totalCurrent,
			totalPnL,
			totalPnLPct,
		};
	}, [portfolios, selectedIds]);

	return summary;
}
