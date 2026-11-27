"use client";

import { Briefcase, Container, Plus, Wallet2 } from "lucide-react";
import { formatCurrency, getCurrencySymbol } from "@/lib/utils/format-currency";

import { AppHeaderLayout } from "../shared/AppHeaderLayout";
import { FilterBadge } from "../shared/FilterBadge";
import Link from "next/link";
import { ValueCard } from "../shared/ValueCard";
import { cn } from "@/lib/utils";
import { useChartContext } from "../providers/ChartProvider";

type MinimalPortfolio = {
	id: string;
	name: string;
	colorTheme?: string;
};

interface GlobalDashboardHeaderProps {
	portfolios: MinimalPortfolio[];
	selectedIds: string[];
	togglePortfolio: (id: string) => void;
	totalCurrent: number;
	totalInvested: number;
	totalPnL: number;
	totalPnLPct: number;
}

export function GlobalDashboardHeader({
	portfolios,
	selectedIds,
	togglePortfolio,
	totalCurrent,
	totalInvested,
	totalPnL,
	totalPnLPct,
}: GlobalDashboardHeaderProps) {
	const { currency, convertPLN } = useChartContext();
	const currencySymbol = getCurrencySymbol(currency);

	// Resolve active scope label for breadcrumbs
	const activeScopeLabel = selectedIds.includes("ALL")
		? "wszystkie portfele"
		: selectedIds.length === 1
			? portfolios.find((p) => p.id === selectedIds[0])?.name ||
				"wybrany portfel"
			: `wybrane (${selectedIds.length})`;

	// Target the selected portfolio if a single one is active, otherwise fall back to the primary portfolio
	const targetPortfolioId =
		selectedIds.find((id) => id !== "ALL") || portfolios[0]?.id;

	return (
		<AppHeaderLayout
			breadcrumbs={
				<nav className="text-[10px] sm:text-xs md:text-sm text-slate-400 italic flex items-center gap-1.5">
					Przegląd Inwestycji /{" "}
					<span className="text-theme-primary font-medium lowercase">
						{activeScopeLabel}
					</span>
				</nav>
			}
			title="Przegląd Inwestycji"
			description="Holistyczne spojrzenie na wszystkie Twoje strategie."
			// actions={
			// 	<Link
			// 		href="/portfolios"
			// 		className="group flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl transition-all duration-300 shadow-sm border bg-white/5 hover:bg-white/10 border-white/15 text-slate-300 hover:text-white"
			// 	>
			// 		<Briefcase className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
			// 		<span className="hidden sm:inline text-[10px] sm:text-xs font-bold uppercase tracking-widest">
			// 			Portfele
			// 		</span>
			// 	</Link>
			// }
			filters={
				portfolios.length > 0 && (
					<>
						<span className="sticky left-0 w-max flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">
							<Wallet2 className="w-3 h-3 text-blue-400" /> Analiza dla:
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
										? "bg-blue-500 text-white border-transparent shadow-sm"
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
								href={`/dashboard/${targetPortfolioId}/add-asset?source=overview`}
								className="inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-dashed border-theme-border bg-theme-soft/70 hover:bg-theme-primary hover:text-white hover:border-transparent text-theme-primary text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-all shrink-0 sm:ml-auto cursor-pointer shadow-xs"
							>
								<Plus className="w-3.5 h-3.5" />
								<span>Nowe aktywo</span>
							</Link>
						)}
					</>
				)
			}
			mainStatLabel={
				<>
					<Wallet2 className="w-3.5 h-3.5" />
					<span>
						{selectedIds.includes("ALL")
							? "Wartość Całkowita"
							: "Wartość Zaznaczonych"}
					</span>
				</>
			}
			mainStatValue={formatCurrency(convertPLN(totalCurrent))}
			mainStatSuffix={currencySymbol}
			secondaryStats={
				<>
					{/* Card 1: Invested capital */}
					<ValueCard
						label="Zainwestowany kapitał"
						icon={Container}
						value={convertPLN(totalInvested)}
						formatString
						suffix={currencySymbol}
					/>

					{/* Card 2: Total P&L */}
					<ValueCard label="Całkowity Wynik (P&L)">
						<div className="flex items-center gap-2 font-mono">
							<span
								className={cn(
									"text-lg sm:text-xl font-bold tracking-tight transition-colors",
									totalPnL > 0
										? "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]"
										: totalPnL < 0
											? "text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]"
											: "text-slate-400",
								)}
							>
								{totalPnL > 0 ? "+" : ""}
								{formatCurrency(convertPLN(totalPnL))}
							</span>
							<span
								className={cn(
									"flex items-center text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-sm transition-colors",
									totalPnLPct > 0
										? "bg-emerald-500/10 text-emerald-400"
										: totalPnLPct < 0
											? "bg-rose-500/10 text-rose-500"
											: "bg-white/10 text-slate-300",
								)}
							>
								{totalPnLPct > 0 ? "+" : ""}
								{totalPnLPct.toFixed(2)}%
							</span>
						</div>
					</ValueCard>
				</>
			}
		/>
	);
}
