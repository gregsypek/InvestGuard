"use client";

import {
	Activity,
	CheckCircle2,
	Circle,
	Container,
	LineChart,
	ShieldCheck,
	Wallet2,
	Zap,
} from "lucide-react";
import { Asset, Portfolio } from "@/lib/types";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

// Interfejsy (Dopasuj do swoich typów)
interface UserDashboardProps {
	portfolios: Portfolio[]; // Możesz podmienić 'any' na swój typ Prisma
}

export function UserDashboard({ portfolios }: UserDashboardProps) {
	// 1. STAN: Które portfele są wybrane? Domyślnie wszystkie.
	const [selectedIds, setSelectedIds] = useState<string[]>(
		portfolios.map((p) => p.id),
	);

	// Funkcja do przełączania portfeli
	const togglePortfolio = (id: string) => {
		setSelectedIds((prev) =>
			prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id],
		);
	};

	// 2. OBLICZENIA: Reagują na zmianę wybranych portfeli
	const stats = useMemo(() => {
		let totalValue = 0;
		let totalInvested = 0;

		const activePortfolios = portfolios.filter((p) =>
			selectedIds.includes(p.id),
		);

		activePortfolios.forEach((portfolio) => {
			portfolio.assets.forEach((asset: Asset) => {
				totalValue += Number(asset.currentValue) || 0;
				totalInvested += Number(asset.investedCapital) || 0;
			});
		});

		const profitAmount = totalValue - totalInvested;
		const profitPercent =
			totalInvested > 0 ? (profitAmount / totalInvested) * 100 : 0;

		return { totalValue, totalInvested, profitAmount, profitPercent };
	}, [portfolios, selectedIds]);

	return (
		<div className="space-y-12 max-w-7xl mx-auto animate-in fade-in duration-500">
			{/* ========================================================= */}
			{/* GŁÓWNY NAGŁÓWEK (Twój design + Filtry Portfeli) */}
			{/* ========================================================= */}
			<header className="relative overflow-hidden flex flex-col gap-8 w-full border-b border-white/10  bg-slate-900 dark:border-t-border rounded-b-2xl  text-slate-100 p-6 md:p-8  transition-colors shadow-lg">
				{/* TEKSTURA SVG */}
				<div
					className="absolute inset-0 z-0 pointer-events-none opacity-40 transition-opacity"
					style={{
						backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg stroke='%2310b981' stroke-width='1.5' stroke-opacity='0.4'%3E%3Cline x1='15' y1='20' x2='15' y2='60'/%3E%3Crect x='11' y='30' width='8' height='20' fill='%2310b981' fill-opacity='0.3'/%3E%3Cline x1='35' y1='40' x2='35' y2='80'/%3E%3Crect x='31' y='50' width='8' height='15' fill='none'/%3E%3Cline x1='55' y1='10' x2='55' y2='45'/%3E%3Crect x='51' y='15' width='8' height='25' fill='%233b82f6' fill-opacity='0.6'/%3E%3Cline x1='75' y1='30' x2='75' y2='70'/%3E%3Crect x='71' y='45' width='8' height='10' fill='none'/%3E%3Cline x1='95' y1='50' x2='95' y2='90'/%3E%3Crect x='91' y='60' width='8' height='25' fill='%233b82f6' fill-opacity='0.2'/%3E%3C/g%3E%3C/svg%3E")`,
						WebkitMaskImage:
							"radial-gradient(circle at 95% 2%, black 0%, transparent 20%)",
						maskImage:
							"radial-gradient(circle at 90% 2%, black 5%, transparent 20%)",
					}}
				/>

				{/* GÓRA: Tytuł i FILTRY PORTFELI */}
				<div className="relative z-10">
					<h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white drop-shadow-sm mb-3 bg-slate-900">
						Przegląd Inwestycji
					</h1>

					{/* Interaktywne filtry */}
					<div className="flex flex-wrap items-center gap-2 mt-2">
						<span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">
							Analizowane portfele:
						</span>
						{portfolios.map((p) => {
							const isSelected = selectedIds.includes(p.id);
							return (
								<button
									key={p.id}
									onClick={() => togglePortfolio(p.id)}
									className={cn(
										"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 border hover:cursor-pointer",
										isSelected
											? "bg-blue-500/20 text-blue-300 border-blue-500/30 shadow-sm"
											: "bg-slate-900/50 text-slate-500 border-slate-700/50 hover:text-slate-300 hover:border-slate-600",
									)}
								>
									{isSelected ? (
										<CheckCircle2 className="w-3.5 h-3.5" />
									) : (
										<Circle className="w-3.5 h-3.5" />
									)}
									{p.name}
								</button>
							);
						})}
					</div>
				</div>

				{/* DÓŁ: Statystyki dynamiczne */}
				<div className="relative z-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-8 pt-4">
					<div className="space-y-1">
						<div className="flex items-center gap-1.5 text-slate-400 font-bold tracking-widest text-[10px] uppercase mb-1">
							<Wallet2 className="w-3.5 h-3.5" />
							<span>Wartość Zaznaczonych Portfeli</span>
						</div>
						<div className="flex items-baseline gap-2">
							<h2 className="text-5xl md:text-6xl font-black tracking-tighter text-white drop-shadow-sm">
								{stats.totalValue.toLocaleString("pl-PL", {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})}
							</h2>
							<span className="text-xl md:text-2xl text-slate-500 font-bold">
								PLN
							</span>
						</div>
					</div>

					<div className="flex self-start sm:justify-end flex-wrap gap-8 md:gap-12 overflow-x-auto no-scrollbar">
						<ValueCard
							label="Zainwestowany kapitał"
							icon={Container}
							value={stats.totalInvested}
							formatString
							suffix="PLN"
						/>
						<ValueCard label="Całkowity Wynik (P&L)">
							<div className="flex items-center gap-2 font-mono">
								<span
									className={cn(
										"text-xl font-bold tracking-tight transition-colors",
										stats.profitAmount > 0
											? "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]"
											: stats.profitAmount < 0
												? "text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]"
												: "text-slate-400",
									)}
								>
									{stats.profitAmount > 0 ? "+" : ""}
									{stats.profitAmount.toLocaleString("pl-PL", {
										minimumFractionDigits: 2,
									})}
								</span>
								<span
									className={cn(
										"flex items-center text-xs font-bold px-2 py-0.5 rounded-sm transition-colors",
										stats.profitPercent > 0
											? "bg-emerald-500/10 text-emerald-400"
											: stats.profitPercent < 0
												? "bg-rose-500/10 text-rose-500"
												: "bg-white/10 text-slate-300",
									)}
								>
									{stats.profitPercent > 0 ? "+" : ""}
									{stats.profitPercent.toFixed(2)}%
								</span>
							</div>
						</ValueCard>
					</div>
				</div>
			</header>

			{/* ========================================================= */}
			{/* DOLNA CZĘŚĆ (Zostawiona zgodnie z życzeniem - Layout) */}
			{/* ========================================================= */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* LEWA KOLUMNA */}
				<div className="lg:col-span-2 flex flex-col gap-6">
					<div className="bg-t-bg-panel border border-t-border-subtle rounded-3xl p-6 min-h-[350px] flex flex-col items-center justify-center border-dashed group">
						<LineChart className="w-10 h-10 text-t-text-tertiary mb-3 opacity-50 group-hover:scale-110 transition-transform" />
						<p className="text-sm font-bold uppercase tracking-widest text-t-text-secondary">
							Wykres Historii Portfela
						</p>
						<p className="text-xs text-t-text-tertiary mt-2">
							Wymaga wdrożenia modułu Snapshottingu.
						</p>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="bg-t-bg-panel border border-t-border-subtle rounded-3xl p-5 shadow-sm">
							<div className="flex items-center gap-2 mb-3">
								<div className="p-2 bg-blue-500/10 rounded-lg">
									<ShieldCheck className="w-4 h-4 text-blue-500" />
								</div>
								<h4 className="font-bold text-t-text-primary uppercase tracking-wide text-xs">
									Baza Pasywna
								</h4>
							</div>
							<p className="text-2xl font-black tracking-tighter text-t-text-primary mb-1">
								~95%
							</p>
							<p className="text-[11px] text-t-text-secondary leading-relaxed font-medium">
								Bezpiecznik portfela. Obligacje, metale szlachetne oraz ETF-y
								pracują jako fundament stabilności.
							</p>
						</div>

						<div className="bg-t-bg-panel border border-t-border-subtle rounded-3xl p-5 shadow-sm relative overflow-hidden">
							<div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/5 rounded-bl-full pointer-events-none" />
							<div className="flex items-center gap-2 mb-3">
								<div className="p-2 bg-amber-500/10 rounded-lg">
									<Zap className="w-4 h-4 text-amber-500" />
								</div>
								<h4 className="font-bold text-amber-500 uppercase tracking-wide text-xs">
									Alpha Booster
								</h4>
							</div>
							<p className="text-2xl font-black tracking-tighter text-t-text-primary mb-1">
								~5%
							</p>
							<p className="text-[11px] text-t-text-secondary leading-relaxed font-medium">
								Część spekulacyjna celująca w pobicie rynku. Aktywny przegląd
								sektorów wzrostowych.
							</p>
						</div>
					</div>
				</div>

				{/* PRAWA KOLUMNA */}
				<div className="flex flex-col gap-6">
					<div className="bg-t-bg-panel border border-t-border-subtle rounded-3xl p-6 flex flex-col">
						<h3 className="text-[11px] font-black uppercase tracking-widest text-t-text-primary mb-5 flex items-center gap-2">
							<Activity className="w-4 h-4 text-blue-500" /> Obserwowane Rynki
						</h3>
						<div className="space-y-4 flex-1">
							<MarketRow name="S&P 500" value="+1.20%" isPositive={true} />
							<MarketRow name="WIG20" value="-0.45%" isPositive={false} />
						</div>
					</div>

					{/* <div className="bg-t-bg-panel border border-t-border-subtle rounded-3xl p-6 border-l-4 border-l-blue-500">
						<h3 className="text-[11px] font-black uppercase tracking-widest text-t-text-primary mb-3 flex items-center gap-2">
							<BookOpen className="w-4 h-4 text-blue-500" /> Lekcja Inwestora
						</h3>
						<p className="text-xs font-bold text-blue-500 mb-1">
							Tip dnia: Rebalancing
						</p>
						<p className="text-xs text-t-text-secondary leading-relaxed font-medium">
							Regularne równoważenie kapitału wymusza systematyczną realizację
							zysków i utrzymanie bezpiecznego poziomu obligacji.
						</p>
					</div> */}

					{/* <div className="bg-t-bg-panel border border-t-border-subtle rounded-3xl p-6 border-l-4 border-l-amber-500">
						<h3 className="text-[11px] font-black uppercase tracking-widest text-t-text-primary mb-3 flex items-center gap-2">
							<Crosshair className="w-4 h-4 text-amber-500" /> Radar Okazji
						</h3>
						<p className="text-xs font-bold text-amber-500 mb-1">
							Na celowniku: Dino Polska
						</p>
						<p className="text-xs text-t-text-secondary leading-relaxed font-medium">
							Lider polskiego retailu po znacznej korekcie wyceny.
						</p>
					</div> */}
				</div>
			</div>
		</div>
	);
}

