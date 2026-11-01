"use client";

import {
	Activity,
	Banknote,
	ChevronDown,
	Globe,
	Info,
	LineChart,
	RefreshCw,
	Settings,
	TrendingDown,
	TrendingUp,
	WalletCards,
} from "lucide-react";
import { SimulatedSnapshot, useDashboardData } from "./ui/useDashboardData";
import { cn, getStockLogo } from "@/lib/utils";
import { differenceInMinutes, format } from "date-fns";
import { useEffect, useMemo, useState } from "react";

import { AbsoluteDailyPnLChart } from "./dashboard/AbsoluteDailyPnLChart";
import { GlobalDashboardHeader } from "./dashboard/GlobalDashboardHeader";
import { MarketDetailChart } from "./dashboard/MarketDetailChart";
import { PortfolioBenchmarkChart } from "./dashboard/PortfolioBenchmarkChart";
import { PortfolioChart } from "./dashboard/PortfolioChart";
import { PortfolioWithAssets } from "@/lib/types";
import { PortfoliosComparisonChart } from "./dashboard/PortfoliosComparisonChart";
import { PremiumMarketCard } from "./home/PremiumMarketCard";
import { SafeActionButton } from "./ui/SafeActionButton";
import { SectionLayout } from "./shared/SectionLayout";
import { getCurrencySymbol } from "@/lib/utils/format-currency";
import { pl } from "date-fns/locale";
import { refreshPortfolioPrices } from "@/lib/actions/refresh-prices";
import { toast } from "sonner";
import { useChartContext } from "./providers/ChartProvider";

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
	const { currency } = useChartContext();
	const currencySymbol = getCurrencySymbol(currency);

	const {
		dataMode,
		setDataMode,
		chartMode,
		setChartMode,
		selectedIds,
		activeRange,
		togglePortfolio,
		handleRangeChange,
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

	const [itemsPerPage, setItemsPerPage] = useState(3);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const isPremium = props.role === "ADMIN" || props.role === "SUBSCRIBER";
	const [visibleAssetsCount, setVisibleAssetsCount] = useState(6);
	const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null);

	const INDEX_COLORS: Record<string, string> = {
		SP500: "#8b5cf6",
		NASDAQ: "#ec4899",
		WIG20: "#3b82f6",
		DAX: "#06b6d4",
		BTC: "#f59e0b",
		GOLD: "#fbbf24",
	};

	// Taby analityczne
	const [activeChartTab, setActiveChartTab] = useState<
		"PORTFOLIO" | "DAILY_PNL" | "COMPARISON" | "BENCHMARK"
	>("PORTFOLIO");

	const CHART_TABS = [
		{ id: "PORTFOLIO", icon: LineChart, label: "Wartość Kapitału" },
		{ id: "DAILY_PNL", icon: Banknote, label: "Wynik Dzienny" },
		{ id: "COMPARISON", icon: WalletCards, label: "Strategie" },
		{ id: "BENCHMARK", icon: Globe, label: "Rynek" },
	] as const;

	const radarTotal = observedAssets.length;
	const radarAdvancing = observedAssets.filter(
		(a) => (a.dailyChange ?? 0) > 0,
	).length;
	const radarDeclining = observedAssets.filter(
		(a) => (a.dailyChange ?? 0) < 0,
	).length;
	const radarSorted = [...observedAssets].sort(
		(a, b) => (b.dailyChange ?? 0) - (a.dailyChange ?? 0),
	);
	const radarBest = radarSorted[0];
	const radarWorst = radarSorted[radarSorted.length - 1];

	const formatRadarChange = (value: number) =>
		`${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;

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
		const handleResize = () =>
			setItemsPerPage(window.innerWidth >= 1028 ? 6 : 3);
		handleResize();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	const isRateLimited =
		!isPremium && props.lastUpdated
			? differenceInMinutes(new Date(), new Date(props.lastUpdated)) < 6 * 60
			: false;

	const selectedPortfolioNames = useMemo(() => {
		if (selectedIds.includes("ALL") || selectedIds.length === 0)
			return "Wszystkie portfele";
		return props.portfolios
			.filter((p) => selectedIds.includes(p.id))
			.map((p) => p.name)
			.join(", ");
	}, [selectedIds, props.portfolios]);

	const chartSubtitle = `Zakres: ${activeRange} • ${selectedPortfolioNames} • Oś Y przedstawia wynik w ${currencySymbol}`;

	let tooltipText = "Odśwież wyceny";
	if (isPremium) tooltipText += " (Brak limitu)";
	else if (isRateLimited) tooltipText += " (Dostępne za kilka godzin)";
	else tooltipText += " (Limit: 1x na 6h)";

	return (
		<div className="space-y-8 pb-12">
			<GlobalDashboardHeader
				portfolios={props.portfolios}
				selectedIds={selectedIds}
				togglePortfolio={togglePortfolio}
				totalCurrent={totalCurrent}
				totalInvested={totalInvested}
				totalPnL={totalPnL}
				totalPnLPct={totalPnLPct}
			/>

			{/* =========================================
                 RADAR RYNKOWY (Z KARTAMI KLIKALNYMI)       
            ========================================= */}
			<SectionLayout
				title="Radar Rynkowy"
				titleIcon={Activity}
				subtitle="Śledź kluczowe wskaźniki"
				description="Zestawienie indeksów i walorów z Twojego portfela. Kliknij w wybraną kartę, aby otworzyć szczegółowy wykres."
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
									"flex-1 sm:flex-none flex justify-center items-center gap-1.5 px-3 h-9 sm:h-10 rounded-xl sm:rounded-2xl bg-theme-soft text-theme-primary border border-theme-border hover:bg-theme-primary/20 text-[10px] font-bold uppercase tracking-widest transition-colors w-full sm:w-auto shadow-sm",
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
				<div className="flex flex-col gap-5 lg:gap-6">
					{/* ---------- PODSUMOWANIE DNIA ---------- */}
					{radarTotal > 0 && (
						<div className="grid grid-cols-1 sm:grid-cols-3 sm:divide-x divide-y sm:divide-y-0 divide-t-border-subtle rounded-2xl border border-t-border bg-t-bg-panel overflow-hidden">
							<div className="p-3 sm:p-4 flex flex-col gap-2.5">
								<div className="flex items-baseline justify-between gap-2">
									<span className="text-xs font-semibold text-t-text-primary">
										Nastroje w portfelu
									</span>
									<span className="text-[10px] font-medium text-t-text-tertiary num">
										{radarTotal} walorów
									</span>
								</div>
								<div className="flex h-1.5 w-full overflow-hidden opacity-60 rounded-full bg-t-border gap-px">
									{radarAdvancing > 0 && (
										<div
											className="h-full bg-gain transition-all duration-700"
											style={{
												width: `${(radarAdvancing / radarTotal) * 100}%`,
											}}
										/>
									)}
									{radarDeclining > 0 && (
										<div
											className="h-full bg-loss transition-all duration-700"
											style={{
												width: `${(radarDeclining / radarTotal) * 100}%`,
											}}
										/>
									)}
								</div>
								<div className="flex items-center gap-4 text-[11px] font-medium num">
									<span className="flex items-center gap-1.5 text-gain">
										<TrendingUp className="w-3.5 h-3.5" />
										{radarAdvancing} rośnie
									</span>
									<span className="flex items-center gap-1.5 text-loss">
										<TrendingDown className="w-3.5 h-3.5" />
										{radarDeclining} spada
									</span>
								</div>
							</div>
							<div className="p-3 sm:p-4 flex flex-col gap-1">
								<span className="text-xs font-semibold text-t-text-secondary">
									Najmocniejszy dziś
								</span>
								<div className="flex items-baseline justify-between gap-2 min-w-0">
									<span className="text-sm font-semibold text-t-text-primary truncate">
										{radarBest?.ticker ?? radarBest?.name}
									</span>
									<span className="font-mono num text-sm font-semibold text-gain shrink-0">
										{formatRadarChange(radarBest?.dailyChange ?? 0)}
									</span>
								</div>
							</div>
							<div className="p-3 sm:p-4 flex flex-col gap-1">
								<span className="text-xs font-semibold text-t-text-secondary">
									Najsłabszy dziś
								</span>
								<div className="flex items-baseline justify-between gap-2 min-w-0">
									<span className="text-sm font-semibold text-t-text-primary truncate">
										{radarWorst?.ticker ?? radarWorst?.name}
									</span>
									<span
										className={cn(
											"font-mono num text-sm font-semibold shrink-0",
											(radarWorst?.dailyChange ?? 0) < 0
												? "text-loss"
												: "text-gain",
										)}
									>
										{formatRadarChange(radarWorst?.dailyChange ?? 0)}
									</span>
								</div>
							</div>
						</div>
					)}

					{/* ---------- INDEKSY ---------- */}
					{props.userIndices && props.userIndices.length > 0 && (
						<div className="flex flex-col gap-2.5">
							<div className="flex items-center gap-2">
								<h4 className="text-xs font-bold text-t-text-primary">
									Indeksy
								</h4>
								<span className="px-1.5 py-0.5 rounded-md bg-t-bg-sticky border border-t-border-subtle text-[9px] font-bold text-t-text-tertiary num">
									{props.userIndices.length}
								</span>
								<div className="h-px flex-1 bg-t-border-subtle" />
							</div>

							<div className="grid grid-cols-1 xs:grid-cols-2 xl:grid-cols-4 gap-3">
								{props.userIndices.map((indexId) => {
									const changeValue = props.indexQuotes?.[indexId] || 0;
									const historyObject =
										props.indexQuotesHistory?.[indexId] || {};
									const historyArray = Object.keys(historyObject)
										.sort()
										.map((dateKey) => historyObject[dateKey]);
									const isSelected = selectedMarketId === indexId;

									return (
										<button
											key={indexId}
											type="button"
											onClick={() =>
												setSelectedMarketId(isSelected ? null : indexId)
											}
											className={cn(
												"group block w-full text-left rounded-2xl cursor-pointer transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary/60",
												isSelected
													? "ring-2 ring-blue-500 scale-[1.02] shadow-md"
													: "active:scale-[0.98]",
											)}
										>
											<PremiumMarketCard
												variant="index"
												name={GLOBAL_INDICES_MAP[indexId] || indexId}
												change={changeValue}
												historyData={historyArray}
												logo={getStockLogo(indexId)}
											/>
										</button>
									);
								})}
							</div>

							{/* ROZWIJANY WYKRES DLA INDEKSÓW */}
							{selectedMarketId &&
								props.userIndices.includes(selectedMarketId) && (
									<MarketDetailChart
										name={
											GLOBAL_INDICES_MAP[selectedMarketId] || selectedMarketId
										}
										ticker={selectedMarketId}
										color={INDEX_COLORS[selectedMarketId] || "#3b82f6"}
										data={Object.entries(
											props.indexQuotesHistory?.[selectedMarketId] || {},
										)
											.sort(
												([dateA], [dateB]) =>
													new Date(dateA).getTime() - new Date(dateB).getTime(),
											)
											.map(([date, value]) => ({ date, value }))}
										onClose={() => setSelectedMarketId(null)}
									/>
								)}
						</div>
					)}

					{/* ---------- WALORY ---------- */}
					<div className="flex flex-col gap-2.5">
						<div className="flex items-center gap-2">
							<h4 className="text-xs font-bold text-t-text-primary">
								Twoje aktywa
							</h4>
							{radarTotal > 0 && (
								<span className="px-1.5 py-0.5 rounded-md bg-t-bg-sticky border border-t-border-subtle text-[9px] font-bold text-t-text-tertiary num">
									{radarTotal}
								</span>
							)}
							<div className="h-px flex-1 bg-t-border-subtle" />
						</div>

						<div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
							{observedAssets.length > 0 ? (
								observedAssets.slice(0, visibleAssetsCount).map((asset) => {
									const isSelected = selectedMarketId === asset.id;
									return (
										<button
											key={asset.id}
											type="button"
											onClick={() =>
												setSelectedMarketId(isSelected ? null : asset.id)
											}
											className={cn(
												"group block w-full text-left rounded-xl cursor-pointer transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary/60",
												isSelected
													? "ring-2 ring-blue-500 scale-[1.02] shadow-md"
													: "active:scale-[0.98]",
											)}
										>
											<PremiumMarketCard
												variant="asset"
												name={asset.name}
												ticker={asset.ticker}
												change={asset.dailyChange || 0}
												logo={getStockLogo(asset.ticker ?? "")}
											/>
										</button>
									);
								})
							) : (
								<div className="col-span-full flex flex-col items-center justify-center py-10 px-4 text-center border border-dashed rounded-2xl border-t-border bg-t-bg-base/50">
									<div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 border border-t-border-subtle bg-black/5 dark:bg-white/5">
										<Activity className="w-4 h-4 text-t-text-tertiary" />
									</div>
									<p className="text-sm font-bold text-t-text-primary mb-1">
										Brak aktywów na radarze
									</p>
									<p className="text-xs text-t-text-secondary mb-4 max-w-xs">
										Wybierz walory, które chcesz na bieżąco śledzić.
									</p>
									<SafeActionButton
										label="Wybierz aktywa"
										icon={Settings}
										variant="outline"
										className="h-9 text-[10px] border-t-border bg-t-bg-base text-t-text-secondary hover:text-t-text-primary"
										href="/settings"
									/>
								</div>
							)}
						</div>

						{/* ROZWIJANY WYKRES DLA WALORÓW Z PORTFELA */}
						{selectedMarketId &&
							observedAssets.some((a) => a.id === selectedMarketId) &&
							(() => {
								const selectedAsset = observedAssets.find(
									(a) => a.id === selectedMarketId,
								);
								return (
									<MarketDetailChart
										name={selectedAsset?.name || ""}
										ticker={selectedAsset?.ticker || undefined}
										color="#3b82f6" // Możemy dobrać kolory po kategorii, na razie bazowy niebieski
										data={[]} // BRAK DANYCH W BAZIE! Zostawiamy puste, by pokazać ładny błąd
										onClose={() => setSelectedMarketId(null)}
									/>
								);
							})()}

						{observedAssets.length > 6 && (
							<div className="flex justify-center pt-1">
								{visibleAssetsCount < observedAssets.length ? (
									<button
										onClick={() => setVisibleAssetsCount((prev) => prev + 6)}
										className="group flex items-center gap-2 px-4 h-9 rounded-xl bg-t-bg-panel border border-t-border text-t-text-secondary hover:text-t-text-primary hover:border-theme-border text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm"
									>
										Pokaż więcej ({observedAssets.length - visibleAssetsCount}{" "}
										kolejnych)
										<ChevronDown className="w-3.5 h-3.5 transition-transform group-hover:translate-y-0.5" />
									</button>
								) : (
									<button
										onClick={() => setVisibleAssetsCount(6)}
										className="group flex items-center gap-2 px-4 h-9 rounded-xl bg-t-bg-panel border border-t-border text-t-text-tertiary hover:text-t-text-primary hover:border-theme-border text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm"
									>
										Zwiń listę
										<ChevronDown className="w-3.5 h-3.5 rotate-180 transition-transform group-hover:-translate-y-0.5" />
									</button>
								)}
							</div>
						)}
					</div>
				</div>
			</SectionLayout>

			{/* =========================================
				CENTRUM ANALIZY (TAB VIEW)      
			========================================= */}
			<div className="relative space-y-8">
				<SectionLayout
					title="Centrum Analizy"
					titleIcon={LineChart}
					subtitle="Szczegółowe dane o Twoich inwestycjach"
					description="Przełączaj się między modułami analitycznymi za pomocą poniższych ikon, aby zbadać różne aspekty swojego portfela."
				>
					{/* NAWIGACJA Z IKONAMI POŁĄCZONYMI LINIĄ */}
					<div className="relative w-full max-w-3xl mx-auto my-8 md:my-10 px-4 sm:px-12">
						<div className="absolute top-[24px] left-[10%] right-[10%] h-[2px] bg-t-border-subtle z-0" />
						<div className="relative z-10 flex justify-between items-start">
							{CHART_TABS.map((tab) => {
								const isActive = activeChartTab === tab.id;
								return (
									<button
										key={tab.id}
										onClick={() => setActiveChartTab(tab.id)}
										className="group flex flex-col items-center gap-3 w-1/4 outline-none"
									>
										<div
											className={cn(
												"w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300",
												isActive
													? "bg-blue-500 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]"
													: "bg-t-bg-panel border-t-border text-t-text-tertiary group-hover:border-blue-500/50 group-hover:text-blue-400",
											)}
										>
											<tab.icon className="w-5 h-5" />
										</div>
										<div className="flex flex-col items-center text-center">
											<span
												className={cn(
													"text-[11px] sm:text-xs font-bold transition-colors uppercase tracking-wider",
													isActive
														? "text-t-text-primary"
														: "text-t-text-tertiary group-hover:text-t-text-secondary",
												)}
											>
												{tab.label}
											</span>
										</div>
									</button>
								);
							})}
						</div>
					</div>

					{/* KONTENER NA AKTYWNY WYKRES */}
					<div className="mt-8 transition-all duration-300 animate-in fade-in zoom-in-95">
						{activeChartTab === "PORTFOLIO" && (
							<div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-300 w-full">
								<div className="relative h-[600px] w-full flex flex-col bg-t-bg-panel border border-t-border rounded-2xl md:p-4 shadow-sm gap-4">
									<PortfolioChart
										data={portfolioChartData}
										transactions={filteredTransactions}
										mode={chartMode}
										setMode={setChartMode}
										dataMode={dataMode}
										setDataMode={setDataMode}
										activeRange={activeRange}
										onRangeChange={handleRangeChange}
										showBrush={true}
										titleInside="Analiza Wartości Kapitału"
										subtitleInside={chartSubtitle}
										portfolios={props.portfolios}
										onPortfolioToggle={togglePortfolio}
										activeIds={selectedIds}
									/>
								</div>
								{/* 🚀 BANER INFORMACYJNY - PORTFOLIO */}
								<div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 shadow-sm">
									<Info className="w-5 h-5 shrink-0 mt-0.5" />
									<div className="flex flex-col">
										<span className="text-sm font-bold tracking-tight">
											Jak czytać ten wykres?
										</span>
										<span className="text-xs mt-1 leading-relaxed opacity-90 font-medium">
											Wykres prezentuje historyczną wartość kapitału dla
											wybranych portfeli.{" "}
											<strong>W trybie wyceny (PLN/EUR/USD)</strong> widoczne są
											dwie główne linie: zsumowana, całkowita wartość aktywów
											(gruba, falista) oraz wkład własny (przerywana), a odstęp
											między nimi to wygenerowany wynik. Zdarzenia inwestycyjne
											(np. wpłaty i wypłaty) nanoszone są punktowo, by pomóc Ci
											powiązać nagłe skoki portfela z Twoją faktyczną
											aktywnością na koncie.
										</span>
									</div>
								</div>
							</div>
						)}

						{activeChartTab === "DAILY_PNL" && (
							<div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-300 w-full">
								<div className="relative h-[600px] w-full flex flex-col bg-t-bg-panel border border-t-border rounded-2xl md:p-4 shadow-sm gap-4">
									<AbsoluteDailyPnLChart
										key={chartMode}
										data={absoluteChartData}
										portfolios={props.portfolios}
										activeIds={selectedIds}
										onPortfolioToggle={togglePortfolio}
										activeRange={activeRange}
										onRangeChange={handleRangeChange}
										dataMode={dataMode}
										setDataMode={setDataMode}
										isRangeDisabled={isRangeDisabled}
									/>
								</div>{" "}
								{/* 🚀 BANER INFORMACYJNY - DAILY PNL */}
								<div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 shadow-sm">
									<Info className="w-5 h-5 shrink-0 mt-0.5" />
									<div className="flex flex-col">
										<span className="text-sm font-bold tracking-tight">
											Jak czytać ten wykres?
										</span>
										<span className="text-xs mt-1 leading-relaxed opacity-90 font-medium">
											Przedstawia on bezwzględną, codzienną zmianę wartości
											Twoich portfeli ujętą jako słupek wygenerowanego zysku (na
											zielono) lub straty (na czerwono) dla konkretnego dnia na
											rynku. Linia kropek reprezentuje strumień wpłat (Net Cash
											Flow) oddzielony od wyniku wygenerowanego bezpośrednio ze
											wzrostów na giełdzie, abyś dokładnie widział, jak
											wypracowany zysk ma się do kapitału, który zasila konto.
										</span>
									</div>
								</div>
							</div>
						)}

						{activeChartTab === "COMPARISON" && (
							<div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-300 w-full">
								<div className="relative h-[600px] w-full flex flex-col bg-t-bg-panel border border-t-border rounded-2xl md:p-4 shadow-sm gap-4">
									<PortfoliosComparisonChart
										key={`compare-${chartMode}`}
										data={portfoliosComparisonData}
										portfolios={props.portfolios}
										activeIds={selectedIds}
										chartMode={chartMode}
										setChartMode={setChartMode}
										dataMode={dataMode}
										setDataMode={setDataMode}
										activeRange={activeRange}
										onRangeChange={handleRangeChange}
										titleInside="Zbiorczy wykres portfeli"
										subtitleInside={chartSubtitle}
									/>
								</div>{" "}
								{/* 🚀 BANER INFORMACYJNY - COMPARISON */}
								<div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 shadow-sm">
									<Info className="w-5 h-5 shrink-0 mt-0.5" />
									<div className="flex flex-col">
										<span className="text-sm font-bold tracking-tight">
											Jak czytać ten wykres?
										</span>
										<span className="text-xs mt-1 leading-relaxed opacity-90 font-medium">
											To arena walki wszystkich Twoich strategii inwestycyjnych.
											Śledzi zachowanie każdego subportfela niezależnie na
											jednej wspólnej osi, odcinając sumaryczną wartość
											inwestycji. Wykorzystaj ten tryb z przyciskiem procentowym
											(%), by łatwo sprawdzić i porównać stopy zwrotu każdego
											koszyka i zobaczyć, która strategia aktualnie wygrywa z
											pozostałymi w ujęciu procentowym.
										</span>
									</div>
								</div>
							</div>
						)}

						{activeChartTab === "BENCHMARK" && (
							<div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-300 w-full">
								<div className="relative h-[600px] w-full flex flex-col bg-t-bg-panel border border-t-border rounded-2xl md:p-4 shadow-sm gap-4">
									<PortfolioBenchmarkChart
										key={chartMode}
										data={benchmarkChartData}
										portfolios={props.portfolios}
										activeIds={selectedIds}
										chartMode={chartMode}
										setChartMode={setChartMode}
										dataMode={dataMode}
										setDataMode={setDataMode}
										userIndices={props.userIndices || []}
										activeRange={activeRange}
										onRangeChange={handleRangeChange}
										subtitleInside={chartSubtitle}
									/>
								</div>{" "}
								{/* 🚀 BANER INFORMACYJNY - BENCHMARK */}
								<div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 shadow-sm">
									<Info className="w-5 h-5 shrink-0 mt-0.5" />
									<div className="flex flex-col">
										<span className="text-sm font-bold tracking-tight">
											Jak czytać ten wykres?
										</span>
										<span className="text-xs mt-1 leading-relaxed opacity-90 font-medium">
											Wykres symuluje scenariusz, w którym Twój całkowity
											kapitał początkowy (wkład własny) został w całości
											zainwestowany w wybrane rynki referencyjne (np. S&P 500,
											Bitcoin). Przerywane linie pokazują wariant "co by było,
											gdyby", pozwalając łatwo ocenić, czy Twoja aktywna
											strategia przynosi lepsze efekty niż bierne podążanie za
											rynkiem. <strong>Uwaga:</strong> W trybie kwotowym (PLN)
											linie rynków referencyjnych startują od wartości Twojego
											początkowego wkładu własnego w zadanym oknie czasowym,
											podczas gdy linia portfela pokazuje jego pełną rynkową
											wycenę wraz ze wszystkimi bieżącymi wpłatami i wypłatami.
										</span>
									</div>
								</div>
							</div>
						)}
					</div>
				</SectionLayout>
			</div>
		</div>
	);
}
