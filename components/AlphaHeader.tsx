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

import { AppHeaderLayout } from "./shared/AppHeaderLayout";
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
		<AppHeaderLayout
			breadcrumbs={
				<nav className="text-[10px] sm:text-xs md:text-sm text-slate-400 italic flex items-center gap-1.5">
					Narzędzia /{" "}
					<span className="text-theme-primary font-medium lowercase">
						Alpha
					</span>
				</nav>
			}
			title="Selekcja Alpha"
			description="Skoncentrowane analizy dla kapitału o podwyższonym profilu ryzyka."
			filters={
				showPills && (
					<>
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
					</>
				)
			}
			mainStatLabel={
				<>
					<Rocket className="w-3.5 h-3.5" />
					<span>
						Wycena (
						{filterMode === "ALL"
							? "Całość"
							: filterMode === "STOCKS"
								? "Akcje"
								: "Krypto"}
						)
					</span>
				</>
			}
			mainStatValue={formatCurrency(alphaTotalValue)}
			mainStatSuffix="PLN"
			secondaryStats={
				<>
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
				</>
			}
		/>
	);
}
