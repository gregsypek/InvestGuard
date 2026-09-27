"use client";

import {
	Activity,
	Banknote,
	Briefcase,
	ChevronLeft,
	ChevronRight,
	Container,
	Globe,
	LineChart,
	Loader2,
	Maximize2,
	Minimize2,
	Plus,
	Settings,
	Wallet2,
	WalletCards,
} from "lucide-react";
import { SimulatedSnapshot, useDashboardData } from "./ui/useDashboardData";
import { cn, getStockLogo } from "@/lib/utils";
import { useEffect, useMemo, useRef, useState } from "react";

import { AbsoluteDailyPnLChart } from "./dashboard/AbsoluteDailyPnLChart";
import { DatePickerWithRange } from "./shared/DatePickerWithRange";
import { FilterBadge } from "./shared/FilterBadge";
import Link from "next/link";
import { MarketRow } from "./home/MarketRow";
import { PortfolioBenchmarkChart } from "./dashboard/PortfolioBenchmarkChart";
// Komponenty UI
import { PortfolioChart } from "./dashboard/PortfolioCharts";
// IMPORT HOOKA LOGIKI
import { PortfolioWithAssets } from "@/lib/types";
import { PortfoliosComparisonChart } from "./dashboard/PortfoliosComparisonChart";
import { PremiumMarketCard } from "./home/PremiumMarketCard";
import { SectionLayout } from "./shared/SectionLayout";
import { ValueCard } from "./shared/ValueCard";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils/format-currency";
import { pl } from "date-fns/locale";

const TIME_RANGES = ["1W", "1M", "3M", "YTD", "1Y", "3Y", "5Y", "MAX"];
const GLOBAL_INDICES_MAP: Record<string, string> = {
	SP500: "S&P 500",
	NASDAQ: "NASDAQ 100",
	WIG20: "WIG20",
	DAX: "DAX 40",
	GOLD: "Złoto (XAU/USD)",
	BTC: "Bitcoin",
};

interface UserDashboardProps {
	portfolios: PortfolioWithAssets[];
	snapshots: SimulatedSnapshot[];
	realSnapshots?: SimulatedSnapshot[];
	userIndices?: string[];
	indexQuotes?: Record<string, number>;
	lastUpdated?: string | null;
	currentRange?: string;
	indexQuotesHistory?: Record<string, Record<string, number>>;
}

