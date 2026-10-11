"use client";

import { Container, Wallet2 } from "lucide-react";

import { AppHeaderLayout } from "../shared/AppHeaderLayout";
import { FilterBadge } from "../shared/FilterBadge";
import { ValueCard } from "../shared/ValueCard";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/format-currency";

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
	return (
		<AppHeaderLayout
			title="Przegląd Inwestycji"
			description="Holistyczne spojrzenie na wszystkie Twoje strategie."
			filters={
				portfolios.length > 0 && (
					<>
						<span className="sticky left-0 w-max flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">
							<Wallet2 className="w-3 h-3 text-blue-400" /> Analiza dla:
						</span>

						<div className="flex gap-1.5 sm:gap-2 flex-nowrap sm:flex-wrap pb-1 sm:pb-0 w-max sm:w-full">
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
			mainStatValue={formatCurrency(totalCurrent)}
			secondaryStats={
				<>
					{/* Karta 1: Zainwestowany kapitał */}
					<ValueCard
						label="Zainwestowany kapitał"
						icon={Container}
						value={totalInvested}
						formatString
						suffix="PLN"
					/>

					{/* Karta 2: P&L */}
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
								{formatCurrency(totalPnL)}
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
