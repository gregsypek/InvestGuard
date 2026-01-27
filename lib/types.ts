export type AssetCategory =
	| "BONDS"
	| "EQUITY_DEV"
	| "EQUITY_EM"
	| "GOLD"
	| "BOOSTER";

export const MODEL_ALLOCATION = [
	{ name: "Bonds", weight: 55, color: "bg-portfolio-bonds" },
	{ name: "Developed", weight: 15, color: "bg-portfolio-equity_dev" },
	{ name: "Emerging", weight: 15, color: "bg-portfolio-equity_em" },
	{ name: "Gold", weight: 10, color: "bg-portfolio-gold" },
	{ name: "Booster", weight: 5, color: "bg-portfolio-booster" },
];

export interface Asset {
	id: string;
	name: string; // np. "iShares Physical Gold"
	ticker: string; // np. "IGLN.L"
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

export interface AssetRow {
	assetClass: string;
	targetWeight: number; // e.g., 55 for Bonds
	actualWeight: number; // e.g., 52
	actualAmount: number; // e.g., 5200 PLN
}

// Example of the model we discussed
export const MODEL_PORTFOLIO: AssetRow[] = [
	{ assetClass: "Bonds", targetWeight: 55, actualWeight: 0, actualAmount: 0 },
	{
		assetClass: "Developed Markets",
		targetWeight: 15,
		actualWeight: 0,
		actualAmount: 0,
	},
	{
		assetClass: "Emerging Markets",
		targetWeight: 15,
		actualWeight: 0,
		actualAmount: 0,
	},
	{ assetClass: "Gold", targetWeight: 10, actualWeight: 0, actualAmount: 0 },
	{ assetClass: "Booster", targetWeight: 5, actualWeight: 0, actualAmount: 0 },
];

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
