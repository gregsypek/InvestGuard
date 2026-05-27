"use client";

import { ChevronLeft, Container, Wallet2 } from "lucide-react";

import Link from "next/link";
import { PortfolioWithAssets } from "@/lib/types";
import { ValueCard } from "./shared/ValueCard";
import { calculateAssetPL } from "@/lib/calculations";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { usePathname } from "next/navigation";

type Props = {
	portfolio: PortfolioWithAssets;
	name: string;
	totalValue: number;
	customBreadcrumbs?: React.ReactNode; // Tu wstrzykniemy Twój kod
	userName?: string | null; // EN: New prop for the user's name
};
export const DashboardHeader = ({
	portfolio,
	name,
	customBreadcrumbs,
}: Props) => {
	const pathname = usePathname(); // EN: Get current URL path
	// EN: Check if we are currently on the add-asset subpage
	const isAddAssetPage = pathname.endsWith("/add-asset");
	// 1. Hooki (zawsze na górze)
	const assets = useMemo(() => portfolio?.assets || [], [portfolio?.assets]);
	const assetsWithPL = useMemo(() => {
		return assets.map((asset) => {
			const { profitAmount, profitPercent } = calculateAssetPL(asset);
			return { ...asset, profitAmount, profitPercent };
		});
	}, [assets]);

	const totalPortfolioValue = useMemo(
		() => assets.reduce((sum, asset) => sum + asset.currentValue, 0),
		[assets],
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

	// --- LOGIKA RENDEROWANIA ---

	// Zmienna pomocnicza, by sprawdzić czy mamy już dane do statystyk
	// const isLoading = !portfolio || !portfolio.assets;

	// EN: Define default breadcrumbs based on current route
	const defaultBreadcrumbs = isAddAssetPage ? (
		<div className="flex items-center gap-2 mb-2">
			{/* DODAJEMY portfolio?.id (pytajnik) oraz sprawdzenie czy portfolio istnieje */}
			{portfolio ? (
				<Link href={`/dashboard/${portfolio?.id}`}>
					<ChevronLeft className="h-4 w-4 text-primary hover:scale-110 transition-transform" />
				</Link>
			) : (
				// Fallback, gdy portfolio jeszcze się ładuje lub nie zostało znalezione
				<Link href="/dashboard">
					<ChevronLeft className="h-4 w-4 text-primary" />
				</Link>
			)}
			<nav className="text-sm text-muted-foreground italic">
				Panel Główny / {portfolio?.name.toLocaleLowerCase() || "Ładowanie..."} /
				Dodaj aktywo
			</nav>
		</div>
	) : null;

	return (
		// ZMIANA: Głębokie, ciemne tło całego nagłówka bez bocznych marginesów
		<header className="flex flex-col gap-8 w-full bg-[#0a0e17] text-white p-6 md:p-8 border-b border-white/5 rounded-b-2xl md:rounded-none">
			{/* GÓRA: Zawsze widoczna (Breadcrumbs i Tytuł) */}
			<div>
				{customBreadcrumbs || defaultBreadcrumbs}
				<div className="mt-2">
					<h1 className="text-3xl md:text-4xl font-black tracking-tighter lowercase flex items-center gap-3 drop-shadow-sm text-white">
						{name}
					</h1>
					<p className="text-slate-500 font-medium mt-1 text-sm md:text-base">
						{isAddAssetPage
							? "Zarządzaj składem swojego portfela"
							: "Zarządzaj portfelem i kontroluj strategie"}
					</p>
				</div>
			</div>

			{/* DÓŁ: Statystyki (Premium Trading Style) */}
			<div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8 pb-2 md:pb-0">
				{/* OGROMNA Całkowita Wartość - WYRÓŻNIONA */}
				<div className="space-y-1">
					<div className="flex items-center gap-1.5 text-slate-500 font-bold tracking-widest text-[10px] uppercase mb-1">
						<Wallet2 className="w-3.5 h-3.5" />
						<span>Całkowita Wartość</span>
					</div>
					<div className="flex items-baseline gap-2">
						<h2 className="text-5xl md:text-6xl font-black tracking-tighter text-white drop-shadow-sm">
							{totalPortfolioValue.toLocaleString("pl-PL", {
								minimumFractionDigits: 2,
								maximumFractionDigits: 2,
							})}
						</h2>
						<span className="text-xl md:text-2xl text-slate-500 font-bold">
							PLN
						</span>
					</div>
				</div>

				{/* PRAWA STRONA: Mniejsze statystyki z neonowymi akcentami */}
				<div className="flex self-start sm:justify-end flex-wrap gap-8 md:gap-12 overflow-x-auto no-scrollbar">
					{/* Kapitał */}
					<ValueCard
						label="Zainwestowany kapitał"
						icon={Container}
						value={totalInvestedCapital}
						formatString
						suffix="PLN"
					/>

					{/* P&L */}
					<ValueCard label="Całkowity Wynik (P&L)">
						<div className="flex items-center gap-2 font-mono">
							<span
								className={cn(
									"text-xl font-bold tracking-tight",
									totalProfitAmount > 0
										? "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]"
										: totalProfitAmount < 0
											? "text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]"
											: "text-slate-400",
								)}
							>
								{totalProfitAmount > 0 ? "+" : ""}
								{totalProfitAmount.toLocaleString("pl-PL", {
									minimumFractionDigits: 2,
								})}
							</span>
							<span
								className={cn(
									"flex items-center text-xs font-bold px-2 py-0.5 rounded-sm",
									totalProfitPercent > 0
										? "bg-emerald-500/10 text-emerald-400"
										: totalProfitPercent < 0
											? "bg-rose-500/10 text-rose-500"
											: "bg-slate-800 text-slate-400",
								)}
							>
								{totalProfitPercent > 0 ? "+" : ""}
								{totalProfitPercent.toFixed(2)}%
							</span>
						</div>
					</ValueCard>
				</div>
			</div>
		</header>
	);
};
