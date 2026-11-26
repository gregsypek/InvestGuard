"use client";

import { CalendarClock, Plus, TrendingUp, Wallet2 } from "lucide-react";
import { formatCurrency, getCurrencySymbol } from "@/lib/utils/format-currency";
import { useCallback, useMemo, useState } from "react";

import { AppHeaderLayout } from "./shared/AppHeaderLayout";
import { FilterBadge } from "./shared/FilterBadge";
import Link from "next/link";
import { ValueCard } from "./shared/ValueCard";
import { cn } from "@/lib/utils";
import { useChartContext } from "./providers/ChartProvider";

interface PlannerHeaderProps {
	initialTotalPlannedValue: number;
	initialPlannedCount: number;
	portfolios: { id: string; name: string; colorTheme?: string }[];
	plans: { portfolioId: string; value: number | string | any }[];
	customBreadcrumbs?: React.ReactNode;
}

export function PlannerHeader({
	initialTotalPlannedValue,
	initialPlannedCount,
	portfolios,
	plans,
	customBreadcrumbs,
}: PlannerHeaderProps) {
	const { currency, convertPLN } = useChartContext();
	const currencySymbol = getCurrencySymbol(currency);

	// Local state for previewing planned totals per portfolio
	const [selectedIds, setSelectedIds] = useState<string[]>(["ALL"]);

	const togglePortfolio = useCallback((id: string) => {
		setSelectedIds((prev) => {
			if (id === "ALL") return ["ALL"];
			const next = prev.filter((c) => c !== "ALL");
			if (next.includes(id)) {
				const filtered = next.filter((c) => c !== id);
				return filtered.length === 0 ? ["ALL"] : filtered;
			}
			return [...next, id];
		});
	}, []);

	// Dynamically recalculate planned stats based on selected portfolio pills
	const dynamicStats = useMemo(() => {
		if (selectedIds.includes("ALL")) {
			return {
				value: initialTotalPlannedValue,
				count: initialPlannedCount,
			};
		}

		const activePlans = plans.filter((p) =>
			selectedIds.includes(p.portfolioId),
		);

		return {
			value: activePlans.reduce((sum, plan) => sum + Number(plan.value), 0),
			count: activePlans.length,
		};
	}, [selectedIds, plans, initialTotalPlannedValue, initialPlannedCount]);

	// Resolve target portfolio ID for the creation link (falls back to first portfolio when "ALL" is active)
	const targetPortfolioId =
		selectedIds.find((id) => id !== "ALL") || portfolios[0]?.id;

	return (
		<AppHeaderLayout
			breadcrumbs={customBreadcrumbs}
			title="Planer Inwestycyjny"
			description="Zarządzaj przyszłymi zakupami i kontroluj przepływ gotówki."
			filters={
				portfolios.length > 0 && (
					<>
						<span className="sticky left-0 w-max flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">
							<Wallet2 className="w-3 h-3 text-theme-primary" /> Wybierz
							portfel:
						</span>

						<div className="flex gap-1.5 sm:gap-2 flex-nowrap sm:flex-wrap pb-1 sm:pb-0 w-max sm:flex-1 min-w-0">
							<FilterBadge
								id="ALL"
								label="Wszystkie Portfele"
								isSelected={selectedIds.includes("ALL")}
								onToggle={togglePortfolio}
								className={cn(
									"py-1 px-2.5 text-[9px] sm:text-[10px] font-bold tracking-widest rounded-lg transition-all shrink-0 border",
									selectedIds.includes("ALL")
										? "bg-theme-primary text-white border-transparent shadow-sm"
										: "bg-transparent text-slate-300 border-white/20 hover:bg-white/10",
								)}
							/>
							{portfolios.map((p) => {
								const isSelected = selectedIds.includes(p.id);
								return (
									<div key={p.id} data-theme={p.colorTheme || "blue"}>
										<FilterBadge
											id={p.id}
											label={p.name}
											isSelected={isSelected}
											onToggle={togglePortfolio}
											className={cn(
												"py-1 px-2.5 text-[9px] sm:text-[10px] font-bold tracking-widest rounded-lg transition-all shrink-0 border",
												isSelected
													? "bg-theme-soft text-theme-primary border-theme-border shadow-sm"
													: "bg-transparent text-slate-300 border-white/20 hover:bg-white/10",
											)}
										/>
									</div>
								);
							})}
						</div>

						{/* Primary creation CTA aligned to the right edge of the filter bar */}
						{targetPortfolioId && (
							<Link
								href={`/dashboard/${targetPortfolioId}/add-asset?source=planner`}
								className="inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-dashed border-theme-border bg-theme-soft/70 hover:bg-theme-primary hover:text-white hover:border-transparent text-theme-primary text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-all shrink-0 sm:ml-auto cursor-pointer shadow-xs"
							>
								<Plus className="w-3.5 h-3.5" />
								<span>Nowy plan</span>
							</Link>
						)}
					</>
				)
			}
			mainStatLabel={
				<>
					<TrendingUp className="w-3.5 h-3.5" />
					<span>Planowana wartość na kolejny miesiąc</span>
				</>
			}
			mainStatValue={formatCurrency(convertPLN(dynamicStats.value))}
			mainStatSuffix={currencySymbol}
			secondaryStats={
				<ValueCard
					label="Zaplanowane aktywa"
					icon={CalendarClock}
					className="text-white"
				>
					<div className="flex items-baseline gap-1.5 font-mono">
						<span className="text-xl sm:text-2xl font-bold tracking-tight text-theme-primary drop-shadow-[0_0_8px_rgba(139,92,246,0.4)]">
							{dynamicStats.count}
						</span>
						<span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
							SZT.
						</span>
					</div>
				</ValueCard>
			}
		/>
	);
}
