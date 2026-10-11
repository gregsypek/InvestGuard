"use client";

import {
	Banknote,
	ChevronLeft,
	Filter,
	History,
	ShieldCheck,
	TrendingUp,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { AppHeaderLayout } from "./shared/AppHeaderLayout";
import { FilterBadge } from "./shared/FilterBadge";
import Link from "next/link";
import { ValueCard } from "./shared/ValueCard";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/format-currency";

export interface BondHeaderStats {
	totalInvested: string;
	currentValue: string;
	profit: string;
	avgYield: string;
}

interface BondHeaderProps {
	title: string;
	totalBonds: number;
	portfolioName?: string;
	stats: BondHeaderStats;
	customBreadcrumbs?: React.ReactNode;
	backHref?: string;
	bonds?: any[];
}

// Helper function to extract base ticker (e.g., EDO0635 -> EDO)
const getBaseTicker = (ticker?: string) => {
	if (!ticker) return "INNE";
	return ticker.replace(/[^A-Za-z]/g, "").toUpperCase();
};

export function BondHeader({
	title,
	portfolioName,
	customBreadcrumbs,
	backHref,
	bonds = [],
}: BondHeaderProps) {
	const [selectedTypes, setSelectedTypes] = useState<string[]>(["ALL"]);

	const availableTypes = useMemo(() => {
		const types = new Set(
			bonds.map((b) => getBaseTicker(b.ticker)).filter(Boolean),
		);
		return Array.from(types) as string[];
	}, [bonds]);

	const toggleType = useCallback((ticker: string) => {
		setSelectedTypes((prev) => {
			if (ticker === "ALL") return ["ALL"];
			const next = prev.filter((c) => c !== "ALL");
			if (next.includes(ticker)) {
				const filtered = next.filter((c) => c !== ticker);
				return filtered.length === 0 ? ["ALL"] : filtered;
			}
			return [...next, ticker];
		});
	}, []);

	// Always calculate dynamically from the clean array
	const dynamicStats = useMemo(() => {
		const filteredBonds = selectedTypes.includes("ALL")
			? bonds
			: bonds.filter((b) => selectedTypes.includes(getBaseTicker(b.ticker)));

		const currentVal = filteredBonds.reduce(
			(sum, b) => sum + Number(b.currentValue || 0),
			0,
		);
		const invested = filteredBonds.reduce(
			(sum, b) => sum + Number(b.investedCapital || 0),
			0,
		);
		const prof = currentVal - invested;
		const cnt = filteredBonds.reduce(
			(sum, b) => sum + Number(b.quantity || 0),
			0,
		);

		return {
			currentValue: currentVal,
			totalInvested: invested,
			profit: prof,
			count: cnt,
		};
	}, [selectedTypes, bonds]);

	return (
		<AppHeaderLayout
			breadcrumbs={
				customBreadcrumbs || (
					<nav className="flex items-center gap-1.5 text-[10px] sm:text-xs md:text-sm text-slate-400 italic">
						{backHref && (
							<Link
								href={backHref}
								className="inline-flex items-center transition-opacity text-theme-primary hover:opacity-80 cursor-pointer font-medium mr-1"
							>
								<ChevronLeft className="h-4 w-4" />
								<span>Wróć</span>
							</Link>
						)}
						{!backHref && <span>Obligacje</span>}
						<span className="text-slate-500">/</span>
						<span className="text-theme-primary font-medium lowercase">
							{portfolioName}
						</span>
					</nav>
				)
			}
			title={title}
			description={
				<span className="flex items-center gap-1.5">
					<ShieldCheck className="h-3.5 w-3.5 text-theme-primary" />
					<span>Bezpieczny kapitał i ochrona przed inflacją.</span>
				</span>
			}
			filters={
				availableTypes.length > 0 && (
					<>
						<span className="sticky left-0 w-max flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">
							<Filter className="w-3 h-3 text-theme-primary" /> Typ Obligacji:
						</span>

						<div className="flex gap-1.5 sm:gap-2 flex-nowrap sm:flex-wrap pb-1 sm:pb-0 w-max sm:w-full">
							<FilterBadge
								id="ALL"
								label="Wszystkie"
								isSelected={selectedTypes.includes("ALL")}
								onToggle={toggleType}
								className={cn(
									"py-1 px-2.5 text-[9px] sm:text-[10px] font-bold tracking-widest rounded-lg transition-all shrink-0 border",
									selectedTypes.includes("ALL")
										? "bg-theme-primary text-white border-transparent shadow-sm"
										: "bg-transparent text-slate-300 border-white/20 hover:bg-white/10",
								)}
							/>
							{availableTypes.map((ticker) => {
								const isSelected = selectedTypes.includes(ticker);
								return (
									<FilterBadge
										key={ticker}
										id={ticker}
										label={ticker}
										isSelected={isSelected}
										onToggle={toggleType}
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
					</>
				)
			}
			mainStatLabel={
				<>
					<Banknote className="w-3.5 h-3.5" />
					<span>
						Wycena (
						{selectedTypes.includes("ALL")
							? "Całość"
							: selectedTypes.join(", ")}
						)
					</span>
				</>
			}
			mainStatValue={formatCurrency(dynamicStats.currentValue)}
			mainStatSuffix="PLN"
			secondaryStats={
				<>
					<ValueCard
						label="Wkład własny"
						icon={ShieldCheck}
						className="text-white"
					>
						<div className="flex items-baseline gap-1.5 font-mono">
							<span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-200">
								{formatCurrency(dynamicStats.totalInvested)}
							</span>
							<span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest">
								PLN
							</span>
						</div>
					</ValueCard>

					<ValueCard
						label="Zysk (Odsetki)"
						icon={TrendingUp}
						className="text-white"
					>
						<div className="flex items-baseline gap-1.5 font-mono">
							<span className="text-xl sm:text-2xl font-bold tracking-tight text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]">
								+{formatCurrency(dynamicStats.profit)}
							</span>
							<span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest">
								PLN
							</span>
						</div>
					</ValueCard>

					<ValueCard
						label="Aktywne serie"
						icon={History}
						className="text-white"
					>
						<div className="flex items-baseline gap-1.5 font-mono">
							<span className="text-xl sm:text-2xl font-bold tracking-tight text-white">
								{dynamicStats.count}
							</span>
							<span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest">
								szt.
							</span>
						</div>
					</ValueCard>
				</>
			}
		/>
	);
}
