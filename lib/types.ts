// 1. Importujemy wszystko, co potrzebne, prosto z Prisma Client
import {
	Asset,
	Category,
	Portfolio,
	Role,
	TransactionHistory,
	TransactionType,
} from "@prisma/client";

export type AssetCategory = Category;
export type Transaction = TransactionHistory;

// 2. Zmiana: Usuwamy ręczne eksporty AssetCategory, Role, Asset, Portfolio i Transaction
// Będą one teraz automatycznie pobierane z "@prisma/client" w miejscach, gdzie są potrzebne.

export const MODEL_ALLOCATION = [
	{ name: "Bonds", weight: 55, color: "bg-portfolio-bonds" },
	{ name: "Developed", weight: 15, color: "bg-portfolio-developed" },
	{ name: "Emerging", weight: 15, color: "bg-portfolio-emerging" },
	{ name: "Gold", weight: 10, color: "bg-portfolio-gold" },
	{ name: "Booster", weight: 5, color: "bg-portfolio-booster" },
	{ name: "Cash", weight: 0, color: "bg-portfolio-cash" },
	{ name: "Crypto", weight: 0, color: "bg-portfolio-crypto" },
	{ name: "Commodities", weight: 0, color: "bg-portfolio-commodities" },
	{ name: "Real Estate", weight: 0, color: "bg-portfolio-real-estate" },
	{ name: "Custom", weight: 0, color: "bg-portfolio-custom" },
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

// 3. Zmiana: Definiujemy PortfolioWithAssets jako rozszerzenie natywnego typu Portfolio
export type PortfolioWithAssets = Portfolio & {
	assets: Asset[];
	transactionHistories: TransactionHistory[];
};

export type AssetWithUI = Asset & {
	profitAmount: number;
	profitPercent: number;
	cleanTicker: string;
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

// Interfejsy specyficzne dla UI/Frontendu pozostają bez zmian:
export interface DashboardAsset {
	id: string;
	ticker?: string | null;
	category: string;
	investedCapital: number;
	currentValue: number;
}
// EN: Interface for a single point on the projection chart
export interface ProjectionPoint {
	name: string;
	value: number;
}

export interface GoalProjectionProps {
	currentValue: number;
	targetValue: number;
	monthlyDeposit: number;
}

export interface XtbExcelRow {
	ID: string | number;
	Time: string;
	Type: string;
	Symbol: string;
	Comment: string;
	Amount: number;
}

export interface SimpleTransaction {
	type: "BUY" | "SELL" | "DEPOSIT" | "WITHDRAWAL" | string;
}
