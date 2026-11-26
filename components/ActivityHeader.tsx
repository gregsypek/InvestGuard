"use client";

import { History, Plus, Wallet2 } from "lucide-react";
import { formatCurrency, getCurrencySymbol } from "@/lib/utils/format-currency";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { AppHeaderLayout } from "./shared/AppHeaderLayout";
import { FilterBadge } from "./shared/FilterBadge";
import Link from "next/link";
import { PortfolioWithAssets } from "@/lib/types";
import { ValueCard } from "./shared/ValueCard";
import { cn } from "@/lib/utils";
import { useChartContext } from "./providers/ChartProvider";

interface ActivityHeaderProps {
	totalTransactions: number;
	hasActiveFilters: boolean;
	portfolios: PortfolioWithAssets[];
}

export function ActivityHeader({ portfolios }: ActivityHeaderProps) {
	const { selectedIds, setSelectedIds, currency, convertPLN } =
		useChartContext();
	const currencySymbol = getCurrencySymbol(currency);

	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	// Update local portfolio context and sync URL query param for server-side table filtering
	const handleSelectPortfolio = (id: string) => {
		setSelectedIds([id]);

		const params = new URLSearchParams(searchParams.toString());

		if (id === "ALL") {
			params.delete("portfolio");
		} else {
			params.set("portfolio", id);
		}

		params.delete("page");

		router.push(`${pathname}?${params.toString()}`, { scroll: false });
	};

	const dynamicName = selectedIds.includes("ALL")
		? "Wszystkie Portfele"
		: selectedIds.length === 1
			? portfolios.find((p) => p.id === selectedIds[0])?.name ||
				"Nieznany Portfel"
			: "Wiele Portfeli";

	const dynamicTotalValue = portfolios
		.filter((p) => selectedIds.includes("ALL") || selectedIds.includes(p.id))
		.reduce(
			(sum, p) =>
				sum +
				p.assets.reduce(
					(assetSum: number, a) => assetSum + Number(a.currentValue),
					0,
				),
			0,
		);

	const dynamicTotalTransactions = portfolios
		.filter((p) => selectedIds.includes("ALL") || selectedIds.includes(p.id))
		.reduce((sum, p) => sum + (p.transactionHistories?.length || 0), 0);

	// Resolve target portfolio ID for the creation CTA (falls back to first portfolio when "ALL" is active)
	const targetPortfolioId =
		selectedIds.find((id) => id !== "ALL") || portfolios[0]?.id;

	return (
		<AppHeaderLayout
			breadcrumbs={
				<nav className="text-[10px] sm:text-xs md:text-sm text-slate-400 italic flex items-center gap-1.5">
					Historia /{" "}
					<span className="text-theme-primary font-medium lowercase">
						{dynamicName}
					</span>
				</nav>
			}
			title="Historia Operacji"
			description="Pełny rejestr zrealizowanych transakcji oraz historii kapitału."
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
								onToggle={() => handleSelectPortfolio("ALL")}
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
											onToggle={() => handleSelectPortfolio(p.id)}
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
								href={`/dashboard/${targetPortfolioId}/add-asset?source=activity`}
								className="inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-dashed border-theme-border bg-theme-soft/70 hover:bg-theme-primary hover:text-white hover:border-transparent text-theme-primary text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-all shrink-0 sm:ml-auto cursor-pointer shadow-xs"
							>
								<Plus className="w-3.5 h-3.5" />
								<span>Nowa operacja</span>
							</Link>
						)}
					</>
				)
			}
			mainStatLabel={
				<>
					<History className="w-3.5 h-3.5" />
					<span>Wszystkie Zarejestrowane</span>
				</>
			}
			mainStatValue={dynamicTotalTransactions}
			mainStatSuffix="szt."
			secondaryStats={
				<ValueCard label="Bieżąca Wycena" icon={Wallet2} className="text-white">
					<div className="flex items-baseline gap-1.5 font-mono">
						<span className="text-xl sm:text-2xl font-bold tracking-tight text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]">
							{formatCurrency(convertPLN(dynamicTotalValue), 0)}
							{currencySymbol}
						</span>
					</div>
				</ValueCard>
			}
		/>
	);
}
