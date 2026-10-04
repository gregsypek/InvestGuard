"use client";

import {
	ArrowLeft,
	ChevronLeft,
	Container,
	Filter,
	Settings,
	Wallet2,
	Wrench,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { FilterBadge } from "./shared/FilterBadge";
import Link from "next/link";
import { PortfolioWithAssets } from "@/lib/types";
import { ValueCard } from "./shared/ValueCard";
import { calculateAssetPL } from "@/lib/calculations";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/format-currency";
import { usePathname } from "next/navigation";

// Słownik kategorii zgodny z Prisma Schema 'enum Category'
const ASSET_TYPE_MAP: Record<string, string> = {
	BONDS: "Obligacje",
	DEVELOPED: "Rynki Rozwinięte",
	EMERGING: "Rynki Wschodzące",
	GOLD: "Złoto",
	BOOSTER: "Booster",
	CASH: "Gotówka",
	CRYPTO: "Kryptowaluty",
	COMMODITIES: "Surowce",
	REAL_ESTATE: "Nieruchomości",
	CUSTOM: "Aktywa Alternatywne",
	UNKNOWN: "Inne",
};

type Props = {
	portfolio: PortfolioWithAssets;
	name: string;
	totalValue: number;
	customBreadcrumbs?: React.ReactNode;
	userName?: string | null;
	hideStats?: boolean;
};

export const DashboardHeader = ({
	portfolio,
	name,
	customBreadcrumbs,
	hideStats = false,
}: Props) => {
	const pathname = usePathname();
	const isAddAssetPage = pathname.endsWith("/add-asset");
	const isSettingsPage = pathname.endsWith("/settings");

	// Stabilna referencja do aktywów (rozwiązuje błąd React Compiler)
	const assets = useMemo(() => {
		return portfolio && Array.isArray(portfolio.assets) ? portfolio.assets : [];
	}, [portfolio]);

	// --- STAN I LOGIKA FILTRÓW KATEGORII ---
	const [selectedCategories, setSelectedCategories] = useState<string[]>([
		"ALL",
	]);

	const toggleCategory = useCallback((id: string) => {
		setSelectedCategories((prev) => {
			if (id === "ALL") return ["ALL"];
			const next = prev.filter((c) => c !== "ALL");
			if (next.includes(id)) {
				const filtered = next.filter((c) => c !== id);
				return filtered.length === 0 ? ["ALL"] : filtered;
			}
			return [...next, id];
		});
	}, []);

	// Unikalne kategorie obecne w tym portfelu
	const availableCategories = useMemo(() => {
		if (assets.length === 0) return [];
		const types = new Set(
			assets.map((a: any) => a.category || a.type || a.assetType),
		);
		return Array.from(types).filter(Boolean) as string[];
	}, [assets]);

	// Filtrowanie aktywów w locie
	const filteredAssets = useMemo(() => {
		if (assets.length === 0) return [];
		if (selectedCategories.includes("ALL")) return assets;
		return assets.filter((asset: any) => {
			const cat = asset.category || asset.type || asset.assetType;
			return selectedCategories.includes(cat);
		});
	}, [assets, selectedCategories]);

	// Przeliczanie statystyk
	const assetsWithPL = useMemo(() => {
		return filteredAssets.map((asset) => {
			const { profitAmount, profitPercent } = calculateAssetPL(asset);
			return { ...asset, profitAmount, profitPercent };
		});
	}, [filteredAssets]);

	const totalPortfolioValue = useMemo(
		() => filteredAssets.reduce((sum, asset) => sum + asset.currentValue, 0),
		[filteredAssets],
	);

	const totalInvestedCapital = useMemo(
		() => assetsWithPL.reduce((sum, asset) => sum + asset.investedCapital, 0),
		[assetsWithPL],
	);

	const totalProfitAmount = useMemo(
		() => assetsWithPL.reduce((sum, asset) => sum + asset.profitAmount, 0),
		[assetsWithPL],
	);

	const totalProfitPercent = useMemo(() => {
		if (totalInvestedCapital === 0) return 0;
		return (totalProfitAmount / totalInvestedCapital) * 100;
	}, [totalProfitAmount, totalInvestedCapital]);

	const defaultBreadcrumbs = isAddAssetPage ? (
		<div className="flex items-center gap-2 mb-2">
			{portfolio ? (
				<Link href={`/dashboard/${portfolio?.id}`}>
					<ChevronLeft className="h-4 w-4 text-blue-400 hover:scale-110 transition-transform" />
				</Link>
			) : (
				<Link href="/dashboard">
					<ChevronLeft className="h-4 w-4 text-blue-400" />
				</Link>
			)}
			<nav className="text-[10px] sm:text-xs md:text-sm text-slate-400 italic">
				Panel Główny / {portfolio?.name.toLocaleLowerCase() || "Ładowanie..."} /
				Dodaj aktywo
			</nav>
		</div>
	) : null;

	return (
		<header className="relative overflow-hidden flex flex-col gap-6 md:gap-6 -mx-3 md:-mx-10 px-3 md:px-10 bg-slate-950 bg-gradient-to-r from-theme-primary/20 dark:from-theme-primary/10 via-slate-900 to-slate-950 text-slate-100 py-3 md:py-6 border-b border-white/10 dark:border-t-border rounded-b-2xl transition-colors shadow-lg">
			{/* --- TEKSTURA SVG --- */}
			<div
				className="absolute inset-0 z-0 pointer-events-none opacity-40 dark:opacity-30 transition-opacity"
				style={{
					backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg stroke='%2310b981' stroke-width='1.5' stroke-opacity='0.4'%3E%3Cline x1='15' y1='20' x2='15' y2='60'/%3E%3Crect x='11' y='30' width='8' height='20' fill='%2310b981' fill-opacity='0.3'/%3E%3Cline x1='35' y1='40' x2='35' y2='80'/%3E%3Crect x='31' y='50' width='8' height='15' fill='none'/%3E%3Cline x1='55' y1='10' x2='55' y2='45'/%3E%3Crect x='51' y='15' width='8' height='25' fill='%233b82f6' fill-opacity='0.6'/%3E%3Cline x1='75' y1='30' x2='75' y2='70'/%3E%3Crect x='71' y='45' width='8' height='10' fill='none'/%3E%3Cline x1='95' y1='50' x2='95' y2='90'/%3E%3Crect x='91' y='60' width='8' height='25' fill='%233b82f6' fill-opacity='0.2'/%3E%3C/g%3E%3C/svg%3E")`,
					WebkitMaskImage:
						"radial-gradient(circle at 95% 2%, black 0%, transparent 20%)",
					maskImage:
						"radial-gradient(circle at 90% 2%, black 5%, transparent 20%)",
				}}
			/>

			{/* GÓRA: Tytuł i przyciski */}
			<div className="relative z-10 flex flex-col gap-2">
				{customBreadcrumbs || defaultBreadcrumbs}

				<div className="flex items-start justify-between gap-4">
					<div className="flex-1">
						<h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter lowercase flex items-center gap-3 drop-shadow-sm text-white">
							{name}
						</h1>
						<p className="text-slate-400 font-medium mt-1 text-[11px] sm:text-sm md:text-base leading-tight">
							{isAddAssetPage
								? "Zarządzaj składem swojego portfela"
								: isSettingsPage
									? "Zarządzaj technicznymi aspektami portfela"
									: "Zarządzaj portfelem i kontroluj strategie"}
						</p>
					</div>

					{!isAddAssetPage && portfolio.id && (
						<Link
							href={
								isSettingsPage
									? `/dashboard/${portfolio.id}`
									: `/dashboard/${portfolio.id}/settings?from=dashboard`
							}
							className={cn(
								"group shrink-0 flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl transition-all duration-300 shadow-sm border",
								isSettingsPage
									? "bg-slate-800/40 hover:bg-slate-700/60 border-slate-700/50 text-slate-300 hover:text-white"
									: "bg-theme-soft hover:opacity-80 border-theme-border text-theme-primary",
							)}
						>
							{isSettingsPage ? (
								<ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
							) : (
								<Wrench className="w-4 h-4 group-hover:-rotate-12 transition-transform duration-300" />
							)}
							<span className="hidden sm:inline text-[10px] sm:text-xs font-bold uppercase tracking-widest">
								{isSettingsPage ? "Powrót" : "Zarządzanie"}
							</span>
						</Link>
					)}
				</div>
				{/* 🚀 NOWOŚĆ: Poziomo przewijany pasek kategorii korzystający z dynamicznych zmiennych motywu */}
				{!hideStats &&
					!isAddAssetPage &&
					!isSettingsPage &&
					availableCategories.length > 0 && (
						//  🚀 ZMIANA 2A: overflow-x-auto i ukrycie scrollbara przeniesione na szarego rodzica
						<div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-3 sm:mt-4 p-3 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm shadow-inner w-full min-w-0 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
							{/* 🚀 ZMIANA 2B: Dodano 'sticky left-0 w-max' aby etykieta stała w miejscu. Zachowano 'text-theme-primary' dla ikony filtra! */}
							<span className="sticky left-0 w-max flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">
								<Filter className="w-3 h-3 text-theme-primary" /> Wycena dla:
							</span>

							{/* 🚀 ZMIANA 2C: Usunięto overflow. Zmieniono szerokość na 'w-max sm:w-full' */}
							<div className="flex gap-1.5 sm:gap-2 flex-nowrap sm:flex-wrap pb-1 sm:pb-0 w-max sm:w-full">
								<FilterBadge
									id="ALL"
									label="Cały Portfel"
									isSelected={selectedCategories.includes("ALL")}
									onToggle={toggleCategory}
									className={cn(
										"py-1 px-2.5 text-[9px] sm:text-[10px] font-bold tracking-widest rounded-lg transition-all shrink-0 border",
										selectedCategories.includes("ALL")
											? "bg-theme-primary text-white border-transparent shadow-sm"
											: "bg-transparent text-slate-300 border-white/20 hover:bg-white/10",
									)}
								/>
								{availableCategories.map((type) => {
									const isSelected = selectedCategories.includes(type);
									return (
										<FilterBadge
											key={type}
											id={type}
											label={ASSET_TYPE_MAP[type] || type}
											isSelected={isSelected}
											onToggle={toggleCategory}
											className={cn(
												"py-1 px-2.5 text-[9px] sm:text-[10px] font-bold tracking-widest rounded-lg transition-all shrink-0 border",
												isSelected
													? "bg-theme-soft text-theme-primary border-theme-border shadow-sm"
													: "bg-transparent text-slate-300 border-white/20 hover:bg-white/10",
											)}
										/>
									);
								})}
							</div>
						</div>
					)}
			</div>

			{/* DÓŁ: Statystyki */}
			{!hideStats && (
				<div className="relative z-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-6 md:gap-8 pb-1">
					<div className="space-y-1 w-full md:w-auto shrink-0">
						<div className="flex items-center gap-1.5 text-slate-400 font-bold tracking-widest text-[9px] sm:text-[10px] uppercase mb-1">
							<Wallet2 className="w-3.5 h-3.5 text-slate-300" />
							<span>
								{selectedCategories.includes("ALL")
									? "Całkowita Wartość"
									: "Wartość Zaznaczonych"}
							</span>
						</div>
						<div className="flex items-baseline gap-1.5 sm:gap-2">
							<h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-white drop-shadow-sm truncate">
								{formatCurrency(totalPortfolioValue)}
							</h2>
							<span className="text-lg sm:text-xl md:text-2xl text-slate-500 font-bold">
								PLN
							</span>
						</div>
					</div>

					<div className="flex self-start sm:justify-end flex-wrap gap-4 sm:gap-6 md:gap-10 w-full md:w-auto">
						<ValueCard
							label="Zainwestowany kapitał"
							icon={Container}
							value={totalInvestedCapital}
							formatString
							suffix="PLN"
						/>
						<ValueCard label="Całkowity Wynik (P&L)">
							<div className="flex items-center gap-2 font-mono">
								<span
									className={cn(
										"text-lg sm:text-xl font-bold tracking-tight transition-colors",
										totalProfitAmount > 0
											? "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]"
											: totalProfitAmount < 0
												? "text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]"
												: "text-slate-400",
									)}
								>
									{totalProfitAmount > 0 ? "+" : ""}
									{formatCurrency(totalProfitAmount)}
								</span>
								<span
									className={cn(
										"flex items-center text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-sm transition-colors",
										totalProfitPercent > 0
											? "bg-emerald-500/10 text-emerald-400"
											: totalProfitPercent < 0
												? "bg-rose-500/10 text-rose-500"
												: "bg-white/10 text-slate-300",
									)}
								>
									{totalProfitPercent > 0 ? "+" : ""}
									{totalProfitPercent.toFixed(2)}%
								</span>
							</div>
						</ValueCard>
					</div>
				</div>
			)}
		</header>
	);
};
