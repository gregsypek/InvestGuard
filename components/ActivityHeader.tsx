"use client";

import { Filter, History, Wallet2 } from "lucide-react";

import { FilterBadge } from "./shared/FilterBadge";
import { ValueCard } from "./shared/ValueCard";
import { useChartContext } from "./providers/ChartProvider";

interface ActivityHeaderProps {
	totalTransactions: number; // (Możesz to zostawić dla kompatybilności z page.tsx)
	hasActiveFilters: boolean;
	portfolios: any[];
}

export function ActivityHeader({
	hasActiveFilters,
	portfolios,
}: ActivityHeaderProps) {
	// Usunięto isPending, ponieważ FilterBadge nie obsługuje disabled
	const { selectedIds, togglePortfolio } = useChartContext();

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
					(assetSum: number, a: any) => assetSum + Number(a.currentValue),
					0,
				),
			0,
		);

	// 🚀 ZMIANA: Dynamiczne liczenie transakcji z klikniętych portfeli
	const dynamicTotalTransactions = portfolios
		.filter((p) => selectedIds.includes("ALL") || selectedIds.includes(p.id))
		.reduce((sum, p) => sum + (p.transactionHistories?.length || 0), 0);

	return (
		<header className="relative overflow-hidden flex flex-col gap-8 w-full bg-slate-950 bg-gradient-to-r from-theme-primary/20 dark:from-theme-primary/10 via-slate-900 to-slate-950 text-slate-100 p-6 md:p-8 border-b border-white/10 dark:border-t-border rounded-b-2xl transition-colors">
			{" "}
			<div
				className="absolute inset-0 z-0 pointer-events-none opacity-40 dark:opacity-30 transition-opacity"
				style={{
					backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg stroke='%23ffffff' stroke-width='1.5' stroke-opacity='0.4'%3E%3Cline x1='15' y1='20' x2='15' y2='60'/%3E%3Crect x='11' y='30' width='8' height='20' fill='%23ffffff' fill-opacity='0.3'/%3E%3Cline x1='35' y1='40' x2='35' y2='80'/%3E%3Crect x='31' y='50' width='8' height='15' fill='none'/%3E%3Cline x1='55' y1='10' x2='55' y2='45'/%3E%3Crect x='51' y='15' width='8' height='25' fill='%23ffffff' fill-opacity='0.6'/%3E%3Cline x1='75' y1='30' x2='75' y2='70'/%3E%3Crect x='71' y='45' width='8' height='10' fill='none'/%3E%3Cline x1='95' y1='50' x2='95' y2='90'/%3E%3Crect x='91' y='60' width='8' height='25' fill='%23ffffff' fill-opacity='0.2'/%3E%3C/g%3E%3C/svg%3E")`,
					WebkitMaskImage:
						"radial-gradient(circle at 95% 2%, black 0%, transparent 20%)",
					maskImage:
						"radial-gradient(circle at 90% 2%, black 5%, transparent 20%)",
				}}
			/>
			<div className="relative z-10">
				<nav className="text-sm text-slate-400 italic flex items-center gap-1.5">
					Historia /{" "}
					<span className="text-amber-400 font-medium lowercase">
						{dynamicName}
					</span>
					{/* {hasActiveFilters && (
						<span className="flex items-center gap-1 ml-2 text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-widest not-italic">
							<Filter className="w-3 h-3" /> Aktywne filtry w tabeli
						</span>
					)} */}
				</nav>
				<div className="mt-2">
					<h1 className="text-3xl md:text-4xl font-black tracking-tighter lowercase flex items-center gap-3 drop-shadow-sm text-white">
						Historia Operacji
					</h1>
				</div>
			</div>
			<div className="relative z-10 flex items-center flex-wrap gap-2 py-2">
				<span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">
					Wybierz portfel:
				</span>
				<FilterBadge
					id="ALL"
					label="Wszystkie Portfele"
					isSelected={selectedIds.includes("ALL")}
					onToggle={() => togglePortfolio("ALL")}
				/>
				{portfolios.map((p) => (
					<FilterBadge
						key={p.id}
						id={p.id}
						label={p.name}
						isSelected={selectedIds.includes(p.id)}
						onToggle={() => togglePortfolio(p.id)}
					/>
				))}
			</div>
			<div className="relative z-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-8 pb-2 md:pb-0">
				<div className="space-y-1">
					<div className="flex items-center gap-1.5 text-slate-400 font-bold tracking-widest text-[10px] uppercase mb-1">
						<History className="w-3.5 h-3.5" />
						<span>Wszystkie Zarejestrowane</span>
					</div>
					<div className="flex items-baseline gap-2">
						<h2 className="text-5xl md:text-6xl font-black tracking-tighter text-white drop-shadow-sm">
							{/* 🚀 ZMIANA: Wyświetlamy nasz dynamiczny stan */}
							{dynamicTotalTransactions}
						</h2>
						<span className="text-xl md:text-2xl text-slate-500 font-bold uppercase">
							szt.
						</span>
					</div>
				</div>

				<div className="flex self-start sm:justify-end flex-wrap gap-8 md:gap-12 overflow-x-auto no-scrollbar">
					<ValueCard label="Bieżąca Wycena" icon={Wallet2}>
						<div className="flex items-baseline gap-1.5 font-mono">
							<span className="text-2xl font-bold tracking-tight text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]">
								{new Intl.NumberFormat("pl-PL", {
									style: "currency",
									currency: "PLN",
									maximumFractionDigits: 0,
								}).format(dynamicTotalValue)}
							</span>
						</div>
					</ValueCard>
				</div>
			</div>
		</header>
	);
}
