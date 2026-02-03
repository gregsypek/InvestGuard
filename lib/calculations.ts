// lib/calculations.ts
import { Asset } from "@prisma/client";
import { MODEL_ALLOCATION } from "./constants";
import { CategoryStatus } from "./types";

/**
 * Calculates the gap between the current portfolio and the target model.
 * Includes deviation in both currency (PLN) and percentage points.
 */
export function calculateGapAnalysis(assets: Asset[]): CategoryStatus[] {
	const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);

	return MODEL_ALLOCATION.map((model) => {
		const actualAmount = assets
			.filter((a) => a.category === model.category)
			.reduce((sum, a) => sum + a.value, 0);

		const actualPercentage =
			totalValue > 0 ? (actualAmount / totalValue) * 100 : 0;
		const targetAmount = (model.weight / 100) * totalValue;

		// Calculating the deviation in percentage points
		const differenceWeight = actualPercentage - model.weight;
		const differencePLN = targetAmount - actualAmount;

		return {
			...model,
			actualAmount,
			actualPercentage,
			differenceWeight,
			differencePLN,
		};
	});
}
