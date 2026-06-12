"use client";

import {
	Activity,
	Briefcase,
	Container,
	Globe,
	LineChart,
	ShieldCheck,
	Wallet2,
	Zap,
} from "lucide-react";
import { Asset, PortfolioWithAssets } from "@/lib/types";
import { useMemo, useState } from "react";

import { DailyPnLChart } from "./dashboard/DailyPnLChart";
import { FilterBadge } from "./shared/FilterBadge";
import { PortfolioChart } from "./dashboard/PortfolioCharts";
import { SectionLayout } from "./shared/SectionLayout";
import { cn } from "@/lib/utils";
import { format } from "date-fns"; // Dodane dla daty
import { pl } from "date-fns/locale"; // Dodane dla języka polskiego

// Słownik indeksów
const GLOBAL_INDICES_MAP: Record<string, string> = {
	SP500: "S&P 500",
	NASDAQ: "NASDAQ 100",
	WIG20: "WIG20",
	DAX: "DAX 40",
	GOLD: "Złoto (XAU/USD)",
	BTC: "Bitcoin",
};

// Zaktualizowany interfejs (dodane nowe pola)
interface UserDashboardProps {
	portfolios: PortfolioWithAssets[];
	snapshots: any[];
	userIndices?: string[];
	indexQuotes?: Record<string, number>;
	lastUpdated?: string | null;
}

