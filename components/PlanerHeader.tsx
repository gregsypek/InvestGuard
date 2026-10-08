"use client";

import { CalendarClock, TrendingUp, Wallet2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { FilterBadge } from "./shared/FilterBadge";
import { ValueCard } from "./shared/ValueCard";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/format-currency";

interface PlannerHeaderProps {
	initialTotalPlannedValue: number;
	initialPlannedCount: number;
	portfolios: { id: string; name: string; colorTheme?: string }[];
	plans: { portfolioId: string; value: number | string | any }[]; // Typ dopasowany do zrzutu z bazy
	customBreadcrumbs?: React.ReactNode;
}

export function PlannerHeader({
	initialTotalPlannedValue,
	initialPlannedCount,
	portfolios,
	plans,
	customBreadcrumbs,
}: PlannerHeaderProps) {
	// --- LOKALNY STAN DO "SUWAKA PODGLĄDU" ---
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

	// --- DYNAMICZNE PRZELICZANIE STATYSTYK ---
	const dynamicStats = useMemo(() => {
		if (selectedIds.includes("ALL")) {
			return {
				value: initialTotalPlannedValue,
				count: initialPlannedCount,
			};
		}

		// Filtrujemy plany tylko dla zaznaczonych portfeli
		const activePlans = plans.filter((p) =>
			selectedIds.includes(p.portfolioId),
		);

		return {
			value: activePlans.reduce((sum, plan) => sum + Number(plan.value), 0),
			count: activePlans.length,
		};
	}, [selectedIds, plans, initialTotalPlannedValue, initialPlannedCount]);

	return (
		<header className="relative overflow-hidden flex flex-col gap-6 md:gap-6 -mx-3 md:-mx-10 px-3 md:px-10 bg-slate-950 bg-gradient-to-r from-theme-primary/20 dark:from-theme-primary/10 via-slate-900 to-slate-950 text-slate-100 py-3 md:py-6 border-b border-white/10 dark:border-t-border rounded-b-2xl transition-colors shadow-lg">
			{/* --- TEKSTURA SVG --- */}
			<div
				className="absolute inset-0 z-0 pointer-events-none opacity-50 dark:opacity-40 transition-opacity"
				style={{
					backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg stroke='%233b82f6' stroke-width='1.5' stroke-opacity='0.4'%3E%3Cline x1='15' y1='20' x2='15' y2='60'/%3E%3Crect x='11' y='30' width='8' height='20' fill='%233b82f6' fill-opacity='0.3'/%3E%3Cline x1='35' y1='40' x2='35' y2='80'/%3E%3Crect x='31' y='50' width='8' height='15' fill='none'/%3E%3Cline x1='55' y1='10' x2='55' y2='45'/%3E%3Crect x='51' y='15' width='8' height='25' fill='%233b82f6' fill-opacity='0.6'/%3E%3Cline x1='75' y1='30' x2='75' y2='70'/%3E%3Crect x='71' y='45' width='8' height='10' fill='none'/%3E%3Cline x1='95' y1='50' x2='95' y2='90'/%3E%3Crect x='91' y='60' width='8' height='25' fill='%233b82f6' fill-opacity='0.2'/%3E%3C/g%3E%3C/svg%3E")`,
					WebkitMaskImage:
						"radial-gradient(circle at 95% 2%, black 0%, transparent 20%)",
					maskImage:
						"radial-gradient(circle at 90% 2%, black 5%, transparent 20%)",
				}}
			/>

			{/* GÓRA: Nawigacja i Tytuł */}
			<div className="relative z-10 flex flex-col gap-2">
				{customBreadcrumbs}
				<div className="mt-1 sm:mt-2">
					<h1 className="text-2xl sm:text-3xl md:text-4xl font-black capitalize  flex items-center gap-3 drop-shadow-sm text-slate-300">
						Planer Inwestycyjny
					</h1>
					<p className="text-slate-400 font-medium mt-1 text-[11px] sm:text-sm md:text-base leading-tight">
						Zarządzaj przyszłymi zakupami i kontroluj przepływ gotówki.
					</p>
				</div>

				{/* 🚀 PASEK WYBORU PORTFELI */}
				{portfolios.length > 0 && (
					<div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-3 sm:mt-4 p-3 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm shadow-inner w-full min-w-0 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
						<span className="sticky left-0 w-max flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">
							<Wallet2 className="w-3 h-3 text-theme-primary" /> Wybierz
							portfel:
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
					</div>
				)}
			</div>

			{/* DÓŁ: Główne Statystyki (Podpięte pod zaktualizowany stan) */}
			<div className="relative z-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-4 md:gap-6 pb-1">
				<div className="space-y-1 w-full md:w-auto shrink-0">
					<div className="flex items-center gap-1.5 text-slate-400 font-bold tracking-widest text-[9px] sm:text-[10px] uppercase mb-1">
						<TrendingUp className="w-3.5 h-3.5 text-slate-300" />
						<span>Planowana wartość na kolejny miesiąc</span>
					</div>
					<div className="flex items-baseline gap-1.5 sm:gap-2">
						{/* 🚀 Renderujemy przeliczoną wartość dynamiczną */}
						<h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-white drop-shadow-sm truncate">
							{formatCurrency(dynamicStats.value)}
						</h2>
						<span className="text-lg sm:text-xl md:text-2xl text-slate-500 font-bold">
							PLN
						</span>
					</div>
				</div>

				<div className="flex self-start sm:justify-end flex-wrap gap-4 sm:gap-6 md:gap-10 w-full md:w-auto">
					<ValueCard
						label="Zaplanowane aktywa"
						icon={CalendarClock}
						className="text-white"
					>
						<div className="flex items-baseline gap-1.5 font-mono">
							{/* 🚀 Renderujemy przeliczoną liczbę aktywów */}
							<span className="text-xl sm:text-2xl font-bold tracking-tight text-theme-primary drop-shadow-[0_0_8px_rgba(139,92,246,0.4)]">
								{dynamicStats.count}
							</span>
							<span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
								SZT.
							</span>
						</div>
					</ValueCard>
				</div>
			</div>
		</header>
	);
}
