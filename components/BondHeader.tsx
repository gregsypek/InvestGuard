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
	stats: BondHeaderStats; // Zostawiamy dla wstecznej kompatybilności, ale nie używamy do obliczeń!
	customBreadcrumbs?: React.ReactNode;
	backHref?: string;
	bonds?: any[];
}

// 🚀 FUNKCJA POMOCNICZA: Odcina cyfry, zostawia same litery (np. EDO0635 -> EDO)
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

	// 🚀 ZMIANA: Wyłuskujemy tylko zgruopowane typy (EDO, DOS, itp.)
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

	// 🚀 ZMIANA: Zawsze liczymy z czystych liczb (tablica bonds), by uniknąć problemu z NaN ze stringów 'stats'
	const dynamicStats = useMemo(() => {
		// Używamy getBaseTicker do filtrowania, żeby łapało wszystkie serie danego typu!
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
		<header className="relative overflow-hidden flex flex-col gap-6 md:gap-6 -mx-3 md:-mx-10 px-3 md:px-10 bg-slate-950 bg-gradient-to-r from-theme-primary/20 dark:from-theme-primary/10 via-slate-900 to-slate-950 text-slate-100 py-3 md:py-6 border-b border-white/10 dark:border-t-border rounded-b-2xl transition-colors shadow-lg">
			<div
				className="absolute inset-0 z-0 pointer-events-none opacity-40 dark:opacity-30 transition-opacity"
				style={{
					backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg stroke='%2310b981' stroke-width='1.5' stroke-opacity='0.4'%3E%3Cline x1='15' y1='20' x2='15' y2='60'/%3E%3Crect x='11' y='30' width='8' height='20' fill='%2310b981' fill-opacity='0.3'/%3E%3Cline x1='35' y1='40' x2='35' y2='80'/%3E%3Crect x='31' y='50' width='8' height='15' fill='none'/%3E%3Cline x1='55' y1='10' x2='55' y2='45'/%3E%3Crect x='51' y='15' width='8' height='25' fill='%2310b981' fill-opacity='0.6'/%3E%3Cline x1='75' y1='30' x2='75' y2='70'/%3E%3Crect x='71' y='45' width='8' height='10' fill='none'/%3E%3Cline x1='95' y1='50' x2='95' y2='90'/%3E%3Crect x='91' y='60' width='8' height='25' fill='%2310b981' fill-opacity='0.2'/%3E%3C/g%3E%3C/svg%3E")`,
					WebkitMaskImage:
						"radial-gradient(circle at 95% 2%, black 0%, transparent 20%)",
					maskImage:
						"radial-gradient(circle at 90% 2%, black 5%, transparent 20%)",
				}}
			/>

			<div className="relative z-10 flex flex-col gap-2">
				{customBreadcrumbs || (
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
				)}

				<div className="mt-1 sm:mt-2">
					<h1 className="text-2xl sm:text-3xl md:text-4xl font-black  uppercase flex items-center gap-3 drop-shadow-sm text-white">
						{title}
					</h1>
					<p className="text-slate-400 font-medium mt-1 text-[11px] sm:text-sm md:text-base leading-tight flex items-center gap-1.5">
						<ShieldCheck className="h-3.5 w-3.5 text-theme-primary" />
						<span>Bezpieczny kapitał i ochrona przed inflacją.</span>
					</p>
				</div>

				{/* PASEK WYBORU PODGLĄDU RODZAJU OBLIGACJI */}
				{availableTypes.length > 0 && (
					<div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-3 sm:mt-4 p-3 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm shadow-inner w-full min-w-0 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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
										label={ticker} // Teraz pokaże tylko "EDO", "DOS" itp.
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
					</div>
				)}
			</div>

			<div className="relative z-10 flex flex-col xl:flex-row items-start xl:items-end justify-between gap-4 md:gap-6 pb-1">
				<div className="space-y-1 w-full xl:w-auto shrink-0">
					<div className="flex items-center gap-1.5 text-slate-400 font-bold tracking-widest text-[9px] sm:text-[10px] uppercase mb-1">
						<Banknote className="w-3.5 h-3.5 text-slate-300" />
						<span>
							Wycena (
							{selectedTypes.includes("ALL")
								? "Całość"
								: selectedTypes.join(", ")}
							)
						</span>
					</div>
					<div className="flex items-baseline gap-1.5 sm:gap-2">
						<h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-white drop-shadow-sm truncate">
							{formatCurrency(dynamicStats.currentValue)}
						</h2>
						<span className="text-lg sm:text-xl md:text-2xl text-slate-500 font-bold uppercase">
							PLN
						</span>
					</div>
				</div>

				<div className="flex flex-wrap xl:justify-end gap-4 sm:gap-6 md:gap-10 w-full xl:w-auto mt-4 xl:mt-0">
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
				</div>
			</div>
		</header>
	);
}
