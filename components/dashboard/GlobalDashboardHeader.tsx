"use client";

import { Container, Wallet2 } from "lucide-react";

import { FilterBadge } from "../shared/FilterBadge";
import { ValueCard } from "../shared/ValueCard";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/format-currency";

// Definicja typów dla propsów (zaimportuj je ze swojego pliku z typami, jeśli masz je gdzie indziej)
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
		// 🚀 ZMIANA: Zastosowano "Bleed Effect" (ujemne marginesy wyrównane wewnętrznym paddingiem)
		// Zaokrąglenie (rounded-b-2xl) przesuwa się, aby działać z krawędziami ekranu na komórkach
		<header className="relative overflow-hidden flex flex-col gap-6 md:gap-8 -mx-5 md:-mx-10 px-5 md:px-10 bg-slate-950 bg-gradient-to-r from-blue-500/10 dark:from-blue-500/10 via-slate-900 to-slate-950 text-slate-100 py-6 md:py-8 border-b border-white/10 dark:border-t-border rounded-b-2xl transition-colors shadow-lg">
			{/* --- TEKSTURA SVG --- */}
			<div
				className="absolute inset-0 z-0 pointer-events-none opacity-40 dark:opacity-30 transition-opacity"
				style={{
					backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg stroke='%233b82f6' stroke-width='1.5' stroke-opacity='0.4'%3E%3Cline x1='15' y1='20' x2='15' y2='60'/%3E%3Crect x='11' y='30' width='8' height='20' fill='%233b82f6' fill-opacity='0.3'/%3E%3Cline x1='35' y1='40' x2='35' y2='80'/%3E%3Crect x='31' y='50' width='8' height='15' fill='none'/%3E%3Cline x1='55' y1='10' x2='55' y2='45'/%3E%3Crect x='51' y='15' width='8' height='25' fill='%2310b981' fill-opacity='0.6'/%3E%3Cline x1='75' y1='30' x2='75' y2='70'/%3E%3Crect x='71' y='45' width='8' height='10' fill='none'/%3E%3Cline x1='95' y1='50' x2='95' y2='90'/%3E%3Crect x='91' y='60' width='8' height='25' fill='%2310b981' fill-opacity='0.2'/%3E%3C/g%3E%3C/svg%3E")`,
					WebkitMaskImage:
						"radial-gradient(circle at 95% 2%, black 0%, transparent 20%)",
					maskImage:
						"radial-gradient(circle at 90% 2%, black 5%, transparent 20%)",
				}}
			/>

			<div className="relative z-10 flex flex-col gap-2">
				<div>
					<h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter text-white drop-shadow-sm">
						Przegląd Inwestycji
					</h1>
					<p className="text-slate-400 font-medium mt-1 text-[11px] sm:text-sm md:text-base leading-tight">
						Holistyczne spojrzenie na wszystkie Twoje strategie
					</p>
				</div>

				{/* Pasek Wyboru Portfeli */}
				<div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-3 sm:mt-4 p-3 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm shadow-inner w-full min-w-0">
					<span className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">
						<Wallet2 className="w-3 h-3 text-blue-400" /> Analiza dla:
					</span>

					{/* 🚀 ZMIANA: Dynamiczne wsparcie dla Custom Properties w pętli map */}
					<div className="flex gap-1.5 sm:gap-2 flex-nowrap overflow-x-auto sm:flex-wrap sm:overflow-visible pb-1 sm:pb-0 w-full [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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
							// Hack dla Reacta: narzucenie zmiennej na poziomie atrybutu "data-theme", aby FilterBadge podchwycił CSS variables (jeśli FilterBadge tego nie potrafi, nadpisujemy w inline-style)
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
			</div>

			<div className="relative z-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-6 md:gap-8 pb-1">
				{/* OGROMNA Całkowita Wartość */}
				<div className="space-y-1 w-full md:w-auto shrink-0">
					<div className="flex items-center gap-1.5 text-slate-400 font-bold tracking-widest text-[9px] sm:text-[10px] uppercase mb-1">
						<Wallet2 className="w-3.5 h-3.5 text-slate-300" />
						<span>
							{selectedIds.includes("ALL")
								? "Wartość Całkowita"
								: "Wartość Zaznaczonych"}
						</span>
					</div>
					<div className="flex items-baseline gap-1.5 sm:gap-2">
						<h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-white drop-shadow-sm truncate">
							{formatCurrency(totalCurrent)}
						</h2>
						<span className="text-lg sm:text-xl md:text-2xl text-slate-500 font-bold">
							PLN
						</span>
					</div>
				</div>

				{/* PRAWA STRONA: Mniejsze statystyki */}
				<div className="flex self-start sm:justify-end flex-wrap gap-4 sm:gap-6 md:gap-10 w-full md:w-auto">
					<ValueCard
						label="Zainwestowany kapitał"
						icon={Container}
						value={totalInvested}
						formatString
						suffix="PLN"
						// Upewnij się, że ValueCard potrafi przyjmować motyw ciemny
						className="text-white"
					/>
					<ValueCard label="Całkowity Wynik (P&L)" className="text-white">
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
				</div>
			</div>
		</header>
	);
}

// Prosty Dummy Komponent dla ValueCard na wypadek gdybyś go tu potrzebował wkleić wewnętrznie
// import { ValueCard } from "./shared/ValueCard";
