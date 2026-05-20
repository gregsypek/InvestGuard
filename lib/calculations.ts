import { CategoryStatus, Portfolio, PortfolioWithAssets } from "./types";

// lib/calculations.ts
import { Asset } from "@prisma/client";
import { CATEGORY_CONFIG } from "./constants";

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
export function calculateAssetPL(asset: {
	investedCapital: number;
	currentValue: number;
}) {
	// 🚀 FIX: Zabezpieczenie przed dzieleniem przez zero oraz wartościami ujemnymi bazy kosztowej
	// Jeśli wkład nie istnieje, wynosi 0 lub spadł na minus (debet testowy), zysk procentowy to zawsze 0%
	if (!asset.investedCapital || asset.investedCapital <= 0) {
		// EN: Calculate absolute currency spread but force percentage representation to zero to avoid Infinity layout bugs
		// PL: Obliczamy zysk kwotowy, ale wymuszamy 0% zysku procentowego, aby uniknąć błędów renderowania Infinity
		const fallbackProfit = asset.currentValue - (asset.investedCapital || 0);
		return {
			profitAmount: fallbackProfit,
			profitPercent: 0,
		};
	}

	// 2. Obliczamy zysk kwotowy
	const profitAmount = asset.currentValue - asset.investedCapital;

	// 3. Obliczamy zysk procentowy
	const profitPercent = (profitAmount / asset.investedCapital) * 100;

	return {
		profitAmount,
		profitPercent,
	};
}

// lib/calculations.ts

export function calculateBondProgress(purchaseDate: Date, maturityDate: Date) {
	const now = new Date().getTime();
	const start = purchaseDate.getTime();
	const end = maturityDate.getTime();

	// 1. Obliczamy całkowity czas i czas, który minął
	const totalDuration = end - start;
	const timeElapsed = now - start;

	// 2. Jeśli mianownik jest zerem (błąd danych), zwracamy 0
	if (totalDuration <= 0) return 0;

	// 3. Obliczamy procent według Twojego wzoru
	let progress = (timeElapsed / totalDuration) * 100;

	// 4. Twoje warunki bezpieczeństwa (clamping)
	if (progress > 100) progress = 100;
	if (progress < 0) progress = 0;

	return progress;
}

// export function getBondProgressColor(progress: number) {
// 	if (progress < 30) return "bg-blue-500"; // Świeża inwestycja
// 	if (progress < 70) return "bg-orange-500"; // W trakcie (indeksacja działa)
// 	if (progress < 90) return "bg-emerald-500"; // Blisko wykupu
// 	return "bg-green-400 animate-pulse"; // Gotowa do rolowania!
// }

export function calculateAssetProfit(asset: {
	investedCapital: number;
	currentValue: number;
}) {
	// 🚀 FIX: Zabezpieczenie przed dzieleniem przez zero lub wartościami ujemnymi w bazie kosztowej
	if (!asset.investedCapital || asset.investedCapital <= 0) {
		return {
			profitAmount: asset.currentValue - (asset.investedCapital || 0),
			profitPercent: 0,
		};
	}

	const profitAmount = asset.currentValue - asset.investedCapital;
	const profitPercent = (profitAmount / asset.investedCapital) * 100;

	return {
		profitAmount,
		profitPercent,
	};
}
