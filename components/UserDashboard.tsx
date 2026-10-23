"use client";

import {
	Activity,
	Banknote,
	Calendar,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Globe,
	LineChart,
	Loader2,
	Maximize2,
	Minimize2,
	RefreshCw,
	Settings,
	WalletCards,
} from "lucide-react";
import { SimulatedSnapshot, useDashboardData } from "./ui/useDashboardData";
import { cn, getStockLogo } from "@/lib/utils";
import { differenceInMinutes, format } from "date-fns";
import { formatCurrency, getCurrencySymbol } from "@/lib/utils/format-currency";
import { useEffect, useMemo, useState } from "react";

import { AbsoluteDailyPnLChart } from "./dashboard/AbsoluteDailyPnLChart";
import { DatePickerWithRange } from "./shared/DatePickerWithRange";
import { FilterBadge } from "./shared/FilterBadge";
import { GlobalDashboardHeader } from "./dashboard/GlobalDashboardHeader";
import { PortfolioBenchmarkChart } from "./dashboard/PortfolioBenchmarkChart";
import { PortfolioChart } from "./dashboard/PortfolioCharts";
import { PortfolioWithAssets } from "@/lib/types";
import { PortfoliosComparisonChart } from "./dashboard/PortfoliosComparisonChart";
import { PremiumMarketCard } from "./home/PremiumMarketCard";
import { SafeActionButton } from "./ui/SafeActionButton";
import { SectionLayout } from "./shared/SectionLayout";
import { pl } from "date-fns/locale";
import { refreshPortfolioPrices } from "@/lib/actions/refresh-prices";
import { toast } from "sonner";
import { useChartContext } from "./providers/ChartProvider";

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
	role?: string;
}

