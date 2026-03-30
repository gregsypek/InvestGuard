import { AssetCategory, CategoryConfig } from "./types";
import { CloudSun, GraduationCap, Scale } from "lucide-react";
import {
	allWeatherPortfolio,
	classicPortfolio,
	yalePortfolio,
} from "@/lib/demoData";

import { cn } from "./utils";

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Invest Guard";
export const APP_DESCRIPTION =
	process.env.NEXT_PUBLIC_APP_DESC ||
	"A modern  platform for managage investments.";
export const SERVER_URL =
	process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";

export const PAGE_ITEMS = 10;

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
export const CATEGORY_LABELS: Record<AssetCategory, string> = {
	BONDS: "Obligacje",
	DEVELOPED: "Rynki Rozwinięte",
	EMERGING: "Rynki Wschodzące",
	GOLD: "Złoto",
	BOOSTER: "Booster (Alpha)",
	CASH: "Gotówka",
	CRYPTO: "Kryptowaluty",
	COMMODITIES: "Surowce",
};

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

// EN: Shared focus styles to remove thick ring and use subtle border instead
// UI: Wspólne style dla focusa, aby usunąć gruby ring i użyć subtelnego borderu
export const inputStyles = cn(
	"h-10 w-full bg-background/50 border-border2 transition-all shadow-none",
	"focus:bg-background focus:border-blue-500 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none",
);

// EN: Map database columns to UI category constants
// UI: Mapowanie kolumn bazy danych na stałe kategorii UI
export const PORTFOLIO_STRATEGY_MAP = {
	targetBonds: "BONDS",
	targetDeveloped: "DEVELOPED",
	targetEmerging: "EMERGING",
	targetGold: "GOLD",
	targetBooster: "BOOSTER",
	targetCash: "CASH",
	targetCrypto: "CRYPTO",
	targetCommodities: "COMMODITIES",
} as const;

export const BOND_TYPES = {
	EDO: { label: "EDO (10-letnie)", duration: 10, category: "OBLIGACJE" },
	COI: { label: "COI (4-letnie)", duration: 4, category: "OBLIGACJE" },
	DOS: { label: "DOS (2-letnie)", duration: 2, category: "OBLIGACJE" },
	OTS: { label: "OTS (3-miesięczne)", duration: 0.25, category: "OBLIGACJE" },
};

export const BOND_CONFIG = {
	ROD: {
		label: "ROD (12-letnie)",
		color: "bg-purple-400", // Fioletowy dla wyróżnienia serii rodzinnej
		border: "border-purple-200",
	},
	EDO: {
		label: "EDO (10-letnie)",
		color: "bg-orange-300",
		border: "border-orange-200",
	},
	ROS: {
		label: "ROS (6-letnie)",
		color: "bg-pink-400", // Różowy/Karmazynowy dla ROS
		border: "border-pink-200",
	},
	COI: {
		label: "COI (4-letnie)",
		color: "bg-emerald-300",
		border: "border-emerald-200",
	},
	DOS: {
		label: "DOS (2-letnie)",
		color: "bg-blue-300",
		border: "border-blue-200",
	},
	OTS: {
		label: "OTS (3-miesięczne)",
		color: "bg-slate-300",
		border: "border-slate-200",
	},
};
export const BOND_TEMPLATES = {
	ROD: {
		label: "ROD (12-letnie Rodzinne)",
		duration: 12,
		rateType: "VARIABLE",
	},
	EDO: { label: "EDO (10-letnie)", duration: 10, rateType: "VARIABLE" },
	ROS: { label: "ROS (6-letnie Rodzinne)", duration: 6, rateType: "VARIABLE" },
	COI: { label: "COI (4-letnie)", duration: 4, rateType: "VARIABLE" },
	DOS: { label: "DOS (2-letnie)", duration: 2, rateType: "FIXED" },
	OTS: { label: "OTS (3-miesięczne)", duration: 0.25, rateType: "FIXED" },
};
//NOTE: FIXED (Stałe): Odsetki proste (np. OTS) lub proste z wypłatą. VARIABLE/INDEXED (Zmienne/Indeksowane): Kapitalizacja roczna (EDO, COI, ROD).

export const STRATEGIES = {
	classic: {
		data: classicPortfolio,
		title: "Klasyczny 60/40",
		slogan: "Fundament zrównoważonego portfela",
		description:
			"Najprostszy sposób na balans między zyskiem a bezpieczeństwem.",
		icon: Scale,
		color: "text-blue-500",
		bgColor: "bg-blue-500/10",
		risk: "Średnie",
		advantage: "Łatwy rebalancing",
	},
	dalio: {
		data: allWeatherPortfolio,
		title: "Ray Dalio - All Weather",
		slogan: "Bezpieczeństwo w każdą pogodę",
		description: "Zaprojektowany, by zarabiać niezależnie od stanu gospodarki.",
		icon: CloudSun,
		color: "text-emerald-500",
		bgColor: "bg-emerald-500/10",
		risk: "Niskie / Średnie",
		advantage: "Odporność na kryzysy",
	},
	yale: {
		data: yalePortfolio,
		title: "Model Yale (Swensen)",
		slogan: "Dywersyfikacja klasy premium",
		description: "Wykorzystuje potencjał nieruchomości i rynków wschodzących.",
		icon: GraduationCap,
		color: "text-amber-500",
		bgColor: "bg-amber-500/10",
		risk: "Średnie / Wysokie",
		advantage: "Wysoki potencjał wzrostu",
	},
};
