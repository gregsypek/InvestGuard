// lib/calculations.ts
import { Asset } from "@prisma/client";
import { CATEGORY_CONFIG } from "./constants";
import { CategoryStatus, Portfolio, PortfolioWithAssets } from "./types";

/**
 * Calculates the gap between the current portfolio and the target model.
 * Includes deviation in both currency (PLN) and percentage points.
 */
export function calculateGapAnalysis(
	portfolio: Portfolio & { assets: Asset[] },
): CategoryStatus[] {
	const { assets } = portfolio;

	// EN: Now using currentValue for total portfolio valuation
	// UI: Teraz używamy currentValue do obliczenia całkowitej wartości portfela
	const totalValue = assets.reduce((sum, asset) => sum + asset.currentValue, 0);

	return CATEGORY_CONFIG.map((config) => {
		// 1. Sumujemy aktualną wycenę aktywów dla danej kategorii
		const actualAmount = assets
			.filter((a) => a.category === config.id)
			.reduce((sum, a) => sum + a.currentValue, 0);

		// 2. Pobieramy docelową wagę (np. 55 dla BONDS)
		const targetWeight =
			(portfolio[config.targetKey as keyof Portfolio] as number) || 0;

		// 3. Obliczamy procenty i różnice w oparciu o rynkową wycenę
		const actualPercentage =
			totalValue > 0 ? (actualAmount / totalValue) * 100 : 0;

		const targetAmount = (targetWeight / 100) * totalValue;

		const differenceWeight = actualPercentage - targetWeight;
		const differencePLN = targetAmount - actualAmount;

		return {
			category: config.id,
			name: config.name,
			color: config.color,
			weight: targetWeight,
			actualAmount,
			actualPercentage,
			differenceWeight,
			differencePLN,
		};
	});
}

export function getPortfolioStats(portfolio: PortfolioWithAssets) {
	const { goal, name, assets } = portfolio;

	// 1. Sumujemy wartość wszystkich aktywów
	const totalValue = assets.reduce((sum, asset) => sum + asset.currentValue, 0);

	// 2. Obliczamy postęp (wartość 0-100+)
	// Używamy Math.max, aby uniknąć problemów, gdyby cel był ujemny
	const progress = goal && goal > 0 ? (totalValue * 100) / goal : 0;

	// 3. Obliczamy ile brakuje do celu
	const remaining = goal ? Math.max(0, goal - totalValue) : 0;

	return {
		name,
		totalValue,
		goal: goal || 0,
		progress,
		remaining,
	};
}

export function getGlobalStats(portfolios: PortfolioWithAssets[]) {
	const allAssets = portfolios.flatMap((p) => p.assets);

	const totalValue = allAssets.reduce((sum, a) => sum + a.currentValue, 0);

	// Obliczamy udział kategorii w całym majątku 🥧
	const categoryTotals = allAssets.reduce(
		(acc, asset) => {
			acc[asset.category] = (acc[asset.category] || 0) + asset.currentValue;
			return acc;
		},
		{} as Record<string, number>,
	);

	return {
		totalValue,
		portfoliosCount: portfolios.length,
		assetsCount: allAssets.length,
		categoryTotals, // Dane do wykresu lub tabeli
	};
}
