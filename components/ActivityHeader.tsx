"use client";

import { History, Wallet2 } from "lucide-react";
import { formatCurrency, getCurrencySymbol } from "@/lib/utils/format-currency";
import { usePathname, useRouter, useSearchParams } from "next/navigation"; // 🚀 FIX: Dodane importy rutingu

import { AppHeaderLayout } from "./shared/AppHeaderLayout";
import { FilterBadge } from "./shared/FilterBadge";
import { PortfolioWithAssets } from "@/lib/types";
import { ValueCard } from "./shared/ValueCard";
import { cn } from "@/lib/utils";
import { convertFromPLN } from "@/lib/utils/convert-currency";
import { useChartContext } from "./providers/ChartProvider";

interface ActivityHeaderProps {
	totalTransactions: number;
	hasActiveFilters: boolean;
	portfolios: PortfolioWithAssets[];
}

export function ActivityHeader({
	hasActiveFilters,
	portfolios,
}: ActivityHeaderProps) {
	// 🚀 FIX: Zamiast togglePortfolio bierzemy setSelectedIds
	const { selectedIds, setSelectedIds, currency, convertPLN } =
		useChartContext();
	const currencySymbol = getCurrencySymbol(currency);

	// 🚀 FIX: Hooki do modyfikacji URL
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	// 🚀 FIX: Magiczna funkcja aktualizująca WYŁĄCZNIE lokalny kontekst
	const handleSelectPortfolio = (id: string) => {
		// 1. NATYCHMIAST zmienia wykres w locie
		setSelectedIds([id]);

		// 2. Tabela potrzebuje parametru w URL, żeby serwer pobrał nowe transakcje
		const params = new URLSearchParams(searchParams.toString());

		if (id === "ALL") {
			params.delete("portfolio"); // Czyścimy TYLKO nasz lokalny parametr
		} else {
			params.set("portfolio", id); // Ustawiamy TYLKO nasz lokalny parametr
		}

		// Resetujemy stronę tabeli do 1
		params.delete("page");

		// Zmieniamy URL bez przeładowania strony
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

						<div className="flex gap-1.5 sm:gap-2 flex-nowrap sm:flex-wrap pb-1 sm:pb-0 w-max sm:w-full">
							<FilterBadge
								id="ALL"
								label="Wszystkie Portfele"
								isSelected={selectedIds.includes("ALL")}
								onToggle={() => handleSelectPortfolio("ALL")} // 🚀 FIX: Użycie nowej funkcji
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
											onToggle={() => handleSelectPortfolio(p.id)} // 🚀 FIX: Użycie nowej funkcji
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
					<History className="w-3.5 h-3.5" />
					<span>Wszystkie Zarejestrowane</span>
				</>
			}
			mainStatValue={convertFromPLN(dynamicTotalTransactions)}
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
