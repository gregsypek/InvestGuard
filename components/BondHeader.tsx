import {
	Banknote,
	ChevronLeft,
	History,
	ShieldCheck,
	TrendingUp,
} from "lucide-react";

import Link from "next/link";
import { ValueCard } from "./shared/ValueCard";

export interface BondHeaderStats {
	totalInvested: string;
	currentValue: string;
	profit: string;
	avgYield: string;
}

interface BondHeaderProps {
	title: string;
	totalBonds: number;
	portfolioName?: string;
	stats: BondHeaderStats;
	customBreadcrumbs?: React.ReactNode;
	backHref?: string;
}

export function BondHeader({
	title,
	totalBonds,
	portfolioName,
	stats,
	customBreadcrumbs,
	backHref,
}: BondHeaderProps) {
	return (
		<header className="relative overflow-hidden flex flex-col gap-8 w-full bg-slate-900  text-slate-100 p-6 md:p-8 border-b border-white/10 dark:border-t-border rounded-b-2xl transition-colors">
			{/* --- TEKSTURA SVG (Szmaragdowe linie/wykresy) --- */}
			<div
				className="absolute inset-0 z-0 pointer-events-none opacity-40 dark:opacity-30 transition-opacity"
				style={{
					backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg stroke='%2310b981' stroke-width='1.5' stroke-opacity='0.4'%3E%3Cline x1='15' y1='20' x2='15' y2='60'/%3E%3Crect x='11' y='30' width='8' height='20' fill='%2310b981' fill-opacity='0.3'/%3E%3Cline x1='35' y1='40' x2='35' y2='80'/%3E%3Crect x='31' y='50' width='8' height='15' fill='none'/%3E%3Cline x1='55' y1='10' x2='55' y2='45'/%3E%3Crect x='51' y='15' width='8' height='25' fill='%2310b981' fill-opacity='0.6'/%3E%3Cline x1='75' y1='30' x2='75' y2='70'/%3E%3Crect x='71' y='45' width='8' height='10' fill='none'/%3E%3Cline x1='95' y1='50' x2='95' y2='90'/%3E%3Crect x='91' y='60' width='8' height='25' fill='%2310b981' fill-opacity='0.2'/%3E%3C/g%3E%3C/svg%3E")`,
					WebkitMaskImage:
						"radial-gradient(circle at 95% 2%, black 0%, transparent 20%)",
					maskImage:
						"radial-gradient(circle at 90% 2%, black 5%, transparent 20%)",
				}}
			/>

			{/* GÓRA: Nawigacja i Tytuł */}
			<div className="relative z-10">
				{customBreadcrumbs || (
					<nav className="flex items-center gap-2 text-sm text-slate-400 italic mb-2">
						{backHref && (
							<Link
								href={backHref}
								className="inline-flex items-center transition-all text-blue-500 hover:text-blue-400 cursor-pointer font-medium mr-1"
							>
								<ChevronLeft className="h-4 w-4" />
								<span>Wróć</span>
							</Link>
						)}
						{!backHref && <span>Obligacje</span>}
						<span className="text-slate-500">/</span>
						<span className="text-blue-400 font-medium">{portfolioName}</span>
					</nav>
				)}
				<div className="mt-2">
					<h1 className="text-3xl md:text-4xl font-black tracking-tighter lowercase flex items-center gap-3 drop-shadow-sm text-white">
						{title}
					</h1>
					<p className="text-slate-400 font-medium mt-1 text-sm md:text-base max-w-2xl flex items-center gap-2">
						<ShieldCheck className="h-4 w-4 text-blue-500" />
						<span>Bezpieczny kapitał i ochrona przed inflacją.</span>
					</p>
				</div>
			</div>

			{/* DÓŁ: Główne Statystyki */}
			<div className="relative z-10 flex flex-col xl:flex-row items-start xl:items-end justify-between gap-8 pb-2 md:pb-0">
				{/* GŁÓWNA KWOTA: Aktualna Wycena */}
				<div className="space-y-1 shrink-0">
					<div className="flex items-center gap-1.5 text-slate-400 font-bold tracking-widest text-[10px] uppercase mb-1">
						<Banknote className="w-3.5 h-3.5" />
						<span>Aktualna Wycena (Z odsetkami)</span>
					</div>
					<div className="flex items-baseline gap-2">
						<h2 className="text-5xl md:text-6xl font-black tracking-tighter text-white drop-shadow-sm">
							{stats.currentValue}
						</h2>
						<span className="text-xl md:text-2xl text-slate-500 font-bold uppercase">
							PLN
						</span>
					</div>
				</div>

				{/* PRAWA STRONA: Małe karty ze statystykami */}
				<div className="flex flex-wrap xl:justify-end gap-4 md:gap-6">
					<ValueCard label="Wkład własny" icon={ShieldCheck}>
						<div className="flex items-baseline gap-1.5 font-mono">
							<span className="text-xl font-bold tracking-tight text-slate-200">
								{stats.totalInvested}
							</span>
							<span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
								PLN
							</span>
						</div>
					</ValueCard>

					<ValueCard label="Zysk (Odsetki)" icon={TrendingUp}>
						<div className="flex items-baseline gap-1.5 font-mono">
							<span className="text-xl font-bold tracking-tight text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]">
								+{stats.profit}
							</span>
							<span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
								PLN
							</span>
						</div>
					</ValueCard>

					<ValueCard label="Aktywne serie" icon={History}>
						<div className="flex items-baseline gap-1.5 font-mono">
							<span className="text-xl font-bold tracking-tight text-white">
								{totalBonds}
							</span>
							<span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
								szt.
							</span>
						</div>
					</ValueCard>
				</div>
			</div>
		</header>
	);
}
