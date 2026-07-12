import {
	Asset,
	Category,
	TimeHorizon,
	TransactionHistory,
} from "@prisma/client";

import { PortfolioWithAssets } from "@/lib/types";

// Pomocnik do dat
const daysAgo = (days: number) => {
	const d = new Date();
	d.setDate(d.getDate() - days);
	return d;
};

/**
 * Tworzy pełny obiekt Asset zgodny ze schematem Prisma.
 */
const createDemoAsset = (data: {
	id: string;
	name: string;
	category: Category;
	investedCapital: number;
	currentValue: number;
	quantity: number;
	targetPercentage: number;
	ticker?: string | null;
	purchaseDate?: Date;
}): Asset => {
	return {
		id: data.id,
		name: data.name,
		category: data.category,
		ticker: data.ticker ?? null,
		quantity: data.quantity,
		isObserved: false,
		nominalValue: null,
		dailyChange: 0,

		// Dane finansowe
		investedCapital: data.investedCapital,
		currentValue: data.currentValue,
		targetPercentage: data.targetPercentage,

		// Pola z modelu Asset
		rationale: "Strategia demo",
		timeHorizon: "LONG" as TimeHorizon,
		expectedRoi: null,
		conviction: null,
		riskLevel: "MEDIUM",

		// Dane obligacji i daty
		purchaseDate: data.purchaseDate ?? new Date(),
		maturityDate: null,
		interestRate: null,
		rateType: null,

		// Wymagane przez bazę
		createdAt: new Date(),
		updatedAt: new Date(),
		portfolioId: "demo-id",
	};
};

// Generator transakcji do wypełnienia wykresów AreaChart
const generateHistory = (
	assetName: string,
	category: string,
	totalValue: number,
	months: number,
): TransactionHistory[] => {
	return Array.from({ length: months }).map((_, i) => ({
		id: `tx-${assetName}-${i}`,
		externalId: `demo-ext-${assetName}-${i}`, // 🚀 DODANE: Wymagane przez bazę
		type: "BUY",
		assetName,
		category: category as Category,
		executedValue: totalValue / months,
		originalPrice: totalValue / months, // 🚀 DODANE: Cena oryginalna
		originalCurrency: "PLN", // 🚀 DODANE: Waluta oryginalna
		exchangeRate: 1, // 🚀 DODANE: Kurs wymiany
		quantity: 1,
		executedAt: daysAgo((months - i) * 30),
		portfolioId: "demo-id",
		createdAt: new Date(),
		updatedAt: new Date(),
		ticker: null,
		rationale: null,
		comment: "Demo", // 🚀 DODANE: Komentarz systemowy
	}));
};

// --- 1. RAY DALIO (ALL WEATHER) ---
export const allWeatherPortfolio: PortfolioWithAssets = {
	id: "demo-dalio",
	name: "Ray Dalio - All Weather",
	userId: "demo-user",
	currency: "PLN",
	targetBonds: 55,
	targetDeveloped: 30,
	targetGold: 7.5,
	targetCommodities: 7.5,
	targetEmerging: 0,
	targetBooster: 0,
	targetCash: 0,
	targetCrypto: 0,
	targetRealEstate: 0,
	targetCustom: 0,

	assets: [
		createDemoAsset({
			id: "d1",
			name: "Obligacje Skarbowe",
			ticker: "EDO",
			category: "BONDS",
			investedCapital: 55000,
			currentValue: 56200,
			quantity: 550,
			targetPercentage: 55,
			purchaseDate: daysAgo(365),
		}),
		createDemoAsset({
			id: "d2",
			name: "MSCI World ETF",
			ticker: "EUNL.DE",
			category: "DEVELOPED",
			investedCapital: 30000,
			currentValue: 32400,
			quantity: 40,
			targetPercentage: 30,
			purchaseDate: daysAgo(365),
		}),
		createDemoAsset({
			id: "d3",
			name: "Złoto Fizyczne",
			ticker: "IGLN.L",
			category: "GOLD",
			investedCapital: 7500,
			currentValue: 8100,
			quantity: 1,
			targetPercentage: 7.5,
			purchaseDate: daysAgo(365),
		}),
		createDemoAsset({
			id: "d4",
			name: "Commodities ETF",
			ticker: "ICOM.L",
			category: "COMMODITIES",
			investedCapital: 7500,
			currentValue: 7200,
			quantity: 100,
			targetPercentage: 7.5,
			purchaseDate: daysAgo(365),
		}),
	],
	transactionHistories: [
		...generateHistory("Obligacje Skarbowe", "BONDS", 55000, 6),
		...generateHistory("MSCI World ETF", "DEVELOPED", 30000, 6),
		...generateHistory("Złoto Fizyczne", "GOLD", 7500, 6),
		...generateHistory("Commodities ETF", "COMMODITIES", 7500, 6),
	],
};