export function UserDashboard(props: UserDashboardProps) {
	const { currency, convertPLN } = useChartContext();
	const currencySymbol = getCurrencySymbol(currency);

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
	const [portfolioPage, setPortfolioPage] = useState(0);
	const [itemsPerPage, setItemsPerPage] = useState(3);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const isPremium = props.role === "ADMIN" || props.role === "SUBSCRIBER";
	const [isMobileTimeOpen, setIsMobileTimeOpen] = useState(false);
	const [visibleAssetsCount, setVisibleAssetsCount] = useState(6);

	const handleGlobalRefresh = async () => {
		setIsRefreshing(true);
		let successCount = 0;
		try {
			for (const portfolio of props.portfolios) {
				const result = await refreshPortfolioPrices(portfolio.id);
				if (result.success) successCount++;
			}
			if (successCount > 0) {
				toast.success("Zaktualizowano kursy dla wszystkich portfeli.");
				if (!isPremium) {
					toast.info(
						"Pamiętaj: Aktualizacja na koncie darmowym działa raz na 24h.",
					);
				}
			} else {
				toast.error("Wykorzystano dzienny limit lub wystąpił błąd.");
			}
		} catch (error) {
			toast.error("Wystąpił problem z połączeniem.");
		} finally {
			setIsRefreshing(false);
		}
	};

	useEffect(() => {
		const handleResize = () => {
			setItemsPerPage(window.innerWidth >= 1028 ? 6 : 3);
		};
		handleResize();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	const allPortfolioOptions = useMemo(() => {
		return [
			{ id: "ALL", name: "Wszystkie" },
			...props.portfolios.map((p) => ({ id: p.id, name: p.name })),
		];
	}, [props.portfolios]);

	const totalPages = Math.ceil(allPortfolioOptions.length / itemsPerPage);
	const safePortfolioPage =
		totalPages > 0 ? Math.min(portfolioPage, totalPages - 1) : 0;
	const visiblePortfolios = allPortfolioOptions.slice(
		safePortfolioPage * itemsPerPage,
		(safePortfolioPage + 1) * itemsPerPage,
	);

	const isRateLimited =
		!isPremium && props.lastUpdated
			? differenceInMinutes(new Date(), new Date(props.lastUpdated)) < 6 * 60
			: false;

	let tooltipText = "Odśwież wyceny";
	if (isPremium) tooltipText += " (Brak limitu)";
	else if (isRateLimited) tooltipText += " (Dostępne za kilka godzin)";
	else tooltipText += " (Limit: 1x na 6h)";

	return (
		<div className="space-y-8">
			<GlobalDashboardHeader
				portfolios={props.portfolios}
				selectedIds={selectedIds}
				togglePortfolio={togglePortfolio}
				totalCurrent={totalCurrent}
				totalInvested={totalInvested}
				totalPnL={totalPnL}
				totalPnLPct={totalPnLPct}
			/>

			<SectionLayout
				title="Radar Rynkowy"
				titleIcon={Activity}
				subtitle="Śledź kluczowe wskaźniki"
				description="Zestawienie indeksów i walorów z Twojego portfela."
				action={
					<div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 w-full sm:w-auto">
						{props.lastUpdated && (
							<span className="text-[9px] text-t-text-tertiary font-bold tracking-widest uppercase mb-1 sm:mb-0 mr-1">
								Stan z:{" "}
								{format(new Date(props.lastUpdated), "HH:mm, dd MMM", {
									locale: pl,
								})}
							</span>
						)}

						<div className="flex items-center gap-2 w-full sm:w-auto">
							<button
								onClick={handleGlobalRefresh}
								disabled={isRefreshing || isRateLimited}
								title={tooltipText}
								className={cn(
									"flex-1 sm:flex-none flex justify-center items-center gap-1.5 px-3 h-9 sm:h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 text-[10px] font-bold uppercase tracking-widest transition-colors w-full sm:w-auto",
									(isRefreshing || isRateLimited) &&
										"opacity-50 cursor-not-allowed",
								)}
							>
								<RefreshCw
									className={cn(
										"w-3.5 h-3.5 shrink-0",
										isRefreshing && "animate-spin",
									)}
								/>
								<span className="hidden sm:inline">Odśwież</span>
							</button>

							<SafeActionButton
								label="Konfiguruj"
								icon={Settings}
								variant="outline"
								className="flex-1 sm:flex-none w-full sm:w-auto border-t-border bg-t-bg-base text-t-text-secondary hover:text-t-text-primary"
								href="/settings?from=dashboard"
							/>
						</div>
					</div>
				}
			>
				<div className="flex flex-col gap-4 lg:gap-6">
					{props.userIndices && props.userIndices.length > 0 && (
						<div className="flex-1 rounded-2xl ">
							<div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
								{props.userIndices.map((indexId) => {
									const changeValue = props.indexQuotes?.[indexId] || 0;
									const historyObject =
										props.indexQuotesHistory?.[indexId] || {};
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
					<div className="flex-1">
						<div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
							{observedAssets.length > 0 ? (
								observedAssets
									.slice(0, visibleAssetsCount)
									.map((asset) => (
										<PremiumMarketCard
											key={asset.id}
											name={asset.name}
											ticker={asset.ticker}
											change={asset.dailyChange || 0}
											logo={getStockLogo(asset.ticker ?? "")}
										/>
									))
							) : (
								<div className="col-span-full flex flex-col items-center justify-center py-8 px-4 text-center border border-dashed rounded-xl border-t-border bg-t-bg-base/50">
									<p className="text-xs font-bold text-t-text-secondary mb-1">
										Brak aktywów na radarze
									</p>
									<p className="text-[10px] text-t-text-tertiary mb-3">
										Wybierz walory, które chcesz na bieżąco śledzić.
									</p>
									<SafeActionButton
										label="Wybierz Aktywa"
										icon={Settings}
										variant="outline"
										className="h-9 text-[10px] border-t-border bg-t-bg-base text-t-text-secondary hover:text-t-text-primary"
										href="/settings"
									/>
								</div>
							)}
						</div>

						{observedAssets.length > 6 && (
							<div className="flex justify-center mt-4 pt-3 border-t border-t-border-subtle">
								{visibleAssetsCount < observedAssets.length ? (
									<button
										onClick={() => setVisibleAssetsCount((prev) => prev + 6)}
										className="px-4 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 border border-t-border text-t-text-secondary hover:text-t-text-primary text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm"
									>
										Pokaż więcej ({observedAssets.length - visibleAssetsCount}{" "}
										kolejnych)
									</button>
								) : (
									<button
										onClick={() => setVisibleAssetsCount(6)}
										className="px-4 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 border border-t-border text-t-text-tertiary hover:text-t-text-primary text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm"
									>
										Zwiń listę
									</button>
								)}
							</div>
						)}
					</div>
				</div>
			</SectionLayout>

			<div className="sticky top-0 z-40 -mx-3 md:-mx-10 px-3 md:px-10 py-2 md:py-3 bg-t-bg-base/90 backdrop-blur-md border-y border-t-border shadow-sm transition-all rounded-b-2xl duration-300">
				<div className="flex flex-col gap-1.5 max-w-7xl mx-auto w-full">
					{showAdvancedToolbar && (
						<div className="flex flex-row items-center justify-between gap-1 w-full animate-in fade-in slide-in-from-top-1  mb-2">
							<div className="flex flex-col xs:flex-row items-center gap-1.5 shrink-0">
								<span className="text-[10px] font-bold text-t-text-tertiary uppercase tracking-widest hidden sm:block">
									Zaznaczone:
								</span>
								<div className="flex items-baseline gap-0.5 sm:gap-1">
									<span className="text-xs sm:text-sm font-black text-t-text-primary tracking-tight">
										{formatCurrency(convertPLN(totalCurrent))}
									</span>
									<span className="text-[8px] sm:text-[9px] text-t-text-secondary font-bold hidden xs:inline-block">
										{currencySymbol}
									</span>
								</div>
								<div
									className={cn(
										"px-1 py-0.5 rounded text-[9px] font-black transition-colors",
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

							<div className="flex items-center justify-end min-w-0">
								{totalPages > 1 && (
									<button
										onClick={() => setPortfolioPage(safePortfolioPage - 1)}
										disabled={safePortfolioPage === 0}
										className={cn(
											"shrink-0 p-0.5 rounded-full transition-all",
											safePortfolioPage === 0
												? "opacity-30 cursor-not-allowed text-t-text-tertiary"
												: "text-t-text-secondary hover:text-t-text-primary",
										)}
									>
										<ChevronLeft className="w-3.5 h-3.5" />
									</button>
								)}

								<div className="flex flex-wrap items-center gap-0.5 overflow-hidden">
									{visiblePortfolios.map((opt) => (
										<FilterBadge
											key={opt.id}
											id={opt.id}
											label={opt.name}
											isSelected={selectedIds.includes(opt.id)}
											onToggle={togglePortfolio}
											className={cn(
												"py-0.5 px-1.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest rounded-md transition-all border shrink-0",
												selectedIds.includes(opt.id)
													? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
													: "bg-transparent text-t-text-secondary border-transparent hover:border-t-border-subtle",
											)}
										/>
									))}
								</div>

								{totalPages > 1 && (
									<button
										onClick={() => setPortfolioPage(safePortfolioPage + 1)}
										disabled={safePortfolioPage === totalPages - 1}
										className={cn(
											"shrink-0 p-0.5 rounded-full transition-all",
											safePortfolioPage === totalPages - 1
												? "opacity-30 cursor-not-allowed text-t-text-tertiary"
												: "text-t-text-secondary hover:text-t-text-primary",
										)}
									>
										<ChevronRight className="w-3.5 h-3.5" />
									</button>
								)}
							</div>
						</div>
					)}

					<div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 w-full">
						<div className="flex flex-row items-center justify-between sm:justify-start gap-1.5 w-full sm:w-auto shrink-0">
							<div className="flex items-center gap-1.5 flex-1 sm:flex-none">
								<FilterBadge
									id="VALUE"
									label={currencySymbol}
									isSelected={chartMode === "VALUE"}
									onToggle={() => setChartMode("VALUE")}
									className={cn(
										"py-1 px-2 flex-1 sm:flex-none flex justify-center text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all border",
										chartMode === "VALUE"
											? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 shadow-sm"
											: "bg-transparent text-t-text-secondary border-t-border hover:border-t-border-subtle",
									)}
								/>
								<FilterBadge
									id="PERCENTAGE"
									label="%"
									isSelected={chartMode === "PERCENTAGE"}
									onToggle={() => setChartMode("PERCENTAGE")}
									className={cn(
										"py-1 px-2 flex-1 sm:flex-none flex justify-center text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all border",
										chartMode === "PERCENTAGE"
											? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 shadow-sm"
											: "bg-transparent text-t-text-secondary border-t-border hover:border-t-border-subtle",
									)}
								/>
							</div>
							<div className="w-px h-5 bg-t-border mx-1 hidden sm:block" />
							<div className="flex items-center gap-1.5 flex-1 sm:flex-none">
								<FilterBadge
									id="REAL"
									label="Real"
									isSelected={dataMode === "REAL"}
									onToggle={() => setDataMode("REAL")}
									className={cn(
										"py-1 px-2 flex-1 sm:flex-none flex justify-center text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all border",
										dataMode === "REAL"
											? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 shadow-sm"
											: "bg-transparent text-t-text-secondary border-t-border hover:border-t-border-subtle",
									)}
								/>
								<FilterBadge
									id="SIMULATED"
									label="Sym"
									isSelected={dataMode === "SIMULATED"}
									onToggle={() => setDataMode("SIMULATED")}
									className={cn(
										"py-1 px-2 flex-1 sm:flex-none flex justify-center text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all border",
										dataMode === "SIMULATED"
											? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 shadow-sm"
											: "bg-transparent text-t-text-secondary border-t-border hover:border-t-border-subtle",
									)}
								/>
							</div>
						</div>

						<div className="flex items-center justify-end gap-2 w-full sm:w-auto shrink-0">
							<div className="relative shrink-0">
								<div className="hidden lg:flex items-center gap-1.5">
									{TIME_RANGES.map((range) => (
										<button
											key={range}
											onClick={() =>
												!isRangeDisabled(range) && handleRangeChange(range)
											}
											disabled={isRangeDisabled(range)}
											className={cn(
												"py-1.5 px-2.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all border",
												isRangeDisabled(range)
													? "opacity-30 cursor-not-allowed text-t-text-tertiary border-transparent"
													: activeRange === range
														? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 shadow-sm"
														: "bg-transparent text-t-text-secondary border-t-border hover:border-t-border-subtle",
											)}
										>
											{range}
										</button>
									))}
								</div>
								<div className="lg:hidden">
									<button
										onClick={() => setIsMobileTimeOpen(!isMobileTimeOpen)}
										className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-t-border text-[10px] font-bold uppercase tracking-widest text-t-text-primary shadow-sm hover:border-t-border-subtle bg-t-bg-base"
									>
										<Calendar className="w-3.5 h-3.5 text-blue-500" />
										<span>{activeRange}</span>
										<ChevronDown
											className={cn(
												"w-3.5 h-3.5 transition-transform text-t-text-tertiary",
												isMobileTimeOpen && "rotate-180",
											)}
										/>
									</button>
									{isMobileTimeOpen && (
										<div className="absolute left-0 lg:right-0 top-full mt-1.5 z-50 flex flex-col bg-t-bg-panel border border-t-border rounded-xl shadow-xl p-1.5 min-w-[90px] animate-in fade-in zoom-in-95 duration-200">
											{TIME_RANGES.map((range) => (
												<button
													key={range}
													onClick={() => {
														if (!isRangeDisabled(range)) {
															handleRangeChange(range);
															setIsMobileTimeOpen(false);
														}
													}}
													disabled={isRangeDisabled(range)}
													className={cn(
														"px-3 py-2 text-left rounded-lg text-[10px] font-bold tracking-wide transition-all uppercase",
														isRangeDisabled(range)
															? "opacity-30 cursor-not-allowed text-t-text-tertiary"
															: activeRange === range
																? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
																: "text-t-text-secondary hover:bg-black/5 dark:hover:bg-white/5",
													)}
												>
													{range}
												</button>
											))}
										</div>
									)}
								</div>
							</div>

							<div className="flex-1 sm:flex-none min-w-0">
								<DatePickerWithRange
									from={fromDate}
									to={toDate}
									onSelect={handleDateRangeSelect}
								/>
							</div>

							<button
								onClick={() => setShowAdvancedToolbar(!showAdvancedToolbar)}
								className="px-2 py-1 rounded-lg border border-t-border text-t-text-secondary hover:text-t-text-primary transition-all shrink-0  shadow-sm bg-t-bg-base"
								title={
									showAdvancedToolbar
										? "Zwiń podsumowanie"
										: "Rozwiń podsumowanie"
								}
							>
								{showAdvancedToolbar ? (
									<Minimize2 className="w-4 h-4" />
								) : (
									<Maximize2 className="w-4 h-4" />
								)}
							</button>
						</div>
					</div>
				</div>
			</div>

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
					title="Nominalny Wynik Dzienny"
					titleIcon={Banknote}
					subtitle="Faktyczna kwota wypracowana na rynku"
					description="Wykres przedstawia dokładną kwotę w walucie, o jaką zmieniła się wartość Twoich aktywów danego dnia. Obliczenia ignorują Twoje wpłaty i wypłaty z tego dnia, pokazując czystą skuteczność portfela."
				>
					<div className="h-96 mt-6">
						<AbsoluteDailyPnLChart key={chartMode} data={absoluteChartData} />
					</div>
				</SectionLayout>

				<SectionLayout
					title="Analiza Wykresowa"
					titleIcon={LineChart}
					subtitle="Sprawdź wyniki swoich inwestycji w czasie"
					description="Ten wykres przedstawia zmianę wartości Twoich inwestycji w czasie. Linia przerywana oznacza fizycznie wpłacony kapitał. Możesz płynnie przełączać się między klasycznym widokiem kwotowym, a widokiem procentowym (%), który najlepiej oddaje faktyczną wydajność (stopę zwrotu) Twojego portfela. Punkty na linii wykresu to dokonane w tym czasie transakcje."
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
					title="Wyścig Portfeli"
					titleIcon={WalletCards}
					subtitle="Porównanie Strategii"
					description={`Wykres przedstawiający zestawienie wyników poszczególnych portfeli. Użyj przycisków na górnym pasku, aby przełączyć się między trybem procentowym a wartością w ${currencySymbol}.`}
				>
					<div className="h-96 mt-6">
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
					<div className="h-96 mt-6">
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
