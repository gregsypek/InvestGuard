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
	const isLoading = !portfolio || !portfolio.assets;

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
				Panel Główny / {portfolio?.name || "Ładowanie..."} / Dodaj aktywo
			</nav>
		</div>
	) : null;

	return (
		<header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
			{/* LEWA STRONA: Zawsze widoczna (Breadcrumbs i Tytuł) */}
			<div>
				{/* EN: Use custom breadcrumbs if provided, otherwise use our smart default */}
				{customBreadcrumbs || defaultBreadcrumbs}
				<div>
					<h1 className="text-4xl font-black tracking-tighter lowercase flex items-center gap-3">
						{name}
					</h1>
					<p className="text-muted-foreground font-medium mt-1">
						{isAddAssetPage
							? "Zarządzaj składem swojego portfela"
							: "Zarządzaj portfelem i kontroluj strategie"}
					</p>
				</div>
			</div>

			{/* PRAWA STRONA: Statystyki */}
			<div className="flex items-center justify-end flex-wrap gap-3 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
				{isLoading ? (
					// SZKIELET STATYSTYK
					<>
						<div className="h-12 w-32 bg-muted animate-pulse rounded-xl" />
						<div className="h-12 w-32 bg-muted animate-pulse rounded-xl" />
						<div className="h-12 w-32 bg-muted animate-pulse rounded-xl" />
					</>
				) : (
					// REALNE DANE
					<>
						{/* Całkowita Wartość */}
						<ValueCard
							label="Całkowita Wartość"
							icon={Wallet2}
							value={totalPortfolioValue}
							formatString
							suffix="PLN"
						/>

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
							<div
								className={cn(
									"flex items-baseline gap-2 font-mono font-black",
									totalProfitAmount > 0
										? "text-emerald-500"
										: totalProfitAmount < 0
											? "text-red-500"
											: "text-muted-foreground",
								)}
							>
								<span className="text-md tabular-nums">
									{totalProfitAmount > 0 ? "+" : ""}
									{totalProfitAmount.toLocaleString(undefined, {
										minimumFractionDigits: 2,
									})}
								</span>
								<span className="text-[10px] font-bold">
									({totalProfitPercent > 0 ? "+" : ""}
									{totalProfitPercent.toFixed(2)}%)
								</span>
							</div>
						</ValueCard>
					</>
				)}
			</div>
		</header>
	);
};
