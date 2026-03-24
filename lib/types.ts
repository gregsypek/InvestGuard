import { Category, Prisma, TransactionHistory } from "@prisma/client";

export type AssetCategory =
	| "BONDS"
	| "DEVELOPED"
	| "EMERGING"
	| "GOLD"
	| "BOOSTER"
	| "CASH"
	| "CRYPTO"
	| "COMMODITIES";

export const MODEL_ALLOCATION = [
	{ name: "Bonds", weight: 55, color: "bg-portfolio-bonds" },
	{ name: "Developed", weight: 15, color: "bg-portfolio-developed" },
	{ name: "Emerging", weight: 15, color: "bg-portfolio-emerging" },
	{ name: "Gold", weight: 10, color: "bg-portfolio-gold" },
	{ name: "Booster", weight: 5, color: "bg-portfolio-booster" },
	{ name: "Cash", weight: 0, color: "bg-portfolio-cash" },
	{ name: "Crypto", weight: 0, color: "bg-portfolio-crypto" },
	{ name: "Commodities", weight: 0, color: "bg-portfolio-commodities" },
];

export interface Asset {
	id: string;
	name: string;
	ticker?: string | null;
	category: AssetCategory;

	// REWOLUCJA FINANSOWA 💰
	investedCapital: number; // Musi być, by liczyć zysk
	currentValue: number; // Musi być, by liczyć rebalancing

	// NOWE POLA Z PRISMA 🧱
	// EN: Add the new fields to the manual Asset interface
	quantity: number; // Musi być, by liczyć średnią cenę i udziały

	nominalValue?: number | null; // Opcjonalne dla obligacji
	// OGÓLNE DLA BOOSTER & BONDS 🚀
	rationale?: string | null;
	timeHorizon?: string | null; // W bazie mamy Enum lub String

	// POLA DLA ALPHA / BOOSTER 💎
	expectedRoi?: number | null; // Zmieniamy na number, by móc na tym liczyć
	conviction?: number | null; // 1-100
	riskLevel?: string | null;

	// POLA DLA OBLIGACJI (BONDS) 📑
	purchaseDate: Date; // Prisma zwraca obiekty Date
	maturityDate?: Date | null; // Prisma zwraca obiekty Date
	interestRate?: number | null;
	rateType?: string | null; // "FIXED" | "VARIABLE" (opcjonalne, bo nie każde aktywo to obligacja)

	targetPercentage: number;
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

// Configuration for each portfolio category
export interface CategoryConfig {
	name: string;
	category: Category; // ENUM from Prisma: BONDS, EMERGING, etc.
	weight: number; // Target percentage (e.g., 55)
	color: string; // Tailwind class for charts
}
// Result of our gap analysis for a single category
export interface CategoryStatus extends CategoryConfig {
	actualAmount: number;
	actualPercentage: number;
	differencePLN: number;
	differenceWeight: number;
}

export type ActionResponse = {
	success?: boolean;
	id?: string;
	error?: string;
};

export interface Portfolio {
	id: string;
	name: string;
	description?: string | null;
	userId: string;
	goal?: number | null;
	currency?: "PLN" | "USD" | "EUR";
	assets: Asset[];
	targetDeveloped: number;
	targetEmerging: number;
	targetBonds: number;
	targetGold: number;
	targetBooster: number;
	targetCash: number;
	targetCrypto: number;
	targetCommodities: number;
}

// // To stworzy typ dokładnie taki, jaki zwraca zapytanie z "include: { assets: true }"
// export type PortfolioWithAssets = Prisma.PortfolioGetPayload<{
// 	include: { assets: true };
// }>;

export type PortfolioWithAssets = Portfolio & {
	assets: Asset[];
	transactionHistories: TransactionHistory[]; // ⬅️ DODAJ TĘ LINIĘ
};

export interface Bond {
	id: string;
	ticker: string | null;
	name: string;
	purchaseDate: string;
	maturityDate: string | null; // Tu dopuszczamy null
	investedCapital: number;
	currentValue: number;
	interestRate: number | null;
	quantity: number;
}