// =========================================================
// POMOCNICZE KOMPONENTY
// =========================================================
function ValueCard({
	label,
	icon: Icon,
	value,
	formatString,
	suffix,
	children,
}: any) {
	return (
		<div className="space-y-1">
			<div className="flex items-center gap-1.5 text-slate-400 font-bold tracking-widest text-[10px] uppercase mb-1">
				{Icon && <Icon className="w-3.5 h-3.5" />}
				<span>{label}</span>
			</div>
			{children ? (
				children
			) : (
				<div className="flex items-baseline gap-1.5">
					<span className="text-xl md:text-2xl font-bold text-white tracking-tight">
						{formatString
							? Number(value).toLocaleString("pl-PL", {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})
							: value}
					</span>
					{suffix && (
						<span className="text-xs text-slate-500 font-bold">{suffix}</span>
					)}
				</div>
			)}
		</div>
	);
}

function MarketRow({
	name,
	value,
	isPositive,
}: {
	name: string;
	value: string;
	isPositive: boolean;
}) {
	return (
		<div className="flex justify-between items-center border-b border-t-border-subtle pb-3 last:border-0 last:pb-0">
			<span className="text-sm font-bold text-t-text-secondary">{name}</span>
			<span
				className={`font-mono text-sm font-bold ${isPositive ? "text-emerald-500" : "text-rose-500"}`}
			>
				{value}
			</span>
		</div>
	);
}
