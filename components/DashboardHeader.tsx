"use client";

import {
	ArrowLeft,
	ChevronLeft,
	Container,
	Filter,
	Wallet2,
	Wrench,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { AppHeaderLayout } from "./shared/AppHeaderLayout"; // Nasz nowy Wrapper
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

	const breadcrumbs = customBreadcrumbs || defaultBreadcrumbs;

	return (
		<AppHeaderLayout
			title={name}
			breadcrumbs={breadcrumbs}
			description={
				isAddAssetPage
					? "Zarządzaj składem swojego portfela"
					: isSettingsPage
						? "Zarządzaj technicznymi aspektami portfela"
						: "Zarządzaj portfelem i kontroluj strategie"
			}
			actions={
				!isAddAssetPage &&
				portfolio.id && (
					<Link
						href={
							isSettingsPage
								? `/dashboard/${portfolio.id}`
								: `/dashboard/${portfolio.id}/settings?from=dashboard`
						}
						className={cn(
							"group flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl transition-all duration-300 shadow-sm border",
							isSettingsPage
								? "bg-t-bg-base border-t-border text-t-text-secondary hover:text-t-text-primary"
								: "bg-theme-soft hover:opacity-80 border-theme-border text-theme-primary",
						)}
					>
						{isSettingsPage ? (
							<ArrowLeft className="w-4 h-4" />
						) : (
							<Wrench className="w-4 h-4" />
						)}
						<span className="hidden sm:inline text-[10px] sm:text-xs font-bold uppercase tracking-widest">
							{isSettingsPage ? "Powrót" : "Zarządzanie"}
						</span>
					</Link>
				)
			}
			filters={
				!hideStats &&
				!isAddAssetPage &&
				!isSettingsPage &&
				availableCategories.length > 0 && (
					<>
						<span className="sticky left-0 w-max flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold text-theme-primary uppercase tracking-widest shrink-0">
							<Filter className="w-3 h-3  " /> Wycena dla:
						</span>
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
							})}{" "}
						</div>
					</>
				)
			}
			mainStatLabel={
				<>
					<Wallet2 className="w-3.5 h-3.5" />
					<span>
						{selectedCategories.includes("ALL")
							? "Całkowita Wartość"
							: "Wartość Zaznaczonych"}
					</span>
				</>
			}
			mainStatValue={formatCurrency(totalPortfolioValue)}
			secondaryStats={
				!hideStats && (
					<>
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
							</div>{" "}
						</ValueCard>
					</>
				)
			}
		/>
	);
};
