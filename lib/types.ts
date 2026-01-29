export type AssetCategory =
	| "BONDS"
	| "DEVELOPED"
	| "EMERGING"
	| "GOLD"
	| "BOOSTER";

export const MODEL_ALLOCATION = [
	{ name: "Bonds", weight: 55, color: "bg-portfolio-bonds" },
	{ name: "Developed", weight: 15, color: "bg-portfolio-developed" },
	{ name: "Emerging", weight: 15, color: "bg-portfolio-emerging" },
	{ name: "Gold", weight: 10, color: "bg-portfolio-gold" },
	{ name: "Booster", weight: 5, color: "bg-portfolio-booster" },
];

export interface Asset {
	id: string;
	name: string; // np. "iShares Physical Gold"
	ticker?: string; // np. "IGLN.L"
	category: AssetCategory;
	value: number; // aktualna wartość w walucie
	targetPercentage: number; // np. 10 (for gold)
}

export interface Portfolio {
	id: string;
	name: string; // np. "Moje IKE", "Long term portfolio"
	userId: string;
	assets: Asset[];
	currency: "PLN" | "USD" | "EUR";
}

export interface StockPrice {
	price: string;
	change: string;
	symbol: string;
}

export interface BoosterTransaction {
	id?: string;
	assetName: string;
	amount: number;
	risk: 0 | 1 | 2 | 3 | 4 | 5;
	rationale: string;
	category: "IT" | "Energy" | "Other";
}

export interface RebalanceResult {
	assetName: string;
	currentPercentage: number;
	deviation: number; // o ile % odbiega od celu
	action: "BUY" | "SELL" | "HOLD";
}
