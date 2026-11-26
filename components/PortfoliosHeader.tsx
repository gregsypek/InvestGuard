"use client";

import { Briefcase, LayoutGrid, Plus, Wallet2 } from "lucide-react";
import { formatCurrency, getCurrencySymbol } from "@/lib/utils/format-currency";

import { AppHeaderLayout } from "./shared/AppHeaderLayout";
import { FilterBadge } from "./shared/FilterBadge";
import Link from "next/link";
import { ValueCard } from "./shared/ValueCard";
import { cn } from "@/lib/utils";
import { useChartContext } from "./providers/ChartProvider";

interface PortfoliosHeaderProps {
	title: string;
	totalValue: number;
	portfoliosCount: number;
	assetsCount: number;
	customBreadcrumbs?: React.ReactNode;
	portfolios?: { id: string; name: string; colorTheme?: string }[];
	selectedIds?: string[];
	togglePortfolio?: (id: string) => void;
	createHref?: string;
	onCreateClick?: () => void;
}

export const PortfoliosHeader = ({
	title,
	totalValue,
	portfoliosCount,
	assetsCount,
	customBreadcrumbs,
	portfolios,
	selectedIds,
	togglePortfolio,
	createHref = "/portfolios/new",
	onCreateClick,
}: PortfoliosHeaderProps) => {
	const { currency, convertPLN } = useChartContext();
	const currencySymbol = getCurrencySymbol(currency);

	const createButtonClasses =
		"inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-dashed border-theme-border bg-theme-soft/70 hover:bg-theme-primary hover:text-white hover:border-transparent text-theme-primary text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-all shrink-0 sm:ml-auto cursor-pointer shadow-xs";

	return (
		<AppHeaderLayout
			title={title}
			breadcrumbs={customBreadcrumbs}
			description={
				"Zarządzaj wszystkimi portfelami i dokonuj zmian w swoich inwestycjach."
			}
			filters={
				portfolios &&
				selectedIds &&
				togglePortfolio &&
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

						{/* Primary creation CTA separated visually and aligned to the right edge */}
						{onCreateClick ? (
							<button
								type="button"
								onClick={onCreateClick}
								className={createButtonClasses}
							>
								<Plus className="w-3.5 h-3.5" />
								<span>Nowy portfel</span>
							</button>
						) : (
							<Link href={createHref} className={createButtonClasses}>
								<Plus className="w-3.5 h-3.5" />
								<span>Nowy portfel</span>
							</Link>
						)}
					</>
				)
			}
			mainStatLabel={
				<>
					<Wallet2 className="w-3.5 h-3.5 text-slate-300" />
					<span>Wartość portfeli</span>
				</>
			}
			mainStatValue={formatCurrency(convertPLN(totalValue))}
			mainStatSuffix={currencySymbol}
			secondaryStats={
				<>
					{/* Portfolio count */}
					<ValueCard
						label="Liczba portfeli"
						icon={Briefcase}
						className="text-white"
					>
						<div className="flex items-baseline gap-1.5 font-mono">
							<span className="text-xl sm:text-2xl font-bold tracking-tight text-theme-primary drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]">
								{portfoliosCount}
							</span>
							<span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
								SZT.
							</span>
						</div>
					</ValueCard>

					{/* Asset count */}
					<ValueCard
						label="Liczba aktywów"
						icon={LayoutGrid}
						className="text-white"
					>
						<div className="flex items-baseline gap-1.5 font-mono">
							<span className="text-xl sm:text-2xl font-bold tracking-tight text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">
								{assetsCount}
							</span>
							<span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
								SZT.
							</span>
						</div>
					</ValueCard>
				</>
			}
		/>
	);
};
