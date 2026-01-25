export type AssetCategory =
	| "BONDS"
	| "EQUITY_DEV"
	| "EQUITY_EM"
	| "GOLD"
	| "BOOSTER";

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
