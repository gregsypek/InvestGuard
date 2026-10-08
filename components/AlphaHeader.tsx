"use client";

import {
	Briefcase,
	Filter,
	PieChart,
	Rocket,
	Target,
	TrendingUp,
	Trophy,
} from "lucide-react";
import { useMemo, useState } from "react";

import { FilterBadge } from "./shared/FilterBadge";
import { ValueCard } from "./shared/ValueCard";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/format-currency";

interface AlphaHeaderProps {
	assets: any[];
	globalTotalValue: number;
}

export function AlphaHeader({
	assets = [],
	globalTotalValue = 0,
}: AlphaHeaderProps) {
	const [filterMode, setFilterMode] = useState<"ALL" | "STOCKS" | "CRYPTO">(
		"ALL",
	);

	const isCrypto = (a: any) => a.category === "CRYPTO";
	const isBooster = (a: any) => a.category === "BOOSTER";

	const hasCrypto = assets.some(isCrypto);
	const hasStocks = assets.some(isBooster);
	const showPills = hasCrypto && hasStocks;

	const filteredAssets = useMemo(() => {
		if (filterMode === "ALL") return assets;
		if (filterMode === "CRYPTO") return assets.filter(isCrypto);
		if (filterMode === "STOCKS") return assets.filter(isBooster);
		return assets;
	}, [assets, filterMode]);

	const alphaTotalValue = filteredAssets.reduce(
		(sum, a) => sum + a.currentValue,
		0,
	);
	const alphaTotalInvested = filteredAssets.reduce(
		(sum, a) => sum + a.investedCapital,
		0,
	);
	const realAlphaShare =
		globalTotalValue > 0 ? (alphaTotalValue / globalTotalValue) * 100 : 0;
	const alphaRoi =
		alphaTotalInvested > 0
			? ((alphaTotalValue - alphaTotalInvested) / alphaTotalInvested) * 100
			: 0;

	const activeAssets = filteredAssets.filter((a) => a.quantity > 0);
	const winRate =
		activeAssets.length > 0
			? (activeAssets.filter((a) => a.currentValue > a.investedCapital).length /
					activeAssets.length) *
				100
			: 0;

	const topPerformer = [...activeAssets].sort((a, b) => {
		const roiA =
			a.investedCapital > 0
				? (a.currentValue - a.investedCapital) / a.investedCapital
				: 0;
		const roiB =
			b.investedCapital > 0
				? (b.currentValue - b.investedCapital) / b.investedCapital
				: 0;
		return roiB - roiA;
	})[0];
	const topPerformerRoi =
		topPerformer && topPerformer.investedCapital > 0
			? ((topPerformer.currentValue - topPerformer.investedCapital) /
					topPerformer.investedCapital) *
				100
			: 0;

	return (
		<header className="relative overflow-hidden flex flex-col gap-6 md:gap-6 -mx-3 md:-mx-10 px-3 md:px-10 bg-slate-950 bg-gradient-to-r from-theme-primary/20 dark:from-theme-primary/10 via-slate-900 to-slate-950 text-slate-100 py-3 md:py-6 border-b border-white/10 dark:border-t-border rounded-b-2xl transition-colors shadow-lg">
			{/* --- TEKSTURA SVG --- */}
			<div
				className="absolute inset-0 z-0 pointer-events-none opacity-40 dark:opacity-30 transition-opacity"
				style={{
					backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg stroke='%23f43f5e' stroke-width='1.5' stroke-opacity='0.4'%3E%3Cline x1='15' y1='20' x2='15' y2='60'/%3E%3Crect x='11' y='30' width='8' height='20' fill='%23f43f5e' fill-opacity='0.3'/%3E%3Cline x1='35' y1='40' x2='35' y2='80'/%3E%3Crect x='31' y='50' width='8' height='15' fill='none'/%3E%3Cline x1='55' y1='10' x2='55' y2='45'/%3E%3Crect x='51' y='15' width='8' height='25' fill='%23f43f5e' fill-opacity='0.6'/%3E%3Cline x1='75' y1='30' x2='75' y2='70'/%3E%3Crect x='71' y='45' width='8' height='10' fill='none'/%3E%3Cline x1='95' y1='50' x2='95' y2='90'/%3E%3Crect x='91' y='60' width='8' height='25' fill='%23f43f5e' fill-opacity='0.2'/%3E%3C/g%3E%3C/svg%3E")`,
					WebkitMaskImage:
						"radial-gradient(circle at 95% 2%, black 0%, transparent 20%)",
					maskImage:
						"radial-gradient(circle at 90% 2%, black 5%, transparent 20%)",
				}}
			/>

			<div className="relative z-10 flex flex-col gap-2">
				<nav className="text-[10px] sm:text-xs md:text-sm text-slate-400 italic flex items-center gap-1.5">
					Narzędzia /{" "}
					<span className="text-theme-primary font-medium lowercase">
						Alpha
					</span>
				</nav>
				<div className="mt-1 sm:mt-2">
					<h1 className="text-2xl sm:text-3xl md:text-4xl font-black capitalize  flex items-center gap-3 drop-shadow-sm text-slate-300">
						Selekcja Alpha
					</h1>
					<p className="text-slate-400 font-medium mt-1 text-[11px] sm:text-sm md:text-base leading-tight">
						Skoncentrowane analizy dla kapitału o podwyższonym profilu ryzyka.
					</p>
				</div>

				{/* 🚀 PASEK WYBORU PODGLĄDU W RAMCE */}
				{showPills && (
					<div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-3 sm:mt-4 p-3 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm shadow-inner w-full min-w-0 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
						<span className="sticky left-0 w-max flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">
							<Filter className="w-3 h-3 text-theme-primary" /> Podgląd
							wskaźników:
						</span>

						<div className="flex gap-1.5 sm:gap-2 flex-nowrap sm:flex-wrap pb-1 sm:pb-0 w-max sm:w-full">
							<FilterBadge
								id="ALL"
								label="Cały Booster"
								isSelected={filterMode === "ALL"}
								onToggle={() => setFilterMode("ALL")}
								className={cn(
									"py-1 px-2.5 text-[9px] sm:text-[10px] font-bold tracking-widest rounded-lg transition-all shrink-0 border",
									filterMode === "ALL"
										? "bg-theme-primary text-white border-transparent shadow-sm"
										: "bg-transparent text-slate-300 border-white/20 hover:bg-white/10",
								)}
							/>
							<FilterBadge
								id="STOCKS"
								label="Tylko Akcje"
								isSelected={filterMode === "STOCKS"}
								onToggle={() => setFilterMode("STOCKS")}
								className={cn(
									"py-1 px-2.5 text-[9px] sm:text-[10px] font-bold tracking-widest rounded-lg transition-all shrink-0 border",
									filterMode === "STOCKS"
										? "bg-theme-primary text-white border-transparent shadow-sm"
										: "bg-transparent text-slate-300 border-white/20 hover:bg-white/10",
								)}
							/>
							<FilterBadge
								id="CRYPTO"
								label="Kryptowaluty"
								isSelected={filterMode === "CRYPTO"}
								onToggle={() => setFilterMode("CRYPTO")}
								className={cn(
									"py-1 px-2.5 text-[9px] sm:text-[10px] font-bold tracking-widest rounded-lg transition-all shrink-0 border",
									filterMode === "CRYPTO"
										? "bg-theme-primary text-white border-transparent shadow-sm"
										: "bg-transparent text-slate-300 border-white/20 hover:bg-white/10",
								)}
							/>
						</div>
					</div>
				)}
			</div>

			<div className="relative z-10 flex flex-col xl:flex-row items-start xl:items-end justify-between gap-4 md:gap-6 pb-1">
				<div className="space-y-1 w-full xl:w-auto shrink-0">
					<div className="flex items-center gap-1.5 text-slate-400 font-bold tracking-widest text-[9px] sm:text-[10px] uppercase mb-1">
						<Rocket className="w-3.5 h-3.5 text-slate-300" />
						<span>
							Wycena (
							{filterMode === "ALL"
								? "Całość"
								: filterMode === "STOCKS"
									? "Akcje"
									: "Krypto"}
							)
						</span>
					</div>
					<div className="flex items-baseline gap-1.5 sm:gap-2">
						<h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-white drop-shadow-sm truncate">
							{formatCurrency(alphaTotalValue)}
						</h2>
						<span className="text-lg sm:text-xl md:text-2xl text-slate-500 font-bold uppercase">
							PLN
						</span>
					</div>
				</div>

				<div className="flex flex-wrap xl:justify-end gap-4 sm:gap-6 md:gap-10 w-full xl:w-auto mt-4 xl:mt-0">
					<ValueCard
						label="Cały Portfel"
						icon={Briefcase}
						className="text-white"
					>
						<div className="flex items-baseline gap-1.5 font-mono">
							<span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-200">
								{formatCurrency(globalTotalValue, 0)}
							</span>
							<span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest">
								PLN
							</span>
						</div>
					</ValueCard>

					<ValueCard
						label="Udział w całości"
						icon={PieChart}
						className="text-white"
					>
						<div className="flex items-baseline gap-1.5 font-mono">
							<span
								className={cn(
									"text-xl sm:text-2xl font-bold tracking-tight",
									realAlphaShare > 10 ? "text-amber-400" : "text-rose-400",
								)}
							>
								{realAlphaShare.toFixed(2)}
							</span>
							<span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest">
								%
							</span>
						</div>
					</ValueCard>

					<ValueCard
						label="Wynik Alpha (ROI)"
						icon={TrendingUp}
						className="text-white"
					>
						<div className="flex items-baseline gap-1.5 font-mono">
							<span
								className={cn(
									"text-xl sm:text-2xl font-bold tracking-tight",
									alphaRoi >= 0 ? "text-emerald-400" : "text-rose-500",
								)}
							>
								{alphaRoi >= 0 ? "+" : ""}
								{alphaRoi.toFixed(2)}
							</span>
							<span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest">
								%
							</span>
						</div>
					</ValueCard>

					<ValueCard label="Win Rate" icon={Target} className="text-white">
						<div className="flex items-baseline gap-1.5 font-mono">
							<span
								className={cn(
									"text-xl sm:text-2xl font-bold tracking-tight",
									winRate >= 50 ? "text-blue-400" : "text-amber-400",
								)}
							>
								{winRate.toFixed(1)}
							</span>
							<span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest">
								%
							</span>
						</div>
					</ValueCard>

					<ValueCard label="Top Performer" icon={Trophy} className="text-white">
						<div className="flex flex-col items-start justify-center h-full">
							<span className="text-[11px] sm:text-sm font-bold tracking-tight text-white uppercase truncate max-w-[100px] sm:max-w-[120px]">
								{topPerformer?.name || "Brak"}
							</span>
							<span
								className={cn(
									"text-[9px] sm:text-[10px] font-mono font-bold",
									topPerformerRoi >= 0 ? "text-emerald-400" : "text-rose-400",
								)}
							>
								{topPerformerRoi >= 0 ? "+" : ""}
								{topPerformerRoi.toFixed(1)}%
							</span>
						</div>
					</ValueCard>
				</div>
			</div>
		</header>
	);
}
