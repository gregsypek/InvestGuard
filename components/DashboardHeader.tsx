"use client";

import {
	ArrowLeft,
	ChevronLeft,
	Container,
	Settings,
	Wallet2,
	Wrench,
} from "lucide-react";

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
	const isSettingsPage = pathname.endsWith("/settings");
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
		<div className="flex items-center gap-2 mb-2 ">
			{portfolio ? (
				<Link href={`/dashboard/${portfolio?.id}`}>
					{/* Użycie mocniejszego blue dla lepszego kontrastu w trybie jasnym na ciemnym granacie */}
					<ChevronLeft className="h-4 w-4 text-blue-400 hover:scale-110 transition-transform" />
				</Link>
			) : (
				<Link href="/dashboard">
					<ChevronLeft className="h-4 w-4 text-blue-400" />
				</Link>
			)}
			<nav className="text-sm text-slate-400 italic">
				Panel Główny / {portfolio?.name.toLocaleLowerCase() || "Ładowanie..."} /
				Dodaj aktywo
			</nav>
		</div>
	) : null;

	return (
		// ZMIANA: W dzień głęboki granat (slate-950), w nocy pełna węglowa czerń z systemu (t-bg-base)
		<header className="relative overflow-hidden flex flex-col gap-8 w-full bg-slate-900  text-slate-100 p-6 md:p-8 border-b border-white/10 dark:border-t-border rounded-b-2xl transition-colors">
			{/* --- TEKSTURA SVG (Giełdowe Świece Japońskie z płynnym maskowaniem) --- */}
			<div
				className="absolute inset-0 z-0 pointer-events-none opacity-40 dark:opacity-30 transition-opacity"
				style={{
					// Unikalny, ręcznie napisany wzór SVG z japońskimi świecami
					backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg stroke='%2310b981' stroke-width='1.5' stroke-opacity='0.4'%3E%3Cline x1='15' y1='20' x2='15' y2='60'/%3E%3Crect x='11' y='30' width='8' height='20' fill='%2310b981' fill-opacity='0.3'/%3E%3Cline x1='35' y1='40' x2='35' y2='80'/%3E%3Crect x='31' y='50' width='8' height='15' fill='none'/%3E%3Cline x1='55' y1='10' x2='55' y2='45'/%3E%3Crect x='51' y='15' width='8' height='25' fill='%233b82f6' fill-opacity='0.6'/%3E%3Cline x1='75' y1='30' x2='75' y2='70'/%3E%3Crect x='71' y='45' width='8' height='10' fill='none'/%3E%3Cline x1='95' y1='50' x2='95' y2='90'/%3E%3Crect x='91' y='60' width='8' height='25' fill='%233b82f6' fill-opacity='0.2'/%3E%3C/g%3E%3C/svg%3E")`,

					// Maska w kształcie "reflektora" rzucającego światło w prawy górny róg.
					// Od 0% (pełna widoczność) rozmywa się łagodnie aż do 60% (całkowita przezroczystość).
					WebkitMaskImage:
						"radial-gradient(circle at 95% 2%, black 0%, transparent 20%)",
					maskImage:
						"radial-gradient(circle at 90% 2%, black 5%, transparent 20%)",
				}}
			/>

			{/* GÓRA: Zawsze widoczna */}
			<div className="relative z-10">
				{customBreadcrumbs || defaultBreadcrumbs}

				{/* Kontener flex, który rozsuwa tytuł i przycisk na boki */}
				<div className="mt-2 flex items-start justify-between gap-4">
					<div>
						<h1 className="text-3xl md:text-4xl font-black tracking-tighter lowercase flex items-center gap-3 drop-shadow-sm text-white">
							{name}
						</h1>
						<p className="text-slate-400 font-medium mt-1 text-sm md:text-base">
							{isAddAssetPage
								? "Zarządzaj składem swojego portfela"
								: "Zarządzaj portfelem i kontroluj strategie"}
						</p>
					</div>

					{/* === PORTFOLIO MANAGEMENT BUTTON === */}
					{!isAddAssetPage && portfolio.id && (
						<Link
							// EN: If on settings page, clicking goes back to dashboard. Otherwise, go to settings.
							href={
								isSettingsPage
									? `/dashboard/${portfolio.id}`
									: `/dashboard/${portfolio.id}/settings`
							}
							className={cn(
								"group flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 shadow-sm border",
								isSettingsPage
									? // EN: Neutral style for "Go Back" action
										"bg-slate-800/40 hover:bg-slate-700/60 border-slate-700/50 text-slate-300 hover:text-white"
									: // EN: Highlighted style for "Manage" action
										"bg-blue-900/20 hover:bg-blue-800/40 border-blue-500/30 hover:border-blue-400/60 text-blue-400 hover:text-blue-300",
							)}
						>
							{isSettingsPage ? (
								// EN: Arrow left when acting as a return button
								<ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
							) : (
								// EN: Wrench when acting as the entry to management
								<Wrench className="w-4 h-4 group-hover:-rotate-12 transition-transform duration-300" />
							)}

							<span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest">
								{isSettingsPage ? "Powrót" : "Zarządzanie"}
							</span>
						</Link>
					)}
				</div>
			</div>

			{/* DÓŁ: Statystyki */}
			<div className="relative z-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-8 pb-2 md:pb-0">
				{/* OGROMNA Całkowita Wartość - WYRÓŻNIONA */}
				<div className="space-y-1">
					<div className="flex items-center gap-1.5 text-slate-400 font-bold tracking-widest text-[10px] uppercase mb-1">
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
									"text-xl font-bold tracking-tight transition-colors",
									totalProfitAmount > 0
										? // Nawet w trybie "jasnym" tło headera jest bardzo ciemne, więc możemy zachować tu neonowe akcenty!
											"text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]"
										: totalProfitAmount < 0
											? "text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]"
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
									"flex items-center text-xs font-bold px-2 py-0.5 rounded-sm transition-colors",
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
		</header>
	);
};
