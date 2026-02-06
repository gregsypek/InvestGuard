// lib/rebalance.ts
import { Asset, RebalanceResult } from "./types";

export function calculateRebalance(assets: Asset[]): RebalanceResult[] {
	// Calculate total portfolio value
	const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);

	// 1. Group total values by category to check category-level targets
	const categoryTotals = assets.reduce(
		(acc, asset) => {
			acc[asset.category] = (acc[asset.category] || 0) + asset.value;
			return acc;
		},
		{} as Record<string, number>,
	);
	console.log("🚀 ~ calculateRebalance ~ categoryTotals:", categoryTotals);

	return assets.map((asset) => {
		// 2. We calculate percentages based on the WHOLE CATEGORY performance
		const categoryValue = categoryTotals[asset.category] || 0;
		const currentCategoryPercentage =
			totalValue > 0 ? (categoryValue / totalValue) * 100 : 0;

		// 3. Deviation is now calculated for the category target
		// Note: This assumes asset.targetPercentage represents the TARGET FOR THE WHOLE CATEGORY
		const deviation = currentCategoryPercentage - asset.targetPercentage;

		let action: "BUY" | "SELL" | "HOLD" = "HOLD";

		// Threshold for rebalancing (e.g., 1%)
		if (deviation > 1) action = "SELL";
		if (deviation < -1) action = "BUY";

		return {
			assetName: asset.name,
			currentPercentage: Number(currentCategoryPercentage.toFixed(2)),
			deviation: Number(deviation.toFixed(2)),
			action,
		};
	});
}
