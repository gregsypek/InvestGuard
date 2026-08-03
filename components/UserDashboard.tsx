"use client";

import {
	Activity,
	Banknote,
	Briefcase,
	Container,
	Globe,
	LineChart,
	Loader2,
	Maximize2,
	Minimize2,
	Wallet2,
	WalletCards,
} from "lucide-react";
import { SimulatedSnapshot, useDashboardData } from "./ui/useDashboardData";
import { cn, getStockLogo } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

import { AbsoluteDailyPnLChart } from "./dashboard/AbsoluteDailyPnLChart";
import { DatePickerWithRange } from "./shared/DatePickerWithRange";
import { FilterBadge } from "./shared/FilterBadge";
import { MarketRow } from "./home/MarketRow";
import { PortfolioBenchmarkChart } from "./dashboard/PortfolioBenchmarkChart";
// Komponenty UI
import { PortfolioChart } from "./dashboard/PortfolioCharts";
// IMPORT HOOKA LOGIKI
import { PortfolioWithAssets } from "@/lib/types";
import { PortfoliosComparisonChart } from "./dashboard/PortfoliosComparisonChart";
import { SectionLayout } from "./shared/SectionLayout";
import { ValueCard } from "./shared/ValueCard";
import { format } from "date-fns";
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

	// 2. STAN DLA STICKY HEADERA
	const [isStuck, setIsStuck] = useState(false);
	const [showAdvancedToolbar, setShowAdvancedToolbar] = useState(true);
	// Referencja dla naszego "strażnika"
	const sentinelRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				setIsStuck(!entry.isIntersecting);
			},
			{ threshold: 0 },
		);
		if (sentinelRef.current) observer.observe(sentinelRef.current);
		return () => observer.disconnect();
	}, []);

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
								{totalCurrent.toLocaleString("pl-PL", {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})}
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
										"text-xl font-bold tracking-tight",
										totalPnL > 0
											? "text-emerald-400"
											: totalPnL < 0
												? "text-rose-500"
												: "text-slate-400",
									)}
								>
									{totalPnL > 0 ? "+" : ""}
									{totalPnL.toLocaleString("pl-PL", {
										minimumFractionDigits: 2,
									})}
								</span>
								<span
									className={cn(
										"text-xs font-bold px-2 py-0.5 rounded-sm",
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
				<div className="flex flex-col md:flex-row gap-6">
					<div className="bg-t-bg-sticky border rounded-3xl p-5 shadow-sm flex-1">
						<h4 className="text-[10px] font-bold uppercase text-slate-500 mb-4 flex items-center gap-2">
							<Briefcase className="w-4 h-4 text-blue-500" /> Z Portfela
						</h4>
						<div className="space-y-4">
							{observedAssets.length > 0 ? (
								observedAssets.map((asset) => (
									<MarketRow
										key={asset.id}
										name={asset.name}
										value={`${asset.dailyChange! >= 0 ? "+" : ""}${asset.dailyChange!.toFixed(2)}%`}
										isPositive={asset.dailyChange! >= 0}
										logo={getStockLogo(asset.ticker ?? "")}
									/>
								))
							) : (
								<p className="text-xs font-bold text-center opacity-50 py-4">
									Brak aktywów do obserwacji
								</p>
							)}
						</div>
					</div>
					<div className="flex-1">
						{props.userIndices && props.userIndices.length > 0 && (
							<div className="bg-t-bg-sticky border rounded-3xl p-5 shadow-sm">
								<h4 className="text-[10px] font-bold uppercase text-slate-500 mb-4 flex items-center gap-2">
									<Globe className="w-4 h-4 text-amber-500" /> Wskaźniki Makro
								</h4>
								<div className="space-y-4">
									{props.userIndices.map((indexId) => {
										const changeValue = props.indexQuotes?.[indexId] || 0;
										return (
											<MarketRow
												key={indexId}
												name={GLOBAL_INDICES_MAP[indexId] || indexId}
												value={`${changeValue >= 0 ? "+" : ""}${changeValue.toFixed(2)}%`}
												isPositive={changeValue >= 0}
												logo={`https://www.google.com/s2/favicons?domain=${indexId === "SP500" ? "spglobal.com" : "finance.yahoo.com"}&sz=128`}
											/>
										);
									})}
								</div>
							</div>
						)}
					</div>
				</div>
			</SectionLayout>

			{/* STICKY HEADER - PASEK NARZĘDZI */}
			<div
				ref={sentinelRef}
				className="h-px w-full invisible pointer-events-none"
			/>

			<div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-xl border border-slate-700/60 p-3 shadow-2xl rounded-2xl mx-1 my-4 flex flex-col justify-center">
				<div
					className={cn(
						"flex flex-col items-start xl:items-center justify-between gap-2",
						isStuck ? "xl:flex-col" : "xl:flex-row",
					)}
				>
					{isStuck && showAdvancedToolbar && (
						<div className="flex flex-col xl:flex-row items-start xl:items-center gap-4 w-full xl:w-auto border-b xl:border-b-0 xl:border-r border-slate-700/50 pb-3 xl:pb-0 xl:pr-5 justify-between xl:justify-start animate-in fade-in slide-in-from-left-4 duration-300">
							<div className="flex items-center justify-between gap-4 w-full xl:w-auto">
								<div className="flex flex-col xl:flex-row xl:items-center xl:gap-6">
									<span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5 xl:text-center">
										Wartość Zaznaczonych
									</span>
									<div className="flex items-baseline gap-1">
										<span className="text-base md:text-lg font-black text-white tracking-tight">
											{totalCurrent.toLocaleString("pl-PL", {
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											})}
										</span>
										<span className="text-[10px] text-slate-400 font-bold">
											PLN
										</span>
									</div>
								</div>
								<div
									className={cn(
										"px-2.5 py-1 rounded-md text-[11px] font-black tracking-wider flex items-center gap-1 shadow-sm shrink-0",
										totalPnLPct > 0
											? "bg-emerald-500/10 text-emerald-400"
											: totalPnLPct < 0
												? "bg-rose-500/10 text-rose-500"
												: "bg-slate-800 text-slate-300",
									)}
								>
									{totalPnLPct > 0 ? "+" : ""}
									{totalPnLPct.toFixed(2)}%
								</div>
							</div>
							<div className="flex gap-2 md:flex-wrap overflow-x-auto w-full scrollbar-hide">
								<FilterBadge
									id="ALL"
									label="Wszystkie"
									isSelected={selectedIds.includes("ALL")}
									onToggle={togglePortfolio}
									className="text-blue-300 py-1 px-2 text-[10px]"
								/>
								{props.portfolios.map((p) => (
									<FilterBadge
										key={p.id}
										id={p.id}
										label={p.name}
										isSelected={selectedIds.includes(p.id)}
										onToggle={togglePortfolio}
										className="text-blue-300 py-1 px-2 text-[10px]"
									/>
								))}
							</div>
						</div>
					)}
					{/* FILTRY TRYBU WYKRESU I ŹRÓDŁA DANYCH (Zawsze widoczne) */}

					<div className="flex flex-wrap items-center gap-3 justify-start transition-all duration-300 w-full xl:w-auto">
						<div className="flex items-center gap-1.5">
							<FilterBadge
								id="VALUE"
								label="PLN"
								isSelected={chartMode === "VALUE"}
								onToggle={() => setChartMode("VALUE")}
							/>
							<FilterBadge
								id="PERCENTAGE"
								label="%"
								isSelected={chartMode === "PERCENTAGE"}
								onToggle={() => setChartMode("PERCENTAGE")}
							/>
						</div>
						<div className="hidden sm:block w-px h-5 bg-slate-700/50" />
						<div className="flex items-center gap-1.5">
							<span className="hidden md:block text-[9px] font-bold text-slate-500 uppercase tracking-widest mr-1">
								Dane:
							</span>
							<FilterBadge
								id="REAL"
								label="Rzeczywiste"
								isSelected={dataMode === "REAL"}
								onToggle={() => setDataMode("REAL")}
								className={
									dataMode === "REAL"
										? "text-emerald-400 bg-emerald-500/10"
										: ""
								}
							/>
							<FilterBadge
								id="SIMULATED"
								label="Symulacja"
								isSelected={dataMode === "SIMULATED"}
								onToggle={() => setDataMode("SIMULATED")}
								className={
									dataMode === "SIMULATED"
										? "text-amber-400 bg-amber-500/10"
										: ""
								}
							/>
						</div>

						<div className="flex-1 flex justify-end">
							{isStuck && (
								<button
									onClick={() => setShowAdvancedToolbar(!showAdvancedToolbar)}
									className={cn(
										"p-2 rounded-lg transition-all duration-300 border",
										showAdvancedToolbar
											? "bg-slate-800 text-blue-400 border-slate-700"
											: "bg-transparent text-slate-500 border-transparent hover:text-slate-300",
									)}
								>
									{showAdvancedToolbar ? (
										<Minimize2 className="w-4 h-4" />
									) : (
										<Maximize2 className="w-4 h-4" />
									)}
								</button>
							)}
						</div>
					</div>

					<div
						className={cn(
							"flex items-center gap-2 overflow-x-auto pb-1 xl:pb-0 w-full xl:w-auto scrollbar-hide justify-start xl:justify-end transition-all duration-300",
							!isStuck ? "ml-auto" : "",
						)}
					>
						<div className="flex items-center gap-1">
							{TIME_RANGES.map((range) => (
								<button
									key={range}
									onClick={() =>
										!isRangeDisabled(range) && handleRangeChange(range)
									}
									disabled={isRangeDisabled(range)}
									className={cn(
										"px-1.5 md:px-2.5 py-1.5 rounded-lg text-[10px]",
										isRangeDisabled(range)
											? "opacity-30 cursor-not-allowed text-slate-600"
											: activeRange === range
												? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
												: "text-slate-400 hover:text-slate-200",
									)}
								>
									{range}
								</button>
							))}
						</div>
						<div className="hidden md:block w-px h-5 bg-slate-700/50 mx-1" />
						<div className="shrink-0">
							<DatePickerWithRange
								from={fromDate}
								to={toDate}
								onSelect={handleDateRangeSelect}
							/>
						</div>
					</div>
				</div>
			</div>

			{/* WYKRESY */}
			<div className="relative">
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
					<div className="h-[400px] w-full mt-4">
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
