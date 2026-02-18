export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Invest Guard";
export const APP_DESCRIPTION =
	process.env.NEXT_PUBLIC_APP_DESC ||
	"A modern  platform for managage investments.";
export const SERVER_URL =
	process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";
import { AssetCategory, CategoryConfig } from "./types";

import { Asset } from "./types";

export const CATEGORY_ASSETS: AssetCategory[] = [
	"BONDS",
	"DEVELOPED",
	"EMERGING",
	"GOLD",
	"BOOSTER",
	"CASH",
	"CRYPTO",
	"COMMODITIES",
];

// EN: Mapping technical keys to Polish labels
// UI: Mapowanie kluczy technicznych na polskie etykiety
export const CATEGORY_LABELS: Record<string, string> = {
	BONDS: "Obligacje",
	DEVELOPED: "Rynki Rozwinięte",
	EMERGING: "Rynki Wschodzące",
	GOLD: "Złoto",
	BOOSTER: "Booster (Alpha)",
	CASH: "Gotówka",
	CRYPTO: "Kryptowaluty",
	COMMODITIES: "Surowce",
};

export const mockAssets: Asset[] = [
	// 10% GOLD
	{
		id: "1",
		name: "iShares Physical Gold",
		ticker: "IGLN.L",
		category: "GOLD",
		value: 2000, // Slightly overweight
		targetPercentage: 10,
	},
	// 55% BONDS (EDO + DOS)
	{
		id: "2",
		name: "Polish Treasury Bonds",
		ticker: "EDO",
		category: "BONDS",
		value: 6000,
		targetPercentage: 55, // Split within Bonds category
	},
	{
		id: "3",
		name: "mWIG40TR",
		ticker: "DOS",
		category: "EMERGING",
		value: 1500,
		targetPercentage: 15, // Total Bonds: 55%
	},

	{
		id: "4",
		name: "iShares Core MSCI World",
		ticker: "EUNL.DE",
		category: "DEVELOPED",
		value: 2050,
		targetPercentage: 15,
	},
	// 15% EMERGING MARKETS
	{
		id: "5",
		name: "iShares Core MSCI EM IMI",
		ticker: "EIMI.L",
		category: "EMERGING",
		value: 2100, // Slightly underweight
		targetPercentage: 15,
	},
	{
		id: "8",
		name: "Global Aerospace & Defence",
		ticker: "DFND.SE",
		category: "DEVELOPED",
		value: 480,
		targetPercentage: 15,
	},
	{
		id: "9",
		name: "MSCI Em Latin America",
		ticker: "IDAL",
		category: "EMERGING",
		value: 500,
		targetPercentage: 15,
	},
	{
		id: "7",
		name: "Meta Platforms (IT Boom)",
		ticker: "META",
		category: "BOOSTER",
		value: 300,
		targetPercentage: 2.5,
	},
];
// Your master plan: 15/15/10/55/5
export const MODEL_ALLOCATION: CategoryConfig[] = [
	{ name: "Bonds", category: "BONDS", weight: 55, color: "bg-portfolio-bonds" },
	{
		name: "Developed",
		category: "DEVELOPED",
		weight: 15,
		color: "bg-portfolio-developed",
	},
	{
		name: "Emerging",
		category: "EMERGING",
		weight: 15,
		color: "bg-portfolio-emerging",
	},
	{ name: "Gold", category: "GOLD", weight: 10, color: "bg-portfolio-gold" },
	{
		name: "Booster",
		category: "BOOSTER",
		weight: 5,
		color: "bg-portfolio-booster",
	},
];

export const CATEGORY_CONFIG = [
	{
		id: "BONDS",
		targetKey: "targetBonds",
		name: "Obligacje",
		// EN: Using custom theme variables defined in globals.css
		// UI: Użycie zmiennych zdefiniowanych w @theme
		color: "bg-portfolio-bonds",
	},
	{
		id: "DEVELOPED",
		targetKey: "targetDeveloped",
		name: "Rynki Rozwinięte",
		color: "bg-portfolio-developed",
	},
	{
		id: "EMERGING",
		targetKey: "targetEmerging",
		name: "Rynki Wschodzące",
		color: "bg-portfolio-emerging",
	},
	{
		id: "GOLD",
		targetKey: "targetGold",
		name: "Złoto",
		color: "bg-portfolio-gold",
	},
	{
		id: "CASH",
		targetKey: "targetCash",
		name: "Gotówka",
		color: "bg-portfolio-cash",
	},
	{
		id: "CRYPTO",
		targetKey: "targetCrypto",
		name: "Kryptowaluty",
		color: "bg-portfolio-crypto",
	},
	{
		id: "BOOSTER", // EN: Added Booster to match your CSS variables
		targetKey: "targetBooster",
		name: "Booster",
		color: "bg-portfolio-booster",
	},
	{
		id: "COMMODITIES",
		targetKey: "targetCommodities",
		name: "Surowce",
		color: "bg-portfolio-commodities",
	},
] as const; // Dodanie tego sprawi, że TypeScript będzie widział konkretne wartości zamiast stringów;

export const COLORS: Record<string, string> = {
	BONDS: "var(--color-portfolio-bonds)",
	DEVELOPED: "var(--color-portfolio-developed)",
	EMERGING: "var(--color-portfolio-emerging)",
	GOLD: "var(--color-portfolio-gold)",
	BOOSTER: "var(--color-portfolio-booster)",
	CASH: "var(--color-portfolio-cash)",
	CRYPTO: "var(--color-portfolio-crypto)",
	COMMODITIES: "var(--color-portfolio-commodities)",
};

export const CATEGORY_DETAILS: Record<
	AssetCategory,
	{ label: string; color: string; icon: string }
> = {
	BONDS: { label: "Obligacje", color: "bg-blue-500", icon: "🛡️" },
	DEVELOPED: { label: "Rynki Rozwinięte", color: "bg-green-600", icon: "🏙️" },
	EMERGING: { label: "Rynki Wschodzące", color: "bg-orange-500", icon: "🌍" },
	GOLD: { label: "Złoto i Kruszce", color: "bg-yellow-500", icon: "💰" },
	BOOSTER: { label: "Okazje / Inne", color: "bg-purple-500", icon: "🚀" },
	CASH: { label: "Gotówka", color: "bg-slate-400", icon: "💵" },
	CRYPTO: { label: "Kryptowaluty", color: "bg-blue-600", icon: "🪙" },
	COMMODITIES: { label: "Surowce", color: "bg-brown-600", icon: "🛢️" },
};
