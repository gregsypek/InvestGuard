// lib/types.ts - dodajmy typ wyniku
export interface RebalanceResult {
	assetName: string;
	currentPercentage: number;
	deviation: number; // o ile % odbiega od celu
	action: "BUY" | "SELL" | "HOLD";
}

// lib/rebalance.ts
import { Asset, MODEL_ALLOCATION } from "./types";

export function calculateRebalance(assets: Asset[]): RebalanceResult[] {
	const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);

	return assets.map((asset) => {
		// Calculate total portfolio value
		const currentPercentage =
			totalValue > 0 ? (asset.value / totalValue) * 100 : 0;

		// Calculate deviation(odchylenie (np. 12% - 10% = 2%))
		const deviation = currentPercentage - asset.targetPercentage;

		let action: "BUY" | "SELL" | "HOLD" = "HOLD";
		if (deviation > 1) action = "SELL";
		if (deviation < -1) action = "BUY";

		return {
			assetName: asset.name,
			currentPercentage: Number(currentPercentage.toFixed(2)),
			deviation: Number(deviation.toFixed(2)),
			action,
		};
	});
}

// lib/rebalance.ts

export function getCategoryStats(assets: Asset[]) {
	const totalValue = assets.reduce((sum, a) => sum + a.value, 0);

	return MODEL_ALLOCATION.map((modelItem) => {
		// Filter assets by category matching the model name
		const categoryAssets = assets.filter(
			(a) => a.category === modelItem.name.toUpperCase(),
		);

		const actualAmount = categoryAssets.reduce((sum, a) => sum + a.value, 0);
		const actualWeight = totalValue > 0 ? (actualAmount / totalValue) * 100 : 0;
		const deviationWeight = actualWeight - modelItem.weight;

		// How much money we should have vs what we actually have
		const targetAmount = (modelItem.weight * totalValue) / 100;
		const amountDifference = targetAmount - actualAmount;

		return {
			...modelItem,
			actualWeight,
			actualAmount,
			deviationWeight,
			amountDifference, // Positive means "need to buy", negative "need to sell"
		};
	});
}