// --- 2. KLASYCZNY 60/40 ---
export const classicPortfolio: PortfolioWithAssets = {
	id: "demo-classic",
	name: "Klasyczny 60/40",
	userId: "demo-user",
	currency: "PLN",
	targetBonds: 40,
	targetDeveloped: 60,
	targetEmerging: 0,
	targetBooster: 0,
	targetCash: 0,
	targetCrypto: 0,
	targetGold: 0,
	targetCommodities: 0,
	targetRealEstate: 0,
	targetCustom: 0,

	assets: [
		createDemoAsset({
			id: "c1",
			name: "Obligacje EDO",
			ticker: "EDO",
			category: "BONDS",
			investedCapital: 40000,
			currentValue: 41000,
			quantity: 400,
			targetPercentage: 40,
		}),
		createDemoAsset({
			id: "c2",
			name: "Vanguard All-World",
			ticker: "VWCE.DE",
			category: "DEVELOPED",
			investedCapital: 60000,
			currentValue: 65000,
			quantity: 150,
			targetPercentage: 60,
		}),
	],
	transactionHistories: [
		...generateHistory("Obligacje EDO", "BONDS", 40000, 4),
		...generateHistory("Vanguard All-World", "DEVELOPED", 60000, 4),
	],
};

// --- 3. MODEL YALE (SWENSEN) ---
export const yalePortfolio: PortfolioWithAssets = {
	id: "demo-yale",
	name: "Model Yale",
	userId: "demo-user",
	currency: "PLN",
	targetBonds: 30,
	targetDeveloped: 50,
	targetEmerging: 20,
	targetBooster: 0,
	targetCash: 0,
	targetCrypto: 0,
	targetGold: 0,
	targetCommodities: 0,
	targetRealEstate: 0,
	targetCustom: 0,

	assets: [
		createDemoAsset({
			id: "y1",
			name: "Akcje USA (VTI)",
			ticker: "VTI",
			category: "DEVELOPED",
			investedCapital: 30000,
			currentValue: 33000,
			quantity: 50,
			targetPercentage: 30,
			purchaseDate: daysAgo(200),
		}),
		createDemoAsset({
			id: "y2",
			name: "Nieruchomości (REITs)",
			ticker: "VNQ",
			category: "DEVELOPED",
			investedCapital: 20000,
			currentValue: 21000,
			quantity: 30,
			targetPercentage: 20,
			purchaseDate: daysAgo(200),
		}),
		createDemoAsset({
			id: "y3",
			name: "Emerging Markets",
			ticker: "EIMI.L",
			category: "EMERGING",
			investedCapital: 20000,
			currentValue: 19000,
			quantity: 100,
			targetPercentage: 20,
			purchaseDate: daysAgo(200),
		}),
		createDemoAsset({
			id: "y4",
			name: "Treasury Bonds",
			ticker: "TLT",
			category: "BONDS",
			investedCapital: 30000,
			currentValue: 29500,
			quantity: 80,
			targetPercentage: 30,
			purchaseDate: daysAgo(200),
		}),
	],
	transactionHistories: [
		...generateHistory("Akcje USA (VTI)", "DEVELOPED", 30000, 5),
		...generateHistory("Nieruchomości (REITs)", "DEVELOPED", 20000, 5),
		...generateHistory("Emerging Markets", "EMERGING", 20000, 5),
		...generateHistory("Treasury Bonds", "BONDS", 30000, 5),
	],
};

const baseDemoPortfolio = {
	id: "demo-portfolio-id",
	userId: "demo-user",
	createdAt: new Date(),
	updatedAt: new Date(),
	description: "Portfel modelowy do celów edukacyjnych",
	goal: 100000,
	// Domyślne wagi (zostaną nadpisane przez konkretne strategie)
	targetDeveloped: 0,
	targetEmerging: 0,
	targetBonds: 0,
	targetGold: 0,
	targetBooster: 0,
	targetCash: 0,
	targetCrypto: 0,
	targetCommodities: 0,
	targetRealEstate: 0,
	targetCustom: 0,
};

export const demoPlans = [
	{
		id: "plan-1",
		name: "Bitcoin",
		ticker: "BTC",
		value: 1000,
		plannedDate: "2026-04-15", // Musi mieć 10 znaków lub 7 (YYYY-MM), aby .length zadziałało
		targetCategory: "CRYPTO" as Category,
		conviction: 3,
		isExecuted: false,
		isRecurring: false,
		rationale: "Akumulacja po korekcie - strategia Booster 5%",
		portfolioId: "demo-dalio",
		createdAt: new Date(),
		updatedAt: new Date(),
		// KLUCZOWE: Pełny obiekt portfela zamiast samej nazwy
		portfolio: {
			...baseDemoPortfolio,
			name: "Ray Dalio - All Weather",
			targetBonds: 55,
			targetDeveloped: 30,
			targetGold: 7.5,
			targetCommodities: 7.5,
		},
	},
	{
		id: "plan-2",
		name: "Złoto Fizyczne",
		ticker: "GOLD",
		value: 2500,
		plannedDate: "2026-05-01",
		targetCategory: "GOLD" as Category,
		conviction: 5,
		isExecuted: false,
		isRecurring: false,
		rationale: "Uzupełnienie wagi do 10% portfela",
		portfolioId: "demo-classic",
		createdAt: new Date(),
		updatedAt: new Date(),
		portfolio: {
			...baseDemoPortfolio,
			name: "Klasyczny 60/40",
			targetBonds: 40,
			targetDeveloped: 60,
		},
	},
];
