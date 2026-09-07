"use client";

import { Maximize2, Minimize2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { DatePickerWithRange } from "../shared/DatePickerWithRange";
import { FilterBadge } from "../shared/FilterBadge";
import { PortfolioWithAssets } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useChartContext } from "../providers/ChartProvider"; // Dopasuj ścieżkę

const TIME_RANGES = ["1W", "1M", "3M", "YTD", "1Y", "3Y", "5Y", "MAX"];

interface GlobalFiltersBarProps {
	portfolios: PortfolioWithAssets[];
	totalCurrent?: number;
	totalPnLPct?: number;
	disabledRanges?: string[]; // Opcjonalnie przekazujemy zablokowane zakresy z zewnątrz
	isSticky?: boolean;
}

export function GlobalFiltersBar({
	portfolios,
	totalCurrent = 0,
	totalPnLPct = 0,
	disabledRanges = [],
	isSticky = true,
}: GlobalFiltersBarProps) {
	// 1. Fetching states and actions from the global context
	const {
		chartMode,
		setChartMode,
		dataMode,
		setDataMode,
		selectedIds,
		togglePortfolio,
		activeRange,
		fromDate,
		toDate,
		handleRangeChange,
		handleDateRangeSelect,
	} = useChartContext();

	// 2. Sticky header internal state
	const [isStuck, setIsStuck] = useState(false);
	const [showAdvancedToolbar, setShowAdvancedToolbar] = useState(true);
	const sentinelRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => setIsStuck(!entry.isIntersecting),
			{ threshold: 0 },
		);
		if (sentinelRef.current) observer.observe(sentinelRef.current);
		return () => observer.disconnect();
	}, []);

	return (
		<>
			<div
				ref={sentinelRef}
				className="h-px w-full invisible pointer-events-none"
			/>

			<div
				className={cn(
					"w-full flex flex-col gap-2 p-2 sm:p-3 sm:px-3 md:px-6 py-2.5 transition-all duration-300 bg-slate-900 border border-white/10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl",
					isSticky && "sticky top-0 z-50",
				)}
			>
				{/* Advanced Toolbar: Summary + Portfolio Selection */}
				{isStuck && showAdvancedToolbar && (
					<div className="flex flex-col md:flex-row md:items-center justify-between gap-3 w-full border-b border-white/10 pb-2.5 animate-in fade-in slide-in-from-top-1">
						<div className="flex items-center gap-3 shrink-0">
							<div className="flex flex-col">
								<span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
									Zaznaczone
								</span>
								<div className="flex items-baseline gap-1">
									<span className="text-sm md:text-base font-black text-white tracking-tight">
										{totalCurrent.toLocaleString("pl-PL", {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										})}
									</span>
									<span className="text-[9px] text-slate-400 font-bold">
										PLN
									</span>
								</div>
							</div>
							<div
								className={cn(
									"px-2 py-0.5 rounded text-[10px] font-black shadow-sm transition-colors border border-transparent",
									totalPnLPct > 0
										? "bg-emerald-500/10 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]"
										: totalPnLPct < 0
											? "bg-rose-500/10 text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]"
											: "bg-white/10 text-slate-300",
								)}
							>
								{totalPnLPct > 0 ? "+" : ""}
								{totalPnLPct.toFixed(2)}%
							</div>
						</div>

						<div className="flex gap-1.5 overflow-x-auto w-full scrollbar-hide md:justify-end items-center">
							<FilterBadge
								id="ALL"
								label="Wszystkie"
								isSelected={selectedIds.includes("ALL")}
								onToggle={togglePortfolio}
								className="py-1 px-2 text-[9px] whitespace-nowrap border-none"
							/>
							{portfolios.map((p) => (
								<FilterBadge
									key={p.id}
									id={p.id}
									label={p.name}
									isSelected={selectedIds.includes(p.id)}
									onToggle={togglePortfolio}
									className="py-1 px-2 text-[9px] whitespace-nowrap border-none"
								/>
							))}
						</div>
					</div>
				)}

				{/* Main Toolbar */}
				<div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2.5 w-full">
					<div className="flex items-center gap-2 overflow-x-auto scrollbar-hide shrink-0 pb-0.5 xl:pb-0">
						{/* Value vs Percentage toggle */}
						<div className="flex items-center p-0.5 bg-slate-800/80 border border-white/5 rounded-lg shrink-0">
							<FilterBadge
								id="VALUE"
								label="PLN"
								isSelected={chartMode === "VALUE"}
								onToggle={() => setChartMode("VALUE")}
								className="py-1 px-2 text-[9px] whitespace-nowrap border-none"
							/>
							<FilterBadge
								id="PERCENTAGE"
								label="%"
								isSelected={chartMode === "PERCENTAGE"}
								onToggle={() => setChartMode("PERCENTAGE")}
								className="py-1 px-2 text-[9px] whitespace-nowrap border-none"
							/>
						</div>

						{/* Real vs Simulated toggle */}
						<div className="flex items-center p-0.5 bg-slate-800/80 border border-white/5 rounded-lg shrink-0">
							<FilterBadge
								id="REAL"
								label="Realne"
								isSelected={dataMode === "REAL"}
								onToggle={() => setDataMode("REAL")}
								className="py-1 px-2 text-[9px] whitespace-nowrap border-none"
							/>
							<FilterBadge
								id="SIMULATED"
								label="Symulacja"
								isSelected={dataMode === "SIMULATED"}
								onToggle={() => setDataMode("SIMULATED")}
								className="py-1 px-2 text-[9px] whitespace-nowrap border-none"
							/>
						</div>
					</div>

					<div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide justify-start xl:justify-end pb-0.5 xl:pb-0 w-full xl:w-auto">
						{TIME_RANGES.map((range) => {
							const isDisabled = disabledRanges.includes(range);
							return (
								<button
									key={range}
									onClick={() => !isDisabled && handleRangeChange(range)}
									disabled={isDisabled}
									className={cn(
										"px-2 py-1 rounded-md text-[9px] sm:text-[10px] font-bold tracking-wide transition-all shrink-0 border",
										isDisabled
											? "opacity-30 cursor-not-allowed border-transparent text-slate-500"
											: activeRange === range
												? "bg-blue-500/20 text-blue-400 border-blue-500/30 shadow-sm"
												: "bg-transparent text-slate-400 border-transparent hover:text-white hover:bg-slate-800",
									)}
								>
									{range}
								</button>
							);
						})}

						<div className="w-px h-4 bg-slate-700/80 mx-0.5 hidden sm:block shrink-0" />

						<div className="shrink-0">
							<DatePickerWithRange
								from={fromDate}
								to={toDate}
								onSelect={handleDateRangeSelect}
							/>
						</div>

						{isStuck && (
							<button
								onClick={() => setShowAdvancedToolbar(!showAdvancedToolbar)}
								className={cn(
									"p-1 rounded-md transition-all duration-300 border shrink-0 absolute sm:static right-3 top-3 hover:cursor-pointer ml-auto",
									showAdvancedToolbar
										? "bg-slate-800 text-blue-400 border-slate-700/60 shadow-sm"
										: "bg-transparent text-slate-400 border-transparent hover:text-white hover:bg-slate-800",
								)}
							>
								{showAdvancedToolbar ? (
									<Minimize2 className="w-3.5 h-3.5" />
								) : (
									<Maximize2 className="w-3.5 h-3.5" />
								)}
							</button>
						)}
					</div>
				</div>
			</div>
		</>
	);
}
