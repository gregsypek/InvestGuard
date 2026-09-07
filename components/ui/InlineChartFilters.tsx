"use client";

import { FilterBadge } from "../shared/FilterBadge";
import { PortfolioWithAssets } from "@/lib/types";
import { useChartContext } from "../providers/ChartProvider";

export function InlineChartFilters({
	portfolios,
}: {
	portfolios: PortfolioWithAssets[];
}) {
	const {
		chartMode,
		setChartMode,
		selectedIds,
		togglePortfolio,
		activeRange,
		handleRangeChange,
	} = useChartContext();

	return (
		<div className="flex flex-col gap-4 mb-4">
			{/* RZĄD 1: Wybór Portfeli i Tryb PLN/% */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				{/* Plakietki portfeli bez tła */}
				<div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 sm:pb-0">
					<span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0 mr-1">
						Portfele:
					</span>
					<FilterBadge
						id="ALL"
						label="Wszystkie"
						isSelected={selectedIds.includes("ALL")}
						onToggle={togglePortfolio}
					/>
					{portfolios.map((p) => (
						<FilterBadge
							key={p.id}
							id={p.id}
							label={p.name}
							isSelected={selectedIds.includes(p.id)}
							onToggle={togglePortfolio}
						/>
					))}
				</div>

				{/* Tryb Wykresu dosunięty do prawej */}
				<div className="flex items-center gap-2 shrink-0">
					<span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0">
						Wartość:
					</span>
					<FilterBadge
						id="VALUE"
						label="PLN"
						isSelected={chartMode === "VALUE"}
						onToggle={() => setChartMode("VALUE")}
					/>
					<FilterBadge
						id="PERCENTAGE"
						label="%"
						isSelected={chartMode === "PERCENTAGE"}
						onToggle={() => setChartMode("PERCENTAGE")}
					/>
				</div>
			</div>

			{/* RZĄD 2: Zakres czasu (wzorowany na AssetFilterPanel) */}
			<div className="flex flex-row items-center gap-2 sm:gap-3">
				<div className="flex flex-1 sm:flex-none sm:w-56 items-center gap-2 bg-black/5 dark:bg-white/5 border border-t-border-subtle rounded-lg px-2 py-1.5 focus-within:border-t-border transition-colors overflow-hidden">
					<span className="hidden sm:block text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0">
						Zakres:
					</span>
					<select
						value={activeRange}
						onChange={(e) => handleRangeChange(e.target.value)}
						className="w-full bg-transparent text-t-text-secondary text-[10px] font-bold uppercase tracking-widest outline-none cursor-pointer truncate"
					>
						{["1W", "1M", "3M", "YTD", "1Y", "3Y", "5Y", "MAX"].map((range) => (
							<option key={range} value={range} className="bg-t-bg-panel">
								{range}
							</option>
						))}
					</select>
				</div>
			</div>
		</div>
	);
}