export function UserDashboard(props: UserDashboardProps) {
	// 1. ZACIĄGAMY CAŁĄ LOGIKĘ Z HOOKA
	const {
		isPending,
		dataMode,
		setDataMode,
		chartMode,
		setChartMode,
		selectedIds,
		activeRange,
		fromDate,
		toDate,
		togglePortfolio,
		handleRangeChange,
		handleDateRangeSelect,
		isRangeDisabled,
		filteredTransactions,
		activePortfolios,
		totalInvested,
		totalCurrent,
		totalPnL,
		totalPnLPct,
		observedAssets,
		portfolioChartData,
		absoluteChartData,
		benchmarkChartData,
		portfoliosComparisonData,
	} = useDashboardData(props);

	const [showAdvancedToolbar, setShowAdvancedToolbar] = useState(true);

	// 🚀 NOWE: Paginacja portfeli (Responsywna: 3 na mobile, 6 na PC)
	const [portfolioPage, setPortfolioPage] = useState(0);
	const [itemsPerPage, setItemsPerPage] = useState(3); // Domyślnie 3 dla SSR/Mobile

	// Śledzimy rozmiar okna, by dostosować liczbę pigułek
	useEffect(() => {
		const handleResize = () => {
			// Jeśli ekran ma min. 1028px (Tailwind 'md'), pokazujemy 6 portfeli. Inaczej 3.
			setItemsPerPage(window.innerWidth >= 1028 ? 6 : 3);
		};

		// Wywołaj od razu po załadowaniu
		handleResize();

		// Nasłuchuj zmian rozmiaru okna (np. obrót telefonu)
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	// Łączymy "Wszystkie" z resztą portfeli w jedną listę
	const allPortfolioOptions = useMemo(() => {
		return [
			{ id: "ALL", name: "Wszystkie" },
			...props.portfolios.map((p) => ({ id: p.id, name: p.name })),
		];
	}, [props.portfolios]);

	const totalPages = Math.ceil(allPortfolioOptions.length / itemsPerPage);
	// Jeśli portfolioPage wykracza poza zakres, React po prostu użyje poprawnej wartości.
	const safePortfolioPage =
		totalPages > 0 ? Math.min(portfolioPage, totalPages - 1) : 0;

	// Wycinamy odpowiednią ilość sztuk dla aktualnej (bezpiecznej) strony
	const visiblePortfolios = allPortfolioOptions.slice(
		safePortfolioPage * itemsPerPage,
		(safePortfolioPage + 1) * itemsPerPage,
	);

	// 3. RENDEROWANIE WIDOKU
	return (
		<div className="space-y-8">
			{/* HEADER */}
			<header className="relative overflow-hidden flex flex-col gap-4 md:gap-8 w-full border-b border-white/10 bg-slate-900 rounded-b-2xl text-slate-100 p-6 md:p-8 shadow-lg">
				<div className="relative z-10">
					<h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white drop-shadow-sm mb-3">
						Przegląd Inwestycji
					</h1>
					<div className="flex flex-wrap items-center gap-2 mt-2">
						<span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">
							Wybierz, aby porównać:
						</span>
						<div className="flex gap-3 flex-wrap">
							<FilterBadge
								id="ALL"
								label="Wszystkie Portfele"
								isSelected={selectedIds.includes("ALL")}
								onToggle={togglePortfolio}
							/>
							{props.portfolios.map((p) => (
								<FilterBadge
									key={p.id}
									id={p.id}
									label={p.name}
									isSelected={selectedIds.includes(p.id)}
									onToggle={togglePortfolio}
									className="text-blue-300"
								/>
							))}
						</div>
					</div>
				</div>

				<div className="relative z-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-4 md:gap-8 pt-4">
					<div className="space-y-1">
						<div className="flex items-center gap-1.5 text-slate-400 font-bold tracking-widest text-[10px] uppercase mb-1">
							<Wallet2 className="w-3.5 h-3.5" />
							<span>Wartość Zaznaczonych</span>
						</div>
						<div className="flex items-baseline gap-2">
							<h2 className="text-5xl md:text-6xl font-black tracking-tighter text-white">
								{formatCurrency(totalCurrent)}
							</h2>
							<span className="text-xl md:text-2xl text-slate-500 font-bold">
								PLN
							</span>
						</div>
					</div>
					<div className="flex self-start sm:justify-end flex-wrap gap-4 md:gap-12 overflow-x-auto no-scrollbar">
						<ValueCard
							label="Zainwestowany kapitał"
							icon={Container}
							value={totalInvested}
							formatString
							suffix="PLN"
						/>
						<ValueCard label="Całkowity Wynik (P&L)">
							<div className="flex items-center gap-2 font-mono">
								<span
									className={cn(
										"text-xl font-bold tracking-tight transition-colors",
										totalPnL > 0
											? // EN: Dark background allows for neon glow effects
												"text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]"
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
										"flex items-center text-xs font-bold px-2 py-0.5 rounded-sm transition-colors",
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

			{/* RADAR RYNKOWY */}
			<SectionLayout
				title="Radar Rynkowy"
				titleIcon={Activity}
				subtitle="Śledź kluczowe wskaźniki"
				description="Zestawienie indeksów i walorów z Twojego portfela."
			>
				<div className="flex flex-col  gap-6">
					{/* PORTFOLIO ASSETS COLUMN */}
					<div className="flex-1 p-5">
						<div className="flex justify-between items-center mb-5">
							<h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
								<Briefcase className="w-4 h-4 text-blue-500" /> Z Portfela
							</h4>

							<Link href="/settings" className="text-blue-500 hover:underline">
								<Settings className="w-4 h-4" />
							</Link>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 flex-1">
							{observedAssets.length > 0 ? (
								observedAssets.map((asset) => (
									<PremiumMarketCard
										key={asset.id}
										name={asset.name}
										ticker={asset.ticker}
										change={asset.dailyChange || 0}
										logo={getStockLogo(asset.ticker ?? "")}
									/>
								))
							) : (
								/* Premium Empty State */
								<div className="flex flex-col items-center justify-center py-10 text-center border border-dashed rounded-xl border-slate-700/50 bg-slate-800/20 group hover:border-blue-500/50 transition-colors cursor-pointer">
									<div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
										<Plus className="w-4 h-4 text-blue-500" />
									</div>
									<p className="text-xs font-bold opacity-60 mb-1">
										Brak aktywów na radarze
									</p>
									<p className="text-[10px] text-slate-500 max-w-[200px]">
										Kliknij ikonę zębatki powyżej, aby wybrać walory do
										obserwacji.
									</p>
								</div>
							)}
						</div>
					</div>
					<div>
						{/* MACRO INDICATORS COLUMN */}
						{props.userIndices && props.userIndices.length > 0 && (
							<div className="flex-1 p-5">
								<div className="flex justify-between items-center mb-5">
									<h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
										<Globe className="w-4 h-4 text-amber-500" /> Wskaźniki Makro
									</h4>

									<Link
										href="/settings"
										className="text-blue-500 hover:underline"
									>
										<Settings className="w-4 h-4" />
									</Link>
								</div>

								<div className="flex justify-between flex-wrap gap-2.5">
									{props.userIndices.map((indexId) => {
										const changeValue = props.indexQuotes?.[indexId] || 0;

										// 🚀 Pobieramy tablicę samych wycen z historii dla konkretnego indexId
										const historyObject =
											props.indexQuotesHistory?.[indexId] || {};
										// Sortujemy po datach (kluczach) i wyciągamy same wartości
										const historyArray = Object.keys(historyObject)
											.sort()
											.map((dateKey) => historyObject[dateKey]);

										return (
											<PremiumMarketCard
												key={indexId}
												name={GLOBAL_INDICES_MAP[indexId] || indexId}
												change={changeValue}
												historyData={historyArray}
												logo={getStockLogo(indexId)}
											/>
										);
									})}
								</div>
							</div>
						)}
					</div>
				</div>
			</SectionLayout>
			{/* === STICKY HEADER (Zawsze na górze, stała szerokość) === */}
			<div className="sticky top-0 z-50 bg-t-bg-base/90 backdrop-blur-md md:border-b md:border-t-border-subtle md:shadow-sm py-2 px-4 sm:px-6 md:px-8 transition-all duration-300 w-full rounded-b-md">
				<div className="flex flex-col gap-2 max-w-7xl mx-auto w-full">
					{/* 1. ZWIJANY PANEL ZAAWANSOWANY (Otwarty domyślnie, reaguje tylko na przycisk) */}
					{showAdvancedToolbar && (
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full animate-in fade-in slide-in-from-top-1 pb-1">
							{/* Kwota i PnL */}
							<div className="flex items-center gap-2 shrink-0">
								<span className="text-[10px] font-bold text-t-text-tertiary uppercase tracking-widest hidden sm:block">
									Zaznaczone:
								</span>
								<div className="flex items-baseline gap-1">
									<span className="text-sm font-black text-t-text-primary tracking-tight">
										{formatCurrency(totalCurrent)}
									</span>
									<span className="text-[9px] text-t-text-secondary font-bold">
										PLN
									</span>
								</div>
								<div
									className={cn(
										"px-1.5 py-0.5 rounded text-[10px] font-black transition-colors",
										totalPnLPct > 0
											? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
											: totalPnLPct < 0
												? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
												: "bg-black/5 dark:bg-white/5 text-t-text-secondary",
									)}
								>
									{totalPnLPct > 0 ? "+" : ""}
									{totalPnLPct.toFixed(2)}%
								</div>
							</div>

							{/* Wybór portfeli (Twarda Paginacja: 4 na stronę) */}
							{/*  */}
							{/* Wybór portfeli (Twarda Paginacja: 4 na stronę) */}
							<div className="flex items-center gap-1 sm:justify-end w-full min-w-0">
								{/* Lewa strzałka */}
								{totalPages > 1 && (
									<button
										// 🚀 ZMIANA: Używamy safePortfolioPage do obliczeń
										onClick={() => setPortfolioPage(safePortfolioPage - 1)}
										disabled={safePortfolioPage === 0}
										className={cn(
											"shrink-0 p-1 rounded-full bg-black/5 dark:bg-white/5 border transition-all",
											safePortfolioPage === 0
												? "opacity-30 cursor-not-allowed border-transparent text-t-text-tertiary"
												: "border-t-border text-t-text-tertiary hover:text-t-text-primary",
										)}
									>
										<ChevronLeft className="w-3.5 h-3.5" />
									</button>
								)}

								{/* Sztywny kontener bez scrolla */}
								<div className="flex flex-wrap items-center gap-1.5 overflow-hidden px-1">
									{visiblePortfolios.map((opt) => (
										<FilterBadge
											key={opt.id}
											id={opt.id}
											label={opt.name}
											isSelected={selectedIds.includes(opt.id)}
											onToggle={togglePortfolio}
											className={cn(
												"py-0.5 px-2 text-[9px] font-bold uppercase tracking-widest rounded-md transition-all border shrink-0",
												selectedIds.includes(opt.id)
													? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
													: "bg-transparent text-t-text-secondary border-t-border hover:border-t-border-subtle",
											)}
										/>
									))}
								</div>

								{/* Prawa strzałka */}
								{totalPages > 1 && (
									<button
										// 🚀 ZMIANA: Używamy safePortfolioPage do obliczeń
										onClick={() => setPortfolioPage(safePortfolioPage + 1)}
										disabled={safePortfolioPage === totalPages - 1}
										className={cn(
											"shrink-0 p-1 rounded-full bg-black/5 dark:bg-white/5 border transition-all",
											safePortfolioPage === totalPages - 1
												? "opacity-30 cursor-not-allowed border-transparent text-t-text-tertiary"
												: "border-t-border text-t-text-tertiary hover:text-t-text-primary",
										)}
									>
										<ChevronRight className="w-3.5 h-3.5" />
									</button>
								)}
							</div>
						</div>
					)}

					{/* 2. GŁÓWNY PASEK NARZĘDZI (Zawsze widoczny) */}
					<div className="flex flex-wrap xl:flex-nowrap items-center justify-between gap-2 w-full">
						{/* Lewa Strona: Tryby wyświetlania */}
						<div className="flex items-center gap-1 p-1 shrink-0">
							<FilterBadge
								id="VALUE"
								label="PLN"
								isSelected={chartMode === "VALUE"}
								onToggle={() => setChartMode("VALUE")}
								className={cn(
									"py-1 px-2.5 text-[9px] font-bold rounded-md transition-all",
									chartMode === "VALUE"
										? "bg-t-bg-base text-t-text-primary shadow-sm dark:text-blue-400"
										: "text-t-text-tertiary",
								)}
							/>
							<FilterBadge
								id="PERCENTAGE"
								label="%"
								isSelected={chartMode === "PERCENTAGE"}
								onToggle={() => setChartMode("PERCENTAGE")}
								className={cn(
									"py-1 px-2.5 text-[9px] font-bold rounded-md transition-all",
									chartMode === "PERCENTAGE"
										? "bg-t-bg-base text-t-text-primary shadow-sm dark:text-blue-400"
										: "text-t-text-tertiary",
								)}
							/>
						</div>

						<div className="flex items-center gap-1 shrink-0">
							<FilterBadge
								id="REAL"
								label="Realne"
								isSelected={dataMode === "REAL"}
								onToggle={() => setDataMode("REAL")}
								className={cn(
									"py-1 px-2.5 text-[9px] font-bold rounded-md transition-all",
									dataMode === "REAL"
										? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
										: "bg-transparent text-t-text-secondary border-t-border hover:border-t-border-subtle",
								)}
							/>
							<FilterBadge
								id="SIMULATED"
								label="Symulacja"
								isSelected={dataMode === "SIMULATED"}
								onToggle={() => setDataMode("SIMULATED")}
								className={cn(
									"py-1 px-2.5 text-[9px] font-bold rounded-md transition-all",
									dataMode === "SIMULATED"
										? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
										: "bg-transparent text-t-text-secondary border-t-border hover:border-t-border-subtle",
								)}
							/>
						</div>

						{/* Prawa Strona: Zakresy czasu i Kontrolki */}
						<div className="flex items-center justify-between sm:justify-end gap-1 w-full md:w-auto overflow-x-auto scrollbar-hide">
							<div className="flex items-center gap-0.5 bg-black/5 dark:bg-white/5 p-0.5 rounded-lg border border-t-border">
								{TIME_RANGES.map((range) => (
									<button
										key={range}
										onClick={() =>
											!isRangeDisabled(range) && handleRangeChange(range)
										}
										disabled={isRangeDisabled(range)}
										className={cn(
											"px-2 py-1 rounded-md text-[9px] font-bold tracking-wide transition-all shrink-0",
											isRangeDisabled(range)
												? "opacity-30 cursor-not-allowed text-t-text-tertiary"
												: activeRange === range
													? "bg-t-bg-base text-t-text-primary shadow-sm"
													: "text-t-text-secondary hover:text-t-text-primary",
										)}
									>
										{range}
									</button>
								))}
							</div>

							<div className="shrink-0 ml-1">
								<DatePickerWithRange
									from={fromDate}
									to={toDate}
									onSelect={handleDateRangeSelect}
								/>
							</div>

							{/* Zwijanie panelu - Zunifikowany przycisk */}
							<button
								onClick={() => setShowAdvancedToolbar(!showAdvancedToolbar)}
								className="p-1.5 ml-1 rounded-lg bg-black/5 dark:bg-white/5 border border-t-border text-t-text-secondary hover:text-t-text-primary transition-all shrink-0"
								title={
									showAdvancedToolbar
										? "Zwiń podsumowanie"
										: "Rozwiń podsumowanie"
								}
							>
								{showAdvancedToolbar ? (
									<Minimize2 className="w-3.5 h-3.5" />
								) : (
									<Maximize2 className="w-3.5 h-3.5" />
								)}
							</button>
						</div>
					</div>
				</div>
			</div>
			{/* WYKRESY */}
			<div className="relative space-y-8">
				{isPending && (
					<div className="absolute inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] rounded-3xl transition-all duration-300">
						<div className="sticky top-[40vh] flex items-center justify-center">
							<div className="flex flex-col items-center gap-3 bg-slate-900/90 border border-slate-700/50 p-4 rounded-2xl shadow-2xl">
								<Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
								<span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
									Przeliczanie...
								</span>
							</div>
						</div>
					</div>
				)}

				<SectionLayout
					title="Analiza Wykresowa"
					titleIcon={LineChart}
					subtitle="Sprawdź wyniki swoich inwestycji w czasie"
					description="Ten wykres przedstawia zmianę wartości Twoich inwestycji w czasie. Linia przerywana oznacza fizycznie wpłacony kapitał. Możesz płynnie przełączać się między klasycznym widokiem kwotowym (PLN), a widokiem procentowym (%), który najlepiej oddaje faktyczną wydajność (stopę zwrotu) Twojego portfela. Punkty na linii wykresu to dokonane w tym czasie transakcje."
				>
					<div className="h-[400px] w-full mt-6">
						<PortfolioChart
							data={portfolioChartData}
							transactions={filteredTransactions}
							mode={chartMode}
						/>
					</div>
				</SectionLayout>

				<SectionLayout
					title="Nominalny Wynik Dzienny"
					titleIcon={Banknote}
					subtitle="Faktyczna kwota wypracowana na rynku"
					description="Wykres przedstawia dokładną kwotę w PLN, o jaką zmieniła się wartość Twoich aktywów danego dnia. Obliczenia ignorują Twoje wpłaty i wypłaty z tego dnia, pokazując czystą skuteczność portfela."
				>
					<div className="h-64 mt-6">
						<AbsoluteDailyPnLChart key={chartMode} data={absoluteChartData} />
					</div>
				</SectionLayout>

				<SectionLayout
					title="Wyścig Portfeli"
					titleIcon={WalletCards}
					subtitle="Porównanie Strategii"
					description={`Wykres przedstawiający zestawienie wyników poszczególnych portfeli. Użyj przycisków na górnym pasku, aby przełączyć się między trybem procentowym a wartością w PLN.`}
				>
					<div className="h-72 mt-6">
						<PortfoliosComparisonChart
							key={`compare-${chartMode}`}
							data={portfoliosComparisonData}
							portfolios={props.portfolios}
							activeIds={selectedIds}
							chartMode={chartMode}
						/>
					</div>
				</SectionLayout>

				<SectionLayout
					title="Porównanie z Rynkiem"
					titleIcon={Globe}
					subtitle="Portfel vs Indeksy"
					description="Wykres przedstawia skumulowaną stopę zwrotu Twojego portfela w wybranym czasie, porównaną z wybranymi przez Ciebie indeksami światowymi. Wszystkie wartości startują od zera, co pozwala na obiektywną ocenę siły Twoich inwestycji względem szerokiego rynku."
				>
					<div className="h-72 mt-6">
						<PortfolioBenchmarkChart
							key={chartMode}
							data={benchmarkChartData}
							userIndices={props.userIndices || []}
						/>
					</div>
				</SectionLayout>
			</div>
		</div>
	);
}