export function UserDashboard({
	portfolios,
	snapshots,
	userIndices = [],
	indexQuotes = {},
	lastUpdated = null,
}: UserDashboardProps) {
	// 1. STAN: Które portfele są wybrane? Domyślnie wszystkie.
	const [selectedIds, setSelectedIds] = useState<string[]>(
		portfolios.map((p) => p.id),
	);

	const aggregatedChartData = useMemo(() => {
		// Struktura: { "2026-06-08": { "portfolio1": { total: 10000, invested: 8000 } } }
		const dailyPortfolioValues: Record<
			string,
			Record<string, { total: number; invested: number }>
		> = {};

		snapshots.forEach((snap) => {
			if (selectedIds.includes(snap.portfolioId)) {
				const dateKey = new Date(snap.date).toISOString().split("T")[0];

				if (!dailyPortfolioValues[dateKey]) {
					dailyPortfolioValues[dateKey] = {};
				}

				// Zapisujemy najświeższe wartości z danego dnia
				dailyPortfolioValues[dateKey][snap.portfolioId] = {
					total: snap.totalValue,
					invested: snap.investedValue, // Dodajemy pobieranie wpłaconego kapitału
				};
			}
		});

		// Sumujemy obie wartości dla każdego dnia
		return Object.entries(dailyPortfolioValues).map(([date, portfoliosMap]) => {
			let totalForDay = 0;
			let investedForDay = 0;

			Object.values(portfoliosMap).forEach((vals) => {
				totalForDay += vals.total;
				investedForDay += vals.invested;
			});

			return {
				date,
				value: totalForDay,
				invested: investedForDay,
			};
		});
	}, [snapshots, selectedIds]);

	// Wyliczamy dzienną zmienność (różnica między dniem N a N-1)
	const dailyPnLData = useMemo(() => {
		if (!aggregatedChartData || aggregatedChartData.length < 2) return [];

		const result = [];
		// Zaczynamy od i = 1, bo dla dnia 0 nie mamy dnia wczorajszego do porównania
		for (let i = 1; i < aggregatedChartData.length; i++) {
			const prev = aggregatedChartData[i - 1].value;
			const curr = aggregatedChartData[i].value;
			const diff = curr - prev;

			result.push({
				date: aggregatedChartData[i].date,
				change: diff,
				isPositive: diff >= 0,
			});
		}
		return result;
	}, [aggregatedChartData]);

	// EN: Extract unique assets for the "Observed Markets" widget
	const observedAssets = useMemo(() => {
		if (!portfolios || portfolios.length === 0) return [];

		const allAssets = portfolios.flatMap((p) => p.assets || []);

		// EN: Filter out bonds and cash, and strictly include only observed assets
		const riskAssets = allAssets.filter(
			(a) =>
				a.category !== "BONDS" &&
				a.category !== "CASH" &&
				a.isObserved === true,
		);

		const uniqueAssets = [];
		const seenIdentifiers = new Set();

		for (const asset of riskAssets) {
			// EN: Prioritize name over ticker
			const identifier = asset.name || asset.ticker;

			if (!seenIdentifiers.has(identifier)) {
				seenIdentifiers.add(identifier);
				uniqueAssets.push(asset);
			}
		}

		// EN: Return all unique observed assets since limits are handled in Settings
		return uniqueAssets;
	}, [portfolios]);

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
			<header className="relative overflow-hidden flex flex-col gap-8 w-full border-b border-white/10  bg-slate-900 dark:border-t-border rounded-b-2xl  text-slate-100 p-6 md:p-8  transition-colors shadow-lg ">
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
						<span className="text-xs font-bold text-slate-400 uppercase flex-1 md:grow  tracking-wider mr-2">
							Analizowane portfele (Wybierz, aby porównać):
						</span>
						<div className="flex gap-3 flex-wrap">
							{portfolios.map((p) => (
								<FilterBadge
									key={p.id}
									id={p.id}
									label={p.name}
									isSelected={selectedIds.includes(p.id)}
									onToggle={togglePortfolio}
								/>
							))}
						</div>
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
			{/* DOLNA CZĘŚĆ (Wykresy) */}
			{/* ========================================================= */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* LEWA KOLUMNA */}
				<div className="lg:col-span-2 flex flex-col gap-6">
					<SectionLayout
						title="Historia Wartości Portfela"
						titleIcon={LineChart}
						subtitle="Śledź długoterminowy trend swojego majątku oraz dzienną zmienność rynkową."
						description="Wykres prezentuje wartość rynkową wybranych portfeli (powierzchnia) względem włożonego kapitału (linia przerywana). Dane nie są przeliczane w czasie rzeczywistym – system generuje je w formie automatycznych, nocnych migawek. Transakcje i wpłaty z dnia dzisiejszego zostaną uwzględnione na wykresie jutro rano."
					>
						<div className="flex flex-col gap-6">
							{/* GŁÓWNY WYKRES WARTOŚCI - Nadana sztywna wysokość h-[320px] dla Recharts */}
							<div className="bg-white/5 dark:bg-t-bg-panel border border-t-border rounded-2xl p-6 h-[320px]">
								<PortfolioChart data={aggregatedChartData} />
							</div>

							{/* WYKRES DZIENNEJ ZMIENNOŚCI (P&L) - Zastosowany układ flex, by wewnętrzny div poprawnie przekazał wysokość */}
							{dailyPnLData && dailyPnLData.length > 0 && (
								<div className="bg-white/5 dark:bg-t-bg-panel border border-t-border rounded-2xl p-6 h-[250px] flex flex-col">
									<div className="mb-3">
										<p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
											Dzienna Zmienność (P&L)
										</p>
									</div>
									<div className="flex-1 w-full">
										<DailyPnLChart data={dailyPnLData} />
									</div>
								</div>
							)}
						</div>
					</SectionLayout>
				</div>
				{/* PRAWA KOLUMNA */}
				<div className="flex flex-col gap-6">
					<SectionLayout
						title="Radar Rynkowy"
						titleIcon={Activity}
						subtitle="Śledź kluczowe wskaźniki i wybrane aktywa."
						description="Zestawienie globalnych indeksów makroekonomicznych oraz wytypowanych walorów z Twojego portfela."
					>
						<div className="flex flex-col gap-6">
							{/* SEKCJA 1: GLOBALNE INDEKSY */}
							{userIndices && userIndices.length > 0 && (
								<div className=" bg-t-bg-sticky border border-t-border rounded-3xl p-5 shadow-sm">
									<div className="flex items-center justify-between mb-4">
										<h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
											<Globe className="w-4 h-4 text-amber-500" /> Wskaźniki
											Makro
										</h4>

										{/* ZNACZNIK CZASU AKTUALIZACJI */}
										{lastUpdated && (
											<span className="text-[9px] font-bold text-slate-400 bg-t-bg-sticky px-2 py-0.5 rounded-md flex items-center gap-1 border border-slate-700/50">
												<div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 animate-pulse" />
												{format(new Date(lastUpdated), "HH:mm, dd MMM", {
													locale: pl,
												})}
											</span>
										)}
									</div>

									<div className="space-y-4">
										{userIndices.map((indexId) => {
											const indexName = GLOBAL_INDICES_MAP[indexId] || indexId;
											const changeValue = indexQuotes[indexId] || 0;
											const isPositive = changeValue >= 0;
											const displayValue =
												changeValue !== 0
													? `${isPositive ? "+" : ""}${changeValue.toFixed(2)}%`
													: "0.00%";

											return (
												<MarketRow
													key={indexId}
													name={indexName}
													value={displayValue}
													isPositive={isPositive}
												/>
											);
										})}
									</div>
								</div>
							)}

							{/* SEKCJA 2: AKTYWA Z PORTFELA */}
							<div className="bg-t-bg-sticky border border-t-border rounded-3xl p-5 shadow-sm flex-1">
								<h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
									<Briefcase className="w-4 h-4 text-blue-500" /> Z Twojego
									Portfela
								</h4>

								<div className="space-y-4">
									{observedAssets.length > 0 ? (
										observedAssets.map((asset) => {
											const changeValue = asset.dailyChange || 0;
											const isPositive = changeValue >= 0;
											const displayValue =
												changeValue !== 0
													? `${isPositive ? "+" : ""}${changeValue.toFixed(2)}%`
													: "0.00%";

											return (
												<MarketRow
													key={asset.id}
													name={asset.name}
													value={displayValue}
													isPositive={isPositive}
												/>
											);
										})
									) : (
										<div className="flex flex-col items-center justify-center py-6 opacity-50 text-center space-y-2">
											<p className="text-xs font-bold uppercase tracking-widest text-t-text-tertiary">
												Brak aktywów
											</p>
											<p className="text-[10px] text-t-text-tertiary px-4 leading-relaxed">
												Przejdź do ustawień, aby wybrać walory do obserwacji.
											</p>
										</div>
									)}
								</div>
							</div>
						</div>
					</SectionLayout>
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
